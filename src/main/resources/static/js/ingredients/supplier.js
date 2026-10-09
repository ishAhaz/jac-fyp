// ============================================================
// DOM ELEMENT REFERENCES
// ============================================================
(function () {
    let supplierAddFormModalElement
        ,  tableBody
        ,  printViewModalElement
        ,supplierForm
        , regDateElement
        ,  updateDateElement
        , inputSupplierIdElement
        ,  textContactPersonElement
        ,  textCompanyNameElement
        ,  textMobileElement
        ,  textEmailElement
        ,  textBankNameElement
        ,  textBranchNameElement
        ,  textBranchNoElement
        ,  textBankAccNoElement
        ,  selectStatusElement
        ,  userIdElement
        , textAddressElement
        , titleNewHide
        ,  titleEditHide
        ,  addNewSupplierElement
        , submitElement
        , updateElement
        , clearElement
        , printElement
        ,   deleteElement
        , tdCompanyName
        , tdContactPerson
        ,   tdMobile
        , tdEmail
        , tdAddress
        ,  tdBankName
        , tdBranchName
        , tdBranchNo
        , tdBankAccNo
        , tdStatus
        ,  tablePrintSupplierIngredientsBody
        ,  divCardPrintSupplier;
    const queryElements = () => {
        supplierAddFormModalElement = document.querySelector("#SupplierAddForm");

// Table body
        tableBody = document.querySelector("#tableBodyId");

// Print view modal
        printViewModalElement = document.querySelector("#SupplierViewModal");

// Form
        supplierForm = document.querySelector("#formSupplier");
        regDateElement = document.querySelector("#regDate");
        updateDateElement = document.querySelector("#updateDate");
        inputSupplierIdElement = document.querySelector("#InputSupplierId");

// Form fields
        textContactPersonElement = document.querySelector("#textContactPerson");
        textCompanyNameElement = document.querySelector("#textCompanyName");
        textMobileElement = document.querySelector("#textMobile");
        textEmailElement = document.querySelector("#textEmail");
        textBankNameElement = document.querySelector("#textBankName");
        textBranchNameElement = document.querySelector("#textBranchName");
        textBranchNoElement = document.querySelector("#textBranchNo");
        textBankAccNoElement = document.querySelector("#textBankAccNo");
        selectStatusElement = document.querySelector("#selectStatus");
        userIdElement = document.querySelector("#userId");
        textAddressElement = document.querySelector("#textAddress");

// Title toggles
        titleNewHide = document.querySelector("#formTitleNew");
        titleEditHide = document.querySelector("#formTitleEdit");

// NOTE: Supplier ingredients add/edit sub-section (selectIngredientItem,
// textPricePerUnit, buttonAddIngredientItem, tableSupplierIngredientsBody)
// was removed from supplier.html — ingredients are now managed by the
// supplier themselves from the My Account page. Do not re-add these
// queries unless that section comes back into the HTML.

// Buttons
        addNewSupplierElement = document.querySelector("#addNewSupplierId");
        submitElement = document.querySelector("#buttonSubmit");
        updateElement = document.querySelector("#buttonUpdate");
        clearElement = document.querySelector("#buttonClear");
        printElement = document.querySelector("#buttonPrint");
        deleteElement = document.querySelector("#buttonDelete");

// Print view cells
        tdCompanyName = document.querySelector("#tdCompanyName");
        tdContactPerson = document.querySelector("#tdContactPerson");
        tdMobile = document.querySelector("#tdMobile");
        tdEmail = document.querySelector("#tdEmail");
        tdAddress = document.querySelector("#tdAddress");
        tdBankName = document.querySelector("#tdBankName");
        tdBranchName = document.querySelector("#tdBranchName");
        tdBranchNo = document.querySelector("#tdBranchNo");
        tdBankAccNo = document.querySelector("#tdBankAccNo");
        tdStatus = document.querySelector("#tdStatus");
        tablePrintSupplierIngredientsBody = document.querySelector("#tablePrintSupplierIngredientsBody");
        divCardPrintSupplier = document.querySelector("#divCardPrintSupplier");

    }
// ============================================================
// STATE
// ============================================================

    let supplierList = [];

    let supplier    = {};
    let oldSupplier = {};
    let formMode    = "ADD";

// Reference data
    let statusList     = [];





// ============================================================
// EVENT LISTENERS
// ============================================================

    const initializeEventListeners = () => {
        // Field validation
        textContactPersonElement.addEventListener("input",  validateContactPerson);
        textCompanyNameElement.addEventListener("input",    validateCompanyName);
        textMobileElement.addEventListener("input",         validateMobile);
        textEmailElement.addEventListener("input",          validateEmail);
        textBankNameElement.addEventListener("input",       validateBankName);
        textBranchNameElement.addEventListener("input",     validateBranchName);
        textBranchNoElement.addEventListener("input",       validateBranchNo);
        textBankAccNoElement.addEventListener("input",      validateBankAccNo);
        selectStatusElement.addEventListener("change",      validateStatus);
        textAddressElement.addEventListener("input",        validateAddress);
        // userIdElement is read-only and fully managed by
        // loadLoggedInUserInto() (on open/ADD) and by hasSupplierChanged()
        // (on update) — no manual input validation needed on it anymore.


        addNewSupplierElement.addEventListener("click", () => {
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
// LOAD INITIAL DATA
// ============================================================

    const loadInitialData = () => {
        loadStatusList();
        supplierList = getServiceRequest("/ingredient/supplier/alldata/selected");
    };

    const loadStatusList = () => {
        statusList = [
            { name: "Active"   },
            { name: "Inactive" },
        ];
    };


// ============================================================
// INITIALIZE FORM  (reset to ADD mode)
// ============================================================

    const initializeForm = () => {
        supplier    = {};
        oldSupplier = {};
        formMode    = "ADD";

        supplierForm.reset();
        removeValidationStyles(supplierForm);

        inputSupplierIdElement.textContent = "-";
        updateDateElement.textContent      = "-";

        let dateTime = getTodayDateTime();
        let date     = dateTime.slice(0, 10);
        let time     = dateTime.slice(11, 19);
        regDateElement.textContent = date + " " + time;

        // Auto fill currently logged-in user as the record's user (creation case)
        loadLoggedInUserInto(supplier, userIdElement);
        userIdElement.readOnly = true;

        generateStatusSelect();

        submitElement.classList.remove("d-none");
        updateElement.classList.add("d-none");
        deleteElement.classList.add("d-none");
        printElement.classList.add("d-none");

        titleNewHide.classList.remove("d-none");
        titleEditHide.classList.add("d-none");
    };


// ============================================================
// DROPDOWN GENERATORS
// ============================================================

    const generateStatusSelect = () => {
        fillDataIntoSelect(
            selectStatusElement,
            "Select Supplier Status",
            statusList,
            "name"
        );
    };


// ============================================================
// FIELD VALIDATION
// ============================================================

    const validateContactPerson = () => {
        const value   = textContactPersonElement.value.trim();
        const pattern = /^[A-Za-z .]{2,100}$/;

        if (!pattern.test(value)) {
            supplier.contactperson = null;
            setInvalid(textContactPersonElement);
            return;
        }
        supplier.contactperson = value;

        if (formMode === "EDIT" && value !== oldSupplier.contactperson) {
            setUpdated(textContactPersonElement);
        } else {
            setValid(textContactPersonElement);
        }
    };

    const validateCompanyName = () => {
        const value = textCompanyNameElement.value.trim();

        // Optional field — clear validation if empty
        if (value === "") {
            supplier.companyname = null;
            textCompanyNameElement.classList.remove("is-valid", "is-invalid", "is-blue");
            return;
        }

        supplier.companyname = value;

        if (formMode === "EDIT" && value !== oldSupplier.companyname) {
            setUpdated(textCompanyNameElement);
        } else {
            setValid(textCompanyNameElement);
        }
    };

    const validateMobile = () => {
        const value   = textMobileElement.value.trim();
        const pattern = /^07[01245678][0-9]{7}$/;

        if (!pattern.test(value)) {
            supplier.mobilenum = null;
            setInvalid(textMobileElement);
            return;
        }
        supplier.mobilenum = value;

        if (formMode === "EDIT" && value !== oldSupplier.mobilenum) {
            setUpdated(textMobileElement);
        } else {
            setValid(textMobileElement);
        }
    };

    const validateEmail = () => {
        const value   = textEmailElement.value.trim();
        const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        // Optional field
        if (value === "") {
            supplier.email = null;
            textEmailElement.classList.remove("is-valid", "is-invalid", "is-blue");
            return;
        }

        if (!pattern.test(value)) {
            supplier.email = null;
            setInvalid(textEmailElement);
            return;
        }
        supplier.email = value;

        if (formMode === "EDIT" && value !== oldSupplier.email) {
            setUpdated(textEmailElement);
        } else {
            setValid(textEmailElement);
        }
    };

    const validateBankName = () => {
        const value = textBankNameElement.value.trim();

        if (value === "") {
            supplier.bankname = null;
            setInvalid(textBankNameElement);
            return;
        }
        supplier.bankname = value;

        if (formMode === "EDIT" && value !== oldSupplier.bankname) {
            setUpdated(textBankNameElement);
        } else {
            setValid(textBankNameElement);
        }
    };

    const validateBranchName = () => {
        const value = textBranchNameElement.value.trim();

        if (value === "") {
            supplier.branchname = null;
            setInvalid(textBranchNameElement);
            return;
        }
        supplier.branchname = value;

        if (formMode === "EDIT" && value !== oldSupplier.branchname) {
            setUpdated(textBranchNameElement);
        } else {
            setValid(textBranchNameElement);
        }
    };

    const validateBranchNo = () => {
        const value = textBranchNoElement.value.trim();

        if (value === "") {
            supplier.branchno = null;
            setInvalid(textBranchNoElement);
            return;
        }
        supplier.branchno = value;

        if (formMode === "EDIT" && value !== oldSupplier.branchno) {
            setUpdated(textBranchNoElement);
        } else {
            setValid(textBranchNoElement);
        }
    };

    const validateBankAccNo = () => {
        const value = textBankAccNoElement.value.trim();

        if (value === "") {
            supplier.bankaccno = null;
            setInvalid(textBankAccNoElement);
            return;
        }
        supplier.bankaccno = value;

        if (formMode === "EDIT" && value !== oldSupplier.bankaccno) {
            setUpdated(textBankAccNoElement);
        } else {
            setValid(textBankAccNoElement);
        }
    };

    const validateStatus = () => {
        const value = selectStatusElement.value;

        if (!value) {
            supplier.status = null;
            setInvalid(selectStatusElement);
            return;
        }

        const parsed    = JSON.parse(value);
        supplier.status = parsed.name;

        if (formMode === "EDIT" && supplier.status !== oldSupplier.status) {
            setUpdated(selectStatusElement);
        } else {
            setValid(selectStatusElement);
        }
    };

    const validateAddress = () => {
        const value   = textAddressElement.value.trim();
        const pattern = /^.{10,200}$/;

        if (!pattern.test(value)) {
            supplier.address = null;
            setInvalid(textAddressElement);
            return;
        }
        supplier.address = value;

        if (formMode === "EDIT" && value !== oldSupplier.address) {
            setUpdated(textAddressElement);
        } else {
            setValid(textAddressElement);
        }
    };


// ============================================================
// REFRESH MAIN TABLE
// ============================================================

    const refreshSupplierTable = () => {

        supplierList.sort((a, b) => {
            const aHasPending = a.ingredients?.some(si => si.status === "Pending");
            const bHasPending = b.ingredients?.some(si => si.status === "Pending");

            if (aHasPending && !bHasPending) return -1;
            if (!aHasPending && bHasPending) return 1;
            return 0;
        });


        if ($.fn.DataTable.isDataTable("#tableSupplier")) {
            $("#tableSupplier").DataTable().destroy();
        }

        tableBody.innerHTML = "";

        let displayProperty = [
            { propertyName: "supplierid",            dataType: "string"   },
            { propertyName: "contactperson",         dataType: "string"   },
            { propertyName: "companyname",           dataType: "string"   },
            { propertyName: "mobilenum",             dataType: "string"   },
            { propertyName: "email",                 dataType: "string"   },
            { propertyName: getIngredientsDisplay,   dataType: "function" },
            { propertyName: getStatus,          dataType: "function" },
        ];

        fillDataIntoTableThree(
            tableBody,
            supplierList,
            displayProperty,
            refillSupplierForm
        );

        $("#tableSupplier").DataTable();
    };

// Table display helpers
// getIngredientsDisplay — read-only summary; ingredients themselves are
// now added/edited by the supplier from My Account, not from this form.
    const getIngredientsDisplay = (ob) => {
        if (!ob.ingredients || ob.ingredients.length === 0) return "-";
        return ob.ingredients.map((si) => si.ingredient?.name || "-").join(", ");
    };

    const getStatus = (ob) => {

        if (ob.status === "Active") {
            return '<p class="p-1 bg-info">Active</p>';
        }

        if (ob.status === "Inactive") {
            return '<p class="p-1 bg-danger">Inactive</p>';
        }

        return ob.status;
    };


// ============================================================
// REFILL FORM — EDIT MODE
// ============================================================

    const refillSupplierForm = (dataOb) => {
        removeValidationStyles(supplierForm);

        let myModal = new bootstrap.Modal(supplierAddFormModalElement, {});
        formMode = "EDIT";

        supplier    = getServiceRequest("/ingredient/supplier/byid/" + dataOb.id);
        oldSupplier = JSON.parse(JSON.stringify(supplier));

        // Meta dates
        if (supplier.addeddatetime) {
            let dt = supplier.addeddatetime;
            regDateElement.textContent = dt.slice(0, 10) + " " + dt.slice(11, 19);
        } else {
            regDateElement.textContent = "-";
        }

        if (supplier.updateddatetime) {
            let dt = supplier.updateddatetime;
            updateDateElement.textContent = dt.slice(0, 10) + " " + dt.slice(11, 19);
        } else {
            updateDateElement.textContent = "-";
        }

        inputSupplierIdElement.textContent = supplier.supplierid || "-";

        // Fields
        textContactPersonElement.value = supplier.contactperson || "";
        textCompanyNameElement.value   = supplier.companyname   || "";
        textMobileElement.value        = supplier.mobilenum     || "";
        textEmailElement.value         = supplier.email         || "";
        textBankNameElement.value      = supplier.bankname      || "";
        textBranchNameElement.value    = supplier.branchname    || "";
        textBranchNoElement.value      = supplier.branchno      || "";
        textBankAccNoElement.value     = supplier.bankaccno     || "";
        textAddressElement.value       = supplier.address       || "";

        // User field is DISPLAY ONLY here — shows whoever is currently
        // stamped on the record (last updater, or creator if never
        // updated). We do NOT touch supplier.user on open. It only gets
        // reassigned to the current session user inside handleUpdate(),
        // and only if the record is actually changed and saved — see
        // hasSupplierChanged(). Opening or cancelling never reassigns it.
        userIdElement.value    = supplier.user?.username || supplier.user?.id || "-";
        userIdElement.readOnly = true;

        // Status
        generateStatusSelect();
        selectStatusElement.value = JSON.stringify({ name: supplier.status });

        // NOTE: ingredients are no longer edited from this form. supplier.ingredients
        // (as loaded from the backend) is kept as-is on the `supplier` object and
        // is simply not touched/resent — see handleSubmit/handleUpdate below.

        // Button visibility
        submitElement.classList.add("d-none");
        updateElement.classList.remove("d-none");
        deleteElement.classList.remove("d-none");
        printElement.classList.remove("d-none");

        titleNewHide.classList.add("d-none");
        titleEditHide.classList.remove("d-none");

        myModal.show();
    };


// ============================================================
// CHANGE DETECTION — used to decide whether the "last updated by"
// user should be overwritten with the currently logged-in user.
// ============================================================

// Returns true if any of the supplier's editable fields differ from
// the original snapshot taken when the record was opened for edit.
// Ingredients are no longer part of this form, so they're excluded
// from the comparison.
    const hasSupplierChanged = () => {
        if (supplier.contactperson !== oldSupplier.contactperson) return true;
        if ((supplier.companyname || null) !== (oldSupplier.companyname || null)) return true;
        if (supplier.mobilenum !== oldSupplier.mobilenum) return true;
        if ((supplier.email || null) !== (oldSupplier.email || null)) return true;
        if (supplier.bankname !== oldSupplier.bankname) return true;
        if (supplier.branchname !== oldSupplier.branchname) return true;
        if (supplier.branchno !== oldSupplier.branchno) return true;
        if (supplier.bankaccno !== oldSupplier.bankaccno) return true;
        if (supplier.status !== oldSupplier.status) return true;
        if (supplier.address !== oldSupplier.address) return true;

        return false;
    };


// ============================================================
// FORM ERROR CHECK
// ============================================================

    const checkFormErrors = () => {
        let errors = [];

        if (!supplier.contactperson) errors.push("Contact Person has an error. Please check again.");
        if (!supplier.mobilenum)     errors.push("Mobile No has an error. Please check again.");
        if (!supplier.bankname)      errors.push("Bank Name has an error. Please check again.");
        if (!supplier.branchname)    errors.push("Branch Name has an error. Please check again.");
        if (!supplier.branchno)      errors.push("Branch No has an error. Please check again.");
        if (!supplier.bankaccno)     errors.push("Bank Account No has an error. Please check again.");
        if (!supplier.status)        errors.push("Status has an error. Please check again.");
        if (!supplier.address)       errors.push("Address has an error. Please check again.");
        if (!supplier.user)          errors.push("User ID has an error. Please check again.");

        const emailValue = textEmailElement.value.trim();
        if (emailValue !== "" && !supplier.email) {
            errors.push("Email format is invalid. Please check again.");
        }

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

        // NOTE: `ingredients` is intentionally NOT set on `supplier` here.
        // A brand-new supplier has no ingredients yet — they're added later
        // by the supplier themselves from My Account. Sending nothing lets
        // the backend leave the (currently empty) ingredient set alone.
        // Requires SupplierController.saveData() to null-check getIngredients()
        // before iterating — see the accompanying controller fix.

        console.log("Submitting supplier:", supplier);

        let response = getHTTPServiceRequest("/ingredient/supplier/save", "POST", supplier);

        if (response === "OK") {
            Notiflix.Notify.success("Saved successfully");
            $("#SupplierAddForm").modal("hide");
            loadInitialData();
            refreshSupplierTable();
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
        if (hasSupplierChanged()) {
            loadLoggedInUserInto(supplier, userIdElement);
        }

        // NOTE: `ingredients` is intentionally left untouched/unset here too.
        // This form no longer manages a supplier's ingredients, so we must not
        // resend an empty/partial list — doing so would tell the backend those
        // ingredients were "removed" and soft-delete them. Requires
        // SupplierController.updateData() to only touch ingredients when the
        // field is explicitly provided — see the accompanying controller fix.

        console.log("Updating supplier:", supplier);

        let response = getHTTPServiceRequest("/ingredient/supplier/update", "PUT", supplier);

        if (response === "OK") {
            updateDateElement.textContent = new Date().toLocaleString();
            Notiflix.Notify.success("Updated successfully");
            $("#SupplierAddForm").modal("hide");
            loadInitialData();
            refreshSupplierTable();
            initializeForm();
        } else {
            Notiflix.Notify.warning("Update failed: " + response);
        }
    };

    const handleDelete = () => {
        Notiflix.Confirm.show(
            "Delete Supplier",
            "Are you sure you want to delete this supplier?",
            "Yes, Delete",
            "Cancel",
            () => {
                let response = getHTTPServiceRequest(
                    "/ingredient/supplier/" + supplier.id,
                    "DELETE",
                    null
                );

                if (response !== "AJAX error") {
                    Notiflix.Notify.success("Deleted successfully");
                    $("#SupplierAddForm").modal("hide");
                    loadInitialData();
                    refreshSupplierTable();
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

    const viewSupplierRecord = (dataOb) => {
        tdCompanyName.innerText   = dataOb.companyname   || "-";
        tdContactPerson.innerText = dataOb.contactperson || "-";
        tdMobile.innerText        = dataOb.mobilenum     || "-";
        tdEmail.innerText         = dataOb.email         || "-";
        tdAddress.innerText       = dataOb.address       || "-";
        tdBankName.innerText      = dataOb.bankname      || "-";
        tdBranchName.innerText    = dataOb.branchname    || "-";
        tdBranchNo.innerText      = dataOb.branchno      || "-";
        tdBankAccNo.innerText     = dataOb.bankaccno     || "-";
        tdStatus.innerText        = dataOb.status        || "-";

        // Supplier ingredients print table — read-only, sourced straight
        // from the loaded supplier record (ingredients are managed from
        // My Account now, not from this form).
        tablePrintSupplierIngredientsBody.innerHTML = "";
        const items = dataOb.ingredients || [];
        items.forEach((item, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.ingredient?.name || "-"}</td>
            <td>Rs. ${(item.price || 0).toFixed(2)}</td>`;
            tablePrintSupplierIngredientsBody.appendChild(row);
        });

        const editModalContent = supplierAddFormModalElement.querySelector(".modal-content");
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
        viewSupplierRecord(supplier);
    };

    const printSupplierRecord = () => {
        let newWindow = window.open();
        newWindow.document.write(
            "<html><head>" +
            "<title>Supplier Details</title>" +
            '<link rel="stylesheet" href="/css/bootstrap-5.3.3/css/bootstrap.min.css">' +
            "</head><body>" +
            divCardPrintSupplier.outerHTML +
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
        refreshSupplierTable();}
    window.initPage();

    window.printSupplierRecord = printSupplierRecord;
})();