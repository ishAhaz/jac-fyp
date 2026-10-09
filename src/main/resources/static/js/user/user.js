//********************************
//*******id query Selector********

//***********Query select and id start***********
//***********************************************
(function () {

    const userAddFormModelElement = document.querySelector("#UserAddForm");

// table body
    const tableBody = document.querySelector("#tableBodyId");

    const userAddElement = document.querySelector("#addNewUserId");

// form fields
    const userForm = document.querySelector("#formUser");
    const formTitleNewElement = document.querySelector("#formTitleNew");
    const formTitleEditElement = document.querySelector("#formTitleEdit");

//dates
    const regDateElement = document.querySelector("#regDate");
    const updateDateElement = document.querySelector("#updateDate");

// account type + owner groups (Employee / Farmer / Supermarket / Supplier)
    const formAccountTypeElement = document.querySelector("#selectAccountType");
    const employeeSelectGroupElement = document.querySelector("#employeeSelectGroup");
    const farmerSelectGroupElement = document.querySelector("#farmerSelectGroup");
    const supermarketSelectGroupElement = document.querySelector("#supermarketSelectGroup");
    const supplierSelectGroupElement = document.querySelector("#supplierSelectGroup");
    const labelCallingnameElement = document.querySelector("#labelCallingname");

// employee / farmer / supermarket / supplier selects, and shared display-name field
    const formEmployeeElement = document.querySelector("#selectEmployee");
    const formFarmerElement = document.querySelector("#selectFarmer");
    const formSupermarketElement = document.querySelector("#selectSupermarket");
    const formSupplierElement = document.querySelector("#selectSupplier");
    const formCallingnameElement = document.querySelector("#textCallingname");

// username and email
    const formUsernameElement = document.querySelector("#textUsername");
    const formEmailElement = document.querySelector("#textEmail");

// password
    const formPasswordElement = document.querySelector("#textPassword");
    const formRetypePasswordElement = document.querySelector("#textRetypePassword");

//image
    const formUserImageElement = document.querySelector("#fileUserImage");
    const imgUserPreviewElement = document.querySelector("#imgUserPreview");
    const btnRemoveImageElement = document.querySelector("#btnRemoveImage");
// roles
    const formRoleColumnElement = document.querySelector("#rolecolumn");

// user status
    const formUserStatusElement = document.querySelector("#selectUserStatus");
    const userStatusColElement = document.querySelector("#userStatusCol");

//user
    const formLoggedUserElement = document.querySelector("#userId");

// note
    const formUserNoteElement = document.querySelector("#textUserNote");


// buttons
    const btnClearElement = document.querySelector("#buttonClear");
    const btnPrintElement = document.querySelector("#buttonPrint");
    const btnDeleteElement = document.querySelector("#buttonDelete");
    const btnUpdateElement = document.querySelector("#buttonUpdate");
    const btnSubmitElement = document.querySelector("#buttonSubmit");

// table
    const tableHeadElement = document.querySelector("#tableHeadId");

// print view modal
    const userViewModalElement = document.querySelector("#UserViewModal");
    const printCardElement = document.querySelector("#divCardPrintUser");
    const printAccountTypeElement = document.querySelector("#tdAccountType");
    const printEmployeeElement = document.querySelector("#tdEmployee"); // holds "Account Owner" now
    const printUsernameElement = document.querySelector("#tdUsername");
    const printEmailElement = document.querySelector("#tdEmail");
    const printRoleElement = document.querySelector("#tdRole");
    const printStatusElement = document.querySelector("#tdStatus");

//***********query select and id end***********
//***********************************************
//********************************
//********************************




//********************************
//******object and window load****

    let userList = [];
    let user = {};
    let oldUser = {};
    let formMode = "ADD";


//********************************
//********************************




//********************************
//****initializeEventListeners****
    const initializeEventListeners = () => {
        formAccountTypeElement.addEventListener("change", validateAccountType);
        formEmployeeElement.addEventListener("change", validateEmployee);
        formFarmerElement.addEventListener("change", validateFarmer);
        formSupermarketElement.addEventListener("change", validateSupermarket);
        formSupplierElement.addEventListener("change", validateSupplier);
        formUsernameElement.addEventListener("input", validateUsername);
        formPasswordElement.addEventListener("input", validatePassword);
        formRetypePasswordElement.addEventListener("input", validateRetypePassword);
        formUserImageElement.addEventListener("change", validateImageUpload);
        btnRemoveImageElement.addEventListener("click", validateRemoveImage);
        formEmailElement.addEventListener("input", validateEmail);
        formUserStatusElement.addEventListener("change", validateStatus);
        formUserNoteElement.addEventListener("input", validateNote);
        // formLoggedUserElement is read-only and fully managed by
        // loadLoggedInUserInto() (on open/ADD) and by hasUserChanged() (on
        // update) — no manual input validation needed here anymore.



        btnSubmitElement.addEventListener("click", handleSubmit);
        btnUpdateElement.addEventListener("click", handleUpdate);
        btnClearElement.addEventListener("click", handleClear);
        btnDeleteElement.addEventListener("click", handleDelete);
        btnPrintElement.addEventListener("click", handlePrint);
    }
//********************************
//********************************




//********************************
//*******initializeForm***********
    const initializeForm = () => {
        user = {};
        oldUser = {};
        formMode = "ADD";
        userForm.reset();
        removeValidationStyles(userForm);

        let dateTime = getTodayDateTime();
        let date = dateTime.slice(0,10);
        let time = dateTime.slice(11,19);
        regDateElement.textContent = date + " " +time;
        updateDateElement.textContent = "-";

        user.imageRemoved = false;

        // account type + owner reset
        formAccountTypeElement.value = "";
        user.accounttype = null;
        user.employee = null;
        user.farmer = null;
        user.supermarket = null;
        user.supplier = null;
        hideAllOwnerGroups();
        formEmployeeElement.value = "";
        formFarmerElement.value = "";
        formSupermarketElement.value = "";
        formSupplierElement.value = "";
        formCallingnameElement.value = "";
        labelCallingnameElement.innerHTML = 'Callingname : <span class="text-danger">*</span>';

        formUserStatusElement.value = "";

        document.querySelectorAll(".role-check").forEach(cb => cb.checked = false);

        imgUserPreviewElement.src = "/images/img/user_default.png";
        formUserImageElement.value = "";
        user.image = null;
        btnRemoveImageElement.classList.add("d-none");

        user.roles = [];
        roleSelectionOrder = [];
        user.note = null;
        user.status = statuses.length > 0 ? statuses[0].name : null;
        btnSubmitElement.classList.remove("d-none");
        btnUpdateElement.classList.add("d-none");
        btnDeleteElement.classList.add("d-none");
        btnPrintElement.classList.add("d-none");

        userStatusColElement.classList.add("d-none");

        formTitleNewElement.classList.remove("d-none");
        formTitleEditElement.classList.add("d-none");

        // Auto fill currently logged-in user as the record's "last touched by" user
        loadLoggedInUserInto(user, formLoggedUserElement);
        formLoggedUserElement.readOnly = true;
    }
//********************************
//********************************




//********************************
//******loadInitialData***********
    const loadInitialData = () => {
        loadEmployees();
        generateEmployees();
        loadFarmers();
        generateFarmers();
        loadSupermarkets();
        generateSupermarkets();
        loadSuppliers();
        generateSuppliers();
        loadStatuses();
        generateStatuses();
        loadRoles();
        generateRoles();
        userList = getServiceRequest("/user/usermanagement/alldata/selected");




    };
//********************************
//********************************




//********************************
//*******refreshUserTable*********
    const refreshUserTable = () => {
        if ($.fn.DataTable.isDataTable("#tableUser")) {
            $("#tableUser").DataTable().destroy();
        }

        tableBody.innerHTML = "";
        let displayProperty = [
            { propertyName: getAccountType, dataType: "function" },
            { propertyName: getOwnerName, dataType: "function" },
            { propertyName: getUsername, dataType: "function" },
            { propertyName: getEmail, dataType: "function" },
            { propertyName: getRoles, dataType: "function" },
            { propertyName: getStatus, dataType: "function" },
        ];

        fillDataIntoTableThree(
            tableBody,
            userList,
            displayProperty,
            refillUserForm,
        );

        $("#tableUser").DataTable();
    }
//********************************
//********************************




//********************************
//***********getters**************
// NOTE: values must match the AccountType enum constant names exactly
// (Employee / Farmer / Supermarket / Supplier) — @Enumerated(EnumType.STRING) is
// case-sensitive, and the entity field itself is "accounttype" (lowercase
// t), not "accountType".
    const getAccountType = (ob) => {
        return ob.accounttype || '';
    };

// single source of truth for "who does this account belong to" — used by
// the table, the print modal, and nowhere else.
// Confirmed real field names (from the entities):
//   Farmer:      number, fullname
//   Supermarket: number, name
//   Supplier:    supplierid, contactperson
    const getOwnerName = (ob) => {
        if (ob.accounttype === "Employee" && ob.employee) {
            return (ob.employee.number || "-") + " - " + (ob.employee.callingname || "-");
        }
        if (ob.accounttype === "Farmer" && ob.farmer) {
            return (ob.farmer.number || "-") + " - " + (ob.farmer.fullname || "-");
        }
        if (ob.accounttype === "Supermarket" && ob.supermarket) {
            return (ob.supermarket.number || "-") + " - " + (ob.supermarket.name || "-");
        }
        if (ob.accounttype === "Supplier" && ob.supplier) {
            return (ob.supplier.supplierid || "-") + " - " + (ob.supplier.contactperson || "-");
        }
        return '-';
    };

    const getEmployee = getOwnerName; // kept as an alias in case other code still calls getEmployee

    const getUsername = (ob) => {
        return ob.username && ob.username.trim() !== "" ? ob.username : "-";
    };

    const getEmail = (ob) => {
        return ob.email && ob.email.trim() !== "" ? ob.email : "-";
    };

    const getRoles = (ob) => {
        if (!ob.roles || ob.roles.length === 0) return '-';
        return ob.roles.map(r => r.name).join(", ");
    };
    const getStatus = (ob) => {
        if (!ob.status) return '';
        if (ob.status === "Active") {
            return '<p class="p-1 bg-info">Active</p>';
        } else if (ob.status === "Pending") {
            return '<p class="p-1 bg-warning">Pending</p>';
        } else {
            return '<p class="p-1 bg-danger">Inactive</p>';
        }
    };
//********************************
//********************************




//********************************
//*******validations**************

// ---- account type gating ----
    const hideAllOwnerGroups = () => {
        employeeSelectGroupElement.classList.add("d-none");
        farmerSelectGroupElement.classList.add("d-none");
        supermarketSelectGroupElement.classList.add("d-none");
        supplierSelectGroupElement.classList.add("d-none");
    };

    const showOwnerGroupForType = (type) => {
        hideAllOwnerGroups();
        if (type === "Employee") {
            employeeSelectGroupElement.classList.remove("d-none");
            labelCallingnameElement.innerHTML = 'Callingname : <span class="text-danger">*</span>';
        } else if (type === "Farmer") {
            farmerSelectGroupElement.classList.remove("d-none");
            labelCallingnameElement.innerHTML = 'Farmer Name : <span class="text-danger">*</span>';
        } else if (type === "Supermarket") {
            supermarketSelectGroupElement.classList.remove("d-none");
            labelCallingnameElement.innerHTML = 'Supermarket Name : <span class="text-danger">*</span>';
        } else if (type === "Supplier") {
            supplierSelectGroupElement.classList.remove("d-none");
            labelCallingnameElement.innerHTML = 'Supplier Name : <span class="text-danger">*</span>';
        }
    };

    const validateAccountType = () => {
        const value = formAccountTypeElement.value;
        if (value === "") {
            user.accounttype = null;
            setInvalid(formAccountTypeElement);
            hideAllOwnerGroups();
            return;
        }

        user.accounttype = value;

        // switching type invalidates whichever owner was previously picked
        user.employee = null;
        user.farmer = null;
        user.supermarket = null;
        user.supplier = null;
        formEmployeeElement.value = "";
        formFarmerElement.value = "";
        formSupermarketElement.value = "";
        formSupplierElement.value = "";
        formCallingnameElement.value = "";
        formEmailElement.value = "";

        showOwnerGroupForType(value);

        if (formMode === "EDIT" && value !== oldUser.accounttype) {
            setUpdated(formAccountTypeElement);
        } else {
            setValid(formAccountTypeElement);
        }
    };


// ---- employee owner ----
    let employees = [];
    const loadEmployees = () => {
        employees = getServiceRequest("/employee/employeelist/alldata/fordropdown");
    };
    const generateEmployees = () => {
        formEmployeeElement.innerHTML = "";

        const defaultOpt = document.createElement("option");
        defaultOpt.value = "";
        defaultOpt.innerText = "Select Employee..";
        defaultOpt.selected = true;
        defaultOpt.disabled = true;
        formEmployeeElement.appendChild(defaultOpt);

        employees.forEach(emp => {
            const option = document.createElement("option");
            option.value = JSON.stringify(emp);
            option.innerText = emp.number + " - " + emp.callingname;
            formEmployeeElement.appendChild(option);
        });
    };
    const validateEmployee = () => {
        const value = formEmployeeElement.value;
        if (value === "") {
            user.employee = null;
            formCallingnameElement.value = "";
            formEmailElement.value = "";
            setInvalid(formEmployeeElement);
            return;
        }
        user.employee = JSON.parse(value);

        formCallingnameElement.value = user.employee.callingname;
        formCallingnameElement.classList.add("is-valid");

        formEmailElement.value = user.employee.email;
        user.email = user.employee.email;
        formEmailElement.classList.add("is-valid");

        if (formMode === "EDIT" && JSON.stringify(user.employee) !== JSON.stringify(oldUser.employee)) {
            setUpdated(formEmployeeElement);
        } else {
            setValid(formEmployeeElement);
        }
    };


// ---- farmer owner ----
// Confirmed real Farmer fields: fullname, number (registration no).
    let farmers = [];
    const loadFarmers = () => {
        farmers = getServiceRequest("/farmer/farmerlist/alldata/selected");
    };
    const generateFarmers = () => {
        formFarmerElement.innerHTML = "";

        const defaultOpt = document.createElement("option");
        defaultOpt.value = "";
        defaultOpt.innerText = "Select Farmer..";
        defaultOpt.selected = true;
        defaultOpt.disabled = true;
        formFarmerElement.appendChild(defaultOpt);

        farmers.forEach(f => {
            const option = document.createElement("option");
            option.value = JSON.stringify(f);
            option.innerText = (f.number || "-") + " - " + (f.fullname || "-");
            formFarmerElement.appendChild(option);
        });
    };
    const validateFarmer = () => {
        const value = formFarmerElement.value;
        if (value === "") {
            user.farmer = null;
            formCallingnameElement.value = "";
            formEmailElement.value = "";
            setInvalid(formFarmerElement);
            return;
        }
        user.farmer = JSON.parse(value);

        formCallingnameElement.value = user.farmer.fullname || "";
        formCallingnameElement.classList.add("is-valid");

        formEmailElement.value = user.farmer.email || "";
        user.email = user.farmer.email || null;
        formEmailElement.classList.add("is-valid");

        if (formMode === "EDIT" && JSON.stringify(user.farmer) !== JSON.stringify(oldUser.farmer)) {
            setUpdated(formFarmerElement);
        } else {
            setValid(formFarmerElement);
        }
    };


// ---- supermarket owner ----
// Confirmed real Supermarket fields: name, number (registration no).
    let supermarkets = [];
    const loadSupermarkets = () => {
        supermarkets = getServiceRequest("/supermarket/supermarketlist/alldata/selected");
    };
    const generateSupermarkets = () => {
        formSupermarketElement.innerHTML = "";

        const defaultOpt = document.createElement("option");
        defaultOpt.value = "";
        defaultOpt.innerText = "Select Supermarket..";
        defaultOpt.selected = true;
        defaultOpt.disabled = true;
        formSupermarketElement.appendChild(defaultOpt);

        supermarkets.forEach(s => {
            const option = document.createElement("option");
            option.value = JSON.stringify(s);
            option.innerText = (s.number || "-") + " - " + (s.name || "-");
            formSupermarketElement.appendChild(option);
        });
    };
    const validateSupermarket = () => {
        const value = formSupermarketElement.value;
        if (value === "") {
            user.supermarket = null;
            formCallingnameElement.value = "";
            formEmailElement.value = "";
            setInvalid(formSupermarketElement);
            return;
        }
        user.supermarket = JSON.parse(value);

        formCallingnameElement.value = user.supermarket.name || "";
        formCallingnameElement.classList.add("is-valid");

        formEmailElement.value = user.supermarket.email || "";
        user.email = user.supermarket.email || null;
        formEmailElement.classList.add("is-valid");

        if (formMode === "EDIT" && JSON.stringify(user.supermarket) !== JSON.stringify(oldUser.supermarket)) {
            setUpdated(formSupermarketElement);
        } else {
            setValid(formSupermarketElement);
        }
    };


// ---- supplier owner ----
// NOTE: Supplier lives in lk.jac.ingredient.entity per the backend imports,
// so the dropdown endpoint is assumed to sit under /ingredient/supplierlist/...
// following the same convention as farmer/supermarket. Adjust the URL below
// once the real SupplierController mapping is confirmed.
// Confirmed real Supplier fields used for display: supplierid, contactperson.
    let suppliers = [];
    const loadSuppliers = () => {
        suppliers = getServiceRequest("/ingredient/supplier/alldata/selected");
    };
    const generateSuppliers = () => {
        formSupplierElement.innerHTML = "";

        const defaultOpt = document.createElement("option");
        defaultOpt.value = "";
        defaultOpt.innerText = "Select Supplier..";
        defaultOpt.selected = true;
        defaultOpt.disabled = true;
        formSupplierElement.appendChild(defaultOpt);

        suppliers.forEach(s => {
            const option = document.createElement("option");
            option.value = JSON.stringify(s);
            option.innerText = (s.supplierid || "-") + " - " + (s.contactperson || "-");
            formSupplierElement.appendChild(option);
        });
    };
    const validateSupplier = () => {
        const value = formSupplierElement.value;
        if (value === "") {
            user.supplier = null;
            formCallingnameElement.value = "";
            formEmailElement.value = "";
            setInvalid(formSupplierElement);
            return;
        }
        user.supplier = JSON.parse(value);

        formCallingnameElement.value = user.supplier.contactperson || "";
        formCallingnameElement.classList.add("is-valid");

        formEmailElement.value = user.supplier.email || "";
        user.email = user.supplier.email || null;
        formEmailElement.classList.add("is-valid");

        if (formMode === "EDIT" && JSON.stringify(user.supplier) !== JSON.stringify(oldUser.supplier)) {
            setUpdated(formSupplierElement);
        } else {
            setValid(formSupplierElement);
        }
    };


    let statuses = [];
    const loadStatuses = () => {
        statuses = [
            { name: "Active" },
            { name: "Inactive" },
            { name: "Pending" }
        ];
    };
    const generateStatuses = () => {
        fillDataIntoSelect(formUserStatusElement, "Select Status..", statuses, "name");
    };
    const validateStatus = () => {
        const value = formUserStatusElement.value;
        if (value === "") {
            user.status = null;
            setInvalid(formUserStatusElement);
            return;
        }

        const parsed = JSON.parse(value);
        user.status = parsed.name;
        if (formMode === "EDIT" && JSON.stringify(user.status) !== JSON.stringify(oldUser.status)) {
            setUpdated(formUserStatusElement);
        } else {
            setValid(formUserStatusElement);
        }
    };


    const validateUsername = () => {
        const value = formUsernameElement.value.trim();
        const pattern = /^[a-zA-Z0-9_]{4,20}$/;
        if (value === "") {
            user.username = null;
            setInvalid(formUsernameElement);
            return;
        }
        if (pattern.test(value)) {
            user.username = value;
            if (formMode === "EDIT" && value !== oldUser.username) {
                setUpdated(formUsernameElement);
            } else {
                setValid(formUsernameElement);
            }
        } else {
            user.username = null;
            setInvalid(formUsernameElement);
        }
    };


    const validateEmail = () => {
        const value = formEmailElement.value.trim();
        const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (value === "") {
            user.email = null;
            setInvalid(formEmailElement);
            return;
        }
        if (pattern.test(value)) {
            user.email = value;
            if (formMode === "EDIT" && value !== oldUser.email) {
                setUpdated(formEmailElement);
            } else {
                setValid(formEmailElement);
            }
        } else {
            user.email = null;
            setInvalid(formEmailElement);
        }
    };


    const validatePassword = () => {
        const value = formPasswordElement.value;
        const pattern = /^.{6,}$/;
        if (value === "") {
            user.password = null;
            setInvalid(formPasswordElement);
            return;
        }
        if (pattern.test(value)) {
            user.password = value;
            setValid(formPasswordElement);
            validateRetypePassword();
        } else {
            user.password = null;
            setInvalid(formPasswordElement);
        }
    };


    const validateRetypePassword = () => {
        const value = formRetypePasswordElement.value;
        if (value === formPasswordElement.value && value !== "") {
            setValid(formRetypePasswordElement);
        } else {
            setInvalid(formRetypePasswordElement);
        }
    };

    const validateImageUpload = (event) => {
        const file = event.target.files[0];
        btnRemoveImageElement.classList.remove("d-none");
        if (!file) {
            user.image = null;
            imgUserPreviewElement.src = "/images/img/user_default.png";
            return;
        }

        // preview
        imgUserPreviewElement.src = URL.createObjectURL(file);

        // convert to base64 (for sending to backend)
        const reader = new FileReader();
        reader.onload = function (e) {
            user.imageBase64 = e.target.result; // ← change from user.image to user.imageBase64
            user.image = null;
        };
        reader.readAsDataURL(file);
    };
    const validateRemoveImage = () => {
        Notiflix.Confirm.show(
            "Remove Image",
            "Are you sure you want to remove the profile picture?",
            "Yes, Remove",
            "Cancel",
            () => {
                // On confirm
                btnRemoveImageElement.classList.add("d-none");
                imgUserPreviewElement.src = "/images/img/user_default.png";
                formUserImageElement.value = "";
                user.image = null;
                user.imageBase64 = null;
                user.imageRemoved = true;
                Notiflix.Notify.success("Image removed");
            },
            () => {
                // On cancel - do nothing
                Notiflix.Notify.info("Image removal cancelled");
            }
        );
    };

    let roles = [];
    let roleSelectionOrder = [];
    const loadRoles = () => {
        roles = getServiceRequest("/privilege/role/assignable");

    };
    const generateRoles = () => {
        formRoleColumnElement.innerHTML = "";
        roles.forEach(role => {
            formRoleColumnElement.innerHTML += `
        <div class="form-check form-check-inline">
            <input class="form-check-input role-check" 
                   type="checkbox" 
                   id="role_${role.id}" 
                   value='${JSON.stringify(role)}'>
            <label class="form-check-label" for="role_${role.id}">${role.name}</label>
        </div>`;
        });
        // add event listeners to dynamically created checkboxes
        document.querySelectorAll(".role-check").forEach(checkbox => {
            checkbox.addEventListener("click", validateRoles);
        });
    };
    const validateRoles = () => {
        document.querySelectorAll(".role-check").forEach(checkbox => {
            const role = JSON.parse(checkbox.value);

            if (checkbox.checked) {
                if (!roleSelectionOrder.some(r => r.id === role.id)) {
                    roleSelectionOrder.push(role); // add to end = order clicked
                }
            } else {
                roleSelectionOrder = roleSelectionOrder.filter(r => r.id !== role.id);
            }
        });

        user.roles = roleSelectionOrder;
    };



    const validateNote = () => {
        user.note = formUserNoteElement.value || null;
    };
//********************************
//********************************






//********************************
//***refillUserForm***************
    const refillUserForm = (dataob) => {
        removeValidationStyles(userForm);
        let mymodal = new bootstrap.Modal(userAddFormModelElement, {});
        formMode = "EDIT";

        user = JSON.parse(JSON.stringify(dataob));
        oldUser = JSON.parse(JSON.stringify(dataob));


        let dateTimeEdit = user.addeddatetime;
        let dateEdit = dateTimeEdit.slice(0,10);
        let timeEdit = dateTimeEdit.slice(11,19);
        regDateElement.textContent = dateEdit + " " +timeEdit;



        if (!user.updateddatetime){
            updateDateElement.textContent = "-";
        }else{

            let dateTimeUpdate = user.updateddatetime;
            let dateUpdate = dateTimeUpdate.slice(0,10);
            let timeUpdate = dateTimeUpdate.slice(11,19);
            updateDateElement.textContent = dateUpdate + " " +timeUpdate;
        }


        // ---- account type + owner ----
        formAccountTypeElement.value = user.accounttype || "";
        showOwnerGroupForType(user.accounttype);

        generateEmployees();
        generateFarmers();
        generateSupermarkets();
        generateSuppliers();

        // always start clean — without this, editing a row with no owner
        // linked (e.g. a system account) shows leftover values from
        // whichever row was edited previously in this session
        formEmployeeElement.value = "";
        formFarmerElement.value = "";
        formSupermarketElement.value = "";
        formSupplierElement.value = "";
        formCallingnameElement.value = "";

        if (user.accounttype === "Employee" && user.employee) {
            [...formEmployeeElement.options].forEach(opt => {
                if (opt.value) {
                    try {
                        const emp = JSON.parse(opt.value);
                        if (emp.id === user.employee.id) formEmployeeElement.value = opt.value;
                    } catch (e) {}
                }
            });
            formCallingnameElement.value = user.employee.callingname || '';

        } else if (user.accounttype === "Farmer" && user.farmer) {
            [...formFarmerElement.options].forEach(opt => {
                if (opt.value) {
                    try {
                        const f = JSON.parse(opt.value);
                        if (f.id === user.farmer.id) formFarmerElement.value = opt.value;
                    } catch (e) {}
                }
            });
            formCallingnameElement.value = user.farmer.fullname || '';

        } else if (user.accounttype === "Supermarket" && user.supermarket) {
            [...formSupermarketElement.options].forEach(opt => {
                if (opt.value) {
                    try {
                        const s = JSON.parse(opt.value);
                        if (s.id === user.supermarket.id) formSupermarketElement.value = opt.value;
                    } catch (e) {}
                }
            });
            formCallingnameElement.value = user.supermarket.name || '';

        } else if (user.accounttype === "Supplier" && user.supplier) {
            [...formSupplierElement.options].forEach(opt => {
                if (opt.value) {
                    try {
                        const s = JSON.parse(opt.value);
                        if (s.id === user.supplier.id) formSupplierElement.value = opt.value;
                    } catch (e) {}
                }
            });
            formCallingnameElement.value = user.supplier.contactperson || '';
        }

        formUsernameElement.value = user.username || "";
        formEmailElement.value = user.email || "";
        formPasswordElement.value = "";
        formRetypePasswordElement.value = "";


        if (user.imageBase64) {
            imgUserPreviewElement.src = user.imageBase64; // ← use imageBase64
            btnRemoveImageElement.classList.remove("d-none");
        } else {
            imgUserPreviewElement.src = "/images/img/user_default.png";
            btnRemoveImageElement.classList.add("d-none");
        }


        // refill roles
        // After calling generateRoles(), re-check the right boxes:
        document.querySelectorAll(".role-check").forEach(checkbox => {
            const role = JSON.parse(checkbox.value);
            checkbox.checked = user.roles && user.roles.some(r => r.id === role.id);
        });
        roleSelectionOrder = user.roles ? [...user.roles] : [];

        generateStatuses();
        formUserStatusElement.value = JSON.stringify({ name: user.status });
        if (user.status === "Inactive") {
            document.querySelectorAll("#formUser input, #formUser select, #formUser textarea")
                .forEach(element => element.disabled = true);

            btnUpdateElement.classList.add("d-none");
            btnDeleteElement.classList.add("d-none");

        } else if (user.status === "Pending") {
            // Lock the owner-identity fields (these were set correctly at auto-creation
            // and shouldn't change), but unlock what the admin needs to approve the account.
            document.querySelectorAll("#formUser input, #formUser select, #formUser textarea")
                .forEach(element => element.disabled = true);

            // unlock fields the admin needs to fill in to approve this account
            formUsernameElement.disabled = false;
            formPasswordElement.disabled = false;
            formRetypePasswordElement.disabled = false;
            document.querySelectorAll(".role-check").forEach(cb => cb.disabled = false);
            formUserStatusElement.disabled = false;   // admin picks Active once ready
            formEmailElement.disabled = false;        // in case it needs correcting too

            btnUpdateElement.classList.remove("d-none");
            btnDeleteElement.classList.add("d-none");
        } else {
            document.querySelectorAll("#formUser input, #formUser select, #formUser textarea")
                .forEach(element => element.disabled = false);

            btnUpdateElement.classList.remove("d-none");
            btnDeleteElement.classList.remove("d-none");
        }

        formUserNoteElement.value = user.note || "";

        // formLoggedUserElement is DISPLAY ONLY here — shows whoever is
        // currently stamped as having last touched this record (last
        // updater, or creator if never updated). We do NOT touch user.user
        // on open. It only gets reassigned to the current session user
        // inside handleUpdate(), and only if the record is actually changed
        // and saved — see hasUserChanged(). Opening or cancelling never
        // reassigns it.
        formLoggedUserElement.value = user.user?.username || user.user?.id || "-";
        formLoggedUserElement.readOnly = true;

        userStatusColElement.classList.remove("d-none");
        btnSubmitElement.classList.add("d-none");
        btnUpdateElement.classList.remove("d-none");
        btnDeleteElement.classList.remove("d-none");
        btnPrintElement.classList.remove("d-none");
        formTitleEditElement.classList.remove("d-none");
        formTitleNewElement.classList.add("d-none");

        mymodal.show();
    };
//********************************
//********************************




//********************************
//****CHANGE DETECTION************
// Used to decide whether the "last touched by" user (user.user) should
// be overwritten with the currently logged-in user. Mirrors the
// hasCropChanged() pattern — only reassign when something meaningful
// was actually edited.
    const hasUserChanged = () => {
        if (user.accounttype !== oldUser.accounttype) return true;
        if (JSON.stringify(user.employee) !== JSON.stringify(oldUser.employee)) return true;
        if (JSON.stringify(user.farmer) !== JSON.stringify(oldUser.farmer)) return true;
        if (JSON.stringify(user.supermarket) !== JSON.stringify(oldUser.supermarket)) return true;
        if (JSON.stringify(user.supplier) !== JSON.stringify(oldUser.supplier)) return true;
        if (user.username !== oldUser.username) return true;
        if (user.email !== oldUser.email) return true;
        if (user.status !== oldUser.status) return true;
        if ((user.note || null) !== (oldUser.note || null)) return true;

        const oldRoleIds = (oldUser.roles || []).map(r => r.id).sort();
        const newRoleIds = (user.roles || []).map(r => r.id).sort();
        if (JSON.stringify(newRoleIds) !== JSON.stringify(oldRoleIds)) return true;

        if (user.imageRemoved) return true;
        if (user.imageBase64 && user.imageBase64 !== oldUser.imageBase64) return true;

        // a new password was typed in
        if (formPasswordElement.value !== "") return true;

        return false;
    };
//********************************
//********************************




//********************************
//*checkFormErrors and handlers***
    const checkFormErrors = () => {
        let errors = [];

        if (!user.accounttype) {
            errors.push("Account type is required");
        } else if (user.accounttype === "Employee" && !user.employee) {
            errors.push("Employee is required");
        } else if (user.accounttype === "Farmer" && !user.farmer) {
            errors.push("Farmer is required");
        } else if (user.accounttype === "Supermarket" && !user.supermarket) {
            errors.push("Supermarket is required");
        } else if (user.accounttype === "Supplier" && !user.supplier) {
            errors.push("Supplier is required");
        }

        if (!user.username) errors.push("Username is required");
        if (!user.email) errors.push("Email is required");
        if (!user.password && formMode === "ADD") errors.push("Password is required");
        if (!user.roles || user.roles.length === 0) errors.push("At least one role is required");
        if (formMode === "EDIT" && formPasswordElement.value !== "") {
            if (formPasswordElement.value !== formRetypePasswordElement.value) {
                errors.push("Passwords do not match");
            }
        }
        // Only require the "logged-in / last touched by" stamp for brand-new
        // records. Editing an existing record always attempts to (re)stamp
        // it first in handleUpdate() via hasUserChanged() -> loadLoggedInUserInto();
        // legacy/root records (e.g. Admin, whose user_id has no creator) should
        // not be permanently blocked from being edited just because that
        // historical stamp is null.
        if (formMode === "ADD" && !user.user) {
            errors.push("Logged-in user has an error. Please check again");
        }
        return errors;
    };


    const handleSubmit = () => {
        const errors = checkFormErrors();
        if (errors.length > 0) {
            Notiflix.Notify.warning(errors.join(" | "))
            return;
        }
        console.log("Submitting user:", user);

        let response = getHTTPServiceRequest("/user/usermanagement/save", "POST", user);

        if (response === "OK") {
            Notiflix.Notify.success("Saved successfully");
            $("#UserAddForm").modal("hide");
            loadInitialData();
            refreshUserTable();
            initializeForm();
        } else {
            Notiflix.Notify.warning("Save failed:" + response);
        }
    };


    const handleUpdate = () => {
        // Reassign "who touched this record" BEFORE validation runs, so that
        // legacy rows with no prior stamp (user.user null) get a valid one
        // whenever something is actually changed and saved. Only reassign if
        // something meaningful changed — records saved without any real edit
        // keep whoever was already stamped on them.
        if (hasUserChanged()) {
            loadLoggedInUserInto(user, formLoggedUserElement);
        }

        const errors = checkFormErrors();
        if (errors.length > 0) {
            Notiflix.Notify.warning(errors.join(" | "));
            return;
        }

        console.log("Updating user:", user);

        let response = getHTTPServiceRequest("/user/usermanagement/update", "PUT", user);

        if (response === "OK") {
            updateDateElement.textContent = new Date().toLocaleString();
            Notiflix.Notify.success("Updated successfully");
            $("#UserAddForm").modal("hide");
            loadInitialData();
            refreshUserTable();
            initializeForm();
        } else {
            Notiflix.Notify.warning("Update failed: "+response);
        }
    };


    const handleDelete = () => {
        Notiflix.Confirm.show(
            "Delete User",
            "Are you sure you want to delete this user?",
            "Yes, Delete",
            "Cancel",
            () => {
                let response = getHTTPServiceRequest(
                    "/user/usermanagement/" + user.id,
                    "DELETE",
                    null
                );

                if (response === "OK") {
                    Notiflix.Notify.success("Deleted successfully");
                    $("#UserAddForm").modal("hide");
                    loadInitialData();
                    refreshUserTable();
                    initializeForm();
                } else {
                    Notiflix.Notify.warning(response);
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


    const printUserRecord = () => {
        let new_window = window.open();
        new_window.document.write(
            "<html><head>" +
            "<title>print user</title>" +
            '<link rel="stylesheet" href="/css/bootstrap-5.3.3/css/bootstrap.min.css">' +
            "</head><body>" +
            printCardElement.outerHTML +
            "</body></html>"
        );
        setInterval(() => {
            new_window.stop();
            new_window.print();
            new_window.close();
        }, 500);
    };


    const viewUser = (dataOb) => {
        printAccountTypeElement.innerText = getAccountType(dataOb);
        printEmployeeElement.innerText = getOwnerName(dataOb);
        printUsernameElement.innerText = dataOb.username || '';
        printEmailElement.innerText = dataOb.email || '';
        printRoleElement.innerText = dataOb.roles ? dataOb.roles.map(r => r.name).join(", ") : '';
        printStatusElement.innerText = dataOb.status === "Active" ? "Active" : "Inactive";


        const editModalContent = userAddFormModelElement.querySelector(".modal-content");
        editModalContent.classList.add("blurred");

        const viewModal = new bootstrap.Modal(userViewModalElement);
        viewModal.show();

        userViewModalElement.addEventListener(
            "hidden.bs.modal",
            () => {
                editModalContent.classList.remove("blurred");
            },
            { once: true }
        );
    };


    const handlePrint = () => {
        viewUser(user);
    };
//********************************
//********************************




//********************************
//********************************
    userAddElement.addEventListener("click", () => {
        initializeForm();
        formTitleEditElement.classList.add("d-none");
        formTitleNewElement.classList.remove("d-none");
    });
//********************************
//********************************


    loadInitialData();
    initializeForm();
    initializeEventListeners();
    refreshUserTable();

    window.printUserRecord = printUserRecord;
})();