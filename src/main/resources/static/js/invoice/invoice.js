// ============================================================
// DOM ELEMENT REFERENCES
// ============================================================
(function () {

    let tableBody
        , invoiceDetailModalElement
        , printViewModalElement
        , transactionPreviewModalElement

        , invoiceRegDateElement
        , invoiceUpdateDateElement
        , invoiceRegNoElement

        , displayPartyTypeElement
        , displaySourceTypeElement
        , displayUserElement
        , displaySourceReferenceElement

        , displayInvoiceNumberElement
        , displayIssuedToElement
        , displayIssuedDateElement
        , displayDueDateElement
        , displayTotalAmountElement
        , displayPaidAmountElement
        , displayRemainingAmountElement
        , displayInvoiceStatusElement
        , displayNotesElement

        , tableBodyTransactionsElement
        , printElement

        , tdInvoiceNumber
        , tdIssuedTo
        , tdPartyType
        , tdSourceType
        , tdIssuedDate
        , tdDueDate
        , tdTotalAmount
        , tdPaidAmount
        , tdRemainingAmount
        , tdInvoiceStatus
        , tdInvoiceNotes
        , divCardPrintInvoice

        , tdTxnInvoiceNumber
        , tdTxnType
        , tdTxnReference
        , tdTxnAmount
        , tdTxnDate
        , tdTxnAddedDateTime
        , divCardPrintTransaction;

    const queryElements = () => {
        tableBody = document.querySelector("#tableBodyInvoice");

        invoiceDetailModalElement      = document.querySelector("#InvoiceDetailModal");
        printViewModalElement          = document.querySelector("#InvoiceViewModal");
        transactionPreviewModalElement = document.querySelector("#TransactionPreviewModal");

        invoiceRegDateElement    = document.querySelector("#invoiceRegDate");
        invoiceUpdateDateElement = document.querySelector("#invoiceUpdateDate");
        invoiceRegNoElement      = document.querySelector("#invoiceRegNo");

        displayPartyTypeElement       = document.querySelector("#displayPartyType");
        displaySourceTypeElement      = document.querySelector("#displaySourceType");
        displayUserElement            = document.querySelector("#displayUser");
        displaySourceReferenceElement = document.querySelector("#displaySourceReference");

        displayInvoiceNumberElement   = document.querySelector("#displayInvoiceNumber");
        displayIssuedToElement        = document.querySelector("#displayIssuedTo");
        displayIssuedDateElement      = document.querySelector("#displayIssuedDate");
        displayDueDateElement         = document.querySelector("#displayDueDate");
        displayTotalAmountElement     = document.querySelector("#displayTotalAmount");
        displayPaidAmountElement      = document.querySelector("#displayPaidAmount");
        displayRemainingAmountElement = document.querySelector("#displayRemainingAmount");
        displayInvoiceStatusElement   = document.querySelector("#displayInvoiceStatus");
        displayNotesElement           = document.querySelector("#displayNotes");

        tableBodyTransactionsElement = document.querySelector("#tableBodyTransactions");
        printElement = document.querySelector("#buttonInvoicePrint");

        tdInvoiceNumber     = document.querySelector("#tdInvoiceNumber");
        tdIssuedTo          = document.querySelector("#tdIssuedTo");
        tdPartyType         = document.querySelector("#tdPartyType");
        tdSourceType        = document.querySelector("#tdSourceType");
        tdIssuedDate        = document.querySelector("#tdIssuedDate");
        tdDueDate           = document.querySelector("#tdDueDate");
        tdTotalAmount       = document.querySelector("#tdTotalAmount");
        tdPaidAmount        = document.querySelector("#tdPaidAmount");
        tdRemainingAmount   = document.querySelector("#tdRemainingAmount");
        tdInvoiceStatus     = document.querySelector("#tdInvoiceStatus");
        tdInvoiceNotes      = document.querySelector("#tdInvoiceNotes");
        divCardPrintInvoice = document.querySelector("#divCardPrintInvoice");

        tdTxnInvoiceNumber   = document.querySelector("#tdTxnInvoiceNumber");
        tdTxnType            = document.querySelector("#tdTxnType");
        tdTxnReference       = document.querySelector("#tdTxnReference");
        tdTxnAmount          = document.querySelector("#tdTxnAmount");
        tdTxnDate            = document.querySelector("#tdTxnDate");
        tdTxnAddedDateTime   = document.querySelector("#tdTxnAddedDateTime");
        divCardPrintTransaction = document.querySelector("#divCardPrintTransaction");
    };


// ============================================================
// STATE
// ============================================================

    let invoiceList = [];
    let currentInvoice = {};
    let currentTransactions = [];
    let currentTransaction = {};


// ============================================================
// EVENT LISTENERS
// ============================================================

    const initializeEventListeners = () => {
        printElement.addEventListener("click", handlePrint);
    };


// ============================================================
// LOAD INITIAL DATA
// ============================================================

    const loadInitialData = () => {
        invoiceList = getServiceRequest("/invoice/invoicelist/alldata/selected");
    };


// ============================================================
// REFRESH TABLE
// ============================================================

    const refreshInvoiceTable = () => {
        if ($.fn.DataTable.isDataTable("#tableInvoice")) {
            $("#tableInvoice").DataTable().destroy();
        }

        tableBody.innerHTML = "";

        let displayProperty = [
            { propertyName: "invoicenumber",           dataType: "string"   },
            { propertyName: "issuedto",                dataType: "string"   },
            { propertyName: getPartyTypeDisplay,        dataType: "function" },
            { propertyName: getSourceTypeDisplay,        dataType: "function" },
            { propertyName: getIssuedDateDisplay,        dataType: "function" },
            { propertyName: getDueDateDisplay,           dataType: "function" },
            { propertyName: getTotalAmountDisplay,       dataType: "function" },
            { propertyName: getPaidAmountDisplay,        dataType: "function" },
            { propertyName: getRemainingAmountDisplay,   dataType: "function" },
            { propertyName: getInvoiceStatusBadge,       dataType: "function" },
        ];

        fillDataIntoTableThree(
            tableBody,
            invoiceList,
            displayProperty,
            openInvoiceDetail
        );

        $("#tableInvoice").DataTable();
    };

// Table display helpers
    const getPartyTypeDisplay   = (ob) => ob.partytype   || "-";
    const getSourceTypeDisplay  = (ob) => ob.sourcetype  || "-";
    const getIssuedDateDisplay  = (ob) => ob.issueddate
        ? ob.issueddate.slice(0, 16).replace("T", " ") : "-";
    const getDueDateDisplay     = (ob) => ob.duedate
        ? ob.duedate.slice(0, 10) : "-";
    const getTotalAmountDisplay = (ob) => ob.totalamount != null
        ? "Rs. " + ob.totalamount.toFixed(2) : "-";
    const getPaidAmountDisplay  = (ob) => ob.paidamount != null
        ? "Rs. " + ob.paidamount.toFixed(2) : "Rs. 0.00";
    const getRemainingAmountDisplay = (ob) => {
        const remaining = ob.remainingamount != null
            ? ob.remainingamount
            : (ob.totalamount || 0) - (ob.paidamount || 0);
        return "Rs. " + remaining.toFixed(2);
    };
    const getInvoiceStatusBadge = (ob) => {
        if (!ob.invoicestatus) return "-";
        if (ob.invoicestatus === "Paid")     return '<p class="p-1 bg-success">Paid</p>';
        if (ob.invoicestatus === "Partial")  return '<p class="p-1 bg-warning text-dark">Partial</p>';
        if (ob.invoicestatus === "Unpaid")   return '<p class="p-1 bg-danger">Unpaid</p>';
        if (ob.invoicestatus === "Overdue")  return '<p class="p-1 bg-dark">Overdue</p>';
        return ob.invoicestatus;
    };


// ============================================================
// SOURCE REFERENCE LABEL (for display only, no editing)
// ============================================================

    const getSourceReferenceLabel = (inv) => {
        if (inv.partytype === "Supermarket" && inv.supermarketorder) {
            return "Supermarket Order #" + (inv.supermarketorder.number || inv.supermarketorder.id);
        }
        if (inv.partytype === "Supplier" && inv.grnIngredients) {
            return "GRN Ingredient #" + (inv.grnIngredients.number || inv.grnIngredients.id);
        }
        if (inv.partytype === "Farmer" && inv.sourcetype === "Order" && inv.compostsale) {
            return "Compost Sale #" + (inv.compostsale.salenumber || inv.compostsale.id);
        }
        if (inv.partytype === "Farmer" && inv.sourcetype === "GRN" && inv.grnCrop) {
            return "GRN Crop #" + (inv.grnCrop.number || inv.grnCrop.id);
        }
        return "-";
    };


// ============================================================
// OPEN INVOICE DETAIL (READ-ONLY VIEW)
// ============================================================

    const openInvoiceDetail = (dataOb) => {
        let myModal = new bootstrap.Modal(invoiceDetailModalElement, {});

        currentInvoice = getServiceRequest("/invoice/invoicelist/byid/" + dataOb.id);

        invoiceRegDateElement.textContent = currentInvoice.addeddatetime
            ? currentInvoice.addeddatetime.slice(0, 10) + " " + currentInvoice.addeddatetime.slice(11, 19)
            : "-";

        invoiceUpdateDateElement.textContent = currentInvoice.updateddatetime
            ? currentInvoice.updateddatetime.slice(0, 10) + " " + currentInvoice.updateddatetime.slice(11, 19)
            : "-";

        invoiceRegNoElement.textContent = currentInvoice.invoicenumber || currentInvoice.id || "-";

        displayPartyTypeElement.value       = currentInvoice.partytype  || "-";
        displaySourceTypeElement.value      = currentInvoice.sourcetype || "-";
        displayUserElement.value            = currentInvoice.user?.username || currentInvoice.user?.id || "-";
        displaySourceReferenceElement.value = getSourceReferenceLabel(currentInvoice);

        displayInvoiceNumberElement.value = currentInvoice.invoicenumber || "-";
        displayIssuedToElement.value      = currentInvoice.issuedto      || "-";
        displayIssuedDateElement.value    = currentInvoice.issueddate
            ? currentInvoice.issueddate.slice(0, 16).replace("T", " ") : "-";
        displayDueDateElement.value       = currentInvoice.duedate
            ? currentInvoice.duedate.slice(0, 10) : "-";

        const total = currentInvoice.totalamount || 0;
        const paid  = currentInvoice.paidamount  || 0;
        const remaining = currentInvoice.remainingamount != null
            ? currentInvoice.remainingamount
            : total - paid;

        displayTotalAmountElement.value     = "Rs. " + total.toFixed(2);
        displayPaidAmountElement.value      = "Rs. " + paid.toFixed(2);
        displayRemainingAmountElement.value = "Rs. " + remaining.toFixed(2);
        displayInvoiceStatusElement.value   = currentInvoice.invoicestatus || "-";
        displayNotesElement.value           = currentInvoice.notes || "-";

        loadTransactionsForInvoice(currentInvoice.id);

        myModal.show();
    };


// ============================================================
// TRANSACTIONS UNDER THIS INVOICE
// ============================================================

    const loadTransactionsForInvoice = (invoiceId) => {
        currentTransactions = getServiceRequest("/invoice/invoicedetails/alldata/byinvoice/" + invoiceId) || [];
        renderTransactionsTable();
    };

    const getTransactionType = (txn) => {
        if (txn.payment) return "Payment";
        if (txn.expensePayment) return "Expense Payment";
        return "-";
    };

    const getTransactionReference = (txn) => {
        const src = txn.payment || txn.expensePayment;
        if (!src) return "-";
        return src.paymentno || src.number || src.reference || src.paymentnumber || ("#" + src.id);
    };

    const getTransactionAmount = (txn) => {
        if (txn.amount != null) return txn.amount;
        const src = txn.payment || txn.expensePayment;
        if (!src) return 0;
        return src.amount ?? src.paidamount ?? src.totalamount ?? 0;
    };

    const getTransactionDate = (txn) => {
        const src = txn.payment || txn.expensePayment;
        const raw = (src && (src.paymentdate || src.date)) || txn.addeddatetime;
        return raw ? raw.slice(0, 16).replace("T", " ") : "-";
    };

    const renderTransactionsTable = () => {
        tableBodyTransactionsElement.innerHTML = "";

        if (!currentTransactions.length) {
            tableBodyTransactionsElement.innerHTML =
                '<tr><td colspan="6" class="text-center text-muted">No transactions found for this invoice</td></tr>';
            return;
        }

        currentTransactions.forEach((txn, index) => {
            const row = document.createElement("tr");
            row.innerHTML =
                "<td>" + (index + 1) + "</td>" +
                "<td>" + getTransactionType(txn) + "</td>" +
                "<td>" + getTransactionReference(txn) + "</td>" +
                "<td>Rs. " + Number(getTransactionAmount(txn)).toFixed(2) + "</td>" +
                "<td>" + getTransactionDate(txn) + "</td>" +
                '<td><button type="button" class="btn btn-sm btn-outline-info buttonTransactionPreview">' +
                '<i class="fa-solid fa-eye"></i> Preview</button></td>';

            row.querySelector(".buttonTransactionPreview")
                .addEventListener("click", () => previewTransaction(txn));

            tableBodyTransactionsElement.appendChild(row);
        });
    };


// ============================================================
// TRANSACTION PREVIEW (ONE BY ONE)
// ============================================================

    const previewTransaction = (txn) => {
        currentTransaction = txn;

        tdTxnInvoiceNumber.innerText = currentInvoice.invoicenumber || "-";
        tdTxnType.innerText          = getTransactionType(txn);
        tdTxnReference.innerText     = getTransactionReference(txn);
        tdTxnAmount.innerText        = "Rs. " + Number(getTransactionAmount(txn)).toFixed(2);
        tdTxnDate.innerText          = getTransactionDate(txn);
        tdTxnAddedDateTime.innerText = txn.addeddatetime
            ? txn.addeddatetime.slice(0, 10) + " " + txn.addeddatetime.slice(11, 19) : "-";

        const detailModalContent = invoiceDetailModalElement.querySelector(".modal-content");
        detailModalContent.classList.add("blurred");

        const previewModal = new bootstrap.Modal(transactionPreviewModalElement);
        previewModal.show();

        transactionPreviewModalElement.addEventListener(
            "hidden.bs.modal",
            () => {
                detailModalContent.classList.remove("blurred");
            },
            { once: true }
        );
    };

    const printTransactionRecord = () => {
        let newWindow = window.open();
        newWindow.document.write(
            "<html><head>" +
            "<title>Transaction Details</title>" +
            '<link rel="stylesheet" href="/css/bootstrap-5.3.3/css/bootstrap.min.css">' +
            "</head><body>" +
            divCardPrintTransaction.outerHTML +
            "</body></html>"
        );
        setTimeout(() => {
            newWindow.stop();
            newWindow.print();
            newWindow.close();
        }, 500);
    };


// ============================================================
// FULL INVOICE PRINT / VIEW
// ============================================================

    const viewInvoiceRecord = (dataOb) => {
        const total = dataOb.totalamount || 0;
        const paid  = dataOb.paidamount  || 0;
        const bal   = dataOb.remainingamount != null ? dataOb.remainingamount : total - paid;

        tdInvoiceNumber.innerText = dataOb.invoicenumber || "-";
        tdIssuedTo.innerText      = dataOb.issuedto      || "-";
        tdPartyType.innerText     = dataOb.partytype     || "-";
        tdSourceType.innerText    = dataOb.sourcetype    || "-";
        tdIssuedDate.innerText    = dataOb.issueddate
            ? dataOb.issueddate.slice(0, 16).replace("T", " ") : "-";
        tdDueDate.innerText       = dataOb.duedate
            ? dataOb.duedate.slice(0, 10) : "-";
        tdTotalAmount.innerText     = "Rs. " + total.toFixed(2);
        tdPaidAmount.innerText      = "Rs. " + paid.toFixed(2);
        tdRemainingAmount.innerText = "Rs. " + bal.toFixed(2);
        tdInvoiceStatus.innerText = dataOb.invoicestatus || "-";
        tdInvoiceNotes.innerText  = dataOb.notes         || "-";

        const detailModalContent = invoiceDetailModalElement.querySelector(".modal-content");
        detailModalContent.classList.add("blurred");

        const viewModal = new bootstrap.Modal(printViewModalElement);
        viewModal.show();

        printViewModalElement.addEventListener(
            "hidden.bs.modal",
            () => {
                detailModalContent.classList.remove("blurred");
            },
            { once: true }
        );
    };

    const handlePrint = () => {
        viewInvoiceRecord(currentInvoice);
    };

    const printInvoiceRecord = () => {
        let newWindow = window.open();
        newWindow.document.write(
            "<html><head>" +
            "<title>Invoice Details</title>" +
            '<link rel="stylesheet" href="/css/bootstrap-5.3.3/css/bootstrap.min.css">' +
            "</head><body>" +
            divCardPrintInvoice.outerHTML +
            "</body></html>"
        );
        setTimeout(() => {
            newWindow.stop();
            newWindow.print();
            newWindow.close();
        }, 500);
    };


// ============================================================
    window.initPage = function () {
        queryElements();
        loadInitialData();
        initializeEventListeners();
        refreshInvoiceTable();
    };
    window.initPage();

    window.printInvoiceRecord = printInvoiceRecord;
    window.printTransactionRecord = printTransactionRecord;
})();