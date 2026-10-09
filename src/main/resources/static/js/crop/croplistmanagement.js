// ── DOM references ───────────────────────────────────────────


(function () {
    let cropAddFormModelElement
        , tableBody
        , editCanvasStatus
        , printViewModelElement
        , cropForm
        ,  cropAddElement
        ,regDateElement
        ,updateDateElement
        ,cropNoElement
        ,   nameElement
        ,descriptionElement
        ,userIdElement
        ,  titleNewHide
        ,titleEditHide
        ,  submitElement
        , updateElement
        , clearElement
        , printElement
        , deleteElement;

    const queryElements = () => {
         cropAddFormModelElement = document.querySelector("#CropAddForm");

// Table body
         tableBody = document.querySelector("#tableBodyId");

// Dropdowns
         editCanvasStatus = document.querySelector("#selectStatus");

// Print-view modal
         printViewModelElement = document.querySelector("#CropListViewModal");

// Form fields
         cropForm = document.querySelector("#formCrop");
         cropAddElement = document.querySelector("#addNewCropId");
         regDateElement = document.querySelector("#regDate");
         updateDateElement = document.querySelector("#updateDate");
         cropNoElement = document.querySelector("#InputRegNo");
         nameElement = document.querySelector("#textCropName");
         descriptionElement = document.querySelector("#textDescription");
         userIdElement = document.querySelector("#userId");
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
let cropList = [];
let crop     = {};
let oldCrop  = {};
let formMode = "ADD";




// ============================================================
// EVENT LISTENERS
// ============================================================
const initializeEventListeners = () => {
    // form-field validation
    nameElement.addEventListener("input",        validateName);
    editCanvasStatus.addEventListener("change",  validateStatus);

    // userIdElement is read-only and fully managed by loadLoggedInUserInto()
    // (on open/ADD) and by hasCropChanged() (on update) — no manual input
    // validation needed here anymore.
    cropAddElement.addEventListener("click", () => {
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
    crop    = {};
    oldCrop = {};
    formMode = "ADD";

    cropForm.reset();
    removeValidationStyles(cropForm);

    cropNoElement.textContent = "-";

    const dateTime = getTodayDateTime();
    const date     = dateTime.slice(0, 10);
    const time     = dateTime.slice(11, 19);
    regDateElement.textContent    = `${date} ${time}`;
    updateDateElement.textContent = "-";

    generateStatus();
    editCanvasStatus.value = "";

    // Auto fill currently logged-in user as the record's user (creation case)
    loadLoggedInUserInto(crop, userIdElement);
    userIdElement.readOnly = true;

    // Default status → ACTIVE  (matches enum value in backend)
    const activeStatus = cropStatuses.find(s => s.name === "Active");
    if (activeStatus) {
        crop.status = activeStatus.name;                // ← entity field: status
        editCanvasStatus.value = JSON.stringify(activeStatus);
    }

    submitElement.classList.remove("d-none");
    updateElement.classList.add("d-none");
    deleteElement.classList.add("d-none");
    printElement.classList.add("d-none");
};


// ============================================================
// INITIAL DATA LOAD
// ============================================================
const loadInitialData = () => {
    loadCropStatus();
    cropList = getServiceRequest("/crop/croplist/alldata/selected");
};


// ============================================================
// TABLE
// ============================================================
const refreshCropTable = () => {
    if ($.fn.DataTable.isDataTable("#tableCrop")) {
        $("#tableCrop").DataTable().destroy();
    }

    tableBody.innerHTML = "";

    const displayProperty = [
        { propertyName: "cropid",       dataType: "string"   },   // ← entity: cropid
        { propertyName: "name",         dataType: "string"   },
        { propertyName: getStatusBadge, dataType: "function" },

    ];

    fillDataIntoTableThree(
        tableBody,
        cropList,
        displayProperty,
        refillCropForm
    );

    $("#tableCrop").DataTable();
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
        crop.name = null;
        setInvalid(nameElement);
        return;
    }

    crop.name = value;

    if (formMode === "EDIT" && value !== oldCrop.name) {
        setUpdated(nameElement);
    } else {
        setValid(nameElement);
    }
};


// ── Status dropdown ──────────────────────────────────────────
let cropStatuses = [];

const loadCropStatus = () => {
    // Values must match your backend Status enum exactly
    cropStatuses = [
        { name: "Active"   },
        { name: "Inactive" },
    ];
};

const generateStatus = () => {
    fillDataIntoSelect(
        editCanvasStatus,
        "Please select status..",
        cropStatuses,
        "name"
    );
};

const validateStatus = () => {
    const value = editCanvasStatus.value;

    if (value === "") {
        crop.status = null;                                     // ← entity: status
        setInvalid(editCanvasStatus);
        return;
    }

    const parsed = JSON.parse(value);
    crop.status = parsed.name;                                  // ← entity: status

    if (formMode === "EDIT" &&
        JSON.stringify(crop.status) !== JSON.stringify(oldCrop.status)) {
        setUpdated(editCanvasStatus);
    } else {
        setValid(editCanvasStatus);
    }
};




// ============================================================
// REFILL FORM (row click → EDIT mode)
// ============================================================
const refillCropForm = (dataob) => {
    removeValidationStyles(cropForm);

    const mymodal = new bootstrap.Modal(cropAddFormModelElement, {});
    formMode = "EDIT";

    crop    = getServiceRequest("/crop/croplist/byid/" + dataob.id);
    oldCrop = JSON.parse(JSON.stringify(crop));

    // Registration date/time
    const dateTimeEdit = crop.addeddatetime;
    const dateEdit     = dateTimeEdit.slice(0, 10);
    const timeEdit     = dateTimeEdit.slice(11, 19);
    regDateElement.textContent = `${dateEdit} ${timeEdit}`;

    // Updated date/time
    if (!crop.updateddatetime) {
        updateDateElement.textContent = "-";
    } else {
        const dateTimeUpdate = crop.updateddatetime;
        const dateUpdate     = dateTimeUpdate.slice(0, 10);
        const timeUpdate     = dateTimeUpdate.slice(11, 19);
        updateDateElement.textContent = `${dateUpdate} ${timeUpdate}`;
    }

    // Populate fields
    cropNoElement.textContent = crop.cropid;               // ← entity: cropid
    nameElement.value         = crop.name;


    // User field is DISPLAY ONLY here — shows whoever is currently
    // stamped on the record (last updater, or creator if never
    // updated). We do NOT touch crop.user on open. It only gets
    // reassigned to the current session user inside handleUpdate(),
    // and only if the record is actually changed and saved — see
    // hasCropChanged(). Opening or cancelling never reassigns it.
    userIdElement.value    = crop.user?.username || crop.user?.id || "-";
    userIdElement.readOnly = true;

    // Status dropdown  ← entity: status
    generateStatus();
    editCanvasStatus.value = JSON.stringify({ name: crop.status });

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

const hasCropChanged = () => {
    if (crop.name !== oldCrop.name) return true;
    if (crop.status !== oldCrop.status) return true;

    return false;
};


// ============================================================
// FORM ERROR CHECK
// ============================================================
const checkFormErrors = () => {
    const errors = [];

    if (!crop.name)   errors.push("Crop Name has an error. Please check again");
    if (!crop.status) errors.push("Crop Status has an error. Please check again");
    if (!crop.user)   errors.push("User ID has an error. Please check again");
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

    console.log("Submitting crop:", crop);

    const response = getHTTPServiceRequest("/crop/croplist/save", "POST", crop);

    if (response === "OK") {
        Notiflix.Notify.success("Saved successfully");
        $("#CropAddForm").modal("hide");
        loadInitialData();
        refreshCropTable();
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
    if (hasCropChanged()) {
        loadLoggedInUserInto(crop, userIdElement);
    }

    console.log("Updating crop:", crop);

    const response = getHTTPServiceRequest("/crop/croplist/update", "PUT", crop);

    if (response === "OK") {
        updateDateElement.textContent = new Date().toLocaleString();
        Notiflix.Notify.success("Updated successfully");
        $("#CropAddForm").modal("hide");
        loadInitialData();
        refreshCropTable();
        initializeForm();
    } else {
        Notiflix.Notify.warning("Update failed: " + response);
    }
};

const handleDelete = () => {
    Notiflix.Confirm.show(
        "Delete Crop",
        "Are you sure you want to delete this crop?",
        "Yes, Delete",
        "Cancel",
        () => {
            const response = getHTTPServiceRequest(
                "/crop/croplist/" + crop.id,
                "DELETE",
                null
            );

            if (response === "OK") {
                Notiflix.Notify.success("Deleted successfully");
                $("#CropAddForm").modal("hide");
                loadInitialData();
                refreshCropTable();
                initializeForm();
            } else {
                Notiflix.Notify.failure(response);
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
const printCropRecord = () => {
    const newWindow = window.open();
    newWindow.document.write(
        "<html><head>" +
        "<title>Print Crop</title>" +
        '<link rel="stylesheet" href="/css/bootstrap-5.3.3/css/bootstrap.min.css">' +
        "</head><body>" +
        divCardPrintCrop.outerHTML +
        "</body></html>"
    );

    setInterval(() => {
        newWindow.stop();
        newWindow.print();
        newWindow.close();
    }, 500);
};

const viewCrop = (dataOb) => {
    tdCropId.innerText      = dataOb.cropid      || "-";   // ← entity: cropid
    tdName.innerText        = dataOb.name        || "-";

    tdStatus.innerText      = dataOb.status       || "-";   // ← entity: status

    const editModalContent = cropAddFormModelElement.querySelector(".modal-content");
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
    viewCrop(crop);
};





    window.initPage = function () {
        queryElements();
        loadInitialData();
        initializeForm();
        initializeEventListeners();
        refreshCropTable();
    }
    window.initPage();

window.printCropRecord = printCropRecord;

})();