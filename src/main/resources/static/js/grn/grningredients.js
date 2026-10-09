// ============================================================
// DOM ELEMENT REFERENCES
// ============================================================
(function () {
    let grnIngredientAddFormModalElement
        , tableBody
        , selectPurchaseOrder
        , selectGRNStatus
        , printViewGrnIngredientModalElement
        , grnIngredientForm
        , createDateElement
        , updateDateElement
        , grnNoElement
        , dateReceivedElement
        , userIdElement
        , textNoteElement
        , titleEditHide
        , lineItemsBody
        , grandTotalElement
        , lineItemTemplate
        , updateElement
        , clearElement
        , printElement;
    const queryElements = () => {

        grnIngredientAddFormModalElement = document.querySelector("#GrnIngredientAddForm");

// Table body
         tableBody = document.querySelector("#tableBodyId");

// Dropdowns
         selectPurchaseOrder = document.querySelector("#selectPurchaseOrder");
         selectGRNStatus = document.querySelector("#selectGRNStatus");

// Print view modal
         printViewGrnIngredientModalElement = document.querySelector("#GrnIngredientViewModal");

// Form fields
         grnIngredientForm = document.querySelector("#formGrnIngredient");
         createDateElement = document.querySelector("#createDate");
         updateDateElement = document.querySelector("#updateDate");
         grnNoElement = document.querySelector("#GrnNo");
         dateReceivedElement = document.querySelector("#dateReceivedDate");
         userIdElement = document.querySelector("#userId");
         textNoteElement = document.querySelector("#textNote");

// Form title
         titleEditHide = document.querySelector("#formTitleEdit");

// Line items
         lineItemsBody = document.querySelector("#lineItemsBody");
         grandTotalElement = document.querySelector("#grandTotal");
         lineItemTemplate = document.querySelector("#lineItemTemplate");

// Buttons
         updateElement = document.querySelector("#buttonUpdate");
         clearElement = document.querySelector("#buttonClear");
         printElement = document.querySelector("#buttonPrint");

    }
// ============================================================
// STATE
// ============================================================

    let grnIngredientList = [];
    let grnIngredient     = {};
    let oldGrnIngredient  = {};
    let formMode          = "ADD";
    let lineItemCount     = 0;




// ============================================================
// EVENT LISTENERS
// ============================================================
// NOTE: this form has no "Add New" trigger and no submit/POST path —
// it is purely EDIT, reached only via refillGrnIngredientForm() (row
// click), same pattern as the compost price / crop price modules.
// userIdElement is read-only and fully managed by refillGrnIngredientForm()
// (display) and handleUpdate() (reassignment) — no manual input
// validation on it is needed anymore.

    const initializeEventListeners = () => {
        dateReceivedElement.addEventListener("input",  validateReceivedDate);
        selectGRNStatus.addEventListener("change",     validateGRNStatus);
        textNoteElement.addEventListener("input",      validateNote);

        updateElement.addEventListener("click", handleUpdate);
        clearElement.addEventListener("click",  handleClear);
        printElement.addEventListener("click",  handlePrint);
    };


// ============================================================
// INITIALIZE FORM
// ============================================================

    const initializeForm = () => {
        grnIngredient    = {};
        oldGrnIngredient = {};
        formMode         = "ADD";
        lineItemCount    = 0;

        grnIngredientForm.reset();
        removeValidationStyles(grnIngredientForm);

        grnNoElement.textContent      = "-";
        updateDateElement.textContent = "-";

        let dateTime = getTodayDateTime();
        let date = dateTime.slice(0, 10);
        let time = dateTime.slice(11, 19);
        createDateElement.textContent = date + " " + time;

        selectPurchaseOrder.value    = "";
        selectPurchaseOrder.readOnly = true;
        selectGRNStatus.value        = "";

        lineItemsBody.innerHTML       = "";
        grandTotalElement.textContent = "0.00";

        updateElement.classList.add("d-none");
        printElement.classList.add("d-none");
    };


// ============================================================
// LOAD INITIAL DATA
// ============================================================

    const loadInitialData = () => {
        grnIngredientList = getServiceRequest("/grn/grningredients/alldata/selected");
    };


// ============================================================
// REFRESH TABLE
// ============================================================

    const refreshGrnIngredientTable = () => {
        if ($.fn.DataTable.isDataTable("#tableGrnIngredient")) {
            $("#tableGrnIngredient").DataTable().destroy();
        }

        tableBody.innerHTML = "";

        let displayProperty = [
            { propertyName: getGrnNumber,       dataType: "function" },
            { propertyName: getPurchaseOrderId, dataType: "function" },
            { propertyName: getReceivedDate,    dataType: "function" },
            { propertyName: getUser,            dataType: "function" },
            { propertyName: getStatusDisplay,   dataType: "function" },
        ];

        fillDataIntoTableThree(
            tableBody,
            grnIngredientList,
            displayProperty,
            refillGrnIngredientForm
        );

        $("#tableGrnIngredient").DataTable();
    };

// Table display helpers
    const getGrnNumber       = (ob) => ob.grningredientnumber || ob.id || "-";
    const getPurchaseOrderId = (ob) => ob.purchaseOrder?.ponumber || ob.purchaseOrder?.id || "-";
    const getUser            = (ob) => ob.user?.username || ob.user?.id || "-";

    const getReceivedDate = (ob) => {
        if (!ob.recieveddate) return "-";
        return ob.recieveddate.slice(0, 16).replace("T", " ");
    };

    const getStatusDisplay = (ob) => {
        if (ob.grnstatus === "Complete") return '<p class="p-1 bg-success">Complete</p>';
        if (ob.grnstatus === "Partial")  return '<p class="p-1 bg-secondary">Partial</p>';
        if (ob.grnstatus === "Rejected") return '<p class="p-1 bg-danger">Rejected</p>';
        if (ob.grnstatus === "Pending")  return '<p class="p-1 bg-warning">Pending</p>';
        return ob.grnstatus || "-";
    };


// ============================================================
// VALIDATION — MAIN FIELDS
// ============================================================

    const validateReceivedDate = () => {
        const value = dateReceivedElement.value;
        if (!value) {
            grnIngredient.recieveddate = null;
            setInvalid(dateReceivedElement);
            return;
        }
        grnIngredient.recieveddate = value;
        if (formMode === "EDIT" && value !== oldGrnIngredient.recieveddate) {
            setUpdated(dateReceivedElement);
        } else {
            setValid(dateReceivedElement);
        }
    };

    const validateGRNStatus = () => {
        const value = selectGRNStatus.value;
        if (!value) {
            grnIngredient.grnstatus = null;
            setInvalid(selectGRNStatus);
            return;
        }
        grnIngredient.grnstatus = value;
        if (formMode === "EDIT" && value !== oldGrnIngredient.grnstatus) {
            setUpdated(selectGRNStatus);
        } else {
            setValid(selectGRNStatus);
        }
    };

    const validateNote = () => {
        grnIngredient.note = textNoteElement.value.trim() || null;
    };


// ============================================================
// LINE ITEM HELPERS
// ============================================================

    const reNumberLineRows = () => {
        const rows = lineItemsBody.querySelectorAll(".line-item-row");
        rows.forEach((row, i) => {
            row.querySelector(".row-num").textContent = i + 1;
        });
        lineItemCount = rows.length;
    };

// Grand total is purely a client-side display sum of each row's line
// total (qty x price). The header's real totalprice is recalculated
// and persisted server-side on update — see
// GrnIngredientsController#updateData.
    const calcGrandTotal = () => {
        const rows = lineItemsBody.querySelectorAll(".line-item-row");
        let grand = 0;
        rows.forEach((row) => {
            grand += parseFloat(row.querySelector(".inp-linetotal").value) || 0;
        });
        grandTotalElement.textContent = grand.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };


// ============================================================
// COLLECT LINE ITEMS FROM DOM
// ============================================================

// GrnIngredientsItem no longer has a totalprice field — only
// receivedqty and lineprice are sent per item. The line total shown
// in the UI is a derived display value only, computed live from
// those two fields.
    const collectLineItems = () => {
        const rows  = lineItemsBody.querySelectorAll(".line-item-row");
        const items = [];

        rows.forEach((row) => {
            if (!row.dataset.poitemid) return;

            const condVal = row.querySelector(".sel-condition").value;

            items.push({
                purchaseOrderItem: { id: parseInt(row.dataset.poitemid) },  // ← only send id
                orderedqty:        parseFloat(row.querySelector(".inp-orderqty").value) || 0,
                receivedqty:       parseFloat(row.querySelector(".inp-receivedqty").value) || 0,
                lineprice:         parseFloat(row.querySelector(".inp-unitprice").value)   || 0,
                condition:         condVal === "1" ? true : condVal === "0" ? false : null,
                note:              row.querySelector(".inp-note").value.trim() || null,
            });
        });

        return items;
    };
// ============================================================
// RENDER LINE ITEMS INTO DOM (EDIT refill)
// ============================================================

    const renderLineItemsFromData = (items) => {
        lineItemsBody.innerHTML = "";
        lineItemCount           = 0;

        items.forEach((item) => {
            lineItemCount++;

            const clone = lineItemTemplate.content.cloneNode(true);
            const row   = clone.querySelector(".line-item-row");

            // Store PO item data on the row for collectLineItems to read back
            row.dataset.poitemid   = item.purchaseOrderItem?.id   || "";
            row.dataset.poitemjson = JSON.stringify(item.purchaseOrderItem || {});

            // Row number
            row.querySelector(".row-num").textContent = lineItemCount;

            // Ingredient name — readonly, filled from API data
            row.querySelector(".inp-ingredient").value =
                item.purchaseOrderItem?.ingredient?.name || "-";

            // Numeric fields
            row.querySelector(".inp-orderqty").value    = item.orderedqty  ?? "";
            row.querySelector(".inp-receivedqty").value = item.receivedqty ?? "";
            row.querySelector(".inp-unitprice").value   = item.lineprice   ?? "";
            row.querySelector(".inp-note").value        = item.note        || "";

            // Line total is derived, not stored — GrnIngredientsItem has no
            // totalprice field anymore. Compute it up front from whatever
            // receivedqty/lineprice came back from the server.
            const initialQty   = parseFloat(item.receivedqty) || 0;
            const initialPrice = parseFloat(item.lineprice)   || 0;
            row.querySelector(".inp-linetotal").value = (initialQty * initialPrice).toFixed(2);

            // Condition — null stays on placeholder, true=Good, false=Damaged
            const conditionSelect = row.querySelector(".sel-condition");
            if (item.condition === null || item.condition === undefined) {
                conditionSelect.value = "";
            } else {
                conditionSelect.value = item.condition ? "1" : "0";
            }

            // Wire calc events
            const receivedQtyInput = row.querySelector(".inp-receivedqty");
            const unitPriceInput   = row.querySelector(".inp-unitprice");
            const lineTotalInput   = row.querySelector(".inp-linetotal");

            const calcRow = () => {
                const qty   = parseFloat(receivedQtyInput.value) || 0;
                const price = parseFloat(unitPriceInput.value)   || 0;
                lineTotalInput.value = (qty * price).toFixed(2);
                calcGrandTotal();
            };

            receivedQtyInput.addEventListener("input", calcRow);
            unitPriceInput.addEventListener("input",   calcRow);

            // Remove row button
            row.querySelector(".btn-remove-row").addEventListener("click", () => {
                row.remove();
                reNumberLineRows();
                calcGrandTotal();
            });

            lineItemsBody.appendChild(clone);
        });

        calcGrandTotal();
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

    const refillGrnIngredientForm = (dataOb) => {
        removeValidationStyles(grnIngredientForm);

        let myModal = new bootstrap.Modal(grnIngredientAddFormModalElement, {});
        formMode = "EDIT";

        grnIngredient    = getServiceRequest("/grn/grningredients/byid/" + dataOb.id);
        oldGrnIngredient = JSON.parse(JSON.stringify(grnIngredient));

        // Meta dates
        if (grnIngredient.addeddatetime) {
            let dt = grnIngredient.addeddatetime;
            createDateElement.textContent = dt.slice(0, 10) + " " + dt.slice(11, 19);
        } else {
            createDateElement.textContent = "-";
        }

        if (grnIngredient.updateddatetime) {
            let dt = grnIngredient.updateddatetime;
            updateDateElement.textContent = dt.slice(0, 10) + " " + dt.slice(11, 19);
        } else {
            updateDateElement.textContent = "-";
        }

        grnNoElement.textContent = grnIngredient.grningredientnumber || grnIngredient.id || "-";

        // Purchase Order — readonly text input
        if (grnIngredient.purchaseOrder) {
            selectPurchaseOrder.value    = grnIngredient.purchaseOrder.ponumber || grnIngredient.purchaseOrder.id || "";
            selectPurchaseOrder.readOnly = true;
        }

        // Received date
        dateReceivedElement.value = grnIngredient.recieveddate
            ? grnIngredient.recieveddate.slice(0, 16)
            : "";

        // User field is DISPLAY ONLY here — shows whoever is currently
        // stamped on the record (last updater, or creator if never
        // updated). We do NOT touch grnIngredient.user on open. It only
        // gets reassigned to the current session user inside
        // handleUpdate(), and only if the record is actually changed and
        // saved — see hasGrnIngredientChanged(). Opening or cancelling
        // never reassigns it.
        userIdElement.value    = grnIngredient.user?.username || grnIngredient.user?.id || "-";
        userIdElement.readOnly = true;

        // GRN Status
        selectGRNStatus.value = grnIngredient.grnstatus || "";

        // Note
        textNoteElement.value = grnIngredient.note || "";

        // Line items
        const items = grnIngredient.grnIngredientsItems || [];
        renderLineItemsFromData(items);
        // renderLineItemsFromData() -> calcGrandTotal() gives the display
        // total; grnIngredient.totalprice (the persisted header value)
        // should match it exactly since both are derived from the same
        // items.

        // Button visibility
        updateElement.classList.remove("d-none");
        printElement.classList.remove("d-none");

        myModal.show();
    };


// ============================================================
// CHANGE DETECTION — used to decide whether the "last updated by"
// user should be overwritten with the currently logged-in user.
// ============================================================

// Normalizes GRN line items to a comparable, order-independent shape.
    const normalizeGrnIngredientLineItems = (items) => {
        return (items || [])
            .map(item => ({
                id: item.purchaseOrderItem?.id,
                receivedqty: Number(item.receivedqty),
                lineprice: Number(item.lineprice),
                condition: item.condition === undefined ? null : item.condition,
                note: item.note || null
            }))
            .sort((a, b) => (a.id > b.id ? 1 : a.id < b.id ? -1 : 0));
    };

// Returns true if received date, GRN status, note, or line items
// differ from the original snapshot taken when the record was
// opened for edit.
    const hasGrnIngredientChanged = () => {
        if (grnIngredient.recieveddate !== oldGrnIngredient.recieveddate) return true;
        if (grnIngredient.grnstatus !== oldGrnIngredient.grnstatus) return true;
        if ((grnIngredient.note || null) !== (oldGrnIngredient.note || null)) return true;

        const itemsChanged = JSON.stringify(normalizeGrnIngredientLineItems(collectLineItems()))
            !== JSON.stringify(normalizeGrnIngredientLineItems(oldGrnIngredient.grnIngredientsItems));
        if (itemsChanged) return true;

        return false;
    };


// ============================================================
// FORM ERROR CHECK
// ============================================================

    const checkFormErrors = () => {
        let errors = [];

        if (!grnIngredient.recieveddate) errors.push("Received Date & Time is required.");
        if (!grnIngredient.user)         errors.push("User ID is required.");
        if (!grnIngredient.grnstatus)    errors.push("GRN Status is required.");

        const items = collectLineItems();
        if (items.length === 0) {
            errors.push("At least one GRN line item must be present.");
        } else {
            items.forEach((item, i) => {
                if (item.receivedqty <= 0) errors.push(`Row ${i + 1}: Received Qty must be greater than 0.`);
                if (item.lineprice   <= 0) errors.push(`Row ${i + 1}: Unit Price must be greater than 0.`);
            });
        }

        return errors;
    };


// ============================================================
// BUTTON HANDLERS
// ============================================================

    const handleUpdate = () => {
        const errors = checkFormErrors();
        if (errors.length > 0) {
            Notiflix.Notify.warning(errors.join(" | "));
            return;
        }

        // Only reassign "who touched this record" if something actually
        // changed. Records saved without any real edit keep whoever was
        // already stamped on them.
        if (hasGrnIngredientChanged()) {
            loadLoggedInUserInto(grnIngredient, userIdElement);
        }

        // Send line items under `grnIngredientsItems` to match the backend
        // entity property. No totalprice is sent per item —
        // GrnIngredientsItem doesn't have that field anymore; the server
        // recomputes and persists the GRN's total on the header
        // (GrnIngredients.totalprice) from receivedqty x lineprice on save.
        grnIngredient.grnIngredientsItems = collectLineItems();

        let response = getHTTPServiceRequest("/grn/grningredients/update", "PUT", grnIngredient);

        if (response === "OK") {
            updateDateElement.textContent = new Date().toLocaleString();
            Notiflix.Notify.success("Updated successfully");
            $("#GrnIngredientAddForm").modal("hide");
            loadInitialData();
            refreshGrnIngredientTable();
            initializeForm();
        } else {
            Notiflix.Notify.warning("Update failed: " + response);
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
// PRINT / VIEW
// ============================================================

    const viewGrnIngredientRecord = (dataOb) => {
        document.querySelector("#tdGrnNo").innerText =
            dataOb.grningredientnumber || dataOb.id || "-";
        document.querySelector("#tdPurchaseOrder").innerText =
            dataOb.purchaseOrder?.ponumber || dataOb.purchaseOrder?.id || "-";
        document.querySelector("#tdCreatedDate").innerText = dataOb.addeddatetime
            ? dataOb.addeddatetime.slice(0, 16).replace("T", " ")
            : "-";
        document.querySelector("#tdReceivedDate").innerText = dataOb.recieveddate
            ? dataOb.recieveddate.slice(0, 16).replace("T", " ")
            : "-";
        document.querySelector("#tdUser").innerText      = dataOb.user?.username || dataOb.user?.id || "-";
        document.querySelector("#tdGRNStatus").innerText = dataOb.grnstatus || "-";
        document.querySelector("#tdNote").innerText      = dataOb.note || "-";

        // Fill print line items table
        const printBody = document.querySelector("#tablePrintLineItemsBody");
        printBody.innerHTML = "";
        let grandTotal = 0;

        // Per-item total is derived (receivedqty x lineprice) since
        // GrnIngredientsItem no longer stores one.
        const items = dataOb.grnIngredientsItems || collectLineItems();
        items.forEach((item, index) => {
            const lineTotal = (item.receivedqty || 0) * (item.lineprice || 0);
            grandTotal += lineTotal;
            const tr = document.createElement("tr");
            tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.purchaseOrderItem?.ingredient?.name || "-"}</td>
            <td>${item.orderedqty  ?? "-"}</td>
            <td>${item.receivedqty ?? "-"}</td>
            <td>${item.lineprice   ?? "-"}</td>
            <td>${lineTotal.toFixed(2)}</td>
            <td>${item.condition === true ? "Good" : item.condition === false ? "Damaged" : "-"}</td>
            <td>${item.note || "-"}</td>
        `;
            printBody.appendChild(tr);
        });

        // Header total: prefer the persisted GrnIngredients.totalprice when
        // available (it's the authoritative, server-saved value); fall
        // back to the sum just computed above.
        const headerTotal = dataOb.totalprice ?? grandTotal;
        document.querySelector("#printGrandTotal").textContent = headerTotal.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

        const editModalContent = grnIngredientAddFormModalElement.querySelector(".modal-content");
        editModalContent.classList.add("blurred");

        const viewModal = new bootstrap.Modal(printViewGrnIngredientModalElement);
        viewModal.show();

        printViewGrnIngredientModalElement.addEventListener(
            "hidden.bs.modal",
            () => { editModalContent.classList.remove("blurred"); },
            { once: true }
        );
    };

    const handlePrint = () => {
        viewGrnIngredientRecord(grnIngredient);
    };

    const printGrnIngredientRecord = () => {
        let newWindow = window.open();
        newWindow.document.write(
            "<html><head>" +
            "<title>Ingredient GRN Details</title>" +
            '<link rel="stylesheet" href="/css/bootstrap-5.3.3/css/bootstrap.min.css">' +
            "</head><body>" +
            document.querySelector("#divCardPrintGrnIngredient").outerHTML +
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
    refreshGrnIngredientTable();}
window.initPage();

    window.printGrnIngredientRecord = printGrnIngredientRecord;

})();