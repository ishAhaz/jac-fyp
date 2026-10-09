// ============================================================
// Crop Order (Supermarket) JS
// ============================================================
(function () {

// ============================================================
// DOM ELEMENT REFERENCES
// ============================================================
    let orderAddFormModalElement, orderViewModalElement, paySlipModalElement;
    let tableBody;
    let orderForm, addNewOrderElement, orderDateElement, updateDateElement,
        regNoElement, supermarketNameElement, inputOrderStatus, selectQuotation,
        dateDeliveryElement, textTotalAmount, textNote;
    let selectOrderCrop, inputOrderQty, inputOrderUnitPrice, stockSignBadge, btnAddOrderItem;
    let orderItemsBody, totalAmountCell;
    let clearElement, submitElement;
    let tdSaleNo, tdQuotationNo, tdOrderDate, tdUpdateDate, tdDeliveryDate,
        tdTotalAmount, tdStatus, tdNote, tdBankRef, tdPaymentSubmitted,
        printOrderItemsBody, btnPayNow;
    let payAmountDue, inputBankSlip, inputBankRefNo, btnSubmitPaySlip;

    const queryElements = () => {
        orderAddFormModalElement = document.querySelector("#OrderAddForm");
        orderViewModalElement    = document.querySelector("#OrderViewModal");
        paySlipModalElement      = document.querySelector("#PaySlipModal");

        tableBody = document.querySelector("#tableBodyId");

        orderForm              = document.querySelector("#formOrder");
        addNewOrderElement     = document.querySelector("#addNewOrderId");
        orderDateElement       = document.querySelector("#orderDate");
        updateDateElement      = document.querySelector("#updateDate");
        regNoElement           = document.querySelector("#InputRegNo");
        supermarketNameElement = document.querySelector("#inputSupermarketName");
        inputOrderStatus       = document.querySelector("#inputOrderStatus");
        selectQuotation        = document.querySelector("#textQuotation");
        dateDeliveryElement    = document.querySelector("#dateDelivery");
        textTotalAmount        = document.querySelector("#textTotalAmount");
        textNote               = document.querySelector("#textNote");

        selectOrderCrop     = document.querySelector("#inputOrderCrop");
        inputOrderQty       = document.querySelector("#inputOrderQty");
        inputOrderUnitPrice = document.querySelector("#inputOrderUnitPrice");
        stockSignBadge      = document.querySelector("#stockSignBadge");
        btnAddOrderItem     = document.querySelector("#btnAddOrderItem");

        orderItemsBody  = document.querySelector("#orderItemsBody");
        totalAmountCell = document.querySelector("#totalAmount");

        clearElement  = document.querySelector("#buttonClear");
        submitElement = document.querySelector("#buttonSubmit");

        tdSaleNo            = document.querySelector("#tdSaleNo");
        tdQuotationNo       = document.querySelector("#tdQuotationNo");
        tdOrderDate         = document.querySelector("#tdOrderDate");
        tdUpdateDate        = document.querySelector("#tdUpdateDate");
        tdDeliveryDate      = document.querySelector("#tdDeliveryDate");
        tdTotalAmount       = document.querySelector("#tdTotalAmount");
        tdStatus            = document.querySelector("#tdStatus");
        tdNote              = document.querySelector("#tdNote");
        tdBankRef           = document.querySelector("#tdBankRef");
        tdPaymentSubmitted  = document.querySelector("#tdPaymentSubmitted");
        printOrderItemsBody = document.querySelector("#printOrderItemsBody");
        btnPayNow           = document.querySelector("#btnPayNow");

        payAmountDue    = document.querySelector("#payAmountDue");
        inputBankSlip   = document.querySelector("#inputBankSlip");
        inputBankRefNo  = document.querySelector("#inputBankRefNo");
        btnSubmitPaySlip = document.querySelector("#btnSubmitPaySlip");
    };

// ============================================================
// STATE
// ============================================================
    let orderList     = [];
    let quotationList  = [];

    // Crop dropdown IS the active CropPrice list, same as supermarketorder.js's
    // cropPriceList - one selection gives crop identity + current real price
    // together. CropPriceController's /crop/cropprice/active already filters
    // to Active status server-side, so no client-side filtering is needed here
    // (unlike compost, which currently lacks a dedicated active-only endpoint).
    let cropPriceList = [];

    // Currently selected CropPrice record (the crop dropdown's parsed value
    // itself) - consumed on Add Item, same as supermarketorder.js.
    let selectedCropPrice = null;

    let order      = {};
    let orderItems = [];
    let currentViewOrder = {};

// ============================================================
// EVENT LISTENERS
// ============================================================
    const initializeEventListeners = () => {
        dateDeliveryElement.addEventListener("input", validateDeliveryDate);
        selectOrderCrop.addEventListener("change", handleCropSelected);
        inputOrderQty.addEventListener("input",    handleQtyChange);

        btnAddOrderItem.addEventListener("click", handleAddOrderItem);

        clearElement.addEventListener("click",  handleClear);
        submitElement.addEventListener("click", handleSubmit);

        addNewOrderElement.addEventListener("click", initializeForm);

        btnSubmitPaySlip.addEventListener("click", handleSubmitPaySlip);

        if (payAmountDue) {
            orderViewModalElement.addEventListener("show.bs.modal", () => {
                payAmountDue.textContent = currentViewOrder.totalamount || "-";
            });
        }
    };

// ============================================================
// INITIALIZE FORM
// ============================================================
    const initializeForm = () => {
        order      = {};
        orderItems = [];
        selectedCropPrice = null;

        orderForm.reset();

        regNoElement.textContent = "Auto-generated on submit";
        updateDateElement.textContent = "-";
        inputOrderStatus.value = "Pending";

        let dateTime = getTodayDateTime();
        let date = dateTime.slice(0, 10);
        let time = dateTime.slice(11, 19);
        orderDateElement.textContent = date + " " + time;

        // Auto-fill the logged-in supermarket as the order's user - no
        // select, a supermarket account can only ever place an order as
        // itself. Mirrors the logged-in-user attribution pattern used
        // across the JAC frontend (see supermarketorder.js's userId field
        // / loadLoggedInUserInto(), and the same treatment applied to the
        // farmer-side compost order form).
        // ASSUMPTION: same as the compost order form - loadLoggedInUserInto()'s
        // optional third parameter is assumed to control which property of
        // the current user gets displayed. Passing "supermarket.name" here
        // to show the supermarket's name rather than a username. Confirm
        // against the real commonFunction.js signature.
        loadLoggedInUserInto(order, supermarketNameElement, "supermarket.name");
        supermarketNameElement.readOnly = true;

        generateQuotationDropdown();
        generateCropPriceSelect();

        inputOrderUnitPrice.value = "";
        stockSignBadge.textContent = "Not Checked";
        stockSignBadge.className = "badge bg-secondary p-2";

        renderOrderItemsTable();
    };

// ============================================================
// LOAD INITIAL DATA
// ============================================================
    const loadInitialData = () => {
        loadActiveCropPrices();
        quotationList = getServiceRequest("/quotation/crop/supermarket/responded");
        orderList     = getServiceRequest("/croporder/supermarket/alldata/selected");
    };

    // CropPriceController's /crop/cropprice/active already filters to
    // Active status server-side (per supermarketorder.js's own comment),
    // so unlike the compost side, no client-side filtering is needed here.
    const loadActiveCropPrices = () => {
        cropPriceList = getServiceRequest("/crop/cropprice/active");
    };

// ============================================================
// REFRESH TABLE
// ============================================================
    const refreshOrderTable = () => {
        if ($.fn.DataTable.isDataTable("#tableOrder")) {
            $("#tableOrder").DataTable().destroy();
        }

        tableBody.innerHTML = "";

        let displayProperty = [
            { propertyName: "number",            dataType: "string"   },
            { propertyName: getQuotationNo,      dataType: "function" },
            { propertyName: "addeddatetime",     dataType: "string"   },
            { propertyName: "deliverydate",      dataType: "string"   },
            { propertyName: "totalamount",       dataType: "string"   },
            { propertyName: getStatusBadge,      dataType: "function" },
            { propertyName: getActionButtons,    dataType: "function" },
        ];

        fillDataIntoTableThree(
            tableBody,
            orderList,
            displayProperty,
            () => {} // row click disabled - use explicit action buttons
        );

        $("#tableOrder").DataTable();
    };

    const getStatusBadge = (ob) => {
        const s = (ob.orderstatus || "").toLowerCase();
        const map = {
            pending:            "bg-secondary",
            awaitingpayment:    "bg-warning text-dark",
            paymentsubmitted:   "bg-info",
            paymentverified:    "bg-primary",
            confirmed:          "bg-primary",
            delivered:          "bg-success",
            cancellednopayment: "bg-danger",
            cancelled:          "bg-danger",
        };
        const cls = map[s] || "bg-secondary";
        return `<p class="p-1 ${cls}">${ob.orderstatus || "-"}</p>`;
    };

    const getActionButtons = (ob) => {
        return `<button type="button" class="btn btn-sm btn-outline-primary" onclick="openOrderView(${ob.id})">
                    <i class="fa-solid fa-eye"></i> View
                </button>`;
    };

// ============================================================
// DROPDOWNS
// ============================================================
    const generateQuotationDropdown = () => {
        fillDataIntoSelect(
            selectQuotation,
            "No Quotation - New Order",
            quotationList,
            "quotationnumber"
        );
    };

    // Each option's value IS the full CropPrice record (crop + realprice),
    // same as supermarketorder.js's generateCropSelect().
    const generateCropPriceSelect = () => {
        selectOrderCrop.innerHTML = '<option value="" disabled selected>Select Crop</option>';

        (cropPriceList || []).forEach((cp) => {
            const option = document.createElement("option");
            option.value     = JSON.stringify(cp);
            option.innerText = cp.crop?.name || "Crop";
            selectOrderCrop.appendChild(option);
        });
    };

// ============================================================
// ITEM ADD ROW LOGIC
// ============================================================
    // Replaces the old two-step "select crop -> fetch price by id" flow:
    // the selected option's value already IS the CropPrice record, so
    // Unit Price is filled directly from it, no extra service call.
    const handleCropSelected = () => {
        const value = selectOrderCrop.value;

        if (!value) {
            selectedCropPrice = null;
            inputOrderUnitPrice.value = "";
            stockSignBadge.textContent = "Not Checked";
            stockSignBadge.className = "badge bg-secondary p-2";
            return;
        }

        selectedCropPrice = JSON.parse(value);

        if (selectedCropPrice.realprice == null) {
            Notiflix.Notify.warning("No real price set for this crop.");
            inputOrderUnitPrice.value = "";
            return;
        }

        inputOrderUnitPrice.value = Number(selectedCropPrice.realprice).toFixed(2);

        checkStockSign();
    };

    const handleQtyChange = () => {
        checkStockSign();
    };

    const checkStockSign = () => {
        const qty = parseFloat(inputOrderQty.value);

        if (!selectedCropPrice || isNaN(qty) || qty <= 0) {
            stockSignBadge.textContent = "Not Checked";
            stockSignBadge.className = "badge bg-secondary p-2";
            return;
        }

        let result = getServiceRequest(
            "/croporder/supermarket/stockcheck?cropId=" + selectedCropPrice.crop.id + "&qty=" + qty
        );

        if (result && result.available) {
            stockSignBadge.textContent = "Stock OK";
            stockSignBadge.className = "badge bg-success p-2";
        } else {
            stockSignBadge.textContent = "Insufficient Stock";
            stockSignBadge.className = "badge bg-danger p-2";
        }
    };

    const handleAddOrderItem = () => {
        const qty = parseFloat(inputOrderQty.value);

        if (!selectedCropPrice) {
            Notiflix.Notify.warning("Please select a crop item.");
            return;
        }
        if (isNaN(qty) || qty <= 0) {
            Notiflix.Notify.warning("Please enter a valid quantity.");
            return;
        }

        const unitPrice = selectedCropPrice.realprice;
        if (isNaN(unitPrice) || unitPrice <= 0) {
            Notiflix.Notify.warning("Unit price not available for this item.");
            return;
        }

        // Field names mirror SupermarketOrderItem exactly (croplistmanagement,
        // cropprice, unitprice, quantity, linetotalprice) per supermarketorder.js's
        // confirmed entity shape - the original farmer-side code here was
        // pushing "crop" instead of "croplistmanagement" and never included
        // cropprice at all, which would not have matched the entity.
        orderItems.push({
            croplistmanagement: selectedCropPrice.crop,
            cropprice:          selectedCropPrice,
            quantity:            qty,
            unitprice:           unitPrice,
            linetotalprice:      qty * unitPrice,
            stockSign:           stockSignBadge.textContent,
        });

        renderOrderItemsTable();

        selectOrderCrop.value = "";
        inputOrderQty.value = "";
        inputOrderUnitPrice.value = "";
        selectedCropPrice = null;
        stockSignBadge.textContent = "Not Checked";
        stockSignBadge.className = "badge bg-secondary p-2";
    };

    const removeOrderItem = (index) => {
        orderItems.splice(index, 1);
        renderOrderItemsTable();
    };

    const renderOrderItemsTable = () => {
        orderItemsBody.innerHTML = "";
        let total = 0;

        orderItems.forEach((item, index) => {
            total += item.linetotalprice;

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.croplistmanagement.name}</td>
                <td>${item.quantity}</td>
                <td>${item.unitprice.toFixed(2)}</td>
                <td>${item.linetotalprice.toFixed(2)}</td>
                <td>${item.stockSign}</td>
                <td><button type="button" class="btn btn-sm btn-outline-danger" onclick="removeOrderItem(${index})">
                        <i class="fa-solid fa-trash"></i>
                    </button></td>
            `;
            orderItemsBody.appendChild(row);
        });

        totalAmountCell.textContent = total.toFixed(2);
        textTotalAmount.value = total.toFixed(2);
        order.totalamount = total;
    };

// ============================================================
// VALIDATION
// ============================================================
    const validateDeliveryDate = () => {
        const value = dateDeliveryElement.value;
        if (!value) {
            order.deliverydate = null;
            setInvalid(dateDeliveryElement);
            return;
        }
        order.deliverydate = value;
        setValid(dateDeliveryElement);
    };

    // NOTE: setValid/setInvalid are declared local here in the original
    // file, which would shadow the global versions in commonFunction.js.
    // If commonFunction.js already defines these globally (as it does for
    // the compost/crop/employee modules), remove these two and just call
    // the global ones - keeping a local copy risks divergent behavior
    // between modules for no reason.
    const setValid = (element) => {
        element.classList.add("is-valid");
        element.classList.remove("is-invalid");
    };

    const setInvalid = (element) => {
        element.classList.add("is-invalid");
        element.classList.remove("is-valid");
    };

// ============================================================
// FORM ERROR CHECK
// ============================================================
    const checkFormErrors = () => {
        let errors = [];

        if (!order.deliverydate) errors.push("Requested Delivery Date has an error. Please check again.");
        if (!order.user)         errors.push("Supermarket could not be identified. Please log in again.");
        if (orderItems.length === 0) errors.push("Please add at least one order item.");

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

        order.note = textNote.value.trim() || null;

        const quotationValue = selectQuotation.value;
        order.quotation = quotationValue ? { id: JSON.parse(quotationValue).id } : null;

        order.supermarketOrderItems = orderItems.map(item => ({
            croplistmanagement: { id: item.croplistmanagement.id },
            cropprice:          { id: item.cropprice.id },
            quantity:            item.quantity,
            unitprice:           item.unitprice,
            linetotalprice:      item.linetotalprice,
        }));

        order.orderstatus = "Pending";

        console.log("Submitting order:", order);

        let response = getHTTPServiceRequest("/croporder/supermarket/save", "POST", order);

        if (response === "OK") {
            Notiflix.Notify.success("Order submitted successfully");
            $("#OrderAddForm").modal("hide");
            loadInitialData();
            refreshOrderTable();
            initializeForm();
        } else {
            Notiflix.Notify.warning("Order submission failed: " + response);
        }
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

// ============================================================
// VIEW / PAY NOW
// ============================================================
    const openOrderView = (id) => {
        currentViewOrder = getServiceRequest("/croporder/supermarket/byid/" + id);

        tdSaleNo.textContent           = currentViewOrder.number || "-";

        tdOrderDate.textContent        = currentViewOrder.addeddatetime || "-";
        tdUpdateDate.textContent       = currentViewOrder.updateddatetime || "-";
        tdDeliveryDate.textContent     = currentViewOrder.deliverydate || "-";
        tdTotalAmount.textContent      = currentViewOrder.totalamount || "-";
        tdStatus.textContent           = currentViewOrder.orderstatus || "-";
        tdNote.textContent             = currentViewOrder.note || "-";
        tdBankRef.textContent          = currentViewOrder.bankreferencenumber || "-";
        tdPaymentSubmitted.textContent = currentViewOrder.paymentsubmitteddatetime || "-";

        printOrderItemsBody.innerHTML = "";
        (currentViewOrder.supermarketOrderItems || []).forEach((item, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.croplistmanagement ? item.croplistmanagement.name : "-"}</td>
                <td>${item.quantity}</td>
                <td>${item.unitprice}</td>
                <td>${item.linetotalprice}</td>
            `;
            printOrderItemsBody.appendChild(row);
        });

        if (currentViewOrder.orderstatus === "AwaitingPayment") {
            btnPayNow.classList.remove("d-none");
        } else {
            btnPayNow.classList.add("d-none");
        }

        const viewModal = new bootstrap.Modal(orderViewModalElement);
        viewModal.show();
    };

    const printOrderRecord = () => {
        let newWindow = window.open();
        newWindow.document.write(
            "<html><head>" +
            "<title>Order Details</title>" +
            '<link rel="stylesheet" href="/css/bootstrap-5.3.3/css/bootstrap.min.css">' +
            "</head><body>" +
            document.querySelector("#divCardPrintOrder").outerHTML +
            "</body></html>"
        );
        setInterval(() => {
            newWindow.stop();
            newWindow.print();
            newWindow.close();
        }, 500);
    };

    const handleSubmitPaySlip = () => {
        if (!inputBankSlip.files[0]) {
            Notiflix.Notify.warning("Please choose the bank slip / screenshot file.");
            return;
        }
        if (!inputBankRefNo.value.trim()) {
            Notiflix.Notify.warning("Please enter the bank reference number.");
            return;
        }

        let formData = new FormData();
        formData.append("slip", inputBankSlip.files[0]);
        formData.append("bankreferencenumber", inputBankRefNo.value.trim());
        formData.append("orderId", currentViewOrder.id);

        let response = getHTTPServiceRequestFormData(
            "/croporder/supermarket/paymentslip/" + currentViewOrder.id,
            "POST",
            formData
        );

        if (response === "OK") {
            Notiflix.Notify.success("Payment proof submitted. Awaiting verification.");
            $("#PaySlipModal").modal("hide");
            $("#OrderViewModal").modal("hide");
            loadInitialData();
            refreshOrderTable();
        } else {
            Notiflix.Notify.warning("Submission failed: " + response);
        }
    };

// ============================================================
// INIT
// ============================================================
    window.initPage = function () {
        queryElements();
        loadInitialData();
        initializeForm();
        initializeEventListeners();
        refreshOrderTable();
    };

    window.initPage();

// ============================================================
// EXPOSE FUNCTIONS CALLED FROM INLINE onclick="" IN THE HTML
// ============================================================
    window.openOrderView    = openOrderView;
    window.removeOrderItem  = removeOrderItem;
    window.printOrderRecord = printOrderRecord;

})();