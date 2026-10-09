package lk.jac.invoice.controller;

import jakarta.transaction.Transactional;
import lk.jac.common.CurrentUserUtil;
import lk.jac.common.InvoiceStatus;
import lk.jac.common.Partytype;
import lk.jac.invoice.dao.InvoiceDetailsRepository;
import lk.jac.invoice.dao.InvoiceRepository;
import lk.jac.invoice.entity.Invoice;
import lk.jac.invoice.entity.InvoiceDetails;
import lk.jac.invoice.entity.SourceType;
import lk.jac.payment.entity.ExpensePartytype;
import lk.jac.payment.entity.ExpensePayment;
import lk.jac.payment.entity.Payment;
import lk.jac.privilege.checker.PrivilegeChecker;
import lk.jac.privilege.dao.PrivilegeRepository;
import lk.jac.user.dao.UserRepository;
import lk.jac.user.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.ModelAndView;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
public class InvoiceController {

    @Autowired
    private InvoiceRepository invoiceDao;

    @Autowired
    private InvoiceDetailsRepository invoiceDetailsDao;

    @Autowired
    private PrivilegeRepository privilegeDao;

    @Autowired
    private UserRepository userDao;

    // module name as stored in the "module" table - verify this matches your DB row exactly
    private static final String MODULE_NAME = "INVOICE";
    public long countUnpaidInvoices() {
        return invoiceDao.countByInvoicestatus(InvoiceStatus.Unpaid);
    }
    // ── Default payment term used when auto-generating an invoice from an
    //    ExpensePayment or Payment. Neither has a due-date/terms field of
    //    its own, so this is a placeholder assumption — change this
    //    constant (or wire it to a real term) once confirmed. ──
    private static final int DEFAULT_DUE_DAYS = 30;

    @GetMapping("/invoice/invoicelist")
    public ModelAndView invoicePage() {
        ModelAndView invoiceUI = new ModelAndView();
        invoiceUI.setViewName("invoice.html");
        return invoiceUI;
    }

    @GetMapping("/invoice/myinvoices")
    public ModelAndView myInvoicesPage() {
        ModelAndView myInvoicesUI = new ModelAndView();
        myInvoicesUI.setViewName("invoice.html");
        return myInvoicesUI;
    }

    @GetMapping(value = "/invoice/invoicelist/dropdown/selected", produces = "application/json")
    public List<Invoice> getSelectedInvoiceDropdown() {
        return invoiceDao.findByDeleteddatetimeIsNull();
    }

    @GetMapping(value = "/invoice/invoicelist/byid/{invid}", produces = "application/json")
    public Invoice getInvoiceById(@PathVariable int invid) {
        return invoiceDao.findByIdAndDeleteddatetimeIsNull(invid);
    }

    @GetMapping(value = "/invoice/invoicelist/alldata/selected", produces = "application/json")
    public List<Invoice> getSelectedInvoiceData() {

        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canSelect()) {
            return List.of(); // no privilege - return empty list rather than throw
        }

        return invoiceDao.getSelectedInvoiceData();
    }

    // ── Transactions (InvoiceDetails) under a given invoice, for the
    //    read-only "Preview" list in the frontend Invoice Detail modal ──
    @GetMapping(value = "/invoice/invoicedetails/alldata/byinvoice/{invoiceId}", produces = "application/json")
    public List<InvoiceDetails> getInvoiceDetailsByInvoice(@PathVariable int invoiceId) {
        return invoiceDetailsDao.findByInvoice_IdOrderByAddeddatetimeAsc(invoiceId);
    }

    //=======crud=======
    //==================
    // NOTE: the invoice module is now VIEW/PRINT-ONLY from the frontend.
    // Invoices are no longer created by hand — saveData() below is kept
    // only in case something else still calls it directly, but the normal
    // path is createOrUpdateInvoiceForExpensePayment() / createOrUpdateInvoiceForPayment()
    // further down, triggered automatically once a manager records/approves
    // a payment. Consider removing saveData() entirely once you've confirmed
    // nothing else uses it.

    @PostMapping("/invoice/invoicelist/save")
    public String saveData(@RequestBody Invoice invoice) {

        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canInsert()) {
            return "Access denied: insufficient privilege";
        }

        //data duplication - one invoice per source record
        String duplicateError = checkDuplicateSource(invoice);
        if (duplicateError != null) {
            return duplicateError;
        }

        try {


            invoice.setAddeddatetime(LocalDateTime.now());
            invoice.setUpdateddatetime(LocalDateTime.now());
            invoice.setInvoicenumber("TEMP");
            applyInvoiceStatus(invoice);

            Invoice saved = invoiceDao.save(invoice);

            String iNumber = generateRegistrationNo(saved.getAddeddatetime());
            saved.setInvoicenumber(iNumber);
            invoiceDao.save(saved);
            return "OK";
        } catch (Exception e) {
            System.err.println("Invoice save error: " + e.getMessage());
            return "Something went wrong. Please try again.";
        }
    }

    private String generateRegistrationNo(LocalDateTime createdAt) {
        int year  = createdAt.getYear();
        int month = createdAt.getMonthValue();

        Integer count = invoiceDao.countByYearAndMonth(year, month);

        String yy  = String.valueOf(year).substring(2);
        String mm  = String.format("%02d", month);
        String seq = String.format("%03d", count != null ? count : 1);

        return "CS" + yy + mm + seq;
    }

    private String checkDuplicateSource(Invoice invoice) {
        if (invoice.getGrnCrop() != null &&
                invoiceDao.findByGrnCropAndDeleteddatetimeIsNull(invoice.getGrnCrop()) != null) {
            return "An invoice already exists for this GRN crop record";
        }
        if (invoice.getGrnIngredients() != null &&
                invoiceDao.findByGrnIngredientsAndDeleteddatetimeIsNull(invoice.getGrnIngredients()) != null) {
            return "An invoice already exists for this GRN ingredient record";
        }
        if (invoice.getCompostsale() != null &&
                invoiceDao.findByCompostsaleAndDeleteddatetimeIsNull(invoice.getCompostsale()) != null) {
            return "An invoice already exists for this compost sale";
        }
        if (invoice.getSupermarketorder() != null &&
                invoiceDao.findBySupermarketorderAndDeleteddatetimeIsNull(invoice.getSupermarketorder()) != null) {
            return "An invoice already exists for this supermarket order";
        }
        return null;
    }

    //  Remaining amount and status are derived, not trusted from the client —
    //  recalculated here from totalamount / paidamount / duedate every time.
    private void applyInvoiceStatus(Invoice invoice) {
        double total = invoice.getTotalamount() != null ? invoice.getTotalamount() : 0;
        double paid = invoice.getPaidamount() != null ? invoice.getPaidamount() : 0;
        double remaining = total - paid;
        invoice.setRemainingamount(remaining);

        if (paid <= 0) {
            invoice.setInvoicestatus(InvoiceStatus.Unpaid);
        } else if (remaining <= 0) {
            invoice.setInvoicestatus(InvoiceStatus.Paid);
        } else {
            invoice.setInvoicestatus(InvoiceStatus.Partial);
        }

        if (remaining > 0 && invoice.getDuedate() != null
                && invoice.getDuedate().isBefore(LocalDate.now())) {
            invoice.setInvoicestatus(InvoiceStatus.Overdue);
        }
    }


    //======AUTO-GENERATION / AUTO-UPDATE FROM EXPENSE PAYMENT (BUY-SIDE)======
    //  Called directly from ExpensePaymentController.updateData() once a
    //  manager records/approves an actual payment against a GRN (crop or
    //  ingredient). Mirrors the createPendingExpensePaymentForGrnCrop /
    //  createPendingExpensePaymentForGrnIngredient controller-to-controller
    //  pattern already used elsewhere in the app.
    //
    //  Behaviour:
    //   - One invoice per GRN source record (crop or ingredient), same
    //     one-invoice-per-source rule as checkDuplicateSource() above.
    //   - First payment against that GRN -> creates the Invoice.
    //   - Any later payment against the same GRN (partial top-ups) ->
    //     updates the existing Invoice's paidamount/status instead of
    //     creating a duplicate.
    //   - Every call also appends one InvoiceDetails row so the frontend
    //     "Transactions" list under the invoice grows with each payment
    //     event — this is what the Preview button on the invoice detail
    //     screen lists one by one. Each row snapshots the INCREMENTAL
    //     amount paid at that event (not the cumulative ExpensePayment
    //     total), since ExpensePayment.paidamount mutates on every
    //     top-up and would otherwise make every past transaction row
    //     silently show today's total.
    //
    //  TODO: if concurrent updates against the same GRN are possible,
    //  consider adding @Lock(LockModeType.PESSIMISTIC_WRITE) on the
    //  findByGrnCrop.../findByGrnIngredients... repository queries, same
    //  as the PO->GRN->QC auto-generation flow does elsewhere.
    //================================================================
    @Transactional
    public void createOrUpdateInvoiceForExpensePayment(ExpensePayment expensePayment) {
        try {
            Invoice invoice = null;

            if (expensePayment.getGrnCrop() != null) {
                invoice = invoiceDao.findByGrnCropAndDeleteddatetimeIsNull(expensePayment.getGrnCrop());
            } else if (expensePayment.getGrnIngredients() != null) {
                invoice = invoiceDao.findByGrnIngredientsAndDeleteddatetimeIsNull(expensePayment.getGrnIngredients());
            }

            double grnTotal = 0;
            if (expensePayment.getGrnCrop() != null && expensePayment.getGrnCrop().getTotalprice() != null) {
                grnTotal = expensePayment.getGrnCrop().getTotalprice();
            } else if (expensePayment.getGrnIngredients() != null && expensePayment.getGrnIngredients().getTotalprice() != null) {
                grnTotal = expensePayment.getGrnIngredients().getTotalprice();
            }

            double paid = expensePayment.getPaidamount() != null ? expensePayment.getPaidamount() : 0;
            double transactionAmount;

            if (invoice == null) {
                invoice = new Invoice();
                invoice.setPartytype(mapExpensePartytype(expensePayment.getPartytype()));
                invoice.setSourcetype(SourceType.GRN);
                invoice.setGrnCrop(expensePayment.getGrnCrop());
                invoice.setGrnIngredients(expensePayment.getGrnIngredients());
                invoice.setIssuedto(getIssuedToName(expensePayment));
                invoice.setUser(expensePayment.getUser());
                invoice.setInvoicenumber(generateRegistrationNo(LocalDateTime.now()));
                invoice.setIssueddate(LocalDateTime.now());
                invoice.setDuedate(LocalDate.now().plusDays(DEFAULT_DUE_DAYS));
                invoice.setTotalamount(grnTotal);
                invoice.setPaidamount(paid);
                invoice.setAddeddatetime(LocalDateTime.now());
                invoice.setUpdateddatetime(LocalDateTime.now());
                applyInvoiceStatus(invoice);
                invoice = invoiceDao.save(invoice);

                // first payment against this GRN — the whole amount is the transaction
                transactionAmount = paid;
            } else {
                double previousPaid = invoice.getPaidamount() != null ? invoice.getPaidamount() : 0;

                invoice.setPaidamount(paid);
                invoice.setUpdateddatetime(LocalDateTime.now());
                applyInvoiceStatus(invoice);
                invoice = invoiceDao.save(invoice);

                // subsequent top-up — only the newly-added portion is this transaction's amount
                transactionAmount = paid - previousPaid;
            }

            InvoiceDetails details = new InvoiceDetails();
            details.setInvoice(invoice);
            details.setExpensePayment(expensePayment);
            details.setAmount(transactionAmount);
            details.setAddeddatetime(LocalDateTime.now());
            details.setUpdateddatetime(LocalDateTime.now());
            invoiceDetailsDao.save(details);

        } catch (Exception e) {
            System.err.println("Auto-create/update invoice for expense payment error: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private String getIssuedToName(ExpensePayment expensePayment) {
        if (expensePayment.getFarmer() != null) {
            return expensePayment.getFarmer().getFullname();
        }
        if (expensePayment.getSupplier() != null) {
            return expensePayment.getSupplier().getContactperson();
        }
        return "-";
    }

    private Partytype mapExpensePartytype(ExpensePartytype ept) {
        if (ept == null) return null;
        if (ept == ExpensePartytype.Farmer) return Partytype.Farmer;
        if (ept == ExpensePartytype.Supplier) return Partytype.Supplier;
        return null;
    }


    //======AUTO-GENERATION / AUTO-UPDATE FROM PAYMENT (SELL-SIDE)======
    //  Called directly from PaymentController.approvePayment() once a
    //  manager confirms a customer/farmer payment against a compost sale
    //  or supermarket order. Mirrors createOrUpdateInvoiceForExpensePayment()
    //  above exactly, on the sell side instead of the buy side.
    //
    //  Triggered from approvePayment() rather than updateData(), unlike
    //  the expense-payment flow — Payment has a genuine submit/approve/
    //  reject cycle (rejectPayment() wipes a submission back to zero),
    //  so an invoice/transaction is only ever recorded once a payment is
    //  actually confirmed and can no longer be rejected or resubmitted.
    //
    //  Behaviour: identical pattern to the expense-payment version — one
    //  invoice per source record (compost sale or supermarket order),
    //  first approval creates it, any later approval against the same
    //  source (if that ever becomes possible) updates paidamount/status
    //  and appends an InvoiceDetails row with the incremental (delta)
    //  amount, not the cumulative total.
    //====================================================================
    @Transactional
    public void createOrUpdateInvoiceForPayment(Payment payment) {
        try {
            Invoice invoice = null;

            if (payment.getCompostsale() != null) {
                invoice = invoiceDao.findByCompostsaleAndDeleteddatetimeIsNull(payment.getCompostsale());
            } else if (payment.getSupermarketOrder() != null) {
                invoice = invoiceDao.findBySupermarketorderAndDeleteddatetimeIsNull(payment.getSupermarketOrder());
            }

            double sourceTotal = 0;
            if (payment.getCompostsale() != null && payment.getCompostsale().getTotalamount() != null) {
                sourceTotal = payment.getCompostsale().getTotalamount();
            } else if (payment.getSupermarketOrder() != null) {
                sourceTotal = payment.getSupermarketOrder().getTotalamount();
            }

            double paid = payment.getPaidamount() != null ? payment.getPaidamount() : 0;
            double transactionAmount;

            if (invoice == null) {
                invoice = new Invoice();
                invoice.setPartytype(mapPaymentPartytype(payment));
                invoice.setSourcetype(SourceType.Order);
                invoice.setCompostsale(payment.getCompostsale());
                invoice.setSupermarketorder(payment.getSupermarketOrder());
                invoice.setIssuedto(getIssuedToName(payment));
                invoice.setUser(payment.getUser());
                invoice.setInvoicenumber(generateRegistrationNo(LocalDateTime.now()));
                invoice.setIssueddate(LocalDateTime.now());
                invoice.setDuedate(LocalDate.now().plusDays(DEFAULT_DUE_DAYS));
                invoice.setTotalamount(sourceTotal);
                invoice.setPaidamount(paid);
                invoice.setAddeddatetime(LocalDateTime.now());
                invoice.setUpdateddatetime(LocalDateTime.now());
                applyInvoiceStatus(invoice);
                invoice = invoiceDao.save(invoice);

                transactionAmount = paid;
            } else {
                double previousPaid = invoice.getPaidamount() != null ? invoice.getPaidamount() : 0;

                invoice.setPaidamount(paid);
                invoice.setUpdateddatetime(LocalDateTime.now());
                applyInvoiceStatus(invoice);
                invoice = invoiceDao.save(invoice);

                transactionAmount = paid - previousPaid;
            }

            InvoiceDetails details = new InvoiceDetails();
            details.setInvoice(invoice);
            details.setPayment(payment);
            details.setAmount(transactionAmount);
            details.setAddeddatetime(LocalDateTime.now());
            details.setUpdateddatetime(LocalDateTime.now());
            invoiceDetailsDao.save(details);

        } catch (Exception e) {
            System.err.println("Auto-create/update invoice for payment error: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private String getIssuedToName(Payment payment) {
        if (payment.getFarmer() != null) {
            return payment.getFarmer().getFullname();
        }
        if (payment.getSupermarket() != null) {
            return payment.getSupermarket().getName();
        }
        return "-";
    }

    private Partytype mapPaymentPartytype(Payment payment) {
        if (payment.getFarmer() != null) return Partytype.Farmer;
        if (payment.getSupermarket() != null) return Partytype.Supermarket;
        return null;
    }


    @GetMapping("/invoice/myinvoices/alldata")
    public List<Invoice> getMyInvoices() {
        String issuedTo = resolveIssuedToNameForCurrentUser();
        if (issuedTo == null) {
            return List.of(); // no linked farmer/supplier/supermarket - nothing to show
        }
        return invoiceDao.findByIssuedtoAndDeleteddatetimeIsNullOrderByIssueddateDesc(issuedTo);
    }

    @GetMapping("/invoice/myinvoices/byid/{id}")
    public Invoice getMyInvoiceById(@PathVariable Long id) {
        String issuedTo = resolveIssuedToNameForCurrentUser();
        if (issuedTo == null) {
            throw new RuntimeException("Invoice not found or access denied");
        }

        Invoice invoice = invoiceDao.findByIdAndIssuedtoAndDeleteddatetimeIsNull(id, issuedTo);
        if (invoice == null) {
            throw new RuntimeException("Invoice not found or access denied");
        }
        return invoice;
    }

    @GetMapping("/invoice/myinvoices/details/byinvoice/{invoiceId}")
    public List<InvoiceDetails> getMyInvoiceTransactions(@PathVariable Long invoiceId) {
        String issuedTo = resolveIssuedToNameForCurrentUser();
        if (issuedTo == null) {
            return List.of();
        }
        return invoiceDetailsDao.findByInvoiceIdAndOwner(invoiceId, issuedTo);
    }
    // Mirrors the getIssuedToName() logic already used when auto-generating
    // invoices above: whichever party the logged-in user is linked to is
    // the name that was stamped into Invoice.issuedto for their records.
    private String resolveIssuedToNameForCurrentUser() {
        String username = CurrentUserUtil.getCurrentUsername();
        User user = userDao.findByUsername(username); // confirm this method exists on UserRepository
        if (user == null) return null;

        if (user.getFarmer() != null) return user.getFarmer().getFullname();
        if (user.getSupplier() != null) return user.getSupplier().getContactperson();
        if (user.getSupermarket() != null) return user.getSupermarket().getName();

        return null; // employee/admin accounts aren't "customers" - no personal invoices
    }
}