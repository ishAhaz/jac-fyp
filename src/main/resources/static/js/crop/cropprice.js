// ──────────────────────────────────────────────
// DOM ELEMENT REFERENCES
// ──────────────────────────────────────────────

(function () {

    let cropPriceAddFormModalElement
        ,tableBody
        , printViewModalElement
        , cropPriceForm
        , addDateElement
        , updateDateElement
        , inputCropElement
        , textBuyPriceElement
        , numberMarkupPriceElement
        , numberRealPricePerKgElement
        , selectStatusElement
        , userIdElement
        ,updateElement
        ,clearElement
        ,  printElement
        ,  tdViewAddedDatetime
        , tdViewCrop
        , tdViewBuyPrice
        , tdViewMarkupPrice
        , tdViewSellPrice
        , tdViewStatus
        , tdViewUser
        , divCardPrintCropPrice;
    const queryElements = () => {
        cropPriceAddFormModalElement = document.querySelector("#CropPriceAddForm");

// Table body
        tableBody = document.querySelector("#tableBodyId");

// Print view modal
        printViewModalElement = document.querySelector("#CropPriceViewModal");

// Form
        cropPriceForm = document.querySelector("#formCropPrice");

// Header info display
        addDateElement = document.querySelector("#addDate");
        updateDateElement = document.querySelector("#updateDate");

// Form fields
        inputCropElement = document.querySelector("#inputCrop");
        textBuyPriceElement = document.querySelector("#textBuyPrice");
        numberMarkupPriceElement = document.querySelector("#numberMarkupPrice");
        numberRealPricePerKgElement = document.querySelector("#numberRealPricePerKg");
        selectStatusElement = document.querySelector("#selectStatus");
        userIdElement = document.querySelector("#userId");

// Buttons
        updateElement = document.querySelector("#buttonUpdate");
        clearElement = document.querySelector("#buttonClear");
        printElement = document.querySelector("#buttonPrint");

// Print view cells
        tdViewAddedDatetime = document.querySelector("#tdViewAddedDatetime");
        tdViewCrop = document.querySelector("#tdViewCrop");
        tdViewBuyPrice = document.querySelector("#tdViewBuyPrice");
        tdViewMarkupPrice = document.querySelector("#tdViewMarkupPrice");
        tdViewSellPrice = document.querySelector("#tdViewSellPrice");
        tdViewStatus = document.querySelector("#tdViewStatus");
        tdViewUser = document.querySelector("#tdViewUser");
        divCardPrintCropPrice = document.querySelector("#divCardPrintCropPrice");
    }
// ──────────────────────────────────────────────
// STATE
// ──────────────────────────────────────────────

    let cropPriceList = [];

    let cropPrice    = {};
    let oldCropPrice = {};
    let formMode     = "ADD";



// ──────────────────────────────────────────────
// EVENT LISTENERS
// ──────────────────────────────────────────────
// NOTE: this form has no "Add New" trigger and no submit/POST path —
// it is purely EDIT, reached only via refillCropPriceForm() (row
// click), same pattern as the ingredient price / compost price
// modules.

    const initializeEventListeners = () => {
        numberMarkupPriceElement.addEventListener("input", validateMarkupPrice);
        selectStatusElement.addEventListener("change",      validateStatus);

        updateElement.addEventListener("click", handleUpdate);
        clearElement.addEventListener("click",  handleClear);
        printElement.addEventListener("click",  handlePrint);
    };

// ──────────────────────────────────────────────
// LOAD REFERENCE DATA
// ──────────────────────────────────────────────

    const loadInitialData = () => {
        cropPriceList = getServiceRequest("/crop/cropprice/alldata/selected");
    };

// ──────────────────────────────────────────────
// FORM INITIALIZE  (reset to ADD mode / clean baseline)
// ──────────────────────────────────────────────
// NOTE: no user-capture call here — unlike ingredient.js's ADD mode,
// this form never creates a brand-new record (no submit/POST path),
// so there's no "record creation" moment that needs an initial user
// stamp. The user field only ever gets touched in EDIT mode, inside
// handleUpdate(), gated by hasCropPriceChanged().

    const initializeForm = () => {
        cropPrice    = {};
        oldCropPrice = {};
        formMode     = "ADD";

        cropPriceForm.reset();
        removeValidationStyles(cropPriceForm);

        let dateTime = getTodayDateTime();
        let date = dateTime.slice(0, 10);
        let time = dateTime.slice(11, 19);
        addDateElement.textContent    = date + " " + time;
        updateDateElement.textContent = "-";

        // Read-only / auto-filled fields
        inputCropElement.value    = "";
        textBuyPriceElement.value = "";

        // Editable-but-derived fields — explicitly cleared for a clean
        // baseline instead of relying only on form.reset()
        numberMarkupPriceElement.value    = "";
        numberRealPricePerKgElement.value = "";
        numberRealPricePerKgElement.readOnly = true; // always derived, never hand-typed

        // No ADD flow reaches this form (no submit button, no POST path).
        // The user field is only ever populated in
        // refillCropPriceForm() (display) and handleUpdate()
        // (reassignment).
        userIdElement.value    = "";
        userIdElement.readOnly = true;

        updateElement.classList.add("d-none");
        printElement.classList.add("d-none");
    };

// ──────────────────────────────────────────────
// FIELD VALIDATION
// ──────────────────────────────────────────────

    const validateMarkupPrice = () => {
        const value = parseFloat(numberMarkupPriceElement.value);

        if (isNaN(value) || value < 0) {
            cropPrice.markupprice = null;
            setInvalid(numberMarkupPriceElement);
            autoCalculateRealPrice(); // clear/refresh real price on invalid input too
            return;
        }

        cropPrice.markupprice = value;
        autoCalculateRealPrice();

        if (formMode === "EDIT" && value !== oldCropPrice.markupprice) {
            setUpdated(numberMarkupPriceElement);
        } else {
            setValid(numberMarkupPriceElement);
        }
    };

// real price = buy price + markup price
// Uses isNaN()/>=0 checks (not truthy checks) so a legitimate
// buy price of 0 is still treated as valid input.
    const autoCalculateRealPrice = () => {
        const buy    = parseFloat(textBuyPriceElement.value); // read-only, from suggestion
        const markup = parseFloat(numberMarkupPriceElement.value);

        if (!isNaN(buy) && !isNaN(markup) && buy >= 0 && markup >= 0) {
            const real = parseFloat((buy + markup).toFixed(2));
            numberRealPricePerKgElement.value = real.toFixed(2);
            cropPrice.realprice         = real;
        } else {
            numberRealPricePerKgElement.value = "";
            cropPrice.realprice        = null;
        }
    };

    const validateStatus = () => {
        const value = selectStatusElement.value;

        if (!value) {
            cropPrice.status = null;
            setInvalid(selectStatusElement);
            return;
        }

        cropPrice.status = value;

        if (formMode === "EDIT" && value !== oldCropPrice.status) {
            setUpdated(selectStatusElement);
        } else {
            setValid(selectStatusElement);
        }
    };

// ──────────────────────────────────────────────
// REFRESH MAIN TABLE
// ──────────────────────────────────────────────

    const refreshCropPriceTable = () => {

        cropPriceList.sort((a, b) => {
            const aPending = a.status === "Pending";
            const bPending = b.status === "Pending";
            if (aPending && !bPending) return -1;
            if (!aPending && bPending) return 1;
            return 0;
        });

        if ($.fn.DataTable.isDataTable("#tableCropPrice")) {
            $("#tableCropPrice").DataTable().destroy();
        }

        tableBody.innerHTML = "";

        let displayProperty = [
            { propertyName: getCropDisplay,        dataType: "function" },
            { propertyName: getBuyPriceDisplay,    dataType: "function" },
            { propertyName: getMarkupPriceDisplay, dataType: "function" },
            { propertyName: getRealPriceDisplay,   dataType: "function" },
            { propertyName: getAddedDateDisplay,   dataType: "function" },
            { propertyName: getStatusDisplay,      dataType: "function" },
            { propertyName: getUserDisplay,        dataType: "function" },
        ];

        fillDataIntoTableThree(
            tableBody,
            cropPriceList,
            displayProperty,
            refillCropPriceForm
        );

        $("#tableCropPrice").DataTable();
    };

// Helper display functions for table
    const getCropDisplay        = (ob) => ob.crop?.name || "-";
    const getBuyPriceDisplay    = (ob) => ob.suggestedpriceperkg  != null ? "Rs. " + ob.suggestedpriceperkg.toFixed(2)  : "-";
    const getMarkupPriceDisplay = (ob) => ob.markupprice    != null ? "Rs. " + ob.markupprice.toFixed(2)    : "-";
    const getRealPriceDisplay   = (ob) => ob.realprice != null ? "Rs. " + ob.realprice.toFixed(2) : "-";
    const getAddedDateDisplay   = (ob) => ob.addeddatetime
        ? ob.addeddatetime.slice(0, 10) + " " + ob.addeddatetime.slice(11, 19)
        : "-";
    const getUserDisplay   = (ob) => ob.user?.username || ob.user?.id || "-";
    const getStatusDisplay = (ob) => {
        if (!ob.status) return "-";
        if (ob.status === "Active")   return '<p class="p-1 bg-success">Active</p>';
        if (ob.status === "Inactive") return '<p class="p-1 bg-secondary">Inactive</p>';
        if (ob.status === "Pending")  return '<p class="p-1 bg-warning text-dark">Pending</p>';
        return ob.status;
    };

// ──────────────────────────────────────────────
// REFILL FORM  (EDIT mode — triggered from table row click)
// ──────────────────────────────────────────────

    const refillCropPriceForm = (dataOb) => {
        removeValidationStyles(cropPriceForm);

        let myModal = new bootstrap.Modal(cropPriceAddFormModalElement, {});
        formMode = "EDIT";

        cropPrice    = getServiceRequest("/crop/cropprice/byid/" + dataOb.id);
        oldCropPrice = JSON.parse(JSON.stringify(cropPrice));

        // Dates
        addDateElement.textContent = cropPrice.addeddatetime
            ? cropPrice.addeddatetime.slice(0, 10) + " " + cropPrice.addeddatetime.slice(11, 19)
            : "-";

        updateDateElement.textContent = cropPrice.updateddatetime
            ? cropPrice.updateddatetime.slice(0, 10) + " " + cropPrice.updateddatetime.slice(11, 19)
            : "-";

        // Read-only auto-filled fields
        inputCropElement.value    = cropPrice.crop?.name || "";
        textBuyPriceElement.value = cropPrice.suggestedpriceperkg != null
            ? cropPrice.suggestedpriceperkg.toFixed(2)
            : "";

        // Editable field
        numberMarkupPriceElement.value = cropPrice.markupprice != null ? cropPrice.markupprice : "";

        // Derived / read-only field — populate from stored value on open
        // (not recalculated here) so the displayed record reflects
        // exactly what's saved until the user actually touches markup.
        // FIX: was reading the nonexistent field "realpriceperkg" — the
        // entity field is "realprice" everywhere else in this file
        // (see autoCalculateRealPrice, getRealPriceDisplay, checkFormErrors).
        numberRealPricePerKgElement.value = cropPrice.realprice != null
            ? cropPrice.realprice.toFixed(2)
            : "";
        numberRealPricePerKgElement.readOnly = true;

        selectStatusElement.value = cropPrice.status || "";

        // ============================================================
        // USER FIELD — DISPLAY ONLY on open. Mirrors ingredientprice.js
        // exactly: we never touch cropPrice.user here. It shows whoever
        // is currently stamped on the record (last updater, or creator
        // if never updated). Reassignment only happens later, inside
        // handleUpdate(), and only if the record is actually changed —
        // see hasCropPriceChanged(). Opening or cancelling the form
        // never reassigns ownership.
        // ============================================================
        userIdElement.value    = cropPrice.user?.username || cropPrice.user?.id || "-";
        userIdElement.readOnly = true;

        // Button visibility
        updateElement.classList.remove("d-none");
        printElement.classList.remove("d-none");

        myModal.show();
    };

// ──────────────────────────────────────────────
// CHANGE DETECTION — used to decide whether the "last updated by"
// user should be overwritten with the currently logged-in user.
// Mirrors hasIngredientPriceChanged() from ingredientprice.js
// field-for-field: only the editable fields on this form are
// compared — markup price and status. Real price is derived from
// buy price + markup, so it doesn't need separate comparison.
// ──────────────────────────────────────────────

    const hasCropPriceChanged = () => {
        if (cropPrice.markupprice !== oldCropPrice.markupprice) return true;
        if (cropPrice.status !== oldCropPrice.status) return true;
        return false;
    };

// ──────────────────────────────────────────────
// FORM ERROR CHECK
// ──────────────────────────────────────────────

    const checkFormErrors = () => {
        let errors = [];

        if (!cropPrice.status)
            errors.push("Status has an error. Please check again.");
        if (cropPrice.realprice == null || isNaN(cropPrice.realprice))
            errors.push("Real Price Per Kg has an error. Please check again.");
        if (cropPrice.markupprice == null || isNaN(cropPrice.markupprice))
            errors.push("Markup Price has an error. Please check again.");
        if (cropPrice.suggestedpriceperkg == null || cropPrice.suggestedpriceperkg < 0)
            errors.push("Buy Price calculation error. Please check markup and real price values.");

        return errors;
    };

// ──────────────────────────────────────────────
// CRUD HANDLERS
// ──────────────────────────────────────────────

    const handleUpdate = () => {
        const errors = checkFormErrors();
        if (errors.length > 0) {
            Notiflix.Notify.warning(errors.join(" | "));
            return;
        }

        // Only reassign "who touched this record" if something actually
        // changed. Records saved without any real edit keep whoever was
        // already stamped on them. Mirrors handleUpdate() in
        // ingredientprice.js exactly.
        if (hasCropPriceChanged()) {
            loadLoggedInUserInto(cropPrice, userIdElement);
        }

        if (!cropPrice.user) {
            Notiflix.Notify.warning("User ID has an error. Please check again.");
            return;
        }

        console.log("Updating crop price:", cropPrice);

        let response = getHTTPServiceRequest("/crop/cropprice/update", "PUT", cropPrice);

        if (response === "OK") {
            updateDateElement.textContent = new Date().toLocaleString();
            Notiflix.Notify.success("Updated successfully");
            $("#CropPriceAddForm").modal("hide");
            loadInitialData();
            refreshCropPriceTable();
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
            () => {
                initializeForm();
            },
            () => {}
        );
    };

// ──────────────────────────────────────────────
// PRINT / VIEW
// ──────────────────────────────────────────────

    const viewCropPriceRecord = (dataOb) => {
        tdViewAddedDatetime.innerText = dataOb.addeddatetime
            ? dataOb.addeddatetime.slice(0, 10) + " " + dataOb.addeddatetime.slice(11, 19)
            : "-";
        tdViewCrop.innerText        = dataOb.crop?.name || "-";
        tdViewBuyPrice.innerText    = dataOb.suggestedpriceperkg  != null ? "Rs. " + dataOb.suggestedpriceperkg.toFixed(2)  : "-";
        tdViewMarkupPrice.innerText = dataOb.markupprice    != null ? "Rs. " + dataOb.markupprice.toFixed(2)    : "-";
        tdViewSellPrice.innerText   = dataOb.realprice != null ? "Rs. " + dataOb.realprice.toFixed(2) : "-";
        tdViewStatus.innerText      = dataOb.status || "-";
        tdViewUser.innerText        = dataOb.user?.username || dataOb.user?.id || "-";

        const editModalContent = cropPriceAddFormModalElement.querySelector(".modal-content");
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
        viewCropPriceRecord(cropPrice);
    };

    const printCropPriceRecord = () => {
        let newWindow = window.open();
        newWindow.document.write(
            "<html><head>" +
            "<title>Print Crop Price</title>" +
            '<link rel="stylesheet" href="/css/bootstrap-5.3.3/css/bootstrap.min.css">' +
            "</head><body>" +
            divCardPrintCropPrice.outerHTML +
            "</body></html>"
        );

        setInterval(() => {
            newWindow.stop();
            newWindow.print();
            newWindow.close();
        }, 500);
    };
// ──────────────────────────────────────────────
// BOOT
// ──────────────────────────────────────────────

    window.initPage = function () {
        queryElements();
        loadInitialData();
        initializeForm();
        initializeEventListeners();
        refreshCropPriceTable();}
    window.initPage();

    window.printCropRecord = printCropPriceRecord;

})();