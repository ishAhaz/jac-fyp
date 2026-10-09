// ============================================================
// DOM ELEMENT REFERENCES
// ============================================================
(function () {
    let supermarketAddFormModalElement
        ,tableBody
        , selectDistrict
        ,   selectStatus
        ,   printViewSupplierModalElement
        ,  supplierForm
        ,   addNewSupermarketElement
        ,   regDateElement
        ,   updateDateElement
        ,   regNoElement
        ,   textSupermarketName
        ,   textBranchName
        ,   textRegNumber
        ,   textContactPerson
        ,   textContactNo
        ,   textEmail
        ,   textLandno
        ,  inputCreditLimit
        ,  inputDueAmount
        ,  userIdElement
        ,  textAddress
        ,  textNote
        ,  titleEditHide
        ,  titleNewHide
        ,  submitElement
        ,  updateElement
        , clearElement
        , printElement
        , deleteElement;
    const queryElements = () => {
        supermarketAddFormModalElement = document.querySelector("#SupermarketAddForm");

// Table body
        tableBody = document.querySelector("#tableBodyId");

// Dropdowns
        selectDistrict = document.querySelector("#selectDistrict");
        selectStatus = document.querySelector("#selectStatus");

// Print view modal
        printViewSupplierModalElement = document.querySelector("#SupplierViewModal");

// Form fields
        supplierForm = document.querySelector("#formSupplier");
        addNewSupermarketElement = document.querySelector("#addNewSupermarketId");
        regDateElement = document.querySelector("#regDate");
        updateDateElement = document.querySelector("#updateDate");
        regNoElement = document.querySelector("#InputRegNo");
        textSupermarketName = document.querySelector("#textSupermarketName");
        textBranchName = document.querySelector("#textBranchName");
        textRegNumber = document.querySelector("#textRegNumber");
        textContactPerson = document.querySelector("#textContactPerson");
        textContactNo = document.querySelector("#textContactNo");
        textEmail = document.querySelector("#textEmail");
        textLandno = document.querySelector("#textLandno");
        inputCreditLimit = document.querySelector("#inputCreditLimit");
        inputDueAmount = document.querySelector("#inputDueAmount");
        userIdElement = document.querySelector("#userId");
        textAddress = document.querySelector("#textAddress");
        textNote = document.querySelector("#textNote");

// Form title toggles
        titleEditHide = document.querySelector("#formTitleEdit");
        titleNewHide = document.querySelector("#formTitleNew");

// Buttons
        submitElement = document.querySelector("#buttonSubmit");
        updateElement = document.querySelector("#buttonUpdate");
        clearElement = document.querySelector("#buttonClear");
        printElement = document.querySelector("#buttonPrint");
        deleteElement = document.querySelector("#buttonDelete");
    }

// ============================================================
// STATE
// ============================================================

let supermarketList = [];

let supermarket    = {};
let oldSupermarket = {};
let formMode = "ADD";





// ============================================================
// EVENT LISTENERS
// ============================================================

const initializeEventListeners = () => {
    // Form field validation
    textSupermarketName.addEventListener("input", validateSupermarketName);
    textBranchName.addEventListener("input",      validateBranchName);
    selectDistrict.addEventListener("change",     validateDistrict);
    textRegNumber.addEventListener("input",       validateRegNumber);
    textContactPerson.addEventListener("input",   validateContactPerson);
    textContactNo.addEventListener("input",       validateContactNo);
    textEmail.addEventListener("input",           validateEmail);
    textLandno.addEventListener("input",          validateLandno);
    inputCreditLimit.addEventListener("input",    validateCreditLimit);
    inputDueAmount.addEventListener("input",      validateDueAmount);
    selectStatus.addEventListener("change",       validateStatus);
    // userIdElement is read-only and fully managed by loadLoggedInUserInto()
    // (on open/ADD) and by hasSupermarketChanged() (on update) — no manual
    // input validation needed here anymore.
    textAddress.addEventListener("input",         validateAddress);
    textNote.addEventListener("input",            validateNote);


    addNewSupermarketElement.addEventListener("click", () => {
        initializeForm();
        titleEditHide.classList.add("d-none");
        titleNewHide.classList.remove("d-none");
    });

    // Action buttons
    submitElement.addEventListener("click", handleSubmit);
    updateElement.addEventListener("click", handleUpdate);
    clearElement.addEventListener("click",  handleClear);
    deleteElement.addEventListener("click", handleDelete);
    printElement.addEventListener("click",  handlePrint);
};


// ============================================================
// INITIALIZE FORM
// ============================================================

const initializeForm = () => {
    supermarket    = {};
    oldSupermarket = {};
    formMode = "ADD";

    supplierForm.reset();
    removeValidationStyles(supplierForm);

    regNoElement.textContent      = "-";
    updateDateElement.textContent = "-";

    let dateTime = getTodayDateTime();
    let date = dateTime.slice(0, 10);
    let time = dateTime.slice(11, 19);
    regDateElement.textContent = date + " " + time;

    // Reset fields
    textSupermarketName.value = "";
    textBranchName.value      = "";
    textRegNumber.value       = "";
    textContactPerson.value   = "";
    textContactNo.value       = "";
    textEmail.value           = "";
    textLandno.value          = "";
    inputCreditLimit.value    = "";
    inputDueAmount.value      = "";
    textAddress.value         = "";
    textNote.value            = "";

    generateDistrict();
    generateStatus();
    selectDistrict.value = "";
    selectStatus.value   = "";

    // Auto fill currently logged-in user as the record's user (creation case)
    loadLoggedInUserInto(supermarket, userIdElement);
    userIdElement.readOnly = true;

    // Button visibility — ADD mode
    submitElement.classList.remove("d-none");
    updateElement.classList.add("d-none");
    deleteElement.classList.add("d-none");
    printElement.classList.add("d-none");

    titleEditHide.classList.add("d-none");
    titleNewHide.classList.remove("d-none");
};


// ============================================================
// LOAD INITIAL DATA
// ============================================================

const loadInitialData = () => {
    loadDistricts();
    loadStatuses();
    supermarketList = getServiceRequest("/supermarket/supermarketlist/alldata/selected");
};


// ============================================================
// REFRESH TABLE
// ============================================================

const refreshSupermarketTable = () => {
    if ($.fn.DataTable.isDataTable("#tableSupermarket")) {
        $("#tableSupermarket").DataTable().destroy();
    }

    tableBody.innerHTML = "";

    let displayProperty = [
        { propertyName: "name",            dataType: "string"   },
        { propertyName: "contactperson",   dataType: "string"   },
        { propertyName: "contactpersonno", dataType: "string"   },
        { propertyName: "address",         dataType: "string"   },
        { propertyName: "email",           dataType: "string"   },
        { propertyName: "businessregno",   dataType: "string"   },
        { propertyName: getStatusBadge,    dataType: "function" },
    ];

    fillDataIntoTableThree(
        tableBody,
        supermarketList,
        displayProperty,
        refillSupermarketForm
    );

    $("#tableSupermarket").DataTable();
};

// Table display helpers
const getStatusBadge = (ob) => {
    const s = (ob.status || "").toLowerCase();
    if (s === "active")   return '<p class="p-1 bg-info">Active</p>';
    if (s === "inactive") return '<p class="p-1 bg-danger">Inactive</p>';
    return ob.status || "-";
};


// ============================================================
// DATA — DISTRICTS & STATUSES
// ============================================================

let districts = [];
let statuses  = [];

const loadDistricts = () => {
    districts = [
        { name: "Ampara"       },
        { name: "Anuradhapura" },
        { name: "Badulla"      },
        { name: "Batticaloa"   },
        { name: "Colombo"      },
        { name: "Galle"        },
        { name: "Gampaha"      },
        { name: "Hambantota"   },
        { name: "Jaffna"       },
        { name: "Kalutara"     },
        { name: "Kandy"        },
        { name: "Kegalle"      },
        { name: "Kilinochchi"  },
        { name: "Kurunegala"   },
        { name: "Mannar"       },
        { name: "Matale"       },
        { name: "Matara"       },
        { name: "Monaragala"   },
        { name: "Mullaitivu"   },
        { name: "Nuwara Eliya" },
        { name: "Polonnaruwa"  },
        { name: "Puttalam"     },
        { name: "Ratnapura"    },
        { name: "Trincomalee"  },
        { name: "Vavuniya"     },
    ];
};

const generateDistrict = () => {
    fillDataIntoSelect(
        selectDistrict,
        "Please select district..",
        districts,
        "name"
    );
};

const loadStatuses = () => {
    statuses = [
        { name: "Active"   },
        { name: "Inactive" },
    ];
};

const generateStatus = () => {
    fillDataIntoSelect(
        selectStatus,
        "Please select status..",
        statuses,
        "name"
    );
};


// ============================================================
// VALIDATION — FIELDS
// ============================================================

const validateSupermarketName = () => {
    const value   = textSupermarketName.value.trim();
    const pattern = /^.{2,100}$/;

    if (value === "") {
        supermarket.name = null;
        setInvalid(textSupermarketName);
        return;
    }

    if (pattern.test(value)) {
        supermarket.name = value;

        if (formMode === "EDIT" && value !== oldSupermarket.name) {
            setUpdated(textSupermarketName);
        } else {
            setValid(textSupermarketName);
        }
    } else {
        supermarket.name = null;
        setInvalid(textSupermarketName);
    }
};

const validateBranchName = () => {
    const value   = textBranchName.value.trim();
    const pattern = /^.{2,100}$/;

    if (value === "") {
        supermarket.branch = null;
        setInvalid(textBranchName);
        return;
    }

    if (pattern.test(value)) {
        supermarket.branch = value;

        if (formMode === "EDIT" && value !== oldSupermarket.branch) {
            setUpdated(textBranchName);
        } else {
            setValid(textBranchName);
        }
    } else {
        supermarket.branch = null;
        setInvalid(textBranchName);
    }
};

const validateDistrict = () => {
    const value = selectDistrict.value;

    if (!value) {
        supermarket.district = null;
        setInvalid(selectDistrict);
        return;
    }

    const parsed = JSON.parse(value);
    supermarket.district = parsed.name;

    if (formMode === "EDIT" && supermarket.district !== oldSupermarket.district) {
        setUpdated(selectDistrict);
    } else {
        setValid(selectDistrict);
    }
};

const validateRegNumber = () => {
    const value   = textRegNumber.value.trim();
    const pattern = /^.{3,50}$/;

    if (value === "") {
        supermarket.businessregno = null;
        setInvalid(textRegNumber);
        return;
    }

    if (pattern.test(value)) {
        supermarket.businessregno = value;

        if (formMode === "EDIT" && value !== oldSupermarket.businessregno) {
            setUpdated(textRegNumber);
        } else {
            setValid(textRegNumber);
        }
    } else {
        supermarket.businessregno = null;
        setInvalid(textRegNumber);
    }
};

const validateContactPerson = () => {
    const value   = textContactPerson.value.trim();
    const pattern = /^[A-Za-z\s.]{2,100}$/;

    if (value === "") {
        supermarket.contactperson = null;
        setInvalid(textContactPerson);
        return;
    }

    if (pattern.test(value)) {
        supermarket.contactperson = value;

        if (formMode === "EDIT" && value !== oldSupermarket.contactperson) {
            setUpdated(textContactPerson);
        } else {
            setValid(textContactPerson);
        }
    } else {
        supermarket.contactperson = null;
        setInvalid(textContactPerson);
    }
};

const validateContactNo = () => {
    const value   = textContactNo.value.trim();
    const pattern = /^07[01245678][0-9]{7}$/;

    if (value === "") {
        supermarket.contactpersonno = null;
        setInvalid(textContactNo);
        return;
    }

    if (pattern.test(value)) {
        supermarket.contactpersonno = value;

        if (formMode === "EDIT" && value !== oldSupermarket.contactpersonno) {
            setUpdated(textContactNo);
        } else {
            setValid(textContactNo);
        }
    } else {
        supermarket.contactpersonno = null;
        setInvalid(textContactNo);
    }
};

const validateEmail = () => {
    const value   = textEmail.value.trim();
    const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (value === "") {
        supermarket.email = null;
        setInvalid(textEmail);
        return;
    }

    if (pattern.test(value)) {
        supermarket.email = value;

        if (formMode === "EDIT" && value !== oldSupermarket.email) {
            setUpdated(textEmail);
        } else {
            setValid(textEmail);
        }
    } else {
        supermarket.email = null;
        setInvalid(textEmail);
    }
};

const validateLandno = () => {
    const value   = textLandno.value.trim();
    const pattern = /^0[1-9][0-9]{8}$/;

    // Optional field — clear styles if empty
    if (value === "") {
        supermarket.landnum = null;
        textLandno.classList.remove("is-valid", "is-invalid", "is-blue");
        return;
    }

    if (pattern.test(value)) {
        supermarket.landnum = value;

        if (formMode === "EDIT" && value !== oldSupermarket.landnum) {
            setUpdated(textLandno);
        } else {
            setValid(textLandno);
        }
    } else {
        supermarket.landnum = null;
        setInvalid(textLandno);
    }
};

const validateCreditLimit = () => {
    const value  = inputCreditLimit.value.trim();
    const numVal = parseFloat(value);

    if (value === "" || isNaN(numVal)) {
        supermarket.creditlimit = null;
        setInvalid(inputCreditLimit);
        return;
    }

    if (numVal >= 0) {
        supermarket.creditlimit = numVal;

        if (formMode === "EDIT" && numVal !== oldSupermarket.creditlimit) {
            setUpdated(inputCreditLimit);
        } else {
            setValid(inputCreditLimit);
        }
    } else {
        supermarket.creditlimit = null;
        setInvalid(inputCreditLimit);
    }
};

const validateDueAmount = () => {
    const value  = inputDueAmount.value.trim();
    const numVal = parseFloat(value);

    if (value === "" || isNaN(numVal)) {
        supermarket.dueamount = null;
        setInvalid(inputDueAmount);
        return;
    }

    if (numVal >= 0) {
        supermarket.dueamount = numVal;

        if (formMode === "EDIT" && numVal !== oldSupermarket.dueamount) {
            setUpdated(inputDueAmount);
        } else {
            setValid(inputDueAmount);
        }
    } else {
        supermarket.dueamount = null;
        setInvalid(inputDueAmount);
    }
};

const validateStatus = () => {
    const value = selectStatus.value;

    if (!value) {
        supermarket.status = null;
        setInvalid(selectStatus);
        return;
    }

    const parsed = JSON.parse(value);
    supermarket.status = parsed.name;

    if (formMode === "EDIT" && supermarket.status !== oldSupermarket.status) {
        setUpdated(selectStatus);
    } else {
        setValid(selectStatus);
    }
};

const validateAddress = () => {
    const value   = textAddress.value.trim();
    const pattern = /^.{10,200}$/;

    if (value === "") {
        supermarket.address = null;
        setInvalid(textAddress);
        return;
    }

    if (pattern.test(value)) {
        supermarket.address = value;

        if (formMode === "EDIT" && value !== oldSupermarket.address) {
            setUpdated(textAddress);
        } else {
            setValid(textAddress);
        }
    } else {
        supermarket.address = null;
        setInvalid(textAddress);
    }
};

const validateNote = () => {
    const value = textNote.value.trim();

    // Optional field — clear styles if empty
    if (value === "") {
        supermarket.note = null;
        textNote.classList.remove("is-valid", "is-invalid", "is-blue");
        return;
    }

    supermarket.note = value;

    if (formMode === "EDIT" && value !== oldSupermarket.note) {
        setUpdated(textNote);
    } else {
        setValid(textNote);
    }
};




// ============================================================
// REFILL FORM — EDIT MODE
// ============================================================

const refillSupermarketForm = (dataOb) => {
    removeValidationStyles(supplierForm);

    let myModal = new bootstrap.Modal(supermarketAddFormModalElement, {});
    formMode = "EDIT";

    supermarket    = getServiceRequest("/supermarket/supermarketlist/byid/" + dataOb.id);
    oldSupermarket = JSON.parse(JSON.stringify(supermarket));

    // Meta
    if (supermarket.addeddatetime) {
        let dateEdit = supermarket.addeddatetime.slice(0, 10);
        let timeEdit = supermarket.addeddatetime.slice(11, 19);
        regDateElement.textContent = dateEdit + " " + timeEdit;
    }

    if (!supermarket.updateddatetime) {
        updateDateElement.textContent = "-";
    } else {
        let dateUpdate = supermarket.updateddatetime.slice(0, 10);
        let timeUpdate = supermarket.updateddatetime.slice(11, 19);
        updateDateElement.textContent = dateUpdate + " " + timeUpdate;
    }

    regNoElement.textContent = supermarket.number || "-";

    // Fields
    textSupermarketName.value = supermarket.name            || "";
    textBranchName.value  = supermarket.branch          || "";
    textRegNumber.value  = supermarket.businessregno   || "";
    textContactPerson.value  = supermarket.contactperson   || "";
    textContactNo.value   = supermarket.contactpersonno || "";
    textEmail.value   = supermarket.email           || "";
    textLandno.value  = supermarket.landnum         || "";
    inputCreditLimit.value  = supermarket.creditlimit     ?? "";
    inputDueAmount.value = supermarket.dueamount       ?? "";
    textAddress.value  = supermarket.address         || "";
    textNote.value = supermarket.note            || "";

    // User field is DISPLAY ONLY here — shows whoever is currently
    // stamped on the record (last updater, or creator if never
    // updated). We do NOT touch supermarket.user on open. It only
    // gets reassigned to the current session user inside handleUpdate(),
    // and only if the record is actually changed and saved — see
    // hasSupermarketChanged(). Opening or cancelling never reassigns it.
    userIdElement.value    = supermarket.user?.username || supermarket.user?.id || "-";
    userIdElement.readOnly = true;

    // District dropdown
    generateDistrict();
    selectDistrict.value = JSON.stringify({ name: supermarket.district });

    // Status dropdown
    generateStatus();
    selectStatus.value = JSON.stringify({ name: supermarket.status });

    // Button visibility — EDIT mode
    submitElement.classList.add("d-none");
    updateElement.classList.remove("d-none");
    deleteElement.classList.remove("d-none");
    printElement.classList.remove("d-none");

    titleEditHide.classList.remove("d-none");
    titleNewHide.classList.add("d-none");

    myModal.show();
};


// ============================================================
// CHANGE DETECTION — used to decide whether the "last updated by"
// user should be overwritten with the currently logged-in user.
// ============================================================

const hasSupermarketChanged = () => {
    if (supermarket.name !== oldSupermarket.name) return true;
    if (supermarket.branch !== oldSupermarket.branch) return true;
    if (supermarket.district !== oldSupermarket.district) return true;
    if (supermarket.businessregno !== oldSupermarket.businessregno) return true;
    if (supermarket.contactperson !== oldSupermarket.contactperson) return true;
    if (supermarket.contactpersonno !== oldSupermarket.contactpersonno) return true;
    if (supermarket.email !== oldSupermarket.email) return true;
    if ((supermarket.landnum || null) !== (oldSupermarket.landnum || null)) return true;
    if (supermarket.creditlimit !== oldSupermarket.creditlimit) return true;
    if (supermarket.dueamount !== oldSupermarket.dueamount) return true;
    if (supermarket.status !== oldSupermarket.status) return true;
    if (supermarket.address !== oldSupermarket.address) return true;
    if ((supermarket.note || null) !== (oldSupermarket.note || null)) return true;
    return false;
};


// ============================================================
// FORM ERROR CHECK
// ============================================================

const checkFormErrors = () => {
    let errors = [];

    if (!supermarket.name) errors.push("Supermarket Name has an error. Please check again.");
    if (!supermarket.branch)  errors.push("Branch Name has an error. Please check again.");
    if (!supermarket.district)errors.push("District has an error. Please check again.");
    if (!supermarket.businessregno) errors.push("Business Registration Number has an error. Please check again.");
    if (!supermarket.contactperson) errors.push("Contact Person has an error. Please check again.");
    if (!supermarket.contactpersonno) errors.push("Contact Number has an error. Please check again.");
    if (!supermarket.email) errors.push("Email has an error. Please check again.");
    if (supermarket.creditlimit === null || supermarket.creditlimit === undefined)
        errors.push("Credit Limit has an error. Please check again.");
    if (supermarket.dueamount === null || supermarket.dueamount === undefined)
        errors.push("Due Amount has an error. Please check again.");
    if (!supermarket.status) errors.push("Status has an error. Please check again.");
    if (!supermarket.user) errors.push("User ID has an error. Please check again.");
    if (!supermarket.address) errors.push("Address has an error. Please check again.");

    // Optional — only flag if entered but invalid
    const landVal = textLandno.value.trim();
    if (landVal !== "" && !supermarket.landnum) {
        errors.push("Land Number format is invalid. Please check again.");
    }

    return errors;
};


// ============================================================
// BUTTON HANDLERS
// ============================================================

const handleSubmit = () => {
    const errors = checkFormErrors();
    if (errors.length > 0) {
        Notiflix.Notify.warning(errors.join(" | "));
        return;
    }

    console.log("Submitting supermarket:", supermarket);

    let response = getHTTPServiceRequest("/supermarket/supermarketlist/save", "POST", supermarket);

    if (response === "OK") {
        Notiflix.Notify.success("Saved successfully");
        $("#SupermarketAddForm").modal("hide");
        loadInitialData();
        refreshSupermarketTable();
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
    if (hasSupermarketChanged()) {
        loadLoggedInUserInto(supermarket, userIdElement);
    }

    console.log("Updating supermarket:", supermarket);

    let response = getHTTPServiceRequest("/supermarket/supermarketlist/update", "PUT", supermarket);

    if (response === "OK") {
        updateDateElement.textContent = new Date().toLocaleString();
        Notiflix.Notify.success("Updated successfully");
        $("#SupermarketAddForm").modal("hide");
        loadInitialData();
        refreshSupermarketTable();
        initializeForm();
    } else {
        Notiflix.Notify.warning("Update failed: " + response);
    }
};

const handleDelete = () => {
    Notiflix.Confirm.show(
        "Delete Supermarket",
        "Are you sure you want to delete this supermarket?",
        "Yes, Delete",
        "Cancel",
        () => {
            let response = getHTTPServiceRequest(
                "/supermarket/supermarketlist/" + supermarket.id,
                "DELETE",
                null
            );

            if (response !== "AJAX error") {
                Notiflix.Notify.success("Deleted successfully");
                $("#SupermarketAddForm").modal("hide");
                loadInitialData();
                refreshSupermarketTable();
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


// ============================================================
// PRINT / VIEW
// ============================================================

const viewSupermarketRecord = (dataOb) => {
    document.querySelector("#tdSupplierName").innerText  = dataOb.name || "-";
    document.querySelector("#tdContactPerson").innerText   = dataOb.contactperson   || "-";
    document.querySelector("#tdContactNo").innerText  = dataOb.contactpersonno || "-";
    document.querySelector("#tdEmail").innerText = dataOb.email || "-";
    document.querySelector("#tdRegNumber").innerText = dataOb.businessregno   || "-";
    document.querySelector("#tdAddress").innerText  = dataOb.address || "-";
    document.querySelector("#tdStatus").innerText = dataOb.status || "-";

    const editModalContent = supermarketAddFormModalElement.querySelector(".modal-content");
    editModalContent.classList.add("blurred");

    const viewModal = new bootstrap.Modal(printViewSupplierModalElement);
    viewModal.show();

    printViewSupplierModalElement.addEventListener(
        "hidden.bs.modal",
        () => {
            editModalContent.classList.remove("blurred");
        },
        { once: true }
    );
};

const handlePrint = () => {
    viewSupermarketRecord(supermarket);
};

const printSupermarketRecord = () => {
    let newWindow = window.open();
    newWindow.document.write(
        "<html><head>" +
        "<title>Supermarket Details</title>" +
        '<link rel="stylesheet" href="/css/bootstrap-5.3.3/css/bootstrap.min.css">' +
        "</head><body>" +
        document.querySelector("#divCardPrintSupplier").outerHTML +
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
        refreshSupermarketTable();}
    window.initPage();
 window.printSupermarketRecord = printSupermarketRecord;


})();