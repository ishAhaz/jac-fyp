// ============================================================
// DOM ELEMENT REFERENCES
// ============================================================

(function () {
    let qualityCheckAddFormModalElement
        , tableBody
        , printViewModalElement
        , qualityCheckForm
        , createDateElement
        , updateDateElement
        , inputCheckNoElement
        , selectGrnCropElement
        , userIdElement
        , dateCheckedElement
        , qualityStatusElement
        , textNoteElement
        , tableItemsBody
        , updateElement
        , clearElement
        , printElement
        , tdCheckNo
        , tdViewGrnCrop
        , tdViewCheckedDate
        , tdViewStatus
        , tdViewUser
        , tableViewItemsBody
        , divCardPrintQualityCheck;

    const queryElements = () => {
         qualityCheckAddFormModalElement = document.querySelector("#QualityCheckAddForm");

// Table body
         tableBody = document.querySelector("#tableBodyId");

// Print view modal
         printViewModalElement = document.querySelector("#QualityCheckViewModal");

// Form
         qualityCheckForm = document.querySelector("#formQualityCheck");

// Header info display
         createDateElement = document.querySelector("#createDate");
         updateDateElement = document.querySelector("#updateDate");
         inputCheckNoElement = document.querySelector("#InputCheckNo");

// Header form fields
         selectGrnCropElement = document.querySelector("#selectGrnCrop");
         userIdElement = document.querySelector("#userId");
         dateCheckedElement = document.querySelector("#dateChecked");
         qualityStatusElement = document.querySelector("#selectQualityStatus");
         textNoteElement = document.querySelector("#textNote");

// Items sub-table (auto-populated from GRN — inline editable, no add/remove of new GRN items)
         tableItemsBody = document.querySelector("#tableItemsBody");

// Buttons
         updateElement = document.querySelector("#buttonUpdate");
         clearElement = document.querySelector("#buttonClear");
         printElement = document.querySelector("#buttonPrint");

// Print view cells
         tdCheckNo = document.querySelector("#tdCheckNo");
         tdViewGrnCrop = document.querySelector("#tdViewGrnCrop");
         tdViewCheckedDate = document.querySelector("#tdViewCheckedDate");
         tdViewStatus = document.querySelector("#tdViewStatus");
         tdViewUser = document.querySelector("#tdViewUser");
         tableViewItemsBody = document.querySelector("#tableViewItemsBody");
         divCardPrintQualityCheck = document.querySelector("#divCardPrintQualityCheck");
    }

// ============================================================
// STATE
// ============================================================

let qualityCheckList = [];

let qualityCheck    = {};
let oldQualityCheck = {};
let formMode        = "EDIT"; // this module is EDIT-only — records are auto-created from GRN
// (see GrnCropController#updateData ->
// CropQualityCheckController#autoCreateQualityCheckFromGrn).
// The backend exposes only alldata/selected, byid/{id}, and
// update — there is no save/POST or delete endpoint.

let currentItems = [];  // { grnItemCrop: {...}, grade: "A"/"B"/"C", quantity, note }

const gradeList = ["A", "B", "C"]; // matches lk.jac.common.Grade exactly




// ============================================================
// EVENT LISTENERS
// ============================================================

const initializeEventListeners = () => {
    dateCheckedElement.addEventListener("input",  validateCheckedDate);
    qualityStatusElement.addEventListener("change", validateQualityStatus);


    // Action buttons — no Submit/Add-new; records are auto-created from GRN only
    updateElement.addEventListener("click", handleUpdate);
    clearElement.addEventListener("click",  handleClear);
    printElement.addEventListener("click",  handlePrint);
};


// ============================================================
// LOAD INITIAL DATA
// ============================================================

const loadInitialData = () => {
    qualityCheckList = getServiceRequest("/crop/cropqualitycheck/alldata/selected");
};


// ============================================================
// INITIALIZE FORM (this module has no ADD mode — kept for safety/reset only)
// ============================================================

const initializeForm = () => {
    qualityCheck    = {};
    oldQualityCheck = {};
    currentItems    = [];

    qualityCheckForm.reset();
    removeValidationStyles(qualityCheckForm);

    inputCheckNoElement.textContent = "-";
    updateDateElement.textContent   = "-";
    createDateElement.textContent   = "-";

    selectGrnCropElement.innerHTML = '<option value="" selected disabled>Auto-fill</option>';
    selectGrnCropElement.disabled  = true;

    userIdElement.value    = "";
    userIdElement.readOnly = true;

    dateCheckedElement.value   = "";
    qualityStatusElement.value = "";

    renderItemsTable();

    updateElement.classList.add("d-none");
    printElement.classList.add("d-none");
};


// ============================================================
// VALIDATION — HEADER FIELDS
// ============================================================

const validateCheckedDate = () => {
    const value = dateCheckedElement.value;

    if (!value) {
        qualityCheck.checkeddate = null;
        setInvalid(dateCheckedElement);
        return;
    }

    // Backend field `checkeddate` is a java.time.LocalDateTime, but
    // <input type="date"> only ever yields a date-only string like
    // "2026-07-20". Jackson can't deserialize that into a
    // LocalDateTime (it needs "2026-07-20T00:00:00"), which was
    // causing a 400 / AJAX error on every update. Pad with a zero
    // time-of-day to match what the backend expects.
    qualityCheck.checkeddate = value + "T00:00:00";

    const oldDateOnly = oldQualityCheck.checkeddate
        ? oldQualityCheck.checkeddate.slice(0, 10)
        : null;

    if (value !== oldDateOnly) {
        setUpdated(dateCheckedElement);
    } else {
        setValid(dateCheckedElement);
    }
};

const validateQualityStatus = () => {
    const value = qualityStatusElement.value;

    if (!value) {
        qualityCheck.qualitystatus = null;
        setInvalid(qualityStatusElement);
        return;
    }

    qualityCheck.qualitystatus = value;

    if (value !== oldQualityCheck.qualitystatus) {
        setUpdated(qualityStatusElement);
    } else {
        setValid(qualityStatusElement);
    }
};




// ============================================================
// RENDER ITEMS TABLE (auto-populated, inline editable, split/remove)
// ============================================================

const renderItemsTable = () => {
    tableItemsBody.innerHTML = "";

    if (currentItems.length === 0) {
        tableItemsBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted">No items found for this GRN.</td>
            </tr>`;
        return;
    }

    // Count how many rows exist per GRN item, so we know which rows are removable
    const countByGrnItem = {};
    currentItems.forEach((item) => {
        const key = item.grnItemCrop?.id;
        countByGrnItem[key] = (countByGrnItem[key] || 0) + 1;
    });

    currentItems.forEach((item, index) => {
        const row = document.createElement("tr");

        const gradeOptions = gradeList.map(g =>
            `<option value="${g}" ${item.grade === g ? "selected" : ""}>${g}</option>`
        ).join("");

        const grnItemKey = item.grnItemCrop?.id;
        const canRemove  = (countByGrnItem[grnItemKey] || 0) > 1;

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.grnItemCrop?.cropPurchaseItem?.crop?.name || "-"}</td>
            <td>
                <select class="form-select form-select-sm item-grade">
                    <option value="" disabled ${!item.grade ? "selected" : ""}>Select</option>
                    ${gradeOptions}
                </select>
            </td>
            <td>
                <input type="number" step="0.01" min="0" class="form-control form-control-sm item-qty"
                       value="${item.quantity ?? ""}">
            </td>
            <td>
                <input type="text" class="form-control form-control-sm item-note"
                       value="${item.note || ""}">
            </td>
            <td class="text-center">
                <button type="button" class="btn btn-sm btn-outline-primary btn-split-row" title="Split this crop into another grade">
                    <i class="fa-solid fa-code-branch"></i>
                </button>
            </td>
            <td class="text-center">
                ${canRemove
            ? `<button type="button" class="btn btn-sm btn-outline-danger btn-remove-row" title="Remove this split row">
                           <i class="fa-solid fa-trash"></i>
                       </button>`
            : `<span class="text-muted">—</span>`}
            </td>`;

        row.querySelector(".item-grade").addEventListener("change", (e) => {
            currentItems[index].grade = e.target.value;
        });
        row.querySelector(".item-qty").addEventListener("input", (e) => {
            currentItems[index].quantity = parseFloat(e.target.value) || 0;
        });
        row.querySelector(".item-note").addEventListener("input", (e) => {
            currentItems[index].note = e.target.value.trim() || null;
        });
        row.querySelector(".btn-split-row").addEventListener("click", () => {
            handleSplitRow(index);
        });
        const removeBtn = row.querySelector(".btn-remove-row");
        if (removeBtn) {
            removeBtn.addEventListener("click", () => {
                handleRemoveRow(index);
            });
        }

        tableItemsBody.appendChild(row);
    });
};


// ============================================================
// SPLIT / REMOVE ROWS (same GRN item, different grade/quantity)
// ============================================================

const handleSplitRow = (index) => {
    const source = currentItems[index];

    const newRow = {
        grnItemCrop: source.grnItemCrop,
        grade: null,
        quantity: null,
        note: null,
    };

    // Insert the new row directly after the source row
    currentItems.splice(index + 1, 0, newRow);
    renderItemsTable();
};

const handleRemoveRow = (index) => {
    const grnItemKey = currentItems[index].grnItemCrop?.id;
    const rowsForItem = currentItems.filter(
        (it) => it.grnItemCrop?.id === grnItemKey
    ).length;

    if (rowsForItem <= 1) {
        Notiflix.Notify.warning("At least one row is required per crop.");
        return;
    }

    currentItems.splice(index, 1);
    renderItemsTable();
};


// ============================================================
// REFRESH MAIN TABLE
// ============================================================

const refreshQualityCheckTable = () => {
    if ($.fn.DataTable.isDataTable("#tableQualityCheck")) {
        $("#tableQualityCheck").DataTable().destroy();
    }

    tableBody.innerHTML = "";

    let displayProperty = [
        { propertyName: "checkno",             dataType: "string"   },
        { propertyName: getGrnRefDisplay,      dataType: "function" },
        { propertyName: getStatusDisplay,      dataType: "function" },
        { propertyName: getCheckedDateDisplay, dataType: "function" },
        { propertyName: getUserDisplay,        dataType: "function" },
    ];

    fillDataIntoTableThree(
        tableBody,
        qualityCheckList,
        displayProperty,
        refillQualityCheckForm
    );

    $("#tableQualityCheck").DataTable();
};

// Table display helpers
const getGrnRefDisplay = (ob) =>
    ob.grncrop?.grncropnumber || ob.grncrop?.id || "-";

const getStatusDisplay = (ob) => {
    if (ob.qualitystatus === "Pending")  return '<p class="p-1 bg-warning">Pending</p>';
    if (ob.qualitystatus === "Approved") return '<p class="p-1 bg-success">Approved</p>';
    if (ob.qualitystatus === "Rejected") return '<p class="p-1 bg-danger">Rejected</p>';
    return ob.qualitystatus || "-";
};

const getCheckedDateDisplay = (ob) =>
    ob.checkeddate ? ob.checkeddate.slice(0, 10) : "-";

const getUserDisplay = (ob) =>
    ob.user?.username || ob.user?.id || "-";


// ============================================================
// REFILL FORM — EDIT MODE (the only mode this module has)
// ============================================================

const refillQualityCheckForm = (dataOb) => {
    removeValidationStyles(qualityCheckForm);

    let myModal = new bootstrap.Modal(qualityCheckAddFormModalElement, {});
    formMode = "EDIT";

    qualityCheck    = getServiceRequest("/crop/cropqualitycheck/byid/" + dataOb.id);
    oldQualityCheck = JSON.parse(JSON.stringify(qualityCheck));

    // Meta dates
    if (qualityCheck.createddatetime) {
        let dt = qualityCheck.createddatetime;
        createDateElement.textContent = dt.slice(0, 10) + " " + dt.slice(11, 19);
    } else {
        createDateElement.textContent = "-";
    }

    if (qualityCheck.updateddatetime) {
        let dt = qualityCheck.updateddatetime;
        updateDateElement.textContent = dt.slice(0, 10) + " " + dt.slice(11, 19);
    } else {
        updateDateElement.textContent = "-";
    }

    inputCheckNoElement.textContent = qualityCheck.checkno || "-";

    // GRN Reference — readonly, auto-filled (record was auto-created from this GRN)
    selectGrnCropElement.innerHTML = "";
    if (qualityCheck.grncrop) {
        const opt = document.createElement("option");
        opt.value     = qualityCheck.grncrop.id;
        opt.selected  = true;
        opt.innerText = qualityCheck.grncrop.grncropnumber || qualityCheck.grncrop.id;
        selectGrnCropElement.appendChild(opt);
    }
    selectGrnCropElement.disabled = true;

    // User field is DISPLAY ONLY here — shows whoever is currently
    // stamped on the record (last updater, or creator if never
    // updated). We do NOT touch qualityCheck.user on open. It only
    // gets reassigned to the current session user inside
    // handleUpdate(), and only if the record is actually changed and
    // saved — see hasQualityCheckChanged(). Opening or cancelling
    // never reassigns it.
    userIdElement.value    = qualityCheck.user?.username || qualityCheck.user?.id || "-";
    userIdElement.readOnly = true;

    // Checked date
    dateCheckedElement.value = qualityCheck.checkeddate
        ? qualityCheck.checkeddate.slice(0, 10)
        : "";

    // Status
    qualityStatusElement.value = qualityCheck.qualitystatus || "";



    // Items — auto-populated from GRN, edited inline in the table
    currentItems = qualityCheck.cropQualityCheckItems
        ? JSON.parse(JSON.stringify(qualityCheck.cropQualityCheckItems))
        : [];
    renderItemsTable();

    // Button visibility — this module is EDIT-only
    updateElement.classList.remove("d-none");
    printElement.classList.remove("d-none");

    myModal.show();
};


// ============================================================
// CHANGE DETECTION — used to decide whether the "last updated by"
// user should be overwritten with the currently logged-in user.
// ============================================================

// Normalizes quality check items to a comparable, order-independent
// shape. NOTE: split rows can share the same grnItemCrop id with
// different grade/quantity — grade and quantity are included in the
// sort key so duplicate ids don't collapse into each other.
const normalizeQualityCheckItems = (items) => {
    return (items || [])
        .map(item => ({
            id: item.grnItemCrop?.id,
            grade: item.grade || null,
            quantity: item.quantity != null ? Number(item.quantity) : null,
            note: item.note || null
        }))
        .sort((a, b) => {
            if (a.id !== b.id) return a.id > b.id ? 1 : -1;
            if (a.grade !== b.grade) return (a.grade || "") > (b.grade || "") ? 1 : -1;
            return (a.quantity || 0) - (b.quantity || 0);
        });
};

// Returns true if checked date, quality status, note, or items
// differ from the original snapshot taken when the record was
// opened for edit.
const hasQualityCheckChanged = () => {
    if (qualityCheck.checkeddate !== oldQualityCheck.checkeddate) return true;
    if (qualityCheck.qualitystatus !== oldQualityCheck.qualitystatus) return true;
    if ((qualityCheck.note || null) !== (oldQualityCheck.note || null)) return true;

    const itemsChanged = JSON.stringify(normalizeQualityCheckItems(currentItems))
        !== JSON.stringify(normalizeQualityCheckItems(oldQualityCheck.cropQualityCheckItems));
    if (itemsChanged) return true;

    return false;
};


// ============================================================
// FORM ERROR CHECK
// ============================================================

const checkFormErrors = () => {
    let errors = [];

    if (!qualityCheck.checkeddate)
        errors.push("Checked Date is required.");
    if (!qualityCheck.qualitystatus)
        errors.push("Status is required.");
    if (currentItems.length === 0)
        errors.push("No items found for this GRN.");

    currentItems.forEach((item, i) => {
        if (!item.grade)
            errors.push(`Item ${i + 1}: Grade is required.`);
        if (!item.quantity || item.quantity <= 0)
            errors.push(`Item ${i + 1}: Quantity must be greater than 0.`);
    });

    return errors;
};


// ============================================================
// CRUD HANDLERS
// ============================================================
const handleUpdate = () => {
    const errors = checkFormErrors();
    if (errors.length > 0) {
        Notiflix.Notify.warning(errors.join(" | "));
        return;
    }

    // Only reassign "who touched this record" if something actually
    // changed. Records saved without any real edit keep whoever was
    // already stamped on them. This must run BEFORE the reference
    // minimization below, since it needs the full currentItems array
    // to compare against the snapshot.
    if (hasQualityCheckChanged()) {
        loadLoggedInUserInto(qualityCheck, userIdElement);
    }

    // Send only minimal references for nested entities — avoid full-object
    // deserialization errors (matches GRN module convention)
    qualityCheck.cropQualityCheckItems = currentItems.map((item) => ({
        id: item.id,
        grnItemCrop: { id: item.grnItemCrop?.id },
        grade:    item.grade,
        quantity: item.quantity,
        note:     item.note,
    }));

    qualityCheck.grncrop = { id: qualityCheck.grncrop?.id };

    let response = getHTTPServiceRequest("/crop/cropqualitycheck/update", "PUT", qualityCheck);

    if (response === "OK") {
        updateDateElement.textContent = new Date().toLocaleString();
        Notiflix.Notify.success("Updated successfully");
        $("#QualityCheckAddForm").modal("hide");
        loadInitialData();
        refreshQualityCheckTable();
        initializeForm();
    } else {
        Notiflix.Notify.warning("Update failed: " + response);
    }
};

const handleClear = () => {
    Notiflix.Confirm.show(
        "Reset Changes",
        "Are you sure you want to discard unsaved changes?",
        "Yes, Reset",
        "Cancel",
        () => {
            $("#QualityCheckAddForm").modal("hide");
            initializeForm();
        },
        () => {}
    );
};


// ============================================================
// PRINT / VIEW
// ============================================================

const viewQualityCheckRecord = (dataOb) => {
    tdCheckNo.innerText         = dataOb.checkno || "-";
    tdViewGrnCrop.innerText     = dataOb.grncrop?.grncropnumber || dataOb.grncrop?.id || "-";
    tdViewCheckedDate.innerText = dataOb.checkeddate
        ? dataOb.checkeddate.slice(0, 10)
        : "-";
    tdViewStatus.innerText      = dataOb.qualitystatus || "-";
    tdViewUser.innerText        = dataOb.user?.username || dataOb.user?.id || "-";


    // Items
    tableViewItemsBody.innerHTML = "";
    const items = dataOb.cropQualityCheckItems || currentItems || [];
    items.forEach((item, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.grnItemCrop?.cropPurchaseItem?.crop?.name || "-"}</td>
            <td>${item.grade || "-"}</td>
            <td>${item.quantity ?? "-"} kg</td>
            <td>${item.note || "-"}</td>`;
        tableViewItemsBody.appendChild(row);
    });

    // Blur edit modal while print view is open
    const editModalContent = qualityCheckAddFormModalElement.querySelector(".modal-content");
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
    viewQualityCheckRecord(qualityCheck);
};

const printQualityCheckRecord = () => {
    let newWindow = window.open();
    newWindow.document.write(
        "<html><head>" +
        "<title>Crop Quality Check Details</title>" +
        '<link rel="stylesheet" href="/css/bootstrap-5.3.3/css/bootstrap.min.css">' +
        "</head><body>" +
        divCardPrintQualityCheck.outerHTML +
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
        refreshQualityCheckTable();
    }
    window.initPage();
window.printQualityCheckRecord = printQualityCheckRecord;

})();