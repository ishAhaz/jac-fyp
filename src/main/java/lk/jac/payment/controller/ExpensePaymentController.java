package lk.jac.payment.controller;

import jakarta.transaction.Transactional;
import lk.jac.common.CurrentUserUtil;
import lk.jac.farmer.entity.Farmer;
import lk.jac.grn.entity.GrnCrop;
import lk.jac.grn.entity.GrnIngredients;
import lk.jac.ingredient.entity.Supplier;
import lk.jac.invoice.controller.InvoiceController;
import lk.jac.payment.dao.ExpensePaymentRepository;
import lk.jac.payment.entity.*;
import lk.jac.privilege.checker.PrivilegeChecker;
import lk.jac.privilege.dao.PrivilegeRepository;
import lk.jac.user.dao.UserRepository;
import lk.jac.user.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.ModelAndView;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;

@RestController
public class ExpensePaymentController {

    @Autowired
    private ExpensePaymentRepository expensePaymentDao;

    @Autowired
    private PrivilegeRepository privilegeDao;

    @Autowired
    private UserRepository userDao;

    // ── Auto-generates/updates the linked Invoice + logs a transaction
    //    (InvoiceDetails) whenever a payment is actually recorded below.
    //    Same controller-to-controller autowiring pattern already used
    //    for GrnCropController -> ExpensePaymentController. ──
    @Autowired
    private InvoiceController invoiceController;

    // module name as stored in the "module" table - verify this matches your DB row exactly
    private static final String MODULE_NAME = "EXPENSE_PAYMENT";

    @GetMapping("/payments/expensepaymentlist")
    public ModelAndView expensePaymentPage() {
        ModelAndView expensePaymentUI = new ModelAndView();
        expensePaymentUI.setViewName("expensepayment.html");
        return expensePaymentUI;
    }

    //to invoice
    @GetMapping(value = "/payments/expensepaymentlist/dropdown/selected", produces = "application/json")
    public List<ExpensePayment> getSelectedExpensePaymentDropdown() {
        return expensePaymentDao.findByDeleteddatetimeIsNull();
    }

    @GetMapping(value = "/payments/expensepaymentlist/byid/{expid}", produces = "application/json")
    public ExpensePayment getExpensePaymentById(@PathVariable int expid) {
        return expensePaymentDao.findByIdAndDeleteddatetimeIsNull(expid);
    }

    @GetMapping(value = "/payments/expensepaymentlist/alldata/selected", produces = "application/json")
    public List<ExpensePayment> getSelectedExpensePaymentData() {

        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canSelect()) {
            return List.of(); // no privilege - return empty list rather than throw
        }

        return expensePaymentDao.getSelectedExpensePaymentData();
    }

    //=======crud=======
    //==================
    // NOTE: no saveData()/deleteData() here on purpose — ExpensePayment
    // records are never created or removed by hand. They're only ever
    // spawned (as Pending) by createPendingExpensePaymentForGrnCrop /
    // createPendingExpensePaymentForGrnIngredient below, and the only
    // user action against them is updateData() (fill in paid amount +
    // payment method once the payment is actually made) — which is also
    // the point where the manager's approval auto-generates/updates the
    // linked Invoice, via invoiceController.createOrUpdateInvoiceForExpensePayment().


    @PutMapping("/payments/expensepaymentlist/update")
    public String updateData(@RequestBody ExpensePayment expensePayment) {

        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canUpdate()) {
            return "Access denied: insufficient privilege";
        }

        ExpensePayment extExpensePayment = expensePaymentDao.findByIdAndDeleteddatetimeIsNull(expensePayment.getId());
        if (extExpensePayment == null) {
            return "Expense payment not found";
        }

        // ── Only copy the fields the user is actually allowed to edit ──
        extExpensePayment.setPaidamount(expensePayment.getPaidamount());

        // Bank Transfer
        if (expensePayment.getBankTransfer() != null) {
            BankTransfer bt = expensePayment.getBankTransfer();
            bt.setExpensePayment(extExpensePayment);
            processReceiptImage(bt,
                    extExpensePayment.getBankTransfer() != null ? extExpensePayment.getBankTransfer().getReceiptimage() : null);
            extExpensePayment.setBankTransfer(bt);
            extExpensePayment.setCardPayment(null);
            extExpensePayment.setChequePayment(null);
        } else if (expensePayment.getCardPayment() != null) {
            CardPayment cp = expensePayment.getCardPayment();
            cp.setExpensePayment(extExpensePayment);
            processReceiptImage(cp,
                    extExpensePayment.getCardPayment() != null ? extExpensePayment.getCardPayment().getReceiptimage() : null);
            extExpensePayment.setCardPayment(cp);
            extExpensePayment.setBankTransfer(null);
            extExpensePayment.setChequePayment(null);
        } else if (expensePayment.getChequePayment() != null) {
            ChequePayment chq = expensePayment.getChequePayment();
            chq.setExpensePayment(extExpensePayment);
            processReceiptImage(chq,
                    extExpensePayment.getChequePayment() != null ? extExpensePayment.getChequePayment().getReceiptimage() : null);
            extExpensePayment.setChequePayment(chq);
            extExpensePayment.setBankTransfer(null);
            extExpensePayment.setCardPayment(null);
        } else {
            // Cash
            extExpensePayment.setBankTransfer(null);
            extExpensePayment.setCardPayment(null);
            extExpensePayment.setChequePayment(null);
        }

        try {

            extExpensePayment.setUpdateddatetime(LocalDateTime.now());

            // ── Recalculate payment status from paidamount vs GRN total ──
            Double total = null;
            if (extExpensePayment.getGrnCrop() != null) {
                total = extExpensePayment.getGrnCrop().getTotalprice();
            } else if (extExpensePayment.getGrnIngredients() != null) {
                total = extExpensePayment.getGrnIngredients().getTotalprice();
            }

            Double paid = extExpensePayment.getPaidamount();
            if (total != null && paid != null) {
                if (paid <= 0) {
                    extExpensePayment.setPaymentstatus(PaymentStatus.Unpaid);
                } else if (paid >= total) {
                    extExpensePayment.setPaymentstatus(PaymentStatus.Paid);
                } else {
                    extExpensePayment.setPaymentstatus(PaymentStatus.Partial);
                }
            }
            expensePaymentDao.save(extExpensePayment);

            // ── Manager has now recorded an actual payment against this
            //    GRN — auto-generate the Invoice if this is the first
            //    payment, or update the existing one + log a new
            //    transaction if it isn't. ──
            if (extExpensePayment.getPaidamount() != null && extExpensePayment.getPaidamount() > 0) {
                invoiceController.createOrUpdateInvoiceForExpensePayment(extExpensePayment);
            }

            return "OK";
        } catch (Exception e) {
            System.err.println("Expense payment update error: " + e.getMessage());
            return "Something went wrong. Please try again.";
        }
    }


    //======AUTO-GENERATION======
    //  Called directly from GrnCropController / GrnIngredientsController
    //  when that GRN record's status transitions into Approved (goods
    //  received & approved). totalPrice is the GRN's own total — it is
    //  NOT persisted here (ExpensePayment has no total field to hold it;
    //  it stays derivable from grnCrop/grnIngredients.totalamount, same
    //  as Payment does for compostsale/supermarketOrder), it's accepted
    //  here only so the caller can pass it through for validation/logging.
    //
    //  Requires the paymentstatus field added to ExpensePayment — see
    //  note above the code for the exact field to add.
    //===========================================================
    @Transactional
    public void createPendingExpensePaymentForGrnCrop(Farmer farmer, GrnCrop grnCrop, Double totalPrice) {

        try {
            String username = CurrentUserUtil.getCurrentUsername();
            User currentUser = userDao.findByUsernameAndDeleteddatetimeIsNull(username);

            ExpensePayment expensePayment = new ExpensePayment();
            expensePayment.setPartytype(ExpensePartytype.Farmer);
            expensePayment.setFarmer(farmer);
            expensePayment.setUser(currentUser);
            expensePayment.setGrnCrop(grnCrop);
            expensePayment.setPaidamount(0.0);
            expensePayment.setPaymentstatus(PaymentStatus.Unpaid); // "pending" — see note above; requires the new field
            expensePayment.setAddeddatetime(LocalDateTime.now());
            expensePayment.setUpdateddatetime(LocalDateTime.now());
            expensePayment.setPaymentno("TEMP"); // placeholder — replaced below once saved, same two-step pattern as PurchaseOrderController.saveData()

            ExpensePayment saved = expensePaymentDao.save(expensePayment);

            // Generate expense payment number after save (createddatetime is now settled)
            String expNumber = generateExpenseNumber(saved.getAddeddatetime());
            saved.setPaymentno(expNumber);
            expensePaymentDao.save(saved);

        } catch (Exception e) {
            System.err.println("Auto-create expense payment error: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Transactional
    public void createPendingExpensePaymentForGrnIngredient(Supplier supplier, GrnIngredients grnIngredients, Double totalPrice) {
        try {
            String username = CurrentUserUtil.getCurrentUsername();
            User currentUser = userDao.findByUsernameAndDeleteddatetimeIsNull(username);

            ExpensePayment expensePayment = new ExpensePayment();
            expensePayment.setPartytype(ExpensePartytype.Supplier);
            expensePayment.setSupplier(supplier);
            expensePayment.setUser(currentUser);
            expensePayment.setGrnIngredients(grnIngredients);
            expensePayment.setPaidamount(0.0);
            expensePayment.setPaymentstatus(PaymentStatus.Unpaid); // "pending" — see note above; requires the new field
            expensePayment.setAddeddatetime(LocalDateTime.now());
            expensePayment.setUpdateddatetime(LocalDateTime.now());
            expensePayment.setPaymentno("TEMP"); // placeholder — replaced below once saved, same two-step pattern as PurchaseOrderController.saveData()

            ExpensePayment saved = expensePaymentDao.save(expensePayment);

            // Generate expense payment number after save (createddatetime is now settled)
            String expNumber = generateExpenseNumber(saved.getAddeddatetime());
            saved.setPaymentno(expNumber);
            expensePaymentDao.save(saved);

        } catch (Exception e) {
            System.err.println("Auto-create expense payment error: " + e.getMessage());
            e.printStackTrace();
        }
    }


    //======EXPENSE PAYMENT NUMBER GENERATOR======
    //  Mirrors PurchaseOrderController.generatePONumber() exactly —
    //  same PREFIX+YY+MM+seq scheme used across the app (PO, GRN, etc).
    //
    //  REQUIRES:
    //   1. An `expensePaymentDao.countByYearAndMonth(int year, int month)`
    //      query method on ExpensePaymentRepository, same shape as
    //      PurchaseOrderRepository.countByYearAndMonth(...).
    //   2. A `regno` (String) field + getter/setter on the ExpensePayment
    //      entity, same shape as PurchaseOrder.ponumber.
    //=============================================================
    private String generateExpenseNumber(LocalDateTime createdAt) {
        int year  = createdAt.getYear();
        int month = createdAt.getMonthValue();

        Integer count = expensePaymentDao.countByYearAndMonth(year, month);

        String yy  = String.valueOf(year).substring(2);
        String mm  = String.format("%02d", month);
        String seq = String.format("%04d", count != null ? count : 1);

        return "PAY" + yy + mm + seq;
    }


    //======RECEIPT IMAGE HELPERS======
    //================================

    private byte[] decodeBase64Image(String imageBase64) {
        if (imageBase64 == null || imageBase64.isBlank()) {
            return null;
        }
        String rawData = imageBase64.contains(",")
                ? imageBase64.substring(imageBase64.indexOf(",") + 1)
                : imageBase64;
        return Base64.getDecoder().decode(rawData);
    }

    private void processReceiptImage(BankTransfer bt) {
        if (bt.isImageRemoved()) {
            bt.setReceiptimage(null);
        } else if (bt.getImageBase64() != null && !bt.getImageBase64().isBlank()) {
            bt.setReceiptimage(decodeBase64Image(bt.getImageBase64()));
        }
    }

    private void processReceiptImage(CardPayment cp) {
        if (cp.isImageRemoved()) {
            cp.setReceiptimage(null);
        } else if (cp.getImageBase64() != null && !cp.getImageBase64().isBlank()) {
            cp.setReceiptimage(decodeBase64Image(cp.getImageBase64()));
        }
    }

    private void processReceiptImage(ChequePayment chq) {
        if (chq.isImageRemoved()) {
            chq.setReceiptimage(null);
        } else if (chq.getImageBase64() != null && !chq.getImageBase64().isBlank()) {
            chq.setReceiptimage(decodeBase64Image(chq.getImageBase64()));
        }
    }

    private void processReceiptImage(BankTransfer bt, byte[] existingImage) {
        if (bt.isImageRemoved()) {
            bt.setReceiptimage(null);
        } else if (bt.getImageBase64() != null && !bt.getImageBase64().isBlank()) {
            bt.setReceiptimage(decodeBase64Image(bt.getImageBase64()));
        } else {
            bt.setReceiptimage(existingImage);
        }
    }

    private void processReceiptImage(CardPayment cp, byte[] existingImage) {
        if (cp.isImageRemoved()) {
            cp.setReceiptimage(null);
        } else if (cp.getImageBase64() != null && !cp.getImageBase64().isBlank()) {
            cp.setReceiptimage(decodeBase64Image(cp.getImageBase64()));
        } else {
            cp.setReceiptimage(existingImage);
        }
    }

    private void processReceiptImage(ChequePayment chq, byte[] existingImage) {
        if (chq.isImageRemoved()) {
            chq.setReceiptimage(null);
        } else if (chq.getImageBase64() != null && !chq.getImageBase64().isBlank()) {
            chq.setReceiptimage(decodeBase64Image(chq.getImageBase64()));
        } else {
            chq.setReceiptimage(existingImage);
        }
    }
}