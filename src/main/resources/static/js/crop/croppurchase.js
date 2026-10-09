// ============================================================
// DOM ELEMENT REFERENCES
// ============================================================

(function () {

    let cropPurchaseAddFormModalElement
        ,  tableBody
        , selectFarmer
        , selectPOStatus
        , selectItemCrop
        , printViewCropPurchaseModalElement
        , cropPurchaseForm
        , addNewCropPurchaseElement
        , regDateElement
        , updateDateElement
        , poIdElement
        ,  userIdElement
        ,dateExpected
        ,  textAmount
        ,  numberItemQty
        ,  buttonAddPOItem
        ,  tableItemsBody
        ,   tdTotalAmount
        ,   titleEditHide
        ,  titleNewHide
        ,  submitElement
        ,  updateElement
        ,  clearElement
        , printElement
        , deleteElement;
    const queryElements = () => {
         cropPurchaseAddFormModalElement = document.querySelector("#CropPurchaseAddForm");
         tableBody = document.querySelector("#tableBodyId");

         selectFarmer = document.querySelector("#selectFarmer");
         selectPOStatus = document.querySelector("#selectPOStatus");
         selectItemCrop = document.querySelector("#selectItemCrop");

         printViewCropPurchaseModalElement = document.querySelector("#CropPurchaseViewModal");

         cropPurchaseForm = document.querySelector("#formCropPurchase");
         addNewCropPurchaseElement = document.querySelector("#addNewCropPurchaseId");
         regDateElement = document.querySelector("#regDate");
         updateDateElement = document.querySelector("#updateDate");
         poIdElement = document.querySelector("#InputPOID");
         userIdElement = document.querySelector("#userId");
         dateExpected = document.querySelector("#dateExpected");
         textAmount = document.querySelector("#textAmount");


         numberItemQty = document.querySelector("#numberItemQty");
         buttonAddPOItem = document.querySelector("#buttonAddPOItem");

         tableItemsBody = document.querySelector("#tableItemsBody");
         tdTotalAmount = document.querySelector("#tdTotalAmount");

         titleEditHide = document.querySelector("#formTitleEdit");
         titleNewHide = document.querySelector("#formTitleNew");

         submitElement = document.querySelector("#buttonSubmit");
         updateElement = document.querySelector("#buttonUpdate");
         clearElement = document.querySelector("#buttonClear");
         printElement = document.querySelector("#buttonPrint");
         deleteElement = document.querySelector("#buttonDelete");
    }

// ============================================================
// STATE
// ============================================================

let cropPurchaseList = [];

let cropPurchase    = {};
let oldCropPurchase = {};
let formMode        = "ADD";

// Item shape kept identical whether freshly added via handleAddPOItem()
// or cloned from a backend GET response in refillCropPurchaseForm() —
// field names below MUST match the CropPurchaseItem entity exactly:
// { crop, crophasfarmer, quantity, unitprice, linetotalprice }
let purchaseItemList = [];

let farmerList  = [];
let poStatusList = [];
let cropList     = [];
let farmerCropHasFarmerList = [];   // the selected farmer's crophasfarmer records




// ============================================================
// EVENT LISTENERS
// ============================================================

const initializeEventListeners = () => {
    selectFarmer.addEventListener("change", validateFarmer);
    selectFarmer.addEventListener("change", handleFarmerChange);

    dateExpected.addEventListener("input",    validateExpectedDate);
    selectPOStatus.addEventListener("change", validatePOStatus);
    // textNote.addEventListener("input",        validateNote);

    selectItemCrop.addEventListener("change", handleCropSelected);
    buttonAddPOItem.addEventListener("click", handleAddPOItem);

    submitElement.addEventListener("click", handleSubmit);
    updateElement.addEventListener("click", handleUpdate);
    clearElement.addEventListener("click",  handleClear);
    deleteElement.addEventListener("click", handleDelete);
    printElement.addEventListener("click",  handlePrint);

    addNewCropPurchaseElement.addEventListener("click", () => {
        initializeForm();
        titleEditHide.classList.add("d-none");
        titleNewHide.classList.remove("d-none");
    });
};


// ============================================================
// LOAD INITIAL DATA
// ============================================================

const loadInitialData = () => {
    loadFarmerList();
    loadPOStatusList();
    loadCropList();
    cropPurchaseList = getServiceRequest("/crop/croppurchase/alldata/selected");
};


// ============================================================
// INITIALIZE FORM
// ============================================================

const initializeForm = () => {
    cropPurchase    = {};
    oldCropPurchase = {};
    formMode        = "ADD";

    purchaseItemList = [];

    cropPurchaseForm.reset();
    removeValidationStyles(cropPurchaseForm);

    poIdElement.textContent       = "-";
    updateDateElement.textContent = "-";

    let dateTime = getTodayDateTime();
    regDateElement.textContent = dateTime.slice(0, 10) + " " + dateTime.slice(11, 19);

    // Auto fill currently logged-in user as the record's user (creation case)
    loadLoggedInUserInto(cropPurchase, userIdElement);

    // Reset dropdowns
    generateFarmerSelect();
    generatePOStatusSelect();
    selectItemCrop.innerHTML = '<option value="" selected disabled>Select Crop</option>';
    selectFarmer.value   = "";
    selectPOStatus.value = "";
    farmerCropHasFarmerList = [];

    numberItemQty.value       = "";
    tableItemsBody.innerHTML  = "";
    tdTotalAmount.textContent = "0.00";
    textAmount.value          = "";

    // Button visibility — ADD mode
    submitElement.classList.remove("d-none");
    updateElement.classList.add("d-none");
    deleteElement.classList.add("d-none");
    printElement.classList.add("d-none");

    // Re-enable all fields (undoes any lock applied in refillCropPurchaseForm)
    document.querySelectorAll("#formCropPurchase input, #formCropPurchase select, #formCropPurchase textarea")
        .forEach(el => el.disabled = false);
    updateElement.disabled = false;
    userIdElement.readOnly = true;

    titleEditHide.classList.add("d-none");
    titleNewHide.classList.remove("d-none");
};


// ============================================================
// DROPDOWN DATA — FARMER
// ============================================================


const loadFarmerList = () => {
    farmerList = getServiceRequest("/farmer/farmerlist/alldata/selected");
};

const generateFarmerSelect = () => {
    selectFarmer.innerHTML =
        '<option value="" selected disabled>Select Farmer</option>';

    farmerList.forEach((f) => {
        const option = document.createElement("option");
        option.value     = JSON.stringify(f);
        option.innerText = f.fullname || f.callingname || f.id;
        selectFarmer.appendChild(option);
    });
};

const validateFarmer = () => {
    const value = selectFarmer.value;

    if (!value) {
        cropPurchase.farmer = null;
        setInvalid(selectFarmer);
        return;
    }

    cropPurchase.farmer = JSON.parse(value);

    if (formMode === "EDIT" &&
        JSON.stringify(cropPurchase.farmer?.id) !== JSON.stringify(oldCropPurchase.farmer?.id)) {
        setUpdated(selectFarmer);
    } else {
        setValid(selectFarmer);
    }
};

const handleFarmerChange = () => {
    const value = selectFarmer.value;

    // Clear existing purchase items whenever the farmer changes —
    // crop options are farmer-specific, so stale rows would point
    // at the wrong crophasfarmer record.
    purchaseItemList = [];
    renderPurchaseItemsTable();
    calcTotalAmount();

    if (!value) {
        farmerCropHasFarmerList = [];
        selectItemCrop.innerHTML = '<option value="" selected disabled>Select Crop</option>';
        return;
    }

    const parsed = JSON.parse(value);
    loadCropHasFarmerByFarmer(parsed.id);
};


// ============================================================
// DROPDOWN DATA — PO STATUS (OrderStatus enum)
// ============================================================

const loadPOStatusList = () => {
    poStatusList = [
        { name: "Pending"   },
        { name: "Approved"  },
        { name: "Received"  },
        { name: "Cancelled" }
    ];
};

const generatePOStatusSelect = () => {
    fillDataIntoSelect(selectPOStatus, "Select PO Status", poStatusList, "name");
};

const validatePOStatus = () => {
    const value = selectPOStatus.value;

    if (!value) {
        cropPurchase.postatus = null;
        setInvalid(selectPOStatus);
        return;
    }

    const parsed = JSON.parse(value);
    cropPurchase.postatus = parsed.name;

    if (formMode === "EDIT" && cropPurchase.postatus !== oldCropPurchase.postatus) {
        setUpdated(selectPOStatus);
    } else {
        setValid(selectPOStatus);
    }
};


// ============================================================
// DROPDOWN DATA — CROP (filtered by selected farmer's crophasfarmer)
// ============================================================

const loadCropList = () => {
    cropList = getServiceRequest("/crop/croplist/alldata/selected");
};

// Fetches the crophasfarmer records for a specific farmer — same
// active-only pattern as loadSupplierIngredients(supplierId).
const loadCropHasFarmerByFarmer = (farmerId) => {
    if (!farmerId) return;

    farmerCropHasFarmerList = getServiceRequest(
        "/farmer/farmerlist/crophasfarmer/byfarmer/active/" + farmerId
    );
    generateCropSelectFromList(farmerCropHasFarmerList);
};

const generateCropSelectFromList = (list) => {
    selectItemCrop.innerHTML = '<option value="" selected disabled>Select Crop</option>';

    (list || []).forEach((chf) => {
        const option = document.createElement("option");
        option.value     = JSON.stringify(chf);
        option.innerText = chf.cropListManagement?.name || "Crop";
        selectItemCrop.appendChild(option);
    });
};

const handleCropSelected = () => {
    const value = selectItemCrop.value;
    if (!value) return;
    numberItemQty.focus();
};


// ============================================================
// VALIDATION — MAIN FIELDS
// ============================================================

const validateExpectedDate = () => {
    const value = dateExpected.value;

    if (!value) {
        cropPurchase.expecteddate = null;
        setInvalid(dateExpected);
        return;
    }

    cropPurchase.expecteddate = value;

    if (formMode === "EDIT" && value !== oldCropPurchase.expecteddate) {
        setUpdated(dateExpected);
    } else {
        setValid(dateExpected);
    }
};



// ============================================================
// PURCHASE ITEMS — ADD / REMOVE
// ============================================================

const handleAddPOItem = () => {
    const cropValue = selectItemCrop.value;
    const qty       = parseFloat(numberItemQty.value);

    if (!cropValue) {
        Notiflix.Notify.warning("Please select a crop.");
        setInvalid(selectItemCrop);
        return;
    }

    if (isNaN(qty) || qty <= 0) {
        Notiflix.Notify.warning("Please enter a valid quantity.");
        setInvalid(numberItemQty);
        return;
    }

    const selectedChf  = JSON.parse(cropValue);
    const selectedCrop = selectedChf.cropListManagement;
    const unitPrice     = selectedChf.price || 0;
    const lineTotal      = qty * unitPrice;

    const duplicate = purchaseItemList.find(
        (item) => item.crop?.id === selectedCrop?.id
    );
    if (duplicate) {
        Notiflix.Notify.warning("This crop has already been added. Remove it first to change quantity.");
        return;
    }

    // Field names here MUST match what refillCropPurchaseForm() clones
    // from the backend (CropPurchaseItem entity), so freshly-added and
    // backend-loaded items are always the same shape:
    //   crop, crophasfarmer, quantity, unitprice, linetotalprice
    purchaseItemList.push({
        crop:           selectedCrop,
        crophasfarmer:  selectedChf,
        quantity:       qty,
        unitprice:      unitPrice,
        linetotalprice: lineTotal
    });

    selectItemCrop.value  = "";
    numberItemQty.value   = "";
    selectItemCrop.classList.remove("is-valid", "is-invalid");
    numberItemQty.classList.remove("is-valid", "is-invalid");

    renderPurchaseItemsTable();
    calcTotalAmount();
};

const removePurchaseItem = (index) => {
    purchaseItemList.splice(index, 1);
    renderPurchaseItemsTable();
    calcTotalAmount();
};

const calcTotalAmount = () => {
    const total = purchaseItemList.reduce((sum, item) => sum + item.linetotalprice, 0);
    const formatted = total.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    tdTotalAmount.textContent = formatted;
    textAmount.value          = total.toFixed(2);
    cropPurchase.total        = total;
};


// ============================================================
// RENDER PURCHASE ITEMS TABLE
// ============================================================

const renderPurchaseItemsTable = () => {
    tableItemsBody.innerHTML = "";

    if (purchaseItemList.length === 0) {
        tableItemsBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">No items added yet.</td>
            </tr>`;
        return;
    }

    purchaseItemList.forEach((item, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.crop?.name || "-"}</td>
            <td>${item.quantity}</td>
            <td>${item.unitprice.toFixed(2)}</td>
            <td>${item.linetotalprice.toFixed(2)}</td>
            <td>
                <button type="button" class="btn btn-sm btn-outline-danger"
                        onclick="removePurchaseItem(${index})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        tableItemsBody.appendChild(tr);
    });
};


// ============================================================
// REFRESH MAIN TABLE
// ============================================================

const refreshCropPurchaseTable = () => {
    // Sort: Pending first
    cropPurchaseList.sort((a, b) => {
        const aPending = a.postatus === "Pending";
        const bPending = b.postatus === "Pending";
        if (aPending && !bPending) return -1;
        if (!aPending && bPending) return 1;
        return 0;
    });

    if ($.fn.DataTable.isDataTable("#tableCropPurchase")) {
        $("#tableCropPurchase").DataTable().destroy();
    }

    tableBody.innerHTML = "";

    let displayProperty = [
        { propertyName: "ponumber",                dataType: "string"   },
        { propertyName: getCropPurchaseFarmer,      dataType: "function" },
        { propertyName: getCropPurchaseCreatedDate, dataType: "function" },
        { propertyName: getCropPurchaseExpected,    dataType: "function" },
        { propertyName: "total",                    dataType: "string"   },
        { propertyName: getCropPurchasePOStatus,    dataType: "function" },
    ];

    fillDataIntoTableThree(
        tableBody,
        cropPurchaseList,
        displayProperty,
        refillCropPurchaseForm
    );

    $("#tableCropPurchase").DataTable();
};

const getCropPurchaseFarmer = (ob) =>
    ob.farmer?.fullname || ob.farmer?.callingname || "-";

const getCropPurchaseCreatedDate = (ob) =>
    ob.purchasedatetime ? ob.purchasedatetime.slice(0, 10) : "-";

const getCropPurchaseExpected = (ob) =>
    ob.expecteddate || "-";

const getCropPurchasePOStatus = (ob) => {
    if (ob.postatus === "Pending")   return '<p class="p-1 bg-warning">Pending</p>';
    if (ob.postatus === "Approved")  return '<p class="p-1 bg-success">Approved</p>';
    if (ob.postatus === "Received")  return '<p class="p-1 bg-info ">Received</p>';
    if (ob.postatus === "Cancelled") return '<p class="p-1 bg-danger">Cancelled</p>';
    return ob.postatus || "-";
};


// ============================================================
// REFILL FORM — EDIT MODE
// ============================================================

const refillCropPurchaseForm = (dataOb) => {
    removeValidationStyles(cropPurchaseForm);

    let myModal = new bootstrap.Modal(cropPurchaseAddFormModalElement, {});
    formMode = "EDIT";

    cropPurchase    = getServiceRequest("/crop/croppurchase/byid/" + dataOb.id);
    oldCropPurchase = JSON.parse(JSON.stringify(cropPurchase));

    regDateElement.textContent = cropPurchase.purchasedatetime
        ? cropPurchase.purchasedatetime.slice(0, 10) + " " + cropPurchase.purchasedatetime.slice(11, 19)
        : "-";

    updateDateElement.textContent = cropPurchase.updateddatetime
        ? cropPurchase.updateddatetime.slice(0, 10) + " " + cropPurchase.updateddatetime.slice(11, 19)
        : "-";

    poIdElement.textContent = cropPurchase.ponumber || "-";

    // Farmer — match by id against rendered options (robust vs. stringified-object mismatch)
    generateFarmerSelect();
    if (cropPurchase.farmer) {
        const farmerId = cropPurchase.farmer.id;
        for (const option of selectFarmer.options) {
            if (!option.value) continue;
            try {
                const parsed = JSON.parse(option.value);
                if (parsed.id === farmerId) {
                    selectFarmer.value = option.value;
                    break;
                }
            } catch (_) {}
        }
        loadCropHasFarmerByFarmer(farmerId);
    }

    // User field is DISPLAY ONLY here — shows whoever is currently
    // stamped on the record (last updater, or creator if never
    // updated). We do NOT touch cropPurchase.user on open. It only
    // gets reassigned to the current session user inside
    // handleUpdate(), and only if the record is actually changed and
    // saved — see hasCropPurchaseChanged(). Opening or cancelling
    // never reassigns it.
    userIdElement.value    = cropPurchase.user?.username || cropPurchase.user?.id || "-";
    userIdElement.readOnly = true;

    dateExpected.value = cropPurchase.expecteddate || "";

    textAmount.value = cropPurchase.total != null
        ? Number(cropPurchase.total).toFixed(2)
        : "";

    generatePOStatusSelect();
    if (cropPurchase.postatus) {
        selectPOStatus.value = JSON.stringify({ name: cropPurchase.postatus });
    }


    // Deep clone — the backend returns CropPurchaseItem entities using
    // fields { id, crop, crophasfarmer, quantity, unitprice, linetotalprice }.
    // handleAddPOItem() now stores freshly-added items in that exact
    // same shape, so purchaseItemList is always consistent regardless
    // of where an item came from.
    purchaseItemList = cropPurchase.cropPurchaseItems
        ? JSON.parse(JSON.stringify(cropPurchase.cropPurchaseItems))
        : [];
    renderPurchaseItemsTable();
    calcTotalAmount();

    // Re-enable all fields first, then re-apply lock below if needed
    document.querySelectorAll("#formCropPurchase input, #formCropPurchase select, #formCropPurchase textarea")
        .forEach(el => el.disabled = false);
    updateElement.disabled = false;
    userIdElement.readOnly = true;

    submitElement.classList.add("d-none");
    updateElement.classList.remove("d-none");
    deleteElement.classList.remove("d-none");
    printElement.classList.remove("d-none");

    // Lock if Received or Cancelled — decision is final
    const isLocked = cropPurchase.postatus === "Received" ||
        cropPurchase.postatus === "Cancelled";

    if (isLocked) {
        document.querySelectorAll("#formCropPurchase input, #formCropPurchase select, #formCropPurchase textarea")
            .forEach(el => el.disabled = true);
        updateElement.disabled = true;
        deleteElement.classList.add("d-none");
        Notiflix.Notify.info(
            `This crop purchase is ${cropPurchase.postatus}. No further changes allowed.`
        );
    }

    // Hide delete if not Pending (kept in sync with backend's Cancelled-block on delete)
    if (cropPurchase.postatus !== "Pending") {
        deleteElement.classList.add("d-none");
    }

    titleEditHide.classList.remove("d-none");
    titleNewHide.classList.add("d-none");

    myModal.show();
};


// ============================================================
// CHANGE DETECTION — used to decide whether the "last updated by"
// user should be overwritten with the currently logged-in user.
// ============================================================

// Normalizes purchase item sub-rows to a comparable, order-independent shape.
const normalizePurchaseItemsForCompare = (items) => {
    return (items || [])
        .map(item => ({
            cropId: item.crop?.id,
            quantity: Number(item.quantity),
            unitprice: Number(item.unitprice)
        }))
        .sort((a, b) => (a.cropId > b.cropId ? 1 : a.cropId < b.cropId ? -1 : 0));
};

// Returns true if farmer, PO status, expected date, note, or
// purchase items differ from the original snapshot taken when the
// record was opened for edit.
const hasCropPurchaseChanged = () => {
    if ((cropPurchase.farmer?.id || null) !== (oldCropPurchase.farmer?.id || null)) return true;
    if (cropPurchase.postatus !== oldCropPurchase.postatus) return true;
    if (cropPurchase.expecteddate !== oldCropPurchase.expecteddate) return true;


    const itemsChanged = JSON.stringify(normalizePurchaseItemsForCompare(purchaseItemList))
        !== JSON.stringify(normalizePurchaseItemsForCompare(oldCropPurchase.cropPurchaseItems));
    if (itemsChanged) return true;

    return false;
};


// ============================================================
// FORM ERROR CHECK
// ============================================================

const checkFormErrors = () => {
    let errors = [];

    if (!cropPurchase.farmer)   errors.push("Farmer has an error. Please check again.");
    if (!cropPurchase.postatus) errors.push("PO Status has an error. Please check again.");
    if (!cropPurchase.user)     errors.push("User ID has an error. Please check again.");
    if (purchaseItemList.length === 0) errors.push("At least one purchase item must be added.");

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

    // Minimize nested entity references before sending — same convention as purchaseorder.js.
    // Every key below matches the CropPurchaseItem entity field names exactly.
    cropPurchase.farmer = { id: cropPurchase.farmer?.id };
    cropPurchase.cropPurchaseItems = purchaseItemList.map((item) => ({
        id:             item.id,
        crop:           { id: item.crop?.id },
        crophasfarmer:  { id: item.crophasfarmer?.id },
        quantity:       item.quantity,
        unitprice:      item.unitprice,
        linetotalprice: item.linetotalprice,
    }));
    let response = getHTTPServiceRequest("/crop/croppurchase/save", "POST", cropPurchase);

    if (response === "OK") {
        Notiflix.Notify.success("Saved successfully");
        $("#CropPurchaseAddForm").modal("hide");
        loadInitialData();
        refreshCropPurchaseTable();
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
    // already stamped on them. This must run BEFORE the reference
    // minimization below, since it needs the full farmer object and
    // untouched purchaseItemList to compare against the snapshot.
    if (hasCropPurchaseChanged()) {
        loadLoggedInUserInto(cropPurchase, userIdElement);
    }

    cropPurchase.farmer = { id: cropPurchase.farmer?.id };
    cropPurchase.cropPurchaseItems = purchaseItemList.map((item) => ({
        id:             item.id,
        crop:           { id: item.crop?.id },
        crophasfarmer:  { id: item.crophasfarmer?.id },
        quantity:       item.quantity,
        unitprice:      item.unitprice,
        linetotalprice: item.linetotalprice,
    }));
    let response = getHTTPServiceRequest("/crop/croppurchase/update", "PUT", cropPurchase);

    if (response === "OK") {
        updateDateElement.textContent = new Date().toLocaleString();
        Notiflix.Notify.success("Updated successfully");
        $("#CropPurchaseAddForm").modal("hide");
        loadInitialData();
        refreshCropPurchaseTable();
        initializeForm();
    } else {
        Notiflix.Notify.warning("Update failed: " + response);
    }
};

const handleDelete = () => {
    Notiflix.Confirm.show(
        "Delete Crop Purchase",
        "Are you sure you want to delete this crop purchase order?",
        "Yes, Delete",
        "Cancel",
        () => {
            let response = getHTTPServiceRequest(
                "/crop/croppurchase/" + cropPurchase.id,
                "DELETE",
                null
            );

            if (response === "OK") {
                Notiflix.Notify.success("Deleted successfully");
                $("#CropPurchaseAddForm").modal("hide");
                loadInitialData();
                refreshCropPurchaseTable();
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

const viewCropPurchaseRecord = (dataOb) => {
    document.querySelector("#tdViewPurNo").innerText        = dataOb.ponumber || "-";
    document.querySelector("#tdViewFarmer").innerText       = dataOb.farmer?.fullname
        || dataOb.farmer?.callingname || "-";
    document.querySelector("#tdViewPurchaseDate").innerText = dataOb.purchasedatetime
        ? dataOb.purchasedatetime.slice(0, 16).replace("T", " ")
        : "-";
    document.querySelector("#tdViewExpectedDate").innerText = dataOb.expecteddate || "-";
    document.querySelector("#tdViewTotal").innerText        = dataOb.total != null
        ? Number(dataOb.total).toFixed(2) : "-";
    document.querySelector("#tdViewPOStatus").innerText     = dataOb.postatus || "-";

    const printBody = document.querySelector("#tableViewItemsBody");
    printBody.innerHTML = "";

    const items = dataOb.cropPurchaseItems || purchaseItemList || [];
    items.forEach((item, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.crop?.name || "-"}</td>
            <td>${item.quantity ?? "-"}</td>
            <td>${item.unitprice?.toFixed(2) || "-"}</td>
            <td>${item.linetotalprice?.toFixed(2) || "-"}</td>
        `;
        printBody.appendChild(tr);
    });

    const editModalContent = cropPurchaseAddFormModalElement.querySelector(".modal-content");
    editModalContent.classList.add("blurred");

    const viewModal = new bootstrap.Modal(printViewCropPurchaseModalElement);
    viewModal.show();

    printViewCropPurchaseModalElement.addEventListener(
        "hidden.bs.modal",
        () => { editModalContent.classList.remove("blurred"); },
        { once: true }
    );
};

const handlePrint = () => {
    viewCropPurchaseRecord(cropPurchase);
};

const printCropPurchaseRecord = () => {
    let newWindow = window.open();
    newWindow.document.write(
        "<html><head>" +
        "<title>Crop Purchase Details</title>" +
        '<link rel="stylesheet" href="/css/bootstrap-5.3.3/css/bootstrap.min.css">' +
        "</head><body>" +
        document.querySelector("#divCardPrintCropPurchase").outerHTML +
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
        refreshCropPurchaseTable();
    }

        window.initPage();


window.printCropPurchaseRecord = printCropPurchaseRecord;
window.removePurchaseItem = removePurchaseItem;

})();