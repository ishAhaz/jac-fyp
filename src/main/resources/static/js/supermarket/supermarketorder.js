// ============================================================
// DOM ELEMENT REFERENCES
// ============================================================
(function () {
    let orderAddFormModalElement
        ,   tableBody
        ,   printViewModalElement
        ,   orderForm
        ,  regDateElement
        ,  updateDateElement
        ,   regNoElement
        ,   selectSupermarket
        , dateDeliveryDate
        ,   selectOrderStatus
        ,  userIdElement
        ,   totalAmountElement
        ,selectCropElement
        ,  textUnitPriceElement
        ,  textItemQtyElement
        ,  buttonAddItem
        ,  orderItemsBody
        ,  tdGrandTotal
        ,  submitElement
        ,  updateElement
        ,  clearElement
        ,  printElement
        ,  deleteElement
        ,  titleNewHide
        ,  titleEditHide
        ,  tdOrderNumber
        ,   tdSupermarket
        ,  tdOrderDate
        ,  tdDeliveryDate
        ,  tdTotalAmount
        ,   tdOrderStatus
        ,  printOrderItemsBody
        ,  divCardPrintOrder;
    const queryElements = () => {
        orderAddFormModalElement = document.querySelector("#OrderAddForm");

// Table body
        tableBody = document.querySelector("#tableBodyId");

// Print view modal
        printViewModalElement = document.querySelector("#OrderViewModal");

// Form
        orderForm = document.querySelector("#formOrder");

// Header info display
        regDateElement = document.querySelector("#regDate");
        updateDateElement = document.querySelector("#updateDate");
        regNoElement = document.querySelector("#InputRegNo");

// Header form fields

        selectSupermarket = document.querySelector("#selectSupermarket");
        dateDeliveryDate = document.querySelector("#dateDeliveryDate");
        selectOrderStatus = document.querySelector("#selectOrderStatus");
        userIdElement = document.querySelector("#userId");
        totalAmountElement = document.querySelector("#textTotalAmount");

// Item row fields
        selectCropElement = document.querySelector("#selectCrop");
        textUnitPriceElement = document.querySelector("#textUnitPrice");
        textItemQtyElement = document.querySelector("#textItemQty");
        buttonAddItem = document.querySelector("#buttonAddItem");

// Items sub-table
        orderItemsBody = document.querySelector("#orderItemsBody");
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
        tdOrderNumber = document.querySelector("#tdOrderNumber");
        tdSupermarket = document.querySelector("#tdSupermarket");
        tdOrderDate = document.querySelector("#tdOrderDate");
        tdDeliveryDate = document.querySelector("#tdDeliveryDate");
        tdTotalAmount = document.querySelector("#tdTotalAmount");
        tdOrderStatus = document.querySelector("#tdOrderStatus");
        printOrderItemsBody = document.querySelector("#printOrderItemsBody");
        divCardPrintOrder = document.querySelector("#divCardPrintOrder");
    }

// ============================================================
// STATE
// ============================================================

    let orderList = [];

    let order    = {};
    let oldOrder = {};
    let formMode = "ADD";

    // Item shape: { croplistmanagement, cropprice, unitprice, quantity, linetotalprice }
    // croplistmanagement / cropprice / unitprice are all derived directly from the
    // selected CropPrice record (see handleCropSelected / handleAddItem below).
    let currentItems = [];

// Reference data
    let supermarkets   = [];
    let orderStatuses  = [];

    // Crop dropdown IS the active CropPrice list — one call gives both
    // the crop identity and its current real price together, so there
    // is no separate crop list to fetch or match against.
    let cropPriceList = [];

// Currently selected CropPrice record (the crop dropdown's parsed value
// itself) — consumed on Add Item.
    let selectedCropPrice = null;




// ============================================================
// EVENT LISTENERS
// ============================================================

    const initializeEventListeners = () => {
        // Header field validation
        selectSupermarket.addEventListener("change", validateSupermarket);
        dateDeliveryDate.addEventListener("change",  validateDeliveryDate);
        selectOrderStatus.addEventListener("change", validateOrderStatus);
        // userIdElement is read-only and fully managed by loadLoggedInUserInto()
        // (on open/ADD) and by hasOrderChanged() (on update) — no manual
        // input validation needed here anymore.

        // Item row
        // Unit Price is auto-filled from the selected CropPrice's realprice and is
        // read-only, so it has no input listener of its own — it is refreshed
        // whenever the crop selection changes.
        selectCropElement.addEventListener("change",   handleCropSelected);
        textItemQtyElement.addEventListener("input",   validateItemQty);
        buttonAddItem.addEventListener("click",        handleAddItem);


        document.querySelector("#addNewOrderId").addEventListener("click", () => {
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
        loadSupermarkets();
        loadOrderStatuses();
        loadActiveCropPrices();
        orderList = getServiceRequest("/supermarket/supermarketorder/alldata/selected");
    };

    const loadSupermarkets = () => {
        supermarkets = getServiceRequest("/supermarket/supermarketlist/alldata/selected");
    };

    const loadOrderStatuses = () => {
        // Mirrors lk.jac.common.SaleStatus
        orderStatuses = [
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

    // Single source of truth for the Crop dropdown — CropPriceController's
    // /crop/cropprice/active already filters to StatusPending.Active, so no
    // client-side status filtering is needed here.
    const loadActiveCropPrices = () => {
        cropPriceList = getServiceRequest("/crop/cropprice/active");
    };


// ============================================================
// INITIALIZE FORM  (reset to ADD mode)
// ============================================================

    const initializeForm = () => {
        order        = {};
        oldOrder     = {};
        formMode     = "ADD";
        currentItems = [];
        selectedCropPrice = null;

        orderForm.reset();
        removeValidationStyles(orderForm);

        regNoElement.textContent    = "-";
        updateDateElement.textContent = "-";

        let dateTime = getTodayDateTime();
        let date = dateTime.slice(0, 10);
        let time = dateTime.slice(11, 19);
        regDateElement.textContent = date + " " + time;

        generateSupermarketSelect();
        generateOrderStatusSelect();
        generateCropSelect();

        totalAmountElement.value    = "";
        tdGrandTotal.textContent    = "0.00";
        orderItemsBody.innerHTML    = "";
        textUnitPriceElement.value  = "";

        // Auto fill currently logged-in user as the record's user (creation case)
        loadLoggedInUserInto(order, userIdElement);
        userIdElement.readOnly = true;

        // Auto-fill quotation —
        // quotationElement.value  = "";
        // order.quotation         = null;


        // Default status to Pending
        const defaultStatus = orderStatuses.find(s => s.name === "Pending");
        if (defaultStatus) {
            order.orderstatus       = defaultStatus.name;
            selectOrderStatus.value = JSON.stringify(defaultStatus);
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

    const generateSupermarketSelect = () => {
        fillDataIntoSelect(
            selectSupermarket,
            "Select Supermarket..",
            supermarkets,
            "name"
        );
    };

    const generateOrderStatusSelect = () => {
        fillDataIntoSelect(
            selectOrderStatus,
            "Select Order Status..",
            orderStatuses,
            "name"
        );
    };

    // Each option's value IS the full CropPrice record (crop + realprice +
    // priceid etc.) — selecting a crop and knowing its price happen in the
    // same action, same as crophasfarmer in croppurchase.js.
    const generateCropSelect = () => {
        selectCropElement.innerHTML = '<option value="" selected disabled>Select Crop</option>';

        (cropPriceList || []).forEach((cp) => {
            const option = document.createElement("option");
            option.value     = JSON.stringify(cp);
            option.innerText = cp.crop?.name || "Crop";
            selectCropElement.appendChild(option);
        });
    };


// ============================================================
// VALIDATION — HEADER FIELDS
// ============================================================

    const validateSupermarket = () => {
        const value = selectSupermarket.value;

        if (!value) {
            order.supermarket = null;
            setInvalid(selectSupermarket);
            return;
        }

        order.supermarket = JSON.parse(value);

        if (formMode === "EDIT" &&
            JSON.stringify(order.supermarket) !== JSON.stringify(oldOrder.supermarket)) {
            setUpdated(selectSupermarket);
        } else {
            setValid(selectSupermarket);
        }
    };

    const validateDeliveryDate = () => {
        const value = dateDeliveryDate.value;

        if (!value) {
            order.deliverydate = null;
            setInvalid(dateDeliveryDate);
            return;
        }

        order.deliverydate = value;

        if (formMode === "EDIT" && value !== oldOrder.deliverydate) {
            setUpdated(dateDeliveryDate);
        } else {
            setValid(dateDeliveryDate);
        }
    };

    const validateOrderStatus = () => {
        const value = selectOrderStatus.value;

        if (!value) {
            order.orderstatus = null;
            setInvalid(selectOrderStatus);
            return;
        }

        const parsed     = JSON.parse(value);
        order.orderstatus = parsed.name;

        if (formMode === "EDIT" &&
            JSON.stringify(order.orderstatus) !== JSON.stringify(oldOrder.orderstatus)) {
            setUpdated(selectOrderStatus);
        } else {
            setValid(selectOrderStatus);
        }
    };


// ============================================================
// VALIDATION — ITEM ROW FIELDS
// ============================================================

    // The selected option's value already IS the CropPrice record — no
    // second lookup against a separate price list is needed. Auto-fills
    // the read-only Unit Price field from realprice, per CropPriceController.
    const handleCropSelected = () => {
        const value = selectCropElement.value;

        if (!value) {
            setInvalid(selectCropElement);
            selectedCropPrice = null;
            textUnitPriceElement.value = "";
            return;
        }

        selectedCropPrice = JSON.parse(value);

        if (selectedCropPrice.realprice == null) {
            Notiflix.Notify.warning("No real price set for this crop.");
            textUnitPriceElement.value = "";
            setInvalid(selectCropElement);
            return;
        }

        textUnitPriceElement.value = Number(selectedCropPrice.realprice).toFixed(2);
        setValid(selectCropElement);
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
        const cropValue = selectCropElement.value;
        const qty       = parseFloat(textItemQtyElement.value);

        let hasError = false;

        if (!cropValue || !selectedCropPrice) { setInvalid(selectCropElement);  hasError = true; }
        if (isNaN(qty) || qty <= 0)           { setInvalid(textItemQtyElement); hasError = true; }

        if (hasError) {
            Notiflix.Notify.warning("Please fill all required item fields correctly.");
            return;
        }

        const unitPrice = selectedCropPrice.realprice;
        const lineTotal = unitPrice * qty;

        // Field names MUST match SupermarketOrderItem exactly:
        // croplistmanagement, cropprice, unitprice, quantity, linetotalprice.
        currentItems.push({
            croplistmanagement: selectedCropPrice.crop,
            cropprice:          selectedCropPrice,
            unitprice:          unitPrice,
            quantity:           qty,
            linetotalprice:     lineTotal,
        });

        renderItemsTable();

        // Clear item row inputs
        selectCropElement.value      = "";
        textUnitPriceElement.value   = "";
        textItemQtyElement.value     = "";
        selectedCropPrice = null;

        [selectCropElement, textUnitPriceElement, textItemQtyElement].forEach((el) => {
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
        orderItemsBody.innerHTML = "";
        let grandTotal = 0;

        if (currentItems.length === 0) {
            orderItemsBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">No items added yet.</td>
            </tr>`;
            tdGrandTotal.textContent   = "0.00";
            totalAmountElement.value   = "";
            order.totalamount          = 0;
            return;
        }

        currentItems.forEach((item, index) => {
            grandTotal += item.linetotalprice;

            const row = document.createElement("tr");
            row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.croplistmanagement?.name || "-"}</td>
            <td>${item.unitprice.toFixed(2)}</td>
            <td>${item.quantity.toFixed(2)}</td>
            <td>${item.linetotalprice.toFixed(2)}</td>
            <td>
                <button type="button" class="btn btn-sm btn-outline-danger"
                        onclick="removeItem(${index})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>`;
            orderItemsBody.appendChild(row);
        });

        tdGrandTotal.textContent  = grandTotal.toFixed(2);
        totalAmountElement.value  = grandTotal.toFixed(2);
        order.totalamount         = grandTotal;
    };


// ============================================================
// REFRESH MAIN TABLE
// ============================================================

    const refreshOrderTable = () => {
        if ($.fn.DataTable.isDataTable("#tableOrder")) {
            $("#tableOrder").DataTable().destroy();
        }

        tableBody.innerHTML = "";

        let displayProperty = [
            { propertyName: "number",               dataType: "string"   },

            { propertyName: getSupermarketDisplay,   dataType: "function" },
            { propertyName: getOrderDateDisplay,     dataType: "function" },
            { propertyName: "deliverydate",          dataType: "string"   },
            { propertyName: "totalamount",           dataType: "string"   },
            { propertyName: getOrderStatusDisplay,   dataType: "function" },
        ];

        fillDataIntoTableThree(
            tableBody,
            orderList,
            displayProperty,
            refillOrderForm
        );

        $("#tableOrder").DataTable();
    };

// Table display helpers

    const getSupermarketDisplay = (ob) =>
        ob.supermarket?.name || "-";
    const getOrderDateDisplay   = (ob) =>
        ob.addeddatetime ? ob.addeddatetime.slice(0, 10) : "-";
    const getOrderStatusDisplay = (ob) => {
        switch (ob.orderstatus) {
            case "Pending":            return '<p class="p-1 bg-warning">Pending</p>';
            case "AwaitingPayment":    return '<p class="p-1 bg-secondary text-white">Awaiting Payment</p>';
            case "PaymentSubmitted":   return '<p class="p-1 bg-primary text-white">Payment Submitted</p>';
            case "PaymentVerified":    return '<p class="p-1 bg-success text-white">Payment Verified</p>';
            case "Confirmed":          return '<p class="p-1 bg-info">Confirmed</p>';
            case "Delivered":          return '<p class="p-1 bg-success text-white">Delivered</p>';
            case "Cancelled":          return '<p class="p-1 bg-danger text-white">Cancelled</p>';
            case "CancelledNoPayment": return '<p class="p-1 bg-danger text-white">Cancelled (No Payment)</p>';
            default:                  return ob.orderstatus || "-";
        }
    };


// ============================================================
// REFILL FORM — EDIT MODE
// ============================================================

    const refillOrderForm = (dataOb) => {
        removeValidationStyles(orderForm);

        let myModal = new bootstrap.Modal(orderAddFormModalElement, {});
        formMode = "EDIT";

        order    = getServiceRequest("/supermarket/supermarketorder/byid/" + dataOb.id);
        oldOrder = JSON.parse(JSON.stringify(order));
        selectedCropPrice = null;

        // Meta dates
        if (order.addeddatetime) {
            let dt = order.addeddatetime;
            regDateElement.textContent = dt.slice(0, 10) + " " + dt.slice(11, 19);
        } else {
            regDateElement.textContent = "-";
        }

        if (order.updateddatetime) {
            let dt = order.updateddatetime;
            updateDateElement.textContent = dt.slice(0, 10) + " " + dt.slice(11, 19);
        } else {
            updateDateElement.textContent = "-";
        }

        regNoElement.textContent = order.number || "-";

        // Supermarket
        generateSupermarketSelect();
        if (order.supermarket) {
            selectSupermarket.value = JSON.stringify(order.supermarket);
        }

        // Delivery date
        dateDeliveryDate.value = order.deliverydate
            ? order.deliverydate.slice(0, 10)
            : "";

        // Order status
        generateOrderStatusSelect();
        selectOrderStatus.value = JSON.stringify({ name: order.orderstatus });

        // Total amount (read-only, calculated)
        totalAmountElement.value = order.totalamount
            ? order.totalamount.toFixed(2)
            : "0.00";

        // User field is DISPLAY ONLY here — shows whoever is currently
        // stamped on the record (last updater, or creator if never
        // updated). We do NOT touch order.user on open. It only gets
        // reassigned to the current session user inside handleUpdate(),
        // and only if the record is actually changed and saved — see
        // hasOrderChanged(). Opening or cancelling never reassigns it.
        userIdElement.value    = order.user?.username || order.user?.id || "-";
        userIdElement.readOnly = true;

        // Items — already carry their own unitprice/cropprice snapshot
        // from when they were added, so they are loaded as-is.
        currentItems = order.supermarketOrderItems
            ? JSON.parse(JSON.stringify(order.supermarketOrderItems))
            : [];
        generateCropSelect();
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

    const hasOrderChanged = () => {
        if (JSON.stringify(order.supermarket) !== JSON.stringify(oldOrder.supermarket)) return true;
        if (order.deliverydate !== oldOrder.deliverydate) return true;
        if (order.orderstatus !== oldOrder.orderstatus) return true;
        if (JSON.stringify(currentItems) !==
            JSON.stringify(oldOrder.supermarketOrderItems || [])) return true;
        return false;
    };


// ============================================================
// FORM ERROR CHECK
// ============================================================

    const checkFormErrors = () => {
        let errors = [];

        if (!order.supermarket)
            errors.push("Supermarket has an error. Please check again.");
        if (!order.deliverydate)
            errors.push("Delivery Date has an error. Please check again.");
        if (!order.orderstatus)
            errors.push("Order Status has an error. Please check again.");
        if (!order.user)
            errors.push("User ID has an error. Please check again.");
        if (currentItems.length === 0)
            errors.push("At least one Order Item is required.");

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

        order.supermarketOrderItems = currentItems;

        console.log("Submitting Supermarket Order:", order);

        let response = getHTTPServiceRequest("/supermarket/supermarketorder/save", "POST", order);

        if (response === "OK") {
            Notiflix.Notify.success("Saved successfully");
            $("#OrderAddForm").modal("hide");
            loadInitialData();
            refreshOrderTable();
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
        if (hasOrderChanged()) {
            loadLoggedInUserInto(order, userIdElement);
        }

        order.supermarketOrderItems = currentItems;

        console.log("Updating Supermarket Order:", order);

        let response = getHTTPServiceRequest("/supermarket/supermarketorder/update", "PUT", order);

        if (response === "OK") {
            updateDateElement.textContent = new Date().toLocaleString();
            Notiflix.Notify.success("Updated successfully");
            $("#OrderAddForm").modal("hide");
            loadInitialData();
            refreshOrderTable();
            initializeForm();
        } else {
            Notiflix.Notify.warning("Update failed: " + response);
        }
    };

    const handleDelete = () => {
        Notiflix.Confirm.show(
            "Delete Order",
            "Are you sure you want to delete this order?",
            "Yes, Delete",
            "Cancel",
            () => {
                let response = getHTTPServiceRequest(
                    "/supermarket/supermarketorder/" + order.id,
                    "DELETE",
                    null
                );

                if (response !== "AJAX error") {
                    Notiflix.Notify.success("Deleted successfully");
                    $("#OrderAddForm").modal("hide");
                    loadInitialData();
                    refreshOrderTable();
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

    const viewOrderRecord = (dataOb) => {
        tdOrderNumber.innerText  = dataOb.number || "-";
        tdQuotation.innerText    = dataOb.quotation ? dataOb.quotation.id : "-";
        tdSupermarket.innerText  = dataOb.supermarket?.name || "-";
        tdOrderDate.innerText    = dataOb.addeddatetime
            ? dataOb.addeddatetime.slice(0, 10)
            : "-";
        tdDeliveryDate.innerText = dataOb.deliverydate
            ? dataOb.deliverydate.slice(0, 10)
            : "-";
        tdTotalAmount.innerText  = dataOb.totalamount
            ? dataOb.totalamount.toFixed(2)
            : "0.00";
        tdOrderStatus.innerText  = dataOb.orderstatus || "-";

        // Items
        printOrderItemsBody.innerHTML = "";
        const items = dataOb.supermarketOrderItems || currentItems || [];

        if (items.length === 0) {
            printOrderItemsBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted">No items.</td>
            </tr>`;
        } else {
            items.forEach((item, index) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.croplistmanagement?.name || "-"}</td>
                <td>${item.unitprice.toFixed(2)}</td>
                <td>${item.quantity.toFixed(2)}</td>
                <td>${item.linetotalprice.toFixed(2)}</td>`;
                printOrderItemsBody.appendChild(row);
            });
        }

        // Blur edit modal while print view is open
        const editModalContent = orderAddFormModalElement.querySelector(".modal-content");
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
        viewOrderRecord(order);
    };

    const printOrderRecord = () => {
        let newWindow = window.open();
        newWindow.document.write(
            "<html><head>" +
            "<title>Supermarket Order Details</title>" +
            '<link rel="stylesheet" href="/css/bootstrap-5.3.3/css/bootstrap.min.css">' +
            "</head><body>" +
            divCardPrintOrder.outerHTML +
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
        refreshOrderTable();}
    window.initPage();

    window.printOrderRecord =printOrderRecord;
    window.removeItem = removeItem;
})();