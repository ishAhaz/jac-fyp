// ============================================================
// DOM ELEMENT REFERENCES
// ============================================================
(function () {
    let expensePaymentFormModalElement
        ,  tableBodyExpensePayment
        ,   displayPartyType
        ,   displayExpensePaymentStatus
        ,   userIdElement
        ,   sectionFarmerExpense
        ,   displayExpenseFarmer
        ,   displayGrnCrop
        ,   farmerExpenseTotalAmount
        ,   farmerAlreadyPaidAmount
        ,   inputFarmerPayNowAmount
        ,   farmerNewTotalPaidAmount
        ,   sectionSupplierExpense
        ,   displayExpenseSupplier
        ,   displayGrnIngredient
        ,  supplierExpenseTotalAmount
        ,  supplierAlreadyPaidAmount
        ,  inputSupplierPayNowAmount
        ,  supplierNewTotalPaidAmount
        ,  selectExpensePaymentMethodElement
        ,  sectionExpenseBankTransferElement
        ,  sectionExpenseChequeElement
        ,  sectionExpenseCardElement
        ,  expenseBankNameElement
        ,  expenseTransactionIdElement
        ,  expenseTransactionDateElement
        ,  expenseBankReceiptImageElement
        ,  expenseChequeNumberElement
        ,  expenseChequeBankNameElement
        ,  expenseChequeBranchElement
        ,  expenseChequeDateElement
        ,  expenseClearingDateElement
        ,  expenseChequeStatusElement
        ,  expenseChequeReceiptImageElement
        ,  expenseCardTypeElement
        ,  expenseLast4DigitsElement
        ,  expenseCardRefNumberElement
        ,  expenseCardReceiptImageElement
        ,  printViewExpenseModalElement
        ,  expensePaymentForm
        ,  createdRegDateElement
        ,   expenseUpdateDateElement
        ,  expenseRegNoElement
        ,  formTitleEditExpense
        ,  formTitleNewExpense
        ,  updateExpenseElement
        ,  clearExpenseElement
        ,  printExpenseElement
        // Proof preview — mirrors payment.js's ProofPreviewModal wiring
        ,  proofPreviewModalElement
        ,  proofPreviewImageElement
        ,  proofPreviewOpenNewTabElement
        ,  buttonPreviewProofElement;
    const queryElements = () => {
        expensePaymentFormModalElement = document.querySelector("#ExpensePaymentFormModal");

// Table body
        tableBodyExpensePayment = document.querySelector("#tableBodyExpensePayment");

// ── Party type / status / user (auto-filled, read only) ──
        displayPartyType = document.querySelector("#displayPartyType");
        displayExpensePaymentStatus = document.querySelector("#displayExpensePaymentStatus");
        userIdElement = document.querySelector("#userId");

// Farmer section elements (auto-filled, read only, except Pay Now)
        sectionFarmerExpense = document.querySelector("#sectionFarmerExpense");
        displayExpenseFarmer = document.querySelector("#displayExpenseFarmer");
        displayGrnCrop = document.querySelector("#displayGrnCrop");
        farmerExpenseTotalAmount = document.querySelector("#farmerExpenseTotalAmount");
        farmerAlreadyPaidAmount = document.querySelector("#farmerAlreadyPaidAmount");
        inputFarmerPayNowAmount = document.querySelector("#inputFarmerPayNowAmount");
        farmerNewTotalPaidAmount = document.querySelector("#farmerNewTotalPaidAmount");

// Supplier section elements (auto-filled, read only, except Pay Now)
        sectionSupplierExpense = document.querySelector("#sectionSupplierExpense");
        displayExpenseSupplier = document.querySelector("#displayExpenseSupplier");
        displayGrnIngredient = document.querySelector("#displayGrnIngredient");
        supplierExpenseTotalAmount = document.querySelector("#supplierExpenseTotalAmount");
        supplierAlreadyPaidAmount = document.querySelector("#supplierAlreadyPaidAmount");
        inputSupplierPayNowAmount = document.querySelector("#inputSupplierPayNowAmount");
        supplierNewTotalPaidAmount = document.querySelector("#supplierNewTotalPaidAmount");

// ── Payment Method (shared by both flows) ──
// NOTE: ExpensePayment has NO paymentmethod field on the entity — the
// method is implied purely by which of bankTransfer / cardPayment /
// chequePayment is populated. This dropdown only controls which detail
// section is shown; its value is never written onto expensePayment.
        selectExpensePaymentMethodElement = document.querySelector("#selectExpensePaymentMethod");

// ── Method sections ──
        sectionExpenseBankTransferElement = document.querySelector("#sectionExpenseBankTransfer");
        sectionExpenseChequeElement = document.querySelector("#sectionExpenseCheque");
        sectionExpenseCardElement = document.querySelector("#sectionExpenseCard");

// ── Bank Transfer fields ──
        expenseBankNameElement = document.querySelector("#expenseBankName");
        expenseTransactionIdElement = document.querySelector("#expenseTransactionId");
        expenseTransactionDateElement = document.querySelector("#expenseTransactionDate");
        expenseBankReceiptImageElement = document.querySelector("#expenseBankReceiptImage");

// ── Cheque fields ──
        expenseChequeNumberElement = document.querySelector("#expenseChequeNumber");
        expenseChequeBankNameElement = document.querySelector("#expenseChequeBankName");
        expenseChequeBranchElement = document.querySelector("#expenseChequeBranch");
        expenseChequeDateElement = document.querySelector("#expenseChequeDate");
        expenseClearingDateElement = document.querySelector("#expenseClearingDate");
        expenseChequeStatusElement = document.querySelector("#expenseChequeStatus");
        expenseChequeReceiptImageElement = document.querySelector("#expenseChequeReceiptImage");

// ── Card fields ──
        expenseCardTypeElement = document.querySelector("#expenseCardType");
        expenseLast4DigitsElement = document.querySelector("#expenseLast4Digits");
        expenseCardRefNumberElement = document.querySelector("#expenseCardRefNumber");
        expenseCardReceiptImageElement = document.querySelector("#expenseCardReceiptImage");

// Print view modal
        printViewExpenseModalElement = document.querySelector("#ExpensePaymentViewModal");

// Proof preview modal — same pattern as payment.js
        proofPreviewModalElement = document.querySelector("#ExpenseProofPreviewModal");
        proofPreviewImageElement = document.querySelector("#expenseProofPreviewImage");
        proofPreviewOpenNewTabElement = document.querySelector("#expenseProofPreviewOpenNewTab");
        buttonPreviewProofElement = document.querySelector("#buttonExpensePreviewProof");

// Form fields (shared)
        expensePaymentForm = document.querySelector("#formExpensePayment");
        createdRegDateElement = document.querySelector("#createdRegDate");
        expenseUpdateDateElement = document.querySelector("#expenseUpdateDate");
        expenseRegNoElement = document.querySelector("#expenseRegNo");

// Form title toggles
        formTitleEditExpense = document.querySelector("#formTitleEdit");
        formTitleNewExpense = document.querySelector("#formTitleNew");

// Buttons — only Clear / Print / Update exist on this page (no Add or
// Delete button in the markup: expense payment records are created
// elsewhere when a GRN is registered, this page only processes them).
        updateExpenseElement = document.querySelector("#buttonExpenseUpdate");
        clearExpenseElement = document.querySelector("#buttonExpenseClear");
        printExpenseElement = document.querySelector("#buttonExpensePrint");
    }
// ============================================================
// STATE
// ============================================================

    let expensePaymentList = [];

    let expensePayment    = {};
    let oldExpensePayment = {};

// Reference data for payment-method detail sections
    let chequeStatuses = [];
    let cardTypes      = [];

// ============================================================
// EVENT LISTENERS
// ============================================================

    const initializeExpenseEventListeners = () => {
        // Pay Now amount (the only user-editable field per party flow)
        inputFarmerPayNowAmount.addEventListener("input", validateFarmerPayNowAmount);
        inputSupplierPayNowAmount.addEventListener("input", validateSupplierPayNowAmount);

        // Shared payment method (UI toggle only — see note above)
        selectExpensePaymentMethodElement.addEventListener("change", handleExpensePaymentMethodChange);

        // Bank Transfer
        expenseBankNameElement.addEventListener("input", validateExpenseBankName);
        expenseTransactionIdElement.addEventListener("input", validateExpenseTransactionId);
        expenseTransactionDateElement.addEventListener("change", validateExpenseTransactionDate);
        expenseBankReceiptImageElement.addEventListener("change", handleExpenseBankReceiptImage);

        // Cheque
        expenseChequeNumberElement.addEventListener("input", validateExpenseChequeNumber);
        expenseChequeBankNameElement.addEventListener("input", validateExpenseChequeBankName);
        expenseChequeBranchElement.addEventListener("input", validateExpenseChequeBranch);
        expenseChequeDateElement.addEventListener("change", validateExpenseChequeDate);
        expenseChequeStatusElement.addEventListener("change", validateExpenseChequeStatus);
        expenseChequeReceiptImageElement.addEventListener("change", handleExpenseChequeReceiptImage);

        // Card
        expenseCardTypeElement.addEventListener("change", validateExpenseCardType);
        expenseLast4DigitsElement.addEventListener("input", validateExpenseLast4Digits);
        expenseCardRefNumberElement.addEventListener("input", validateExpenseCardRefNumber);
        expenseCardReceiptImageElement.addEventListener("change", handleExpenseCardReceiptImage);

        // Buttons
        updateExpenseElement.addEventListener("click", handleUpdate);
        clearExpenseElement.addEventListener("click", handleClear);
        printExpenseElement.addEventListener("click", handlePrint);

        // Proof preview — same wiring as payment.js
        buttonPreviewProofElement.addEventListener("click", openExpenseProofPreview);
        proofPreviewImageElement.addEventListener("click", () => {
            proofPreviewImageElement.classList.toggle("zoomed");
        });
    };


// ============================================================
// INITIALIZE FORM
// ============================================================

    const initializeExpenseForm = () => {
        expensePayment    = {};
        oldExpensePayment = {};

        expensePaymentForm.reset();
        removeValidationStyles(expensePaymentForm);

        // Meta info
        expenseRegNoElement.textContent      = "-";
        expenseUpdateDateElement.textContent = "-";

        let dateTime = getTodayDateTime();
        let date = dateTime.slice(0, 10);
        let time = dateTime.slice(11, 19);
        createdRegDateElement.textContent = date + " " + time;

        // Auto-fill currently logged-in user (display only)
        loadLoggedInUserInto(expensePayment, userIdElement);
        userIdElement.readOnly = true;

        // Clear auto-filled party type / status display
        displayPartyType.value = "";
        displayExpensePaymentStatus.value = "-";

        // Hide both party sections
        sectionFarmerExpense.classList.add("d-none");
        sectionSupplierExpense.classList.add("d-none");

        // Reset amount fields
        clearFarmerAmountFields();
        clearSupplierAmountFields();

        // Reset payment method + hide/clear all method detail sections
        clearExpensePaymentMethodFields();

        // Title — this page always processes an existing record
        formTitleEditExpense.classList.remove("d-none");
        formTitleNewExpense.classList.add("d-none");
    };


// ============================================================
// LOAD INITIAL DATA
// ============================================================

    const loadExpenseInitialData = () => {
        loadExpenseChequeStatuses();
        loadExpenseCardTypes();
        expensePaymentList = getServiceRequest("/payments/expensepaymentlist/alldata/selected");
    };

    const loadExpenseChequeStatuses = () => {
        chequeStatuses = [
            { name: "Pending"   },
            { name: "Cleared"   },
            { name: "Bounced"   },
            { name: "Cancelled" },
        ];
    };

    const loadExpenseCardTypes = () => {
        cardTypes = [
            { name: "Visa"       },
            { name: "MasterCard" },
        ];
    };


// ============================================================
// REFRESH TABLE
// ============================================================

    const refreshExpensePaymentTable = () => {
        if ($.fn.DataTable.isDataTable("#tableExpensePayment")) {
            $("#tableExpensePayment").DataTable().destroy();
        }

        tableBodyExpensePayment.innerHTML = "";

        let displayProperty = [
            { propertyName: getExpensePartyTypeDisplay, dataType: "function" },
            { propertyName: getExpensePartyName,         dataType: "function" },
            { propertyName: getExpenseGrnRef,            dataType: "function" },
            { propertyName: getExpenseMethodDisplay,     dataType: "function" },
            { propertyName: "paidamount",                dataType: "string"   },
            { propertyName: getExpenseStatusBadge,       dataType: "function" },
            { propertyName: getExpensePaymentDate,       dataType: "function" },
        ];

        fillDataIntoTableThree(
            tableBodyExpensePayment,
            expensePaymentList,
            displayProperty,
            refillExpensePaymentForm
        );

        $("#tableExpensePayment").DataTable();
    };

// Table display helpers (unchanged — table keeps the colored badges)
    const getExpensePartyTypeDisplay = (ob) => {
        if (ob.partytype === "Farmer")   return '<p class="p-1 bg-success">Farmer</p>';
        if (ob.partytype === "Supplier") return '<p class="p-1 bg-primary">Supplier</p>';
        return ob.partytype;
    };

    // NOTE: for the Supplier branch, the exact field name on the
    // supplier object hasn't been confirmed yet (console view was cut
    // off after "bankname"). This fallback chain tries the most likely
    // candidates in order. Once you confirm the real field name, trim
    // this down to just that one property for clarity.
    const getExpensePartyName = (ob) => {
        if (ob.farmer) {
            return ob.farmer.callingname || ob.farmer.fullname || "-";
        }
        if (ob.supplier) {
            return ob.supplier.contactperson
                || ob.supplier.callingname
                || ob.supplier.name
                || ob.supplier.suppliername
                || ob.supplier.companyname
                || "-";
        }
        return "-";
    };

    // FIX: entity fields are "grncropnumber" / "grningredientnumber",
    // not "number" — confirmed from console output.
    const getExpenseGrnRef = (ob) => {
        if (ob.grnCrop)        return ob.grnCrop.grncropnumber || "-";
        if (ob.grnIngredients) return ob.grnIngredients.grningredientnumber || "-";
        return "-";
    };

    // Derived display only — since there's no paymentmethod field,
    // infer the label from whichever sub-payment object is present.
    const getExpenseMethodDisplay = (ob) => {
        if (ob.bankTransfer)  return "Bank Transfer";
        if (ob.chequePayment) return "Cheque";
        if (ob.cardPayment)   return "Card";
        return "Cash";
    };

    const getExpensePaymentDate = (ob) => {
        if (!ob.addeddatetime) return "-";
        return ob.addeddatetime.slice(0, 10);
    };

    // Colored badge — used for the table's Status column only now.
    // The form area shows plain, uncolored text (see refillExpensePaymentForm).
    const getExpenseStatusBadge = (ob) => {
        if (ob.paymentstatus === "Paid")    return '<p class="p-1 bg-success text-white mb-0">Paid</p>';
        if (ob.paymentstatus === "Partial") return '<p class="p-1 bg-warning mb-0">Partial</p>';
        if (ob.paymentstatus === "Unpaid")  return '<p class="p-1 bg-danger text-white mb-0">Unpaid</p>';
        return "-";
    };


// ============================================================
// PAID AMOUNT — FARMER FLOW
// You only type the amount you're paying now; the new running total
// (already paid + pay now) is calculated and shown automatically, and
// that computed total is what actually gets sent to the backend as
// expensePayment.paidamount.
//
// FIX: the old guard was `if (newTotal > total && total > 0)`, which
// meant a Total Amount of 0/blank (e.g. GRN Crop's totalprice not
// populated) silently skipped the over-limit check entirely, letting
// any Pay Now value through with no warning. Total <= 0 is now its
// own error instead of a silent bypass.
// ============================================================

    const validateFarmerPayNowAmount = () => {
        const payNow      = parseFloat(inputFarmerPayNowAmount.value);
        const total        = parseFloat(farmerExpenseTotalAmount.value) || 0;
        const alreadyPaid  = parseFloat(farmerAlreadyPaidAmount.value) || 0;

        if (isNaN(payNow) || payNow <= 0) {
            expensePayment.paidamount = null;
            farmerNewTotalPaidAmount.value = "";
            setInvalid(inputFarmerPayNowAmount);
            return;
        }

        if (total <= 0) {
            expensePayment.paidamount = null;
            farmerNewTotalPaidAmount.value = "";
            setInvalid(inputFarmerPayNowAmount);
            Notiflix.Notify.warning("Total amount for this record could not be loaded. Please reopen the record.");
            return;
        }

        const newTotal = alreadyPaid + payNow;

        if (newTotal > total) {
            expensePayment.paidamount = null;
            farmerNewTotalPaidAmount.value = "";
            setInvalid(inputFarmerPayNowAmount);
            Notiflix.Notify.warning("Paid amount cannot exceed total amount.");
            return;
        }

        expensePayment.paidamount = newTotal;
        farmerNewTotalPaidAmount.value = newTotal.toFixed(2);

        if (newTotal !== oldExpensePayment.paidamount) {
            setUpdated(inputFarmerPayNowAmount);
        } else {
            setValid(inputFarmerPayNowAmount);
        }
    };

    const clearFarmerAmountFields = () => {
        displayExpenseFarmer.value     = "";
        displayGrnCrop.value           = "";
        farmerExpenseTotalAmount.value = "";
        farmerAlreadyPaidAmount.value  = "";
        inputFarmerPayNowAmount.value  = "";
        farmerNewTotalPaidAmount.value = "";
    };


// ============================================================
// PAID AMOUNT — SUPPLIER FLOW
// Same fix applied — see note above validateFarmerPayNowAmount.
// ============================================================

    const validateSupplierPayNowAmount = () => {
        const payNow      = parseFloat(inputSupplierPayNowAmount.value);
        const total        = parseFloat(supplierExpenseTotalAmount.value) || 0;
        const alreadyPaid  = parseFloat(supplierAlreadyPaidAmount.value) || 0;

        if (isNaN(payNow) || payNow <= 0) {
            expensePayment.paidamount = null;
            supplierNewTotalPaidAmount.value = "";
            setInvalid(inputSupplierPayNowAmount);
            return;
        }

        if (total <= 0) {
            expensePayment.paidamount = null;
            supplierNewTotalPaidAmount.value = "";
            setInvalid(inputSupplierPayNowAmount);
            Notiflix.Notify.warning("Total amount for this record could not be loaded. Please reopen the record.");
            return;
        }

        const newTotal = alreadyPaid + payNow;

        if (newTotal > total) {
            expensePayment.paidamount = null;
            supplierNewTotalPaidAmount.value = "";
            setInvalid(inputSupplierPayNowAmount);
            Notiflix.Notify.warning("Paid amount cannot exceed total amount.");
            return;
        }

        expensePayment.paidamount = newTotal;
        supplierNewTotalPaidAmount.value = newTotal.toFixed(2);

        if (newTotal !== oldExpensePayment.paidamount) {
            setUpdated(inputSupplierPayNowAmount);
        } else {
            setValid(inputSupplierPayNowAmount);
        }
    };

    const clearSupplierAmountFields = () => {
        displayExpenseSupplier.value     = "";
        displayGrnIngredient.value       = "";
        supplierExpenseTotalAmount.value = "";
        supplierAlreadyPaidAmount.value  = "";
        inputSupplierPayNowAmount.value  = "";
        supplierNewTotalPaidAmount.value = "";
    };


// ============================================================
// PAYMENT METHOD (UI toggle only — see note at top of file; the
// entity has no paymentmethod field, so nothing is written onto
// expensePayment here beyond the bankTransfer/cardPayment/chequePayment
// sub-objects themselves)
// ============================================================

    const generateExpenseChequeStatusSelect = () => {
        fillDataIntoSelect(expenseChequeStatusElement, "Select Status..", chequeStatuses, "name");
    };

    const generateExpenseCardTypeSelect = () => {
        fillDataIntoSelect(expenseCardTypeElement, "Select Type..", cardTypes, "name");
    };

    // Resets Payment Method back to blank ("Select Payment Method") and wipes
    // every field in all three detail sections. Called on every form init —
    // including right after a successful Update — so a fresh/next payment
    // never starts pre-loaded with the previous payment's method or details.
    const clearExpensePaymentMethodFields = () => {
        selectExpensePaymentMethodElement.value = "";
        sectionExpenseBankTransferElement.classList.add("d-none");
        sectionExpenseChequeElement.classList.add("d-none");
        sectionExpenseCardElement.classList.add("d-none");

        expensePayment.bankTransfer  = null;
        expensePayment.cardPayment   = null;
        expensePayment.chequePayment = null;

        // Bank Transfer fields
        expenseBankNameElement.value        = "";
        expenseTransactionIdElement.value   = "";
        expenseTransactionDateElement.value = "";
        expenseBankReceiptImageElement.value = "";

        // Cheque fields
        expenseChequeNumberElement.value   = "";
        expenseChequeBankNameElement.value = "";
        expenseChequeBranchElement.value   = "";
        expenseChequeDateElement.value     = "";
        expenseClearingDateElement.value   = "";
        expenseChequeReceiptImageElement.value = "";
        generateExpenseChequeStatusSelect();
        expenseChequeStatusElement.value = "";

        // Card fields
        expenseLast4DigitsElement.value   = "";
        expenseCardRefNumberElement.value = "";
        expenseCardReceiptImageElement.value = "";
        generateExpenseCardTypeSelect();
        expenseCardTypeElement.value = "";

        // No method left selected -> no proof to preview
        refreshExpenseProofPreviewAvailability();
    };

    const handleExpensePaymentMethodChange = () => {
        const method = selectExpensePaymentMethodElement.value;

        // Hide all method detail sections
        sectionExpenseBankTransferElement.classList.add("d-none");
        sectionExpenseChequeElement.classList.add("d-none");
        sectionExpenseCardElement.classList.add("d-none");

        // Clear nested method objects
        expensePayment.bankTransfer  = null;
        expensePayment.cardPayment   = null;
        expensePayment.chequePayment = null;

        if (method === "banktransfer") {
            sectionExpenseBankTransferElement.classList.remove("d-none");
            expensePayment.bankTransfer = {};
        } else if (method === "cheque") {
            sectionExpenseChequeElement.classList.remove("d-none");
            expensePayment.chequePayment = {};
        } else if (method === "card") {
            sectionExpenseCardElement.classList.remove("d-none");
            expensePayment.cardPayment = {};
        }
        // "cash" -> no sub-object, all three left null

        // Switching method clears whichever image was staged, so re-check
        refreshExpenseProofPreviewAvailability();
    };


// ── Bank Transfer fields ──

    const validateExpenseBankName = () => {
        const value = expenseBankNameElement.value.trim();
        if (!value) {
            if (expensePayment.bankTransfer) expensePayment.bankTransfer.bankname = null;
            setInvalid(expenseBankNameElement);
            return;
        }
        if (expensePayment.bankTransfer) expensePayment.bankTransfer.bankname = value;
        setValid(expenseBankNameElement);
    };

    const validateExpenseTransactionId = () => {
        const value = expenseTransactionIdElement.value.trim();
        if (!value) {
            if (expensePayment.bankTransfer) expensePayment.bankTransfer.transactionid = null;
            setInvalid(expenseTransactionIdElement);
            return;
        }
        if (expensePayment.bankTransfer) expensePayment.bankTransfer.transactionid = value;
        setValid(expenseTransactionIdElement);
    };

    const validateExpenseTransactionDate = () => {
        const value = expenseTransactionDateElement.value;
        if (!value) {
            if (expensePayment.bankTransfer) expensePayment.bankTransfer.transactiondate = null;
            setInvalid(expenseTransactionDateElement);
            return;
        }
        if (expensePayment.bankTransfer) expensePayment.bankTransfer.transactiondate = value;
        setValid(expenseTransactionDateElement);
    };

    const handleExpenseBankReceiptImage = () => {
        const file = expenseBankReceiptImageElement.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            if (expensePayment.bankTransfer) expensePayment.bankTransfer.imageBase64 = e.target.result;
            refreshExpenseProofPreviewAvailability();
        };
        reader.readAsDataURL(file);
    };


// ── Cheque fields ──

    const validateExpenseChequeNumber = () => {
        const value = expenseChequeNumberElement.value.trim();
        if (!value) {
            if (expensePayment.chequePayment) expensePayment.chequePayment.chequenumber = null;
            setInvalid(expenseChequeNumberElement);
            return;
        }
        if (expensePayment.chequePayment) expensePayment.chequePayment.chequenumber = value;
        setValid(expenseChequeNumberElement);
    };

    const validateExpenseChequeBankName = () => {
        const value = expenseChequeBankNameElement.value.trim();
        if (!value) {
            if (expensePayment.chequePayment) expensePayment.chequePayment.bankname = null;
            setInvalid(expenseChequeBankNameElement);
            return;
        }
        if (expensePayment.chequePayment) expensePayment.chequePayment.bankname = value;
        setValid(expenseChequeBankNameElement);
    };

    // Branch — required, same pattern as Bank Name.
    const validateExpenseChequeBranch = () => {
        const value = expenseChequeBranchElement.value.trim();
        if (!value) {
            if (expensePayment.chequePayment) expensePayment.chequePayment.branch = null;
            setInvalid(expenseChequeBranchElement);
            return;
        }
        if (expensePayment.chequePayment) expensePayment.chequePayment.branch = value;
        setValid(expenseChequeBranchElement);
    };

    const validateExpenseChequeDate = () => {
        const value = expenseChequeDateElement.value;
        if (!value) {
            if (expensePayment.chequePayment) expensePayment.chequePayment.chequedate = null;
            setInvalid(expenseChequeDateElement);
            return;
        }
        if (expensePayment.chequePayment) expensePayment.chequePayment.chequedate = value;
        setValid(expenseChequeDateElement);
    };

    const validateExpenseChequeStatus = () => {
        const value = expenseChequeStatusElement.value;
        if (!value) {
            if (expensePayment.chequePayment) expensePayment.chequePayment.chequestatus = null;
            setInvalid(expenseChequeStatusElement);
            return;
        }
        const parsed = JSON.parse(value);
        if (expensePayment.chequePayment) expensePayment.chequePayment.chequestatus = parsed.name;
        setValid(expenseChequeStatusElement);
    };

    const handleExpenseChequeReceiptImage = () => {
        const file = expenseChequeReceiptImageElement.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            if (expensePayment.chequePayment) expensePayment.chequePayment.imageBase64 = e.target.result;
            refreshExpenseProofPreviewAvailability();
        };
        reader.readAsDataURL(file);
    };


// ── Card fields ──

    const validateExpenseCardType = () => {
        const value = expenseCardTypeElement.value;
        if (!value) {
            if (expensePayment.cardPayment) expensePayment.cardPayment.cardtype = null;
            setInvalid(expenseCardTypeElement);
            return;
        }
        const parsed = JSON.parse(value);
        if (expensePayment.cardPayment) expensePayment.cardPayment.cardtype = parsed.name;
        setValid(expenseCardTypeElement);
    };

    const validateExpenseLast4Digits = () => {
        const value   = expenseLast4DigitsElement.value.trim();
        const pattern = /^[0-9]{4}$/;
        if (!pattern.test(value)) {
            if (expensePayment.cardPayment) expensePayment.cardPayment.last4digits = null;
            setInvalid(expenseLast4DigitsElement);
            return;
        }
        if (expensePayment.cardPayment) expensePayment.cardPayment.last4digits = value;
        setValid(expenseLast4DigitsElement);
    };

    const validateExpenseCardRefNumber = () => {
        const value = expenseCardRefNumberElement.value.trim();
        if (!value) {
            if (expensePayment.cardPayment) expensePayment.cardPayment.referencenumber = null;
            setInvalid(expenseCardRefNumberElement);
            return;
        }
        if (expensePayment.cardPayment) expensePayment.cardPayment.referencenumber = value;
        setValid(expenseCardRefNumberElement);
    };

    const handleExpenseCardReceiptImage = () => {
        const file = expenseCardReceiptImageElement.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            if (expensePayment.cardPayment) expensePayment.cardPayment.imageBase64 = e.target.result;
            refreshExpenseProofPreviewAvailability();
        };
        reader.readAsDataURL(file);
    };


// ============================================================
// PROOF PREVIEW (same pattern as payment.js — button stays disabled
// until whichever method sub-object currently holds an imageBase64,
// either freshly uploaded or restored from the backend on refill)
// ============================================================

    const getActiveExpenseProofImage = () => {
        if (expensePayment.bankTransfer && expensePayment.bankTransfer.imageBase64)   return expensePayment.bankTransfer.imageBase64;
        if (expensePayment.chequePayment && expensePayment.chequePayment.imageBase64) return expensePayment.chequePayment.imageBase64;
        if (expensePayment.cardPayment && expensePayment.cardPayment.imageBase64)     return expensePayment.cardPayment.imageBase64;
        return null;
    };

    const refreshExpenseProofPreviewAvailability = () => {
        buttonPreviewProofElement.disabled = !getActiveExpenseProofImage();
    };

    const openExpenseProofPreview = () => {
        const image = getActiveExpenseProofImage();
        if (!image) {
            Notiflix.Notify.info("No payment proof has been uploaded for this record yet.");
            return;
        }
        proofPreviewImageElement.src = image;
        proofPreviewImageElement.classList.remove("zoomed");
        proofPreviewOpenNewTabElement.href = image;
        new bootstrap.Modal(proofPreviewModalElement).show();
    };


// ============================================================
// REFILL FORM — triggered by clicking a row (Modify)
// ============================================================

    const refillExpensePaymentForm = (dataOb) => {
        removeValidationStyles(expensePaymentForm);

        let myModal = new bootstrap.Modal(expensePaymentFormModalElement, {});

        expensePayment    = getServiceRequest("/payments/expensepaymentlist/byid/" + dataOb.id);
        oldExpensePayment = JSON.parse(JSON.stringify(expensePayment));

        // Meta
        let dateTimeEdit = expensePayment.addeddatetime;
        let dateEdit = dateTimeEdit.slice(0, 10);
        let timeEdit = dateTimeEdit.slice(11, 19);
        createdRegDateElement.textContent = dateEdit + " " + timeEdit;

        if (!expensePayment.updateddatetime) {
            expenseUpdateDateElement.textContent = "-";
        } else {
            let dateTimeUpdate = expensePayment.updateddatetime;
            let dateUpdate = dateTimeUpdate.slice(0, 10);
            let timeUpdate = dateTimeUpdate.slice(11, 19);
            expenseUpdateDateElement.textContent = dateUpdate + " " + timeUpdate;
        }

        expenseRegNoElement.textContent = expensePayment.paymentno || "-";

        // Payment Status — plain, uncolored text field in the form body
        // (the colored badge is reserved for the table only).
        displayExpensePaymentStatus.value = expensePayment.paymentstatus || "-";

        // Party type — display only, set by whichever GRN triggered this record
        displayPartyType.value =
            expensePayment.partytype === "Farmer"   ? "Farmer" :
                expensePayment.partytype === "Supplier" ? "Supplier" : "-";

        // Show correct section and fill display-only fields
        sectionFarmerExpense.classList.add("d-none");
        sectionSupplierExpense.classList.add("d-none");

        if (expensePayment.partytype === "Farmer") {
            sectionFarmerExpense.classList.remove("d-none");

            displayExpenseFarmer.value = expensePayment.farmer
                ? (expensePayment.farmer.callingname || expensePayment.farmer.fullname || "-")
                : "-";
            displayGrnCrop.value = expensePayment.grnCrop
                ? (expensePayment.grnCrop.grncropnumber || "-")
                : "-";
            farmerExpenseTotalAmount.value = expensePayment.grnCrop
                ? (expensePayment.grnCrop.totalprice || "")
                : "";

            // Already paid = whatever is on the record right now.
            // Pay Now starts blank — user enters the new increment.
            // New Total starts equal to Already Paid until they type something.
            const farmerAlreadyPaid = expensePayment.paidamount || 0;
            farmerAlreadyPaidAmount.value  = farmerAlreadyPaid;
            inputFarmerPayNowAmount.value  = "";
            farmerNewTotalPaidAmount.value = farmerAlreadyPaid;

        } else if (expensePayment.partytype === "Supplier") {
            sectionSupplierExpense.classList.remove("d-none");

            displayExpenseSupplier.value = expensePayment.supplier
                ? (expensePayment.supplier.contactperson
                    || expensePayment.supplier.callingname
                    || expensePayment.supplier.name
                    || expensePayment.supplier.suppliername
                    || expensePayment.supplier.companyname
                    || "-")
                : "-";
            displayGrnIngredient.value = expensePayment.grnIngredients
                ? (expensePayment.grnIngredients.grningredientnumber || "-")
                : "-";
            supplierExpenseTotalAmount.value = expensePayment.grnIngredients
                ? (expensePayment.grnIngredients.totalprice || "")
                : "";

            const supplierAlreadyPaid = expensePayment.paidamount || 0;
            supplierAlreadyPaidAmount.value  = supplierAlreadyPaid;
            inputSupplierPayNowAmount.value  = "";
            supplierNewTotalPaidAmount.value = supplierAlreadyPaid;
        }

        // ── Restore payment method section (derived, UI only) ──
        sectionExpenseBankTransferElement.classList.add("d-none");
        sectionExpenseChequeElement.classList.add("d-none");
        sectionExpenseCardElement.classList.add("d-none");

        if (expensePayment.bankTransfer) {
            selectExpensePaymentMethodElement.value = "banktransfer";
            sectionExpenseBankTransferElement.classList.remove("d-none");
            expenseBankNameElement.value        = expensePayment.bankTransfer.bankname        || "";
            expenseTransactionIdElement.value   = expensePayment.bankTransfer.transactionid   || "";
            expenseTransactionDateElement.value = expensePayment.bankTransfer.transactiondate || "";
            // Existing receipt image already populated by @PostLoad on the backend record
        } else if (expensePayment.chequePayment) {
            selectExpensePaymentMethodElement.value = "cheque";
            sectionExpenseChequeElement.classList.remove("d-none");
            expenseChequeNumberElement.value   = expensePayment.chequePayment.chequenumber  || "";
            expenseChequeBankNameElement.value = expensePayment.chequePayment.bankname      || "";
            expenseChequeBranchElement.value   = expensePayment.chequePayment.branch        || "";
            expenseChequeDateElement.value     = expensePayment.chequePayment.chequedate    || "";
            expenseClearingDateElement.value   = expensePayment.chequePayment.clearingdate  || "";
            generateExpenseChequeStatusSelect();
            expenseChequeStatusElement.value   = JSON.stringify({ name: expensePayment.chequePayment.chequestatus });
        } else if (expensePayment.cardPayment) {
            selectExpensePaymentMethodElement.value = "card";
            sectionExpenseCardElement.classList.remove("d-none");
            generateExpenseCardTypeSelect();
            expenseCardTypeElement.value      = JSON.stringify({ name: expensePayment.cardPayment.cardtype });
            expenseLast4DigitsElement.value   = expensePayment.cardPayment.last4digits     || "";
            expenseCardRefNumberElement.value = expensePayment.cardPayment.referencenumber || "";
        } else {
            selectExpensePaymentMethodElement.value = "cash";
        }

        // Re-evaluate proof preview availability now that the record's
        // existing bankTransfer/chequePayment/cardPayment (and whatever
        // imageBase64 came back with them) are loaded.
        refreshExpenseProofPreviewAvailability();

        // User field is DISPLAY ONLY — same pattern as invoice.js / payment.js
        userIdElement.value    = expensePayment.user?.username || expensePayment.user?.id || "-";
        userIdElement.readOnly = true;

        formTitleEditExpense.classList.remove("d-none");
        formTitleNewExpense.classList.add("d-none");

        myModal.show();
    };


// ============================================================
// CHANGE DETECTION
// ============================================================

    const hasExpensePaymentChanged = () => {
        if (expensePayment.paidamount !== oldExpensePayment.paidamount) return true;
        if (JSON.stringify(expensePayment.bankTransfer) !== JSON.stringify(oldExpensePayment.bankTransfer)) return true;
        if (JSON.stringify(expensePayment.chequePayment) !== JSON.stringify(oldExpensePayment.chequePayment)) return true;
        if (JSON.stringify(expensePayment.cardPayment) !== JSON.stringify(oldExpensePayment.cardPayment)) return true;
        if ((expensePayment.note || null) !== (oldExpensePayment.note || null)) return true;
        return false;
    };


// ============================================================
// FORM ERROR CHECK
// ============================================================

    const checkExpenseFormErrors = () => {
        let errors = [];

        if (!expensePayment.partytype) {
            errors.push("Party Type is missing on this record.");
        }

        if (expensePayment.partytype === "Farmer") {
            if (!expensePayment.farmer)     errors.push("Farmer reference is missing on this record.");
            if (!expensePayment.grnCrop)    errors.push("GRN Crop reference is missing on this record.");
            if (!expensePayment.paidamount) errors.push("Pay Now amount has an error. Please check again.");
        } else if (expensePayment.partytype === "Supplier") {
            if (!expensePayment.supplier)       errors.push("Supplier reference is missing on this record.");
            if (!expensePayment.grnIngredients) errors.push("GRN Ingredient reference is missing on this record.");
            if (!expensePayment.paidamount)     errors.push("Pay Now amount has an error. Please check again.");
        } else {
            errors.push("Party Type is missing on this record.");
        }

        if (!expensePayment.user) errors.push("User ID has an error. Please check again.");

        if (expensePayment.bankTransfer) {
            if (!expensePayment.bankTransfer.bankname)        errors.push("Bank Name is required for Bank Transfer.");
            if (!expensePayment.bankTransfer.transactionid)   errors.push("Transaction ID is required for Bank Transfer.");
            if (!expensePayment.bankTransfer.transactiondate) errors.push("Transaction Date is required for Bank Transfer.");
        }
        if (expensePayment.chequePayment) {
            if (!expensePayment.chequePayment.chequenumber) errors.push("Cheque Number is required.");
            if (!expensePayment.chequePayment.bankname)     errors.push("Bank Name is required for Cheque.");
            if (!expensePayment.chequePayment.branch)       errors.push("Branch is required for Cheque.");
            if (!expensePayment.chequePayment.chequedate)   errors.push("Cheque Date is required.");
        }
        if (expensePayment.cardPayment) {
            if (!expensePayment.cardPayment.cardtype)        errors.push("Card Type is required.");
            if (!expensePayment.cardPayment.last4digits)     errors.push("Last 4 digits are required.");
            if (!expensePayment.cardPayment.referencenumber) errors.push("Reference Number is required.");
        }

        return errors;
    };


// ============================================================
// BUTTON HANDLERS
// ============================================================

    const handleUpdate = () => {
        const errors = checkExpenseFormErrors();
        if (errors.length > 0) {
            Notiflix.Notify.warning(errors.join(" | "));
            return;
        }

        if (hasExpensePaymentChanged()) {
            loadLoggedInUserInto(expensePayment, userIdElement);
        }

        // IMPORTANT: only send the fields the backend actually needs/uses
        // for update (id + paidamount + the active payment-method
        // sub-object). The full expensePayment object also carries
        // read-only nested graphs (grnCrop, grnIngredients, farmer,
        // supplier, user, ...) fetched on GET — round-tripping those back
        // through PUT causes Jackson to try to *deserialize* them into
        // Java objects again, which fails for entities like
        // CropPurchase/CropPurchaseItem that don't support being
        // reconstructed this way. The backend never reads those fields
        // on update (it works off the already-loaded DB record instead),
        // so we simply don't send them.
        let bankTransferPayload  = null;
        let cardPaymentPayload   = null;
        let chequePaymentPayload = null;

        if (expensePayment.bankTransfer) {
            const bt = expensePayment.bankTransfer;
            bankTransferPayload = {
                id:              bt.id || null, // keep so JPA updates the existing row, not insert-new
                bankname:        bt.bankname        || null,
                transactionid:   bt.transactionid   || null,
                transactiondate: bt.transactiondate || null,
                imageBase64:     bt.imageBase64      || null,
                imageRemoved:    bt.imageRemoved     || false,
            };
        }

        if (expensePayment.cardPayment) {
            const cp = expensePayment.cardPayment;
            cardPaymentPayload = {
                id:              cp.id || null,
                cardtype:        cp.cardtype        || null,
                last4digits:     cp.last4digits     || null,
                referencenumber: cp.referencenumber || null,
                imageBase64:     cp.imageBase64      || null,
                imageRemoved:    cp.imageRemoved     || false,
            };
        }

        if (expensePayment.chequePayment) {
            const chq = expensePayment.chequePayment;
            chequePaymentPayload = {
                id:            chq.id || null,
                chequenumber:  chq.chequenumber  || null,
                bankname:      chq.bankname      || null,
                branch:        chq.branch        || null,
                chequedate:    chq.chequedate     || null,
                clearingdate:  chq.clearingdate   || null,
                chequestatus:  chq.chequestatus   || null,
                imageBase64:   chq.imageBase64     || null,
                imageRemoved:  chq.imageRemoved    || false,
            };
        }

        const updatePayload = {
            id:            expensePayment.id,
            paidamount:    expensePayment.paidamount,
            bankTransfer:  bankTransferPayload,
            cardPayment:   cardPaymentPayload,
            chequePayment: chequePaymentPayload,
        };

        console.log("Updating expense payment:", updatePayload);

        let response = getHTTPServiceRequest("/payments/expensepaymentlist/update", "PUT", updatePayload);

        if (response === "OK") {
            expenseUpdateDateElement.textContent = new Date().toLocaleString();
            Notiflix.Notify.success("Updated successfully");
            $("#ExpensePaymentFormModal").modal("hide");
            loadExpenseInitialData();
            refreshExpensePaymentTable();
            initializeExpenseForm();
        } else {
            Notiflix.Notify.warning("Update failed: " + response);
        }
    };

    const handleClear = () => {
        Notiflix.Confirm.show(
            "Clear Form",
            "Are you sure you want to clear the form?",
            "Yes, Clear",
            "Cancel",
            () => {
                initializeExpenseForm();
            },
            () => {}
        );
    };

// ── Print / View ────────────────────────────────────────────

    const viewExpensePaymentRecord = (dataOb) => {
        document.querySelector("#tdExpensePaymentId").innerText   = dataOb.paymentno      || "-";
        document.querySelector("#tdPartyType").innerText          = dataOb.partytype      || "-";
        document.querySelector("#tdPartyName").innerText          = getExpensePartyName(dataOb);
        document.querySelector("#tdGrnRef").innerText             = getExpenseGrnRef(dataOb);
        document.querySelector("#tdExpenseMethod").innerText      = getExpenseMethodDisplay(dataOb);
        document.querySelector("#tdExpensePaidAmount").innerText  = dataOb.paidamount     || "-";
        document.querySelector("#tdExpenseStatus").innerHTML      = getExpenseStatusBadge(dataOb);
        document.querySelector("#tdExpensePaymentDate").innerText = getExpensePaymentDate(dataOb);
        document.querySelector("#tdExpenseNote").innerText        = dataOb.note           || "-";

        const editModalContent = expensePaymentFormModalElement.querySelector(".modal-content");
        editModalContent.classList.add("blurred");

        const viewModal = new bootstrap.Modal(printViewExpenseModalElement);
        viewModal.show();

        printViewExpenseModalElement.addEventListener(
            "hidden.bs.modal",
            () => {
                editModalContent.classList.remove("blurred");
            },
            { once: true }
        );
    };

    const handlePrint = () => {
        viewExpensePaymentRecord(expensePayment);
    };

    const printExpensePaymentRecord = () => {
        let newWindow = window.open();
        newWindow.document.write(
            "<html><head>" +
            "<title>Expense Payment</title>" +
            '<link rel="stylesheet" href="/css/bootstrap-5.3.3/css/bootstrap.min.css">' +
            "</head><body>" +
            document.querySelector("#divCardPrintExpensePayment").outerHTML +
            "</body></html>"
        );
        setInterval(() => {
            newWindow.stop();
            newWindow.print();
            newWindow.close();
        }, 500);
    };

    window.initPage = function () {
        queryElements();

        loadExpenseInitialData();
        initializeExpenseForm();
        initializeExpenseEventListeners();
        refreshExpensePaymentTable();}
    window.initPage();

    window.printExpensePaymentRecord = printExpensePaymentRecord;

})();