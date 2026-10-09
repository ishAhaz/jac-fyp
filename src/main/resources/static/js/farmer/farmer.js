// ============================================================
// DOM ELEMENT REFERENCES
// ============================================================
(function () {
    let farmerAddFormModalElement
        ,tableBody
        ,selectDistrict
        , selectStatus
        , printViewFarmerModalElement
        , farmerForm
        , addNewFarmerElement
        ,  regDateElement
        ,  updateDateElement
        ,  farmerIDElement
        ,  fullnameElement
        ,  NICElement
        ,  mobileElement
        ,  emailElement
        ,  landnoElement
        ,  banknameElement
        ,  bankbranchElement
        ,  bankbranchnoElement
        ,  accountnoElement
        ,  addressElement
        , creditLimitElement
        , dueAmountElement
        ,  userIdElement
        ,   compostCustomerYesElement
        ,   compostCustomerNoElement
        ,   compostCustomerRadios
        ,   compostCustomerRowElement
        ,   titleEditHide
        ,  titleNewHide
        ,  farmerStatusCol
        ,  submitElement
        ,  updateElement
        , clearElement
        ,  printElement
        , deleteElement;
    const queryElements = () => {
        farmerAddFormModalElement = document.querySelector("#FarmerAddForm");

// Table body
        tableBody = document.querySelector("#tableBodyId");

// Dropdowns
        selectDistrict = document.querySelector("#selectDistrict");
        selectStatus = document.querySelector("#selectStatus");

// Print view modal
        printViewFarmerModalElement = document.querySelector("#FarmerViewModal");

// Form fields
        farmerForm = document.querySelector("#formFarmer");
        addNewFarmerElement = document.querySelector("#addNewFarmerId");
        regDateElement = document.querySelector("#regDate");
        updateDateElement = document.querySelector("#updateDate");
        farmerIDElement = document.querySelector("#InputFarmerID");
        fullnameElement = document.querySelector("#textFullname");
        NICElement = document.querySelector("#textNIC");
        mobileElement = document.querySelector("#textMobile");
        emailElement = document.querySelector("#textEmail");
        landnoElement = document.querySelector("#textLandno");
        banknameElement = document.querySelector("#textBankname");
        bankbranchElement = document.querySelector("#textBankbranch");
        bankbranchnoElement = document.querySelector("#textBankbranchno");
        accountnoElement = document.querySelector("#textAccountno");
        addressElement = document.querySelector("#textAddress");
        creditLimitElement = document.querySelector("#inputCreditLimit");
        dueAmountElement = document.querySelector("#inputDueAmount");
        userIdElement = document.querySelector("#userId");

// Compost customer radio buttons
        compostCustomerYesElement = document.querySelector("#radioCompostCustomerYes");
        compostCustomerNoElement = document.querySelector("#radioCompostCustomerNo");
        compostCustomerRadios = document.querySelectorAll('input[name="compostCustomerRadio"]');
        compostCustomerRowElement = document.querySelector("#compostCustomerRow");

// Form title toggles
        titleEditHide = document.querySelector("#formTitleEdit");
        titleNewHide = document.querySelector("#formTitleNew");

// Status column (hidden on ADD)
        farmerStatusCol = document.querySelector("#farmerStatusCol");

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

    let farmerList = [];

    let farmer    = {};
    let oldFarmer = {};
    let formMode  = "ADD";

// Sub-item list (hasFarmer collection). No longer editable from this form —
// crops are now managed by the farmer themselves on the My Account page.
// Kept here purely as a read-only carrier: refillFarmerForm() loads it from
// farmer.crops so handleUpdate()/handleSubmit() can pass it straight back
// through unchanged, and viewFarmerRecord() uses it as a print fallback.
    let cropItemList = [];   // { cropListManagement: {}, price: number, id?: number, status?: string }




// ============================================================
// EVENT LISTENERS
// ============================================================

    const initializeEventListeners = () => {
        // Form field validation
        fullnameElement.addEventListener("input",   validateFullname);
        NICElement.addEventListener("input",        validateNIC);
        mobileElement.addEventListener("input",     validateMobile);
        emailElement.addEventListener("input",      validateEmail);
        landnoElement.addEventListener("input",     validateLandno);
        selectDistrict.addEventListener("change",   validateDistrict);
        selectStatus.addEventListener("change",     validateStatus);
        banknameElement.addEventListener("input",   validateBankname);
        bankbranchElement.addEventListener("input", validateBankbranch);
        bankbranchnoElement.addEventListener("input", validateBankbranchno);
        accountnoElement.addEventListener("input",  validateAccountno);
        addressElement.addEventListener("input",    validateAddress);
        creditLimitElement.addEventListener("input", validateCreditLimit);
        dueAmountElement.addEventListener("input",  validateDueAmount);
        // userIdElement is read-only and fully managed by loadLoggedInUserInto()
        // (on open/ADD) and by hasFarmerDataChanged() (on update) — no manual
        // input validation needed here, same as crop.js.

        addNewFarmerElement.addEventListener("click", () => {
            initializeForm();
            titleEditHide.classList.add("d-none");
            titleNewHide.classList.remove("d-none");
        });


        // Compost customer radio buttons
        compostCustomerRadios.forEach(radio => {
            radio.addEventListener("change", validateCompostCustomer);
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
        farmer = {};
        oldFarmer = {};
        formMode = "ADD";

        // Brand-new farmer starts with no crops — crops are added later by the
        // farmer themselves from the My Account page.
        cropItemList = [];

        farmerForm.reset();
        removeValidationStyles(farmerForm);

        farmerIDElement.textContent = "-";
        updateDateElement.textContent = "-";


        let dateTime = getTodayDateTime();
        let date = dateTime.slice(0, 10);
        let time = dateTime.slice(11, 19);
        regDateElement.textContent = date + " " + time;


        // Default status → Active on ADD
        farmer.status = "Active";

        // Compost customer — no default selection, farmer must explicitly choose.
        // NOTE: this maps directly to the entity's `compost` Boolean field
        // (Farmer.compost), NOT a separate "iscompostcustomer" string — Jackson
        // silently drops any field that doesn't exist on the entity, which is
        // why this must match the backend property name exactly.
        farmer.compost = null;
        compostCustomerYesElement.checked = false;
        compostCustomerNoElement.checked = false;
        compostCustomerRowElement.classList.remove("is-invalid-row");

        // Reset dropdowns
        generateDistrictSelect();
        generateStatusSelect();

        selectDistrict.value = "";
        selectStatus.value = "";

        // Due amount is auto-filled — read-only on ADD
        dueAmountElement.value = "0.00";
        dueAmountElement.readOnly = true;
        farmer.dueamount = 0.00;

        // Auto fill currently logged-in user as the record's user (creation case)
        // — same pattern as crop.js / employee.js.
        loadLoggedInUserInto(farmer, userIdElement);
        userIdElement.readOnly = true;

        // Button visibility — ADD mode
        farmerStatusCol.classList.add("d-none");
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
        loadFarmerStatuses();
        farmerList = getServiceRequest("/farmer/farmerlist/alldata/selected");
    };


// ============================================================
// REFRESH TABLE
// ============================================================

    const refreshFarmerTable = () => {
        if ($.fn.DataTable.isDataTable("#tableFarmer")) {
            $("#tableFarmer").DataTable().destroy();
        }

        tableBody.innerHTML = "";

        let displayProperty = [
            {propertyName: "number", dataType: "string"},
            {propertyName: "fullname", dataType: "string"},
            {propertyName: "nic", dataType: "string"},
            { propertyName: "mobileno",     dataType: "string"   },
            { propertyName: "email",        dataType: "string"   },
            { propertyName: getFarmerDistrict, dataType: "function" },
            { propertyName: getCompostCustomer, dataType: "function" },
            { propertyName: getCropNames,     dataType: "function" },
            { propertyName: getFarmerStatus,   dataType: "function" },
        ];

        fillDataIntoTableThree(
            tableBody,
            farmerList,
            displayProperty,
            refillFarmerForm
        );

        $("#tableFarmer").DataTable();
    };

// Table display helpers
    const getFarmerDistrict = (ob) => {
        return ob.district || "-";
    };

// Reads the entity's actual `compost` Boolean field. Falls back to "-"
// when the value hasn't been set yet (e.g. older records saved before
// this field existed), instead of silently returning undefined.
    const getCompostCustomer = (ob) => {
        if (ob.compost === true)  return '<p class="p-1 bg-info">Yes</p>';
        if (ob.compost === false) return '<p class="p-1 bg-warning">No</p>';
        return "-";
    };

    const getCropNames = (ob) => {
        if (!ob.crops || ob.crops.length === 0) return "-";
        return ob.crops.map(c => c.cropListManagement?.name || "-").join(", ");
    };

    const getFarmerStatus = (ob) => {
        if (ob.status === "Active")   return '<p class="p-1 bg-info">Active</p>';
        if (ob.status === "Inactive") return '<p class="p-1 bg-danger">Inactive</p>';
        return ob.status || "-";
    };


// ============================================================
// DROPDOWN DATA — DISTRICT
// ============================================================

    let districts = [];

    const loadDistricts = () => {
        districts = [
            { name: "Ampara" }, { name: "Anuradhapura" }, { name: "Badulla" },
            { name: "Batticaloa" }, { name: "Colombo" }, { name: "Galle" },
            { name: "Gampaha" }, { name: "Hambantota" }, { name: "Jaffna" },
            { name: "Kalutara" }, { name: "Kandy" }, { name: "Kegalle" },
            { name: "Kilinochchi" }, { name: "Kurunegala" }, { name: "Mannar" },
            { name: "Matale" }, { name: "Matara" }, { name: "Monaragala" },
            { name: "Mullaitivu" }, { name: "Nuwara Eliya" }, { name: "Polonnaruwa" },
            { name: "Puttalam" }, { name: "Ratnapura" }, { name: "Trincomalee" },
            { name: "Vavuniya" }
        ];
    };

    const generateDistrictSelect = () => {
        fillDataIntoSelect(
            selectDistrict,
            "Select District",
            districts,
            "name"
        );
    };

    const validateDistrict = () => {
        const value = selectDistrict.value;

        if (!value) {
            farmer.district = null;
            setInvalid(selectDistrict);
            return;
        }

        const parsed = JSON.parse(value);
        farmer.district = parsed.name;

        if (formMode === "EDIT" && farmer.district !== oldFarmer.district) {
            setUpdated(selectDistrict);
        } else {
            setValid(selectDistrict);
        }
    };


// ============================================================
// DROPDOWN DATA — STATUS
// ============================================================

    let farmerStatuses = [];

    const loadFarmerStatuses = () => {
        farmerStatuses = [
            { name: "Active" },
            { name: "Inactive" }
        ];
    };

    const generateStatusSelect = () => {
        fillDataIntoSelect(
            selectStatus,
            "Select Farmer Status",
            farmerStatuses,
            "name"
        );
    };

    const validateStatus = () => {
        const value = selectStatus.value;

        if (!value) {
            farmer.status = null;
            setInvalid(selectStatus);
            return;
        }

        const parsed = JSON.parse(value);
        farmer.status = parsed.name;

        if (formMode === "EDIT" && farmer.status !== oldFarmer.status) {
            setUpdated(selectStatus);
        } else {
            setValid(selectStatus);
        }
    };


// ============================================================
// COMPOST CUSTOMER — Yes / No RADIO GROUP
// ============================================================
// Maps directly onto Farmer.compost (Boolean) on the backend entity.
// true  -> "Yes" radio checked
// false -> "No" radio checked
// null  -> neither radio checked (not yet answered)

    const validateCompostCustomer = () => {
        if (compostCustomerYesElement.checked) {
            farmer.compost = true;
        } else if (compostCustomerNoElement.checked) {
            farmer.compost = false;
        } else {
            farmer.compost = null;
        }

        if (farmer.compost === null || farmer.compost === undefined) {
            compostCustomerRowElement.classList.add("is-invalid-row");
            return;
        }

        compostCustomerRowElement.classList.remove("is-invalid-row");
    };


// ============================================================
// VALIDATION — MAIN FIELDS
// ============================================================

    const validateFullname = () => {
        const value = fullnameElement.value.trim();
        const pattern = /^([A-Z][a-z]{2,}[ ])+(de[ ])?([A-Z][a-z]{2,})$/;

        if (!pattern.test(value)) {
            farmer.fullname = null;
            setInvalid(fullnameElement);
            return;
        }

        farmer.fullname = value;

        if (formMode === "EDIT" && value !== oldFarmer.fullname) {
            setUpdated(fullnameElement);
        } else {
            setValid(fullnameElement);
        }
    };

    const validateNIC = () => {
        const value = NICElement.value;
        const pattern = /^(([0-9]{12})|([0-9]{9}[VXvx]))$/;

        if (!pattern.test(value)) {
            farmer.nic = null;
            setInvalid(NICElement);
            return;
        }

        farmer.nic = value;

        if (formMode === "EDIT" && value !== oldFarmer.nic) {
            setUpdated(NICElement);
        } else {
            setValid(NICElement);
        }
    };

    const validateMobile = () => {
        const value = mobileElement.value;
        const pattern = /^07[01245678][0-9]{7}$/;

        if (value === "") {
            farmer.mobileno = null;
            setInvalid(mobileElement);
            return;
        }

        if (pattern.test(value)) {
            farmer.mobileno = value;

            if (formMode === "EDIT" && value !== oldFarmer.mobileno) {
                setUpdated(mobileElement);
            } else {
                setValid(mobileElement);
            }
        } else {
            farmer.mobileno = null;
            setInvalid(mobileElement);
        }
    };

    const validateEmail = () => {
        const value = emailElement.value.trim();
        const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (value === "") {
            farmer.email = null;
            emailElement.classList.remove("is-valid", "is-invalid", "is-blue");
            return;
        }

        if (pattern.test(value)) {
            farmer.email = value;

            if (formMode === "EDIT" && value !== oldFarmer.email) {
                setUpdated(emailElement);
            } else {
                setValid(emailElement);
            }
        } else {
            farmer.email = null;
            setInvalid(emailElement);
        }
    };

    const validateLandno = () => {
        const value = landnoElement.value;
        const pattern = /^0[1-9][0-9]{8}$/;

        if (value === "") {
            farmer.landno = null;
            landnoElement.classList.remove("is-valid", "is-invalid", "is-blue");
            return;
        }

        if (pattern.test(value)) {
            farmer.landno = value;

            if (formMode === "EDIT" && value !== oldFarmer.landno) {
                setUpdated(landnoElement);
            } else {
                setValid(landnoElement);
            }
        } else {
            farmer.landno = null;
            setInvalid(landnoElement);
        }
    };

    const validateBankname = () => {
        const value = banknameElement.value.trim();
        const pattern = /^.{2,100}$/;

        if (value === "") {
            farmer.bankname = null;
            setInvalid(banknameElement);
            return;
        }

        if (pattern.test(value)) {
            farmer.bankname = value;

            if (formMode === "EDIT" && value !== oldFarmer.bankname) {
                setUpdated(banknameElement);
            } else {
                setValid(banknameElement);
            }
        } else {
            farmer.bankname = null;
            setInvalid(banknameElement);
        }
    };

    const validateBankbranch = () => {
        const value = bankbranchElement.value.trim();
        const pattern = /^.{2,100}$/;

        if (value === "") {
            farmer.bankbranch = null;
            setInvalid(bankbranchElement);
            return;
        }

        if (pattern.test(value)) {
            farmer.bankbranch = value;

            if (formMode === "EDIT" && value !== oldFarmer.bankbranch) {
                setUpdated(bankbranchElement);
            } else {
                setValid(bankbranchElement);
            }
        } else {
            farmer.bankbranch = null;
            setInvalid(bankbranchElement);
        }
    };

    const validateBankbranchno = () => {
        const value = bankbranchnoElement.value.trim();
        const pattern = /^[0-9]{3,10}$/;

        if (value === "") {
            farmer.bankbranchno = null;
            setInvalid(bankbranchnoElement);
            return;
        }

        if (pattern.test(value)) {
            farmer.bankbranchno = value;

            if (formMode === "EDIT" && value !== oldFarmer.bankbranchno) {
                setUpdated(bankbranchnoElement);
            } else {
                setValid(bankbranchnoElement);
            }
        } else {
            farmer.bankbranchno = null;
            setInvalid(bankbranchnoElement);
        }
    };

    const validateAccountno = () => {
        const value = accountnoElement.value.trim();
        const pattern = /^[0-9]{6,20}$/;

        if (value === "") {
            farmer.accountno = null;
            setInvalid(accountnoElement);
            return;
        }

        if (pattern.test(value)) {
            farmer.accountno = value;

            if (formMode === "EDIT" && value !== oldFarmer.accountno) {
                setUpdated(accountnoElement);
            } else {
                setValid(accountnoElement);
            }
        } else {
            farmer.accountno = null;
            setInvalid(accountnoElement);
        }
    };

    const validateAddress = () => {
        const value = addressElement.value;
        const pattern = /^.{10,200}$/;

        if (value === "") {
            farmer.address = null;
            setInvalid(addressElement);
            return;
        }

        if (pattern.test(value)) {
            farmer.address = value;

            if (formMode === "EDIT" && value !== oldFarmer.address) {
                setUpdated(addressElement);
            } else {
                setValid(addressElement);
            }
        } else {
            farmer.address = null;
            setInvalid(addressElement);
        }
    };

    const validateCreditLimit = () => {
        const value = parseFloat(creditLimitElement.value);

        if (isNaN(value) || value < 0) {
            farmer.creditlimit = null;
            setInvalid(creditLimitElement);
            return;
        }

        farmer.creditlimit = value;

        if (formMode === "EDIT" && value !== oldFarmer.creditlimit) {
            setUpdated(creditLimitElement);
        } else {
            setValid(creditLimitElement);
        }
    };

    const validateDueAmount = () => {
        const value = parseFloat(dueAmountElement.value);

        if (isNaN(value) || value < 0) {
            farmer.dueamount = null;
            setInvalid(dueAmountElement);
            return;
        }

        farmer.dueamount = value;

        if (formMode === "EDIT" && value !== oldFarmer.dueamount) {
            setUpdated(dueAmountElement);
        } else {
            setValid(dueAmountElement);
        }
    };


// ============================================================
// REFILL FORM — EDIT MODE
// ============================================================

    const refillFarmerForm = (dataOb) => {
        removeValidationStyles(farmerForm);

        let myModal = new bootstrap.Modal(farmerAddFormModalElement, {});
        formMode  = "EDIT";

        farmer    = getServiceRequest("/farmer/farmerlist/byid/" + dataOb.id);
        oldFarmer = JSON.parse(JSON.stringify(farmer));

        // Meta
        let dateTimeEdit = farmer.addeddatetime;
        let dateEdit = dateTimeEdit.slice(0, 10);
        let timeEdit = dateTimeEdit.slice(11, 19);
        regDateElement.textContent = dateEdit + " " + timeEdit;

        if (!farmer.updateddatetime) {
            updateDateElement.textContent = "-";
        } else {
            let dateTimeUpdate = farmer.updateddatetime;
            let dateUpdate = dateTimeUpdate.slice(0, 10);
            let timeUpdate = dateTimeUpdate.slice(11, 19);
            updateDateElement.textContent = dateUpdate + " " + timeUpdate;
        }

        farmerIDElement.textContent = farmer.number || "-";

        // Main fields
        fullnameElement.value     = farmer.fullname    || "";
        NICElement.value          = farmer.nic         || "";
        mobileElement.value       = farmer.mobileno    || "";
        emailElement.value        = farmer.email       || "";
        landnoElement.value       = farmer.landno      || "";
        banknameElement.value     = farmer.bankname    || "";
        bankbranchElement.value   = farmer.bankbranch  || "";
        bankbranchnoElement.value = farmer.bankbranchno || "";
        accountnoElement.value    = farmer.accountno   || "";
        addressElement.value      = farmer.address     || "";
        creditLimitElement.value  = farmer.creditlimit || "";
        dueAmountElement.value    = farmer.dueamount   || "0.00";
        dueAmountElement.readOnly = true;

        // Compost customer radio buttons — reflects the entity's Boolean
        // `compost` field. Strict `=== true` / `=== false` checks so a
        // null/undefined value (never answered) leaves both unchecked.
        compostCustomerYesElement.checked = farmer.compost === true;
        compostCustomerNoElement.checked  = farmer.compost === false;
        compostCustomerRowElement.classList.remove("is-invalid-row");


        userIdElement.value    = farmer.user?.username || farmer.user?.id || "-";
        userIdElement.readOnly = true;

        // District select
        generateDistrictSelect();
        selectDistrict.value = JSON.stringify({ name: farmer.district });

        // Status select
        generateStatusSelect();
        selectStatus.value = JSON.stringify({ name: farmer.status });

        // Carry the farmer's existing crops through untouched — this form no
        // longer lets anyone add/edit/remove crops (that now happens on the
        // farmer's My Account page). id + status are kept so handleUpdate()
        // can pass them straight back through without altering them.
        cropItemList = farmer.crops ? farmer.crops.map(c => ({
            cropListManagement: c.cropListManagement,
            price: c.price,
            id: c.id,
            status: c.status || "Pending"
        })) : [];

        // Button visibility — EDIT mode
        farmerStatusCol.classList.remove("d-none");
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
// Mirrors crop.js's hasCropChanged() / employee.js's
// hasEmployeeChanged(): only reassign farmer.user in handleUpdate()
// if something the user actually edited differs from the snapshot
// taken when the record was opened (oldFarmer). Saving an untouched
// record must NOT bump the "last updated by" stamp.
// ============================================================

// Simple fields compared directly between the live `farmer` object
// and the untouched `oldFarmer` snapshot taken when the record was opened.
    const SIMPLE_COMPARE_FIELDS = [
        "fullname", "nic", "mobileno", "email", "landno",
        "district", "status", "bankname", "bankbranch",
        "bankbranchno", "accountno", "address", "creditlimit", "dueamount",
        "compost"
    ];

// Normalizes crop sub-items to a comparable, order-independent shape.
// Deliberately excludes status — a status recalculation alone
// shouldn't count as an edit made by the current user,
    const normalizeCropItems = (items) => {
        return (items || [])
            .map(item => ({
                id: item.cropListManagement?.id,
                price: Number(item.price)
            }))
            .sort((a, b) => (a.id > b.id ? 1 : a.id < b.id ? -1 : 0));
    };

// Returns true if ANY editable field or crop item differs from the
// original snapshot captured when the record was opened for edit.
// Crops can no longer change from this form, so this effectively only
// checks the simple fields now — the crop comparison is kept in case
// crops are ever fed back in from elsewhere before save.
    const hasFarmerDataChanged = () => {
        for (const field of SIMPLE_COMPARE_FIELDS) {
            if (farmer[field] !== oldFarmer[field]) {
                return true;
            }
        }

        const cropsChanged = JSON.stringify(normalizeCropItems(cropItemList))
            !== JSON.stringify(normalizeCropItems(oldFarmer.crops));
        if (cropsChanged) {
            return true;
        }

        return false;
    };


// ============================================================
// FORM ERROR CHECK
// ============================================================

    const checkFormErrors = () => {
        let errors = [];

        if (!farmer.fullname)    errors.push("Full Name has an error. Please check again.");
        if (!farmer.nic)         errors.push("NIC has an error. Please check again.");
        if (!farmer.mobileno)    errors.push("Mobile Number has an error. Please check again.");
        if (!farmer.district)    errors.push("District has an error. Please check again.");
        if (!farmer.bankname)    errors.push("Bank Name has an error. Please check again.");
        if (!farmer.bankbranch)  errors.push("Bank Branch has an error. Please check again.");
        if (!farmer.bankbranchno) errors.push("Bank Branch No has an error. Please check again.");
        if (!farmer.accountno)   errors.push("Account Number has an error. Please check again.");
        if (!farmer.address)     errors.push("Address has an error. Please check again.");
        if (farmer.creditlimit === null || farmer.creditlimit === undefined) {
            errors.push("Credit Limit has an error. Please check again.");
        }
        if (!farmer.user)        errors.push("User ID has an error. Please check again.");
        if (formMode === "EDIT" && !farmer.status) {
            errors.push("Status has an error. Please check again.");
        }
        if (farmer.compost === null || farmer.compost === undefined) {
            errors.push("Please select whether this farmer is a compost customer.");
        }


        const landValue = landnoElement.value.trim();
        if (landValue !== "" && !farmer.landno) {
            errors.push("Land number format is invalid. Please check again.");
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

        // Brand-new farmer → no crops yet. Crops are added afterwards by the
        // farmer themselves from the My Account page.
        farmer.crops = cropItemList.map((item) => ({
            cropListManagement: item.cropListManagement,
            price: item.price,
        }));

        console.log("Submitting farmer:", farmer);

        let response = getHTTPServiceRequest("/farmer/farmerlist/save", "POST", farmer);

        if (response === "OK") {
            Notiflix.Notify.success("Saved successfully");
            $("#FarmerAddForm").modal("hide");
            loadInitialData();
            refreshFarmerTable();
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

        // Only reassign "who touched this record" if something actually changed.
        // Untouched records keep whoever was already stamped on them.
        // Same gate as crop.js's handleUpdate() / employee.js's handleUpdate().
        if (hasFarmerDataChanged()) {
            loadLoggedInUserInto(farmer, userIdElement);
        }

        // Crops are no longer editable from this form — pass the farmer's
        // existing crops straight back through, unchanged.
        farmer.crops = cropItemList.map((item) => ({
            id:                 item.id || null,
            cropListManagement: item.cropListManagement,
            price:               item.price,
            status:              item.status,
        }));

        console.log("Updating farmer:", farmer);

        let response = getHTTPServiceRequest("/farmer/farmerlist/update", "PUT", farmer);

        if (response === "OK") {
            updateDateElement.textContent = new Date().toLocaleString();
            Notiflix.Notify.success("Updated successfully");
            $("#FarmerAddForm").modal("hide");
            loadInitialData();
            refreshFarmerTable();
            initializeForm();
        } else {
            Notiflix.Notify.warning("Update failed: " + response);
        }

    };

    const handleDelete = () => {
        Notiflix.Confirm.show(
            "Delete Farmer",
            "Are you sure you want to delete this farmer?",
            "Yes, Delete",
            "Cancel",
            () => {
                let response = getHTTPServiceRequest(
                    "/farmer/farmerlist/" + farmer.id,
                    "DELETE",
                    null
                );

                if (response !== "AJAX error") {
                    Notiflix.Notify.success("Deleted successfully");
                    $("#FarmerAddForm").modal("hide");
                    loadInitialData();
                    refreshFarmerTable();
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

    const viewFarmerRecord = (dataOb) => {
        document.querySelector("#tdFarmerID").innerText    = dataOb.number     || "-";
        document.querySelector("#tdFullname").innerText    = dataOb.fullname   || "-";
        document.querySelector("#tdNic").innerText         = dataOb.nic        || "-";
        document.querySelector("#tdMobile").innerText      = dataOb.mobileno   || "-";
        document.querySelector("#tdEmail").innerText       = dataOb.email      || "-";
        document.querySelector("#tdDistrict").innerText    = dataOb.district   || "-";
        document.querySelector("#tdBankname").innerText    = dataOb.bankname   || "-";
        document.querySelector("#tdBankbranch").innerText  = dataOb.bankbranch || "-";
        document.querySelector("#tdAccountno").innerText   = dataOb.accountno  || "-";
        document.querySelector("#tdAddress").innerText     = dataOb.address    || "-";
        document.querySelector("#tdStatus").innerText      = dataOb.status     || "-";
        document.querySelector("#tdCompostCustomer").innerText =
            dataOb.compost === true ? "Yes" : dataOb.compost === false ? "No" : "-";

        // Fill crops print sub-table (no Status column here, matching
        const printCropBody = document.querySelector("#tablePrintCropItemsBody");
        printCropBody.innerHTML = "";
        const crops = dataOb.crops || cropItemList;

        crops.forEach((item, index) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.cropListManagement?.name || "-"}</td>
            <td>${item.price?.toFixed(2) || "-"}</td>
        `;
            printCropBody.appendChild(tr);
        });

        const editModalContent = farmerAddFormModalElement.querySelector(".modal-content");
        editModalContent.classList.add("blurred");

        const viewModal = new bootstrap.Modal(printViewFarmerModalElement);
        viewModal.show();

        printViewFarmerModalElement.addEventListener(
            "hidden.bs.modal",
            () => {
                editModalContent.classList.remove("blurred");
            },
            { once: true }
        );
    };

    const handlePrint = () => {
        viewFarmerRecord(farmer);
    };

    const printFarmerRecord = () => {
        let newWindow = window.open();
        newWindow.document.write(
            "<html><head>" +
            "<title>Farmer Details</title>" +
            '<link rel="stylesheet" href="/css/bootstrap-5.3.3/css/bootstrap.min.css">' +
            "</head><body>" +
            document.querySelector("#divCardPrintFarmer").outerHTML +
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
        refreshFarmerTable();
    }
    window.initPage();


    window.printFarmerRecord = printFarmerRecord;

})();