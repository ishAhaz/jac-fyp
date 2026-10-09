// ============================================================
// DOM ELEMENT REFERENCES
// ============================================================
(function () {
    let deliveryFormModalElement
        ,  tableBody
        ,  selectSaleType
        ,  selectReference
        ,  selectDeliveryStatus
        ,  deliveryCustomer
        ,  deliveryReferenceNo
        ,  deliveryAddress
        ,  printViewDeliveryModalElement
        ,  deliveryForm
        ,  createdDateEl
        ,  updateDateEl
        ,  deliveryRegNoEl
        ,  dateDelivered
        ,  titleEditHide
        , titleNewHide
        , submitElement
        , updateElement
        , clearElement
        , printElement
        , deleteElement;

    const queryElements = () => {
        deliveryFormModalElement = document.querySelector("#DeliveryFormModal");

        // Table body
        tableBody = document.querySelector("#tableBodyDelivery");

        // Dropdowns
        selectSaleType       = document.querySelector("#selectSaleType");
        selectReference       = document.querySelector("#selectReference");
        selectDeliveryStatus  = document.querySelector("#selectDeliveryStatus");

        // Auto-filled fields
        deliveryCustomer    = document.querySelector("#deliveryCustomer");
        deliveryReferenceNo  = document.querySelector("#deliveryReferenceNo");
        deliveryAddress      = document.querySelector("#deliveryAddress");

        // Print view modal
        printViewDeliveryModalElement = document.querySelector("#DeliveryViewModal");

        // Form fields
        deliveryForm      = document.querySelector("#formDelivery");
        createdDateEl     = document.querySelector("#createdDate");
        updateDateEl      = document.querySelector("#deliveryUpdateDate");
        deliveryRegNoEl    = document.querySelector("#deliveryRegNo");
        dateDelivered      = document.querySelector("#dateDelivered");

        // Form title toggles
        titleEditHide = document.querySelector("#formTitleEdit");
        titleNewHide  = document.querySelector("#formTitleNew");

        // Buttons
        submitElement  = document.querySelector("#buttonDeliverySubmit");
        updateElement  = document.querySelector("#buttonDeliveryUpdate");
        clearElement   = document.querySelector("#buttonDeliveryClear");
        printElement   = document.querySelector("#buttonDeliveryPrint");
        deleteElement  = document.querySelector("#buttonDeliveryDelete");
    };

    // ============================================================
    // STATE
    // ============================================================

    let deliveryList = [];

    let delivery    = {};
    let oldDelivery = {};
    let formMode    = "ADD";

    // Not persisted on the entity itself — only used client-side to know
    // which reference list / which FK (payment / supermarketorder /
    // compostSale) is currently active.
    let currentSaleType = "";

    // Sale type options. Each maps to one nullable FK on the Delivery
    // entity, so only one of payment / supermarketorder / compostSale
    // is ever set at a time.
    const SALE_TYPES = [
        { code: "PAYMENT",            label: "Payment (Farmer / Supplier)", endpoint: "/payment/alldata/deliveryrequested" },
        { code: "SUPERMARKET_ORDER",  label: "Supermarket Order",           endpoint: "/supermarketorder/alldata/deliveryrequested" },
        { code: "COMPOST_SALE",       label: "Compost Sale",                endpoint: "/compostsale/alldata/deliveryrequested" }
    ];

    // ============================================================
    // EVENT LISTENERS
    // ============================================================

    const initializeEventListeners = () => {
        selectSaleType.addEventListener("change",       validateSaleType);
        selectReference.addEventListener("change",      validateReference);
        deliveryAddress.addEventListener("input",       validateAddress);
        dateDelivered.addEventListener("input",         validateDeliverDate);
        selectDeliveryStatus.addEventListener("change", validateDeliveryStatus);

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
        delivery     = {};
        oldDelivery  = {};
        formMode     = "ADD";
        currentSaleType = "";

        deliveryForm.reset();
        removeValidationStyles(deliveryForm);

        deliveryRegNoEl.textContent = "-";
        updateDateEl.textContent    = "-";

        let dateTime = getTodayDateTime();
        let date = dateTime.slice(0, 10);
        let time = dateTime.slice(11, 19);
        createdDateEl.textContent = date + " " + time;

        // Reset dropdowns
        generateSaleTypeSelect();
        generateDeliveryStatusSelect();

        selectSaleType.value = "";
        resetReferenceSelect();
        selectDeliveryStatus.value = "";

        // Reset auto-filled fields
        deliveryCustomer.value     = "";
        deliveryReferenceNo.value  = "";
        deliveryAddress.value      = "";

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
        loadDeliveryStatusList();
        deliveryList = getServiceRequest("/delivery/alldata/selected");
    };

    // ============================================================
    // REFRESH TABLE
    // ============================================================

    const refreshDeliveryTable = () => {
        if ($.fn.DataTable.isDataTable("#tableDelivery")) {
            $("#tableDelivery").DataTable().destroy();
        }

        tableBody.innerHTML = "";

        let displayProperty = [
            { propertyName: "deliverynumber",         dataType: "string"   },
            { propertyName: getDeliverySaleType,       dataType: "function" },
            { propertyName: getDeliveryReferenceNo,    dataType: "function" },
            { propertyName: getDeliveryCustomer,       dataType: "function" },
            { propertyName: "deliveryaddress",         dataType: "string"   },
            { propertyName: getDeliveryDeliverDate,    dataType: "function" },
            { propertyName: getDeliveryStatus,         dataType: "function" },
        ];

        fillDataIntoTableThree(
            tableBody,
            deliveryList,
            displayProperty,
            refillDeliveryForm
        );

        $("#tableDelivery").DataTable();
    };

    // ---- table display helpers -------------------------------------

    const getDeliverySaleType = (ob) => {
        if (ob.payment)          return "Payment";
        if (ob.supermarketorder) return "Supermarket Order";
        if (ob.compostSale)      return "Compost Sale";
        return "-";
    };

    const getDeliveryReferenceNo = (ob) => {
        return ob.payment?.paymentnumber
            || ob.supermarketorder?.ordernumber
            || ob.compostSale?.salenumber
            || ob.payment?.id
            || ob.supermarketorder?.id
            || ob.compostSale?.id
            || "-";
    };

    const getDeliveryCustomer = (ob) => {
        return ob.payment?.farmer?.fullname
            || ob.payment?.supplier?.name
            || ob.supermarketorder?.customer?.fullname
            || ob.supermarketorder?.supermarket?.name
            || ob.compostSale?.buyer?.fullname
            || ob.compostSale?.customer?.name
            || "-";
    };

    const getDeliveryDeliverDate = (ob) => {
        return ob.deliverdate || "-";
    };

    const getDeliveryStatus = (ob) => {
        if (ob.deliverystatus === "Scheduled")  return '<p class="p-1 bg-info">Scheduled</p>';
        if (ob.deliverystatus === "InTransit")  return '<p class="p-1 bg-warning">In Transit</p>';
        if (ob.deliverystatus === "Delivered")  return '<p class="p-1 bg-success ">Delivered</p>';
        if (ob.deliverystatus === "Failed")     return '<p class="p-1 bg-danger ">Failed</p>';
        if (ob.deliverystatus === "Cancelled")  return '<p class="p-1 bg-secondary ">Cancelled</p>';
        return ob.deliverystatus || "-";
    };

    // ============================================================
    // DROPDOWN DATA — SALE TYPE
    // ============================================================

    const generateSaleTypeSelect = () => {
        selectSaleType.innerHTML =
            '<option value="" selected disabled>Select Sale Type</option>';

        SALE_TYPES.forEach((t) => {
            const option = document.createElement("option");
            option.value     = t.code;
            option.innerText = t.label;
            selectSaleType.appendChild(option);
        });
    };

    const resetReferenceSelect = () => {
        selectReference.innerHTML =
            '<option value="" selected disabled>Select Sale Type First</option>';
        selectReference.disabled = true;
        clearAutoFilledFields();
    };

    const validateSaleType = () => {
        const code = selectSaleType.value;

        if (!code) {
            currentSaleType = "";
            setInvalid(selectSaleType);
            resetReferenceSelect();
            return;
        }

        currentSaleType = code;

        // Clear whichever FK(s) don't match the newly chosen sale type
        delivery.payment          = null;
        delivery.supermarketorder = null;
        delivery.compostSale      = null;

        loadReferenceListFor(code);
        setValid(selectSaleType);
    };

    // ============================================================
    // DROPDOWN DATA — REFERENCE (payment / order / sale)
    // ============================================================

    let referenceList = [];

    const loadReferenceListFor = (code) => {
        const type = SALE_TYPES.find((t) => t.code === code);
        referenceList = type ? getServiceRequest(type.endpoint) : [];

        selectReference.innerHTML =
            '<option value="" selected disabled>Select Reference</option>';
        selectReference.disabled = false;

        referenceList.forEach((item) => {
            const option = document.createElement("option");
            option.value     = JSON.stringify(item);
            option.innerText = getReferenceLabel(code, item);
            selectReference.appendChild(option);
        });

        selectReference.value = "";
        clearAutoFilledFields();
    };

    const getReferenceLabel = (code, item) => {
        if (code === "PAYMENT") {
            return item.paymentnumber || ("Payment #" + item.id);
        }
        if (code === "SUPERMARKET_ORDER") {
            // TODO: confirm actual field name on SupermarketOrder entity
            return item.ordernumber || ("Order #" + item.id);
        }
        if (code === "COMPOST_SALE") {
            // TODO: confirm actual field name on CompostSale entity
            return item.salenumber || ("Sale #" + item.id);
        }
        return "#" + item.id;
    };

    const validateReference = () => {
        const value = selectReference.value;

        if (!value) {
            setInvalid(selectReference);
            clearAutoFilledFields();
            return;
        }

        const parsed = JSON.parse(value);

        // Assign to the one matching FK on the entity, keep the others null
        delivery.payment          = currentSaleType === "PAYMENT"           ? parsed : null;
        delivery.supermarketorder = currentSaleType === "SUPERMARKET_ORDER" ? parsed : null;
        delivery.compostSale      = currentSaleType === "COMPOST_SALE"      ? parsed : null;

        autoFillFromSource(currentSaleType, parsed);

        const changed = formMode === "EDIT" && referenceChangedFromOld();
        if (changed) {
            setUpdated(selectReference);
        } else {
            setValid(selectReference);
        }
    };

    const referenceChangedFromOld = () => {
        return JSON.stringify(delivery.payment)          !== JSON.stringify(oldDelivery.payment)
            || JSON.stringify(delivery.supermarketorder) !== JSON.stringify(oldDelivery.supermarketorder)
            || JSON.stringify(delivery.compostSale)      !== JSON.stringify(oldDelivery.compostSale);
    };

    // Auto-fill customer / reference no / delivery address from whichever
    // sale record was picked. Field-name fallbacks for SupermarketOrder and
    // CompostSale are best-guesses — adjust once those entities are shared.
    const autoFillFromSource = (code, source) => {
        let customerName = "-";
        let refNumber    = "-";
        let address      = "";

        if (code === "PAYMENT") {
            customerName = source.farmer?.fullname || source.supplier?.name || "Guest";
            refNumber    = source.paymentnumber || source.id;
            address      = source.quotation?.deliveryaddress || source.deliveryaddress || "";
        } else if (code === "SUPERMARKET_ORDER") {
            // TODO: confirm actual field names on SupermarketOrder entity
            customerName = source.customer?.fullname || source.supermarket?.name || "Guest";
            refNumber    = source.ordernumber || source.id;
            address      = source.deliveryaddress || source.supermarket?.address || "";
        } else if (code === "COMPOST_SALE") {
            // TODO: confirm actual field names on CompostSale entity
            customerName = source.buyer?.fullname || source.customer?.name || "Guest";
            refNumber    = source.salenumber || source.id;
            address      = source.deliveryaddress || "";
        }

        deliveryCustomer.value    = customerName;
        deliveryReferenceNo.value = refNumber;

        // Only pre-fill the address if the user hasn't already typed one
        // in this session (e.g. switching reference after editing address).
        deliveryAddress.value  = address;
        delivery.deliveryaddress = address;
        setValid(deliveryAddress);
    };

    const clearAutoFilledFields = () => {
        deliveryCustomer.value     = "";
        deliveryReferenceNo.value  = "";
        deliveryAddress.value      = "";
        delivery.deliveryaddress   = null;
    };

    // ============================================================
    // DELIVERY ADDRESS — own field on the entity, editable
    // ============================================================

    const validateAddress = () => {
        const value = deliveryAddress.value.trim();

        if (!value) {
            delivery.deliveryaddress = null;
            setInvalid(deliveryAddress);
            return;
        }

        delivery.deliveryaddress = value;

        if (formMode === "EDIT" && value !== oldDelivery.deliveryaddress) {
            setUpdated(deliveryAddress);
        } else {
            setValid(deliveryAddress);
        }
    };

    // ============================================================
    // DROPDOWN DATA — DELIVERY STATUS (DeliveryStatus enum)
    // ============================================================

    let deliveryStatusList = [];

    const loadDeliveryStatusList = () => {
        // TODO: confirm these match the actual DeliveryStatus enum values
        deliveryStatusList = [
            { name: "Scheduled"  },
            { name: "InTransit"  },
            { name: "Delivered"  },
            { name: "Failed"     },
            { name: "Cancelled"  }
        ];
    };

    const generateDeliveryStatusSelect = () => {
        fillDataIntoSelect(
            selectDeliveryStatus,
            "Select Status",
            deliveryStatusList,
            "name"
        );
    };

    const validateDeliveryStatus = () => {
        const value = selectDeliveryStatus.value;

        if (!value) {
            delivery.deliverystatus = null;
            setInvalid(selectDeliveryStatus);
            return;
        }

        const parsed = JSON.parse(value);
        delivery.deliverystatus = parsed.name;

        if (formMode === "EDIT" && delivery.deliverystatus !== oldDelivery.deliverystatus) {
            setUpdated(selectDeliveryStatus);
        } else {
            setValid(selectDeliveryStatus);
        }
    };

    // ============================================================
    // VALIDATION — DELIVER DATE
    // ============================================================

    const validateDeliverDate = () => {
        const value = dateDelivered.value;

        if (!value) {
            delivery.deliverdate = null;
            dateDelivered.classList.remove("is-valid", "is-invalid", "is-blue");
            return;
        }

        delivery.deliverdate = value;

        if (formMode === "EDIT" && value !== oldDelivery.deliverdate) {
            setUpdated(dateDelivered);
        } else {
            setValid(dateDelivered);
        }
    };

    // ============================================================
    // VALIDATION STYLE HELPERS
    // ============================================================

    const setValid = (element) => {
        element.classList.add("is-valid");
        element.classList.remove("is-invalid", "is-blue");
    };

    const setInvalid = (element) => {
        element.classList.add("is-invalid");
        element.classList.remove("is-valid", "is-blue");
    };

    const setUpdated = (element) => {
        element.classList.add("is-blue");
        element.classList.remove("is-valid", "is-invalid");
    };

    // ============================================================
    // REFILL FORM — EDIT MODE
    // ============================================================

    const refillDeliveryForm = (dataOb) => {
        removeValidationStyles(deliveryForm);

        let myModal = new bootstrap.Modal(deliveryFormModalElement, {});
        formMode    = "EDIT";

        delivery    = getServiceRequest("/delivery/byid/" + dataOb.id);
        oldDelivery = JSON.parse(JSON.stringify(delivery));

        // Meta
        let dateTimeEdit = delivery.addeddatetime;
        let dateEdit = dateTimeEdit.slice(0, 10);
        let timeEdit = dateTimeEdit.slice(11, 19);
        createdDateEl.textContent = dateEdit + " " + timeEdit;

        if (!delivery.updateddatetime) {
            updateDateEl.textContent = "-";
        } else {
            let dateTimeUpdate = delivery.updateddatetime;
            let dateUpdate = dateTimeUpdate.slice(0, 10);
            let timeUpdate = dateTimeUpdate.slice(11, 19);
            updateDateEl.textContent = dateUpdate + " " + timeUpdate;
        }

        deliveryRegNoEl.textContent = delivery.deliverynumber || "-";

        // Determine sale type from which FK is populated
        generateSaleTypeSelect();
        if (delivery.payment) {
            currentSaleType = "PAYMENT";
        } else if (delivery.supermarketorder) {
            currentSaleType = "SUPERMARKET_ORDER";
        } else if (delivery.compostSale) {
            currentSaleType = "COMPOST_SALE";
        } else {
            currentSaleType = "";
        }
        selectSaleType.value = currentSaleType;

        // Reference list + selection
        if (currentSaleType) {
            loadReferenceListFor(currentSaleType);
            const source = delivery.payment || delivery.supermarketorder || delivery.compostSale;
            selectReference.value = JSON.stringify(source);
            autoFillFromSource(currentSaleType, source);
        } else {
            resetReferenceSelect();
        }

        // Delivery address (own field — may have been edited from the source's)
        deliveryAddress.value   = delivery.deliveryaddress || "";
        dateDelivered.value     = delivery.deliverdate     || "";

        // Delivery status
        generateDeliveryStatusSelect();
        if (delivery.deliverystatus) {
            selectDeliveryStatus.value = JSON.stringify({ name: delivery.deliverystatus });
        }

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
    // FORM ERROR CHECK
    // ============================================================

    const checkFormErrors = () => {
        let errors = [];

        if (!delivery.payment && !delivery.supermarketorder && !delivery.compostSale) {
            errors.push("Sale Type / Reference has an error. Please check again.");
        }
        if (!delivery.deliveryaddress)  errors.push("Delivery Address has an error. Please check again.");
        if (!delivery.deliverystatus)   errors.push("Delivery Status has an error. Please check again.");

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

        console.log("Submitting delivery:", delivery);

        let response = getHTTPServiceRequest("/delivery/save", "POST", delivery);

        if (response === "OK") {
            Notiflix.Notify.success("Saved successfully");
            $("#DeliveryFormModal").modal("hide");
            loadInitialData();
            refreshDeliveryTable();
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

        console.log("Updating delivery:", delivery);

        let response = getHTTPServiceRequest("/delivery/update", "PUT", delivery);

        if (response === "OK") {
            updateDateEl.textContent = new Date().toLocaleString();
            Notiflix.Notify.success("Updated successfully");
            $("#DeliveryFormModal").modal("hide");
            loadInitialData();
            refreshDeliveryTable();
            initializeForm();
        } else {
            Notiflix.Notify.warning("Update failed: " + response);
        }
    };

    const handleDelete = () => {
        Notiflix.Confirm.show(
            "Delete Delivery",
            "Are you sure you want to delete this delivery record?",
            "Yes, Delete",
            "Cancel",
            () => {
                let response = getHTTPServiceRequest(
                    "/delivery/" + delivery.id,
                    "DELETE",
                    null
                );

                if (response !== "AJAX error") {
                    Notiflix.Notify.success("Deleted successfully");
                    $("#DeliveryFormModal").modal("hide");
                    loadInitialData();
                    refreshDeliveryTable();
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

    const viewDeliveryRecord = (dataOb) => {
        document.querySelector("#tdDeliveryId").innerText       = dataOb.deliverynumber || "-";
        document.querySelector("#tdSaleType").innerText         = getDeliverySaleType(dataOb);
        document.querySelector("#tdReferenceNo").innerText      = getDeliveryReferenceNo(dataOb);
        document.querySelector("#tdDeliveryCustomer").innerText = getDeliveryCustomer(dataOb);
        document.querySelector("#tdDeliveryAddress").innerText  = dataOb.deliveryaddress || "-";
        document.querySelector("#tdDeliverDate").innerText      = dataOb.deliverdate || "-";
        document.querySelector("#tdDeliveryStatus").innerText   = dataOb.deliverystatus || "-";

        const editModalContent = deliveryFormModalElement.querySelector(".modal-content");
        editModalContent.classList.add("blurred");

        const viewModal = new bootstrap.Modal(printViewDeliveryModalElement);
        viewModal.show();

        printViewDeliveryModalElement.addEventListener(
            "hidden.bs.modal",
            () => {
                editModalContent.classList.remove("blurred");
            },
            { once: true }
        );
    };

    const handlePrint = () => {
        viewDeliveryRecord(delivery);
    };

    const printDeliveryRecord = () => {
        let newWindow = window.open();
        newWindow.document.write(
            "<html><head>" +
            "<title>Delivery Details</title>" +
            '<link rel="stylesheet" href="/css/bootstrap-5.3.3/css/bootstrap.min.css">' +
            "</head><body>" +
            document.querySelector("#divCardPrintDelivery").outerHTML +
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
        refreshDeliveryTable();
    };
    window.initPage();
    window.printDeliverRecord = printDeliveryRecord;
})();