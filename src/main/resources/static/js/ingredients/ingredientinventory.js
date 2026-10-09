(function () {
    let tableBody
        , txnModalElement
        , txnModalTitle
        , txnModalBody;
    const queryElements = () => {
        tableBody = document.querySelector("#tableBodyId");
        txnModalElement = document.querySelector("#InventoryTransactionModal");
        txnModalTitle = document.querySelector("#txnModalTitle");
        txnModalBody = document.querySelector("#txnModalBody");
    }
    let ingredientInventoryList = [];



    const loadInitialData = () => {
        ingredientInventoryList = getServiceRequest("/ingredient/ingredientinventory/alldata/selected");
    };

    const REORDER_LEVEL = 50; // fallback threshold — replace with per-ingredient value if you add one later

    const getStatusDisplay = (ob) => {
        if (ob.currentquantity <= 0) return '<p class="p-1 bg-danger ">Out of Stock</p>';
        if (ob.currentquantity < REORDER_LEVEL) return '<p class="p-1 bg-warning">Low</p>';
        return '<p class="p-1 bg-success ">Normal</p>';
    };

    const refreshIngredientInventoryTable = () => {
        if ($.fn.DataTable.isDataTable("#tableIngredientInventory")) {
            $("#tableIngredientInventory").DataTable().destroy();
        }

        tableBody.innerHTML = "";

        let displayProperty = [
            { propertyName: (ob) => ob.ingredient?.name || "-", dataType: "function" },
            { propertyName: (ob) => ob.grade || "-", dataType: "function" },
            { propertyName: (ob) => ob.currentquantity != null ? ob.currentquantity.toFixed(2) + " " + (ob.ingredient?.unit || "") : "-", dataType: "function" },
            { propertyName: getStatusDisplay, dataType: "function" },
        ];

        fillDataIntoTableThree(
            tableBody,
            ingredientInventoryList,
            displayProperty,
            viewInventoryTransactions
        );

        $("#tableIngredientInventory").DataTable();
    };

    const viewInventoryTransactions = (ob) => {
        txnModalTitle.textContent = `${ob.ingredient?.name || "-"} — Grade ${ob.grade} Transactions`;

        const transactions = getServiceRequest(
            `/ingredient/ingredientinventory/transactions/${ob.ingredient.id}/${ob.grade}`
        );

        const unit = ob.ingredient?.unit || "";

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

                // Reference differs by source: quality-check IN transactions cite the
                // check number; compost-sale OUT transactions cite the sale number.
                const reference = t.sourceQualityCheckItem?.ingredientQualityCheck?.checkno
                    || t.sourceCompostSaleItem?.compostsale?.compostsalenumber
                    || "-";

                row.innerHTML = `
                <td>${dt}</td>
                <td>${typeLabel}</td>
                <td>${t.quantity ?? "-"} ${unit}</td>
                <td>${reference}</td>`;
                txnModalBody.appendChild(row);
            });
        }

        new bootstrap.Modal(txnModalElement).show();
    };
    window.initPage = function () {
        queryElements();
        loadInitialData();
        refreshIngredientInventoryTable();}
    window.initPage();

})();