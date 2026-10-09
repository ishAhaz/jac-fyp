// ============================================================
// DOM ELEMENT REFERENCES
// ============================================================
(function () {

    let suggestionPriceAddFormModalElement
        ,tableBody
        , printViewModalElement
        , suggestionPriceForm
        , suggestDateElement
        , updateDateElement
        , inputSupplierElement
        , inputIngredientElement
        ,  numberSupplierPriceElement
        , numberSuggestedPriceElement
        , userIdElement
        ,  selectStatusElement
        , textNoteElement
        ,  updateElement
        ,  clearElement
        ,  printElement
        ,  tdViewSupplier
        ,   tdViewIngredient
        ,  tdViewSuggestedDatetime
        ,  tdViewReviewDatetime
        ,  tdViewSuggestedPrice
        ,  tdViewSupplierPrice
        ,  tdViewStatus
        ,  tdViewNote
        , divCardPrintSuggestionPrice;
    const queryElements = () => {
         suggestionPriceAddFormModalElement = document.querySelector("#SuggestionPriceAddForm");
         tableBody = document.querySelector("#tableBodyId");
         printViewModalElement = document.querySelector("#SuggestionPriceViewModal");

         suggestionPriceForm = document.querySelector("#formSuggestionPrice");
         suggestDateElement = document.querySelector("#suggestDate");
         updateDateElement = document.querySelector("#updateDate");

         inputSupplierElement = document.querySelector("#inputSupplier");
         inputIngredientElement = document.querySelector("#inputIngredient");
         numberSupplierPriceElement = document.querySelector("#numberSupplierPrice");

         numberSuggestedPriceElement = document.querySelector("#numberSuggestedPrice");
         userIdElement = document.querySelector("#userId");
         selectStatusElement = document.querySelector("#selectStatus");
         textNoteElement = document.querySelector("#textNote");

         updateElement = document.querySelector("#buttonUpdate");
         clearElement = document.querySelector("#buttonClear");
         printElement = document.querySelector("#buttonPrint");

         tdViewSupplier = document.querySelector("#tdViewSupplier");
         tdViewIngredient = document.querySelector("#tdViewIngredient");
         tdViewSuggestedDatetime = document.querySelector("#tdViewSuggestedDatetime");
         tdViewReviewDatetime = document.querySelector("#tdViewReviewDatetime");
         tdViewSuggestedPrice = document.querySelector("#tdViewSuggestedPrice");
         tdViewSupplierPrice = document.querySelector("#tdViewSupplierPrice");
         tdViewStatus = document.querySelector("#tdViewStatus");
         tdViewNote = document.querySelector("#tdViewNote");
         divCardPrintSuggestionPrice = document.querySelector("#divCardPrintSuggestionPrice");
    }

// ============================================================
// STATE
// ============================================================

let suggestionPriceList = [];
let suggestionPrice     = {};
let oldSuggestionPrice  = {};
let formMode            = "EDIT";





// ============================================================
// EVENT LISTENERS
// ============================================================
// NOTE: this form has no "Add New" trigger at all — no submit
// button, no POST handler, formMode is permanently "EDIT". Every
// record already exists (created when a supplier submits a price),
// and this modal only ever opens an existing one via a table row
// click.

const initializeEventListeners = () => {
    numberSuggestedPriceElement.addEventListener("input",  validateSuggestedPrice);
    selectStatusElement.addEventListener("change", validateStatus);
    textNoteElement.addEventListener("input",      validateNote);

    updateElement.addEventListener("click", handleUpdate);
    clearElement.addEventListener("click",  handleClear);
    printElement.addEventListener("click",  handlePrint);
};


// ============================================================
// LOAD DATA
// ============================================================

const loadInitialData = () => {
    suggestionPriceList = getServiceRequest("/ingredient/suggestionpricein/alldata/selected"); // ← fixed
};


// ============================================================
// FORM RESET
// ============================================================

const initializeForm = () => {
    suggestionPrice    = {};
    oldSuggestionPrice = {};
    formMode           = "EDIT";

    suggestionPriceForm.reset();
    removeValidationStyles(suggestionPriceForm);

    suggestDateElement.textContent = "-";
    updateDateElement.textContent  = "-";
};


// ============================================================
// FIELD VALIDATION
// ============================================================

const validateSuggestedPrice = () => {
    const value = parseFloat(numberSuggestedPriceElement.value);

    if (isNaN(value) || value < 0) {
        suggestionPrice.suggestedprice = null;
        setInvalid(numberSuggestedPriceElement);
        return;
    }

    suggestionPrice.suggestedprice = value;

    if (value !== oldSuggestionPrice.suggestedprice) {
        setUpdated(numberSuggestedPriceElement);
    } else {
        setValid(numberSuggestedPriceElement);
    }
};

const validateStatus = () => {
    const value = selectStatusElement.value;

    if (!value) {
        suggestionPrice.status = null;
        setInvalid(selectStatusElement);
        return;
    }

    suggestionPrice.status = value;

    if (value !== oldSuggestionPrice.status) {
        setUpdated(selectStatusElement);
    } else {
        setValid(selectStatusElement);
    }
};

const validateNote = () => {
    suggestionPrice.note = textNoteElement.value.trim() || null;

    if (suggestionPrice.note !== (oldSuggestionPrice.note || null)) {
        setUpdated(textNoteElement);
    } else {
        setValid(textNoteElement);
    }
};


// ============================================================
// REFRESH TABLE
// ============================================================

const refreshSuggestionPriceTable = () => {

    // Add before DataTable init
    suggestionPriceList.sort((a, b) => {
        const aPending = a.status === "Pending";
        const bPending = b.status === "Pending";
        if (aPending && !bPending) return -1;
        if (!aPending && bPending) return 1;
        return 0;
    });

    if ($.fn.DataTable.isDataTable("#tableSuggestionPrice")) {
        $("#tableSuggestionPrice").DataTable().destroy();
    }

    tableBody.innerHTML = "";

    let displayProperty = [
        { propertyName: getSupplierDisplay,       dataType: "function" },
        { propertyName: getIngredientDisplay,     dataType: "function" },
        { propertyName: getSuggestedDateDisplay,  dataType: "function" },
        { propertyName: getSupplierPriceDisplay,  dataType: "function" },
        { propertyName: getSuggestedPriceDisplay, dataType: "function" },
        { propertyName: getStatusDisplay,         dataType: "function" },
        { propertyName: getReviewDateDisplay,     dataType: "function" },
        { propertyName: getUserDisplay,           dataType: "function" },
    ];

    fillDataIntoTableThree(
        tableBody,
        suggestionPriceList,
        displayProperty,
        refillSuggestionPriceForm
    );

    $("#tableSuggestionPrice").DataTable();
};


const getSupplierDisplay = (ob) =>
    ob.supplierhasingredient?.supplier?.contactperson ||
    ob.supplierhasingredient?.supplier?.companyname   || "-";

const getIngredientDisplay = (ob) =>
    ob.supplierhasingredient?.ingredient?.name || "-";

const getSuggestedDateDisplay = (ob) =>
    ob.suggesteddatetime
        ? ob.suggesteddatetime.slice(0, 10) + " " + ob.suggesteddatetime.slice(11, 19)
        : "-";


const getSupplierPriceDisplay = (ob) =>
    ob.supplierprice != null ? "Rs. " + Number(ob.supplierprice).toFixed(2) : "-";

const getSuggestedPriceDisplay = (ob) =>
    ob.suggestedprice != null ? "Rs. " + Number(ob.suggestedprice).toFixed(2) : "-";

const getReviewDateDisplay = (ob) =>
    ob.revieweddatetime
        ? ob.revieweddatetime.slice(0, 10) + " " + ob.revieweddatetime.slice(11, 19)
        : "-";

const getUserDisplay = (ob) =>
    ob.user?.username || ob.user?.id || "-";

const getStatusDisplay = (ob) => {
    if (!ob.status) return "-";
    if (ob.status === "Pending"  )  return '<p class="p-1 bg-warning ">Pending</p>';
    if (ob.status === "Approved" ) return '<p class="p-1 bg-success">Approved</p>';
    if (ob.status === "Rejected") return '<p class="p-1 bg-danger">Rejected</p>';
    return ob.status;
};


// ============================================================
// REFILL FORM — EDIT MODE
// ============================================================

const refillSuggestionPriceForm = (dataOb) => {
    removeValidationStyles(suggestionPriceForm);

    let myModal = new bootstrap.Modal(suggestionPriceAddFormModalElement, {});
    formMode = "EDIT";

    suggestionPrice    = getServiceRequest("/ingredient/suggestionpricein/byid/" + dataOb.id); // ← fixed
    oldSuggestionPrice = JSON.parse(JSON.stringify(suggestionPrice));

    // Dates
    suggestDateElement.textContent = suggestionPrice.suggesteddatetime
        ? suggestionPrice.suggesteddatetime.slice(0, 10) + " " + suggestionPrice.suggesteddatetime.slice(11, 19)
        : "-";

    updateDateElement.textContent = suggestionPrice.revieweddatetime
        ? suggestionPrice.revieweddatetime.slice(0, 10) + " " + suggestionPrice.revieweddatetime.slice(11, 19)
        : "-";

    // Read-only auto-filled fields
    // ← fixed: use contactperson/companyname instead of name
    inputSupplierElement.value = suggestionPrice.supplierhasingredient?.supplier?.contactperson ||
        suggestionPrice.supplierhasingredient?.supplier?.companyname   || "";
    inputIngredientElement.value     = suggestionPrice.supplierhasingredient?.ingredient?.name || "";
    numberSupplierPriceElement.value = suggestionPrice.supplierprice != null
        ? Number(suggestionPrice.supplierprice).toFixed(2) // ← fixed
        : "";

    inputSupplierElement.readOnly       = true;
    inputIngredientElement.readOnly     = true;
    numberSupplierPriceElement.readOnly = true;

    // Editable fields
    numberSuggestedPriceElement.value = suggestionPrice.suggestedprice != null
        ? suggestionPrice.suggestedprice
        : "";

    // User field is DISPLAY ONLY here — shows whoever is currently
    // stamped on the record (last reviewer, or "-" if never
    // reviewed). We do NOT touch suggestionPrice.user on open. It
    // only gets reassigned to the current session user inside
    // handleUpdate(), and only if the record is actually changed
    // and saved — see hasSuggestionPriceChanged(). Opening or
    // cancelling never reassigns it.
    userIdElement.value    = suggestionPrice.user?.username || suggestionPrice.user?.id || "-";
    userIdElement.readOnly = true;

    // Status
    selectStatusElement.value = suggestionPrice.status || "";

    // Note
    textNoteElement.value = suggestionPrice.note || "";

    // Re-enable all fields first
    document.querySelectorAll("#formSuggestionPrice input, #formSuggestionPrice select, #formSuggestionPrice textarea")
        .forEach(el => el.disabled = false);

    if (suggestionPrice.status === "Rejected") {
        // Lock everything except the status dropdown
        document.querySelectorAll("#formSuggestionPrice input, #formSuggestionPrice select, #formSuggestionPrice textarea")
            .forEach(el => {
                if (el.id !== "selectStatus") {
                    el.disabled = true;
                }
            });

        updateElement.classList.remove("d-none"); // still allow saving status change


        Notiflix.Notify.warning("This price rejected. Only status can be changed.");
    }

    myModal.show();
};


// ============================================================
// CHANGE DETECTION — used to decide whether the "last updated by"
// user should be overwritten with the currently logged-in user.
// Only the fields a reviewer can actually edit are compared:
// suggested price, status, and note.
// ============================================================

const hasSuggestionPriceChanged = () => {
    if (suggestionPrice.suggestedprice !== oldSuggestionPrice.suggestedprice) return true;
    if (suggestionPrice.status !== oldSuggestionPrice.status) return true;
    if ((suggestionPrice.note || null) !== (oldSuggestionPrice.note || null)) return true;
    return false;
};


// ============================================================
// FORM ERROR CHECK
// ============================================================

const checkFormErrors = () => {
    let errors = [];

    // Sync from field in case user didn't trigger input event
    const priceVal = parseFloat(numberSuggestedPriceElement.value);
    if (!isNaN(priceVal) && priceVal >= 0) {
        suggestionPrice.suggestedprice = priceVal;
    }

    const statusVal = selectStatusElement.value;
    if (statusVal) {
        suggestionPrice.status = statusVal;
    }

    if (suggestionPrice.suggestedprice == null || isNaN(suggestionPrice.suggestedprice))
        errors.push("Suggested Price has an error. Please check again.");
    if (!suggestionPrice.status)
        errors.push("Status has an error. Please check again.");

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
    // already stamped on them.
    if (hasSuggestionPriceChanged()) {
        loadLoggedInUserInto(suggestionPrice, userIdElement);
    }

    if (!suggestionPrice.user) {
        Notiflix.Notify.warning("User ID has an error. Please check again.");
        return;
    }

    if (suggestionPrice.status === "Approved" || suggestionPrice.status === "approved" ||
        suggestionPrice.status === "Rejected"  || suggestionPrice.status === "rejected") {
        suggestionPrice.revieweddatetime = new Date().toISOString();
    }

    console.log("Updating suggestion price:", suggestionPrice);

    let response = getHTTPServiceRequest("/ingredient/suggestionpricein/update", "PUT", suggestionPrice);
    if (response === "OK") {
        updateDateElement.textContent = new Date().toLocaleString();
        Notiflix.Notify.success("Updated successfully");
        $("#SuggestionPriceAddForm").modal("hide");
        loadInitialData();
        refreshSuggestionPriceTable();
        initializeForm();
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
        () => { initializeForm(); },
        () => {}
    );
};


// ============================================================
// PRINT / VIEW
// ============================================================

const viewSuggestionPriceRecord = (dataOb) => {

    tdViewSupplier.innerText   = dataOb.supplierhasingredient?.supplier?.contactperson ||
        dataOb.supplierhasingredient?.supplier?.companyname   || "-";
    tdViewIngredient.innerText = dataOb.supplierhasingredient?.ingredient?.name || "-";

    tdViewSuggestedDatetime.innerText = dataOb.suggesteddatetime
        ? dataOb.suggesteddatetime.slice(0, 10) + " " + dataOb.suggesteddatetime.slice(11, 19)
        : "-";
    tdViewReviewDatetime.innerText = dataOb.revieweddatetime
        ? dataOb.revieweddatetime.slice(0, 10) + " " + dataOb.revieweddatetime.slice(11, 19)
        : "-";


    tdViewSuggestedPrice.innerText = dataOb.suggestedprice != null
        ? "Rs. " + Number(dataOb.suggestedprice).toFixed(2) : "-";
    tdViewSupplierPrice.innerText  = dataOb.supplierprice  != null
        ? "Rs. " + Number(dataOb.supplierprice).toFixed(2)  : "-";

    tdViewStatus.innerText = dataOb.status || "-";
    tdViewNote.innerText   = dataOb.note   || "-";

    const editModalContent = suggestionPriceAddFormModalElement.querySelector(".modal-content");
    editModalContent.classList.add("blurred");

    const viewModal = new bootstrap.Modal(printViewModalElement);
    viewModal.show();

    printViewModalElement.addEventListener(
        "hidden.bs.modal",
        () => { editModalContent.classList.remove("blurred"); },
        { once: true }
    );
};

const handlePrint = () => {
    viewSuggestionPriceRecord(suggestionPrice);
};

const printSuggestionPriceRecord = () => {
    let newWindow = window.open();
    newWindow.document.write(
        "<html><head>" +
        "<title>Ingredient Suggestion Price Details</title>" +
        '<link rel="stylesheet" href="/css/bootstrap-5.3.3/css/bootstrap.min.css">' +
        "</head><body>" +
        divCardPrintSuggestionPrice.outerHTML +
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
        initializeEventListeners();
        refreshSuggestionPriceTable();}
    window.initPage();

window.printSuggestionPriceRecord = printSuggestionPriceRecord;
})();