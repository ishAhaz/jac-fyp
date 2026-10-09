// ============================================================
// DOM ELEMENT REFERENCES
// ============================================================
(function () {
let
    returnAddFormModalElement
    ,tableBody

    , selectOrder
    , selectReturnStatus
    ,selectOrderItem
  ,  printViewReturnModalElement
    ,textOrderedQty
  ,  returnForm
  ,  addNewReturnElement
  ,  regDateElement
  ,  updateDateElement
  ,  returnNoElement
  ,  dateReturnDate
  ,  userIdElement
  ,  textReason
  ,  textReturnQty
  ,  buttonAddReturnItem
  ,  returnItemsBody
   , tdTotalReturnQty
   , titleEditHide
   , titleNewHide
   , submitElement
   , updateElement
   , clearElement
   , printElement
    ,deleteElement;
    const queryElements = () => {

         returnAddFormModalElement = document.querySelector("#ReturnAddForm");

// Table body
         tableBody = document.querySelector("#tableBodyId");

// Dropdowns

         selectOrder = document.querySelector("#selectOrder");
         selectReturnStatus = document.querySelector("#selectReturnStatus");
         selectOrderItem = document.querySelector("#selectOrderItem");

// Print view modal
         printViewReturnModalElement = document.querySelector("#ReturnViewModal");

// Form fields
         returnForm = document.querySelector("#formReturn");
         addNewReturnElement = document.querySelector("#addNewReturnId");
         regDateElement = document.querySelector("#regDate");
         updateDateElement = document.querySelector("#updateDate");
         returnNoElement = document.querySelector("#InputReturnNo");
         dateReturnDate = document.querySelector("#dateReturnDate");
         userIdElement = document.querySelector("#userId");
         textReason = document.querySelector("#textReason");

// Return items
         textReturnQty = document.querySelector("#textReturnQty");
        textOrderedQty = document.querySelector("#textOrderedQty");
         buttonAddReturnItem = document.querySelector("#buttonAddReturnItem");
         returnItemsBody = document.querySelector("#returnItemsBody");
        tdTotalReturnQty = document.querySelector("#tdTotalReturnQty");

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

    let returnList = [];

    let compostReturn    = {};
    let oldCompostReturn = {};
    let formMode         = "ADD";

    let returnItemList = [];   // { compostsaleitem: {}, quantity: string }


// ============================================================
// EVENT LISTENERS
// ============================================================

    const initializeEventListeners = () => {
        // Form field validation



        selectOrder.addEventListener("change",        validateOrder);
        dateReturnDate.addEventListener("input",      validateReturnDate);
        selectReturnStatus.addEventListener("change", validateReturnStatus);

        textReason.addEventListener("input",          validateReason);

        // Return item add row
        selectOrderItem.addEventListener("change", handleOrderItemSelected);
        textReturnQty.addEventListener("input", clampReturnQty);
        buttonAddReturnItem.addEventListener("click", handleAddReturnItem);

        addNewReturnElement.addEventListener("click", () => {
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
        compostReturn    = {};
        oldCompostReturn = {};
        formMode         = "ADD";

        returnItemList = [];

        returnForm.reset();
        removeValidationStyles(returnForm);

        returnNoElement.textContent   = "-";
        updateDateElement.textContent = "-";

        let dateTime = getTodayDateTime();
        let date = dateTime.slice(0, 10);
        let time = dateTime.slice(11, 19);
        regDateElement.textContent = date + " " + time;

        loadLoggedInUserInto(compostReturn,userIdElement);
        userIdElement.readOnly = true;

        // Reset dropdowns
        generateOrderSelect();
        generateReturnStatusSelect();
        selectOrder.value        = "";
        selectReturnStatus.value = "";

        // Reset return item add row
        selectOrderItem.innerHTML =
            '<option value="" selected disabled>Select Order Item</option>';
        textReturnQty.value = "";

        textOrderedQty.value = "";
        textReturnQty.removeAttribute("max");
        textReturnQty.disabled = true;
        // Clear return items table
        returnItemsBody.innerHTML       = "";
        tdTotalReturnQty.textContent    = "0.00";

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
        loadSaleList();
        loadReturnStatusList();
        returnList = getServiceRequest("/compost/compostreturn/alldata/selected");
    };

// ============================================================
// REFRESH TABLE
// ============================================================

    const refreshReturnTable = () => {
        if ($.fn.DataTable.isDataTable("#tableReturn")) {
            $("#tableReturn").DataTable().destroy();
        }

        tableBody.innerHTML = "";

        let displayProperty = [
            { propertyName: "returnid",              dataType: "string"   },
            { propertyName: getReturnSaleRef,         dataType: "function" },
            { propertyName: getReturnTotalQty,        dataType: "function" },
            { propertyName: "reason",                 dataType: "string"   },
            { propertyName: getReturnDate,            dataType: "function" },
            { propertyName: getReturnStatus,          dataType: "function" },
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
    const getReturnSaleRef = (ob) => {
        return ob.compostsale?.compostsalenumber || ob.compostsale?.id || "-";
    };

    const getReturnTotalQty = (ob) => {
        if (!ob.compostReturnItems || ob.compostReturnItems.length === 0) return "0";
        const total = ob.compostReturnItems.reduce(
            (sum, item) => sum + parseFloat(item.quantity || 0), 0
        );
        return total.toFixed(2);
    };

    const getReturnDate = (ob) => {
        if (!ob.returndate) return "-";
        return ob.returndate.slice(0, 10);
    };

    const getReturnStatus = (ob) => {
        if (ob.returnstatus === "Pending")   return '<p class="p-1 bg-warning">Pending</p>';
        if (ob.returnstatus === "Approved")  return '<p class="p-1 bg-success text-white">Approved</p>';
        if (ob.returnstatus === "Rejected")  return '<p class="p-1 bg-danger text-white">Rejected</p>';
        if (ob.returnstatus === "Completed") return '<p class="p-1 bg-info">Completed</p>';
        return ob.returnstatus || "-";
    };


// ============================================================
// DROPDOWN DATA — COMPOST SALE (Reference Order)
// ============================================================

    let saleList = [];

    const loadSaleList = () => {
        saleList = getServiceRequest("/compost/compostsale/alldata/selected");
    };

    const generateOrderSelect = () => {
        fillDataIntoSelect(
            selectOrder,
            "Select reference Order",
            saleList,
            "compostsalenumber"
        );
    };

    const validateOrder = () => {
        const value = selectOrder.value;

        if (!value) {
            compostReturn.compostsale = null;
            setInvalid(selectOrder);
            // Reset order items dropdown
            selectOrderItem.innerHTML =
                '<option value="" selected disabled>Select Order Item</option>';
            return;
        }

        const parsed = JSON.parse(value);
        compostReturn.compostsale = parsed;

        // Load sale items into order item dropdown
        loadOrderItems(parsed);

        if (formMode === "EDIT" &&
            JSON.stringify(compostReturn.compostsale) !== JSON.stringify(oldCompostReturn.compostsale)) {
            setUpdated(selectOrder);
        } else {
            setValid(selectOrder);
        }
    };

    const loadOrderItems = (sale) => {
        selectOrderItem.innerHTML =
            '<option value="" selected disabled>Select Order Item</option>';

        const items = sale.compostSaleItems || [];
        items.forEach((item) => {
            const option = document.createElement("option");
            option.value     = JSON.stringify(item);
            option.innerText = `${item.compost?.name || "Item"} — Rs.${item.unitprice?.toFixed(2)}`;
            selectOrderItem.appendChild(option);
        });
    };

// ============================================================
// DROPDOWN DATA — RETURN STATUS (ReturnStatus enum)
// ============================================================

    let returnStatusList = [];

    const loadReturnStatusList = () => {
        returnStatusList = [
            { name: "Pending"   },
            { name: "Approved"  },
            { name: "Rejected"  },
            { name: "Completed" }
        ];
    };

    const generateReturnStatusSelect = () => {
        fillDataIntoSelect(
            selectReturnStatus,
            "Select return status",
            returnStatusList,
            "name"
        );
    };

    const validateReturnStatus = () => {
        const value = selectReturnStatus.value;

        if (!value) {
            compostReturn.returnstatus = null;
            setInvalid(selectReturnStatus);
            return;
        }

        const parsed = JSON.parse(value);
        compostReturn.returnstatus = parsed.name;

        if (formMode === "EDIT" && compostReturn.returnstatus !== oldCompostReturn.returnstatus) {
            setUpdated(selectReturnStatus);
        } else {
            setValid(selectReturnStatus);
        }
    };


// ============================================================
// VALIDATION — MAIN FIELDS
// ============================================================

    const validateReturnDate = () => {
        const value = dateReturnDate.value;

        if (!value) {
            compostReturn.returndate = null;
            setInvalid(dateReturnDate);
            return;
        }

        compostReturn.returndate = value;

        if (formMode === "EDIT" && value !== oldCompostReturn.returndate?.slice(0, 10)) {
            setUpdated(dateReturnDate);
        } else {
            setValid(dateReturnDate);
        }
    };



    const validateReason = () => {
        const value = textReason.value.trim();
        const pattern = /^.{5,500}$/;

        if (value === "") {
            compostReturn.reason = null;
            setInvalid(textReason);
            return;
        }

        if (pattern.test(value)) {
            compostReturn.reason = value;

            if (formMode === "EDIT" && value !== oldCompostReturn.reason) {
                setUpdated(textReason);
            } else {
                setValid(textReason);
            }
        } else {
            compostReturn.reason = null;
            setInvalid(textReason);
        }
    };


// ============================================================
// RETURN ITEMS — ADD / REMOVE / CALC
// ============================================================

    const handleOrderItemSelected = () => {
        const itemValue = selectOrderItem.value;

        if (!itemValue) {
            textOrderedQty.value = "";
            textReturnQty.value  = "";
            textReturnQty.removeAttribute("max");
            textReturnQty.disabled = true;
            return;
        }

        const selectedItem = JSON.parse(itemValue);
        const orderedQty   = parseFloat(selectedItem.quantity) || 0;

        // Display-only — never included in what gets submitted.
        textOrderedQty.value = orderedQty.toFixed(2);

        textReturnQty.value = "";
        textReturnQty.max   = orderedQty;
        textReturnQty.disabled = false;
        textReturnQty.classList.remove("is-valid", "is-invalid");
    };


    const clampReturnQty = () => {
        const max = parseFloat(textReturnQty.max);
        if (isNaN(max)) return; // no item selected yet

        let value = parseFloat(textReturnQty.value);
        if (isNaN(value)) return;

        if (value > max) {
            textReturnQty.value = max;
            Notiflix.Notify.warning(`Return quantity cannot exceed the ordered quantity (${max.toFixed(2)}).`);
        }
        if (value < 0) {
            textReturnQty.value = 0;
        }
    };

    const handleAddReturnItem = () => {
        const itemValue = selectOrderItem.value;
        const qty       = textReturnQty.value.trim();

        if (!itemValue) {
            Notiflix.Notify.warning("Please select an order item.");
            setInvalid(selectOrderItem);
            return;
        }

        if (!qty || parseFloat(qty) <= 0) {
            Notiflix.Notify.warning("Please enter a valid return quantity.");
            setInvalid(textReturnQty);
            return;
        }

        const selectedItem = JSON.parse(itemValue);

        // Validate return qty does not exceed original sale qty
        const originalQty = parseFloat(selectedItem.quantity) || 0;
        if (parseFloat(qty) > originalQty) {
            Notiflix.Notify.warning(
                `Return quantity (${qty}) cannot exceed the original sale quantity (${originalQty}).`
            );
            setInvalid(textReturnQty);
            return;
        }

        // Prevent duplicate order item
        const duplicate = returnItemList.find(
            (item) => item.compostsaleitem.id === selectedItem.id
        );
        if (duplicate) {
            Notiflix.Notify.warning("This order item has already been added.");
            return;
        }

        returnItemList.push({
            compostsaleitem: selectedItem,
            quantity:        qty
        });

        // Reset add row
        selectOrderItem.value = "";
        textReturnQty.value   = "";
        textOrderedQty.value  = "";
        textReturnQty.removeAttribute("max");
        textReturnQty.disabled = true;
        selectOrderItem.classList.remove("is-valid", "is-invalid");
        textReturnQty.classList.remove("is-valid", "is-invalid");

        renderReturnItemsTable();
        calcTotalReturnQty();
    };

    const renderReturnItemsTable = () => {
        returnItemsBody.innerHTML = "";

        returnItemList.forEach((item, index) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.compostsaleitem?.compost?.name || "-"}
                — Qty: ${item.compostsaleitem?.quantity}
                @ Rs.${parseFloat(item.compostsaleitem?.unitprice || 0).toFixed(2)}
            </td>
            <td>${item.quantity}</td>
            <td>
                <button type="button" class="btn btn-sm btn-outline-danger"
                        onclick="removeReturnItem(${index})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
            returnItemsBody.appendChild(tr);
        });
    };

    const removeReturnItem = (index) => {
        returnItemList.splice(index, 1);
        renderReturnItemsTable();
        calcTotalReturnQty();
    };

    const calcTotalReturnQty = () => {
        const total = returnItemList.reduce(
            (sum, item) => sum + parseFloat(item.quantity || 0), 0
        );
        tdTotalReturnQty.textContent = total.toFixed(2);
    };




// ============================================================
// REFILL FORM — EDIT MODE
// ============================================================

    const refillReturnForm = (dataOb) => {
        removeValidationStyles(returnForm);

        let myModal = new bootstrap.Modal(returnAddFormModalElement, {});
        formMode         = "EDIT";

        compostReturn    = getServiceRequest("/compost/compostreturn/byid/" + dataOb.id);
        oldCompostReturn = JSON.parse(JSON.stringify(compostReturn));

        // Meta
        let dateTimeEdit = compostReturn.addeddatetime;
        let dateEdit = dateTimeEdit.slice(0, 10);
        let timeEdit = dateTimeEdit.slice(11, 19);
        regDateElement.textContent = dateEdit + " " + timeEdit;

        if (!compostReturn.updateddatetime) {
            updateDateElement.textContent = "-";
        } else {
            let dateTimeUpdate = compostReturn.updateddatetime;
            let dateUpdate = dateTimeUpdate.slice(0, 10);
            let timeUpdate = dateTimeUpdate.slice(11, 19);
            updateDateElement.textContent = dateUpdate + " " + timeUpdate;
        }

        returnNoElement.textContent = compostReturn.returnid || "-";

        // Reference order select
        generateOrderSelect();
        if (compostReturn.compostsale) {
            selectOrder.value = JSON.stringify(compostReturn.compostsale);
            loadOrderItems(compostReturn.compostsale);
        }

        // Return date
        dateReturnDate.value = compostReturn.returndate
            ? compostReturn.returndate.slice(0, 10)
            : "";

        // Return status
        generateReturnStatusSelect();
        if (compostReturn.returnstatus) {
            selectReturnStatus.value = JSON.stringify({ name: compostReturn.returnstatus });
        }

        // User field is DISPLAY ONLY here — shows whoever is currently
        // stamped on the record (last updater, or creator if never
        // updated). We do NOT touch compostReturn.user on open. It only
        // gets reassigned to the current session user inside
        // handleUpdate(), and only if the record is actually changed and
        // saved — see hasReturnChanged(). Opening or cancelling never
        // reassigns it.
        userIdElement.value = compostReturn.user.username;
        userIdElement.readOnly = true;

        // Reason
        textReason.value = compostReturn.reason || "";

        // Return items
        returnItemList = compostReturn.compostReturnItems
            ? [...compostReturn.compostReturnItems]
            : [];
        renderReturnItemsTable();
        calcTotalReturnQty();

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

// Normalizes return sub-items to a comparable, order-independent shape.
    const normalizeReturnItems = (items) => {
        return (items || [])
            .map(item => ({
                id: item.compostsaleitem?.id,
                quantity: Number(item.quantity)
            }))
            .sort((a, b) => (a.id > b.id ? 1 : a.id < b.id ? -1 : 0));
    };

// Returns true if reference order, return date, status, reason, or
// return items differ from the original snapshot taken when the
// record was opened for edit.
    const hasReturnChanged = () => {
        if (compostReturn.compostsale?.id !== oldCompostReturn.compostsale?.id) return true;

        const newDate = compostReturn.returndate ? compostReturn.returndate.slice(0, 10) : null;
        const oldDate = oldCompostReturn.returndate ? oldCompostReturn.returndate.slice(0, 10) : null;
        if (newDate !== oldDate) return true;

        if (compostReturn.returnstatus !== oldCompostReturn.returnstatus) return true;
        if (compostReturn.reason !== oldCompostReturn.reason) return true;

        const itemsChanged = JSON.stringify(normalizeReturnItems(returnItemList))
            !== JSON.stringify(normalizeReturnItems(oldCompostReturn.compostReturnItems));
        if (itemsChanged) return true;

        return false;
    };


// ============================================================
// FORM ERROR CHECK
// ============================================================

    const checkFormErrors = () => {
        let errors = [];

        if (!compostReturn.compostsale)  errors.push("Reference Order has an error. Please check again.");
        if (!compostReturn.returndate)   errors.push("Return Date has an error. Please check again.");
        if (!compostReturn.returnstatus) errors.push("Return Status has an error. Please check again.");
        if (!compostReturn.user)         errors.push("User ID has an error. Please check again.");
        if (!compostReturn.reason)       errors.push("Reason has an error. Please check again.");

        if (returnItemList.length === 0) {
            errors.push("At least one return item must be added.");
        }

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

        compostReturn.compostReturnItems = returnItemList;

        console.log("Submitting compost return:", compostReturn);

        let response = getHTTPServiceRequest("/compost/compostreturn/save", "POST", compostReturn);

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
            loadLoggedInUserInto(compostReturn, userIdElement);
        }

        compostReturn.compostReturnItems = returnItemList;

        console.log("Updating compost return:", compostReturn);

        let response = getHTTPServiceRequest("/compost/compostreturn/update", "PUT", compostReturn);

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
                    "/compost/compostreturn" + compostReturn.id,
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
        document.querySelector("#tdReturnId").innerText     = dataOb.id         || "-";
        document.querySelector("#tdReturnNumber").innerText = dataOb.returnid   || "-";
        document.querySelector("#tdSaleRef").innerText      = dataOb.compostsale?.compostsalenumber
            || dataOb.compostsale?.id || "-";
        document.querySelector("#tdReason").innerText       = dataOb.reason     || "-";
        document.querySelector("#tdReturnDate").innerText   = dataOb.returndate
            ? dataOb.returndate.slice(0, 10)
            : "-";
        document.querySelector("#tdReturnStatus").innerText = dataOb.returnstatus || "-";
        document.querySelector("#tdReturnUser").innerText   = dataOb.user?.username
            || dataOb.user?.id || "-";

        // Fill print return items table
        const printBody = document.querySelector("#printReturnItemsBody");
        printBody.innerHTML = "";

        const items = dataOb.compostReturnItems || returnItemList;
        items.forEach((item, index) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.compostsaleitem?.compost?.name || "-"}
                — Qty: ${item.compostsaleitem?.quantity || "-"}
                @ Rs.${parseFloat(item.compostsaleitem?.unitprice || 0).toFixed(2)}
            </td>
            <td>${item.quantity || "-"}</td>
        `;
            printBody.appendChild(tr);
        });

        const editModalContent = returnAddFormModalElement.querySelector(".modal-content");
        editModalContent.classList.add("blurred");

        const viewModal = new bootstrap.Modal(printViewReturnModalElement);
        viewModal.show();

        printViewReturnModalElement.addEventListener(
            "hidden.bs.modal",
            () => {
                editModalContent.classList.remove("blurred");
            },
            { once: true }
        );
    };

    const handlePrint = () => {
        viewReturnRecord(compostReturn);
    };

    const printReturnRecord = () => {
        let newWindow = window.open();
        newWindow.document.write(
            "<html><head>" +
            "<title>Compost Return Details</title>" +
            '<link rel="stylesheet" href="/css/bootstrap-5.3.3/css/bootstrap.min.css">' +
            "</head><body>" +
            document.querySelector("#divCardPrintReturn").outerHTML +
            "</body></html>"
        );
        setInterval(() => {
            newWindow.stop();
            newWindow.print();
            newWindow.close();
        }, 500);
    };



    // ============================================================
// INIT — runs immediately when this script executes
// ============================================================
    window.initPage = function () {
        queryElements();
        loadInitialData();
        initializeForm();
        initializeEventListeners();
        refreshReturnTable();
    }
    window.initPage()
// ============================================================
// EXPOSE FUNCTIONS CALLED FROM INLINE onclick="" IN THE HTML
// ============================================================
    window.removeReturnItem = removeReturnItem;
    window.printReturnRecord = printReturnRecord;

})();