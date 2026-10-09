// ============================================================
// DOM ELEMENT REFERENCES
// ============================================================
(function () {
    let purchaseOrderAddFormModalElement
        , tableBody
        ,selectSupplierElement
        ,selectPOStatusElement
        , selectSupplierIngredientElement
        , printViewPurchaseOrderModalElement
        , purchaseOrderForm
        , createdDateElement
        , updateDateElement
        , inputPOIDElement
        , dateExpectedElement
        , textAmountElement
        , userIdElement
        , textNoteElement
        , titleNewHide
        , titleEditHide
        , tablePOItemsBody
        , tdTotalAmountElement
        , buttonAddPOItem
        , textPOQtyElement
        , addNewPurchaseOrderElement
        , submitElement
        , updateElement
        , clearElement
        , printElement
        , deleteElement;
    const queryElements = () => {
         purchaseOrderAddFormModalElement = document.querySelector("#PurchaseOrderAddForm");
         tableBody = document.querySelector("#tableBodyId");
         selectSupplierElement = document.querySelector("#selectSupplier");
         selectPOStatusElement = document.querySelector("#selectPOStatus");
         selectSupplierIngredientElement = document.querySelector("#selectSupplierIngredient");
         printViewPurchaseOrderModalElement = document.querySelector("#PurchaseOrderViewModal");
         purchaseOrderForm = document.querySelector("#formPurchaseOrder");
         createdDateElement = document.querySelector("#createdDate");
         updateDateElement = document.querySelector("#updateDate");
         inputPOIDElement = document.querySelector("#InputPOID");
         dateExpectedElement = document.querySelector("#dateExpected");
         textAmountElement = document.querySelector("#textAmount");
         userIdElement = document.querySelector("#userId");
         textNoteElement = document.querySelector("#textNote");
         titleNewHide = document.querySelector("#formTitleNew");
         titleEditHide = document.querySelector("#formTitleEdit");
         tablePOItemsBody = document.querySelector("#tablePOItemsBody");
         tdTotalAmountElement = document.querySelector("#tdTotalAmount");
         buttonAddPOItem = document.querySelector("#buttonAddPOItem");
         textPOQtyElement = document.querySelector("#textPOQty");
         addNewPurchaseOrderElement = document.querySelector("#addNewPurchaseOrderId");
         submitElement = document.querySelector("#buttonSubmit");
         updateElement = document.querySelector("#buttonUpdate");
         clearElement = document.querySelector("#buttonClear");
         printElement = document.querySelector("#buttonPrint");
         deleteElement = document.querySelector("#buttonDelete");
    }

// ============================================================
// STATE
// ============================================================

let purchaseOrderList    = [];
let purchaseOrder        = {};
let oldPurchaseOrder     = {};
let formMode             = "ADD";
let currentPOItems       = [];
let supplierList         = [];
let supplierIngredientList = [];
let poStatusList         = [];



// ============================================================
// EVENT LISTENERS
// ============================================================

const initializeEventListeners = () => {
    selectSupplierElement.addEventListener("change", validateSupplier);
    selectSupplierElement.addEventListener("change", handleSupplierChange);
    dateExpectedElement.addEventListener("input",    validateExpectedDate);
    selectPOStatusElement.addEventListener("change", validatePOStatus);
    // textNoteElement.addEventListener("input",        validateNote);
    buttonAddPOItem.addEventListener("click",        handleAddPOItem);

    submitElement.addEventListener("click", handleSubmit);
    updateElement.addEventListener("click", handleUpdate);
    clearElement.addEventListener("click",  handleClear);
    deleteElement.addEventListener("click", handleDelete);
    printElement.addEventListener("click",  handlePrint);

    addNewPurchaseOrderElement.addEventListener("click", () => {
        initializeForm();
        titleEditHide.classList.add("d-none");
        titleNewHide.classList.remove("d-none");
    });
};


// ============================================================
// LOAD INITIAL DATA
// ============================================================

const loadInitialData = () => {
    loadSuppliers();
    loadPOStatuses();
    purchaseOrderList = getServiceRequest("/ingredient/purchaseorder/alldata/selected");
};


// ============================================================
// INITIALIZE FORM
// ============================================================

const initializeForm = () => {
    purchaseOrder    = {};
    oldPurchaseOrder = {};
    formMode         = "ADD";
    currentPOItems   = [];

    purchaseOrderForm.reset();
    removeValidationStyles(purchaseOrderForm);

    inputPOIDElement.textContent  = "-";
    updateDateElement.textContent = "-";

    let dateTime = getTodayDateTime();
    createdDateElement.textContent = dateTime.slice(0, 10) + " " + dateTime.slice(11, 19);

    // Auto fill currently logged-in user as the record's user (creation case)
    loadLoggedInUserInto(purchaseOrder, userIdElement);
    userIdElement.readOnly = true;

    // Reset dropdowns
    generateSupplierSelect();
    generatePOStatusSelect();
    selectSupplierIngredientElement.innerHTML =
        '<option value="" selected disabled>Select Supplier Ingredient</option>';

    // Clear PO items table
    renderPOItemsTable();
    tdTotalAmountElement.textContent = "0.00";
    textAmountElement.value          = "";

    // Button visibility
    submitElement.classList.remove("d-none");
    updateElement.classList.add("d-none");
    deleteElement.classList.add("d-none");
    printElement.classList.add("d-none");

    // Re-enable all fields
    document.querySelectorAll("#formPurchaseOrder input, #formPurchaseOrder select, #formPurchaseOrder textarea")
        .forEach(el => el.disabled = false);
    userIdElement.readOnly = true;

    titleNewHide.classList.remove("d-none");
    titleEditHide.classList.add("d-none");
};


// ============================================================
// DROPDOWN — SUPPLIER
// ============================================================

const loadSuppliers = () => {

    supplierList = getServiceRequest("/ingredient/supplier/alldata/selected");
};

const generateSupplierSelect = () => {

    selectSupplierElement.innerHTML =
        '<option value="" selected disabled>Select Supplier</option>';

    supplierList.forEach((s) => {
        const option = document.createElement("option");
        option.value     = JSON.stringify(s);
        option.innerText = s.contactperson || s.companyname || s.id;
        selectSupplierElement.appendChild(option);
    });
};


// ============================================================
// DROPDOWN — PO STATUS
// ============================================================

const loadPOStatuses = () => {
    poStatusList = [
        { name: "Pending"   },
        { name: "Approved"  },
        { name: "Received"  },
        { name: "Cancelled" },
    ];
};

const generatePOStatusSelect = () => {
    fillDataIntoSelect(selectPOStatusElement, "Select PO Status", poStatusList, "name");
};


// ============================================================
// DROPDOWN — SUPPLIER INGREDIENTS (Active only, filtered by supplier)
// ============================================================

const loadSupplierIngredients = (supplierId) => {
    if (!supplierId) return;

    supplierIngredientList = getServiceRequest(
        "/ingredient/supplierhasingredient/bysupplier/active/" + supplierId
    );
    generateSupplierIngredientSelect();
};

const generateSupplierIngredientSelect = () => {
    selectSupplierIngredientElement.innerHTML =
        '<option value="" selected disabled>Select Supplier Ingredient</option>';

    supplierIngredientList.forEach((si) => {
        const option = document.createElement("option");
        option.value     = JSON.stringify(si);
        option.innerText = si.ingredient?.name || si.id || "-";
        selectSupplierIngredientElement.appendChild(option);
    });
};

const handleSupplierChange = () => {
    const value = selectSupplierElement.value;
    if (!value) return;
    const parsed = JSON.parse(value);

    // Clear existing items when supplier changes
    currentPOItems = [];
    renderPOItemsTable();
    recalcTotalAmount();

    loadSupplierIngredients(parsed.id);
};


// ============================================================
// VALIDATION
// ============================================================

const validateSupplier = () => {
    const value = selectSupplierElement.value;

    if (!value) {
        purchaseOrder.supplier = null;
        setInvalid(selectSupplierElement);
        return;
    }

    purchaseOrder.supplier = JSON.parse(value);

    if (formMode === "EDIT" &&
        JSON.stringify(purchaseOrder.supplier?.id) !== JSON.stringify(oldPurchaseOrder.supplier?.id)) {
        setUpdated(selectSupplierElement);
    } else {
        setValid(selectSupplierElement);
    }
};

const validateExpectedDate = () => {
    const value = dateExpectedElement.value;

    if (!value) {
        purchaseOrder.expecteddate = null;
        setInvalid(dateExpectedElement);
        return;
    }

    purchaseOrder.expecteddate = value;

    if (formMode === "EDIT" && value !== oldPurchaseOrder.expecteddate) {
        setUpdated(dateExpectedElement);
    } else {
        setValid(dateExpectedElement);
    }
};

const validatePOStatus = () => {
    const value = selectPOStatusElement.value;

    if (!value) {
        purchaseOrder.postatus = null;
        setInvalid(selectPOStatusElement);
        return;
    }

    const parsed = JSON.parse(value);
    purchaseOrder.postatus = parsed.name;

    if (formMode === "EDIT" && purchaseOrder.postatus !== oldPurchaseOrder.postatus) {
        setUpdated(selectPOStatusElement);
    } else {
        setValid(selectPOStatusElement);
    }
};



// ============================================================
// PO ITEMS — ADD / REMOVE
// ============================================================

const handleAddPOItem = () => {
    const siValue = selectSupplierIngredientElement.value;
    const qty     = parseFloat(textPOQtyElement.value);

    let hasError = false;

    if (!siValue) { setInvalid(selectSupplierIngredientElement); hasError = true; }
    if (isNaN(qty) || qty <= 0) { setInvalid(textPOQtyElement); hasError = true; }

    if (hasError) {
        Notiflix.Notify.warning("Please fill all required item fields correctly.");
        return;
    }

    const parsedSI = JSON.parse(siValue);

    // Prevent duplicate ingredient in same PO
    const exists = currentPOItems.some(
        item => item.supplierHasIngredient?.id === parsedSI.id
    );
    if (exists) {
        Notiflix.Notify.warning("This ingredient is already added to this PO.");
        return;
    }

    const unitprice = parsedSI.price || 0;

    currentPOItems.push({
        supplierHasIngredient: parsedSI,
        ingredient:            parsedSI.ingredient || null,
        quantity:              qty,
        unitprice:             unitprice,
        linetotalprice:        parseFloat((qty * unitprice).toFixed(2)),
    });

    renderPOItemsTable();
    recalcTotalAmount();

    selectSupplierIngredientElement.value = "";
    textPOQtyElement.value                = "";
    selectSupplierIngredientElement.classList.remove("is-valid", "is-invalid");
    textPOQtyElement.classList.remove("is-valid", "is-invalid");
};

const removePOItem = (index) => {
    currentPOItems.splice(index, 1);
    renderPOItemsTable();
    recalcTotalAmount();
};

const recalcTotalAmount = () => {
    const total = currentPOItems.reduce((sum, item) => sum + (item.linetotalprice || 0), 0);
    tdTotalAmountElement.textContent = total.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    textAmountElement.value  = total.toFixed(2);
    purchaseOrder.amount     = total;
};


// ============================================================
// RENDER PO ITEMS TABLE
// ============================================================

const renderPOItemsTable = () => {
    tablePOItemsBody.innerHTML = "";

    if (currentPOItems.length === 0) {
        tablePOItemsBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">No items added yet.</td>
            </tr>`;
        return;
    }

    currentPOItems.forEach((item, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.ingredient?.name || item.supplierHasIngredient?.ingredient?.name || "-"}</td>
            <td>${item.quantity}</td>
            <td>Rs. ${(item.unitprice || 0).toFixed(2)}</td>
            <td>Rs. ${(item.linetotalprice || 0).toFixed(2)}</td>
            <td>
                <button type="button" class="btn btn-sm btn-outline-danger"
                        onclick="removePOItem(${index})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>`;
        tablePOItemsBody.appendChild(row);
    });
};


// ============================================================
// REFRESH MAIN TABLE
// ============================================================

const refreshPurchaseOrderTable = () => {

    // Sort: Pending first
    purchaseOrderList.sort((a, b) => {
        const aPending = a.postatus === "Pending";
        const bPending = b.postatus === "Pending";
        if (aPending && !bPending) return -1;
        if (!aPending && bPending) return 1;
        return 0;
    });

    if ($.fn.DataTable.isDataTable("#tablePurchaseOrder")) {
        $("#tablePurchaseOrder").DataTable().destroy();
    }

    tableBody.innerHTML = "";

    let displayProperty = [
        { propertyName: getPONumber,        dataType: "function" },
        { propertyName: getSupplierDisplay, dataType: "function" },
        { propertyName: getCreatedDate,     dataType: "function" },
        { propertyName: getExpectedDate,    dataType: "function" },
        { propertyName: getAmountDisplay,   dataType: "function" },
        { propertyName: getPOStatusDisplay, dataType: "function" },
    ];

    fillDataIntoTableThree(
        tableBody,
        purchaseOrderList,
        displayProperty,
        refillPurchaseOrderForm
    );

    $("#tablePurchaseOrder").DataTable();
};

// Table display helpers
const getPONumber = (ob) => ob.ponumber || ob.id || "-";

// ← fixed: supplier has no 'name' field
const getSupplierDisplay = (ob) =>
    ob.supplier?.contactperson || ob.supplier?.companyname || "-";

const getCreatedDate = (ob) => ob.createddatetime
    ? ob.createddatetime.slice(0, 10) + " " + ob.createddatetime.slice(11, 19)
    : "-";

const getExpectedDate = (ob) => ob.expecteddate
    ? ob.expecteddate.slice(0, 10)
    : "-";

const getAmountDisplay = (ob) => ob.amount != null
    ? "Rs. " + Number(ob.amount).toFixed(2)
    : "-";

const getPOStatusDisplay = (ob) => {
    if (!ob.postatus) return "-";
    if (ob.postatus === "Pending")   return '<p class="p-1 bg-warning ">Pending</p>';
    if (ob.postatus === "Approved")  return '<p class="p-1 bg-success ">Approved</p>';
    if (ob.postatus === "Received")  return '<p class="p-1 bg-info ">Received</p>';
    if (ob.postatus === "Cancelled") return '<p class="p-1 bg-danger ">Cancelled</p>';
    return ob.postatus;
};


// ============================================================
// REFILL FORM — EDIT MODE
// ============================================================

const refillPurchaseOrderForm = (dataOb) => {
    removeValidationStyles(purchaseOrderForm);

    let myModal = new bootstrap.Modal(purchaseOrderAddFormModalElement, {});
    formMode = "EDIT";

    purchaseOrder    = getServiceRequest("/ingredient/purchaseorder/byid/" + dataOb.id);
    oldPurchaseOrder = JSON.parse(JSON.stringify(purchaseOrder));

    // Meta dates
    createdDateElement.textContent = purchaseOrder.createddatetime
        ? purchaseOrder.createddatetime.slice(0, 10) + " " + purchaseOrder.createddatetime.slice(11, 19)
        : "-";

    updateDateElement.textContent = purchaseOrder.updateddatetime
        ? purchaseOrder.updateddatetime.slice(0, 10) + " " + purchaseOrder.updateddatetime.slice(11, 19)
        : "-";

    inputPOIDElement.textContent = purchaseOrder.ponumber || purchaseOrder.id || "-";

    // Supplier
    // Supplier
    generateSupplierSelect();
    if (purchaseOrder.supplier) {
        const supplierId = purchaseOrder.supplier.id;
        for (const option of selectSupplierElement.options) {
            if (!option.value) continue;
            try {
                const parsed = JSON.parse(option.value);
                if (parsed.id === supplierId) {
                    selectSupplierElement.value = option.value;
                    break;
                }
            } catch (_) {}
        }
        loadSupplierIngredients(supplierId);
    }

    // Expected date
    dateExpectedElement.value = purchaseOrder.expecteddate
        ? purchaseOrder.expecteddate.slice(0, 10)
        : "";

    // User field is DISPLAY ONLY here — shows whoever is currently
    // stamped on the record (last updater, or creator if never
    // updated). We do NOT touch purchaseOrder.user on open. It only
    // gets reassigned to the current session user inside
    // handleUpdate(), and only if the record is actually changed and
    // saved — see hasPurchaseOrderChanged(). Opening or cancelling
    // never reassigns it.
    userIdElement.value    = purchaseOrder.user?.username || purchaseOrder.user?.id || "-";
    userIdElement.readOnly = true;

    // Amount
    textAmountElement.value = purchaseOrder.amount != null
        ? Number(purchaseOrder.amount).toFixed(2)
        : "";

    // PO Status
    generatePOStatusSelect();
    selectPOStatusElement.value = JSON.stringify({ name: purchaseOrder.postatus });


    // PO Items
    currentPOItems = purchaseOrder.purchaseOrderItems
        ? JSON.parse(JSON.stringify(purchaseOrder.purchaseOrderItems))
        : [];
    renderPOItemsTable();
    recalcTotalAmount();

    // Re-enable all fields first
    document.querySelectorAll("#formPurchaseOrder input, #formPurchaseOrder select, #formPurchaseOrder textarea")
        .forEach(el => el.disabled = false);
    userIdElement.readOnly = true;

    // ← Lock if Received or Cancelled — decision is final
    const isLocked = purchaseOrder.postatus === "Received" ||
        purchaseOrder.postatus === "Cancelled";

    if (isLocked) {
        document.querySelectorAll("#formPurchaseOrder input, #formPurchaseOrder select, #formPurchaseOrder textarea")
            .forEach(el => el.disabled = true);
        updateElement.disabled = true;
        deleteElement.classList.add("d-none");
        Notiflix.Notify.info(
            `This PO is ${purchaseOrder.postatus}. No further changes allowed.`
        );
    }

    // Button visibility
    submitElement.classList.add("d-none");
    updateElement.classList.remove("d-none");
    deleteElement.classList.remove("d-none");
    printElement.classList.remove("d-none");

    // Hide delete if not Pending
    if (purchaseOrder.postatus !== "Pending") {
        deleteElement.classList.add("d-none");
    }

    titleNewHide.classList.add("d-none");
    titleEditHide.classList.remove("d-none");

    myModal.show();
};


// ============================================================
// CHANGE DETECTION — used to decide whether the "last updated by"
// user should be overwritten with the currently logged-in user.
// ============================================================

// Normalizes PO items to a comparable, order-independent shape.
const normalizePOItems = (items) => {
    return (items || [])
        .map(item => ({
            id: item.supplierHasIngredient?.id,
            quantity: Number(item.quantity),
            unitprice: Number(item.unitprice)
        }))
        .sort((a, b) => (a.id > b.id ? 1 : a.id < b.id ? -1 : 0));
};

// Returns true if supplier, expected date, PO status, note, or PO
// items differ from the original snapshot taken when the record was
// opened for edit.
const hasPurchaseOrderChanged = () => {
    if ((purchaseOrder.supplier?.id || null) !== (oldPurchaseOrder.supplier?.id || null)) return true;
    if (purchaseOrder.expecteddate !== oldPurchaseOrder.expecteddate) return true;
    if (purchaseOrder.postatus !== oldPurchaseOrder.postatus) return true;


    const itemsChanged = JSON.stringify(normalizePOItems(currentPOItems))
        !== JSON.stringify(normalizePOItems(oldPurchaseOrder.purchaseOrderItems));
    if (itemsChanged) return true;

    return false;
};


// ============================================================
// FORM ERROR CHECK
// ============================================================

const checkFormErrors = () => {
    let errors = [];

    if (!purchaseOrder.supplier)     errors.push("Supplier has an error. Please check again.");
    if (!purchaseOrder.postatus)     errors.push("PO Status has an error. Please check again.");
    if (!purchaseOrder.expecteddate) errors.push("Expected Date has an error. Please check again.");
    if (!purchaseOrder.user)         errors.push("User ID has an error. Please check again.");
    if (currentPOItems.length === 0) errors.push("At least one item is required.");

    return errors;
};


// ============================================================
// CRUD HANDLERS
// ============================================================

const handleSubmit = () => {
    const errors = checkFormErrors();
    if (errors.length > 0) {
        Notiflix.Notify.warning(errors.join(" | "));
        return;
    }

    purchaseOrder.purchaseOrderItems = currentPOItems;

    console.log("Submitting Purchase Order:", purchaseOrder);

    let response = getHTTPServiceRequest("/ingredient/purchaseorder/save", "POST", purchaseOrder);

    if (response === "OK") {
        Notiflix.Notify.success("Saved successfully");
        $("#PurchaseOrderAddForm").modal("hide");
        loadInitialData();
        refreshPurchaseOrderTable();
        initializeForm();
    } else {
        Notiflix.Notify.warning("Save failed: " + response);
    }
};

const handleUpdate = () => {
    const errors = checkFormErrors();
    if (errors.length > 0) {
        Notiflix.Notify.warning(errors.join(" | "));
        return;
    }

    // Only reassign "who touched this record" if something actually
    // changed. Records saved without any real edit keep whoever was
    // already stamped on them.
    if (hasPurchaseOrderChanged()) {
        loadLoggedInUserInto(purchaseOrder, userIdElement);
    }

    purchaseOrder.purchaseOrderItems = currentPOItems;

    console.log("Updating Purchase Order:", purchaseOrder);

    let response = getHTTPServiceRequest("/ingredient/purchaseorder/update", "PUT", purchaseOrder);

    if (response === "OK") {
        updateDateElement.textContent = new Date().toLocaleString();
        Notiflix.Notify.success("Updated successfully");
        $("#PurchaseOrderAddForm").modal("hide");
        loadInitialData();
        refreshPurchaseOrderTable();
        initializeForm();
    } else {
        Notiflix.Notify.warning("Update failed: " + response);
    }
};

const handleDelete = () => {
    Notiflix.Confirm.show(
        "Delete Purchase Order",
        "Are you sure you want to delete this Purchase Order?",
        "Yes, Delete",
        "Cancel",
        () => {
            let response = getHTTPServiceRequest(
                "/ingredient/purchaseorder/" + purchaseOrder.id,
                "DELETE",
                null
            );

            if (response === "OK") {
                Notiflix.Notify.success("Deleted successfully");
                $("#PurchaseOrderAddForm").modal("hide");
                loadInitialData();
                refreshPurchaseOrderTable();
                initializeForm();
            } else {
                Notiflix.Notify.failure("Delete failed: " + response);
            }
        },
        () => {
            Notiflix.Notify.info("Delete cancelled");
        }
    );
};

const handleClear = () => {
    Notiflix.Confirm.show(
        "Clear Form",
        "Are you sure you want to clear the form?",
        "Yes, Clear",
        "Cancel",
        () => { initializeForm(); },
        () => {}
    );
};


// ============================================================
// PRINT / VIEW
// ============================================================

const viewPurchaseOrderRecord = (dataOb) => {
    document.querySelector("#tdPOID").innerText     = dataOb.ponumber || dataOb.id || "-";

    // ← fixed: supplier has no 'name' field
    document.querySelector("#tdSupplier").innerText =
        dataOb.supplier?.contactperson || dataOb.supplier?.companyname || "-";

    document.querySelector("#tdCreatedDate").innerText = dataOb.createddatetime
        ? dataOb.createddatetime.slice(0, 10) + " " + dataOb.createddatetime.slice(11, 19)
        : "-";
    document.querySelector("#tdExpectedDate").innerText = dataOb.expecteddate
        ? dataOb.expecteddate.slice(0, 10)
        : "-";
    document.querySelector("#tdAmount").innerText   = dataOb.amount != null
        ? "Rs. " + Number(dataOb.amount).toFixed(2)
        : "-";
    document.querySelector("#tdPOStatus").innerText = dataOb.postatus || "-";

    // Items
    const printBody = document.querySelector("#tablePrintPOItemsBody");
    printBody.innerHTML = "";

    const items = dataOb.purchaseOrderItems || currentPOItems || [];
    items.forEach((item, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.ingredient?.name || item.supplierHasIngredient?.ingredient?.name || "-"}</td>
            <td>${item.quantity}</td>
            <td>Rs. ${(item.unitprice || 0).toFixed(2)}</td>
            <td>Rs. ${(item.linetotalprice || 0).toFixed(2)}</td>`;
        printBody.appendChild(tr);
    });

    const editModalContent = purchaseOrderAddFormModalElement.querySelector(".modal-content");
    editModalContent.classList.add("blurred");

    const viewModal = new bootstrap.Modal(printViewPurchaseOrderModalElement);
    viewModal.show();

    printViewPurchaseOrderModalElement.addEventListener(
        "hidden.bs.modal",
        () => { editModalContent.classList.remove("blurred"); },
        { once: true }
    );
};

const handlePrint = () => {
    viewPurchaseOrderRecord(purchaseOrder);
};

const printPurchaseOrderRecord = () => {
    let newWindow = window.open();
    newWindow.document.write(
        "<html><head>" +
        "<title>Purchase Order Details</title>" +
        '<link rel="stylesheet" href="/css/bootstrap-5.3.3/css/bootstrap.min.css">' +
        "</head><body>" +
        document.querySelector("#divCardPrintPurchaseOrder").outerHTML +
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
        refreshPurchaseOrderTable();}
window.initPage();

window.removePOItem = removePOItem;
window.printPurchaseOrderRecord = printPurchaseOrderRecord;
})();