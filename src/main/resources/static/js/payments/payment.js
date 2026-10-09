// ============================================================
// DOM ELEMENT REFERENCES
// ============================================================
(function () {
    let paymentFormModalElement
        ,   tableBody
        ,  printViewModalElement
        ,  proofPreviewModalElement
        ,  proofPreviewImageElement
        ,  proofPreviewOpenNewTabElement
        ,  buttonPreviewProofElement
        ,  paymentForm
        ,   paymentRegDateElement
        ,  paymentUpdateDateElement
        ,  paymentRegNoElement
        ,  rowPaymentDueAlertElement
        ,  alertPaymentDueElement
        ,  paymentDueTextElement
        ,  displayPaymentTypeElement
        ,  displayPaymentStatusElement
        ,  userIdElement
        , sectionFarmerElement
        , sectionSupermarketElement
        , displayPaymentFarmerElement
        , displayFarmerSourceTypeElement
        , displayFarmerSourceRefElement
        , farmerTotalAmountElement
        , farmerAlreadyPaidAmountElement
        , inputFarmerPayNowAmountElement
        , farmerNewTotalPaidAmountElement
        , displayPaymentSupermarketElement
        , displaySupermarketOrderRefElement
        , supermarketTotalAmountElement
        , supermarketAlreadyPaidAmountElement
        , inputSupermarketPayNowAmountElement
        , supermarketNewTotalPaidAmountElement
        , selectPaymentMethodElement
        , sectionBankTransferElement
        , sectionChequeElement
        , sectionCardElement
        , bankNameElement
        , transactionIdElement
        , transactionDateElement
        ,  bankReceiptImageElement
        ,  chequeNumberElement
        ,    chequeBankNameElement
        ,    chequeBranchElement
        ,    chequeDateElement
        ,    clearingDateElement
        ,    chequeStatusElement
        ,    chequeReceiptImageElement
        ,    cardTypeElement
        ,    last4DigitsElement
        ,    cardRefNumberElement
        ,   cardReceiptImageElement
        ,   paymentNoteElement
        ,   submitElement
        ,approveElement
        ,   rejectElement
        ,  printElement
        ,   formTitleElement
        ,   tdPaymentId
        ,   tdPaymentType
        ,   tdCustomer
        ,   tdOrderRef
        ,   tdMethod
        ,   tdPaidAmount
        ,  tdPaymentStatus
        ,  tdPaymentDate
        , tdPaymentNote
        , divCardPrintPayment;
    const queryElements = () => {
        paymentFormModalElement = document.querySelector("#PaymentFormModal");

        // Table body
        tableBody = document.querySelector("#tableBodyPayment");

        // Print / proof modals
        printViewModalElement = document.querySelector("#PaymentViewModal");
        proofPreviewModalElement = document.querySelector("#ProofPreviewModal");
        proofPreviewImageElement = document.querySelector("#proofPreviewImage");
        proofPreviewOpenNewTabElement = document.querySelector("#proofPreviewOpenNewTab");
        buttonPreviewProofElement = document.querySelector("#buttonPreviewProof");

        // Form
        paymentForm = document.querySelector("#formPayment");

        // Header info display
        paymentRegDateElement = document.querySelector("#paymentRegDate");
        paymentUpdateDateElement = document.querySelector("#paymentUpdateDate");
        paymentRegNoElement = document.querySelector("#paymentRegNo");

        // Due-date alert
        rowPaymentDueAlertElement = document.querySelector("#rowPaymentDueAlert");
        alertPaymentDueElement = document.querySelector("#alertPaymentDue");
        paymentDueTextElement = document.querySelector("#paymentDueText");

        // ── Party type / status / user (auto-filled, read only) ──
        displayPaymentTypeElement = document.querySelector("#displayPaymentType");
        displayPaymentStatusElement = document.querySelector("#displayPaymentStatus");
        userIdElement = document.querySelector("#userId");

        // ── Flow sections ──
        sectionFarmerElement = document.querySelector("#sectionFarmer");
        sectionSupermarketElement = document.querySelector("#sectionSupermarket");

        // ── Flow 1: Farmer (auto-filled, read only, except Pay Now) ──
        displayPaymentFarmerElement = document.querySelector("#displayPaymentFarmer");
        displayFarmerSourceTypeElement = document.querySelector("#displayFarmerSourceType");
        displayFarmerSourceRefElement = document.querySelector("#displayFarmerSourceRef");
        farmerTotalAmountElement = document.querySelector("#farmerTotalAmount");
        farmerAlreadyPaidAmountElement = document.querySelector("#farmerAlreadyPaidAmount");
        inputFarmerPayNowAmountElement = document.querySelector("#inputFarmerPayNowAmount");
        farmerNewTotalPaidAmountElement = document.querySelector("#farmerNewTotalPaidAmount");

        // ── Flow 2: Supermarket (auto-filled, read only, except Pay Now) ──
        displayPaymentSupermarketElement = document.querySelector("#displayPaymentSupermarket");
        displaySupermarketOrderRefElement = document.querySelector("#displaySupermarketOrderRef");
        supermarketTotalAmountElement = document.querySelector("#supermarketTotalAmount");
        supermarketAlreadyPaidAmountElement = document.querySelector("#supermarketAlreadyPaidAmount");
        inputSupermarketPayNowAmountElement = document.querySelector("#inputSupermarketPayNowAmount");
        supermarketNewTotalPaidAmountElement = document.querySelector("#supermarketNewTotalPaidAmount");

        // ── Shared payment method fields ──
        selectPaymentMethodElement = document.querySelector("#selectPaymentMethod");

        // ── Method sections ──
        sectionBankTransferElement = document.querySelector("#sectionBankTransfer");
        sectionChequeElement = document.querySelector("#sectionCheque");
        sectionCardElement = document.querySelector("#sectionCard");

        // ── Bank Transfer fields ──
        bankNameElement = document.querySelector("#bankName");
        transactionIdElement = document.querySelector("#transactionId");
        transactionDateElement = document.querySelector("#transactionDate");
        bankReceiptImageElement = document.querySelector("#bankReceiptImage");

        // ── Cheque fields ──
        chequeNumberElement = document.querySelector("#chequeNumber");
        chequeBankNameElement = document.querySelector("#chequeBankName");
        chequeBranchElement = document.querySelector("#chequeBranch");
        chequeDateElement = document.querySelector("#chequeDate");
        clearingDateElement = document.querySelector("#clearingDate");
        chequeStatusElement = document.querySelector("#chequeStatus");
        chequeReceiptImageElement = document.querySelector("#chequeReceiptImage");

        // ── Card fields ──
        cardTypeElement = document.querySelector("#cardType");
        last4DigitsElement = document.querySelector("#last4Digits");
        cardRefNumberElement = document.querySelector("#cardRefNumber");
        cardReceiptImageElement = document.querySelector("#cardReceiptImage");

        // ── Note ──
        paymentNoteElement = document.querySelector("#paymentNote");

        // ── Buttons ──
        submitElement = document.querySelector("#buttonPaymentUpdate");
        approveElement = document.querySelector("#buttonPaymentApprove");
        rejectElement = document.querySelector("#buttonPaymentReject");
        printElement = document.querySelector("#buttonPaymentPrint");

        // ── Title ──
        formTitleElement = document.querySelector("#idFormTitle");

        // ── Print view cells ──
        tdPaymentId = document.querySelector("#tdPaymentId");
        tdPaymentType = document.querySelector("#tdPaymentType");
        tdCustomer = document.querySelector("#tdCustomer");
        tdOrderRef = document.querySelector("#tdOrderRef");
        tdMethod = document.querySelector("#tdMethod");
        tdPaidAmount = document.querySelector("#tdPaidAmount");
        tdPaymentStatus = document.querySelector("#tdPaymentStatus");
        tdPaymentDate = document.querySelector("#tdPaymentDate");
        tdPaymentNote = document.querySelector("#tdPaymentNote");
        divCardPrintPayment = document.querySelector("#divCardPrintPayment");
    }

    // ============================================================
    // STATE
    // ============================================================

    let paymentList = [];

    let payment    = {};
    let oldPayment = {};

    // Active flow: "farmer" | "supermarket" | null — always derived
    // from the record itself (payment.farmer / payment.supermarket),
    // never chosen manually.
    let activeFlow = null;

    // Reference data
    let chequeStatuses = [];
    let cardTypes      = [];

    const PAYMENT_DUE_DAYS = 7; // auto-discard window — informational only, the real job runs server-side


    // ============================================================
    // BUTTON VISIBILITY (business-state only — no privilege fetch)
    // Same approach as expensePayment.js: Update/Clear/Print are just
    // always there, and the backend's PrivilegeChecker.canUpdate() /
    // canApprove() inside PaymentController is the only real access
    // gate. Submit/Approve/Reject here are shown/hidden purely based on
    // the record's own state, not on any /privilege/... call.
    // ============================================================

    const canSubmitPayment  = () => payment.paymentstatus !== "Paid";
    const canApprovePayment = () => !!payment.paymentmethod && payment.paymentstatus !== "Paid";
    const canRejectPayment  = () => !!payment.paymentmethod && payment.paymentstatus !== "Paid";


    // ============================================================
    // EVENT LISTENERS
    // ============================================================

    const initializeEventListeners = () => {
        // Pay Now amount (the only user-editable amount field per flow)
        inputFarmerPayNowAmountElement.addEventListener("input", validateFarmerPayNowAmount);
        inputSupermarketPayNowAmountElement.addEventListener("input", validateSupermarketPayNowAmount);

        // Shared payment method
        selectPaymentMethodElement.addEventListener("change", handlePaymentMethodChange);

        // Bank Transfer
        bankNameElement.addEventListener("input",        validateBankName);
        transactionIdElement.addEventListener("input",   validateTransactionId);
        transactionDateElement.addEventListener("change", validateTransactionDate);
        bankReceiptImageElement.addEventListener("change", handleBankReceiptImage);

        // Cheque
        chequeNumberElement.addEventListener("input",   validateChequeNumber);
        chequeBankNameElement.addEventListener("input", validateChequeBankName);
        chequeBranchElement.addEventListener("input",   validateChequeBranch);
        chequeDateElement.addEventListener("change",    validateChequeDate);
        chequeStatusElement.addEventListener("change",  validateChequeStatus);
        chequeReceiptImageElement.addEventListener("change", handleChequeReceiptImage);

        // Card
        cardTypeElement.addEventListener("change",      validateCardType);
        last4DigitsElement.addEventListener("input",    validateLast4Digits);
        cardRefNumberElement.addEventListener("input",  validateCardRefNumber);
        cardReceiptImageElement.addEventListener("change", handleCardReceiptImage);

        // Note
        paymentNoteElement.addEventListener("input", () => {
            payment.note = paymentNoteElement.value.trim() || null;
        });

        // Action buttons
        submitElement.addEventListener("click",  handleSubmitPayment);
        approveElement.addEventListener("click", handleApprovePayment);
        rejectElement.addEventListener("click",  handleRejectPayment);
        printElement.addEventListener("click",   handlePrint);

        // Proof preview
        buttonPreviewProofElement.addEventListener("click", openProofPreview);
        proofPreviewImageElement.addEventListener("click", () => {
            proofPreviewImageElement.classList.toggle("zoomed");
        });
    };


    // ============================================================
    // LOAD INITIAL DATA
    // ============================================================

    const loadInitialData = () => {
        loadChequeStatuses();
        loadCardTypes();
        paymentList = getServiceRequest("/payments/paymentlist/alldata/selected");
    };

    const loadChequeStatuses = () => {
        chequeStatuses = [
            { name: "Pending"   },
            { name: "Cleared"   },
            { name: "Bounced"   },
            { name: "Cancelled" },
        ];
    };

    const loadCardTypes = () => {
        cardTypes = [
            { name: "Visa"       },
            { name: "MasterCard" },
        ];
    };


    // ============================================================
    // RESET FORM (records are only ever opened via the table — there
    // is no "add new" flow, records are auto-created on order approval)
    // ============================================================

    const initializeForm = () => {
        payment    = {};
        oldPayment = {};
        activeFlow = null;

        paymentForm.reset();
        removeValidationStyles(paymentForm);

        paymentRegNoElement.textContent      = "-";
        paymentUpdateDateElement.textContent = "-";
        paymentRegDateElement.textContent    = "-";

        rowPaymentDueAlertElement.classList.add("d-none");

        // Hide all flow sections
        sectionFarmerElement.classList.add("d-none");
        sectionSupermarketElement.classList.add("d-none");

        // Hide all method detail sections
        sectionBankTransferElement.classList.add("d-none");
        sectionChequeElement.classList.add("d-none");
        sectionCardElement.classList.add("d-none");

        // Reset proof preview
        buttonPreviewProofElement.disabled = true;

        // Reset display fields
        displayPaymentTypeElement.value   = "";
        displayPaymentStatusElement.value = "";

        // Populate static dropdowns
        generateChequeStatusSelect();
        generateCardTypeSelect();

        // Hide action buttons until a record is opened and roles are evaluated
        submitElement.classList.add("d-none");
        approveElement.classList.add("d-none");
        rejectElement.classList.add("d-none");

        formTitleElement.textContent = "Payment";
    };


    // ============================================================
    // DROPDOWN GENERATORS (static reference data only — party / order
    // selection no longer happens here, it's auto-filled from the record)
    // ============================================================

    const generateChequeStatusSelect = () => {
        fillDataIntoSelect(chequeStatusElement, "Select Status..", chequeStatuses, "name");
    };

    const generateCardTypeSelect = () => {
        fillDataIntoSelect(cardTypeElement, "Select Type..", cardTypes, "name");
    };


    // ============================================================
    // PAYMENT DUE ALERT (informational — mirrors the server-side
    // auto-discard window so staff/customers can see it's coming)
    // ============================================================

    const renderPaymentDueAlert = () => {
        if (!payment.paymentdatetime || payment.paymentstatus === "Paid") {
            rowPaymentDueAlertElement.classList.add("d-none");
            return;
        }

        const created = new Date(payment.paymentdatetime);
        const due = new Date(created.getTime() + PAYMENT_DUE_DAYS * 24 * 60 * 60 * 1000);
        const now = new Date();
        const msLeft = due.getTime() - now.getTime();
        const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));

        rowPaymentDueAlertElement.classList.remove("d-none");
        alertPaymentDueElement.classList.remove("alert-warning", "overdue");

        if (msLeft <= 0) {
            alertPaymentDueElement.classList.add("overdue");
            paymentDueTextElement.textContent =
                "This order's payment window has expired and is eligible for automatic discard.";
        } else {
            alertPaymentDueElement.classList.add("alert-warning");
            paymentDueTextElement.textContent =
                `Payment due within ${daysLeft} day(s) — unpaid orders are automatically discarded after ${PAYMENT_DUE_DAYS} days.`;
        }
    };


    // ============================================================
    // FLOW DISPLAY (read-only — set automatically when a record is opened)
    // ============================================================

    const setPaymentFlowDisplay = (flow) => {
        activeFlow = flow;

        sectionFarmerElement.classList.add("d-none");
        sectionSupermarketElement.classList.add("d-none");

        if (flow === "farmer") {
            displayPaymentTypeElement.value = "Registered Farmer";
            sectionFarmerElement.classList.remove("d-none");
        } else if (flow === "supermarket") {
            displayPaymentTypeElement.value = "Supermarket";
            sectionSupermarketElement.classList.remove("d-none");
        } else {
            displayPaymentTypeElement.value = "-";
        }
    };

    const handlePaymentMethodChange = () => {
        const method = selectPaymentMethodElement.value;

        sectionBankTransferElement.classList.add("d-none");
        sectionChequeElement.classList.add("d-none");
        sectionCardElement.classList.add("d-none");

        payment.bankTransfer  = null;
        payment.cardPayment   = null;
        payment.chequePayment = null;

        if (method === "Bank_Transfer") {
            sectionBankTransferElement.classList.remove("d-none");
            payment.bankTransfer = {};
        } else if (method === "Cheque") {
            sectionChequeElement.classList.remove("d-none");
            payment.chequePayment = {};
        } else if (method === "Card") {
            sectionCardElement.classList.remove("d-none");
            payment.cardPayment = {};
        }

        payment.paymentmethod = method;

        if (method !== oldPayment.paymentmethod) {
            setUpdated(selectPaymentMethodElement);
        } else {
            setValid(selectPaymentMethodElement);
        }

        // Switching method clears whichever image was staged, so re-check
        refreshProofPreviewAvailability();
    };


    // ============================================================
    // PAID AMOUNT — FARMER FLOW
    // Only the amount being paid now is entered; the new running
    // total (already paid + pay now) is calculated automatically and
    // is what actually gets sent to the backend as payment.paidamount.
    // ============================================================

    const validateFarmerPayNowAmount = () => {
        const payNow     = parseFloat(inputFarmerPayNowAmountElement.value);
        const total       = parseFloat(farmerTotalAmountElement.value) || 0;
        const alreadyPaid = parseFloat(farmerAlreadyPaidAmountElement.value) || 0;

        if (isNaN(payNow) || payNow <= 0) {
            payment.paidamount = null;
            farmerNewTotalPaidAmountElement.value = "";
            setInvalid(inputFarmerPayNowAmountElement);
            return;
        }

        if (total <= 0) {
            payment.paidamount = null;
            farmerNewTotalPaidAmountElement.value = "";
            setInvalid(inputFarmerPayNowAmountElement);
            Notiflix.Notify.warning("Total amount for this record could not be loaded. Please reopen the record.");
            return;
        }

        const newTotal = alreadyPaid + payNow;

        if (newTotal > total) {
            payment.paidamount = null;
            farmerNewTotalPaidAmountElement.value = "";
            setInvalid(inputFarmerPayNowAmountElement);
            Notiflix.Notify.warning("Paid amount cannot exceed total amount.");
            return;
        }

        payment.paidamount = newTotal;
        payment.paymentstatus = "Partial"; // manager approval is what finalizes "Paid"
        farmerNewTotalPaidAmountElement.value = newTotal.toFixed(2);

        if (newTotal !== oldPayment.paidamount) {
            setUpdated(inputFarmerPayNowAmountElement);
        } else {
            setValid(inputFarmerPayNowAmountElement);
        }
    };


    // ============================================================
    // PAID AMOUNT — SUPERMARKET FLOW
    // ============================================================

    const validateSupermarketPayNowAmount = () => {
        const payNow     = parseFloat(inputSupermarketPayNowAmountElement.value);
        const total       = parseFloat(supermarketTotalAmountElement.value) || 0;
        const alreadyPaid = parseFloat(supermarketAlreadyPaidAmountElement.value) || 0;

        if (isNaN(payNow) || payNow <= 0) {
            payment.paidamount = null;
            supermarketNewTotalPaidAmountElement.value = "";
            setInvalid(inputSupermarketPayNowAmountElement);
            return;
        }

        if (total <= 0) {
            payment.paidamount = null;
            supermarketNewTotalPaidAmountElement.value = "";
            setInvalid(inputSupermarketPayNowAmountElement);
            Notiflix.Notify.warning("Total amount for this record could not be loaded. Please reopen the record.");
            return;
        }

        const newTotal = alreadyPaid + payNow;

        if (newTotal > total) {
            payment.paidamount = null;
            supermarketNewTotalPaidAmountElement.value = "";
            setInvalid(inputSupermarketPayNowAmountElement);
            Notiflix.Notify.warning("Paid amount cannot exceed total amount.");
            return;
        }

        payment.paidamount = newTotal;
        payment.paymentstatus = "Partial"; // manager approval is what finalizes "Paid"
        supermarketNewTotalPaidAmountElement.value = newTotal.toFixed(2);

        if (newTotal !== oldPayment.paidamount) {
            setUpdated(inputSupermarketPayNowAmountElement);
        } else {
            setValid(inputSupermarketPayNowAmountElement);
        }
    };


    // ============================================================
    // VALIDATION — BANK TRANSFER FIELDS
    // ============================================================

    const validateBankName = () => {
        const value = bankNameElement.value.trim();
        if (!value) {
            if (payment.bankTransfer) payment.bankTransfer.bankname = null;
            setInvalid(bankNameElement);
            return;
        }
        if (payment.bankTransfer) payment.bankTransfer.bankname = value;
        setValid(bankNameElement);
    };

    const validateTransactionId = () => {
        const value = transactionIdElement.value.trim();
        if (!value) {
            if (payment.bankTransfer) payment.bankTransfer.transactionid = null;
            setInvalid(transactionIdElement);
            return;
        }
        if (payment.bankTransfer) payment.bankTransfer.transactionid = value;
        setValid(transactionIdElement);
    };

    const validateTransactionDate = () => {
        const value = transactionDateElement.value;
        if (!value) {
            if (payment.bankTransfer) payment.bankTransfer.transactiondate = null;
            setInvalid(transactionDateElement);
            return;
        }
        if (payment.bankTransfer) payment.bankTransfer.transactiondate = value;
        setValid(transactionDateElement);
    };

    const handleBankReceiptImage = () => {
        const file = bankReceiptImageElement.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            if (payment.bankTransfer) payment.bankTransfer.imageBase64 = e.target.result;
            refreshProofPreviewAvailability();
        };
        reader.readAsDataURL(file);
    };


    // ============================================================
    // VALIDATION — CHEQUE FIELDS
    // ============================================================

    const validateChequeNumber = () => {
        const value = chequeNumberElement.value.trim();
        if (!value) {
            if (payment.chequePayment) payment.chequePayment.chequenumber = null;
            setInvalid(chequeNumberElement);
            return;
        }
        if (payment.chequePayment) payment.chequePayment.chequenumber = value;
        setValid(chequeNumberElement);
    };

    const validateChequeBankName = () => {
        const value = chequeBankNameElement.value.trim();
        if (!value) {
            if (payment.chequePayment) payment.chequePayment.bankname = null;
            setInvalid(chequeBankNameElement);
            return;
        }
        if (payment.chequePayment) payment.chequePayment.bankname = value;
        setValid(chequeBankNameElement);
    };

    const validateChequeBranch = () => {
        const value = chequeBranchElement.value.trim();
        if (!value) {
            if (payment.chequePayment) payment.chequePayment.branch = null;
            setInvalid(chequeBranchElement);
            return;
        }
        if (payment.chequePayment) payment.chequePayment.branch = value;
        setValid(chequeBranchElement);
    };

    const validateChequeDate = () => {
        const value = chequeDateElement.value;
        if (!value) {
            if (payment.chequePayment) payment.chequePayment.chequedate = null;
            setInvalid(chequeDateElement);
            return;
        }
        if (payment.chequePayment) payment.chequePayment.chequedate = value;
        setValid(chequeDateElement);
    };

    const validateChequeStatus = () => {
        const value = chequeStatusElement.value;
        if (!value) {
            if (payment.chequePayment) payment.chequePayment.chequestatus = null;
            setInvalid(chequeStatusElement);
            return;
        }
        const parsed = JSON.parse(value);
        if (payment.chequePayment) payment.chequePayment.chequestatus = parsed.name;
        setValid(chequeStatusElement);
    };

    const handleChequeReceiptImage = () => {
        const file = chequeReceiptImageElement.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            if (payment.chequePayment) payment.chequePayment.imageBase64 = e.target.result;
            refreshProofPreviewAvailability();
        };
        reader.readAsDataURL(file);
    };


    // ============================================================
    // VALIDATION — CARD FIELDS
    // ============================================================

    const validateCardType = () => {
        const value = cardTypeElement.value;
        if (!value) {
            if (payment.cardPayment) payment.cardPayment.cardtype = null;
            setInvalid(cardTypeElement);
            return;
        }
        const parsed = JSON.parse(value);
        if (payment.cardPayment) payment.cardPayment.cardtype = parsed.name;
        setValid(cardTypeElement);
    };

    const validateLast4Digits = () => {
        const value   = last4DigitsElement.value.trim();
        const pattern = /^[0-9]{4}$/;
        if (!pattern.test(value)) {
            if (payment.cardPayment) payment.cardPayment.last4digits = null;
            setInvalid(last4DigitsElement);
            return;
        }
        if (payment.cardPayment) payment.cardPayment.last4digits = value;
        setValid(last4DigitsElement);
    };

    const validateCardRefNumber = () => {
        const value = cardRefNumberElement.value.trim();
        if (!value) {
            if (payment.cardPayment) payment.cardPayment.referencenumber = null;
            setInvalid(cardRefNumberElement);
            return;
        }
        if (payment.cardPayment) payment.cardPayment.referencenumber = value;
        setValid(cardRefNumberElement);
    };

    const handleCardReceiptImage = () => {
        const file = cardReceiptImageElement.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            if (payment.cardPayment) payment.cardPayment.imageBase64 = e.target.result;
            refreshProofPreviewAvailability();
        };
        reader.readAsDataURL(file);
    };


    // ============================================================
    // PROOF PREVIEW (manager reviewing an uploaded receipt image)
    // ============================================================

    const getActiveProofImage = () => {
        if (payment.bankTransfer && payment.bankTransfer.imageBase64)   return payment.bankTransfer.imageBase64;
        if (payment.chequePayment && payment.chequePayment.imageBase64) return payment.chequePayment.imageBase64;
        if (payment.cardPayment && payment.cardPayment.imageBase64)     return payment.cardPayment.imageBase64;
        return null;
    };

    const refreshProofPreviewAvailability = () => {
        buttonPreviewProofElement.disabled = !getActiveProofImage();
    };

    const openProofPreview = () => {
        const image = getActiveProofImage();
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
    // REFRESH MAIN TABLE
    // ============================================================

    const refreshPaymentTable = () => {
        if ($.fn.DataTable.isDataTable("#tablePayment")) {
            $("#tablePayment").DataTable().destroy();
        }

        tableBody.innerHTML = "";

        let displayProperty = [
            { propertyName: getPaymentTypeDisplay,   dataType: "function" },
            { propertyName: getCustomerDisplay,      dataType: "function" },
            { propertyName: getOrderRefDisplay,      dataType: "function" },
            { propertyName: getMethodDisplay,        dataType: "function" },
            { propertyName: "paidamount",            dataType: "string"   },
            { propertyName: getPaymentStatusDisplay, dataType: "function" },
            { propertyName: getPaymentDateDisplay,   dataType: "function" },
        ];

        fillDataIntoTableThree(
            tableBody,
            paymentList,
            displayProperty,
            refillPaymentForm
        );

        $("#tablePayment").DataTable();
    };

    // Table display helpers
    const getPaymentTypeDisplay = (ob) => {
        if (ob.farmer)      return '<p class="p-1 bg-success">Farmer</p>';
        if (ob.supermarket) return '<p class="p-1 bg-info">Supermarket</p>';
        return "-";
    };
    const getCustomerDisplay = (ob) => {
        if (ob.farmer)      return ob.farmer.callingname || ob.farmer.fullname || "-";
        if (ob.supermarket) return ob.supermarket.name   || "-";
        return "-";
    };
    const getOrderRefDisplay = (ob) => {
        if (ob.supermarketOrder) return ob.supermarketOrder.number       || "-";
        if (ob.compostsale)      return ob.compostsale.salenumber        || "-";
        if (ob.quotation)        return ob.quotation.quotationnumber     || "-";
        return "-";
    };
    const getMethodDisplay = (ob) =>
        ob.paymentmethod || "-";
    const getPaymentStatusDisplay = (ob) => {
        if (ob.paymentstatus === "Paid")    return '<p class="p-1 bg-success text-white">Paid</p>';
        if (ob.paymentstatus === "Partial") return '<p class="p-1 bg-warning">Partial</p>';
        if (ob.paymentstatus === "Unpaid")  return '<p class="p-1 bg-danger text-white">Unpaid</p>';
        return ob.paymentstatus || "-";
    };
    const getPaymentDateDisplay = (ob) =>
        ob.paymentdatetime ? ob.paymentdatetime.slice(0, 10) : "-";


    // ============================================================
    // OPEN A RECORD — every payment record is auto-generated when an
    // order/sale is approved, so this is the only entry point into the
    // form. Button visibility (Submit / Approve / Reject) depends only
    // on the record's own state — same as expensePayment.js's
    // Update/Clear, which are always shown. The backend's
    // PrivilegeChecker inside PaymentController is the real
    // access-control gate; the form fields are always interactive.
    // ============================================================

    const refillPaymentForm = (dataOb) => {
        removeValidationStyles(paymentForm);

        let myModal = new bootstrap.Modal(paymentFormModalElement, {});

        payment    = getServiceRequest("/payments/paymentlist/byid/" + dataOb.id);
        oldPayment = JSON.parse(JSON.stringify(payment));

        // Meta dates
        if (payment.paymentdatetime) {
            let dt = payment.paymentdatetime;
            paymentRegDateElement.textContent = dt.slice(0, 10) + " " + dt.slice(11, 19);
        } else {
            paymentRegDateElement.textContent = "-";
        }

        if (payment.updateddatetime) {
            let dt = payment.updateddatetime;
            paymentUpdateDateElement.textContent = dt.slice(0, 10) + " " + dt.slice(11, 19);
        } else {
            paymentUpdateDateElement.textContent = "-";
        }

        paymentRegNoElement.textContent = payment.paymentno || payment.id || "-";
        displayPaymentStatusElement.value = payment.paymentstatus || "-";

        renderPaymentDueAlert();

        // ── Determine flow automatically from the record — read only ──
        let flow = null;
        if (payment.farmer)      flow = "farmer";
        else if (payment.supermarket) flow = "supermarket";

        sectionFarmerElement.classList.add("d-none");
        sectionSupermarketElement.classList.add("d-none");

        if (flow) {
            setPaymentFlowDisplay(flow);

            if (flow === "farmer") {
                displayPaymentFarmerElement.value = payment.farmer.callingname || payment.farmer.fullname || "-";

                let total = 0;
                if (payment.compostsale) {
                    displayFarmerSourceTypeElement.value = "Compost Sale";
                    displayFarmerSourceRefElement.value  = payment.compostsale.salenumber || "-";
                    total = payment.compostsale.totalamount || 0;
                } else if (payment.quotation) {
                    displayFarmerSourceTypeElement.value = "Quotation";
                    displayFarmerSourceRefElement.value  = payment.quotation.quotationnumber || "-";
                    total = payment.quotation.totalamount || 0;
                } else {
                    displayFarmerSourceTypeElement.value = "-";
                    displayFarmerSourceRefElement.value  = "-";
                }

                farmerTotalAmountElement.value = total ? total.toFixed(2) : "";

                const alreadyPaid = payment.paidamount || 0;
                farmerAlreadyPaidAmountElement.value  = alreadyPaid.toFixed(2);
                inputFarmerPayNowAmountElement.value  = "";
                farmerNewTotalPaidAmountElement.value = alreadyPaid.toFixed(2);

            } else if (flow === "supermarket") {
                displayPaymentSupermarketElement.value = payment.supermarket.name || "-";
                displaySupermarketOrderRefElement.value = payment.supermarketOrder
                    ? (payment.supermarketOrder.number || "-")
                    : "-";

                const total = payment.supermarketOrder ? (payment.supermarketOrder.totalamount || 0) : 0;
                supermarketTotalAmountElement.value = total ? total.toFixed(2) : "";

                const alreadyPaid = payment.paidamount || 0;
                supermarketAlreadyPaidAmountElement.value  = alreadyPaid.toFixed(2);
                inputSupermarketPayNowAmountElement.value  = "";
                supermarketNewTotalPaidAmountElement.value = alreadyPaid.toFixed(2);
            }
        } else {
            displayPaymentTypeElement.value = "-";
        }

        // ── Restore payment method ──
        sectionBankTransferElement.classList.add("d-none");
        sectionChequeElement.classList.add("d-none");
        sectionCardElement.classList.add("d-none");

        if (payment.paymentmethod) selectPaymentMethodElement.value = payment.paymentmethod;
        else selectPaymentMethodElement.value = "";

        if (payment.bankTransfer) {
            sectionBankTransferElement.classList.remove("d-none");
            bankNameElement.value        = payment.bankTransfer.bankname        || "";
            transactionIdElement.value   = payment.bankTransfer.transactionid   || "";
            transactionDateElement.value = payment.bankTransfer.transactiondate || "";
        }

        if (payment.chequePayment) {
            sectionChequeElement.classList.remove("d-none");
            chequeNumberElement.value   = payment.chequePayment.chequenumber  || "";
            chequeBankNameElement.value = payment.chequePayment.bankname      || "";
            chequeBranchElement.value   = payment.chequePayment.branch        || "";
            chequeDateElement.value     = payment.chequePayment.chequedate    || "";
            clearingDateElement.value   = payment.chequePayment.clearingdate  || "";
            generateChequeStatusSelect();
            chequeStatusElement.value   = JSON.stringify({ name: payment.chequePayment.chequestatus });
        }

        if (payment.cardPayment) {
            sectionCardElement.classList.remove("d-none");
            generateCardTypeSelect();
            cardTypeElement.value      = JSON.stringify({ name: payment.cardPayment.cardtype });
            last4DigitsElement.value   = payment.cardPayment.last4digits     || "";
            cardRefNumberElement.value = payment.cardPayment.referencenumber || "";
        }

        refreshProofPreviewAvailability();

        // ── Note ──
        paymentNoteElement.value = payment.note || "";

        // ── User field is DISPLAY ONLY — shows whoever last touched the
        // record. It only gets reassigned to the current session user
        // inside handleSubmitPayment()/handleApprovePayment(), and only
        // if the record actually changed — see hasPaymentChanged().
        // Opening a record never reassigns it. ──
        userIdElement.value = payment.user?.username || payment.user?.id || "-";

        // ── Role-based button visibility only (fields stay interactive) ──
        applyRoleVisibility();

        formTitleElement.textContent = "Payment";

        myModal.show();
    };

    // Matches expensePayment.js: no privilege fetch, no field locking.
    // Submit/Approve/Reject visibility is based purely on the record's
    // own state (has a method been submitted? is it already Paid?).
    // Real access control is enforced server-side in
    // PaymentController.updateData() / approve / reject via
    // PrivilegeChecker, same as ExpensePaymentController.updateData().
    const applyRoleVisibility = () => {
        const submitAllowed  = canSubmitPayment();
        const approveAllowed = canApprovePayment();
        const rejectAllowed  = canRejectPayment();

        submitElement.classList.toggle("d-none", !submitAllowed);
        approveElement.classList.toggle("d-none", !approveAllowed);
        rejectElement.classList.toggle("d-none", !rejectAllowed);
    };


    // ============================================================
    // CHANGE DETECTION — decides whether "last updated by" should be
    // overwritten with the currently logged-in user.
    // ============================================================

    const hasPaymentChanged = () => {
        if (payment.paymentmethod !== oldPayment.paymentmethod) return true;
        if (payment.paidamount !== oldPayment.paidamount) return true;
        if (payment.paymentstatus !== oldPayment.paymentstatus) return true;
        if (JSON.stringify(payment.bankTransfer) !== JSON.stringify(oldPayment.bankTransfer)) return true;
        if (JSON.stringify(payment.chequePayment) !== JSON.stringify(oldPayment.chequePayment)) return true;
        if (JSON.stringify(payment.cardPayment) !== JSON.stringify(oldPayment.cardPayment)) return true;
        if ((payment.note || null) !== (oldPayment.note || null)) return true;
        return false;
    };


    // ============================================================
    // FORM ERROR CHECK (submission side)
    // ============================================================

    const checkFormErrors = () => {
        let errors = [];

        if (!activeFlow)
            errors.push("This record has no valid payment flow. Please check with support.");

        if (activeFlow === "farmer" && !payment.compostsale && !payment.quotation)
            errors.push("This record is missing its Compost Sale / Quotation source. Please check with support.");

        if (activeFlow === "supermarket" && !payment.supermarketOrder)
            errors.push("This record is missing its Supermarket Order reference. Please check with support.");

        if (!payment.paymentmethod) errors.push("Payment Method is required.");
        if (!payment.paidamount)    errors.push("Please enter the amount you're paying now.");
        if (!payment.user)          errors.push("User ID has an error. Please check again.");

        if (payment.bankTransfer) {
            if (!payment.bankTransfer.bankname)        errors.push("Bank Name is required for Bank Transfer.");
            if (!payment.bankTransfer.transactionid)   errors.push("Transaction ID is required for Bank Transfer.");
            if (!payment.bankTransfer.transactiondate) errors.push("Transaction Date is required for Bank Transfer.");
            if (!payment.bankTransfer.imageBase64)     errors.push("Receipt image is required for Bank Transfer.");
        }
        if (payment.chequePayment) {
            if (!payment.chequePayment.chequenumber) errors.push("Cheque Number is required.");
            if (!payment.chequePayment.bankname)     errors.push("Bank Name is required for Cheque.");
            if (!payment.chequePayment.branch)       errors.push("Branch is required for Cheque.");
            if (!payment.chequePayment.chequedate)   errors.push("Cheque Date is required.");
            if (!payment.chequePayment.imageBase64)  errors.push("Receipt image is required for Cheque.");
        }
        if (payment.cardPayment) {
            if (!payment.cardPayment.cardtype)        errors.push("Card Type is required.");
            if (!payment.cardPayment.last4digits)     errors.push("Last 4 digits are required.");
            if (!payment.cardPayment.referencenumber) errors.push("Reference Number is required.");
            if (!payment.cardPayment.imageBase64)     errors.push("Receipt image is required for Card.");
        }

        return errors;
    };


    // ============================================================
    // CRUD HANDLERS
    // ============================================================

    // Customer / update-privilege side: submit payment details for review.
    // This never sets status to "Paid" directly — only a manager approval
    // does that (see handleApprovePayment).
    //
    // IMPORTANT: only send the fields the backend actually needs for
    // update (id + paymentmethod + paidamount + paymentstatus + user +
    // note + the active payment-method sub-object). The full `payment`
    // object also carries read-only nested graphs (farmer, supermarket,
    // compostsale, quotation, supermarketOrder, ...) fetched on GET —
    // round-tripping those back through PUT makes Jackson try to
    // *deserialize* them into Java objects again, which fails/loses data
    // for entities that don't reconstruct cleanly this way. The backend
    // never reads those fields on update (it works off the already-loaded
    // DB record instead), so we don't send them. Same fix as
    // expensePayment.js's handleUpdate().
    const handleSubmitPayment = () => {
        const errors = checkFormErrors();
        if (errors.length > 0) {
            Notiflix.Notify.warning(errors.join(" | "));
            return;
        }

        if (hasPaymentChanged()) {
            loadLoggedInUserInto(payment, userIdElement);
        }

        let bankTransferPayload  = null;
        let cardPaymentPayload   = null;
        let chequePaymentPayload = null;

        if (payment.bankTransfer) {
            const bt = payment.bankTransfer;
            bankTransferPayload = {
                id:              bt.id || null, // keep so JPA updates the existing row, not insert-new
                bankname:        bt.bankname        || null,
                transactionid:   bt.transactionid   || null,
                transactiondate: bt.transactiondate || null,
                imageBase64:     bt.imageBase64      || null,
                imageRemoved:    bt.imageRemoved     || false,
            };
        }

        if (payment.cardPayment) {
            const cp = payment.cardPayment;
            cardPaymentPayload = {
                id:              cp.id || null,
                cardtype:        cp.cardtype        || null,
                last4digits:     cp.last4digits     || null,
                referencenumber: cp.referencenumber || null,
                imageBase64:     cp.imageBase64      || null,
                imageRemoved:    cp.imageRemoved     || false,
            };
        }

        if (payment.chequePayment) {
            const chq = payment.chequePayment;
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
            id:             payment.id,
            paymentmethod:  payment.paymentmethod,
            paidamount:     payment.paidamount,
            paymentstatus:  payment.paymentstatus,
            user:           payment.user,
            note:           payment.note || null,
            bankTransfer:   bankTransferPayload,
            cardPayment:    cardPaymentPayload,
            chequePayment:  chequePaymentPayload,
        };

        console.log("Submitting Payment:", updatePayload);

        let response = getHTTPServiceRequest("/payments/paymentlist/update", "PUT", updatePayload);

        if (response === "OK") {
            Notiflix.Notify.success("Payment submitted — awaiting manager approval.");
            $("#PaymentFormModal").modal("hide");
            loadInitialData();
            refreshPaymentTable();
            initializeForm();
        } else {
            Notiflix.Notify.warning("Submission failed: " + response);
        }
    };

    // Manager / approve-privilege side: confirm the submitted payment is
    // legitimate and mark the record Paid. Assumes a dedicated approve
    // endpoint mirroring the existing approval pattern used for
    // IngredientPrice / CompostPrice (flip status, stamp approving user).
    const handleApprovePayment = () => {
        if (!payment.paymentmethod) {
            Notiflix.Notify.warning("Nothing has been submitted for this payment yet.");
            return;
        }

        Notiflix.Confirm.show(
            "Approve Payment",
            "Confirm this payment has been verified and should be marked as Paid?",
            "Yes, Approve",
            "Cancel",
            () => {
                loadLoggedInUserInto(payment, userIdElement);

                let response = getHTTPServiceRequest(
                    "/payments/paymentlist/approve/" + payment.id,
                    "PUT",
                    { id: payment.id, user: payment.user, note: payment.note || null }
                );

                if (response === "OK") {
                    Notiflix.Notify.success("Payment approved.");
                    $("#PaymentFormModal").modal("hide");
                    loadInitialData();
                    refreshPaymentTable();
                    initializeForm();
                } else {
                    Notiflix.Notify.warning("Approval failed: " + response);
                }
            },
            () => {}
        );
    };

    // Manager / approve-privilege side: send a submitted payment back for
    // correction. Requires a note explaining why. Assumes a dedicated
    // reject endpoint that resets the submitted method details and
    // status server-side.
    const handleRejectPayment = () => {
        if (!payment.paymentmethod) {
            Notiflix.Notify.warning("Nothing has been submitted for this payment yet.");
            return;
        }
        if (!paymentNoteElement.value.trim()) {
            Notiflix.Notify.warning("Please add a note explaining why this payment is being rejected.");
            paymentNoteElement.focus();
            return;
        }

        payment.note = paymentNoteElement.value.trim();

        Notiflix.Confirm.show(
            "Reject Payment",
            "This will send the payment submission back for correction. Continue?",
            "Yes, Reject",
            "Cancel",
            () => {
                loadLoggedInUserInto(payment, userIdElement);

                let response = getHTTPServiceRequest(
                    "/payments/paymentlist/reject/" + payment.id,
                    "PUT",
                    { id: payment.id, user: payment.user, note: payment.note }
                );

                if (response === "OK") {
                    Notiflix.Notify.success("Payment rejected and sent back for correction.");
                    $("#PaymentFormModal").modal("hide");
                    loadInitialData();
                    refreshPaymentTable();
                    initializeForm();
                } else {
                    Notiflix.Notify.warning("Reject failed: " + response);
                }
            },
            () => {}
        );
    };


    // ============================================================
    // PRINT / VIEW
    // ============================================================

    const viewPaymentRecord = (dataOb) => {
        tdPaymentId.innerText     = dataOb.paymentno || dataOb.id || "-";
        tdPaymentType.innerText   = getPaymentTypeDisplay(dataOb).replace(/<[^>]+>/g, "");
        tdCustomer.innerText      = getCustomerDisplay(dataOb);
        tdOrderRef.innerText      = getOrderRefDisplay(dataOb);
        tdMethod.innerText        = dataOb.paymentmethod || "-";
        tdPaidAmount.innerText    = dataOb.paidamount    ? dataOb.paidamount.toFixed(2)   : "0.00";
        tdPaymentStatus.innerText = dataOb.paymentstatus || "-";
        tdPaymentDate.innerText   = dataOb.paymentdatetime
            ? dataOb.paymentdatetime.slice(0, 10)
            : "-";
        tdPaymentNote.innerText   = dataOb.note || "-";

        const editModalContent = paymentFormModalElement.querySelector(".modal-content");
        editModalContent.classList.add("blurred");

        const viewModal = new bootstrap.Modal(printViewModalElement);
        viewModal.show();

        printViewModalElement.addEventListener(
            "hidden.bs.modal",
            () => {
                editModalContent.classList.remove("blurred");
            },
            { once: true }
        );
    };

    const handlePrint = () => {
        viewPaymentRecord(payment);
    };

    const printPaymentRecord = () => {
        let newWindow = window.open();
        newWindow.document.write(
            "<html><head>" +
            "<title>Payment Details</title>" +
            '<link rel="stylesheet" href="/css/bootstrap-5.3.3/css/bootstrap.min.css">' +
            "</head><body>" +
            divCardPrintPayment.outerHTML +
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
        loadInitialData();
        initializeForm();
        initializeEventListeners();
        refreshPaymentTable();}
    window.initPage();

    window.printPaymentRecord = printPaymentRecord;

})();