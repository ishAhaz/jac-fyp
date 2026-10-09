// ============================================================
// Compost Order (Farmer) JS
// ============================================================
(function () {
// quotation
// ============================================================
// DOM ELEMENT REFERENCES
// ============================================================
    let orderAddFormModalElement, orderViewModalElement, paySlipModalElement;
    let tableBody;
    let orderForm, addNewOrderElement, orderDateElement, updateDateElement,
        regNoElement, farmerNameElement, inputOrderStatus,
        dateDeliveryElement, textTotalAmount, textNote;
    let selectOrderCompost, inputOrderQty, inputOrderUnitPrice, stockSignBadge, btnAddOrderItem;
    let orderItemsBody, totalAmountCell;
    let clearElement, submitElement;
    let tdSaleNo,  tdOrderDate, tdUpdateDate, tdDeliveryDate,
        tdTotalAmount, tdStatus, tdNote, tdBankRef, tdPaymentSubmitted,
        printOrderItemsBody, btnPayNow;
    let payAmountDue, inputBankSlip, inputBankRefNo, btnSubmitPaySlip;

    const queryElements = () => {
        orderAddFormModalElement = document.querySelector("#OrderAddForm");
        orderViewModalElement    = document.querySelector("#OrderViewModal");
        paySlipModalElement      = document.querySelector("#PaySlipModal");

        tableBody = document.querySelector("#tableBodyId");

        orderForm             = document.querySelector("#formOrder");
        addNewOrderElement    = document.querySelector("#addNewOrderId");
        orderDateElement      = document.querySelector("#orderDate");
        updateDateElement     = document.querySelector("#updateDate");
        regNoElement          = document.querySelector("#InputRegNo");
        farmerNameElement     = document.querySelector("#inputFarmerName");
        inputOrderStatus      = document.querySelector("#inputOrderStatus");

        dateDeliveryElement   = document.querySelector("#dateDelivery");
        textTotalAmount       = document.querySelector("#textTotalAmount");
        textNote              = document.querySelector("#textNote");

        selectOrderCompost  = document.querySelector("#inputOrderCompost");
        inputOrderQty       = document.querySelector("#inputOrderQty");
        inputOrderUnitPrice = document.querySelector("#inputOrderUnitPrice");
        stockSignBadge      = document.querySelector("#stockSignBadge");
        btnAddOrderItem     = document.querySelector("#btnAddOrderItem");

        orderItemsBody  = document.querySelector("#orderItemsBody");
        totalAmountCell = document.querySelector("#totalAmount");

        clearElement  = document.querySelector("#buttonClear");
        submitElement = document.querySelector("#buttonSubmit");

        tdSaleNo            = document.querySelector("#tdSaleNo");

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


    // Compost dropdown IS the active CompostPrice list - same pattern as
    // compostsale.js's compostPriceList. One selection gives the compost
    // identity and its current sale price together, so there is no
    // separate compost list to fetch or a per-selection price lookup call.
    let compostPriceList = [];

    // Currently selected CompostPrice record (the compost dropdown's
    // parsed value itself) - consumed on Add Item, same as compostsale.js.
    let selectedCompostPrice = null;

    let order      = {};
    let orderItems = [];
    let currentViewOrder = {};

// ============================================================
// EVENT LISTENERS
// ============================================================
    const initializeEventListeners = () => {
        dateDeliveryElement.addEventListener("input", validateDeliveryDate);
        selectOrderCompost.addEventListener("change", handleCompostSelected);
        inputOrderQty.addEventListener("input",       handleQtyChange);

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
        selectedCompostPrice = null;

        orderForm.reset();

        regNoElement.textContent = "Auto-generated on submit";
        updateDateElement.textContent = "-";
        inputOrderStatus.value = "Pending";

        let dateTime = getTodayDateTime();
        let date = dateTime.slice(0, 10);
        let time = dateTime.slice(11, 19);
        orderDateElement.textContent = date + " " + time;

        // Auto-fill the logged-in farmer as the order's user - no select,
        // farmer can only ever place an order as themself. Mirrors the
        // logged-in-user attribution pattern used across the JAC frontend
        // (see compostsale.js's userId field / loadLoggedInUserInto()).
        // ASSUMPTION: loadLoggedInUserInto()'s optional third parameter
        // controls which property of the current user gets displayed in
        // the element - passing "farmer.fullname" here to show the
        // farmer's name rather than a username. Confirm against the real
        // commonFunction.js signature and adjust if it expects something
        // else (e.g. a plain username with no farmer relation to drill into).
        loadLoggedInUserInto(order, farmerNameElement, "farmer.fullname");
        farmerNameElement.readOnly = true;


        generateCompostPriceSelect();

        inputOrderUnitPrice.value = "";
        stockSignBadge.textContent = "Not Checked";
        stockSignBadge.className = "badge bg-secondary p-2";

        renderOrderItemsTable();
    };

// ============================================================
// LOAD INITIAL DATA
// ============================================================
    const loadInitialData = () => {
        loadActiveCompostPrices();

        orderList     = getServiceRequest("/compostorder/farmer/alldata/selected");
    };

    // Filtered to Active client-side, same as compostsale.js's
    // loadActiveCompostPrices() - swap for a dedicated
    // /compost/compostprice/active endpoint if one becomes available.
    const loadActiveCompostPrices = () => {
        const allPrices = getServiceRequest("/compost/compostprice/alldata/selected");
        compostPriceList = (allPrices || []).filter((p) => p.statuspending === "Active");
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
            { propertyName: "compostsalenumber", dataType: "string"   },
            { propertyName: "addeddatetime",     dataType: "string"   },
            { propertyName: "deliverydate",      dataType: "string"   },
            { propertyName: "totalamount",       dataType: "string"   },
            { propertyName: getStatusBadge,      dataType: "function" },
        ];

        fillDataIntoTableThree(
            tableBody,
            orderList,
            displayProperty,
            (ob) => openOrderView(ob.id) // row click now opens the view, since there's no Action column
        );

        $("#tableOrder").DataTable();
    };



    const getStatusBadge = (ob) => {
        const s = (ob.comsalestatus || "").toLowerCase();
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
        return `<p class="p-1 ${cls}">${ob.comsalestatus || "-"}</p>`;
    };



// ============================================================
// DROPDOWNS
// ============================================================


    // Each option's value IS the full CompostPrice record (compost + saleprice),
    // same as compostsale.js's generateCompostSelect().
    const generateCompostPriceSelect = () => {
        selectOrderCompost.innerHTML = '<option value="" disabled selected>Select Compost</option>';

        (compostPriceList || []).forEach((cp) => {
            const option = document.createElement("option");
            option.value     = JSON.stringify(cp);
            option.innerText = cp.compost?.name || "Compost";
            selectOrderCompost.appendChild(option);
        });
    };

// ============================================================
// ITEM ADD ROW LOGIC
// ============================================================
    // Replaces the old two-step "select compost -> fetch price by id" flow:
    // the selected option's value already IS the CompostPrice record, so
    // Unit Price is filled directly from it, no extra service call.
    const handleCompostSelected = () => {
        const value = selectOrderCompost.value;

        if (!value) {
            selectedCompostPrice = null;
            inputOrderUnitPrice.value = "";
            stockSignBadge.textContent = "Not Checked";
            stockSignBadge.className = "badge bg-secondary p-2";
            return;
        }

        selectedCompostPrice = JSON.parse(value);

        if (selectedCompostPrice.saleprice == null) {
            Notiflix.Notify.warning("No sale price set for this compost.");
            inputOrderUnitPrice.value = "";
            return;
        }

        inputOrderUnitPrice.value = Number(selectedCompostPrice.saleprice).toFixed(2);

        checkStockSign();
    };

    const handleQtyChange = () => {
        checkStockSign();
    };

    const checkStockSign = () => {
        const qty = parseFloat(inputOrderQty.value);

        if (!selectedCompostPrice || isNaN(qty) || qty <= 0) {
            stockSignBadge.textContent = "Not Checked";
            stockSignBadge.className = "badge bg-secondary p-2";
            return;
        }

        let result = getServiceRequest(
            "/compostorder/farmer/stockcheck?compostId=" + selectedCompostPrice.compost.id + "&qty=" + qty
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

        if (!selectedCompostPrice) {
            Notiflix.Notify.warning("Please select a compost item.");
            return;
        }
        if (isNaN(qty) || qty <= 0) {
            Notiflix.Notify.warning("Please enter a valid quantity.");
            return;
        }

        const unitPrice = selectedCompostPrice.saleprice;
        if (isNaN(unitPrice) || unitPrice <= 0) {
            Notiflix.Notify.warning("Unit price not available for this item.");
            return;
        }

        // Field names mirror CompostSaleItem exactly (compost, compostprice,
        // unitprice, quantity, linetotalprice) per compostsale.js's confirmed
        // entity shape - the original farmer-side code was only sending
        // compost/quantity/unitprice/linetotalprice, missing compostprice.
        orderItems.push({
            compost:        selectedCompostPrice.compost,
            compostprice:   selectedCompostPrice,
            quantity:       qty,
            unitprice:      unitPrice,
            linetotalprice: qty * unitPrice,
            stockSign:      stockSignBadge.textContent,
        });

        renderOrderItemsTable();

        selectOrderCompost.value = "";
        inputOrderQty.value = "";
        inputOrderUnitPrice.value = "";
        selectedCompostPrice = null;
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
                <td>${item.compost.name}</td>
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

    // setValid/setInvalid are declared local here in the original
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
        if (!order.user)         errors.push("Farmer could not be identified. Please log in again.");
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



        order.compostSaleItems = orderItems.map(item => ({
            compost:        { id: item.compost.id },
            compostprice:   { id: item.compostprice.id },
            quantity:       item.quantity,
            unitprice:      item.unitprice,
            linetotalprice: item.linetotalprice,
        }));

        order.comsalestatus = "Pending";

        console.log("Submitting order:", order);

        let response = getHTTPServiceRequest("/compostorder/farmer/save", "POST", order);

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
        currentViewOrder = getServiceRequest("/compostorder/farmer/byid/" + id);

        tdSaleNo.textContent           = currentViewOrder.compostsalenumber || "-";

        tdOrderDate.textContent        = currentViewOrder.addeddatetime || "-";
        tdUpdateDate.textContent       = currentViewOrder.updateddatetime || "-";
        tdDeliveryDate.textContent     = currentViewOrder.deliverydate || "-";
        tdTotalAmount.textContent      = currentViewOrder.totalamount || "-";
        tdStatus.textContent           = currentViewOrder.comsalestatus || "-";
        tdNote.textContent             = currentViewOrder.note || "-";


        printOrderItemsBody.innerHTML = "";
        (currentViewOrder.compostSaleItems || []).forEach((item, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.compost ? item.compost.name : "-"}</td>
                <td>${item.quantity}</td>
                <td>${item.unitprice}</td>
                <td>${item.linetotalprice}</td>
            `;
            printOrderItemsBody.appendChild(row);
        });

        if (currentViewOrder.comsalestatus === "AwaitingPayment") {
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
            "/compostorder/farmer/paymentslip/" + currentViewOrder.id,
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