package lk.jac.ingredient.controller;

import jakarta.transaction.Transactional;
import lk.jac.common.CommonController;
import lk.jac.common.CurrentUserUtil;
import lk.jac.common.OrderStatus;
import lk.jac.grn.controller.GrnIngredientsController;
import lk.jac.ingredient.dao.PurchaseOrderItemRepository;
import lk.jac.ingredient.dao.PurchaseOrderRepository;
import lk.jac.ingredient.entity.PurchaseOrder;
import lk.jac.ingredient.entity.PurchaseOrderItem;
import lk.jac.privilege.checker.PrivilegeChecker;
import lk.jac.privilege.dao.PrivilegeRepository;
import lk.jac.user.dao.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.ModelAndView;

import java.time.LocalDateTime;
import java.util.List;

@RestController
public class PurchaseOrderController implements CommonController<PurchaseOrder> {
    @Autowired
    private PurchaseOrderRepository purchaseOrderDao;

    @Autowired
    private PurchaseOrderItemRepository purchaseOrderItemDao;

    @Autowired
    private GrnIngredientsController grnIngredientsController;

    @Autowired
    private PrivilegeRepository privilegeDao;

    @Autowired
    private UserRepository userDao;

    private static final String MODULE_NAME = "INGREDIENT_PURCHASE";


    @GetMapping("/ingredient/purchaseorder")
    public ModelAndView purchaseOrderPage() {
        ModelAndView purhcaseOrderUI = new ModelAndView();
        purhcaseOrderUI.setViewName("purchaseorder.html");
        return purhcaseOrderUI;
    }

    // ======== LINKS ========
    //========================

    @GetMapping(value = "/ingredient/purchaseorder/alldata/selected", produces = "application/json")
    public List<PurchaseOrder> getAll() {
        String username = CurrentUserUtil.getCurrentUsername();
        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canSelect()) {
            return List.of(); // no privilege - return empty list rather than throw
        }

        return purchaseOrderDao.getSelectedPurchaseOrders();
    }

    @GetMapping(value = "/ingredient/purchaseorder/byid/{id}", produces = "application/json")
    public PurchaseOrder getById(@PathVariable Integer id) {

        return purchaseOrderDao.findByIdWithItems(id);
    }

    @GetMapping(value = "/ingredient/purchaseorderitem/bypurchaseorder/{poId}", produces = "application/json")
    public List<PurchaseOrderItem> getItemsByPurchaseOrder(@PathVariable Integer poId) {
        return purchaseOrderItemDao.findByPurchaseOrderId(poId);
    }

    // ======== LINKS ========
    //========================

    @PostMapping("/ingredient/purchaseorder/save")
    @Transactional
    @Override
    public String saveData(@RequestBody PurchaseOrder purchaseOrder) {

        String username = CurrentUserUtil.getCurrentUsername();
        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );
        if (!privilege.canInsert()) {
            return "Access denied: insufficient privilege";
        }

        try {

            purchaseOrder.setCreateddatetime(LocalDateTime.now());
            purchaseOrder.setUpdateddatetime(null);
            purchaseOrder.setPonumber("TEMP");

            // Link each item back to the PO
            if (purchaseOrder.getPurchaseOrderItems() != null) {
                for (PurchaseOrderItem item : purchaseOrder.getPurchaseOrderItems()) {
                    item.setPurchaseOrder(purchaseOrder);
                }
            }

            PurchaseOrder saved = purchaseOrderDao.save(purchaseOrder);

            // Generate PO number after save (ID is now available)
            String poNumber = generatePONumber(saved.getCreateddatetime());
            saved.setPonumber(poNumber);
            purchaseOrderDao.save(saved);

            //  saveData — just check status directly
            if (saved.getPostatus() == OrderStatus.Approved) {
                grnIngredientsController.autoCreateGrnFromPO(saved); // ← use 'saved' not 'purchaseOrder'
            }

            return "OK";

        } catch (Exception e) {
            System.err.println("PurchaseOrder save error: " + e.getMessage());
            return "Something went wrong. Please try again";
        }
    }


    // ======== PO NUMBER GENERATOR ========
    private String generatePONumber(LocalDateTime createdAt) {
        int year  = createdAt.getYear();
        int month = createdAt.getMonthValue();

        Integer count = purchaseOrderDao.countByYearAndMonth(year, month);

        String yy  = String.valueOf(year).substring(2);
        String mm  = String.format("%02d", month);
        String seq = String.format("%03d", count != null ? count : 1);

        return "PO" + yy + mm + seq;
    }


    @PutMapping("/ingredient/purchaseorder/update")
    @Transactional
    @Override
    public String updateData(@RequestBody PurchaseOrder purchaseOrder) {

        String username = CurrentUserUtil.getCurrentUsername();
        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );
        if (!privilege.canUpdate()) {
            return "Access denied: insufficient privilege";
        }

        PurchaseOrder existing = purchaseOrderDao.findByIdAndDeleteddatetimeIsNull(purchaseOrder.getId());
        if (existing == null) return "Purchase Order not found";

        if (existing.getPostatus() == OrderStatus.Cancelled) {
            return "Cannot update a " + existing.getPostatus() + " Purchase Order";
        }

        try {
            //  capture BEFORE any mutation — was being read after setPostatus()
            OrderStatus previousStatus = existing.getPostatus();

            purchaseOrder.setCreateddatetime(existing.getCreateddatetime());
            purchaseOrder.setUpdateddatetime(LocalDateTime.now());
            purchaseOrder.setPonumber(existing.getPonumber());
            purchaseOrder.setUser(existing.getUser());
            purchaseOrder.setDeleteddatetime(existing.getDeleteddatetime());

            existing.getPurchaseOrderItems().clear();
            purchaseOrderDao.save(existing);

            existing.setSupplier(purchaseOrder.getSupplier());
            existing.setExpecteddate(purchaseOrder.getExpecteddate());
            existing.setAmount(purchaseOrder.getAmount());

            existing.setPostatus(purchaseOrder.getPostatus());  // mutation happens here
            existing.setUpdateddatetime(LocalDateTime.now());

            if (purchaseOrder.getPurchaseOrderItems() != null) {
                for (PurchaseOrderItem item : purchaseOrder.getPurchaseOrderItems()) {
                    item.setId(null);
                    item.setPurchaseOrder(existing);
                    existing.getPurchaseOrderItems().add(item);
                }
            }

            PurchaseOrder saved = purchaseOrderDao.save(existing);

            //  previousStatus is now correctly the OLD status, not the new one
            if (purchaseOrder.getPostatus() == OrderStatus.Approved &&
                    previousStatus != OrderStatus.Approved) {
                PurchaseOrder freshPO = purchaseOrderDao.findByIdWithItems(saved.getId());
                grnIngredientsController.autoCreateGrnFromPO(freshPO);
            }

            return "OK";

        } catch (Exception e) {
            System.err.println("PurchaseOrder update error: " + e.getMessage());
            e.printStackTrace();
            return "Something went wrong. Please try again";
        }
    }


    @DeleteMapping("/ingredient/purchaseorder/{id}")
    @Override
    public String deleteData(@PathVariable int id) {

        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canDelete()) {
            return "Access denied: insufficient privilege";
        }

        PurchaseOrder existing = purchaseOrderDao.findByIdAndDeleteddatetimeIsNull(id);
        if (existing == null) return "Purchase Order not found";

        //  also block Cancelled — frontend already hides delete for non-Pending,
        //         backend now enforces the same rule so direct API calls are also protected
        if (existing.getPostatus() == OrderStatus.Cancelled) {
            return "Cannot delete a " + existing.getPostatus() + " Purchase Order";
        }

        try {
            existing.setDeleteddatetime(LocalDateTime.now());
            purchaseOrderDao.save(existing);
            return "OK";
        } catch (Exception e) {
            System.err.println("PurchaseOrder delete error: " + e.getMessage());
            return "Something went wrong. Please try again.";
        }
    }
}
