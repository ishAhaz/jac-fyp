package lk.jac.supermarket.controller;

import lk.jac.common.CommonController;
import lk.jac.common.CurrentUserUtil;
import lk.jac.common.SaleStatus;
import lk.jac.crop.controller.CropInventoryController;
import lk.jac.crop.exception.InsufficientStockException;
import lk.jac.payment.controller.PaymentController;
import lk.jac.payment.dao.PaymentRepository;
import lk.jac.payment.entity.Payment;
import lk.jac.payment.entity.PaymentStatus;
import lk.jac.privilege.checker.PrivilegeChecker;
import lk.jac.privilege.dao.PrivilegeRepository;
import lk.jac.supermarket.dao.SupermarketOrderRepository;
import lk.jac.supermarket.entity.Supermarket; // ASSUMPTION: confirm actual package
import lk.jac.supermarket.entity.SupermarketOrder;
import lk.jac.user.dao.UserRepository;
import lk.jac.user.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.ModelAndView;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
public class SupermarketOrderController implements CommonController<SupermarketOrder> {

    @Autowired
    private SupermarketOrderRepository supermarketOrderDao;

    @Autowired
    private PrivilegeRepository privilegeDao;

    @Autowired
    private UserRepository userDao;

    @Autowired
    private PaymentRepository paymentDao;

    // Cross-controller call, no service layer — same wiring style already
    // used for PO -> GRN -> QC and compost side -> Payment elsewhere.
    @Autowired
    private PaymentController paymentController;

    @Autowired
    private CropInventoryController cropInventoryController;

    private static final String MODULE_NAME = "SUPERMARKET_ORDER";


    @GetMapping("/supermarket/supermarketorder")
    public ModelAndView supermarketOrderPage() {
        ModelAndView supermarketOrderUI = new ModelAndView();
        supermarketOrderUI.setViewName("supermarketorder.html");
        return supermarketOrderUI;
    }

    @GetMapping("/supermarket/mycroporder")
    public ModelAndView myCropOrderPage() {
        ModelAndView myCropOrderUI = new ModelAndView();
        myCropOrderUI.setViewName("/commoncustomer/mycroporder.html");
        return myCropOrderUI;
    }

    //=====links=========
    //===================
    @GetMapping(value = "/supermarket/supermarketorder/alldata/selected", produces = "application/json")
    public List<SupermarketOrder> getSelectedSupermarketOrderData() {
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canSelect()) {
            return List.of();
        }
        return supermarketOrderDao.getSelectedSupermarketOrderData();
    }

    @GetMapping(value = "/supermarket/supermarketorder/byid/{orderid}", produces = "application/json")
    public SupermarketOrder getSupermarketOrderById(@PathVariable("orderid") int orderid) {
        return supermarketOrderDao.findByIdAndDeleteddatetimeIsNull(orderid);
    }

    @GetMapping(value = "/supermarket/supermarketorder/dropdown/selected", produces = "application/json")
    public List<SupermarketOrder> getSelectedSupermarketOrderDropdown() {
        return supermarketOrderDao.findByDeleteddatetimeIsNull();
    }
    //=====links=========
    //===================


    //======CRUD======
    //================
    @PostMapping("/supermarket/supermarketorder/save")
    @Override
    public String saveData(@RequestBody SupermarketOrder supermarketOrder) {
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canInsert()) {
            return "Access denied: insufficient privilege";
        }

        if (supermarketOrder.getSupermarketOrderItems() == null
                || supermarketOrder.getSupermarketOrderItems().isEmpty()) {
            return "At least one order item is required";
        }

        supermarketOrder.getSupermarketOrderItems()
                .forEach(item -> item.setSupermarketOrder(supermarketOrder));

        try {
            supermarketOrder.setAddeddatetime(LocalDateTime.now());
            supermarketOrder.setUpdateddatetime(null);
            supermarketOrder.setNumber("TEMP");

            SupermarketOrder saved = supermarketOrderDao.save(supermarketOrder);

            String stockWarning = null;

            // New order created directly as Confirmed -> reduce crop stock + create payment
            if (saved.getOrderstatus() == SaleStatus.Confirmed) {
                onOrderConfirmed(saved);
                if (saved.getOrderstatus() == SaleStatus.Pending) {
                    stockWarning = "Order saved as Pending: insufficient stock to confirm";
                }
            }

            // Generate order number now that ID/status are settled
            String soNumber = generateRegistrationNo(saved.getAddeddatetime());
            saved.setNumber(soNumber);
            supermarketOrderDao.save(saved);

            return stockWarning != null ? stockWarning : "OK";

        } catch (Exception e) {
            System.err.println("Supermarket order save error: " + e.getMessage());
            return "Something went wrong. Please try again.";
        }
    }

    private String generateRegistrationNo(LocalDateTime createdAt) {

        int year  = createdAt.getYear();
        int month = createdAt.getMonthValue();

        Integer count = supermarketOrderDao.countByYearAndMonth(year, month);

        String yy  = String.valueOf(year).substring(2);
        String mm  = String.format("%02d", month);
        String seq = String.format("%03d", count != null ? count : 1);

        return "PO" + yy + mm + seq;
    }


    @PutMapping("/supermarket/supermarketorder/update")
    @Override
    public String updateData(@RequestBody SupermarketOrder supermarketOrder) {
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canUpdate()) {
            return "Access denied: insufficient privilege";
        }

        SupermarketOrder extOrder = supermarketOrderDao.findByIdAndDeleteddatetimeIsNull(supermarketOrder.getId());
        if (extOrder == null) {
            return "Supermarket order not found";
        }

        if (supermarketOrder.getSupermarketOrderItems() == null
                || supermarketOrder.getSupermarketOrderItems().isEmpty()) {
            return "At least one order item is required";
        }

        // capture BEFORE mutation — needed to detect the Pending -> Confirmed transition
        SaleStatus previousStatus = extOrder.getOrderstatus();

        supermarketOrder.getSupermarketOrderItems()
                .forEach(item -> item.setSupermarketOrder(supermarketOrder));

        try {
            supermarketOrder.setAddeddatetime(extOrder.getAddeddatetime());
            supermarketOrder.setUpdateddatetime(LocalDateTime.now());
            supermarketOrder.setNumber(extOrder.getNumber());

            boolean justConfirmed = previousStatus != SaleStatus.Confirmed
                    && supermarketOrder.getOrderstatus() == SaleStatus.Confirmed;

            SupermarketOrder saved = supermarketOrderDao.save(supermarketOrder);

            // Only trigger the Confirmed hook the FIRST time it transitions into
            // Confirmed — prevents re-reducing stock / re-creating Payment on
            // every subsequent edit of an already-Confirmed order.
            if (justConfirmed) {
                onOrderConfirmed(saved);
                if (saved.getOrderstatus() == SaleStatus.Pending) {
                    return "Order saved as Pending: insufficient stock to confirm";
                }
            }

            return "OK";

        } catch (Exception e) {
            System.err.println("Supermarket order update error: " + e.getMessage());
            return "Something went wrong. Please try again.";
        }
    }


    @DeleteMapping("/supermarket/supermarketorder/{id}")
    @Override
    public String deleteData(@PathVariable int id) {
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canDelete()) {
            return "Access denied: insufficient privilege";
        }

        SupermarketOrder existingOrder = supermarketOrderDao.findByIdAndDeleteddatetimeIsNull(id);
        if (existingOrder == null) {
            return "Supermarket order delete not completed: order not available";
        }

        try {
            existingOrder.setDeleteddatetime(LocalDateTime.now());
            supermarketOrderDao.save(existingOrder);
            return "OK";
        } catch (Exception e) {
            return "Supermarket order delete not completed";
        }
    }
    //======CRUD======
    //================


    //======CONFIRM HOOK======
    //  Fired the moment an order's status FIRST transitions into Confirmed.
    //  1) consume the recipe's required crop stock from inventory
    //  2) spin up an Unpaid Payment record
    //  If stock is insufficient, the order is pushed back to Pending instead.
    //=========================
    private void onOrderConfirmed(SupermarketOrder order) {
        try {
            cropInventoryController.reduceInventoryForSupermarketOrder(order);
            supermarketOrderDao.save(order);

            paymentController.createPendingPaymentForSupermarketOrder(order.getSupermarket(), order);

        } catch (InsufficientStockException e) {
            order.setOrderstatus(SaleStatus.Pending);
            supermarketOrderDao.save(order);
        }
    }


    //======AUTO-RELEASE (unpaid > 1 day)======
    //  Mirrors CompostSaleController's auto-release: any Confirmed
    //  supermarket order older than a day that's still not Paid gets its
    //  reserved crop stock released back to stock and is cancelled.
    //===========================================
    @Scheduled(fixedRate = 15 * 60 * 1000)
    @Transactional
    public void releaseUnpaidConfirmedOrders() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(1);

        List<SupermarketOrder> overdue = supermarketOrderDao
                .findByOrderstatusBeforeAndDeleteddatetimeIsNull(
                        SaleStatus.Confirmed, cutoff
                );

        for (SupermarketOrder order : overdue) {
            try {
                Payment payment = paymentDao.findBySupermarketOrderId(order.getId());
                boolean isPaid = payment != null && payment.getPaymentstatus() == PaymentStatus.Paid;

                if (isPaid) continue;

                cropInventoryController.releaseInventoryForSupermarketOrder(order);

                order.setOrderstatus(SaleStatus.Cancelled);
                order.setUpdateddatetime(LocalDateTime.now());
                supermarketOrderDao.save(order);

            } catch (Exception e) {
                System.err.println("Auto-release error (supermarket order " + order.getId() + "): " + e.getMessage());
            }
        }
    }


    //======SUPERMARKET SELF-SERVICE (My Crop Orders)======
    //  Every endpoint below is scoped to the CURRENTLY LOGGED-IN supermarket.
    //  The supermarket identity is always resolved server-side from the
    //  session/username — never trusted from the request body — same
    //  pattern as CompostSaleController's farmer self-service section.
    //=====================================================

    // ASSUMPTION: resolves the logged-in User's linked Supermarket via
    // UserRepository, mirroring getCurrentFarmer() in CompostSaleController.
    // Confirm the real repository method name (guessed
    // findByUsernameAndDeleteddatetimeIsNull) and that User.getSupermarket()
    // is the correct getter (per the User module's nullable owner-type
    // relations: Employee / Farmer / Supermarket).
    private Supermarket getCurrentSupermarket() {
        String username = CurrentUserUtil.getCurrentUsername();
        User currentUser = userDao.findByUsernameAndDeleteddatetimeIsNull(username);
        return currentUser != null ? currentUser.getSupermarket() : null;
    }

    @GetMapping(value = "/croporder/supermarket/alldata/selected", produces = "application/json")
    public List<SupermarketOrder> getMyCropOrders() {
        Supermarket supermarket = getCurrentSupermarket();
        if (supermarket == null) {
            return List.of();
        }
        // NOTE: needs a matching method added to SupermarketOrderRepository, e.g.:
        // List<SupermarketOrder> findBySupermarketIdAndDeleteddatetimeIsNullOrderByAddeddatetimeDesc(int supermarketId);
        return supermarketOrderDao.findBySupermarketIdAndDeleteddatetimeIsNullOrderByAddeddatetimeDesc(supermarket.getId());
    }

    @GetMapping(value = "/croporder/supermarket/byid/{id}", produces = "application/json")
    public SupermarketOrder getMyCropOrderById(@PathVariable("id") int id) {
        Supermarket supermarket = getCurrentSupermarket();
        SupermarketOrder order = supermarketOrderDao.findByIdAndDeleteddatetimeIsNull(id);

        // Ownership check — a supermarket may only ever open its own order.
        if (supermarket == null || order == null
                || order.getSupermarket() == null
                || order.getSupermarket().getId() != supermarket.getId()) {
            return null;
        }
        return order;
    }

    @PostMapping("/croporder/supermarket/save")
    public String saveMyCropOrder(@RequestBody SupermarketOrder supermarketOrder) {
        Supermarket supermarket = getCurrentSupermarket();
        if (supermarket == null) {
            return "Access denied: no supermarket account linked to this login";
        }

        if (supermarketOrder.getSupermarketOrderItems() == null
                || supermarketOrder.getSupermarketOrderItems().isEmpty()) {
            return "At least one order item is required";
        }

        // Supermarket and status are ALWAYS set server-side, ignoring
        // whatever the client sent for these two fields. A
        // supermarket-placed order can never be created as anything but
        // Pending — staff move it to Confirmed from the admin Supermarket
        // Order Management page, which is what triggers stock reduction +
        // payment creation (onOrderConfirmed).
        supermarketOrder.setSupermarket(supermarket);
        supermarketOrder.setOrderstatus(SaleStatus.Pending);

        supermarketOrder.getSupermarketOrderItems()
                .forEach(item -> item.setSupermarketOrder(supermarketOrder));

        try {
            supermarketOrder.setAddeddatetime(LocalDateTime.now());
            supermarketOrder.setUpdateddatetime(null);
            supermarketOrder.setNumber("TEMP");

            SupermarketOrder saved = supermarketOrderDao.save(supermarketOrder);

            String soNumber = generateRegistrationNo(saved.getAddeddatetime());
            saved.setNumber(soNumber);
            supermarketOrderDao.save(saved);

            return "OK";

        } catch (Exception e) {
            System.err.println("Supermarket self-service order save error: " + e.getMessage());
            return "Something went wrong. Please try again.";
        }
    }

    @GetMapping(value = "/croporder/supermarket/stockcheck", produces = "application/json")
    public Map<String, Object> checkCropStock(@RequestParam int cropId, @RequestParam double qty) {
        // TODO: this is a placeholder, same caveat as the compost side.
        // cropInventoryController tracks stock consumed via
        // reduceInventoryForSupermarketOrder() at Confirm time — it's not
        // confirmed here whether that same source can answer "is there
        // enough crop X on hand right now" for a not-yet-confirmed order.
        // Wire this to the real crop stock source before relying on it.
        Map<String, Object> result = new HashMap<>();
        result.put("available", true);
        result.put("note", "stock check not yet wired to real crop inventory source");
        return result;
    }

    @PostMapping("/croporder/supermarket/paymentslip/{id}")
    public String submitPaymentSlip(
            @PathVariable("id") int id,
            @RequestParam("slip") MultipartFile slip,
            @RequestParam("bankreferencenumber") String bankReferenceNumber) {

        Supermarket supermarket = getCurrentSupermarket();
        SupermarketOrder order = supermarketOrderDao.findByIdAndDeleteddatetimeIsNull(id);

        if (supermarket == null || order == null
                || order.getSupermarket() == null
                || order.getSupermarket().getId() != supermarket.getId()) {
            return "Access denied";
        }

        if (order.getOrderstatus() != SaleStatus.AwaitingPayment) {
            return "This order is not currently awaiting payment";
        }

        if (slip == null || slip.isEmpty()) {
            return "Bank slip / screenshot is required";
        }

        try {
            // TODO: no file storage pattern is visible in this controller.
            // Check how other modules with file uploads (e.g. GRN quality
            // check attachments, if any) persist files and mirror that —
            // saving to disk vs a blob column vs external storage all imply
            // different code here. Placeholder below just records the
            // reference number and flips status; the slip itself is
            // received but not yet persisted anywhere.
            // NOTE: uncomment the two setter calls below once
            // SupermarketOrder is confirmed to have bankreferencenumber /
            // paymentsubmitteddatetime fields (CompostSale needed these
            // added explicitly — verify SupermarketOrder already has them
            // before relying on this).
//          order.setBankreferencenumber(bankReferenceNumber);
//          order.setPaymentsubmitteddatetime(LocalDateTime.now());
            order.setOrderstatus(SaleStatus.PaymentSubmitted);

            supermarketOrderDao.save(order);
            return "OK";

        } catch (Exception e) {
            System.err.println("Payment slip submission error: " + e.getMessage());
            return "Something went wrong. Please try again.";
        }
    }
    //======SUPERMARKET SELF-SERVICE======
    //=====================================
}