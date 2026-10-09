package lk.jac.payment.controller;

import jakarta.transaction.Transactional;
import lk.jac.common.CurrentUserUtil;
import lk.jac.compost.entity.CompostSale;
import lk.jac.farmer.entity.Farmer;
import lk.jac.invoice.controller.InvoiceController;
import lk.jac.logistics.controller.DeliveryController;
import lk.jac.payment.dao.PaymentRepository;
import lk.jac.payment.entity.*;
import lk.jac.privilege.checker.PrivilegeChecker;
import lk.jac.privilege.dao.PrivilegeRepository;
import lk.jac.supermarket.dao.SupermarketOrderRepository;
import lk.jac.supermarket.entity.Supermarket;
import lk.jac.supermarket.entity.SupermarketOrder;
import lk.jac.user.dao.UserRepository;
import lk.jac.user.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.ModelAndView;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;

@RestController
public class PaymentController {

    @Autowired
    private PaymentRepository paymentDao;

    @Autowired
    private SupermarketOrderRepository supermarketOrderDao;

    @Autowired
    private PrivilegeRepository privilegeDao;

    @Autowired
    private UserRepository userDao;

    // ── Auto-generates/updates the linked Invoice + logs a transaction
    //    (InvoiceDetails) whenever a payment is confirmed via
    //    approvePayment() below. Same controller-to-controller autowiring
    //    pattern already used for ExpensePaymentController -> InvoiceController. ──
    @Autowired
    private InvoiceController invoiceController;

    // ── Auto-generates/updates the linked Delivery record whenever a
    //    payment becomes Partial (updateData) or Paid (approvePayment).
    //    Same controller-to-controller autowiring pattern as invoiceController. ──
    @Autowired
    private DeliveryController deliveryController;

    private static final String MODULE_NAME = "PAYMENT";

    @GetMapping("/payments/paymentlist")
    public ModelAndView paymentPage() {
        ModelAndView paymentUI = new ModelAndView();
        paymentUI.setViewName("payment.html");
        return paymentUI;
    }

    @GetMapping(value = "/payments/paymentlist/dropdown/selected", produces = "application/json")
    public List<Payment> getSelectedPaymentDropdown() {
        return paymentDao.findByDeleteddatetimeIsNull();
    }

    @GetMapping(value = "/payments/paymentlist/byid/{payid}", produces = "application/json")
    public Payment getPaymentById(@PathVariable int payid) {
        return paymentDao.findByIdAndDeleteddatetimeIsNull(payid);
    }

    @GetMapping(value = "/payments/paymentlist/alldata/selected", produces = "application/json")
    public List<Payment> getSelectedPaymentData() {

        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canSelect()) {
            return List.of();
        }

        return paymentDao.getSelectedPaymentData();
    }

    //=======crud=======
    //==================
    // No saveData()/deleteData() — Payment records are only ever spawned
    // (as Unpaid) by createPendingPaymentForCompostSale /
    // createPendingPaymentForSupermarketOrder, triggered when the source
    // order/sale is Confirmed/Approved. The only user actions against an
    // existing record are:
    //   - updateData()    : customer/staff submits payment method + proof
    //   - approvePayment(): manager verifies the submission -> Paid, and
    //                       this is the point that auto-generates/updates
    //                       the linked Invoice via
    //                       invoiceController.createOrUpdateInvoiceForPayment()
    //   - rejectPayment()  : manager sends the submission back for correction


    @PutMapping("/payments/paymentlist/update")
    public String updateData(@RequestBody Payment payment) {

        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canUpdate()) {
            return "Access denied: insufficient privilege";
        }

        Payment extPayment = paymentDao.findByIdAndDeleteddatetimeIsNull(payment.getId());
        if (extPayment == null) {
            return "Payment not found";
        }

        if (extPayment.getPaymentstatus() == PaymentStatus.Paid) {
            return "This payment has already been approved and can no longer be edited.";
        }

        extPayment.setPaymentmethod(payment.getPaymentmethod());
        extPayment.setPaidamount(payment.getPaidamount());

        if (payment.getBankTransfer() != null) {
            BankTransfer bt = payment.getBankTransfer();
            bt.setPayment(extPayment);
            processReceiptImage(bt,
                    extPayment.getBankTransfer() != null ? extPayment.getBankTransfer().getReceiptimage() : null);
            extPayment.setBankTransfer(bt);
            extPayment.setCardPayment(null);
            extPayment.setChequePayment(null);
        } else if (payment.getCardPayment() != null) {
            CardPayment cp = payment.getCardPayment();
            cp.setPayment(extPayment);
            processReceiptImage(cp,
                    extPayment.getCardPayment() != null ? extPayment.getCardPayment().getReceiptimage() : null);
            extPayment.setCardPayment(cp);
            extPayment.setBankTransfer(null);
            extPayment.setChequePayment(null);
        } else if (payment.getChequePayment() != null) {
            ChequePayment chq = payment.getChequePayment();
            chq.setPayment(extPayment);
            processReceiptImage(chq,
                    extPayment.getChequePayment() != null ? extPayment.getChequePayment().getReceiptimage() : null);
            extPayment.setChequePayment(chq);
            extPayment.setBankTransfer(null);
            extPayment.setCardPayment(null);
        } else {
            extPayment.setBankTransfer(null);
            extPayment.setCardPayment(null);
            extPayment.setChequePayment(null);
        }

        Double total = getPaymentTotal(extPayment);
        Double paid  = extPayment.getPaidamount();

        if (total != null && paid != null && paid > total) {
            return "Paid amount cannot exceed the total amount.";
        }

        try {
            // Submitting details never finalizes as Paid — only approvePayment() does.
            extPayment.setPaymentstatus(
                    (paid != null && paid > 0) ? PaymentStatus.Partial : PaymentStatus.Unpaid
            );

            if (payment.getNote() != null) {
                extPayment.setNote(payment.getNote());
            }

            User submittingUser = userDao.findByUsernameAndDeleteddatetimeIsNull(username);
            extPayment.setUser(submittingUser);
            extPayment.setUpdateddatetime(LocalDateTime.now());

            paymentDao.save(extPayment);

            // ── Payment just became Partial (or stayed Unpaid) — the
            //    delivery auto-gen method itself checks status and only
            //    creates/updates a Delivery record for Partial/Paid. ──
            deliveryController.createOrUpdateDeliveryForPayment(extPayment);

            return "OK";
        } catch (Exception e) {
            System.err.println("Payment update error: " + e.getMessage());
            return "Something went wrong. Please try again.";
        }
    }


    //======APPROVE / REJECT======
    //=============================
    // Manager / approve-privilege side: confirm the submitted payment is
    // legitimate and mark the record Paid.
    @PutMapping("/payments/paymentlist/approve/{id}")
    public String approvePayment(@PathVariable int id, @RequestBody Payment payment) {

        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canUpdate()) {
            return "Access denied: insufficient privilege";
        }

        Payment extPayment = paymentDao.findByIdAndDeleteddatetimeIsNull(id);
        if (extPayment == null) {
            return "Payment not found";
        }

        if (extPayment.getPaymentstatus() == PaymentStatus.Paid) {
            return "This payment has already been approved.";
        }

        if (extPayment.getPaymentmethod() == null) {
            return "Nothing has been submitted for this payment yet.";
        }

        try {
            extPayment.setPaymentstatus(PaymentStatus.Paid);

            if (payment.getNote() != null) {
                extPayment.setNote(payment.getNote());
            }

            User approvingUser = userDao.findByUsernameAndDeleteddatetimeIsNull(username);
            extPayment.setUser(approvingUser);
            extPayment.setUpdateddatetime(LocalDateTime.now());

            paymentDao.save(extPayment);

            // ── Manager has now confirmed this payment — auto-generate
            //    the Invoice if this is the first confirmed payment for
            //    this source, or update the existing one + log a new
            //    transaction if it isn't. ──
            if (extPayment.getPaidamount() != null && extPayment.getPaidamount() > 0) {
                invoiceController.createOrUpdateInvoiceForPayment(extPayment);
            }

            // ── Payment is now Paid — create/update the linked Delivery
            //    record too. ──
            deliveryController.createOrUpdateDeliveryForPayment(extPayment);

            return "OK";
        } catch (Exception e) {
            System.err.println("Payment approve error: " + e.getMessage());
            return "Something went wrong. Please try again.";
        }
    }

    // Manager / approve-privilege side: send a submitted payment back for
    // correction. Clears whatever was submitted so the customer/staff
    // side has to resubmit from scratch.
    @PutMapping("/payments/paymentlist/reject/{id}")
    public String rejectPayment(@PathVariable int id, @RequestBody Payment payment) {

        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canUpdate()) {
            return "Access denied: insufficient privilege";
        }

        Payment extPayment = paymentDao.findByIdAndDeleteddatetimeIsNull(id);
        if (extPayment == null) {
            return "Payment not found";
        }

        if (extPayment.getPaymentstatus() == PaymentStatus.Paid) {
            return "This payment has already been approved and cannot be rejected.";
        }

        if (payment.getNote() == null || payment.getNote().isBlank()) {
            return "A note explaining the rejection is required.";
        }

        try {
            extPayment.setPaymentmethod(null);
            extPayment.setPaidamount(0.0);
            extPayment.setPaymentstatus(PaymentStatus.Unpaid);
            extPayment.setBankTransfer(null);
            extPayment.setCardPayment(null);
            extPayment.setChequePayment(null);
            extPayment.setNote(payment.getNote());

            User rejectingUser = userDao.findByUsernameAndDeleteddatetimeIsNull(username);
            extPayment.setUser(rejectingUser);
            extPayment.setUpdateddatetime(LocalDateTime.now());

            paymentDao.save(extPayment);
            return "OK";
        } catch (Exception e) {
            System.err.println("Payment reject error: " + e.getMessage());
            return "Something went wrong. Please try again.";
        }
    }


    //======AUTO-GENERATION======
    @Transactional
    public void createPendingPaymentForCompostSale(Farmer farmer, CompostSale compostSale) {
        try {
            String username = CurrentUserUtil.getCurrentUsername();
            User currentUser = userDao.findByUsernameAndDeleteddatetimeIsNull(username);

            Payment payment = new Payment();
            payment.setFarmer(farmer);
            payment.setCompostsale(compostSale);
            payment.setUser(currentUser);
            payment.setPaidamount(0.0);
            payment.setPaymentstatus(PaymentStatus.Unpaid);
            payment.setPaymentdatetime(LocalDateTime.now());
            payment.setUpdateddatetime(LocalDateTime.now());
            payment.setPaymentno("TEMP");

            Payment saved = paymentDao.save(payment);

            String paymentNumber = generatePaymentNumber(saved.getPaymentdatetime());
            saved.setPaymentno(paymentNumber);
            paymentDao.save(saved);

        } catch (Exception e) {
            System.err.println("Auto-create payment error (compost sale): " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Transactional
    public void createPendingPaymentForSupermarketOrder(Supermarket supermarket, SupermarketOrder supermarketOrder) {
        try {
            String username = CurrentUserUtil.getCurrentUsername();
            User currentUser = userDao.findByUsernameAndDeleteddatetimeIsNull(username);

            Payment payment = new Payment();
            payment.setSupermarket(supermarket);
            payment.setSupermarketOrder(supermarketOrder);
            payment.setUser(currentUser);
            payment.setPaidamount(0.0);
            payment.setPaymentstatus(PaymentStatus.Unpaid);
            payment.setPaymentdatetime(LocalDateTime.now());
            payment.setUpdateddatetime(LocalDateTime.now());
            payment.setPaymentno("TEMP");

            Payment saved = paymentDao.save(payment);

            String paymentNumber = generatePaymentNumber(saved.getPaymentdatetime());
            saved.setPaymentno(paymentNumber);
            paymentDao.save(saved);

        } catch (Exception e) {
            System.err.println("Auto-create payment error (supermarket order): " + e.getMessage());
            e.printStackTrace();
        }
    }


    //======PAYMENT NUMBER GENERATOR======
    private String generatePaymentNumber(LocalDateTime createdAt) {
        int year  = createdAt.getYear();
        int month = createdAt.getMonthValue();

        Integer count = paymentDao.countByYearAndMonth(year, month);

        String yy  = String.valueOf(year).substring(2);
        String mm  = String.format("%02d", month);
        String seq = String.format("%04d", count != null ? count : 1);

        return "PMT" + yy + mm + seq;
    }


    //======TOTAL AMOUNT HELPER======
    private Double getPaymentTotal(Payment payment) {
        if (payment.getCompostsale() != null) return payment.getCompostsale().getTotalamount();
        if (payment.getSupermarketOrder() != null) return payment.getSupermarketOrder().getTotalamount();
        return null;
    }


    //======RECEIPT IMAGE HELPERS======
    private byte[] decodeBase64Image(String imageBase64) {
        if (imageBase64 == null || imageBase64.isBlank()) {
            return null;
        }
        String rawData = imageBase64.contains(",")
                ? imageBase64.substring(imageBase64.indexOf(",") + 1)
                : imageBase64;
        return Base64.getDecoder().decode(rawData);
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