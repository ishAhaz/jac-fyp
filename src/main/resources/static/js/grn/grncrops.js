// ============================================================
// DOM ELEMENT REFERENCES
// ============================================================
(function () {
    let
        grnCropAddFormModalElement
        ,tableBody
        ,selectCropPurchase
        ,selectGRNStatus
        , printViewGrnCropModalElement
        ,grnCropForm
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
         grnCropAddFormModalElement = document.querySelector("#GrnCropAddForm");

// Table body
         tableBody = document.querySelector("#tableBodyId");

// Purchase order display (readonly, same pattern as GRN Ingredient)
         selectCropPurchase = document.querySelector("#selectCropPurchase");
         selectGRNStatus = document.querySelector("#selectGRNStatus");

// Print view modal
         printViewGrnCropModalElement = document.querySelector("#GrnCropViewModal");

// Form fields
         grnCropForm = document.querySelector("#formGrnCrop");
         createDateElement = document.querySelector("#createDate");
         updateDateElement = document.querySelector("#updateDate");
         grnNoElement = document.querySelector("#GrnNo");
         dateReceivedElement = document.querySelector("#dateReceivedDate");
         userIdElement = document.querySelector("#userId");
         textNoteElement = document.querySelector("#textNote");

// Form title
         titleEditHide = document.querySelector("#formTitleEdit");
// NOTE: this form has no "Add New" trigger and no submit/POST path —
// it is purely EDIT, reached only via refillGrnCropForm() (row
// click), same pattern as GRN Ingredient. GRN Crop records are
// auto-created server-side via autoCreateGrnFromPO() when a Crop
// Purchase's status becomes Approved (see CropPurchaseController) —
// the frontend never creates one manually.

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

    let grnCropList = [];

    let grnCrop    = {};
    let oldGrnCrop = {};
    let formMode   = "ADD";

    let lineItemCount = 0;





// ============================================================
// EVENT LISTENERS
// ============================================================
// NOTE: userIdElement is read-only and fully managed by
// refillGrnCropForm() (display) and handleUpdate() (reassignment) —
// no manual input validation is needed on it anymore.

    const initializeEventListeners = () => {
        dateReceivedElement.addEventListener("input", validateReceivedDate);
        selectGRNStatus.addEventListener("change",    validateGRNStatus);
        textNoteElement.addEventListener("input",     validateNote);

        updateElement.addEventListener("click", handleUpdate);
        clearElement.addEventListener("click",  handleClear);
        printElement.addEventListener("click",  handlePrint);
    };


// ============================================================
// INITIALIZE FORM
// ============================================================

    const initializeForm = () => {
        grnCrop    = {};
        oldGrnCrop = {};
        formMode   = "ADD";
        lineItemCount = 0;

        grnCropForm.reset();
        removeValidationStyles(grnCropForm);

        grnNoElement.textContent      = "-";
        updateDateElement.textContent = "-";

        let dateTime = getTodayDateTime();
        let date = dateTime.slice(0, 10);
        let time = dateTime.slice(11, 19);
        createDateElement.textContent = date + " " + time;

        selectCropPurchase.value    = "";
        selectCropPurchase.readOnly = true;
        selectGRNStatus.value       = "";

        lineItemsBody.innerHTML       = "";
        grandTotalElement.textContent = "0.00";

        updateElement.classList.add("d-none");
        printElement.classList.add("d-none");
    };


// ============================================================
// LOAD INITIAL DATA
// ============================================================

    const loadInitialData = () => {
        grnCropList = getServiceRequest("/grn/grncrop/alldata/selected");
    };


// ============================================================
// REFRESH TABLE
// ============================================================

    const refreshGrnCropTable = () => {
        if ($.fn.DataTable.isDataTable("#tableGrnCrop")) {
            $("#tableGrnCrop").DataTable().destroy();
        }

        tableBody.innerHTML = "";

        let displayProperty = [
            { propertyName: getGrnCropNumber,       dataType: "function" },
            { propertyName: getGrnCropPurchaseId,   dataType: "function" },
            { propertyName: getGrnCropReceivedDate, dataType: "function" },
            { propertyName: getGrnCropUser,         dataType: "function" },
            { propertyName: getGrnCropStatus,       dataType: "function" },
        ];

        fillDataIntoTableThree(
            tableBody,
            grnCropList,
            displayProperty,
            refillGrnCropForm
        );

        $("#tableGrnCrop").DataTable();
    };

// Table display helpers
    const getGrnCropNumber = (ob) => ob.grncropnumber || ob.id || "-";
    const getGrnCropPurchaseId = (ob) => ob.cropPurchase?.ponumber || ob.cropPurchase?.id || "-";
    const getGrnCropUser = (ob) => ob.user?.username || ob.user?.id || "-";

    const getGrnCropReceivedDate = (ob) => {
        if (!ob.recieveddate) return "-";
        return ob.recieveddate.slice(0, 16).replace("T", " ");
    };

    const getGrnCropStatus = (ob) => {
        if (ob.grnstatus === "Complete") return '<p class="p-1 bg-success ">Complete</p>';
        if (ob.grnstatus === "Partial")  return '<p class="p-1 bg-secondary">Partial</p>';
        if (ob.grnstatus === "Rejected") return '<p class="p-1 bg-danger ">Rejected</p>';
        if (ob.grnstatus === "Pending")  return '<p class="p-1 bg-warning">Pending</p>';
        return ob.grnstatus || "-";
    };


// ============================================================
// VALIDATION — MAIN FIELDS
// ============================================================

    const validateReceivedDate = () => {
        const value = dateReceivedElement.value;

        if (!value) {
            grnCrop.recieveddate = null;
            setInvalid(dateReceivedElement);
            return;
        }

        grnCrop.recieveddate = value;

        if (formMode === "EDIT" && value !== oldGrnCrop.recieveddate) {
            setUpdated(dateReceivedElement);
        } else {
            setValid(dateReceivedElement);
        }
    };

// Backend entity/controller reads & writes this field as `grnstatus`
// (see GrnCropController#updateData -> existing.setGrnstatus(...)),
// matching the Ingredient module and getGrnCropStatus() above.
    const validateGRNStatus = () => {
        const value = selectGRNStatus.value;

        if (!value) {
            grnCrop.grnstatus = null;
            setInvalid(selectGRNStatus);
            return;
        }

        grnCrop.grnstatus = value;

        if (formMode === "EDIT" && value !== oldGrnCrop.grnstatus) {
            setUpdated(selectGRNStatus);
        } else {
            setValid(selectGRNStatus);
        }
    };

    const validateNote = () => {
        grnCrop.note = textNoteElement.value.trim() || null;
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
// and persisted server-side on update — see GrnCropController#updateData.
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

// GrnCropItem no longer has a totalprice field — only receivedqty and
// lineprice are sent per item. The line total shown in the UI is a
// derived display value only, computed live from those two fields.
    const collectLineItems = () => {
        const rows  = lineItemsBody.querySelectorAll(".line-item-row");
        const items = [];

        rows.forEach((row) => {
            if (!row.dataset.cpitemid) return;

            const condVal = row.querySelector(".sel-condition").value;

            items.push({
                cropPurchaseItem: { id: parseInt(row.dataset.cpitemid) },   // ← only send id
                orderedqty:       parseFloat(row.querySelector(".inp-orderqty").value) || 0,
                receivedqty:      parseFloat(row.querySelector(".inp-receivedqty").value) || 0,
                lineprice:        parseFloat(row.querySelector(".inp-unitprice").value)   || 0,
                condition:        condVal === "1" ? true : condVal === "0" ? false : null,
                note:             row.querySelector(".inp-note").value.trim() || null,
            });
        });

        return items;
    };


// ============================================================
// RENDER LINE ITEMS INTO DOM (EDIT refill)
// ============================================================

    const renderLineItemsFromData = (items) => {
        lineItemsBody.innerHTML = "";
        lineItemCount = 0;

        items.forEach((item) => {
            lineItemCount++;

            const clone = lineItemTemplate.content.cloneNode(true);
            const row   = clone.querySelector(".line-item-row");

            // Store crop-purchase-item data on the row for collectLineItems to read back
            row.dataset.cpitemid   = item.cropPurchaseItem?.id   || "";
            row.dataset.cpitemjson = JSON.stringify(item.cropPurchaseItem || {});

            // Row number
            row.querySelector(".row-num").textContent = lineItemCount;

            // Crop name — readonly, filled directly from GRN data
            row.querySelector(".inp-crop").value =
                item.cropPurchaseItem?.crop?.name || "-";

            // Numeric fields — backend properties are `orderedqty` / `receivedqty`
            // / `lineprice` (see GrnCropController#autoCreateGrnFromPO).
            row.querySelector(".inp-orderqty").value    = item.orderedqty  ?? "";
            row.querySelector(".inp-receivedqty").value = item.receivedqty ?? "";
            row.querySelector(".inp-unitprice").value   = item.lineprice   ?? "";
            row.querySelector(".inp-note").value        = item.note       || "";

            // Line total is derived, not stored — GrnCropItem has no
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

    const refillGrnCropForm = (dataOb) => {
        removeValidationStyles(grnCropForm);

        let myModal = new bootstrap.Modal(grnCropAddFormModalElement, {});
        formMode = "EDIT";

        grnCrop    = getServiceRequest("/grn/grncrop/byid/" + dataOb.id);
        oldGrnCrop = JSON.parse(JSON.stringify(grnCrop));

        // Meta dates
        if (grnCrop.addeddatetime) {
            let dt = grnCrop.addeddatetime;
            createDateElement.textContent = dt.slice(0, 10) + " " + dt.slice(11, 19);
        } else {
            createDateElement.textContent = "-";
        }

        if (grnCrop.updateddatetime) {
            let dt = grnCrop.updateddatetime;
            updateDateElement.textContent = dt.slice(0, 10) + " " + dt.slice(11, 19);
        } else {
            updateDateElement.textContent = "-";
        }

        grnNoElement.textContent = grnCrop.grncropnumber || grnCrop.id || "-";

        // Purchase Order — readonly text input
        if (grnCrop.cropPurchase) {
            selectCropPurchase.value    = grnCrop.cropPurchase.ponumber || grnCrop.cropPurchase.id || "";
            selectCropPurchase.readOnly = true;
        }

        // Received date
        dateReceivedElement.value = grnCrop.recieveddate
            ? grnCrop.recieveddate.slice(0, 16)
            : "";

        // User field is DISPLAY ONLY here — shows whoever is currently
        // stamped on the record (last updater, or creator if never
        // updated). We do NOT touch grnCrop.user on open. It only gets
        // reassigned to the current session user inside handleUpdate(),
        // and only if the record is actually changed and saved — see
        // hasGrnCropChanged(). Opening or cancelling never reassigns it.
        userIdElement.value    = grnCrop.user?.username || grnCrop.user?.id || "-";
        userIdElement.readOnly = true;

        // GRN Status
        selectGRNStatus.value = grnCrop.grnstatus || "";

        // Note
        textNoteElement.value = grnCrop.note || "";

        // Line items — backend property is `grnCropItems`
        // (GrnCrop#getGrnCropItems()).
        const items = grnCrop.grnCropItems || [];
        renderLineItemsFromData(items);
        // renderLineItemsFromData() -> calcGrandTotal() gives the display
        // total; grnCrop.totalprice (the persisted header value) should
        // match it exactly since both are derived from the same items.

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
    const normalizeGrnCropLineItems = (items) => {
        return (items || [])
            .map(item => ({
                id: item.cropPurchaseItem?.id,
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
    const hasGrnCropChanged = () => {
        if (grnCrop.recieveddate !== oldGrnCrop.recieveddate) return true;
        if (grnCrop.grnstatus !== oldGrnCrop.grnstatus) return true;
        if ((grnCrop.note || null) !== (oldGrnCrop.note || null)) return true;

        const itemsChanged = JSON.stringify(normalizeGrnCropLineItems(collectLineItems()))
            !== JSON.stringify(normalizeGrnCropLineItems(oldGrnCrop.grnCropItems));
        if (itemsChanged) return true;

        return false;
    };


// ============================================================
// FORM ERROR CHECK
// ============================================================

    const checkFormErrors = () => {
        let errors = [];

        if (!grnCrop.recieveddate) errors.push("Received Date & Time is required.");
        if (!grnCrop.user)         errors.push("User ID is required.");
        if (!grnCrop.grnstatus)    errors.push("GRN Status is required.");

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
        if (hasGrnCropChanged()) {
            loadLoggedInUserInto(grnCrop, userIdElement);
        }

        // Send line items under `grnCropItems` to match the backend entity
        // property. No totalprice is sent per item — GrnCropItem doesn't
        // have that field anymore; the server recomputes and persists the
        // GRN's total on the header (GrnCrop.totalprice) from
        // receivedqty x lineprice on save.
        grnCrop.grnCropItems = collectLineItems();

        let response = getHTTPServiceRequest("/grn/grncrop/update", "PUT", grnCrop);

        if (response === "OK") {
            updateDateElement.textContent = new Date().toLocaleString();
            Notiflix.Notify.success("Updated successfully");
            $("#GrnCropAddForm").modal("hide");
            loadInitialData();
            refreshGrnCropTable();
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

    const viewGrnCropRecord = (dataOb) => {
        document.querySelector("#tdGrnNo").innerText =
            dataOb.grncropnumber || dataOb.id || "-";
        document.querySelector("#tdPurchaseOrder").innerText =
            dataOb.cropPurchase?.ponumber || dataOb.cropPurchase?.id || "-";
        document.querySelector("#tdCreatedDate").innerText = dataOb.addeddatetime
            ? dataOb.addeddatetime.slice(0, 16).replace("T", " ")
            : "-";
        document.querySelector("#tdReceivedDate").innerText = dataOb.recieveddate
            ? dataOb.recieveddate.slice(0, 16).replace("T", " ")
            : "-";
        document.querySelector("#tdUser").innerText      = dataOb.user?.username || dataOb.user?.id || "-";
        document.querySelector("#tdGRNStatus").innerText = dataOb.grnstatus       || "-";
        document.querySelector("#tdNote").innerText      = dataOb.note           || "-";

        // Fill print line items table
        const printBody = document.querySelector("#tablePrintLineItemsBody");
        printBody.innerHTML = "";
        let grandTotal = 0;

        // Backend property is `grnCropItems`. Per-item total is derived
        // (receivedqty x lineprice) since GrnCropItem no longer stores one.
        const items = dataOb.grnCropItems || collectLineItems();
        items.forEach((item, index) => {
            const lineTotal = (item.receivedqty || 0) * (item.lineprice || 0);
            grandTotal += lineTotal;
            const tr = document.createElement("tr");
            tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.cropPurchaseItem?.crop?.name || "-"}</td>
            <td>${item.orderedqty    ?? "-"}</td>
            <td>${item.receivedqty   ?? "-"}</td>
            <td>${item.lineprice     ?? "-"}</td>
            <td>${lineTotal.toFixed(2)}</td>
            <td>${item.condition === true ? "Good" : item.condition === false ? "Damaged" : "-"}</td>
            <td>${item.note || "-"}</td>
        `;
            printBody.appendChild(tr);
        });

        // Header total: prefer the persisted GrnCrop.totalprice when
        // available (it's the authoritative, server-saved value); fall
        // back to the sum just computed above.
        const headerTotal = dataOb.totalprice ?? grandTotal;
        document.querySelector("#printGrandTotal").textContent = headerTotal.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

        const editModalContent = grnCropAddFormModalElement.querySelector(".modal-content");
        editModalContent.classList.add("blurred");

        const viewModal = new bootstrap.Modal(printViewGrnCropModalElement);
        viewModal.show();

        printViewGrnCropModalElement.addEventListener(
            "hidden.bs.modal",
            () => { editModalContent.classList.remove("blurred"); },
            { once: true }
        );
    };

    const handlePrint = () => {
        viewGrnCropRecord(grnCrop);
    };

    const printGrnCropRecord = () => {
        let newWindow = window.open();
        newWindow.document.write(
            "<html><head>" +
            "<title>Crop GRN Details</title>" +
            '<link rel="stylesheet" href="/css/bootstrap-5.3.3/css/bootstrap.min.css">' +
            "</head><body>" +
            document.querySelector("#divCardPrintGrnCrop").outerHTML +
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
        refreshGrnCropTable();
    }
window.initPage();
    window.printGrnCropRecord = printGrnCropRecord;

})();