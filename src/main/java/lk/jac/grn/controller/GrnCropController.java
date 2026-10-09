package lk.jac.grn.controller;

import lk.jac.common.CurrentUserUtil;
import lk.jac.common.ProcessStatus;
import lk.jac.crop.controller.CropQualityCheckController;
import lk.jac.crop.dao.CropPurchaseItemRepository;
import lk.jac.crop.dao.CropPurchaseRepository;
import lk.jac.crop.entity.CropPurchase;
import lk.jac.crop.entity.CropPurchaseItem;
import lk.jac.grn.dao.GrnCropItemRepository;
import lk.jac.grn.dao.GrnCropRepository;
import lk.jac.grn.entity.GrnCrop;
import lk.jac.grn.entity.GrnCropItem;
import lk.jac.payment.controller.ExpensePaymentController;
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
public class GrnCropController  {
    @Autowired
    private GrnCropRepository grnCropDao;

    @Autowired
    private GrnCropItemRepository grnCropItemDao;

    @Autowired
    private CropPurchaseRepository cropPurchaseDao;

    @Autowired
    private CropPurchaseItemRepository cropPurchaseItemDao;

    @Autowired
    private CropQualityCheckController cropQualityCheckController;

    @Autowired
    private ExpensePaymentController expensePaymentController;

    @Autowired
    private PrivilegeRepository privilegeDao;

    @Autowired
    private UserRepository userDao;

    private static final String MODULE_NAME = "GRN_CROP";

    @GetMapping("/grn/grncrop")
    public ModelAndView grnCropPage() {
        ModelAndView grnCropUI = new ModelAndView();
        grnCropUI.setViewName("grncrop.html");
        return grnCropUI;
    }



    // ======== LINKS ========

    @GetMapping(value = "/grn/grncrop/alldata/selected", produces = "application/json")
    public List<GrnCrop> getSelectedGrnCropsData() {

        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canSelect()) {
            return List.of(); // no privilege - return empty list rather than throw
        }

        return grnCropDao.getSelectedGrnCropData();
    }

    @GetMapping(value = "/grn/grncrop/byid/{id}", produces = "application/json")
    public GrnCrop getById(@PathVariable Integer id) {

        return grnCropDao.findByIdWithItems(id);
    }

    @GetMapping(value = "/grn/grncrop/items/bygrn/{grnId}", produces = "application/json")
    public List<GrnCropItem> getItemsByGrn(@PathVariable Integer grnId) {
        return grnCropItemDao.findByGrnCropId(grnId);
    }
    // ======== LINKS ========

    @PutMapping("/grn/grncrop/update")
    @Transactional
    public String updateData(@RequestBody GrnCrop grnCrop) {


        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canUpdate()) {
            return "Access denied: insufficient privilege";
        }


        GrnCrop existing = grnCropDao.findById(grnCrop.getId()).orElse(null);
        if (existing == null) return "GRN not found";

        if (existing.getGrnstatus() == ProcessStatus.Complete ||
                existing.getGrnstatus() == ProcessStatus.Rejected) {
            return "Cannot update a " + existing.getGrnstatus() + " GRN";
        }

        try {
            ProcessStatus previousStatus = existing.getGrnstatus();

            existing.setRecieveddate(grnCrop.getRecieveddate());
            existing.setNote(grnCrop.getNote());
            existing.setGrnstatus(grnCrop.getGrnstatus());
            existing.setUpdateddatetime(LocalDateTime.now());



            if (grnCrop.getGrnCropItems() != null) {
                existing.getGrnCropItems().clear();
                for (GrnCropItem item : grnCrop.getGrnCropItems()) {
                    item.setGrnCrop(existing);
                    existing.getGrnCropItems().add(item);
                }
            }

            // Total price now lives only on the header (GrnCrop.totalprice) —
            // GrnCropItem no longer has its own totalprice field, so this is
            // recalculated from each item's receivedqty x lineprice every
            // time the GRN is saved, and persisted straight onto the header.
            existing.setTotalprice(calculateGrnTotal(existing));

            GrnCrop saved = grnCropDao.save(existing);

            boolean nowQualifies = saved.getGrnstatus() == ProcessStatus.Complete ||
                    saved.getGrnstatus() == ProcessStatus.Partial;
            boolean previouslyQualified = previousStatus == ProcessStatus.Complete ||
                    previousStatus == ProcessStatus.Partial;

            if (nowQualifies && !previouslyQualified) {
                cropQualityCheckController.autoCreateQualityCheckFromGrn(saved);
            }

            // Goods fully received & approved -> auto-create the pending
            // expense payment for the farmer, using this GRN's total price
            // (already persisted on saved.getTotalprice() above).
            if (previousStatus != ProcessStatus.Complete &&
                    saved.getGrnstatus() == ProcessStatus.Complete) {
                expensePaymentController.createPendingExpensePaymentForGrnCrop(
                        saved.getCropPurchase().getFarmer(), saved, saved.getTotalprice());
            }

            return "OK";

        } catch (Exception e) {
            System.err.println("GRN update error: " + e.getMessage());
            e.printStackTrace();
            return "Something went wrong. Please try again";
        }
    }

    // Sums each line item's receivedqty x lineprice. GrnCropItem no longer
    // carries its own totalprice — the header (GrnCrop.totalprice) is now
    // the single source of truth for the GRN's total value.
    private Double calculateGrnTotal(GrnCrop grn) {
        double total = 0.0;
        if (grn.getGrnCropItems() != null) {
            for (GrnCropItem item : grn.getGrnCropItems()) {
                double qty   = item.getReceivedqty() != null ? item.getReceivedqty() : 0.0;
                double price = item.getLineprice()   != null ? item.getLineprice()   : 0.0;
                total += qty * price;
            }
        }
        return total;
    }

    private String generateGrnNumber(LocalDateTime addedAt) {
        int year  = addedAt.getYear();
        int month = addedAt.getMonthValue();

        Integer count = grnCropDao.countByYearAndMonth(year, month);

        String yy  = String.valueOf(year).substring(2);
        String mm  = String.format("%02d", month);
        String seq = String.format("%03d", count != null ? count : 1);

        return "GRN" + yy + mm + seq;
    }


    @Transactional
    public void autoCreateGrnFromPO(CropPurchase cropPurchase) {
        try {
            // Check if GRN already exists for this PO
            GrnCrop existing = grnCropDao.findByCropPurchaseId(cropPurchase.getId());
            if (existing != null) return;

            GrnCrop newGrn = new GrnCrop();
            newGrn.setCropPurchase(cropPurchase);
            newGrn.setGrnstatus(ProcessStatus.Pending);
            newGrn.setAddeddatetime(LocalDateTime.now());
            newGrn.setUpdateddatetime(null);
            newGrn.setTotalprice(0.0); // no line items yet — filled in as they're received

            // Temp user until login module ready
            String username = CurrentUserUtil.getCurrentUsername();
            User currentUser = userDao.findByUsernameAndDeleteddatetimeIsNull(username);
            newGrn.setUser(currentUser);


            // Generate GRN number
            newGrn.setGrncropnumber("TEMP");

            // Save first to get ID
            GrnCrop saved = grnCropDao.save(newGrn);

            // Generate GRN number after save
            // Generate and persist GRN number immediately after first save
            String grnNumber = generateGrnNumber(saved.getAddeddatetime());
            saved.setGrncropnumber(grnNumber);
            grnCropDao.save(saved); // ← save GRN number BEFORE line items

// Now save line items separately
            List<CropPurchaseItem> poItems =
                    cropPurchaseItemDao.findByCropPurchaseId(cropPurchase.getId());

            List<GrnCropItem> lineItems = new ArrayList<>();
            for (CropPurchaseItem poItem : poItems) {
                GrnCropItem lineItem = new GrnCropItem();
                lineItem.setGrnCrop(saved);
                lineItem.setCropPurchaseItem(poItem);
                lineItem.setOrderedqty(poItem.getQuantity());
                lineItem.setReceivedqty(null);
                lineItem.setLineprice(poItem.getUnitprice());
                // No setTotalprice() here anymore — GrnCropItem dropped that
                // field; the header's totalprice is (re)computed on update.
                lineItem.setCondition(null);
                lineItems.add(lineItem);
            }

            grnCropItemDao.saveAll(lineItems);

        } catch (Exception e) {
            System.err.println("Auto-create GRN error: " + e.getMessage());
            e.printStackTrace();
        }
    }
}