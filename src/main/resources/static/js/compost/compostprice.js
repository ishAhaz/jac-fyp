// ============================================================
// DOM ELEMENT REFERENCES
// ============================================================
(function () {


    let priceAddFormModalElement ,tableBody;
    let selectCompostElement,selectStatusElement;
    let printViewPriceModalElement;
    let priceForm,regDateElement,updateDateElement,regNoElement,userIdElement,textTotalPrice,textMarkupPerKg,textSalePrice;
    let updateElement, clearElement,printElement;
    const queryElements = () => {
        priceAddFormModalElement = document.querySelector("#PriceAddForm");

// Table body
        tableBody = document.querySelector("#tableBodyId");

// Dropdowns
      selectCompostElement = document.querySelector("#selectCompost");
        selectStatusElement = document.querySelector("#selectStatus");

// Print view modal
        printViewPriceModalElement = document.querySelector("#PriceViewModal");

// Form fields
       priceForm = document.querySelector("#formPrice");
         regDateElement = document.querySelector("#regDate");
         updateDateElement = document.querySelector("#updateDate");
         regNoElement = document.querySelector("#InputRegNo");
         userIdElement = document.querySelector("#userId");
         textTotalPrice = document.querySelector("#textTotalPrice");
         textMarkupPerKg = document.querySelector("#textMarkupPerKg");
         textSalePrice = document.querySelector("#textSalePrice");

// Buttons
       updateElement = document.querySelector("#buttonUpdate");
       clearElement = document.querySelector("#buttonClear");
         printElement = document.querySelector("#buttonPrint");

    }

// ============================================================
// STATE
// ============================================================

    let priceList = [];

    let compostPrice    = {};
    let oldCompostPrice = {};


// ============================================================
// EVENT LISTENERS
// ============================================================

    const initializeEventListeners = () => {
        // Form field validation
        selectCompostElement.addEventListener("change", validateCompost);
        textMarkupPerKg.addEventListener("input",      validateMarkupPerKg);
        selectStatusElement.addEventListener("change", validateStatus);

        // Buttons
        updateElement.addEventListener("click", handleUpdate);
        clearElement.addEventListener("click",  handleClear);

        printElement.addEventListener("click",  handlePrint);
    };


// ============================================================
// LOAD INITIAL DATA
// ============================================================

    const loadInitialData = () => {
        loadCompostList();
        loadStatusList();
        priceList = getServiceRequest("/compost/compostprice/alldata/selected");
    };


// ============================================================
// REFRESH TABLE
// ============================================================

    const refreshPriceTable = () => {
        if ($.fn.DataTable.isDataTable("#tablePrice")) {
            $("#tablePrice").DataTable().destroy();
        }

        tableBody.innerHTML = "";

        let displayProperty = [
            { propertyName: "priceid",              dataType: "string"   },
            { propertyName: getPriceCompost,         dataType: "function" },
            { propertyName: "totalprice",            dataType: "string"   },
            { propertyName: "markupperkg",           dataType: "string"   },
            { propertyName: "saleprice",             dataType: "string"   },
            { propertyName: getPriceAddedDate,       dataType: "function" },
            { propertyName: getPriceUser,            dataType: "function" },
            {propertyName: getPriceStatus, dataType: "function"}
        ];

        fillDataIntoTableThree(
            tableBody,
            priceList,
            displayProperty,
            refillPriceForm
        );

        $("#tablePrice").DataTable();
    };

// Table display helpers
    const getPriceCompost = (ob) => {
        return ob.compost?.name || "-";
    };

    const getPriceAddedDate = (ob) => {
        if (!ob.addeddatetime) return "-";
        return ob.addeddatetime.slice(0, 10);
    };

    const getPriceUser = (ob) => {
        return ob.user?.username || ob.user?.id || "-";
    };

    const getPriceStatus = (ob) => {
        if (ob.statuspending === "Active")   return '<p class="p-1 bg-info">Active</p>';
        if (ob.statuspending === "Inactive") return '<p class="p-1 bg-danger">Inactive</p>';
        if (ob.statuspending === "Pending")  return '<p class="p-1 bg-warning">Pending</p>';
        return ob.statuspending || "-";
    };


// ============================================================
// DROPDOWN DATA — COMPOST
// ============================================================

    let compostList = [];

    const loadCompostList = () => {
        compostList = getServiceRequest("/compost/compostlist/alldata/selected");
    };

    const generateCompostSelect = () => {
        fillDataIntoSelect(
            selectCompostElement,
            "Select Compost",
            compostList,
            "name"
        );
    };

    const validateCompost = () => {
        const value = selectCompostElement.value;

        if (!value) {
            compostPrice.compost = null;
            compostPrice.totalprice = null;
            setInvalid(selectCompostElement);
            textTotalPrice.value = "";
            textSalePrice.value  = "";
            return;
        }

        const parsed = JSON.parse(value);
        compostPrice.compost = parsed;

        // Fetch ingredient cost per kg for selected compost
        loadIngredientCostForCompost(parsed.id);

        if (JSON.stringify(compostPrice.compost) !== JSON.stringify(oldCompostPrice.compost)) {
            setUpdated(selectCompostElement);
        } else {
            setValid(selectCompostElement);
        }
    };

    const loadIngredientCostForCompost = (compostId) => {
        const result = getServiceRequest("/compost/ingredientcost/" + compostId);
        const cost   = result?.ingredientcostperkg || result?.totalprice || 0;

        textTotalPrice.value        = parseFloat(cost).toFixed(2);
        compostPrice.totalprice     = parseFloat(cost);

        recalculateSalePrice();
    };


// ============================================================
// DROPDOWN DATA — STATUS (StatusPending enum)
// ============================================================

    let statusList = [];

    const loadStatusList = () => {
        statusList = [
            { name: "Active"   },
            { name: "Inactive" },
            { name: "Pending"  }
        ];
    };

    const generateStatusSelect = () => {
        fillDataIntoSelect(
            selectStatusElement,
            "Select Status",
            statusList,
            "name"
        );
    };

    const validateStatus = () => {
        const value = selectStatusElement.value;

        if (!value) {
            compostPrice.statuspending = null;
            setInvalid(selectStatusElement);
            return;
        }

        const parsed = JSON.parse(value);
        compostPrice.statuspending = parsed.name;

        if (compostPrice.statuspending !== oldCompostPrice.statuspending) {
            setUpdated(selectStatusElement);
        } else {
            setValid(selectStatusElement);
        }
    };


// ============================================================
// VALIDATION — MAIN FIELDS
// ============================================================

    const validateMarkupPerKg = () => {
        const value = parseFloat(textMarkupPerKg.value);

        if (isNaN(value) || value < 0) {
            compostPrice.markupperkg = null;
            compostPrice.saleprice   = null;
            setInvalid(textMarkupPerKg);
            textSalePrice.value = "";
            return;
        }

        compostPrice.markupperkg = value;

        recalculateSalePrice();

        if (value !== oldCompostPrice.markupperkg) {
            setUpdated(textMarkupPerKg);
        } else {
            setValid(textMarkupPerKg);
        }
    };

// ============================================================
// SALE PRICE AUTO-CALCULATION
// ============================================================

    const recalculateSalePrice = () => {
        const cost   = parseFloat(textTotalPrice.value)  || 0;
        const markup = parseFloat(textMarkupPerKg.value) || 0;
        const sale   = cost + markup;

        textSalePrice.value   = sale > 0 ? sale.toFixed(2) : "";
        compostPrice.saleprice = sale > 0 ? sale : null;
    };




// ============================================================
// LOAD / REFILL FORM
// ============================================================
// Single entry point into the modal. Always loads an existing
// record — there is no blank/ADD state.

    const refillPriceForm = (dataOb) => {
        removeValidationStyles(priceForm);

        let myModal = new bootstrap.Modal(priceAddFormModalElement, {});

        compostPrice    = getServiceRequest("/compost/compostprice/byid/" + dataOb.id);
        oldCompostPrice = JSON.parse(JSON.stringify(compostPrice)); // untouched snapshot for change detection

        // Meta
        let dateTimeEdit = compostPrice.addeddatetime;
        let dateEdit = dateTimeEdit.slice(0, 10);
        let timeEdit = dateTimeEdit.slice(11, 19);
        regDateElement.textContent = dateEdit + " " + timeEdit;

        if (!compostPrice.updateddatetime) {
            updateDateElement.textContent = "-";
        } else {
            let dateTimeUpdate = compostPrice.updateddatetime;
            let dateUpdate = dateTimeUpdate.slice(0, 10);
            let timeUpdate = dateTimeUpdate.slice(11, 19);
            updateDateElement.textContent = dateUpdate + " " + timeUpdate;
        }

        regNoElement.textContent = compostPrice.priceid || "-";

        // Compost select
        generateCompostSelect();
        if (compostPrice.compost) {
            selectCompostElement.value = JSON.stringify(compostPrice.compost);
        }

        // User field is DISPLAY ONLY here — shows whoever is currently
        // stamped on the record (last updater, or creator if never updated).
        // We do NOT touch compostPrice.user on open. It only gets
        // reassigned to the current session user inside handleUpdate(),
        // and only if the record is actually changed and saved — see
        // hasCompostPriceChanged(). This avoids attributing a record to
        // someone who merely opened and then cancelled/closed it.
        userIdElement.value = compostPrice.user?.username || compostPrice.user?.id || "-";
        userIdElement.readOnly = true;

        // Price fields
        textTotalPrice.value  = compostPrice.totalprice  || "";
        textMarkupPerKg.value = compostPrice.markupperkg || "";
        textSalePrice.value   = compostPrice.saleprice   || "";

        // Status select
        generateStatusSelect();
        if (compostPrice.statuspending) {
            selectStatusElement.value = JSON.stringify({ name: compostPrice.statuspending });
        }

        myModal.show();
    };


// ============================================================
// CHANGE DETECTION — used to decide whether the "last updated by"
// user should be overwritten with the currently logged-in user.
// Only the fields a person can actually edit on this form are
// compared: compost selection, markup, and status. totalprice and
// saleprice are derived from those, so they don't need separate
// comparison.
// ============================================================

    const hasCompostPriceChanged = () => {
        const compostChanged = compostPrice.compost?.id !== oldCompostPrice.compost?.id;
        if (compostChanged) {
            return true;
        }

        const markupChanged = compostPrice.markupperkg !== oldCompostPrice.markupperkg;
        if (markupChanged) {
            return true;
        }

        const statusChanged = compostPrice.statuspending !== oldCompostPrice.statuspending;
        if (statusChanged) {
            return true;
        }

        return false;
    };


// ============================================================
// FORM ERROR CHECK
// ============================================================

    const checkFormErrors = () => {
        let errors = [];

        if (!compostPrice.compost)      errors.push("Compost has an error. Please check again.");
        if (compostPrice.markupperkg === null || compostPrice.markupperkg === undefined) {
            errors.push("Markup Per Unit has an error. Please check again.");
        }
        if (!compostPrice.saleprice)    errors.push("Sale Price could not be calculated. Please check again.");
        if (!compostPrice.statuspending) errors.push("Status has an error. Please check again.");

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
        if (hasCompostPriceChanged()) {
            loadLoggedInUserInto(compostPrice, userIdElement);
        }

        if (!compostPrice.user) {
            Notiflix.Notify.warning("User ID has an error. Please check again.");
            return;
        }

        console.log("Updating compost price:", compostPrice);

        let response = getHTTPServiceRequest("/compost/compostprice/update", "PUT", compostPrice);

        if (response === "OK") {
            updateDateElement.textContent = new Date().toLocaleString();
            Notiflix.Notify.success("Updated successfully");
            $("#PriceAddForm").modal("hide");
            loadInitialData();
            refreshPriceTable();
        } else {
            Notiflix.Notify.warning("Update failed: " + response);
        }
    };



// Clear now means "discard unsaved changes" — reloads the same
// record fresh from the server, since there's no ADD state to
// fall back to.
    const handleClear = () => {
        Notiflix.Confirm.show(
            "Discard Changes",
            "Are you sure you want to discard your changes?",
            "Yes, Discard",
            "Cancel",
            () => {
                refillPriceForm({ id: compostPrice.id });
            },
            () => {}
        );
    };


// ============================================================
// PRINT / VIEW
// ============================================================

    const viewPriceRecord = (dataOb) => {
        document.querySelector("#tdPriceId").innerText             = dataOb.priceid             || "-";
        document.querySelector("#tdCompost").innerText             = dataOb.compost?.name       || "-";
        document.querySelector("#tdIngredientCostPerKg").innerText = dataOb.totalprice          || "-";
        document.querySelector("#tdMarkupPerKg").innerText         = dataOb.markupperkg         || "-";
        document.querySelector("#tdSalePrice").innerText           = dataOb.saleprice           || "-";
        document.querySelector("#tdAddedDate").innerText           = dataOb.addeddatetime
            ? dataOb.addeddatetime.slice(0, 16).replace("T", " ")
            : "-";
        document.querySelector("#tdUpdatedDate").innerText         = dataOb.updateddatetime
            ? dataOb.updateddatetime.slice(0, 16).replace("T", " ")
            : "-";
        document.querySelector("#tdUser").innerText                = dataOb.user?.username || dataOb.user?.id || "-";

        const editModalContent = priceAddFormModalElement.querySelector(".modal-content");
        editModalContent.classList.add("blurred");

        const viewModal = new bootstrap.Modal(printViewPriceModalElement);
        viewModal.show();

        printViewPriceModalElement.addEventListener(
            "hidden.bs.modal",
            () => {
                editModalContent.classList.remove("blurred");
            },
            { once: true }
        );
    };

    const handlePrint = () => {
        viewPriceRecord(compostPrice);
    };

    const printPriceRecord = () => {
        let newWindow = window.open();
        newWindow.document.write(
            "<html><head>" +
            "<title>Compost Price Details</title>" +
            '<link rel="stylesheet" href="/css/bootstrap-5.3.3/css/bootstrap.min.css">' +
            "</head><body>" +
            document.querySelector("#divCardPrintPrice").outerHTML +
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
// (replaces the old window "load" listener, which only ever
// fires once per real page load and never again on SPA
// navigation back to this page)
// ============================================================
    window.initPage = function () {

        queryElements();

        loadInitialData();
        initializeEventListeners();
        refreshPriceTable();
    };

    window.initPage();
// ============================================================
// EXPOSE FUNCTIONS CALLED FROM INLINE onclick="" IN THE HTML
// (e.g. a print button inside the view/print modal) — these
// need to exist on window since they're invoked outside this
// closure
// ============================================================
    window.printPriceRecord = printPriceRecord;

})();