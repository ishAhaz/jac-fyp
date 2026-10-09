

(function () {
    let tableBody
        ,txnModalElement
        ,txnModalTitle
        ,txnModalBody;
    const queryElements = () => {
        tableBody = document.querySelector("#tableBodyId");
        txnModalElement = document.querySelector("#InventoryTransactionModal");
        txnModalTitle = document.querySelector("#txnModalTitle");
        txnModalBody = document.querySelector("#txnModalBody");
    }
let cropInventoryList = [];


const loadInitialData = () => {
    cropInventoryList = getServiceRequest("/crop/cropinventory/alldata/selected");
};

const REORDER_LEVEL = 50; // fallback threshold — replace with per-crop value if you add one later

const getStatusDisplay = (ob) => {
    if (ob.currentquantity <= 0) return '<p class="p-1 bg-danger ">Out of Stock</p>';
    if (ob.currentquantity < REORDER_LEVEL) return '<p class="p-1 bg-warning">Low</p>';
    return '<p class="p-1 bg-success ">Normal</p>';
};

const refreshCropInventoryTable = () => {
    if ($.fn.DataTable.isDataTable("#tableCropInventory")) {
        $("#tableCropInventory").DataTable().destroy();
    }

    tableBody.innerHTML = "";

    let displayProperty = [
        { propertyName: (ob) => ob.crop?.name || "-", dataType: "function" },
        { propertyName: (ob) => ob.grade || "-", dataType: "function" },
        { propertyName: (ob) => ob.currentquantity != null ? ob.currentquantity.toFixed(2) + " kg" : "-", dataType: "function" },
        { propertyName: getStatusDisplay, dataType: "function" },
    ];

    fillDataIntoTableThree(
        tableBody,
        cropInventoryList,
        displayProperty,
        viewInventoryTransactions
    );

    $("#tableCropInventory").DataTable();
};

const viewInventoryTransactions = (ob) => {
    txnModalTitle.textContent = `${ob.crop?.name || "-"} — Grade ${ob.grade} Transactions`;

    const transactions = getServiceRequest(
        `/crop/cropinventory/transactions/${ob.crop.id}/${ob.grade}`
    );

    txnModalBody.innerHTML = "";
    if (!transactions || transactions.length === 0) {
        txnModalBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No transactions found.</td></tr>`;
    } else {
        transactions.forEach((t) => {
            const row = document.createElement("tr");
            const dt = t.transactiondatetime ? t.transactiondatetime.slice(0, 10) + " " + t.transactiondatetime.slice(11, 19) : "-";
            const typeLabel = t.transactiontype === "IN"
                ? '<span class="text-success fw-bold">IN</span>'
                : '<span class="text-danger fw-bold">' + t.transactiontype + '</span>';

            // Reference can come from either source — a quality check item (IN,
            // from GRN approval) or a supermarket order item (OUT, from order
            // confirmation/release). Only one is ever populated on a given row.
            const reference = t.sourceQualityCheckItem?.cropQualityCheck?.checkno
                || t.sourceSupermarketOrderItem?.supermarketorder?.number
                || "-";

            row.innerHTML = `
        <td>${dt}</td>
        <td>${typeLabel}</td>
        <td>${t.quantity ?? "-"} kg</td>
        <td>${reference}</td>
        `;
            txnModalBody.appendChild(row);
        });
    }

    new bootstrap.Modal(txnModalElement).show();
};

// window
    window.initPage = function () {

        queryElements();
        loadInitialData();
        refreshCropInventoryTable();
    }


window.initPage();


})();