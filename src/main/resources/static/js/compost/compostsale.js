// ============================================================
// DOM ELEMENT REFERENCES
// ============================================================
(function () {
    let saleAddFormModalElement
        ,   tableBody
        ,   printViewModalElement
        ,   saleForm
        ,  regDateElement
        ,  updateDateElement
        ,   regNoElement
        ,   selectFarmer
        , dateDeliveryDate
        ,   selectComSaleStatus
        ,  userIdElement
        ,   totalAmountElement
        ,selectCompostElement
        ,  textUnitPriceElement
        ,  textItemQtyElement
        ,  buttonAddItem
        ,  saleItemsBody
        ,  tdGrandTotal
        ,  submitElement
        ,  updateElement
        ,  clearElement
        ,  printElement
        ,  deleteElement
        ,  titleNewHide
        ,  titleEditHide
        ,  tdSaleNumber
        ,   tdFarmer
        ,  tdSaleDate
        ,  tdDeliveryDate
        ,  tdTotalAmount
        ,   tdComSaleStatus
        ,  printSaleItemsBody
        ,  divCardPrintSale;
    const queryElements = () => {
        saleAddFormModalElement = document.querySelector("#SaleAddForm");

// Table body
        tableBody = document.querySelector("#tableBodyId");

// Print view modal
        printViewModalElement = document.querySelector("#SaleViewModal");

// Form
        saleForm = document.querySelector("#formSale");

// Header info display
        regDateElement = document.querySelector("#regDate");
        updateDateElement = document.querySelector("#updateDate");
        regNoElement = document.querySelector("#InputRegNo");

// Header form fields
        selectFarmer = document.querySelector("#selectFarmer");
        dateDeliveryDate = document.querySelector("#dateDeliveryDate");
        selectComSaleStatus = document.querySelector("#selectComSaleStatus");
        userIdElement = document.querySelector("#userId");
        totalAmountElement = document.querySelector("#textTotalAmount");

// Item row fields
        selectCompostElement = document.querySelector("#selectCompost");
        textUnitPriceElement = document.querySelector("#textUnitPrice");
        textItemQtyElement = document.querySelector("#textItemQty");
        buttonAddItem = document.querySelector("#buttonAddItem");

// Items sub-table
        saleItemsBody = document.querySelector("#saleItemsBody");
        tdGrandTotal = document.querySelector("#tdGrandTotal");

// Buttons
        submitElement = document.querySelector("#buttonSubmit");
        updateElement = document.querySelector("#buttonUpdate");
        clearElement = document.querySelector("#buttonClear");
        printElement = document.querySelector("#buttonPrint");
        deleteElement = document.querySelector("#buttonDelete");

// Title toggles
        titleNewHide = document.querySelector("#formTitleNew");
        titleEditHide = document.querySelector("#formTitleEdit");

// Print view cells
        tdSaleNumber = document.querySelector("#tdSaleNumber");
        tdFarmer = document.querySelector("#tdFarmer");
        tdSaleDate = document.querySelector("#tdSaleDate");
        tdDeliveryDate = document.querySelector("#tdDeliveryDate");
        tdTotalAmount = document.querySelector("#tdTotalAmount");
        tdComSaleStatus = document.querySelector("#tdComSaleStatus");
        printSaleItemsBody = document.querySelector("#printSaleItemsBody");
        divCardPrintSale = document.querySelector("#divCardPrintSale");
    }

// ============================================================
// STATE
// ============================================================

    let saleList = [];

    let compostSale    = {};
    let oldCompostSale = {};
    let formMode       = "ADD";

    // Item shape: { compost, compostprice, unitprice, quantity, linetotalprice }
    // compost / compostprice / unitprice are all derived directly from the
    // selected CompostPrice record (see handleCompostSelected / handleAddItem below).
    let currentItems = [];

// Reference data
    let farmers          = [];
    let comSaleStatuses  = [];

    // Compost dropdown IS the active CompostPrice list — one selection gives both
    // the compost identity and its current sale price together, so there
    // is no separate compost list to fetch or match against.
    let compostPriceList = [];

// Currently selected CompostPrice record (the compost dropdown's parsed value
// itself) — consumed on Add Item.
    let selectedCompostPrice = null;




// ============================================================
// EVENT LISTENERS
// ============================================================

    const initializeEventListeners = () => {
        // Header field validation
        selectFarmer.addEventListener("change",         validateFarmer);
        dateDeliveryDate.addEventListener("change",      validateDeliveryDate);
        selectComSaleStatus.addEventListener("change",   validateComSaleStatus);
        // userIdElement is read-only and fully managed by loadLoggedInUserInto()
        // (on open/ADD) and by hasSaleChanged() (on update) — no manual
        // input validation needed here anymore.

        // Item row
        // Unit Price is auto-filled from the selected CompostPrice's saleprice and is
        // read-only, so it has no input listener of its own — it is refreshed
        // whenever the compost selection changes.
        selectCompostElement.addEventListener("change", handleCompostSelected);
        textItemQtyElement.addEventListener("input",    validateItemQty);
        buttonAddItem.addEventListener("click",         handleAddItem);


        document.querySelector("#addNewSaleId").addEventListener("click", () => {
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
        loadFarmers();
        loadComSaleStatuses();
        loadActiveCompostPrices();
        saleList = getServiceRequest("/compost/compostsale/alldata/selected");
    };

    const loadFarmers = () => {
        farmers = getServiceRequest("/farmer/farmerlist/compost/active");
    };

    const loadComSaleStatuses = () => {
        // Mirrors lk.jac.common.SaleStatus
        comSaleStatuses = [
            { name: "Pending"            },
            { name: "AwaitingPayment"    },
            { name: "PaymentSubmitted"   },
            { name: "PaymentVerified"    },
            { name: "Confirmed"          },
            { name: "Delivered"          },
            { name: "Cancelled"          },
            { name: "CancelledNoPayment" },
        ];
    };

    // Single source of truth for the Compost dropdown. Filtered to Active
    // client-side — swap for a dedicated /compost/compostprice/active
    // endpoint (mirroring CropPriceController's /crop/cropprice/active) if
    // one becomes available, so no client-side status filtering is needed.
    const loadActiveCompostPrices = () => {
        const allPrices = getServiceRequest("/compost/compostprice/alldata/selected");
        compostPriceList = (allPrices || []).filter((p) => p.statuspending === "Active");
    };


// ============================================================
// INITIALIZE FORM  (reset to ADD mode)
// ============================================================

    const initializeForm = () => {
        compostSale  = {};
        oldCompostSale = {};
        formMode     = "ADD";
        currentItems = [];
        selectedCompostPrice = null;

        saleForm.reset();
        removeValidationStyles(saleForm);

        regNoElement.textContent    = "-";
        updateDateElement.textContent = "-";

        let dateTime = getTodayDateTime();
        let date = dateTime.slice(0, 10);
        let time = dateTime.slice(11, 19);
        regDateElement.textContent = date + " " + time;

        generateFarmerSelect();
        generateComSaleStatusSelect();
        generateCompostSelect();

        totalAmountElement.value    = "";
        tdGrandTotal.textContent    = "0.00";
        saleItemsBody.innerHTML     = "";
        textUnitPriceElement.value  = "";

        // Auto fill currently logged-in user as the record's user (creation case)
        loadLoggedInUserInto(compostSale, userIdElement);
        userIdElement.readOnly = true;

        // Default status to Pending
        const defaultStatus = comSaleStatuses.find(s => s.name === "Pending");
        if (defaultStatus) {
            compostSale.comsalestatus = defaultStatus.name;
            selectComSaleStatus.value = JSON.stringify(defaultStatus);
        }

        submitElement.classList.remove("d-none");
        updateElement.classList.add("d-none");
        deleteElement.classList.add("d-none");
        printElement.classList.add("d-none");
        titleEditHide.classList.add("d-none");
        titleNewHide.classList.remove("d-none");
    };


// ============================================================
// DROPDOWN GENERATORS
// ============================================================

    const generateFarmerSelect = () => {
        selectFarmer.innerHTML = '<option value="" selected disabled>Select Farmer..</option>';

        (farmers || []).forEach((f) => {
            const option = document.createElement("option");
            option.value     = f.id;
            option.innerText = f.fullname || f.callingname || "Farmer";
            selectFarmer.appendChild(option);
        });
    };

    const generateComSaleStatusSelect = () => {
        fillDataIntoSelect(
            selectComSaleStatus,
            "Select COM Sale Status..",
            comSaleStatuses,
            "name"
        );
    };

    // Each option's value IS the full CompostPrice record (compost + saleprice +
    // priceid etc.) — selecting a compost and knowing its price happen in the
    // same action, same as cropprice in supermarketorder.js.
    const generateCompostSelect = () => {
        selectCompostElement.innerHTML = '<option value="" selected disabled>Select Compost</option>';

        (compostPriceList || []).forEach((cp) => {
            const option = document.createElement("option");
            option.value     = JSON.stringify(cp);
            option.innerText = cp.compost?.name || "Compost";
            selectCompostElement.appendChild(option);
        });
    };


// ============================================================
// VALIDATION — HEADER FIELDS
// ============================================================

    const validateFarmer = () => {
        const value = selectFarmer.value;

        if (!value) {
            compostSale.farmer = null;
            setInvalid(selectFarmer);
            return;
        }

        compostSale.farmer = farmers.find(f => String(f.id) === value);

        if (formMode === "EDIT" &&
            JSON.stringify(compostSale.farmer) !== JSON.stringify(oldCompostSale.farmer)) {
            setUpdated(selectFarmer);
        } else {
            setValid(selectFarmer);
        }
    };

    const validateDeliveryDate = () => {
        const value = dateDeliveryDate.value;

        if (!value) {
            compostSale.deliverydate = null;
            setValid(dateDeliveryDate);
            return;
        }

        compostSale.deliverydate = value;

        if (formMode === "EDIT" && value !== oldCompostSale.deliverydate) {
            setUpdated(dateDeliveryDate);
        } else {
            setValid(dateDeliveryDate);
        }
    };

    const validateComSaleStatus = () => {
        const value = selectComSaleStatus.value;

        if (!value) {
            compostSale.comsalestatus = null;
            setInvalid(selectComSaleStatus);
            return;
        }

        const parsed = JSON.parse(value);
        compostSale.comsalestatus = parsed.name;

        if (formMode === "EDIT" &&
            JSON.stringify(compostSale.comsalestatus) !== JSON.stringify(oldCompostSale.comsalestatus)) {
            setUpdated(selectComSaleStatus);
        } else {
            setValid(selectComSaleStatus);
        }
    };


// ============================================================
// VALIDATION — ITEM ROW FIELDS
// ============================================================

    // The selected option's value already IS the CompostPrice record — no
    // second lookup against a separate price list is needed. Auto-fills
    // the read-only Unit Price field from saleprice, per CompostPriceController.
    const handleCompostSelected = () => {
        const value = selectCompostElement.value;

        if (!value) {
            setInvalid(selectCompostElement);
            selectedCompostPrice = null;
            textUnitPriceElement.value = "";
            return;
        }

        selectedCompostPrice = JSON.parse(value);

        if (selectedCompostPrice.saleprice == null) {
            Notiflix.Notify.warning("No sale price set for this compost.");
            textUnitPriceElement.value = "";
            setInvalid(selectCompostElement);
            return;
        }

        textUnitPriceElement.value = Number(selectedCompostPrice.saleprice).toFixed(2);
        setValid(selectCompostElement);
    };

    const validateItemQty = () => {
        const value = parseFloat(textItemQtyElement.value);
        if (isNaN(value) || value <= 0) { setInvalid(textItemQtyElement); return; }
        setValid(textItemQtyElement);
    };


// ============================================================
// ITEM ADD / REMOVE
// ============================================================

    const handleAddItem = () => {
        const compostValue = selectCompostElement.value;
        const qty           = parseFloat(textItemQtyElement.value);

        let hasError = false;

        if (!compostValue || !selectedCompostPrice) { setInvalid(selectCompostElement); hasError = true; }
        if (isNaN(qty) || qty <= 0)                 { setInvalid(textItemQtyElement);   hasError = true; }

        if (hasError) {
            Notiflix.Notify.warning("Please fill all required item fields correctly.");
            return;
        }

        const unitPrice = selectedCompostPrice.saleprice;
        const lineTotal = unitPrice * qty;

        // Field names MUST match CompostSaleItem exactly:
        // compost, compostprice, unitprice, quantity, linetotalprice.
        currentItems.push({
            compost:        selectedCompostPrice.compost,
            compostprice:   selectedCompostPrice,
            unitprice:      unitPrice,
            quantity:       qty,
            linetotalprice: lineTotal,
        });

        renderItemsTable();

        // Clear item row inputs
        selectCompostElement.value   = "";
        textUnitPriceElement.value   = "";
        textItemQtyElement.value     = "";
        selectedCompostPrice = null;

        [selectCompostElement, textUnitPriceElement, textItemQtyElement].forEach((el) => {
            el.classList.remove("is-valid", "is-invalid", "is-blue");
        });
    };

    const removeItem = (index) => {
        currentItems.splice(index, 1);
        renderItemsTable();
    };


// ============================================================
// RENDER ITEMS TABLE
// ============================================================

    const renderItemsTable = () => {
        saleItemsBody.innerHTML = "";
        let grandTotal = 0;

        if (currentItems.length === 0) {
            saleItemsBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">No items added yet.</td>
            </tr>`;
            tdGrandTotal.textContent   = "0.00";
            totalAmountElement.value   = "";
            compostSale.totalamount    = 0;
            return;
        }

        currentItems.forEach((item, index) => {
            grandTotal += item.linetotalprice;

            const row = document.createElement("tr");
            row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.compost?.name || "-"}</td>
            <td>${item.unitprice.toFixed(2)}</td>
            <td>${item.quantity.toFixed(2)}</td>
            <td>${item.linetotalprice.toFixed(2)}</td>
            <td>
                <button type="button" class="btn btn-sm btn-outline-danger"
                        onclick="removeItem(${index})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>`;
            saleItemsBody.appendChild(row);
        });

        tdGrandTotal.textContent  = grandTotal.toFixed(2);
        totalAmountElement.value  = grandTotal.toFixed(2);
        compostSale.totalamount   = grandTotal;
    };


// ============================================================
// REFRESH MAIN TABLE
// ============================================================

    const refreshSaleTable = () => {
        if ($.fn.DataTable.isDataTable("#tableSale")) {
            $("#tableSale").DataTable().destroy();
        }
        const sortedSaleList = sortSaleListPendingFirst(saleList);
        tableBody.innerHTML = "";

        let displayProperty = [
            { propertyName: "compostsalenumber",     dataType: "string"   },
            { propertyName: getFarmerDisplay,        dataType: "function" },
            { propertyName: getSaleDateDisplay,      dataType: "function" },
            { propertyName: "deliverydate",          dataType: "string"   },
            { propertyName: "totalamount",           dataType: "string"   },
            { propertyName: getComSaleStatusDisplay, dataType: "function" },
        ];

        fillDataIntoTableThree(
            tableBody,
            saleList,
            displayProperty,
            refillSaleForm
        );

        $("#tableSale").DataTable();
    };

// Table display helpers
    const getFarmerDisplay = (ob) =>
        ob.farmer?.fullname || ob.farmer?.callingname || "-";
    const getSaleDateDisplay   = (ob) =>
        ob.addeddatetime ? ob.addeddatetime.slice(0, 10) : "-";
    const getComSaleStatusDisplay = (ob) => {
        switch (ob.comsalestatus) {
            case "Pending":            return '<p class="p-1 bg-warning">Pending</p>';
            case "AwaitingPayment":    return '<p class="p-1 bg-secondary text-white">Awaiting Payment</p>';
            case "PaymentSubmitted":   return '<p class="p-1 bg-primary text-white">Payment Submitted</p>';
            case "PaymentVerified":    return '<p class="p-1 bg-success text-white">Payment Verified</p>';
            case "Confirmed":          return '<p class="p-1 bg-info">Confirmed</p>';
            case "Delivered":          return '<p class="p-1 bg-success text-white">Delivered</p>';
            case "Cancelled":          return '<p class="p-1 bg-danger text-white">Cancelled</p>';
            case "CancelledNoPayment": return '<p class="p-1 bg-danger text-white">Cancelled (No Payment)</p>';
            default:                  return ob.comsalestatus || "-";
        }
    };



    // ============================================================
// SORT — Pending status always on top
// ============================================================

    const sortSaleListPendingFirst = (list) => {
        return [...list].sort((a, b) => {
            const aPending = a.comsalestatus === "Pending" ? 0 : 1;
            const bPending = b.comsalestatus === "Pending" ? 0 : 1;
            return aPending - bPending; // Pending (0) comes before everything else (1)
        });
    };
// ============================================================
// REFILL FORM — EDIT MODE
// ============================================================

    const refillSaleForm = (dataOb) => {
        removeValidationStyles(saleForm);

        let myModal = new bootstrap.Modal(saleAddFormModalElement, {});
        formMode = "EDIT";

        compostSale    = getServiceRequest("/compost/compostsale/byid/" + dataOb.id);
        oldCompostSale = JSON.parse(JSON.stringify(compostSale));
        selectedCompostPrice = null;

        // Meta dates
        if (compostSale.addeddatetime) {
            let dt = compostSale.addeddatetime;
            regDateElement.textContent = dt.slice(0, 10) + " " + dt.slice(11, 19);
        } else {
            regDateElement.textContent = "-";
        }

        if (compostSale.updateddatetime) {
            let dt = compostSale.updateddatetime;
            updateDateElement.textContent = dt.slice(0, 10) + " " + dt.slice(11, 19);
        } else {
            updateDateElement.textContent = "-";
        }

        regNoElement.textContent = compostSale.compostsalenumber || "-";


        // Farmer
        generateFarmerSelect();
        if (compostSale.farmer) {
            selectFarmer.value = compostSale.farmer.id;
        }

        // Delivery date
        dateDeliveryDate.value = compostSale.deliverydate
            ? compostSale.deliverydate.slice(0, 16)
            : "";

        // COM Sale status
        generateComSaleStatusSelect();
        selectComSaleStatus.value = JSON.stringify({ name: compostSale.comsalestatus });

        // Total amount (read-only, calculated)
        totalAmountElement.value = compostSale.totalamount
            ? compostSale.totalamount.toFixed(2)
            : "0.00";

        // User field is DISPLAY ONLY here — shows whoever is currently
        // stamped on the record (last updater, or creator if never
        // updated). We do NOT touch compostSale.user on open. It only gets
        // reassigned to the current session user inside handleUpdate(),
        // and only if the record is actually changed and saved — see
        // hasSaleChanged(). Opening or cancelling never reassigns it.
        userIdElement.value    = compostSale.user?.username || compostSale.user?.id || "-";
        userIdElement.readOnly = true;

        // Items — already carry their own unitprice/compostprice snapshot
        // from when they were added, so they are loaded as-is.
        currentItems = compostSale.compostSaleItems
            ? JSON.parse(JSON.stringify(compostSale.compostSaleItems))
            : [];
        generateCompostSelect();
        textUnitPriceElement.value = "";
        renderItemsTable();

        // Button visibility
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

    const hasSaleChanged = () => {
        if (JSON.stringify(compostSale.farmer) !== JSON.stringify(oldCompostSale.farmer)) return true;
        if (compostSale.deliverydate !== oldCompostSale.deliverydate) return true;
        if (compostSale.comsalestatus !== oldCompostSale.comsalestatus) return true;
        if (JSON.stringify(currentItems) !==
            JSON.stringify(oldCompostSale.compostSaleItems || [])) return true;
        return false;
    };


// ============================================================
// FORM ERROR CHECK
// ============================================================

    const checkFormErrors = () => {
        let errors = [];

        if (!compostSale.farmer)
            errors.push("Farmer has an error. Please check again.");
        if (!compostSale.comsalestatus)
            errors.push("COM Sale Status has an error. Please check again.");
        if (!compostSale.user)
            errors.push("User ID has an error. Please check again.");
        if (currentItems.length === 0)
            errors.push("At least one Sale Item is required.");

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

        compostSale.compostSaleItems = currentItems;

        console.log("Submitting Compost Sale:", compostSale);

        let response = getHTTPServiceRequest("/compost/compostsale/save", "POST", compostSale);

        if (response === "OK") {
            Notiflix.Notify.success("Saved successfully");
            $("#SaleAddForm").modal("hide");
            loadInitialData();
            refreshSaleTable();
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
        if (hasSaleChanged()) {
            loadLoggedInUserInto(compostSale, userIdElement);
        }

        compostSale.compostSaleItems = currentItems;

        console.log("Updating Compost Sale:", compostSale);

        let response = getHTTPServiceRequest("/compost/compostsale/update", "PUT", compostSale);

        if (response === "OK") {
            updateDateElement.textContent = new Date().toLocaleString();
            Notiflix.Notify.success("Updated successfully");
            $("#SaleAddForm").modal("hide");
            loadInitialData();
            refreshSaleTable();
            initializeForm();
        } else {
            Notiflix.Notify.warning("Update failed: " + response);
        }
    };

    const handleDelete = () => {
        Notiflix.Confirm.show(
            "Delete Sale",
            "Are you sure you want to delete this sale?",
            "Yes, Delete",
            "Cancel",
            () => {
                let response = getHTTPServiceRequest(
                    "/compost/compostsale/" + compostSale.id,
                    "DELETE",
                    null
                );

                if (response !== "AJAX error") {
                    Notiflix.Notify.success("Deleted successfully");
                    $("#SaleAddForm").modal("hide");
                    loadInitialData();
                    refreshSaleTable();
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

    const viewSaleRecord = (dataOb) => {
        tdSaleNumber.innerText   = dataOb.compostsalenumber || "-";
        tdFarmer.innerText       = dataOb.farmer?.fullname || dataOb.farmer?.callingname || "-";
        tdSaleDate.innerText     = dataOb.addeddatetime
            ? dataOb.addeddatetime.slice(0, 10)
            : "-";
        tdDeliveryDate.innerText = dataOb.deliverydate
            ? dataOb.deliverydate.slice(0, 16).replace("T", " ")
            : "-";
        tdTotalAmount.innerText  = dataOb.totalamount
            ? dataOb.totalamount.toFixed(2)
            : "0.00";
        tdComSaleStatus.innerText = dataOb.comsalestatus || "-";

        // Items
        printSaleItemsBody.innerHTML = "";
        const items = dataOb.compostSaleItems || currentItems || [];

        if (items.length === 0) {
            printSaleItemsBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted">No items.</td>
            </tr>`;
        } else {
            items.forEach((item, index) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.compost?.name || "-"}</td>
                <td>${item.unitprice.toFixed(2)}</td>
                <td>${item.quantity.toFixed(2)}</td>
                <td>${item.linetotalprice.toFixed(2)}</td>`;
                printSaleItemsBody.appendChild(row);
            });
        }

        // Blur edit modal while print view is open
        const editModalContent = saleAddFormModalElement.querySelector(".modal-content");
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
        viewSaleRecord(compostSale);
    };

    const printSaleRecord = () => {
        let newWindow = window.open();
        newWindow.document.write(
            "<html><head>" +
            "<title>Compost Sale Details</title>" +
            '<link rel="stylesheet" href="/css/bootstrap-5.3.3/css/bootstrap.min.css">' +
            "</head><body>" +
            divCardPrintSale.outerHTML +
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
        refreshSaleTable();}
    window.initPage();

    window.printSaleRecord = printSaleRecord;
    window.removeItem = removeItem;
})();