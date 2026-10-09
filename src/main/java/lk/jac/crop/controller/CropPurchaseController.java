package lk.jac.crop.controller;

import jakarta.transaction.Transactional;
import lk.jac.common.CommonController;
import lk.jac.common.CurrentUserUtil;
import lk.jac.common.OrderStatus;
import lk.jac.crop.dao.CropPurchaseItemRepository;
import lk.jac.crop.dao.CropPurchaseRepository;
import lk.jac.crop.entity.CropPurchase;
import lk.jac.crop.entity.CropPurchaseItem;
import lk.jac.grn.controller.GrnCropController;
import lk.jac.privilege.checker.PrivilegeChecker;
import lk.jac.privilege.dao.PrivilegeRepository;
import lk.jac.user.dao.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.ModelAndView;

import java.time.LocalDateTime;
import java.util.List;

@RestController
public class CropPurchaseController implements CommonController<CropPurchase> {
    @Autowired
    private CropPurchaseRepository cropPurchaseDao;

    @Autowired
    private CropPurchaseItemRepository cropPurchaseItemDao;

    @Autowired
    private GrnCropController grnCropController;

    @Autowired
    private PrivilegeRepository privilegeDao;

    @Autowired
    private UserRepository userDao;

    // module name as stored in the "module" table - verify this matches your DB row exactly
    private static final String MODULE_NAME = "CROP_PURCHASE";


    @GetMapping("/crop/croppurchase")
    public ModelAndView cropPurchasePage(){
        ModelAndView cropPurchaseUI = new ModelAndView();
        cropPurchaseUI.setViewName("croppurchase.html");
        return cropPurchaseUI;
    }


    // ======== LINKS ========
    //========================

    @GetMapping(value = "/crop/croppurchase/alldata/selected", produces = "application/json")
    public List<CropPurchase> getAll() {
        String username = CurrentUserUtil.getCurrentUsername();
        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username,MODULE_NAME)
        );

        if(!privilege.canSelect()){
            return List.of();
        }
        return cropPurchaseDao.getSelectedCropPurchases();
    }

    @GetMapping(value = "/crop/croppurchase/byid/{id}", produces = "application/json")
    public CropPurchase getById(@PathVariable Integer id) {

        return cropPurchaseDao.findByIdWithItems(id);
    }

    @GetMapping(value = "/crop/croppurchaseitem/bycroppurchase/{poId}", produces = "application/json")
    public List<CropPurchaseItem> getItemsByCropPurchase(@PathVariable Integer poId) {
        return cropPurchaseItemDao.findByCropPurchaseId(poId);
    }

    // ======== LINKS ========
    //========================


    @PostMapping("/crop/croppurchase/save")
    @Transactional
    @Override
    public String saveData(@RequestBody CropPurchase cropPurchase) {

        String username = CurrentUserUtil.getCurrentUsername();
        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username,MODULE_NAME)
        );
        if(!privilege.canInsert()){
            return "Access denied: insufficient privilege";
        }

        try {

            cropPurchase.setPurchasedatetime(LocalDateTime.now());
            cropPurchase.setUpdateddatetime(null);
            cropPurchase.setPonumber("TEMP");
            // Temp user until login module ready
            // Link each item back to the PO
            if (cropPurchase.getCropPurchaseItems() != null) {
                for (CropPurchaseItem item : cropPurchase.getCropPurchaseItems()) {
                    item.setCropPurchase(cropPurchase);
                }
            }

            CropPurchase saved = cropPurchaseDao.save(cropPurchase);

            // Generate PO number after save (ID is now available)
            String poNumber = generatePONumber(saved.getPurchasedatetime());
            saved.setPonumber(poNumber);
            cropPurchaseDao.save(saved);

            //  saveData — just check status directly
            if (saved.getPostatus() == OrderStatus.Approved) {
                grnCropController.autoCreateGrnFromPO(saved); // ← use 'saved' not 'purchaseOrder'
            }

            return "OK";

        } catch (Exception e) {
            System.err.println("Crop Purchase save error: " + e.getMessage());
            return "Something went wrong. Please try again";
        }
    }


    // ======== PO NUMBER GENERATOR ========
    private String generatePONumber(LocalDateTime createdAt) {
        int year  = createdAt.getYear();
        int month = createdAt.getMonthValue();

        Integer count = cropPurchaseDao.countByYearAndMonth(year, month);

        String yy  = String.valueOf(year).substring(2);
        String mm  = String.format("%02d", month);
        String seq = String.format("%03d", count != null ? count : 1);

        return "PO" + yy + mm + seq;
    }


    @PutMapping("/crop/croppurchase/update")
    @Transactional
    @Override
    public String updateData(@RequestBody CropPurchase cropPurchase) {

        String username = CurrentUserUtil.getCurrentUsername();
        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username,MODULE_NAME)
        );
        if(!privilege.canUpdate()){
            return "Access denied: insufficient privilege";
        }

        CropPurchase existing = cropPurchaseDao.findByIdAndDeleteddatetimeIsNull(cropPurchase.getId());
        if (existing == null) return "Purchase Order not found";

        if (existing.getPostatus() == OrderStatus.Cancelled) {
            return "Cannot update a " + existing.getPostatus() + " Crop Purchase";
        }

        try {
            //  capture BEFORE any mutation — was being read after setPostatus()
            OrderStatus previousStatus = existing.getPostatus();

            cropPurchase.setPurchasedatetime(existing.getPurchasedatetime());
            cropPurchase.setUpdateddatetime(LocalDateTime.now());
            cropPurchase.setPonumber(existing.getPonumber());
            cropPurchase.setUser(existing.getUser());
            cropPurchase.setDeleteddatetime(existing.getDeleteddatetime());

            existing.getCropPurchaseItems().clear();
            cropPurchaseDao.save(existing);

            existing.setFarmer(cropPurchase.getFarmer());
            existing.setExpecteddate(cropPurchase.getExpecteddate());
            existing.setTotal(cropPurchase.getTotal());

            existing.setPostatus(cropPurchase.getPostatus());  // mutation happens here
            existing.setUpdateddatetime(LocalDateTime.now());

            if (cropPurchase.getCropPurchaseItems() != null) {
                for (CropPurchaseItem item : cropPurchase.getCropPurchaseItems()) {
                    item.setId(null);
                    item.setCropPurchase(existing);
                    existing.getCropPurchaseItems().add(item);
                }
            }

            CropPurchase saved = cropPurchaseDao.save(existing);

            //  previousStatus is now correctly the OLD status, not the new one
            if (cropPurchase.getPostatus() == OrderStatus.Approved &&
                    previousStatus != OrderStatus.Approved) {
                CropPurchase freshPO = cropPurchaseDao.findByIdWithItems(saved.getId());
                grnCropController.autoCreateGrnFromPO(freshPO);
            }

            return "OK";

        } catch (Exception e) {
            System.err.println("PurchaseOrder update error: " + e.getMessage());
            e.printStackTrace();
            return "Something went wrong. Please try again";
        }
    }


    @DeleteMapping("/crop/croppurchase/{id}")
    @Override
    public String deleteData(@PathVariable int id) {

        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canDelete()) {
            return "Access denied: insufficient privilege";
        }

        CropPurchase existing = cropPurchaseDao.findByIdAndDeleteddatetimeIsNull(id);
        if (existing == null) return "Purchase Order not found";

        //  also block Cancelled — frontend already hides delete for non-Pending,
        //         backend now enforces the same rule so direct API calls are also protected
        if (existing.getPostatus() == OrderStatus.Cancelled) {
            return "Cannot delete a " + existing.getPostatus() + " Purchase Order";
        }

        try {
            existing.setDeleteddatetime(LocalDateTime.now());
            cropPurchaseDao.save(existing);
            return "OK";
        } catch (Exception e) {
            System.err.println("PurchaseOrder delete error: " + e.getMessage());
            return "Something went wrong. Please try again.";
        }
    }
}