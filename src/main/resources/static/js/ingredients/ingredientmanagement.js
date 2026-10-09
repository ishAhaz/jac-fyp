// ── DOM references ───────────────────────────────────────────
(function () {
    let ingredientAddFormModelElement
        ,  tableBody
        ,  editCanvasStatus
        ,  editCanvasUnit
        ,  printViewModelElement
        , ingredientForm
        ,  ingredientAddElement
        ,  regDateElement
        ,  updateDateElement
        ,  ingredientNoElement
        ,  nameElement
        , descriptionElement
        , userIdElement
        , titleNewHide
        , titleEditHide
        , submitElement
        ,  updateElement
        ,  clearElement
        , printElement
        , deleteElement;
    const queryElements = () => {
         ingredientAddFormModelElement = document.querySelector("#IngredientAddForm");

// Table body
         tableBody = document.querySelector("#tableBodyId");

// Dropdowns
         editCanvasStatus = document.querySelector("#selectStatus");
         editCanvasUnit = document.querySelector("#selectUnit");

// Print-view modal
         printViewModelElement = document.querySelector("#IngredientViewModal");

// Form fields
         ingredientForm = document.querySelector("#formIngredient");
         ingredientAddElement = document.querySelector("#addNewIngredientId");
         regDateElement = document.querySelector("#regDate");
         updateDateElement = document.querySelector("#updateDate");
         ingredientNoElement = document.querySelector("#InputIngredientNo");
         nameElement = document.querySelector("#textName");
         descriptionElement = document.querySelector("#textDescription");
         userIdElement = document.querySelector("#userId");
// const statushide           = document.querySelector("#ingredientStatusCol");
         titleNewHide = document.querySelector("#formTitleNew");
         titleEditHide = document.querySelector("#formTitleEdit");

// Buttons
         submitElement = document.querySelector("#buttonSubmit");
         updateElement = document.querySelector("#buttonUpdate");
         clearElement = document.querySelector("#buttonClear");
         printElement = document.querySelector("#buttonPrint");
         deleteElement = document.querySelector("#buttonDelete");
    }
// ── State ────────────────────────────────────────────────────
let ingredientList = [];
let ingredient     = {};
let oldIngredient  = {};
let formMode       = "ADD";



// ============================================================
// EVENT LISTENERS
// ============================================================
const initializeEventListeners = () => {
    // form-field validation
    nameElement.addEventListener("input",        validateName);
    editCanvasUnit.addEventListener("change",    validateUnit);
    editCanvasStatus.addEventListener("change",  validateStatus);
    descriptionElement.addEventListener("input", validateDescription);
    // userIdElement is read-only and fully managed by loadLoggedInUserInto()
    // (on open/ADD) and by hasIngredientChanged() (on update) — no manual
    // input validation needed here anymore.

    ingredientAddElement.addEventListener("click", () => {
        initializeForm();
        titleEditHide.classList.add("d-none");
        titleNewHide.classList.remove("d-none");
    });


    // buttons
    submitElement.addEventListener("click", handleSubmit);
    updateElement.addEventListener("click", handleUpdate);
    clearElement.addEventListener("click",  handleClear);
    deleteElement.addEventListener("click", handleDelete);
    printElement.addEventListener("click",  handlePrint);
};

// ============================================================
// FORM INITIALISATION
// ============================================================
const initializeForm = () => {
    ingredient    = {};
    oldIngredient = {};
    formMode      = "ADD";

    ingredientForm.reset();
    removeValidationStyles(ingredientForm);

    ingredientNoElement.textContent = "-";

    const dateTime = getTodayDateTime();
    const date     = dateTime.slice(0, 10);
    const time     = dateTime.slice(11, 19);
    regDateElement.textContent    = `${date} ${time}`;
    updateDateElement.textContent = "-";

    generateStatus();
    editCanvasStatus.value = "";
    editCanvasUnit.value   = "";

    // Auto fill currently logged-in user as the record's user (creation case)
    loadLoggedInUserInto(ingredient, userIdElement);
    userIdElement.readOnly = true;

    // Default status → ACTIVE  (matches enum value in backend)
    const activeStatus = ingredientStatuses.find(s => s.name === "Active");
    if (activeStatus) {
        ingredient.status = activeStatus.name;          // ← entity field: status
        editCanvasStatus.value = JSON.stringify(activeStatus);
    }

    // statushide.classList.add("d-none");

    submitElement.classList.remove("d-none");
    updateElement.classList.add("d-none");
    deleteElement.classList.add("d-none");
    printElement.classList.add("d-none");
};


// ============================================================
// INITIAL DATA LOAD
// ============================================================
const loadInitialData = () => {
    loadIngredientStatus();
    ingredientList = getServiceRequest("/ingredient/ingredientlist/dropdown/selected/excludewater");
};


// ============================================================
// TABLE
// ============================================================
const refreshIngredientTable = () => {
    if ($.fn.DataTable.isDataTable("#tableIngredient")) {
        $("#tableIngredient").DataTable().destroy();
    }

    tableBody.innerHTML = "";

    const displayProperty = [
        { propertyName: "ingredientid",  dataType: "string"   },
        { propertyName: "name",          dataType: "string"   },
        { propertyName: "unit",          dataType: "string"   },
        { propertyName: getStatusBadge,  dataType: "function" },

    ];

    fillDataIntoTableThree(
        tableBody,
        ingredientList,
        displayProperty,
        refillIngredientForm
    );

    $("#tableIngredient").DataTable();
};
const getStatusBadge = (ob) => {
    if (ob.status === "Active") {
        return '<p class="p-1 bg-info">Active</p>';
    }
    if (ob.status === "Inactive") {
        return '<p class="p-1 bg-danger">Inactive</p>';
    }
    return ob.status ?? "";
};


// ============================================================
// VALIDATORS
// ============================================================
const validateName = () => {
    const value   = nameElement.value.trim();
    const pattern = /^[A-Za-z0-9 ]{2,100}$/;

    if (!pattern.test(value)) {
        ingredient.name = null;
        setInvalid(nameElement);
        return;
    }

    ingredient.name = value;

    if (formMode === "EDIT" && value !== oldIngredient.name) {
        setUpdated(nameElement);
    } else {
        setValid(nameElement);
    }
};
const validateUnit = () => {
    const value = editCanvasUnit.value;

    if (!value) {
        ingredient.unit = null;
        setInvalid(editCanvasUnit);
        return;
    }

    ingredient.unit = value;

    if (formMode === "EDIT" && value !== oldIngredient.unit) {
        setUpdated(editCanvasUnit);
    } else {
        setValid(editCanvasUnit);
    }
};
const validateDescription = () => {
    const value   = descriptionElement.value.trim();
    const pattern = /^.{5,500}$/;

    if (value === "") {
        ingredient.description = null;
        setValid(descriptionElement);
        return;
    }

    if (pattern.test(value)) {
        ingredient.description = value;

        if (formMode === "EDIT" && value !== oldIngredient.description) {
            setUpdated(descriptionElement);
        } else {
            setValid(descriptionElement);
        }
    } else {
        ingredient.description = null;
        setInvalid(descriptionElement);
    }
};

// ── Status dropdown ──────────────────────────────────────────
let ingredientStatuses = [];

const loadIngredientStatus = () => {
    // Values must match your backend Status enum exactly
    ingredientStatuses = [
        { name: "Active"   },
        { name: "Inactive" },
    ];
};

const generateStatus = () => {
    fillDataIntoSelect(
        editCanvasStatus,
        "Please select status..",
        ingredientStatuses,
        "name"
    );
};

const validateStatus = () => {
    const value = editCanvasStatus.value;

    if (value === "") {
        ingredient.status = null;
        setInvalid(editCanvasStatus);
        return;
    }

    const parsed = JSON.parse(value);
    ingredient.status = parsed.name;

    if (formMode === "EDIT" &&
        JSON.stringify(ingredient.status) !== JSON.stringify(oldIngredient.status)) {
        setUpdated(editCanvasStatus);
    } else {
        setValid(editCanvasStatus);
    }
};



// ============================================================
// REFILL FORM (row click → EDIT mode)
// ============================================================
const refillIngredientForm = (dataob) => {
    removeValidationStyles(ingredientForm);

    const mymodal = new bootstrap.Modal(ingredientAddFormModelElement, {});
    formMode = "EDIT";

    ingredient    = getServiceRequest("/ingredient/ingredientlist/byid/" + dataob.id);
    oldIngredient = JSON.parse(JSON.stringify(ingredient));

    // Registration date/time
    const dateTimeEdit = ingredient.addeddatetime;
    const dateEdit     = dateTimeEdit.slice(0, 10);
    const timeEdit     = dateTimeEdit.slice(11, 19);
    regDateElement.textContent = `${dateEdit} ${timeEdit}`;

    // Updated date/time
    if (!ingredient.updateddatetime) {
        updateDateElement.textContent = "-";
    } else {
        const dateTimeUpdate = ingredient.updateddatetime;
        const dateUpdate     = dateTimeUpdate.slice(0, 10);
        const timeUpdate     = dateTimeUpdate.slice(11, 19);
        updateDateElement.textContent = `${dateUpdate} ${timeUpdate}`;
    }

    // Populate fields
    ingredientNoElement.textContent = ingredient.ingredientid;
    nameElement.value               = ingredient.name;
    editCanvasUnit.value            = ingredient.unit;
    descriptionElement.value        = ingredient.description;

    // User field is DISPLAY ONLY here — shows whoever is currently
    // stamped on the record (last updater, or creator if never
    // updated). We do NOT touch ingredient.user on open. It only
    // gets reassigned to the current session user inside
    // handleUpdate(), and only if the record is actually changed
    // and saved — see hasIngredientChanged(). Opening or cancelling
    // never reassigns it.
    userIdElement.value    = ingredient.user?.username || ingredient.user?.id || "-";
    userIdElement.readOnly = true;

    // Status dropdown  ← entity: status
    generateStatus();
    editCanvasStatus.value = JSON.stringify({ name: ingredient.status });

    // // Show status column in edit mode
    // statushide.classList.remove("d-none");

    // Button visibility
    submitElement.classList.add("d-none");
    updateElement.classList.remove("d-none");
    deleteElement.classList.remove("d-none");
    printElement.classList.remove("d-none");
    titleEditHide.classList.remove("d-none");
    titleNewHide.classList.add("d-none");

    mymodal.show();
};


// ============================================================
// CHANGE DETECTION — used to decide whether the "last updated by"
// user should be overwritten with the currently logged-in user.
// ============================================================

const hasIngredientChanged = () => {
    if (ingredient.name !== oldIngredient.name) return true;
    if (ingredient.unit !== oldIngredient.unit) return true;
    if (ingredient.status !== oldIngredient.status) return true;
    if ((ingredient.description || null) !== (oldIngredient.description || null)) return true;
    return false;
};


// ============================================================
// FORM ERROR CHECK
// ============================================================
const checkFormErrors = () => {
    const errors = [];

    if (!ingredient.name)        errors.push("Ingredient Name has an error. Please check again");
    if (!ingredient.unit)        errors.push("Unit has an error. Please check again");
    if (!ingredient.status)      errors.push("Ingredient Status has an error. Please check again");
    if (!ingredient.user)        errors.push("User ID has an error. Please check again");
    return errors;
};


// ============================================================
// HANDLERS
// ============================================================
const handleSubmit = () => {
    const errors = checkFormErrors();
    if (errors.length > 0) {
        Notiflix.Notify.warning(errors.join(" | "));
        return;
    }

    console.log("Submitting ingredient:", ingredient);

    const response = getHTTPServiceRequest("/ingredient/ingredientlist/save", "POST", ingredient);

    if (response === "OK") {
        Notiflix.Notify.success("Saved successfully");
        $("#IngredientAddForm").modal("hide");
        loadInitialData();
        refreshIngredientTable();
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
    if (hasIngredientChanged()) {
        loadLoggedInUserInto(ingredient, userIdElement);
    }

    console.log("Updating ingredient:", ingredient);

    const response = getHTTPServiceRequest("/ingredient/ingredientlist/update", "PUT", ingredient);

    if (response === "OK") {
        updateDateElement.textContent = new Date().toLocaleString();
        Notiflix.Notify.success("Updated successfully");
        $("#IngredientAddForm").modal("hide");
        loadInitialData();
        refreshIngredientTable();
        initializeForm();
    } else {
        Notiflix.Notify.warning("Update failed: " + response);
    }
};

const handleDelete = () => {
    Notiflix.Confirm.show(
        "Delete Ingredient",
        "Are you sure you want to delete this ingredient?",
        "Yes, Delete",
        "Cancel",
        () => {
            const response = getHTTPServiceRequest(
                "/ingredient/ingredientlist/" + ingredient.id,
                "DELETE",
                null
            );

            if (response !== "AJAX error") {
                Notiflix.Notify.success("Deleted successfully");
                $("#IngredientAddForm").modal("hide");
                loadInitialData();
                refreshIngredientTable();
                initializeForm();
            } else {
                Notiflix.Notify.failure("Delete failed");
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

// ── Print helpers ────────────────────────────────────────────
const printIngredientRecord = () => {
    const newWindow = window.open();
    newWindow.document.write(
        "<html><head>" +
        "<title>Print Ingredient</title>" +
        '<link rel="stylesheet" href="/css/bootstrap-5.3.3/css/bootstrap.min.css">' +
        "</head><body>" +
        divCardPrintIngredient.outerHTML +
        "</body></html>"
    );

    setInterval(() => {
        newWindow.stop();
        newWindow.print();
        newWindow.close();
    }, 500);
};

const viewIngredient = (dataOb) => {
    tdIngredientId.innerText = dataOb.ingredientID          || "-";
    tdName.innerText         = dataOb.name                  || "-";
    tdUnit.innerText         = dataOb.unit                  || "-";
    tdDescription.innerText  = dataOb.description           || "-";
    tdStatus.innerText       = dataOb.status                || "-";  // ← entity: status

    const editModalContent = ingredientAddFormModelElement.querySelector(".modal-content");
    editModalContent.classList.add("blurred");

    const viewModal = new bootstrap.Modal(printViewModelElement);
    viewModal.show();

    printViewModelElement.addEventListener(
        "hidden.bs.modal",
        () => { editModalContent.classList.remove("blurred"); },
        { once: true }
    );
};

const handlePrint = () => {
    viewIngredient(ingredient);
};



    window.initPage = function () {
        queryElements();
        loadInitialData();
        initializeForm();
        initializeEventListeners();
        refreshIngredientTable();}
window.initPage();
    window.printIngredientRecord = printIngredientRecord;

})();