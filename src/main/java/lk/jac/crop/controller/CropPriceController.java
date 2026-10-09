package lk.jac.crop.controller;

import lk.jac.common.CurrentUserUtil;
import lk.jac.common.StatusPending;
import lk.jac.crop.dao.CropPriceRepository;
import lk.jac.crop.entity.CropListManagement;
import lk.jac.crop.entity.CropPrice;
import lk.jac.privilege.checker.PrivilegeChecker;
import lk.jac.privilege.dao.PrivilegeRepository;
import lk.jac.user.dao.UserRepository;
import lk.jac.user.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.ModelAndView;

import java.time.LocalDateTime;
import java.util.List;

@RestController
public class CropPriceController  {
    @Autowired
    private CropPriceRepository cropPriceDao;

    @Autowired
    private UserRepository userDao;

    @Autowired
    private PrivilegeRepository privilegeDao;
    private static final String MODULE_NAME = "CROP_PRICE";

    @GetMapping("/crop/cropprice")
    public ModelAndView cropPricePage(){
        ModelAndView cropPriceUI = new ModelAndView();
        cropPriceUI.setViewName("cropprice.html");
        return cropPriceUI;
    }
    //========links========
    //=====================



    @GetMapping(value = "/crop/cropprice/alldata/selected", produces = "application/json")
    public List<CropPrice> getSelectedCropPriceData() {
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if(!privilege.canSelect()){
            return List.of();
        }
        return cropPriceDao.getSelectedCropPriceData();
    }

    @GetMapping(value = "/crop/cropprice/byid/{id}", produces = "application/json")
    public CropPrice getById(@PathVariable Integer id) {
        return cropPriceDao.findById(id).orElse(null);
    }

    // In CropListManagementRepository (or wherever Crop entity lives)
    @GetMapping(value = "/crop/cropprice/active", produces = "application/json")
    public List<CropPrice> getActiveCrops() {
        return cropPriceDao.findByStatus(StatusPending.Active);
    }


    //========links========
    //=====================
    @PutMapping("/crop/cropprice/update")
    public String updateData(@RequestBody CropPrice cropPrice) {
        //privilege
        String username = CurrentUserUtil.getCurrentUsername();
        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username,MODULE_NAME)
        );
        if(!privilege.canUpdate()){
            return "Access denied: insufficient privilege";
        }
        //===========
        CropPrice existing = cropPriceDao.findById(cropPrice.getId()).orElse(null);
        if (existing == null) return "Record not found";

        try {
            existing.setMarkupprice(cropPrice.getMarkupprice());
            existing.setRealprice(cropPrice.getRealprice());
            existing.setSuggestedpriceperkg(cropPrice.getSuggestedpriceperkg());
            existing.setStatus(cropPrice.getStatus());
            existing.setUpdateddatetime(LocalDateTime.now());

            cropPriceDao.save(existing);

            //  if set to Active, deactivate all other records for same crop
            if (cropPrice.getStatus() == StatusPending.Active) {
                cropPriceDao.deactivateOtherRecords(
                        existing.getCrop().getId(),
                        existing.getId(),
                        StatusPending.Inactive
                );
            }

            return "OK";

        } catch (Exception e) {
            System.err.println("Crop Price update error: " + e.getMessage());
            return "Something went wrong. Please try again";
        }
    }

    // ======== AUTO-CREATE called from CropSuggestionPriceController ========
    // Called only when the highest approved price for a crop actually changes.
    // `newHighestPrice` must be the freshly recomputed MAX(farmerprice) for
    // Approved suggestions on this crop — never a value taken from a request
    // payload — so this record always reflects the true current highest.
    public void createOrUpdateCropPrice(CropListManagement crop, Double newHighestPrice) {
        try {
            // Always create a NEW record — history is kept, old ones stay as Inactive
            CropPrice newRecord = new CropPrice();
            newRecord.setCrop(crop);
            newRecord.setSuggestedpriceperkg(newHighestPrice);
            newRecord.setStatus(StatusPending.Pending);
            newRecord.setAddeddatetime(LocalDateTime.now());

            // real logged-in user, replacing the old tempUser.setId(4) placeholder
            String username = CurrentUserUtil.getCurrentUsername();
            User currentUser = userDao.findByUsernameAndDeleteddatetimeIsNull(username);
            newRecord.setUser(currentUser);

            // Generate price ID
            newRecord.setPriceid(generatePriceId(newRecord.getAddeddatetime()));

            cropPriceDao.save(newRecord);

        } catch (Exception e) {
            System.err.println("Auto-create Crop Price error: " + e.getMessage());
        }
    }

    private String generatePriceId(LocalDateTime addedAt) {
        int year  = addedAt.getYear();
        int month = addedAt.getMonthValue();

        Integer count = cropPriceDao.countByYearAndMonth(year, month);

        String yy  = String.valueOf(year).substring(2);
        String mm  = String.format("%02d", month);
        String seq = String.format("%03d", count != null ? count : 1);

        return "CP" + yy + mm + seq;
    }


}