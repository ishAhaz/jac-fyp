// ============================================================
// DOM ELEMENT REFERENCES
// ============================================================
(function () {
    let returnAddFormModalElement
        ,  tableBody
        ,  printViewModalElement
        ,  returnForm
        ,  regDateElement
        ,  updateDateElement
        ,   inputReturnNoElement
        ,   selectOrderElement
        ,  dateReturnDateElement
        ,   selectReturnStatusElement
        ,  userIdElement
        ,  textReasonElement
        ,  selectOrderItemElement
        ,  textOrderedQtyElement
        ,  textReturnQtyElement
        ,  buttonAddReturnItem
        ,  returnItemsBody
        ,  tdTotalReturnQty
        ,  submitElement
        ,   updateElement
        ,   clearElement
        ,   printElement
        ,   deleteElement
        ,  titleNewHide
        ,  titleEditHide
        ,  tdReturnNo
        ,  tdLinkedOrder
        ,  tdReturnDate
        ,  tdReturnStatus
        ,  tdTotalQty
        ,tdReason
        ,  tdUser
        ,  printReturnItemsBody
        , divCardPrintReturn;
    const queryElements = () => {
        returnAddFormModalElement = document.querySelector("#ReturnAddForm");

// Table body
        tableBody = document.querySelector("#tableBodyId");

// Print view modal
        printViewModalElement = document.querySelector("#ReturnViewModal");

// Form
        returnForm = document.querySelector("#formReturn");

// Header info display
        regDateElement = document.querySelector("#regDate");
        updateDateElement = document.querySelector("#updateDate");
        inputReturnNoElement = document.querySelector("#InputReturnNo");

// Header form fields
        selectOrderElement = document.querySelector("#selectOrder");
        dateReturnDateElement = document.querySelector("#dateReturnDate");
        selectReturnStatusElement = document.querySelector("#selectReturnStatus");
        userIdElement = document.querySelector("#userId");
        textReasonElement = document.querySelector("#textReason");

// Item row fields
        selectOrderItemElement = document.querySelector("#selectOrderItem");
        textOrderedQtyElement = document.querySelector("#textOrderedQty");
        textReturnQtyElement = document.querySelector("#textReturnQty");
        buttonAddReturnItem = document.querySelector("#buttonAddReturnItem");

// Items sub-table
        returnItemsBody = document.querySelector("#returnItemsBody");
        tdTotalReturnQty = document.querySelector("#tdTotalReturnQty");

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
        tdReturnNo = document.querySelector("#tdReturnNo");
        tdLinkedOrder = document.querySelector("#tdLinkedOrder");
        tdReturnDate = document.querySelector("#tdReturnDate");
        tdReturnStatus = document.querySelector("#tdReturnStatus");
        tdTotalQty = document.querySelector("#tdTotalQty");
        tdReason = document.querySelector("#tdReason");
        tdUser = document.querySelector("#tdUser");
        printReturnItemsBody = document.querySelector("#printReturnItemsBody");
        divCardPrintReturn = document.querySelector("#divCardPrintReturn");

    }
// ============================================================
// STATE
// ============================================================

    let returnList = [];

    let supermarketReturn    = {};
    let oldSupermarketReturn = {};
    let formMode             = "ADD";

    let currentItems = [];  // { supermarketorderitem: {}, quantity }

// Reference data
    let supermarketOrders     = [];
    let returnStatuses        = [];



// ============================================================
// EVENT LISTENERS
// ============================================================

    const initializeEventListeners = () => {
        // Header field validation
        selectOrderElement.addEventListener("change",        validateLinkedOrder);
        dateReturnDateElement.addEventListener("change",     validateReturnDate);
        selectReturnStatusElement.addEventListener("change", validateReturnStatus);
        textReasonElement.addEventListener("input",          validateReason);
        // userIdElement is read-only and fully managed by loadLoggedInUserInto()
        // (on open/ADD) and by hasReturnChanged() (on update) — no manual
        // input validation needed here anymore.

        // Item row
        selectOrderItemElement.addEventListener("change", handleOrderItemSelected);
        textReturnQtyElement.addEventListener("input",    clampItemReturnQty);
        buttonAddReturnItem.addEventListener("click",     handleAddItem);


        document.querySelector("#addNewReturnId").addEventListener("click", () => {
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
        loadReturnStatuses();
        loadSupermarketOrders();
        returnList = getServiceRequest("/supermarket/supermarketreturn/alldata/selected");
    };

    const loadReturnStatuses = () => {
        returnStatuses = [
            { name: "Pending"   },
            { name: "Approved"  },
            { name: "Rejected"  },
            { name: "Completed" },
        ];
    };

    const loadSupermarketOrders = () => {
        supermarketOrders = getServiceRequest("/supermarket/supermarketorder/alldata/selected");
    };


// ============================================================
// INITIALIZE FORM  (reset to ADD mode)
// ============================================================

    const initializeForm = () => {
        supermarketReturn    = {};
        oldSupermarketReturn = {};
        formMode             = "ADD";
        currentItems         = [];

        returnForm.reset();
        removeValidationStyles(returnForm);

        inputReturnNoElement.textContent  = "-";
        updateDateElement.textContent     = "-";

        let dateTime = getTodayDateTime();
        let date = dateTime.slice(0, 10);
        let time = dateTime.slice(11, 19);
        regDateElement.textContent = date + " " + time;

        // Auto-fill today for return date
        dateReturnDateElement.value      = date;
        supermarketReturn.returndate     = date;

        generateOrderSelect();
        generateReturnStatusSelect();

        // Reset order item add row
        selectOrderItemElement.innerHTML =
            '<option value="" selected disabled>Select Order Item</option>';
        textOrderedQtyElement.value = "";
        textReturnQtyElement.value  = "";
        textReturnQtyElement.removeAttribute("max");
        textReturnQtyElement.disabled = true;

        tdTotalReturnQty.textContent = "0.00";
        returnItemsBody.innerHTML    = "";

        // Auto fill currently logged-in user as the record's user (creation case)
        loadLoggedInUserInto(supermarketReturn, userIdElement);
        userIdElement.readOnly = true;

        // Default status to Pending
        const defaultStatus = returnStatuses.find(s => s.name === "Pending");
        if (defaultStatus) {
            supermarketReturn.returnstatus       = defaultStatus.name;
            selectReturnStatusElement.value      = JSON.stringify(defaultStatus);
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

    const generateOrderSelect = () => {
        fillDataIntoSelect(
            selectOrderElement,
            "Select Reference Order..",
            supermarketOrders,
            "number"        // display field from SupermarketOrder entity
        );
    };

    const generateReturnStatusSelect = () => {
        fillDataIntoSelect(
            selectReturnStatusElement,
            "Select Return Status..",
            returnStatuses,
            "name"
        );
    };

// Populate order items directly from the selected order's own nested items —
// same as compost return: no separate service call, just read off the
// order object that's already in hand.
    const generateOrderItemSelect = (order) => {
        selectOrderItemElement.innerHTML =
            '<option value="" selected disabled>Select Order Item</option>';

        const items = order.supermarketOrderItems || [];
        items.forEach((item) => {
            const option       = document.createElement("option");
            option.value       = JSON.stringify(item);
            option.innerText   = item.croplistmanagement?.name || item.id || "-";
            selectOrderItemElement.appendChild(option);
        });
    };


// ============================================================
// VALIDATION — HEADER FIELDS
// ============================================================

    const validateLinkedOrder = () => {
        const value = selectOrderElement.value;

        if (!value) {
            supermarketReturn.supermarketorder = null;
            setInvalid(selectOrderElement);
            // Clear order item dropdown when order is deselected
            selectOrderItemElement.innerHTML =
                '<option value="" selected disabled>Select Order Item</option>';
            return;
        }

        const parsed                       = JSON.parse(value);
        supermarketReturn.supermarketorder = parsed;

        // Load order items for this order — straight off the parsed order object
        generateOrderItemSelect(parsed);

        if (formMode === "EDIT" &&
            JSON.stringify(supermarketReturn.supermarketorder) !==
            JSON.stringify(oldSupermarketReturn.supermarketorder)) {
            setUpdated(selectOrderElement);
        } else {
            setValid(selectOrderElement);
        }
    };

    const validateReturnDate = () => {
        const value = dateReturnDateElement.value;

        if (!value) {
            supermarketReturn.returndate = null;
            setInvalid(dateReturnDateElement);
            return;
        }

        supermarketReturn.returndate = value;

        if (formMode === "EDIT" && value !== oldSupermarketReturn.returndate) {
            setUpdated(dateReturnDateElement);
        } else {
            setValid(dateReturnDateElement);
        }
    };

    const validateReturnStatus = () => {
        const value = selectReturnStatusElement.value;

        if (!value) {
            supermarketReturn.returnstatus = null;
            setInvalid(selectReturnStatusElement);
            return;
        }

        const parsed                   = JSON.parse(value);
        supermarketReturn.returnstatus = parsed.name;

        if (formMode === "EDIT" &&
            JSON.stringify(supermarketReturn.returnstatus) !==
            JSON.stringify(oldSupermarketReturn.returnstatus)) {
            setUpdated(selectReturnStatusElement);
        } else {
            setValid(selectReturnStatusElement);
        }
    };

    const validateReason = () => {
        const value = textReasonElement.value.trim();

        if (!value) {
            supermarketReturn.reason = null;
            setInvalid(textReasonElement);
            return;
        }

        supermarketReturn.reason = value;

        if (formMode === "EDIT" && value !== oldSupermarketReturn.reason) {
            setUpdated(textReasonElement);
        } else {
            setValid(textReasonElement);
        }
    };


// ============================================================
// ITEM ROW — SELECT / ORDERED QTY / CAP
// ============================================================

// Fires when an order item is picked. Auto-fills the read-only Ordered Qty
// display, and unlocks + caps the Return Quantity input against it — same
// pattern as the compost return module.
    const handleOrderItemSelected = () => {
        const value = selectOrderItemElement.value;

        if (!value) {
            textOrderedQtyElement.value = "";
            textReturnQtyElement.value  = "";
            textReturnQtyElement.removeAttribute("max");
            textReturnQtyElement.disabled = true;
            setInvalid(selectOrderItemElement);
            return;
        }

        const selectedItem = JSON.parse(value);
        const orderedQty   = parseFloat(selectedItem.quantity) || 0;

        // Display-only — never included in what gets submitted.
        textOrderedQtyElement.value = orderedQty.toFixed(2);

        textReturnQtyElement.value    = "";
        textReturnQtyElement.max      = orderedQty;
        textReturnQtyElement.disabled = false;
        textReturnQtyElement.classList.remove("is-valid", "is-invalid");

        setValid(selectOrderItemElement);
    };

// Live-clamps the Return Quantity input against the ordered amount as the
// user types, so it can never exceed what was originally ordered.
    const clampItemReturnQty = () => {
        const max = parseFloat(textReturnQtyElement.max);
        if (isNaN(max)) return; // no item selected yet

        let value = parseFloat(textReturnQtyElement.value);
        if (isNaN(value)) return;

        if (value > max) {
            textReturnQtyElement.value = max;
            Notiflix.Notify.warning(`Return quantity cannot exceed the ordered quantity (${max.toFixed(2)}).`);
        }
        if (value < 0) {
            textReturnQtyElement.value = 0;
        }

        if (value <= 0 || isNaN(value)) {
            setInvalid(textReturnQtyElement);
        } else {
            setValid(textReturnQtyElement);
        }
    };


// ============================================================
// ITEM ADD / REMOVE
// ============================================================

    const handleAddItem = () => {
        const orderItemValue = selectOrderItemElement.value;
        const qty             = parseFloat(textReturnQtyElement.value);

        if (!orderItemValue) {
            Notiflix.Notify.warning("Please select an order item.");
            setInvalid(selectOrderItemElement);
            return;
        }

        if (isNaN(qty) || qty <= 0) {
            Notiflix.Notify.warning("Please enter a valid return quantity.");
            setInvalid(textReturnQtyElement);
            return;
        }

        const parsedOrderItem = JSON.parse(orderItemValue);

        // Validate return qty does not exceed original order qty
        const originalQty = parseFloat(parsedOrderItem.quantity) || 0;
        if (qty > originalQty) {
            Notiflix.Notify.warning(
                `Return quantity (${qty}) cannot exceed the original order quantity (${originalQty}).`
            );
            setInvalid(textReturnQtyElement);
            return;
        }

        // Prevent duplicate order item
        const duplicate = currentItems.find(
            (item) => item.supermarketorderitem.id === parsedOrderItem.id
        );
        if (duplicate) {
            Notiflix.Notify.warning("This order item has already been added.");
            return;
        }

        currentItems.push({
            supermarketorderitem: parsedOrderItem,
            quantity:             qty,
        });

        renderItemsTable();

        // Reset item add row
        selectOrderItemElement.value = "";
        textOrderedQtyElement.value  = "";
        textReturnQtyElement.value   = "";
        textReturnQtyElement.removeAttribute("max");
        textReturnQtyElement.disabled = true;

        [selectOrderItemElement, textReturnQtyElement].forEach((el) => {
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
        returnItemsBody.innerHTML = "";
        let totalQty = 0;

        if (currentItems.length === 0) {
            returnItemsBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted">No items added yet.</td>
            </tr>`;
            tdTotalReturnQty.textContent = "0.00";
            return;
        }

        currentItems.forEach((item, index) => {
            totalQty += item.quantity;

            const row = document.createElement("tr");
            row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.supermarketorderitem?.croplistmanagement?.name || "-"}</td>
            <td>${item.quantity.toFixed(2)}</td>
            <td>
                <button type="button" class="btn btn-sm btn-outline-danger"
                        onclick="removeItem(${index})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>`;
            returnItemsBody.appendChild(row);
        });

        tdTotalReturnQty.textContent = totalQty.toFixed(2);
    };


// ============================================================
// REFRESH MAIN TABLE
// ============================================================

    const refreshReturnTable = () => {
        if ($.fn.DataTable.isDataTable("#tableReturn")) {
            $("#tableReturn").DataTable().destroy();
        }

        tableBody.innerHTML = "";

        let displayProperty = [
            { propertyName: "returnid",                dataType: "string"   },
            { propertyName: getLinkedOrderDisplay,     dataType: "function" },
            { propertyName: getTotalQtyDisplay,        dataType: "function" },
            { propertyName: getReasonDisplay,          dataType: "function" },
            { propertyName: "returndate",              dataType: "string"   },
            { propertyName: getReturnStatusDisplay,    dataType: "function" },
        ];

        fillDataIntoTableThree(
            tableBody,
            returnList,
            displayProperty,
            refillReturnForm
        );

        $("#tableReturn").DataTable();
    };

// Table display helpers
    const getLinkedOrderDisplay  = (ob) =>
        ob.supermarketorder?.number || ob.supermarketorder?.id || "-";
    const getTotalQtyDisplay     = (ob) => {
        if (!ob.supermarketReturnItems || ob.supermarketReturnItems.length === 0) return "0.00";
        const total = ob.supermarketReturnItems.reduce((sum, i) => sum + i.quantity, 0);
        return total.toFixed(2);
    };
    const getReasonDisplay       = (ob) =>
        ob.reason ? (ob.reason.length > 40 ? ob.reason.slice(0, 40) + "..." : ob.reason) : "-";
    const getReturnStatusDisplay = (ob) => {
        if (ob.returnstatus === "Pending")   return '<p class="p-1 bg-warning ">Pending</p>';
        if (ob.returnstatus === "Approved")  return '<p class="p-1 bg-success">Approved</p>';
        if (ob.returnstatus === "Rejected")  return '<p class="p-1 bg-danger">Rejected</p>';
        if (ob.returnstatus === "Completed") return '<p class="p-1 bg-info">Completed</p>';
        return ob.returnstatus || "-";
    };


// ============================================================
// REFILL FORM — EDIT MODE
// ============================================================

    const refillReturnForm = (dataOb) => {
        removeValidationStyles(returnForm);

        let myModal = new bootstrap.Modal(returnAddFormModalElement, {});
        formMode = "EDIT";

        supermarketReturn    = getServiceRequest("/supermarket/supermarketreturn/byid/" + dataOb.id);
        oldSupermarketReturn = JSON.parse(JSON.stringify(supermarketReturn));

        // Meta dates
        if (supermarketReturn.addeddatetime) {
            let dt = supermarketReturn.addeddatetime;
            regDateElement.textContent = dt.slice(0, 10) + " " + dt.slice(11, 19);
        } else {
            regDateElement.textContent = "-";
        }

        if (supermarketReturn.updateddatetime) {
            let dt = supermarketReturn.updateddatetime;
            updateDateElement.textContent = dt.slice(0, 10) + " " + dt.slice(11, 19);
        } else {
            updateDateElement.textContent = "-";
        }

        inputReturnNoElement.textContent = supermarketReturn.returnid || "-";

        // Reference order
        generateOrderSelect();
        if (supermarketReturn.supermarketorder) {
            selectOrderElement.value = JSON.stringify(supermarketReturn.supermarketorder);
            generateOrderItemSelect(supermarketReturn.supermarketorder);
        }

        // Return date
        dateReturnDateElement.value = supermarketReturn.returndate
            ? supermarketReturn.returndate.slice(0, 10)
            : "";

        // Return status
        generateReturnStatusSelect();
        selectReturnStatusElement.value = JSON.stringify({ name: supermarketReturn.returnstatus });

        // Reason
        textReasonElement.value = supermarketReturn.reason || "";

        // User field is DISPLAY ONLY here — shows whoever is currently
        // stamped on the record (last updater, or creator if never
        // updated). We do NOT touch supermarketReturn.user on open. It
        // only gets reassigned to the current session user inside
        // handleUpdate(), and only if the record is actually changed and
        // saved — see hasReturnChanged(). Opening or cancelling never
        // reassigns it.
        userIdElement.value    = supermarketReturn.user?.username || supermarketReturn.user?.id || "-";
        userIdElement.readOnly = true;

        // Reset item add row (existing items already committed below are
        // untouched by this — this only clears leftover state in the add row)
        textOrderedQtyElement.value = "";
        textReturnQtyElement.value  = "";
        textReturnQtyElement.removeAttribute("max");
        textReturnQtyElement.disabled = true;

        // Items
        currentItems = supermarketReturn.supermarketReturnItems
            ? JSON.parse(JSON.stringify(supermarketReturn.supermarketReturnItems))
            : [];
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

// Normalizes return sub-items to a comparable, order-independent shape.
    const normalizeReturnItems = (items) => {
        return (items || [])
            .map(item => ({
                id: item.supermarketorderitem?.id,
                quantity: Number(item.quantity)
            }))
            .sort((a, b) => (a.id > b.id ? 1 : a.id < b.id ? -1 : 0));
    };

// Returns true if reference order, return date, status, reason, or
// return items differ from the original snapshot taken when the
// record was opened for edit.
    const hasReturnChanged = () => {
        if (JSON.stringify(supermarketReturn.supermarketorder) !==
            JSON.stringify(oldSupermarketReturn.supermarketorder)) return true;
        if (supermarketReturn.returndate !== oldSupermarketReturn.returndate) return true;
        if (supermarketReturn.returnstatus !== oldSupermarketReturn.returnstatus) return true;
        if (supermarketReturn.reason !== oldSupermarketReturn.reason) return true;

        const itemsChanged = JSON.stringify(normalizeReturnItems(currentItems))
            !== JSON.stringify(normalizeReturnItems(oldSupermarketReturn.supermarketReturnItems));
        if (itemsChanged) return true;

        return false;
    };


// ============================================================
// FORM ERROR CHECK
// ============================================================

    const checkFormErrors = () => {
        let errors = [];

        if (!supermarketReturn.supermarketorder)
            errors.push("Reference Order has an error. Please check again.");
        if (!supermarketReturn.returndate)
            errors.push("Return Date has an error. Please check again.");
        if (!supermarketReturn.returnstatus)
            errors.push("Return Status has an error. Please check again.");
        if (!supermarketReturn.reason)
            errors.push("Reason has an error. Please check again.");
        if (!supermarketReturn.user)
            errors.push("User ID has an error. Please check again.");
        if (currentItems.length === 0)
            errors.push("At least one Return Item is required.");

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

        supermarketReturn.supermarketReturnItems = currentItems;

        console.log("Submitting Supermarket Return:", supermarketReturn);

        let response = getHTTPServiceRequest("/supermarket/supermarketreturn/save", "POST", supermarketReturn);

        if (response === "OK") {
            Notiflix.Notify.success("Saved successfully");
            $("#ReturnAddForm").modal("hide");
            loadInitialData();
            refreshReturnTable();
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
        if (hasReturnChanged()) {
            loadLoggedInUserInto(supermarketReturn, userIdElement);
        }

        supermarketReturn.supermarketReturnItems = currentItems;

        console.log("Updating Supermarket Return:", supermarketReturn);

        let response = getHTTPServiceRequest("/supermarket/supermarketreturn/update", "PUT", supermarketReturn);

        if (response === "OK") {
            updateDateElement.textContent = new Date().toLocaleString();
            Notiflix.Notify.success("Updated successfully");
            $("#ReturnAddForm").modal("hide");
            loadInitialData();
            refreshReturnTable();
            initializeForm();
        } else {
            Notiflix.Notify.warning("Update failed: " + response);
        }
    };

    const handleDelete = () => {
        Notiflix.Confirm.show(
            "Delete Return",
            "Are you sure you want to delete this return record?",
            "Yes, Delete",
            "Cancel",
            () => {
                let response = getHTTPServiceRequest(
                    "/supermarket/supermarketreturn/" + supermarketReturn.id,
                    "DELETE",
                    null
                );

                if (response !== "AJAX error") {
                    Notiflix.Notify.success("Deleted successfully");
                    $("#ReturnAddForm").modal("hide");
                    loadInitialData();
                    refreshReturnTable();
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

    const viewReturnRecord = (dataOb) => {
        tdReturnNo.innerText     = dataOb.returnid || "-";
        tdLinkedOrder.innerText  = dataOb.supermarketorder?.number
            || dataOb.supermarketorder?.id || "-";
        tdReturnDate.innerText   = dataOb.returndate
            ? dataOb.returndate.slice(0, 10)
            : "-";
        tdReturnStatus.innerText = dataOb.returnstatus || "-";
        tdReason.innerText       = dataOb.reason || "-";
        tdUser.innerText         = dataOb.user?.username || dataOb.user?.id || "-";

        // Total qty
        const items  = dataOb.supermarketReturnItems || currentItems || [];
        const total  = items.reduce((sum, i) => sum + i.quantity, 0);
        tdTotalQty.innerText = total.toFixed(2);

        // Items
        printReturnItemsBody.innerHTML = "";

        if (items.length === 0) {
            printReturnItemsBody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center text-muted">No items.</td>
            </tr>`;
        } else {
            items.forEach((item, index) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.supermarketorderitem?.croplistmanagement?.name || "-"}</td>
                <td>${item.quantity.toFixed(2)}</td>`;
                printReturnItemsBody.appendChild(row);
            });
        }

        // Blur edit modal while print view is open
        const editModalContent = returnAddFormModalElement.querySelector(".modal-content");
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
        viewReturnRecord(supermarketReturn);
    };

    const printReturnRecord = () => {
        let newWindow = window.open();
        newWindow.document.write(
            "<html><head>" +
            "<title>Supermarket Return Details</title>" +
            '<link rel="stylesheet" href="/css/bootstrap-5.3.3/css/bootstrap.min.css">' +
            "</head><body>" +
            divCardPrintReturn.outerHTML +
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
        refreshReturnTable();}

    window.initPage();
    window.removeItem = removeItem;
    window.printReturnRecord = printReturnRecord;

})();