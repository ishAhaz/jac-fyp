package lk.jac.crop.controller;

import lk.jac.common.CurrentUserUtil;
import lk.jac.common.SuggestionStatus;
import lk.jac.crop.dao.CropQualityCheckItemRepository;
import lk.jac.crop.dao.CropQualityCheckRepository;
import lk.jac.crop.entity.CropQualityCheck;
import lk.jac.crop.entity.CropQualityCheckItem;
import lk.jac.grn.dao.GrnCropItemRepository;
import lk.jac.grn.entity.GrnCrop;
import lk.jac.grn.entity.GrnCropItem;
import lk.jac.privilege.checker.PrivilegeChecker;
import lk.jac.privilege.dao.PrivilegeRepository;
import lk.jac.user.dao.UserRepository;
import lk.jac.user.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.ModelAndView;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@RestController
public class CropQualityCheckController  {

    @Autowired
    private CropQualityCheckRepository cropQualityCheckDao;

    @Autowired
    private GrnCropItemRepository grnCropItemDao;

    @Autowired
    private CropQualityCheckItemRepository cropQualityCheckItemDao;

    @Autowired
    private CropInventoryController cropInventoryController;

    @Autowired
    private UserRepository userDao;

    @Autowired
    private PrivilegeRepository privilegeDao;

    private static final String MODULE_NAME = "CROP_QUALITY";

    @GetMapping("/crop/cropquality")
    public ModelAndView cropQualityCheckPage(){
        ModelAndView cropQualityUI = new ModelAndView();
        cropQualityUI.setViewName("cropqualitycheck.html");
        return cropQualityUI;
    }

    @GetMapping(value = "/crop/cropqualitycheck/alldata/selected", produces = "application/json")
    public List<CropQualityCheck> getAll() {
        String username = CurrentUserUtil.getCurrentUsername();
        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );
        if(!privilege.canSelect()){
            return List.of();
        }
        return cropQualityCheckDao.findAll();
    }

    @GetMapping(value = "/crop/cropqualitycheck/byid/{id}", produces = "application/json")
    public CropQualityCheck getById(@PathVariable Integer id) {
        return cropQualityCheckDao.findByIdWithItems(id);
    }



    @PutMapping("/crop/cropqualitycheck/update")
    @Transactional
    public String updateData(@RequestBody CropQualityCheck cropQualityCheck) {
        String username = CurrentUserUtil.getCurrentUsername();
        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );
        if(!privilege.canUpdate()){
            return "Access denied: insufficient privilege";
        }

        CropQualityCheck existing =
                cropQualityCheckDao.findById(cropQualityCheck.getId()).orElse(null);
        if (existing == null) return "Quality Check not found";

        // Lock — Approved or Rejected is final, protects inventory FK integrity
        if (existing.getQualitystatus() == SuggestionStatus.Approved ||
                existing.getQualitystatus() == SuggestionStatus.Rejected) {
            return "Cannot update a " + existing.getQualitystatus() + " Quality Check";
        }

        try {
            SuggestionStatus previousStatus = existing.getQualitystatus();

            existing.setCheckeddate(cropQualityCheck.getCheckeddate());
            existing.setQualitystatus(cropQualityCheck.getQualitystatus());

            existing.setUpdateddatetime(LocalDateTime.now());

            if (cropQualityCheck.getCropQualityCheckItems() != null) {
                existing.getCropQualityCheckItems().clear();
                for (CropQualityCheckItem item : cropQualityCheck.getCropQualityCheckItems()) {
                    item.setId(null);
                    item.setCropQualityCheck(existing);
                    existing.getCropQualityCheckItems().add(item);
                }
            }

            CropQualityCheck saved = cropQualityCheckDao.save(existing);

            boolean nowApproved = saved.getQualitystatus() == SuggestionStatus.Approved &&
                    previousStatus != SuggestionStatus.Approved;

            if (nowApproved) {
                // Re-fetch with full item→GRN item→PO item→ingredient chain populated,
                // since incoming items only carry minimal {id} references
                CropQualityCheck freshCheck = cropQualityCheckDao.findByIdWithItems(saved.getId());
               cropInventoryController.createInventoryFromQualityCheck(freshCheck);
            }

            return "OK";

        } catch (Exception e) {
            System.err.println("Quality check update error: " + e.getMessage());
            e.printStackTrace();
            return "Something went wrong. Please try again";
        }
    }


    private String generateCheckNumber(LocalDateTime addedAt) {
        int year  = addedAt.getYear();
        int month = addedAt.getMonthValue();

        Integer count = cropQualityCheckDao.countByYearAndMonth(year, month);

        String yy  = String.valueOf(year).substring(2);
        String mm  = String.format("%02d", month);
        String seq = String.format("%03d", count != null ? count : 1);

        return "QCC" + yy + mm + seq;
    }


    // public so GrnCropsController can call it.
    @Transactional
    public void autoCreateQualityCheckFromGrn(GrnCrop grnCrop) {
        try {
            CropQualityCheck existing =
                    cropQualityCheckDao.findByGrnCropsId(grnCrop.getId());
            if (existing != null) return;

            CropQualityCheck newQualityCheck = new CropQualityCheck();
            newQualityCheck.setGrncrop(grnCrop);
            newQualityCheck.setQualitystatus(SuggestionStatus.Pending);
            newQualityCheck.setCreateddatetime(LocalDateTime.now());
            newQualityCheck.setUpdateddatetime(null);

            String username = CurrentUserUtil.getCurrentUsername();
            User currentUser = userDao.findByUsernameAndDeleteddatetimeIsNull(username);
            newQualityCheck.setUser(currentUser);


            newQualityCheck.setCheckno("TEMP");
            CropQualityCheck saved = cropQualityCheckDao.save(newQualityCheck);

            String checkNo = generateCheckNumber(saved.getCreateddatetime());
            saved.setCheckno(checkNo);
            cropQualityCheckDao.save(saved);

            // Pre-populate items from the GRN's line items
            List<GrnCropItem> grnCropItems =
                    grnCropItemDao.findByGrnCropId(grnCrop.getId());

            List<CropQualityCheckItem> lineItems = new ArrayList<>();
            for (GrnCropItem grnCropItem : grnCropItems) {
                CropQualityCheckItem lineItem = new CropQualityCheckItem();
                lineItem.setCropQualityCheck(saved);
                lineItem.setGrnItemCrop(grnCropItem);
                lineItem.setQuantity(grnCropItem.getReceivedqty());
                lineItem.setGrade(null);
                lineItem.setNote(null);
                lineItems.add(lineItem);
            }

            cropQualityCheckItemDao.saveAll(lineItems);

        } catch (Exception e) {
            System.err.println("Auto-create quality check error: " + e.getMessage());
            e.printStackTrace();
             }
    }

}
