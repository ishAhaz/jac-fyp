package lk.jac.compost.controller;

import lk.jac.common.CommonController;
import lk.jac.common.CurrentUserUtil;
import lk.jac.common.SaleStatus;
import lk.jac.compost.dao.CompostSaleRepository;
import lk.jac.compost.entity.CompostSale;
import lk.jac.farmer.entity.Farmer; // ASSUMPTION: package per CropHasFarmer living under lk.jac.farmer
import lk.jac.ingredient.controller.IngredientInventoryController;
import lk.jac.ingredient.exception.InsufficientStockException;
import lk.jac.payment.controller.PaymentController;
import lk.jac.payment.dao.PaymentRepository;
import lk.jac.payment.entity.Payment;
import lk.jac.payment.entity.PaymentStatus;
import lk.jac.privilege.checker.PrivilegeChecker;
import lk.jac.privilege.dao.PrivilegeRepository;
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
public class CompostSaleController implements CommonController<CompostSale> {

    @Autowired
    private CompostSaleRepository compostSaleDao;

    @Autowired
    private PrivilegeRepository privilegeDao;

    @Autowired
    private UserRepository userDao;

    @Autowired
    private PaymentRepository paymentDao;

    // Cross-controller call, no service layer — same wiring style already
    // used for PO -> GRN -> QC and SupermarketOrder -> Payment elsewhere.
    @Autowired
    private PaymentController paymentController;

    @Autowired
    private IngredientInventoryController ingredientInventoryController;

    private static final String MODULE_NAME = "COMPOST_SALE";


    @GetMapping("/compost/compostsale")
    public ModelAndView compostSalePage(){
        ModelAndView compostSaleUI = new ModelAndView();
        compostSaleUI.setViewName("compostsale.html");
        return compostSaleUI;
    }

    @GetMapping("/compost/mycompostorder")
    public ModelAndView myCompostOrderPage(){
        ModelAndView myCompostOrderUI = new ModelAndView();
        myCompostOrderUI.setViewName("/commoncustomer/mycompostorder.html");
        return myCompostOrderUI;
    }

    //=====links=========
    //===================
    @GetMapping(value = "/compost/compostsale/alldata/selected", produces = "application/json")
    public List<CompostSale> getSelectedCompostSaleData(){
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canSelect()) {
            return List.of();
        }
        return compostSaleDao.getSelectedCompostSaleData();
    }

    @GetMapping(value = "/compost/compostsale/byid/{comsid}", produces = "application/json")
    public CompostSale getCompostSaleById(@PathVariable("comsid") int comsid){
        return compostSaleDao.findByIdAndDeleteddatetimeIsNull(comsid);
    }

    @GetMapping(value = "/compost/compostsale/dropdown/selected", produces = "application/json")
    public List<CompostSale> getSelectedCompostSaleDropdown() {
        return compostSaleDao.findByDeleteddatetimeIsNull();
    }
    //=====links=========
    //===================


    //======CRUD======
    //================
    @PostMapping("/compost/compostsale/save")
    @Override
    public String saveData(@RequestBody CompostSale compostSale) {
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canInsert()) {
            return "Access denied: insufficient privilege";
        }

        if (compostSale.getCompostSaleItems() == null
                || compostSale.getCompostSaleItems().isEmpty()) {
            return "At least one sale item is required";
        }

        compostSale.getCompostSaleItems()
                .forEach(item -> item.setCompostsale(compostSale));

        try {
            compostSale.setAddeddatetime(LocalDateTime.now());
            compostSale.setUpdateddatetime(null);
            compostSale.setCompostsalenumber("TEMP");

            CompostSale saved = compostSaleDao.save(compostSale);

            String stockWarning = null;

            // New sale created directly as Confirmed -> reduce ingredient stock + create payment
            if (saved.getComsalestatus() == SaleStatus.Confirmed) {
                onSaleConfirmed(saved);
                if (saved.getComsalestatus() == SaleStatus.Pending) {
                    stockWarning = "Sale saved as Pending: insufficient stock to confirm";
                }
            }

            // Generate sale number now that ID/status are settled
            String csNumber = generateRegistrationNo(saved.getAddeddatetime());
            saved.setCompostsalenumber(csNumber);
            compostSaleDao.save(saved);

            return stockWarning != null ? stockWarning : "OK";

        } catch (Exception e) {
            System.err.println("Compost sale save error: " + e.getMessage());
            return "Something went wrong. Please try again.";
        }
    }

    private String generateRegistrationNo(LocalDateTime createdAt) {

        int year  = createdAt.getYear();
        int month = createdAt.getMonthValue();

        Integer count = compostSaleDao.countByYearAndMonth(year, month);

        String yy  = String.valueOf(year).substring(2);
        String mm  = String.format("%02d", month);
        String seq = String.format("%03d", count != null ? count : 1);

        return "CS" + yy + mm + seq;
    }


    @PutMapping("/compost/compostsale/update")
    @Override
    public String updateData(@RequestBody CompostSale compostSale) {
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canUpdate()) {
            return "Access denied: insufficient privilege";
        }

        CompostSale extSale = compostSaleDao.findByIdAndDeleteddatetimeIsNull(compostSale.getId());
        if (extSale == null) {
            return "Compost sale not found";
        }

        if (compostSale.getCompostSaleItems() == null
                || compostSale.getCompostSaleItems().isEmpty()) {
            return "At least one sale item is required";
        }

        // capture BEFORE mutation — needed to detect the Pending -> Confirmed transition
        SaleStatus previousStatus = extSale.getComsalestatus();

        compostSale.getCompostSaleItems()
                .forEach(item -> item.setCompostsale(compostSale));

        try {
            compostSale.setAddeddatetime(extSale.getAddeddatetime());
            compostSale.setUpdateddatetime(LocalDateTime.now());
            compostSale.setCompostsalenumber(extSale.getCompostsalenumber());

            boolean justConfirmed = previousStatus != SaleStatus.Confirmed
                    && compostSale.getComsalestatus() == SaleStatus.Confirmed;

            CompostSale saved = compostSaleDao.save(compostSale);

            // Only trigger the Confirmed hook the FIRST time it transitions into
            // Confirmed — prevents re-reducing stock / re-creating Payment on
            // every subsequent edit of an already-Confirmed sale.
            if (justConfirmed) {
                onSaleConfirmed(saved);
                if (saved.getComsalestatus() == SaleStatus.Pending) {
                    return "Sale saved as Pending: insufficient stock to confirm";
                }
            }

            return "OK";

        } catch (Exception e) {
            System.err.println("Compost sale update error: " + e.getMessage());
            return "Something went wrong. Please try again.";
        }
    }


    @DeleteMapping("/compost/compostsale/{id}")
    @Override
    public String deleteData(@PathVariable int id) {
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canDelete()) {
            return "Access denied: insufficient privilege";
        }

        CompostSale existingSale = compostSaleDao.findByIdAndDeleteddatetimeIsNull(id);
        if (existingSale == null) {
            return "Compost sale delete not completed: sale not available";
        }

        try {
            existingSale.setDeleteddatetime(LocalDateTime.now());
            compostSaleDao.save(existingSale);
            return "OK";
        } catch (Exception e) {
            return "Compost sale delete not completed";
        }
    }
    //======CRUD======
    //================


    //======CONFIRM HOOK======
    //  Fired the moment a sale's status FIRST transitions into Confirmed.
    //  1) consume the recipe's required ingredients from inventory (A -> B -> C)
    //  2) stamp confirmeddatetime
    //  3) spin up an Unpaid Payment record
    //  If stock is insufficient, the sale is pushed back to Pending instead.
    //=========================
    private void onSaleConfirmed(CompostSale sale) {
        try {
            ingredientInventoryController.reduceInventoryForCompostSale(sale);
            compostSaleDao.save(sale);

            paymentController.createPendingPaymentForCompostSale(sale.getFarmer(), sale);

        } catch (InsufficientStockException e) {
            sale.setComsalestatus(SaleStatus.Pending);
            compostSaleDao.save(sale);
        }
    }


    //======AUTO-RELEASE (unpaid > 1 day)======
    //  Mirrors SupermarketOrderController's auto-release: any Confirmed
    //  compost sale older than a day that's still not Paid gets its
    //  reserved ingredients released back to stock and is cancelled.
    //===========================================
    @Scheduled(fixedRate = 15 * 60 * 1000)
    @Transactional
    public void releaseUnpaidConfirmedSales() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(1);

        List<CompostSale> overdue = compostSaleDao
                .findByComsalestatusBeforeAndDeleteddatetimeIsNull(
                        SaleStatus.Confirmed, cutoff
                );

        for (CompostSale sale : overdue) {
            try {
                Payment payment = paymentDao.findByCompostsaleId(sale.getId());
                boolean isPaid = payment != null && payment.getPaymentstatus() == PaymentStatus.Paid;

                if (isPaid) continue;

                ingredientInventoryController.releaseInventoryForCompostSale(sale);

                sale.setComsalestatus(SaleStatus.Cancelled);
                sale.setUpdateddatetime(LocalDateTime.now());
                compostSaleDao.save(sale);

            } catch (Exception e) {
                System.err.println("Auto-release error (compost sale " + sale.getId() + "): " + e.getMessage());
            }
        }
    }


    //======FARMER SELF-SERVICE (My Compost Orders)======
    //  Every endpoint below is scoped to the CURRENTLY LOGGED-IN farmer.
    //  The farmer identity is always resolved server-side from the
    //  session/username — never trusted from the request body — so a
    //  farmer can never view, submit against, or pay for another
    //  farmer's order by guessing an id or editing the payload.
    //=====================================================

    // ASSUMPTION: resolves the logged-in User's linked Farmer via
    // UserRepository. Confirm the real repository method name (guessed
    // findByUsernameAndDeleteddatetimeIsNull) and that User.getFarmer()
    // is the correct getter (per the User module's nullable owner-type
    // relations: Employee / Farmer / Supermarket).
    private Farmer getCurrentFarmer() {
        String username = CurrentUserUtil.getCurrentUsername();
        User currentUser = userDao.findByUsernameAndDeleteddatetimeIsNull(username);
        return currentUser != null ? currentUser.getFarmer() : null;
    }

    @GetMapping(value = "/compostorder/farmer/alldata/selected", produces = "application/json")
    public List<CompostSale> getMyCompostOrders() {
        Farmer farmer = getCurrentFarmer();
        if (farmer == null) {
            return List.of();
        }
        // NOTE: needs a matching method added to CompostSaleRepository, e.g.:
        // List<CompostSale> findByFarmerIdAndDeleteddatetimeIsNullOrderByAddeddatetimeDesc(int farmerId);
        return compostSaleDao.findByFarmerIdAndDeleteddatetimeIsNullOrderByAddeddatetimeDesc(farmer.getId());
    }

    @GetMapping(value = "/compostorder/farmer/byid/{id}", produces = "application/json")
    public CompostSale getMyCompostOrderById(@PathVariable("id") int id) {
        Farmer farmer = getCurrentFarmer();
        CompostSale sale = compostSaleDao.findByIdAndDeleteddatetimeIsNull(id);

        // Ownership check — a farmer may only ever open their own order.
        if (farmer == null || sale == null
                || sale.getFarmer() == null
                || sale.getFarmer().getId() != farmer.getId()) {
            return null;
        }
        return sale;
    }

    @PostMapping("/compostorder/farmer/save")
    public String saveMyCompostOrder(@RequestBody CompostSale compostSale) {
        Farmer farmer = getCurrentFarmer();
        if (farmer == null) {
            return "Access denied: no farmer account linked to this login";
        }

        if (compostSale.getCompostSaleItems() == null
                || compostSale.getCompostSaleItems().isEmpty()) {
            return "At least one order item is required";
        }

        // Farmer and status are ALWAYS set server-side, ignoring whatever
        // the client sent for these two fields. A farmer-placed order can
        // never be created as anything but Pending — staff move it to
        // Confirmed from the admin Compost Sale Management page, which is
        // what triggers stock reduction + payment creation (onSaleConfirmed).
        compostSale.setFarmer(farmer);
        compostSale.setComsalestatus(SaleStatus.Pending);

        compostSale.getCompostSaleItems()
                .forEach(item -> item.setCompostsale(compostSale));

        try {
            compostSale.setAddeddatetime(LocalDateTime.now());
            compostSale.setUpdateddatetime(null);
            compostSale.setCompostsalenumber("TEMP");

            CompostSale saved = compostSaleDao.save(compostSale);

            String csNumber = generateRegistrationNo(saved.getAddeddatetime());
            saved.setCompostsalenumber(csNumber);
            compostSaleDao.save(saved);

            return "OK";

        } catch (Exception e) {
            System.err.println("Farmer compost order save error: " + e.getMessage());
            return "Something went wrong. Please try again.";
        }
    }

    @GetMapping(value = "/compostorder/farmer/stockcheck", produces = "application/json")
    public Map<String, Object> checkCompostStock(@RequestParam int compostId, @RequestParam double qty) {
        // TODO: this is a placeholder. ingredientInventoryController tracks
        // ingredient stock consumed via a compost's recipe (see
        // onSaleConfirmed/reduceInventoryForCompostSale) — it does NOT track
        // on-hand quantity of the finished Compost product itself, which is
        // what a farmer buying compost needs checked. Wire this to whatever
        // actually holds finished-compost stock (likely a CompostInventory
        // entity/controller not shown in this file) before relying on it.
        Map<String, Object> result = new HashMap<>();
        result.put("available", true);
        result.put("note", "stock check not yet wired to real compost inventory source");
        return result;
    }

    @PostMapping("/compostorder/farmer/paymentslip/{id}")
    public String submitPaymentSlip(
            @PathVariable("id") int id,
            @RequestParam("slip") MultipartFile slip,
            @RequestParam("bankreferencenumber") String bankReferenceNumber) {

        Farmer farmer = getCurrentFarmer();
        CompostSale sale = compostSaleDao.findByIdAndDeleteddatetimeIsNull(id);

        if (farmer == null || sale == null
                || sale.getFarmer() == null
                || sale.getFarmer().getId() != farmer.getId()) {
            return "Access denied";
        }

        if (sale.getComsalestatus() != SaleStatus.AwaitingPayment) {
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
//          sale.setBankreferencenumber(bankReferenceNumber);
//        sale.setPaymentsubmitteddatetime(LocalDateTime.now());
            sale.setComsalestatus(SaleStatus.PaymentSubmitted);

            compostSaleDao.save(sale);
            return "OK";

        } catch (Exception e) {
            System.err.println("Payment slip submission error: " + e.getMessage());
            return "Something went wrong. Please try again.";
        }
    }
    //======FARMER SELF-SERVICE======
    //================================
}