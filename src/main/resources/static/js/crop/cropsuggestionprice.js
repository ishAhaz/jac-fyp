// ============================================================
// DOM ELEMENT REFERENCES
// ============================================================

(function () {

    let suggestionPriceAddFormModalElement
        ,  tableBody
        ,  printViewModalElement
        , suggestionPriceForm
        ,  suggestDateElement
        , updateDateElement
        ,  inputFarmerElement
        , inputCropElement
        , numberFarmerPriceElement
        , numberSuggestedPriceElement
        , userIdElement
        , selectStatusElement
        , textNoteElement
        , updateElement
        , clearElement
        , printElement
        , tdViewFarmer
        , tdViewCrop
        , tdViewSuggestedDatetime
        , tdViewReviewDatetime
        ,  tdViewSuggestedPrice
  ,  tdViewFarmerPrice
  ,  tdViewStatus
  ,  tdViewNote
  ,  divCardPrintSuggestionPrice;
    const queryElements = () => {
         suggestionPriceAddFormModalElement = document.querySelector("#SuggestionPriceAddForm");

// Table body
         tableBody = document.querySelector("#tableBodyId");

// Print view modal
         printViewModalElement = document.querySelector("#SuggestionPriceViewModal");

// Form
         suggestionPriceForm = document.querySelector("#formSuggestionPrice");

// Header info display
         suggestDateElement = document.querySelector("#suggestDate");
         updateDateElement = document.querySelector("#updateDate");   // shows reviewdatetime — entity has no updateddatetime field

// Form fields — Farmer / Crop are auto-filled, read-only identity display,
// reached through crophasfarmer.farmer / crophasfarmer.cropListManagement
         inputFarmerElement = document.querySelector("#inputFarmer");
         inputCropElement = document.querySelector("#inputCrop");
         numberFarmerPriceElement = document.querySelector("#numberFarmerPrice");
         numberSuggestedPriceElement = document.querySelector("#numberSuggestedPrice");
         userIdElement = document.querySelector("#userId");
         selectStatusElement = document.querySelector("#selectStatus");
         textNoteElement = document.querySelector("#textNote");

// Buttons — this form is EDIT-only, reached via row click, same
// pattern as the ingredient suggestion price / compost price /
// crop price modules. No "Add New" trigger, no Submit, no Delete.
         updateElement = document.querySelector("#buttonUpdate");
         clearElement = document.querySelector("#buttonClear");
         printElement = document.querySelector("#buttonPrint");

// Print view cells
         tdViewFarmer = document.querySelector("#tdViewFarmer");
         tdViewCrop = document.querySelector("#tdViewCrop");
         tdViewSuggestedDatetime = document.querySelector("#tdViewSuggestedDatetime");
         tdViewReviewDatetime = document.querySelector("#tdViewReviewDatetime");
         tdViewSuggestedPrice = document.querySelector("#tdViewSuggestedPrice");
         tdViewFarmerPrice = document.querySelector("#tdViewFarmerPrice");
         tdViewStatus = document.querySelector("#tdViewStatus");
         tdViewNote = document.querySelector("#tdViewNote");
         divCardPrintSuggestionPrice = document.querySelector("#divCardPrintSuggestionPrice");

    }
// ============================================================
// STATE
// ============================================================

let suggestionPriceList = [];

let suggestionPrice    = {};
let oldSuggestionPrice = {};
let formMode           = "ADD";




// ============================================================
// EVENT LISTENERS
// ============================================================
// NOTE: this form has no "Add New" trigger and no submit/POST path —
// it is purely EDIT, reached only via refillSuggestionPriceForm()
// (row click). userIdElement is read-only and fully managed by
// refillSuggestionPriceForm() (display) and handleUpdate()
// (reassignment) — no manual input validation on it is needed.

const initializeEventListeners = () => {
    numberSuggestedPriceElement.addEventListener("input", validateSuggestedPrice);
    selectStatusElement.addEventListener("change",        validateStatus);
    textNoteElement.addEventListener("input",             validateNote);

    updateElement.addEventListener("click", handleUpdate);
    clearElement.addEventListener("click",  handleClear);
    printElement.addEventListener("click",  handlePrint);
};


// ============================================================
// LOAD INITIAL DATA
// ============================================================

const loadInitialData = () => {
    suggestionPriceList = getServiceRequest("/crop/cropsuggestionprice/alldata/selected");
};


// ============================================================
// INITIALIZE FORM  (reset to ADD mode / clean baseline)
// ============================================================

const initializeForm = () => {
    suggestionPrice    = {};
    oldSuggestionPrice = {};
    formMode           = "ADD";

    suggestionPriceForm.reset();
    removeValidationStyles(suggestionPriceForm);

    let dateTime = getTodayDateTime();
    let date = dateTime.slice(0, 10);
    let time = dateTime.slice(11, 19);
    suggestDateElement.textContent = date + " " + time;
    updateDateElement.textContent  = "-";

    // Read-only / auto-filled identity fields
    inputFarmerElement.value          = "";
    inputFarmerElement.readOnly       = true;
    inputCropElement.value            = "";
    inputCropElement.readOnly         = true;
    numberFarmerPriceElement.value    = "";
    numberFarmerPriceElement.readOnly = true;

    numberSuggestedPriceElement.value = "";
    selectStatusElement.value         = "";
    textNoteElement.value             = "";

    // No ADD flow reaches this form (no submit button, no POST path).
    // The user field is only ever populated in
    // refillSuggestionPriceForm() (display) and handleUpdate()
    // (reassignment).
    userIdElement.value    = "";
    userIdElement.readOnly = true;

    updateElement.classList.add("d-none");
    printElement.classList.add("d-none");
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

    if (formMode === "EDIT" && value !== oldSuggestionPrice.suggestedprice) {
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

    if (formMode === "EDIT" && value !== oldSuggestionPrice.status) {
        setUpdated(selectStatusElement);
    } else {
        setValid(selectStatusElement);
    }
};

const validateNote = () => {
    suggestionPrice.note = textNoteElement.value.trim() || null;
};


// ============================================================
// REFRESH MAIN TABLE
// ============================================================

const refreshSuggestionPriceTable = () => {
    if ($.fn.DataTable.isDataTable("#tableSuggestionPrice")) {
        $("#tableSuggestionPrice").DataTable().destroy();
    }

    tableBody.innerHTML = "";

    let displayProperty = [
        { propertyName: getFarmerDisplay,          dataType: "function" },
        { propertyName: getCropDisplay,             dataType: "function" },
        { propertyName: getSuggestedDateDisplay,    dataType: "function" },
        { propertyName: getFarmerPriceDisplay,      dataType: "function" },
        { propertyName: getSuggestedPriceDisplay,   dataType: "function" },
        { propertyName: getStatusDisplay,           dataType: "function" },
        { propertyName: getReviewDateDisplay,       dataType: "function" },
        { propertyName: getUserDisplay,             dataType: "function" },
    ];

    fillDataIntoTableThree(
        tableBody,
        suggestionPriceList,
        displayProperty,
        refillSuggestionPriceForm
    );

    $("#tableSuggestionPrice").DataTable();
};

// Table display helpers — farmer/crop reached via crophasfarmer
const getFarmerDisplay        = (ob) => ob.crophasfarmer?.farmer?.fullname || ob.crophasfarmer?.farmer?.callingname || "-";
const getCropDisplay          = (ob) => ob.crophasfarmer?.cropListManagement?.name || "-";
const getFarmerPriceDisplay   = (ob) => ob.farmerprice    != null ? "Rs. " + ob.farmerprice.toFixed(2)    : "-";
const getSuggestedPriceDisplay = (ob) => ob.suggestedprice != null ? "Rs. " + ob.suggestedprice.toFixed(2) : "-";
const getUserDisplay          = (ob) => ob.user?.username || ob.user?.id || "-";

const getSuggestedDateDisplay = (ob) => ob.suggesteddatetime
    ? ob.suggesteddatetime.slice(0, 10) + " " + ob.suggesteddatetime.slice(11, 19)
    : "-";

// Entity field is reviewdatetime — no updateddatetime exists on this entity
const getReviewDateDisplay = (ob) => ob.reviewdatetime
    ? ob.reviewdatetime.slice(0, 10) + " " + ob.reviewdatetime.slice(11, 19)
    : "-";

const getStatusDisplay = (ob) => {
    if (!ob.status) return "-";
    if (ob.status === "Approved") return '<p class="p-1 bg-success">Approved</p>';
    if (ob.status === "Rejected") return '<p class="p-1 bg-danger">Rejected</p>';
    if (ob.status === "Pending")  return '<p class="p-1 bg-warning text-dark">Pending</p>';
    return ob.status;
};


// ============================================================
// REFILL FORM — EDIT MODE (triggered from table row click)
// ============================================================

const refillSuggestionPriceForm = (dataOb) => {
    removeValidationStyles(suggestionPriceForm);

    let myModal = new bootstrap.Modal(suggestionPriceAddFormModalElement, {});
    formMode = "EDIT";

    suggestionPrice    = getServiceRequest("/crop/cropsuggestionprice/byid/" + dataOb.id);
    oldSuggestionPrice = JSON.parse(JSON.stringify(suggestionPrice));

    // Dates
    suggestDateElement.textContent = suggestionPrice.suggesteddatetime
        ? suggestionPrice.suggesteddatetime.slice(0, 10) + " " + suggestionPrice.suggesteddatetime.slice(11, 19)
        : "-";

    updateDateElement.textContent = suggestionPrice.reviewdatetime
        ? suggestionPrice.reviewdatetime.slice(0, 10) + " " + suggestionPrice.reviewdatetime.slice(11, 19)
        : "-";

    // Read-only auto-filled identity fields — reached via crophasfarmer
    inputFarmerElement.value = suggestionPrice.crophasfarmer?.farmer?.fullname
        || suggestionPrice.crophasfarmer?.farmer?.callingname || "";
    inputFarmerElement.readOnly = true;

    inputCropElement.value = suggestionPrice.crophasfarmer?.cropListManagement?.name || "";
    inputCropElement.readOnly = true;

    numberFarmerPriceElement.value = suggestionPrice.farmerprice != null
        ? suggestionPrice.farmerprice.toFixed(2)
        : "";
    numberFarmerPriceElement.readOnly = true;

    // Editable fields
    numberSuggestedPriceElement.value = suggestionPrice.suggestedprice != null
        ? suggestionPrice.suggestedprice
        : "";
    selectStatusElement.value = suggestionPrice.status || "";
    textNoteElement.value     = suggestionPrice.note   || "";

    // User field is DISPLAY ONLY here — shows whoever is currently
    // stamped on the record (last updater, or creator if never
    // updated). We do NOT touch suggestionPrice.user on open. It
    // only gets reassigned to the current session user inside
    // handleUpdate(), and only if the record is actually changed
    // and saved — see hasSuggestionPriceChanged(). Opening or
    // cancelling never reassigns it.
    userIdElement.value    = suggestionPrice.user?.username || suggestionPrice.user?.id || "-";
    userIdElement.readOnly = true;

    // Button visibility
    updateElement.classList.remove("d-none");
    printElement.classList.remove("d-none");

    myModal.show();
};


// ============================================================
// CHANGE DETECTION — used to decide whether the "last updated by"
// user should be overwritten with the currently logged-in user.
// Only the editable fields on this form are compared: suggested
// price, status, and note. Farmer price and identity fields are
// read-only auto-fills, so they don't need comparison.
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

    if (!suggestionPrice.status)
        errors.push("Status has an error. Please check again.");

    if (!suggestionPrice.user)
        errors.push("User ID has an error. Please check again.");

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

    console.log("Updating crop suggestion price:", suggestionPrice);

    let response = getHTTPServiceRequest("/crop/cropsuggestionprice/update", "PUT", suggestionPrice);

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
        () => {
            initializeForm();
        },
        () => {}
    );
};


// ============================================================
// PRINT / VIEW
// ============================================================

const viewSuggestionPriceRecord = (dataOb) => {
    tdViewFarmer.innerText = dataOb.crophasfarmer?.farmer?.fullname
        || dataOb.crophasfarmer?.farmer?.callingname || "-";
    tdViewCrop.innerText = dataOb.crophasfarmer?.cropListManagement?.name || "-";

    tdViewSuggestedDatetime.innerText = dataOb.suggesteddatetime
        ? dataOb.suggesteddatetime.slice(0, 10) + " " + dataOb.suggesteddatetime.slice(11, 19)
        : "-";
    tdViewReviewDatetime.innerText = dataOb.reviewdatetime
        ? dataOb.reviewdatetime.slice(0, 10) + " " + dataOb.reviewdatetime.slice(11, 19)
        : "-";

    tdViewSuggestedPrice.innerText = dataOb.suggestedprice != null
        ? "Rs. " + dataOb.suggestedprice.toFixed(2)
        : "-";
    tdViewFarmerPrice.innerText = dataOb.farmerprice != null
        ? "Rs. " + dataOb.farmerprice.toFixed(2)
        : "-";

    tdViewStatus.innerText = dataOb.status || "-";
    tdViewNote.innerText   = dataOb.note   || "-";

    const editModalContent = suggestionPriceAddFormModalElement.querySelector(".modal-content");
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
    viewSuggestionPriceRecord(suggestionPrice);
};

const printSuggestionPriceRecord = () => {
    let newWindow = window.open();
    newWindow.document.write(
        "<html><head>" +
        "<title>Crop Suggestion Price Details</title>" +
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
        queryElements()
        loadInitialData();
        initializeForm();
        initializeEventListeners();
        refreshSuggestionPriceTable();}
    window.initPage();

window.printSuggestionPriceRecord = printSuggestionPriceRecord;

})();