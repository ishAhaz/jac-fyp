// ──────────────────────────────────────────────
// DOM ELEMENT REFERENCES
// ──────────────────────────────────────────────
(function () {
    let designationAddFormModalElement
        , tableBody
        , printViewModalElement
        , designationForm
        , createDateElement
        , updateDateElement
        , inputDesigNoElement
        , textDesignationNameElement
        , titleNewHide
        , titleEditHide
        , addNewDesignationElement
        , submitElement
        , updateElement
        , clearElement
        , printElement
        , deleteElement
        , tdDesignationName
        , divCardPrintDesignation;
    const queryElements = () => {
         designationAddFormModalElement = document.querySelector("#DesignationAddForm");

// Table body
         tableBody = document.querySelector("#tableBodyId");

// Print view modal
         printViewModalElement = document.querySelector("#DesignationViewModal");

// Form
         designationForm = document.querySelector("#formDesignation");

// Header info display
         createDateElement = document.querySelector("#createDate");
         updateDateElement = document.querySelector("#updateDate");
         inputDesigNoElement = document.querySelector("#InputDesigNo");

// Form fields
         textDesignationNameElement = document.querySelector("#textDesignationName");

// Title toggles
         titleNewHide = document.querySelector("#formTitleNew");
         titleEditHide = document.querySelector("#formTitleEdit");

// Buttons
         addNewDesignationElement = document.querySelector("#addNewDesignationId");
         submitElement = document.querySelector("#buttonSubmit");
         updateElement = document.querySelector("#buttonUpdate");
         clearElement = document.querySelector("#buttonClear");
         printElement = document.querySelector("#buttonPrint");
         deleteElement = document.querySelector("#buttonDelete");

// Print view cells
         tdDesignationName = document.querySelector("#tdDesignationName");
         divCardPrintDesignation = document.querySelector("#divCardPrintDesignation");
    }
// ──────────────────────────────────────────────
// STATE
// ──────────────────────────────────────────────

let designationList = [];

let designation    = {};
let oldDesignation = {};
let formMode       = "ADD";



// ──────────────────────────────────────────────
// EVENT LISTENERS
// ──────────────────────────────────────────────

const initializeEventListeners = () => {
    textDesignationNameElement.addEventListener("input", validateDesignationName);

    submitElement.addEventListener("click", handleSubmit);
    updateElement.addEventListener("click", handleUpdate);
    clearElement.addEventListener("click",  handleClear);
    deleteElement.addEventListener("click", handleDelete);
    printElement.addEventListener("click",  handlePrint);

    addNewDesignationElement.addEventListener("click", () => {
        initializeForm();
        titleEditHide.classList.add("d-none");
        titleNewHide.classList.remove("d-none");
    });
};

// ──────────────────────────────────────────────
// LOAD DATA
// ──────────────────────────────────────────────

const loadInitialData = () => {
    designationList = getServiceRequest("/employee/designations/alldata");
};

// ──────────────────────────────────────────────
// FORM INITIALIZE  (reset to ADD mode)
// ──────────────────────────────────────────────

const initializeForm = () => {
    designation    = {};
    oldDesignation = {};
    formMode       = "ADD";

    designationForm.reset();
    removeValidationStyles(designationForm);

    let dateTime = getTodayDateTime();
    let date     = dateTime.slice(0, 10);
    let time     = dateTime.slice(11, 19);
    createDateElement.textContent = date + " " + time;
    updateDateElement.textContent = "-";
    inputDesigNoElement.textContent = "-";

    submitElement.classList.remove("d-none");
    updateElement.classList.add("d-none");
    deleteElement.classList.add("d-none");
    printElement.classList.add("d-none");

    titleNewHide.classList.remove("d-none");
    titleEditHide.classList.add("d-none");
};

// ──────────────────────────────────────────────
// FIELD VALIDATION
// ──────────────────────────────────────────────

const validateDesignationName = () => {
    const value   = textDesignationNameElement.value.trim();
    const pattern = /^[A-Za-z ]{2,50}$/;

    if (!pattern.test(value)) {
        designation.name = null;
        setInvalid(textDesignationNameElement);
        return;
    }

    designation.name = value;

    if (formMode === "EDIT" && value !== oldDesignation.name) {
        setUpdated(textDesignationNameElement);
    } else {
        setValid(textDesignationNameElement);
    }
};

// ──────────────────────────────────────────────
// REFRESH MAIN TABLE
// ──────────────────────────────────────────────

const refreshDesignationTable = () => {
    if ($.fn.DataTable.isDataTable("#tableDesignation")) {
        $("#tableDesignation").DataTable().destroy();
    }

    tableBody.innerHTML = "";

    let displayProperty = [
        { propertyName: "designationid", dataType: "string"},
        { propertyName: "name", dataType: "string" }

    ];

    fillDataIntoTableThree(
        tableBody,
        designationList,
        displayProperty,
        refillDesignationForm
    );

    $("#tableDesignation").DataTable();
};

// ──────────────────────────────────────────────
// REFILL FORM  (EDIT mode — triggered from table row click)
// ──────────────────────────────────────────────

const refillDesignationForm = (dataOb) => {
    removeValidationStyles(designationForm);

    let myModal = new bootstrap.Modal(designationAddFormModalElement, {});
    formMode = "EDIT";

    designation    = getServiceRequest("/employee/designations/byid/" + dataOb.id);
    oldDesignation = JSON.parse(JSON.stringify(designation));

    // Created datetime
    if (designation.addeddatetime) {
        let added = designation.addeddatetime;
        createDateElement.textContent = added.slice(0, 10) + " " + added.slice(11, 19);
    } else {
        createDateElement.textContent = "-";
    }

    // Updated datetime
    if (designation.updateddatetime) {
        let updated = designation.updateddatetime;
        updateDateElement.textContent = updated.slice(0, 10) + " " + updated.slice(11, 19);
    } else {
        updateDateElement.textContent = "-";
    }

    // Designation No
    inputDesigNoElement.textContent = designation.designationid || "-";

    // Fields
    textDesignationNameElement.value = designation.name;

    // Button visibility
    submitElement.classList.add("d-none");
    updateElement.classList.remove("d-none");
    deleteElement.classList.remove("d-none");
    printElement.classList.remove("d-none");

    titleNewHide.classList.add("d-none");
    titleEditHide.classList.remove("d-none");

    myModal.show();
};

// ──────────────────────────────────────────────
// FORM ERROR CHECK
// ──────────────────────────────────────────────

const checkFormErrors = () => {
    let errors = [];

    if (!designation.name)
        errors.push("Designation Name has an error. Please check again.");

    return errors;
};

// ──────────────────────────────────────────────
// CRUD HANDLERS
// ──────────────────────────────────────────────

const handleSubmit = () => {
    const errors = checkFormErrors();
    if (errors.length > 0) {
        Notiflix.Notify.warning(errors.join(" | "));
        return;
    }

    console.log("Submitting designation:", designation);

    let response = getHTTPServiceRequest("/employee/designations/save", "POST", designation);

    if (response === "OK") {
        Notiflix.Notify.success("Saved successfully");
        $("#DesignationAddForm").modal("hide");
        loadInitialData();
        refreshDesignationTable();
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

    console.log("Updating designation:", designation);

    let response = getHTTPServiceRequest("/employee/designations/update", "PUT", designation);

    if (response === "OK") {
        updateDateElement.textContent = new Date().toLocaleString();
        Notiflix.Notify.success("Updated successfully");
        $("#DesignationAddForm").modal("hide");
        loadInitialData();
        refreshDesignationTable();
        initializeForm();
    } else {
        Notiflix.Notify.warning("Update failed: " + response);
    }
};

const handleDelete = () => {
    Notiflix.Confirm.show(
        "Delete Designation",
        "Are you sure you want to delete this designation?",
        "Yes, Delete",
        "Cancel",
        () => {
            let response = getHTTPServiceRequest(
                "/employee/designations/" + designation.id,
                "DELETE",
                null
            );

            if (response !== "AJAX error") {
                Notiflix.Notify.success("Deleted successfully");
                $("#DesignationAddForm").modal("hide");
                loadInitialData();
                refreshDesignationTable();
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
        () => {
            initializeForm();
        },
        () => {}
    );
};

// ──────────────────────────────────────────────
// PRINT / VIEW
// ──────────────────────────────────────────────

const viewDesignationRecord = (dataOb) => {
    tdDesignationName.innerText = dataOb.name || "-";

    const editModalContent = designationAddFormModalElement.querySelector(".modal-content");
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
    viewDesignationRecord(designation);
};

const printDesignationRecord = () => {
    let newWindow = window.open();
    newWindow.document.write(
        "<html><head>" +
        "<title>Print Designation</title>" +
        '<link rel="stylesheet" href="/css/bootstrap-5.3.3/css/bootstrap.min.css">' +
        "</head><body>" +
        divCardPrintDesignation.outerHTML +
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
        refreshDesignationTable();}
    window.initPage();


window.printDesignationRecord = printDesignationRecord;
})();