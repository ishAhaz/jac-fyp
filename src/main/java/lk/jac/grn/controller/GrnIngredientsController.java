package lk.jac.grn.controller;

import lk.jac.common.CurrentUserUtil;
import lk.jac.common.ProcessStatus;
import lk.jac.grn.dao.GrnIngredientsItemRepository;
import lk.jac.grn.dao.GrnIngredientsRepository;
import lk.jac.grn.entity.GrnIngredients;
import lk.jac.grn.entity.GrnIngredientsItem;
import lk.jac.ingredient.controller.IngredientQualityCheckController;
import lk.jac.ingredient.dao.PurchaseOrderItemRepository;
import lk.jac.ingredient.dao.PurchaseOrderRepository;
import lk.jac.ingredient.entity.PurchaseOrder;
import lk.jac.ingredient.entity.PurchaseOrderItem;
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
public class GrnIngredientsController  {

    @Autowired
    private GrnIngredientsRepository grnIngredientsDao;

    @Autowired
    private GrnIngredientsItemRepository grnIngredientsItemDao;

    @Autowired
    private PurchaseOrderRepository purchaseOrderDao;

    @Autowired
    private PurchaseOrderItemRepository purchaseOrderItemDao;

    @Autowired
    private IngredientQualityCheckController ingredientQualityCheckController;

    @Autowired
    private ExpensePaymentController expensePaymentController;


    @Autowired
    private PrivilegeRepository privilegeDao;

    @Autowired
    private UserRepository userDao;

    private static final String MODULE_NAME = "GRN_INGREDIENT";


    // ======== PAGE ========
    @GetMapping("/grn/grningredients")
    public ModelAndView grnIngredientsPage() {
        ModelAndView mv = new ModelAndView();
        mv.setViewName("grningredients.html");
        return mv;
    }

    // ======== LINKS ========

    @GetMapping(value = "/grn/grningredients/alldata/selected", produces = "application/json")
    public List<GrnIngredients> getSelectedGrnIngredientsData() {

        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canSelect()) {
            return List.of(); // no privilege - return empty list rather than throw
        }

        return grnIngredientsDao.getSelectedGrnIngredientsData();
    }

    @GetMapping(value = "/grn/grningredients/byid/{id}", produces = "application/json")
    public GrnIngredients getById(@PathVariable Integer id) {

        return grnIngredientsDao.findByIdWithItems(id);
    }

    @GetMapping(value = "/grn/grningredients/items/bygrn/{grnId}", produces = "application/json")
    public List<GrnIngredientsItem> getItemsByGrn(@PathVariable Integer grnId) {
        return grnIngredientsItemDao.findByGrnIngredientsId(grnId);
    }
    // ======== LINKS ========


    // ======== crud ========

    @PutMapping("/grn/grningredients/update")
    @Transactional
    public String updateData(@RequestBody GrnIngredients grnIngredients) {

        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canUpdate()) {
            return "Access denied: insufficient privilege";
        }


        GrnIngredients existing = grnIngredientsDao.findById(grnIngredients.getId()).orElse(null);
        if (existing == null) return "GRN not found";

        if (existing.getGrnstatus() == ProcessStatus.Complete ||
                existing.getGrnstatus() == ProcessStatus.Rejected) {
            return "Cannot update a " + existing.getGrnstatus() + " GRN";
        }

        try {
            ProcessStatus previousStatus = existing.getGrnstatus();

            existing.setRecieveddate(grnIngredients.getRecieveddate());
            existing.setNote(grnIngredients.getNote());
            existing.setGrnstatus(grnIngredients.getGrnstatus());
            existing.setUpdateddatetime(LocalDateTime.now());



            if (grnIngredients.getGrnIngredientsItems() != null) {
                existing.getGrnIngredientsItems().clear();
                for (GrnIngredientsItem item : grnIngredients.getGrnIngredientsItems()) {
                    item.setGrnIngredients(existing);
                    existing.getGrnIngredientsItems().add(item);
                }
            }

            // Total price now lives only on the header
            // (GrnIngredients.totalprice) — GrnIngredientsItem no longer has
            // its own totalprice field, so this is recalculated from each
            // item's receivedqty x lineprice every time the GRN is saved,
            // and persisted straight onto the header.
            existing.setTotalprice(calculateGrnTotal(existing));

            GrnIngredients saved = grnIngredientsDao.save(existing);

            boolean nowQualifies = saved.getGrnstatus() == ProcessStatus.Complete ||
                    saved.getGrnstatus() == ProcessStatus.Partial;
            boolean previouslyQualified = previousStatus == ProcessStatus.Complete ||
                    previousStatus == ProcessStatus.Partial;

            if (nowQualifies && !previouslyQualified) {
                ingredientQualityCheckController.autoCreateQualityCheckFromGrn(saved);
            }

            // Goods fully received & approved -> auto-create the pending
            // expense payment for the supplier, using this GRN's total
            // price (already persisted on saved.getTotalprice() above).
            if (previousStatus != ProcessStatus.Complete &&
                    saved.getGrnstatus() == ProcessStatus.Complete) {
                expensePaymentController.createPendingExpensePaymentForGrnIngredient(
                        saved.getPurchaseOrder().getSupplier(), saved, saved.getTotalprice());
            }

            return "OK";

        } catch (Exception e) {
            System.err.println("GRN update error: " + e.getMessage());
            e.printStackTrace();
            return "Something went wrong. Please try again";
        }
    }

    // Sums each line item's receivedqty x lineprice. GrnIngredientsItem no
    // longer carries its own totalprice — the header
    // (GrnIngredients.totalprice) is now the single source of truth for
    // the GRN's total value.
    private Double calculateGrnTotal(GrnIngredients grn) {
        double total = 0.0;
        if (grn.getGrnIngredientsItems() != null) {
            for (GrnIngredientsItem item : grn.getGrnIngredientsItems()) {
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

        Integer count = grnIngredientsDao.countByYearAndMonth(year, month);

        String yy  = String.valueOf(year).substring(2);
        String mm  = String.format("%02d", month);
        String seq = String.format("%03d", count != null ? count : 1);

        return "GRN" + yy + mm + seq;
    }


    @Transactional
    public void autoCreateGrnFromPO(PurchaseOrder purchaseOrder) {
        try {
            // Check if GRN already exists for this PO
            GrnIngredients existing = grnIngredientsDao.findByPurchaseOrderId(purchaseOrder.getId());
            if (existing != null) return;

            GrnIngredients newGrn = new GrnIngredients();
            newGrn.setPurchaseOrder(purchaseOrder);
            newGrn.setGrnstatus(ProcessStatus.Pending);
            newGrn.setAddeddatetime(LocalDateTime.now());
            newGrn.setUpdateddatetime(null);
            newGrn.setTotalprice(0.0); // no line items yet — filled in as they're received

            // Temp user until login module ready
            String username = CurrentUserUtil.getCurrentUsername();
            User currentUser = userDao.findByUsernameAndDeleteddatetimeIsNull(username);
            newGrn.setUser(currentUser);
            // Generate GRN number
            newGrn.setGrningredientnumber("TEMP");

            // Save first to get ID
            GrnIngredients saved = grnIngredientsDao.save(newGrn);

            // Generate GRN number after save
            // Generate and persist GRN number immediately after first save
            String grnNumber = generateGrnNumber(saved.getAddeddatetime());
            saved.setGrningredientnumber(grnNumber);
            grnIngredientsDao.save(saved); // ← save GRN number BEFORE line items

// Now save line items separately
            List<PurchaseOrderItem> poItems =
                    purchaseOrderItemDao.findByPurchaseOrderId(purchaseOrder.getId());

            List<GrnIngredientsItem> lineItems = new ArrayList<>();
            for (PurchaseOrderItem poItem : poItems) {
                GrnIngredientsItem lineItem = new GrnIngredientsItem();
                lineItem.setGrnIngredients(saved);
                lineItem.setPurchaseOrderItem(poItem);
                lineItem.setOrderedqty(poItem.getQuantity());
                lineItem.setReceivedqty(null);
                lineItem.setLineprice(poItem.getUnitprice());
                // No setTotalprice() here anymore — GrnIngredientsItem
                // dropped that field; the header's totalprice is
                // (re)computed on update.
                lineItem.setCondition(null);
                lineItems.add(lineItem);
            }

            grnIngredientsItemDao.saveAll(lineItems);

        } catch (Exception e) {
            System.err.println("Auto-create GRN error: " + e.getMessage());
            e.printStackTrace();
        }
    }


}