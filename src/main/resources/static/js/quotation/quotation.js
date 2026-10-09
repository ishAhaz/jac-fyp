// ============================================================
// DOM ELEMENT REFERENCES
// ============================================================
(function () {
    let quotationAddFormModalElement
        , tableBody
        , selectSupermarket
        , selectFarmer
        , selectQuotationStatus
        , radioSupermarket
        , radioFarmer
        , radioNonReg
        , rowSupermarket
        , rowFarmer
        , rowNonReg
        , sectionSupermarketItems
        , sectionFarmerItems
        ,  printViewQuotationModalElement
        , quotationForm
        , addNewQuotationElement
        ,  quotationDateElement
        ,  updateDateElement
        , quotationNoElement
        ,  textUser
        , textGuestName
        , textGuestNumber
        , textGuestAddress
        ,  dateValid
        , textTotalAmount
        , textNote
        , inputSmCrop
        , inputSmUnitPrice
        , inputSmQty
        ,  btnAddSmItem
        , smItemsBody
        , smTotalAmount
        ,  inputFarmerCompost
        ,  inputFarmerUnitPrice
        , inputFarmerQty
        , btnAddFarmerItem
        , farmerItemsBody
        ,  farmerTotalAmount
        ,  titleEditHide
        ,  titleNewHide
        ,  submitElement
        ,  updateElement
        ,  clearElement
        ,  printElement
        , deleteElement;
    const queryElements = () => {
        quotationAddFormModalElement = document.querySelector("#QuotationAddForm");

// Table body
        tableBody = document.querySelector("#tableBodyId");

// Dropdowns
        selectSupermarket = document.querySelector("#selectSupermarket");
        selectFarmer = document.querySelector("#selectFarmer");
        selectQuotationStatus = document.querySelector("#selectQuotationStatus");

// Radio buttons — customer type
        radioSupermarket = document.querySelector("#radioSupermarket");
        radioFarmer = document.querySelector("#radioFarmer");
        radioNonReg = document.querySelector("#radioNonReg");

// Conditional section rows
        rowSupermarket = document.querySelector("#rowSupermarket");
        rowFarmer = document.querySelector("#rowFarmer");
        rowNonReg = document.querySelector("#rowNonReg");
        sectionSupermarketItems = document.querySelector("#sectionSupermarketItems");
        sectionFarmerItems = document.querySelector("#sectionFarmerItems");

// Print view modal
        printViewQuotationModalElement = document.querySelector("#QuotationViewModal");

// Form fields
        quotationForm = document.querySelector("#formQuotation");
        addNewQuotationElement = document.querySelector("#addNewQuotationId");
        quotationDateElement = document.querySelector("#quotationDate");
        updateDateElement = document.querySelector("#updateDate");
        quotationNoElement = document.querySelector("#InputQuotationNo");
        textUser = document.querySelector("#textUser");
        textGuestName = document.querySelector("#textGuestName");
        textGuestNumber = document.querySelector("#textGuestNumber");
        textGuestAddress = document.querySelector("#textGuestAddress");
        dateValid = document.querySelector("#dateValid");
        textTotalAmount = document.querySelector("#textTotalAmount");
        textNote = document.querySelector("#textNote");

// Supermarket item inputs
        inputSmCrop = document.querySelector("#inputSmCrop");
        inputSmUnitPrice = document.querySelector("#inputSmUnitPrice");
        inputSmQty = document.querySelector("#inputSmQty");
        btnAddSmItem = document.querySelector("#btnAddSmItem");
        smItemsBody = document.querySelector("#smItemsBody");
        smTotalAmount = document.querySelector("#smTotalAmount");

// Farmer item inputs
        inputFarmerCompost = document.querySelector("#inputFarmerCompost");
        inputFarmerUnitPrice = document.querySelector("#inputFarmerUnitPrice");
        inputFarmerQty = document.querySelector("#inputFarmerQty");
        btnAddFarmerItem = document.querySelector("#btnAddFarmerItem");
        farmerItemsBody = document.querySelector("#farmerItemsBody");
        farmerTotalAmount = document.querySelector("#farmerTotalAmount");

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

let quotationList = [];

let quotation    = {};
let oldQuotation = {};
let formMode = "ADD";

// Item line arrays
let smItems     = [];   // supermarket items  [{ crop, unitprice, qty, linetotal }]
let farmerItems = [];   // farmer / nonreg items [{ compost, unitprice, qty, linetotal }]




// ============================================================
// EVENT LISTENERS
// ============================================================

const initializeEventListeners = () => {
    // Customer type radios
    radioSupermarket.addEventListener("change", handleCustomerTypeChange);
    radioFarmer.addEventListener("change",      handleCustomerTypeChange);
    radioNonReg.addEventListener("change",      handleCustomerTypeChange);

    // Customer selects
    selectSupermarket.addEventListener("change", validateSupermarket);
    selectFarmer.addEventListener("change",      validateFarmer);

    // Non-reg guest fields
    textGuestName.addEventListener("input",    validateGuestName);
    textGuestNumber.addEventListener("input",  validateGuestNumber);
    textGuestAddress.addEventListener("input", validateGuestAddress);

    // Main form fields
    selectQuotationStatus.addEventListener("change", validateQuotationStatus);
    dateValid.addEventListener("input",              validateValidUntil);
    textNote.addEventListener("input",               validateNote);
    // textUser is read-only and fully managed by loadLoggedInUserInto()
    // (on open/ADD) and by hasQuotationChanged() (on update) — no manual
    // input validation needed here anymore.

    // Item add buttons
    btnAddSmItem.addEventListener("click",     handleAddSmItem);
    btnAddFarmerItem.addEventListener("click", handleAddFarmerItem);

    addNewQuotationElement.addEventListener("click", () => {
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
    quotation    = {};
    oldQuotation = {};
    formMode = "ADD";

    smItems     = [];
    farmerItems = [];

    quotationForm.reset();
    removeValidationStyles(quotationForm);

    quotationNoElement.textContent  = "-";
    updateDateElement.textContent   = "-";

    let dateTime = getTodayDateTime();
    let date = dateTime.slice(0, 10);
    let time = dateTime.slice(11, 19);
    quotationDateElement.textContent = date + " " + time;

    // Reset fields
    textGuestName.value    = "";
    textGuestNumber.value  = "";
    textGuestAddress.value = "";
    dateValid.value        = "";
    textTotalAmount.value  = "";
    textNote.value         = "";

    // Reset radios
    radioSupermarket.checked = false;
    radioFarmer.checked      = false;
    radioNonReg.checked      = false;

    // Hide conditional rows & sections
    rowSupermarket.classList.add("d-none");
    rowFarmer.classList.add("d-none");
    rowNonReg.classList.add("d-none");
    sectionSupermarketItems.classList.add("d-none");
    sectionFarmerItems.classList.add("d-none");

    // Reset item tables
    renderSmItemsTable();
    renderFarmerItemsTable();

    // Dropdowns
    generateQuotationStatus();
    selectSupermarket.value = "";
    selectFarmer.value      = "";

    // Auto fill currently logged-in user as the record's user (creation case)
    loadLoggedInUserInto(quotation, textUser);
    textUser.readOnly = true;

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
    loadSupermarkets();
    loadFarmers();
    loadCrops();
    loadComposts();
    loadQuotationStatuses();
    quotationList = getServiceRequest("/quotation/quotationlist/alldata");
};


// ============================================================
// REFRESH TABLE
// ============================================================

const refreshQuotationTable = () => {
    if ($.fn.DataTable.isDataTable("#tableQuotation")) {
        $("#tableQuotation").DataTable().destroy();
    }

    tableBody.innerHTML = "";

    let displayProperty = [
        { propertyName: "quotationnumber",      dataType: "string"   },
        { propertyName: getCustomerTypeDisplay, dataType: "function" },
        { propertyName: getCustomerDisplay,     dataType: "function" },
        { propertyName: getValidUntilDisplay,   dataType: "function" },
        { propertyName: getFormattedAmount,     dataType: "function" },
        { propertyName: getStatusBadge,         dataType: "function" },
        { propertyName: getUserDisplay,         dataType: "function" },
    ];

    fillDataIntoTableThree(
        tableBody,
        quotationList,
        displayProperty,
        refillQuotationForm
    );

    $("#tableQuotation").DataTable();
};

// Table display helpers
const getCustomerTypeDisplay = (ob) => {
    return ob.customertypes || "-";
};

const getCustomerDisplay = (ob) => {
    if (ob.supermarket) return ob.supermarket.name || ob.supermarket.id;
    if (ob.farmer)      return ob.farmer.name      || ob.farmer.id;
    if (ob.guestname)   return ob.guestname + " (Non-Reg)";
    return "-";
};

const getValidUntilDisplay = (ob) => {
    if (!ob.validuntill) return "-";
    return ob.validuntill.slice(0, 10);
};

const getFormattedAmount = (ob) => {
    return "Rs. " + parseFloat(ob.totalamount || 0).toFixed(2);
};

const getStatusBadge = (ob) => {
    const s = ob.quotationstatus || "";
    if (s === "Pending")   return '<p class="p-1 bg-warning">Pending</p>';
    if (s === "Approved")  return '<p class="p-1 bg-success ">Approved</p>';
    if (s === "Rejected")  return '<p class="p-1 bg-danger">Rejected</p>';
    if (s === "Converted") return '<p class="p-1 bg-info">Converted</p>';
    return s || "-";
};

const getUserDisplay = (ob) => {
    if (!ob.user) return "-";
    return ob.user.username || ob.user.id || "-";
};


// ============================================================
// DATA — REFERENCE LISTS
// ============================================================

let supermarkets      = [];
let farmers           = [];
let crops             = [];
let composts          = [];
let quotationStatuses = [];

const loadSupermarkets = () => {
    supermarkets = getServiceRequest("/supermarket/alldata");
};
const generateSupermarket = () => {
    fillDataIntoSelect(selectSupermarket, "Please select supermarket..", supermarkets, "name");
};

const loadFarmers = () => {
    farmers = getServiceRequest("/farmer/alldata");
};
const generateFarmer = () => {
    fillDataIntoSelect(selectFarmer, "Please select farmer..", farmers, "name");
};

const loadCrops = () => {
    crops = getServiceRequest("/croplistmanagement/alldata");
};
const generateCrops = () => {
    fillDataIntoSelect(inputSmCrop, "Select Crop", crops, "name");
};

const loadComposts = () => {
    composts = getServiceRequest("/compost/alldata");
};
const generateComposts = () => {
    fillDataIntoSelect(inputFarmerCompost, "Select Compost", composts, "name");
};

const loadQuotationStatuses = () => {
    quotationStatuses = [
        { name: "Pending"   },
        { name: "Approved"  },
        { name: "Rejected"  },
        { name: "Converted" },
    ];
};
const generateQuotationStatus = () => {
    fillDataIntoSelect(
        selectQuotationStatus,
        "Please select status..",
        quotationStatuses,
        "name"
    );
};


// ============================================================
// CUSTOMER TYPE TOGGLE
// ============================================================

const handleCustomerTypeChange = () => {
    const val = document.querySelector('input[name="customerType"]:checked')?.value;

    // Hide all conditional rows & sections
    rowSupermarket.classList.add("d-none");
    rowFarmer.classList.add("d-none");
    rowNonReg.classList.add("d-none");
    sectionSupermarketItems.classList.add("d-none");
    sectionFarmerItems.classList.add("d-none");

    // Clear customer-specific fields & state
    selectSupermarket.value  = "";
    selectFarmer.value       = "";
    textGuestName.value      = "";
    textGuestNumber.value    = "";
    textGuestAddress.value   = "";
    quotation.supermarket    = null;
    quotation.farmer         = null;
    quotation.guestname      = null;
    quotation.guestnumber    = null;
    quotation.guestdeliveryaddress = null;

    if (val === "supermarket") {
        quotation.customertypes = "Supermarket";
        rowSupermarket.classList.remove("d-none");
        sectionSupermarketItems.classList.remove("d-none");
        generateSupermarket();
        generateCrops();
        smItems = [];
        renderSmItemsTable();
    } else if (val === "farmer") {
        quotation.customertypes = "Farmer";
        rowFarmer.classList.remove("d-none");
        sectionFarmerItems.classList.remove("d-none");
        generateFarmer();
        generateComposts();
        farmerItems = [];
        renderFarmerItemsTable();
    } else if (val === "nonreg") {
        quotation.customertypes = "Farmer";   // entity has no NonReg — maps to Farmer
        rowNonReg.classList.remove("d-none");
        sectionFarmerItems.classList.remove("d-none");
        generateComposts();
        farmerItems = [];
        renderFarmerItemsTable();
    }

    setValid(radioSupermarket);
};


// ============================================================
// VALIDATION — FIELDS
// ============================================================

const validateSupermarket = () => {
    const value = selectSupermarket.value;

    if (!value) {
        quotation.supermarket = null;
        setInvalid(selectSupermarket);
        return;
    }

    quotation.supermarket = JSON.parse(value);

    if (formMode === "EDIT" &&
        JSON.stringify(quotation.supermarket) !== JSON.stringify(oldQuotation.supermarket)) {
        setUpdated(selectSupermarket);
    } else {
        setValid(selectSupermarket);
    }
};

const validateFarmer = () => {
    const value = selectFarmer.value;

    if (!value) {
        quotation.farmer = null;
        setInvalid(selectFarmer);
        return;
    }

    quotation.farmer = JSON.parse(value);

    if (formMode === "EDIT" &&
        JSON.stringify(quotation.farmer) !== JSON.stringify(oldQuotation.farmer)) {
        setUpdated(selectFarmer);
    } else {
        setValid(selectFarmer);
    }
};

const validateGuestName = () => {
    const value   = textGuestName.value.trim();
    const pattern = /^.{2,100}$/;

    if (value === "") {
        quotation.guestname = null;
        setInvalid(textGuestName);
        return;
    }

    if (pattern.test(value)) {
        quotation.guestname = value;

        if (formMode === "EDIT" && value !== oldQuotation.guestname) {
            setUpdated(textGuestName);
        } else {
            setValid(textGuestName);
        }
    } else {
        quotation.guestname = null;
        setInvalid(textGuestName);
    }
};

const validateGuestNumber = () => {
    const value   = textGuestNumber.value.trim();
    const pattern = /^[0-9+\-\s]{7,15}$/;

    if (value === "") {
        quotation.guestnumber = null;
        setInvalid(textGuestNumber);
        return;
    }

    if (pattern.test(value)) {
        quotation.guestnumber = value;

        if (formMode === "EDIT" && value !== oldQuotation.guestnumber) {
            setUpdated(textGuestNumber);
        } else {
            setValid(textGuestNumber);
        }
    } else {
        quotation.guestnumber = null;
        setInvalid(textGuestNumber);
    }
};

const validateGuestAddress = () => {
    const value   = textGuestAddress.value.trim();
    const pattern = /^.{5,}$/;

    if (value === "") {
        quotation.guestdeliveryaddress = null;
        setInvalid(textGuestAddress);
        return;
    }

    if (pattern.test(value)) {
        quotation.guestdeliveryaddress = value;

        if (formMode === "EDIT" && value !== oldQuotation.guestdeliveryaddress) {
            setUpdated(textGuestAddress);
        } else {
            setValid(textGuestAddress);
        }
    } else {
        quotation.guestdeliveryaddress = null;
        setInvalid(textGuestAddress);
    }
};

const validateQuotationStatus = () => {
    const value = selectQuotationStatus.value;

    if (!value) {
        quotation.quotationstatus = null;
        setInvalid(selectQuotationStatus);
        return;
    }

    const parsed = JSON.parse(value);
    quotation.quotationstatus = parsed.name;

    if (formMode === "EDIT" && quotation.quotationstatus !== oldQuotation.quotationstatus) {
        setUpdated(selectQuotationStatus);
    } else {
        setValid(selectQuotationStatus);
    }
};

const validateValidUntil = () => {
    const value = dateValid.value;

    // Optional field — clear styles if empty
    if (value === "") {
        quotation.validuntill = null;
        dateValid.classList.remove("is-valid", "is-invalid", "is-blue");
        return;
    }

    quotation.validuntill = value;

    if (formMode === "EDIT" && value !== oldQuotation.validuntill) {
        setUpdated(dateValid);
    } else {
        setValid(dateValid);
    }
};

const validateNote = () => {
    const value = textNote.value.trim();

    // Optional field — clear styles if empty
    if (value === "") {
        quotation.notes = null;
        textNote.classList.remove("is-valid", "is-invalid", "is-blue");
        return;
    }

    quotation.notes = value;

    if (formMode === "EDIT" && value !== oldQuotation.notes) {
        setUpdated(textNote);
    } else {
        setValid(textNote);
    }
};


// ============================================================
// ITEM TABLES — SUPERMARKET (CROP-BASED)
// ============================================================

const handleAddSmItem = () => {
    const cropValue = inputSmCrop.value;
    const unitPrice = parseFloat(inputSmUnitPrice.value);
    const qty       = parseFloat(inputSmQty.value);

    if (!cropValue || isNaN(unitPrice) || unitPrice <= 0 || isNaN(qty) || qty <= 0) {
        Notiflix.Notify.warning("Please fill Crop, Unit Price, and Quantity correctly.");
        return;
    }

    const crop      = JSON.parse(cropValue);
    const lineTotal = parseFloat((unitPrice * qty).toFixed(2));

    smItems.push({
        crop:      crop,
        unitprice: unitPrice,
        qty:       qty,
        linetotal: lineTotal,
    });

    // Reset inputs
    inputSmCrop.value      = "";
    inputSmUnitPrice.value = "";
    inputSmQty.value       = "";

    renderSmItemsTable();
    recalculateTotal();
};

const renderSmItemsTable = () => {
    smItemsBody.innerHTML = "";
    let total = 0;

    smItems.forEach((item, index) => {
        total += item.linetotal;
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.crop.name || "-"}</td>
            <td>Rs. ${parseFloat(item.unitprice).toFixed(2)}</td>
            <td>${item.qty}</td>
            <td>Rs. ${parseFloat(item.linetotal).toFixed(2)}</td>
            <td>
                <button type="button" class="btn btn-sm btn-outline-danger"
                    onclick="removeSmItem(${index})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>`;
        smItemsBody.appendChild(tr);
    });

    smTotalAmount.textContent = "Rs. " + total.toFixed(2);
    recalculateTotal();
};

const removeSmItem = (index) => {
    smItems.splice(index, 1);
    renderSmItemsTable();
    recalculateTotal();
};


// ============================================================
// ITEM TABLES — FARMER / NON-REG (COMPOST-BASED)
// ============================================================

const handleAddFarmerItem = () => {
    const compostValue = inputFarmerCompost.value;
    const unitPrice    = parseFloat(inputFarmerUnitPrice.value);
    const qty          = parseFloat(inputFarmerQty.value);

    if (!compostValue || isNaN(unitPrice) || unitPrice <= 0 || isNaN(qty) || qty <= 0) {
        Notiflix.Notify.warning("Please fill Compost, Unit Price, and Quantity correctly.");
        return;
    }

    const compost   = JSON.parse(compostValue);
    const lineTotal = parseFloat((unitPrice * qty).toFixed(2));

    farmerItems.push({
        compost:   compost,
        unitprice: unitPrice,
        qty:       qty,
        linetotal: lineTotal,
    });

    // Reset inputs
    inputFarmerCompost.value   = "";
    inputFarmerUnitPrice.value = "";
    inputFarmerQty.value       = "";

    renderFarmerItemsTable();
    recalculateTotal();
};

const renderFarmerItemsTable = () => {
    farmerItemsBody.innerHTML = "";
    let total = 0;

    farmerItems.forEach((item, index) => {
        total += item.linetotal;
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.compost.name || "-"}</td>
            <td>Rs. ${parseFloat(item.unitprice).toFixed(2)}</td>
            <td>${item.qty}</td>
            <td>Rs. ${parseFloat(item.linetotal).toFixed(2)}</td>
            <td>
                <button type="button" class="btn btn-sm btn-outline-danger"
                    onclick="removeFarmerItem(${index})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>`;
        farmerItemsBody.appendChild(tr);
    });

    farmerTotalAmount.textContent = "Rs. " + total.toFixed(2);
    recalculateTotal();
};

const removeFarmerItem = (index) => {
    farmerItems.splice(index, 1);
    renderFarmerItemsTable();
    recalculateTotal();
};


// ============================================================
// TOTAL AMOUNT — AUTO CALCULATE
// ============================================================

const recalculateTotal = () => {
    const smTotal     = smItems.reduce((sum, i) => sum + i.linetotal, 0);
    const farmerTotal = farmerItems.reduce((sum, i) => sum + i.linetotal, 0);
    const total       = parseFloat((smTotal + farmerTotal).toFixed(2));

    quotation.totalamount  = total;
    textTotalAmount.value  = "Rs. " + total.toFixed(2);
};




// ============================================================
// REFILL FORM — EDIT MODE
// ============================================================

const refillQuotationForm = (dataOb) => {
    removeValidationStyles(quotationForm);

    let myModal = new bootstrap.Modal(quotationAddFormModalElement, {});
    formMode = "EDIT";

    quotation    = getServiceRequest("/quotation/quotationlist/byid/" + dataOb.id);
    oldQuotation = JSON.parse(JSON.stringify(quotation));

    // Meta
    if (quotation.requestdate) {
        let dateEdit = quotation.requestdate.slice(0, 10);
        let timeEdit = quotation.requestdate.slice(11, 19);
        quotationDateElement.textContent = dateEdit + " " + timeEdit;
    }

    updateDateElement.textContent = "-";
    quotationNoElement.textContent = quotation.quotationnumber || "-";

    // User field is DISPLAY ONLY here — shows whoever is currently
    // stamped on the record (last updater, or creator if never
    // updated). We do NOT touch quotation.user on open. It only gets
    // reassigned to the current session user inside handleUpdate(),
    // and only if the record is actually changed and saved — see
    // hasQuotationChanged(). Opening or cancelling never reassigns it.
    textUser.value    = quotation.user?.username || quotation.user?.id || "-";
    textUser.readOnly = true;

    // Customer type — restore radio + conditional row
    const ctype = (quotation.customertypes || "").toLowerCase();

    // Reset all conditional rows first
    rowSupermarket.classList.add("d-none");
    rowFarmer.classList.add("d-none");
    rowNonReg.classList.add("d-none");
    sectionSupermarketItems.classList.add("d-none");
    sectionFarmerItems.classList.add("d-none");

    if (ctype === "supermarket") {
        radioSupermarket.checked = true;
        rowSupermarket.classList.remove("d-none");
        sectionSupermarketItems.classList.remove("d-none");
        generateSupermarket();
        selectSupermarket.value = JSON.stringify(quotation.supermarket);
        generateCrops();
    } else if (ctype === "farmer" && !quotation.guestname) {
        radioFarmer.checked = true;
        rowFarmer.classList.remove("d-none");
        sectionFarmerItems.classList.remove("d-none");
        generateFarmer();
        selectFarmer.value = JSON.stringify(quotation.farmer);
        generateComposts();
    } else if (ctype === "farmer" && quotation.guestname) {
        radioNonReg.checked = true;
        rowNonReg.classList.remove("d-none");
        sectionFarmerItems.classList.remove("d-none");
        generateComposts();
        textGuestName.value    = quotation.guestname          || "";
        textGuestNumber.value  = quotation.guestnumber        || "";
        textGuestAddress.value = quotation.guestdeliveryaddress || "";
    }

    // Valid until
    dateValid.value = quotation.validuntill ? quotation.validuntill.slice(0, 10) : "";

    // Status
    generateQuotationStatus();
    selectQuotationStatus.value = JSON.stringify({ name: quotation.quotationstatus });

    // Note
    textNote.value = quotation.notes || "";

    // Total
    textTotalAmount.value = "Rs. " + parseFloat(quotation.totalamount || 0).toFixed(2);

    // Items — restore from backend if stored, otherwise empty
    smItems     = quotation.supermarketItems  || [];
    farmerItems = quotation.farmerItems       || [];
    renderSmItemsTable();
    renderFarmerItemsTable();

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

const hasQuotationChanged = () => {
    if (quotation.customertypes !== oldQuotation.customertypes) return true;
    if (JSON.stringify(quotation.supermarket) !== JSON.stringify(oldQuotation.supermarket)) return true;
    if (JSON.stringify(quotation.farmer) !== JSON.stringify(oldQuotation.farmer)) return true;
    if ((quotation.guestname || null) !== (oldQuotation.guestname || null)) return true;
    if ((quotation.guestnumber || null) !== (oldQuotation.guestnumber || null)) return true;
    if ((quotation.guestdeliveryaddress || null) !== (oldQuotation.guestdeliveryaddress || null)) return true;
    if ((quotation.validuntill || null) !== (oldQuotation.validuntill || null)) return true;
    if (quotation.quotationstatus !== oldQuotation.quotationstatus) return true;
    if ((quotation.notes || null) !== (oldQuotation.notes || null)) return true;
    if (JSON.stringify(smItems) !== JSON.stringify(oldQuotation.supermarketItems || [])) return true;
    if (JSON.stringify(farmerItems) !== JSON.stringify(oldQuotation.farmerItems || [])) return true;
    return false;
};


// ============================================================
// FORM ERROR CHECK
// ============================================================

const checkFormErrors = () => {
    let errors = [];
    const selectedType = document.querySelector('input[name="customerType"]:checked')?.value;

    if (!selectedType)                  errors.push("Customer Type is required. Please select one.");
    if (!quotation.quotationstatus)     errors.push("Quotation Status has an error. Please check again.");
    if (!quotation.user)                errors.push("User ID has an error. Please check again.");

    if (selectedType === "supermarket") {
        if (!quotation.supermarket)     errors.push("Supermarket has an error. Please check again.");
        if (smItems.length === 0)       errors.push("Please add at least one item to the supermarket items table.");
    }

    if (selectedType === "farmer") {
        if (!quotation.farmer)          errors.push("Farmer has an error. Please check again.");
        if (farmerItems.length === 0)   errors.push("Please add at least one item to the farmer items table.");
    }

    if (selectedType === "nonreg") {
        if (!quotation.guestname)             errors.push("Guest Name has an error. Please check again.");
        if (!quotation.guestnumber)           errors.push("Guest Number has an error. Please check again.");
        if (!quotation.guestdeliveryaddress)  errors.push("Delivery Address has an error. Please check again.");
        if (farmerItems.length === 0)         errors.push("Please add at least one item to the compost items table.");
    }

    return errors;
};


// ============================================================
// BUILD PAYLOAD
// ============================================================

const buildPayload = () => {
    const selectedType = document.querySelector('input[name="customerType"]:checked')?.value;

    const payload = { ...quotation };

    // Attach items as nested arrays
    if (selectedType === "supermarket") {
        payload.supermarketItems = smItems;
        payload.farmerItems      = null;
    } else {
        payload.farmerItems      = farmerItems;
        payload.supermarketItems = null;
    }

    return payload;
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

    const payload = buildPayload();
    console.log("Submitting quotation:", payload);

    let response = getHTTPServiceRequest("/quotation/quotationlist/save", "POST", payload);

    if (response === "OK") {
        Notiflix.Notify.success("Saved successfully");
        $("#QuotationAddForm").modal("hide");
        loadInitialData();
        refreshQuotationTable();
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
    if (hasQuotationChanged()) {
        loadLoggedInUserInto(quotation, textUser);
    }

    const payload = buildPayload();
    console.log("Updating quotation:", payload);

    let response = getHTTPServiceRequest("/quotation/quotationlist/update", "PUT", payload);

    if (response === "OK") {
        updateDateElement.textContent = new Date().toLocaleString();
        Notiflix.Notify.success("Updated successfully");
        $("#QuotationAddForm").modal("hide");
        loadInitialData();
        refreshQuotationTable();
        initializeForm();
    } else {
        Notiflix.Notify.warning("Update failed: " + response);
    }
};

const handleDelete = () => {
    Notiflix.Confirm.show(
        "Delete Quotation",
        "Are you sure you want to delete this quotation?",
        "Yes, Delete",
        "Cancel",
        () => {
            let response = getHTTPServiceRequest(
                "/quotation/quotationlist/" + quotation.id,
                "DELETE",
                null
            );

            if (response !== "AJAX error") {
                Notiflix.Notify.success("Deleted successfully");
                $("#QuotationAddForm").modal("hide");
                loadInitialData();
                refreshQuotationTable();
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

const viewQuotationRecord = (dataOb) => {
    document.querySelector("#tdQuotationNo").innerText      = dataOb.quotationnumber   || "-";
    document.querySelector("#tdCustomerType").innerText     = dataOb.customertypes     || "-";
    document.querySelector("#tdCustomer").innerText         = getCustomerDisplay(dataOb);
    document.querySelector("#tdGuestName").innerText        = dataOb.guestname          || "-";
    document.querySelector("#tdGuestNumber").innerText      = dataOb.guestnumber        || "-";
    document.querySelector("#tdGuestAddress").innerText     = dataOb.guestdeliveryaddress || "-";
    document.querySelector("#tdValidDate").innerText        = dataOb.validuntill
        ? dataOb.validuntill.slice(0, 10)
        : "-";
    document.querySelector("#tdTotalAmount").innerText      = "Rs. " + parseFloat(dataOb.totalamount || 0).toFixed(2);
    document.querySelector("#tdQuotationStatus").innerText  = dataOb.quotationstatus   || "-";
    document.querySelector("#tdNote").innerText             = dataOb.notes             || "-";
    document.querySelector("#tdUser").innerText             = dataOb.user
        ? (dataOb.user.username || dataOb.user.id)
        : "-";

    // Print items table
    const headRow  = document.querySelector("#printQuotationItemsHead");
    const itemBody = document.querySelector("#printQuotationItemsBody");
    itemBody.innerHTML = "";

    const selectedType = document.querySelector('input[name="customerType"]:checked')?.value;
    const activeItems  = selectedType === "supermarket" ? smItems : farmerItems;
    const itemLabel    = selectedType === "supermarket" ? "Crop" : "Compost";
    const itemKey      = selectedType === "supermarket" ? "crop" : "compost";

    headRow.innerHTML = `<th>#</th><th>${itemLabel}</th><th>Unit Price</th><th>Quantity</th><th>Line Total</th>`;

    activeItems.forEach((item, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${item[itemKey]?.name || "-"}</td>
            <td>Rs. ${parseFloat(item.unitprice).toFixed(2)}</td>
            <td>${item.qty}</td>
            <td>Rs. ${parseFloat(item.linetotal).toFixed(2)}</td>`;
        itemBody.appendChild(tr);
    });

    const editModalContent = quotationAddFormModalElement.querySelector(".modal-content");
    editModalContent.classList.add("blurred");

    const viewModal = new bootstrap.Modal(printViewQuotationModalElement);
    viewModal.show();

    printViewQuotationModalElement.addEventListener(
        "hidden.bs.modal",
        () => {
            editModalContent.classList.remove("blurred");
        },
        { once: true }
    );
};

const handlePrint = () => {
    viewQuotationRecord(quotation);
};

const printQuotationRecord = () => {
    let newWindow = window.open();
    newWindow.document.write(
        "<html><head>" +
        "<title>Quotation Details</title>" +
        '<link rel="stylesheet" href="/css/bootstrap-5.3.3/css/bootstrap.min.css">' +
        "</head><body>" +
        document.querySelector("#divCardPrintQuotation").outerHTML +
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
        refreshQuotationTable();}
    window.initPage();
window.printQuotationRecord = printQuotationRecord;
window.removeSmItem = removeSmItem;
window.removeFarmerItem = removeFarmerItem;




})();