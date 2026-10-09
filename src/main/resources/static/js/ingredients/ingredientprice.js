// ============================================================
// DOM ELEMENT REFERENCES
// ============================================================
(function () {
    let ingredientPriceAddFormModalElement
        , tableBody
        , printViewModalElement
        ,  ingredientPriceForm
        ,  addDateElement
        ,  updateDateElement
        ,  inputIngredientElement
        ,  textSuggestedPriceElement
        ,  numberMarkupPriceElement
        ,  numberRealPricePerKgElement
        ,  selectStatusElement
        ,  userIdElement
        ,  updateElement
        ,  clearElement
        ,  printElement
        ,  tdViewAddedDatetime
        ,  tdViewIngredient
        ,  tdViewSuggestedPrice
        ,  tdViewMarkupPrice
        ,  tdViewSellPrice
        ,  tdViewStatus
        ,  tdViewUser
        ,  divCardPrintIngredientPrice;
    const queryElements = () => {
         ingredientPriceAddFormModalElement = document.querySelector("#IngredientPriceAddForm");

// Table body
         tableBody = document.querySelector("#tableBodyId");

// Print view modal
         printViewModalElement = document.querySelector("#IngredientPriceViewModal");

// Form
         ingredientPriceForm = document.querySelector("#formIngredientPrice");
         addDateElement = document.querySelector("#addDate");
         updateDateElement = document.querySelector("#updateDate");

// Form fields
         inputIngredientElement = document.querySelector("#inputIngredient");
         textSuggestedPriceElement = document.querySelector("#textSuggestedPrice");
         numberMarkupPriceElement = document.querySelector("#numberMarkupPrice");
         numberRealPricePerKgElement = document.querySelector("#numberRealPricePerKg");
         selectStatusElement = document.querySelector("#selectStatus");
         userIdElement = document.querySelector("#userId");

// Buttons
//const submitElement = document.querySelector("#buttonSubmit");
         updateElement = document.querySelector("#buttonUpdate");
         clearElement = document.querySelector("#buttonClear");
         printElement = document.querySelector("#buttonPrint");
//const deleteElement = document.querySelector("#buttonDelete");

// Print view cells
         tdViewAddedDatetime = document.querySelector("#tdViewAddedDatetime");
         tdViewIngredient = document.querySelector("#tdViewIngredient");
         tdViewSuggestedPrice = document.querySelector("#tdViewBuyPrice");
         tdViewMarkupPrice = document.querySelector("#tdViewMarkupPrice");
         tdViewSellPrice = document.querySelector("#tdViewSellPrice");
         tdViewStatus = document.querySelector("#tdViewStatus");
         tdViewUser = document.querySelector("#tdViewUser");
         divCardPrintIngredientPrice = document.querySelector("#divCardPrintIngredientPrice");
    }

// ============================================================
// STATE
// ============================================================

let ingredientPriceList = [];

let ingredientPrice    = {};
let oldIngredientPrice = {};
let formMode           = "ADD";


// ============================================================
// EVENT LISTENERS
// ============================================================
// NOTE: this form has no "Add New" trigger and no submit/POST path —
// it is purely EDIT, reached only via refillIngredientPriceForm() (row
// click), same pattern as the compost price / crop price modules.

const initializeEventListeners = () => {
    numberMarkupPriceElement.addEventListener("input",    validateMarkupPrice);
    // numberRealPricePerKgElement.addEventListener("input", validateRealPrice);
    selectStatusElement.addEventListener("change",        validateStatus);

    //submitElement.addEventListener("click", handleSubmit);
    updateElement.addEventListener("click", handleUpdate);
    clearElement.addEventListener("click",  handleClear);
    // deleteElement.addEventListener("click", handleDelete);
    printElement.addEventListener("click",  handlePrint);
};


// ============================================================
// LOAD INITIAL DATA
// ============================================================

const loadInitialData = () => {
    ingredientPriceList = getServiceRequest("/ingredient/ingredientprice/alldata/selected");
};


// ============================================================
// INITIALIZE FORM  (reset to ADD mode)
// ============================================================

const initializeForm = () => {
    ingredientPrice    = {};
    oldIngredientPrice = {};
    formMode           = "ADD";

    ingredientPriceForm.reset();
    removeValidationStyles(ingredientPriceForm);

    let dateTime = getTodayDateTime();
    let date     = dateTime.slice(0, 10);
    let time     = dateTime.slice(11, 19);
    addDateElement.textContent    = date + " " + time;
    updateDateElement.textContent = "-";

    // Read-only / auto-filled fields
    inputIngredientElement.value    = "";
    textSuggestedPriceElement.value       = "";

    // No ADD flow reaches this form (no submit button, no POST path).
    // The user field is only ever populated in
    // refillIngredientPriceForm() (display) and handleUpdate()
    // (reassignment).
    userIdElement.value    = "";
    userIdElement.readOnly = true;

    // submitElement.classList.remove("d-none");
    updateElement.classList.add("d-none");
    // deleteElement.classList.add("d-none");
    printElement.classList.add("d-none");
};


// ============================================================
// FIELD VALIDATION
// ============================================================

const validateMarkupPrice = () => {
    const value = parseFloat(numberMarkupPriceElement.value);

    if (isNaN(value) || value < 0) {
        ingredientPrice.markuppricepkg = null;
        setInvalid(numberMarkupPriceElement);
        return;
    }

    ingredientPrice.markuppricepkg = value;
    autoCalculateRealPrice(); // ← updated

    if (formMode === "EDIT" && value !== oldIngredientPrice.markuppricepkg) {
        setUpdated(numberMarkupPriceElement);
    } else {
        setValid(numberMarkupPriceElement);
    }
};



// buy price = real price - markup price
const autoCalculateRealPrice = () => {
    const buy    = parseFloat(textSuggestedPriceElement.value); // read-only from suggestion
    const markup = parseFloat(numberMarkupPriceElement.value);

    if (!isNaN(buy) && !isNaN(markup) && buy >= 0 && markup >= 0) {
        const real = parseFloat((buy + markup).toFixed(2));
        numberRealPricePerKgElement.value = real;
        ingredientPrice.realprice         = real;
    } else {
        numberRealPricePerKgElement.value = "";
        ingredientPrice.realprice         = null;
    }
};

const validateStatus = () => {
    const value = selectStatusElement.value;

    if (!value) {
        ingredientPrice.status = null;
        setInvalid(selectStatusElement);
        return;
    }

    ingredientPrice.status = value;

    if (formMode === "EDIT" && value !== oldIngredientPrice.status) {
        setUpdated(selectStatusElement);
    } else {
        setValid(selectStatusElement);
    }
};


// ============================================================
// REFRESH TABLE
// ============================================================

const refreshIngredientPriceTable = () => {


    ingredientPriceList.sort((a, b) => {
        const aPending = a.status === "Pending";
        const bPending = b.status === "Pending";
        if (aPending && !bPending) return -1;
        if (!aPending && bPending) return 1;
        return 0;
    });

    if ($.fn.DataTable.isDataTable("#tableIngredientPrice")) {
        $("#tableIngredientPrice").DataTable().destroy();
    }

    tableBody.innerHTML = "";

    let displayProperty = [
        { propertyName: getIngredientDisplay,   dataType: "function" },
        { propertyName: getSuggestedPriceDisplay,     dataType: "function" },
        { propertyName: getMarkupPriceDisplay,  dataType: "function" },
        { propertyName: getRealPriceDisplay,    dataType: "function" },
        { propertyName: getAddedDateDisplay,    dataType: "function" },
        { propertyName: getStatusDisplay,       dataType: "function" },
        { propertyName: getUserDisplay,         dataType: "function" },
    ];

    fillDataIntoTableThree(
        tableBody,
        ingredientPriceList,
        displayProperty,
        refillIngredientPriceForm
    );

    $("#tableIngredientPrice").DataTable();
};

// Table display helpers
const getIngredientDisplay  = (ob) => ob.ingredient?.name || "-";
const getSuggestedPriceDisplay    = (ob) => ob.suggestedpriceperkg  != null ? "Rs. " + ob.suggestedpriceperkg.toFixed(2)  : "-";
const getMarkupPriceDisplay = (ob) => ob.markuppricepkg != null ? "Rs. " + ob.markuppricepkg.toFixed(2) : "-";
const getRealPriceDisplay   = (ob) => ob.realprice      != null ? "Rs. " + ob.realprice.toFixed(2)      : "-";
const getAddedDateDisplay   = (ob) => ob.addeddatetime
    ? ob.addeddatetime.slice(0, 10) + " " + ob.addeddatetime.slice(11, 19)
    : "-";
const getUserDisplay        = (ob) => ob.user?.username || ob.user?.id || "-";
const getStatusDisplay      = (ob) => {
    if (!ob.status) return "-";
    if (ob.status === "Active"   )   return '<p class="p-1 bg-success">Active</p>';
    if (ob.status === "Inactive" ) return '<p class=" p-1 bg-secondary">Inactive</p>';
    if (ob.status === "Pending"  )  return '<p class=" p-1 bg-warning text-dark">Pending</p>';
    return ob.status;
};


// ============================================================
// REFILL FORM — EDIT MODE
// ============================================================

const refillIngredientPriceForm = (dataOb) => {
    removeValidationStyles(ingredientPriceForm);

    let myModal = new bootstrap.Modal(ingredientPriceAddFormModalElement, {});
    formMode = "EDIT";

    ingredientPrice    = getServiceRequest("/ingredient/ingredientprice/byid/" + dataOb.id);
    oldIngredientPrice = JSON.parse(JSON.stringify(ingredientPrice));

    // Dates
    addDateElement.textContent = ingredientPrice.addeddatetime
        ? ingredientPrice.addeddatetime.slice(0, 10) + " " + ingredientPrice.addeddatetime.slice(11, 19)
        : "-";

    updateDateElement.textContent = ingredientPrice.updateddatetime
        ? ingredientPrice.updateddatetime.slice(0, 10) + " " + ingredientPrice.updateddatetime.slice(11, 19)
        : "-";

    // Read-only auto-filled fields
    inputIngredientElement.value  = ingredientPrice.ingredient?.name || "";
    textSuggestedPriceElement.value     = ingredientPrice.suggestedpriceperkg != null
        ? ingredientPrice.suggestedpriceperkg.toFixed(2)
        : "";

    // Editable fields
    numberMarkupPriceElement.value    = ingredientPrice.markuppricepkg != null ? ingredientPrice.markuppricepkg : "";
    numberRealPricePerKgElement.value = ingredientPrice.realprice      != null ? ingredientPrice.realprice      : "";
    numberRealPricePerKgElement.readOnly = true;
    selectStatusElement.value         = ingredientPrice.status         || "";

    // User field is DISPLAY ONLY here — shows whoever is currently
    // stamped on the record (last updater, or creator if never
    // updated). We do NOT touch ingredientPrice.user on open. It
    // only gets reassigned to the current session user inside
    // handleUpdate(), and only if the record is actually changed
    // and saved — see hasIngredientPriceChanged(). Opening or
    // cancelling never reassigns it.
    userIdElement.value    = ingredientPrice.user?.username || ingredientPrice.user?.id || "-";
    userIdElement.readOnly = true;

    // Button visibility
    //submitElement.classList.add("d-none");
    updateElement.classList.remove("d-none");
    // deleteElement.classList.remove("d-none");
    printElement.classList.remove("d-none");

    myModal.show();
};


// ============================================================
// CHANGE DETECTION — used to decide whether the "last updated by"
// user should be overwritten with the currently logged-in user.
// Only the editable fields on this form are compared: markup price
// and status. Real price is derived from suggested price + markup,
// so it doesn't need separate comparison.
// ============================================================

const hasIngredientPriceChanged = () => {
    if (ingredientPrice.markuppricepkg !== oldIngredientPrice.markuppricepkg) return true;
    if (ingredientPrice.status !== oldIngredientPrice.status) return true;
    return false;
};


// ============================================================
// FORM ERROR CHECK
// ============================================================

const checkFormErrors = () => {
    let errors = [];

    if (!ingredientPrice.status)
        errors.push("Status has an error. Please check again.");
    if (ingredientPrice.realprice == null || isNaN(ingredientPrice.realprice))
        errors.push("Real Price Per Kg has an error. Please check again.");
    if (ingredientPrice.markuppricepkg == null || isNaN(ingredientPrice.markuppricepkg))
        errors.push("Markup Price has an error. Please check again.");
    if (ingredientPrice.suggestedpriceperkg == null || ingredientPrice.suggestedpriceperkg < 0)
        errors.push("Suggested Price calculation error. Please check markup and real price values.");

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
    if (hasIngredientPriceChanged()) {
        loadLoggedInUserInto(ingredientPrice, userIdElement);
    }

    if (!ingredientPrice.user) {
        Notiflix.Notify.warning("User ID has an error. Please check again.");
        return;
    }

    console.log("Updating Ingredient Price:", ingredientPrice);

    let response = getHTTPServiceRequest("/ingredient/ingredientprice/update", "PUT", ingredientPrice);

    if (response === "OK") {
        updateDateElement.textContent = new Date().toLocaleString();
        Notiflix.Notify.success("Updated successfully");
        $("#IngredientPriceAddForm").modal("hide");
        loadInitialData();
        refreshIngredientPriceTable();
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

const viewIngredientPriceRecord = (dataOb) => {
    tdViewAddedDatetime.innerText = dataOb.addeddatetime
        ? dataOb.addeddatetime.slice(0, 10) + " " + dataOb.addeddatetime.slice(11, 19)
        : "-";
    tdViewIngredient.innerText  = dataOb.ingredient?.name   || "-";
    tdViewSuggestedPrice.innerText    = dataOb.suggestedpriceperkg  != null ? "Rs. " + dataOb.suggestedpriceperkg.toFixed(2)  : "-";
    tdViewMarkupPrice.innerText = dataOb.markuppricepkg != null ? "Rs. " + dataOb.markuppricepkg.toFixed(2) : "-";
    tdViewSellPrice.innerText   = dataOb.realprice      != null ? "Rs. " + dataOb.realprice.toFixed(2)      : "-";
    tdViewStatus.innerText      = dataOb.status         || "-";
    tdViewUser.innerText        = dataOb.user?.username || dataOb.user?.id || "-";

    const editModalContent = ingredientPriceAddFormModalElement.querySelector(".modal-content");
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
    viewIngredientPriceRecord(ingredientPrice);
};

const printIngredientPriceRecord = () => {
    let newWindow = window.open();
    newWindow.document.write(
        "<html><head>" +
        "<title>Ingredient Price Details</title>" +
        '<link rel="stylesheet" href="/css/bootstrap-5.3.3/css/bootstrap.min.css">' +
        "</head><body>" +
        divCardPrintIngredientPrice.outerHTML +
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
    refreshIngredientPriceTable();}
window.initPage();
window.printIngredientPriceRecord = printIngredientPriceRecord;




})();