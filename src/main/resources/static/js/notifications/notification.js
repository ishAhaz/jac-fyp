// ============================================================
// DOM ELEMENT REFERENCES
// ============================================================



(function () {


    let notificationAddFormModalElement
        ,  tableBody
        ,  selectRole
        ,  selectCreatedBy
        ,  printViewNotificationModalElement
        ,  notificationForm
        ,  addNewNotificationElement
        ,  regDateElement
        ,  updateDateElement
        ,  regNoElement
        ,  textType
        , textTitle
        ,  textMessage
        ,  titleEditHide
        ,  titleNewHide
        ,  submitElement
        ,  updateElement
        ,  clearElement
        ,  printElement
        ,  deleteElement;
    const queryElements = () => {
        notificationAddFormModalElement = document.querySelector("#NotificationAddForm");

// Table body
        tableBody = document.querySelector("#tableBodyId");

// Dropdowns
        selectRole = document.querySelector("#selectRole");
        selectCreatedBy = document.querySelector("#selectCreatedBy");

// Print view modal
        printViewNotificationModalElement = document.querySelector("#NotificationViewModal");
// Form fields
        notificationForm = document.querySelector("#formNotification");
        addNewNotificationElement = document.querySelector("#addNewNotificationId");
        regDateElement = document.querySelector("#regDate");
        updateDateElement = document.querySelector("#updateDate");
        regNoElement = document.querySelector("#InputRegNo");
        textType = document.querySelector("#textType");
        textMessage = document.querySelector("#textMessage");
        textTitle = document.querySelector("#textTitle");

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

    let notificationList = [];

    let notification    = {};
    let oldNotification = {};
    let formMode = "ADD";





// ============================================================
// EVENT LISTENERS
// ============================================================

    const initializeEventListeners = () => {
        // Form field validation
        textType.addEventListener("input",         validateType);
        textMessage.addEventListener("input",      validateMessage);
        selectRole.addEventListener("change",      validateRole);
        textTitle.addEventListener("input",      validateTitle);
        // selectCreatedBy is read-only (disabled) and fully managed by
        // loadLoggedInUserInto() (on open/ADD) and hasNotificationChanged()
        // (on update) — no manual change validation needed here.

        addNewNotificationElement.addEventListener("click", () => {
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
        notification    = {};
        oldNotification = {};
        formMode = "ADD";

        notificationForm.reset();
        removeValidationStyles(notificationForm);

        regNoElement.textContent      = "-";
        updateDateElement.textContent = "-";

        let dateTime = getTodayDateTime();
        let date = dateTime.slice(0, 10);
        let time = dateTime.slice(11, 19);
        regDateElement.textContent = date + " " + time;

        // Reset fields
        textType.value    = "";
        textMessage.value = "";

        textTitle.value = "";

        generateRole();
        selectRole.value = "";

        // Auto fill currently logged-in user as the record's creator (creation case)
        loadLoggedInUserInto(notification, selectCreatedBy);
        selectCreatedBy.readOnly = true;

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
        loadRoles();
        notificationList = getServiceRequest("/notification/alldata");
    };


// ============================================================
// REFRESH TABLE
// ============================================================

    const refreshNotificationTable = () => {
        if ($.fn.DataTable.isDataTable("#tableNotification")) {
            $("#tableNotification").DataTable().destroy();
        }

        tableBody.innerHTML = "";

        let displayProperty = [
            { propertyName: "type",                 dataType: "string"   },
            // { propertyName:  "title",                dataType: "string"   },
            {propertyName: getTitle, dataType: "function" },
            { propertyName: "message",               dataType: "string"   },
            { propertyName: getRoleName,             dataType: "function" },
            { propertyName: getCreatedByUsername,    dataType: "function" },
            { propertyName: getFormattedCreatedAt,   dataType: "function" },
        ];

        fillDataIntoTableThree(
            tableBody,
            notificationList,
            displayProperty,
            refillNotificationForm
        );

        $("#tableNotification").DataTable();
    };

// Table display helpers
    const getRoleName = (ob) => {
        if (!ob.role) return "-";
        return ob.role.name || "-";
    };

    const getTitle = (ob) => {
        if (!ob.title) return "-";
        return ob.title || "-";
    }

    const getCreatedByUsername = (ob) => {
        if (!ob.user) return "-";
        return ob.user.username || ob.user.id || "-";
    };

    const getFormattedCreatedAt = (ob) => {
        if (!ob.createddatetime) return "-";
        return ob.createddatetime.slice(0, 16).replace("T", " ");
    };


// ============================================================
// DATA — ROLES
// ============================================================

    let roles = [];

    const loadRoles = () => {
        roles = getServiceRequest("/privilege/role/assignable");
    };

    const generateRole = () => {
        fillDataIntoSelect(
            selectRole,
            "Please select role..",
            roles,
            "name"
        );
    };




// ============================================================
// VALIDATION — FIELDS
// ============================================================

    const validateType = () => {
        const value   = textType.value.trim();
        const pattern = /^.{2,150}$/;

        if (value === "") {
            notification.type = null;
            setInvalid(textType);
            return;
        }

        if (pattern.test(value)) {
            notification.type = value;

            if (formMode === "EDIT" && value !== oldNotification.type) {
                setUpdated(textType);
            } else {
                setValid(textType);
            }
        } else {
            notification.type = null;
            setInvalid(textType);
        }
    };

    const validateTitle = () => {
        const value   = textTitle.value.trim();
        const pattern = /^.{2,150}$/;

        if (value === "") {
            notification.title = null;
            setInvalid(textType);
            return;
        }

        if (pattern.test(value)) {
            notification.title = value;

            if (formMode === "EDIT" && value !== oldNotification.type) {
                setUpdated(textTitle);
            } else {
                setValid(textTitle);
            }
        } else {
            notification.title = null;
            setInvalid(textTitle);
        }
    };

    const validateMessage = () => {
        const value   = textMessage.value.trim();
        const pattern = /^.{2,}$/;

        if (value === "") {
            notification.message = null;
            setInvalid(textMessage);
            return;
        }

        if (pattern.test(value)) {
            notification.message = value;

            if (formMode === "EDIT" && value !== oldNotification.message) {
                setUpdated(textMessage);
            } else {
                setValid(textMessage);
            }
        } else {
            notification.message = null;
            setInvalid(textMessage);
        }
    };

    const validateRole = () => {
        const value = selectRole.value;

        if (!value) {
            notification.role = null;
            setInvalid(selectRole);
            return;
        }

        notification.role = JSON.parse(value);

        if (formMode === "EDIT" &&
            JSON.stringify(notification.role) !== JSON.stringify(oldNotification.role)) {
            setUpdated(selectRole);
        } else {
            setValid(selectRole);
        }
    };



// ============================================================
// REFILL FORM — EDIT MODE
// ============================================================

    const refillNotificationForm = (dataOb) => {
        removeValidationStyles(notificationForm);

        let myModal = new bootstrap.Modal(notificationAddFormModalElement, {});
        formMode = "EDIT";

        notification    = getServiceRequest("/notification/byid/" + dataOb.id);
        oldNotification = JSON.parse(JSON.stringify(notification));

        // Meta
        if (notification.createddatetime) {
            let dateEdit = notification.createddatetime.slice(0, 10);
            let timeEdit = notification.createddatetime.slice(11, 19);
            regDateElement.textContent = dateEdit + " " + timeEdit;
        }

        updateDateElement.textContent = "-";
        regNoElement.textContent      = notification.id || "-";

        // Fields
        textType.value    = notification.type    || "";
        textMessage.value = notification.message || "";
        textTitle.value = notification.title || "-";

        // Role dropdown
        generateRole();
        selectRole.value = JSON.stringify(notification.role);

        // Created By field is DISPLAY ONLY here — shows whoever is currently
        // stamped on the record (creator, or last updater if reassigned).
        // We do NOT touch notification.user on open. It only gets
        // reassigned to the current session user inside handleUpdate(),
        // and only if the record is actually changed and saved — see
        // hasNotificationChanged(). Opening or cancelling never reassigns it.

        selectCreatedBy.value    = notification.user?.username || notification.user?.id || "-";
        selectCreatedBy.readOnly = true;

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

    const hasNotificationChanged = () => {
        if (notification.type !== oldNotification.type) return true;
        if (notification.message !== oldNotification.message) return true;
        if (JSON.stringify(notification.role) !== JSON.stringify(oldNotification.role)) return true;
        return false;
    };


// ============================================================
// FORM ERROR CHECK
// ============================================================

    const checkFormErrors = () => {
        let errors = [];

        if (!notification.type)    errors.push("Type has an error. Please check again.");
        if (!notification.message) errors.push("Message has an error. Please check again.");
        if (!notification.role)    errors.push("Target Role has an error. Please check again.");
        if (!notification.user)    errors.push("Created By has an error. Please check again.");

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

        console.log("Submitting notification:", notification);

        let response = getHTTPServiceRequest("/notification/save", "POST", notification);

        if (response === "OK") {
            Notiflix.Notify.success("Saved successfully");
            $("#NotificationAddForm").modal("hide");
            loadInitialData();
            refreshNotificationTable();
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
        if (hasNotificationChanged()) {
            loadLoggedInUserInto(notification, selectCreatedBy);
        }

        console.log("Updating notification:", notification);

        let response = getHTTPServiceRequest("/notification/update", "PUT", notification);

        if (response === "OK") {
            updateDateElement.textContent = new Date().toLocaleString();
            Notiflix.Notify.success("Updated successfully");
            $("#NotificationAddForm").modal("hide");
            loadInitialData();
            refreshNotificationTable();
            initializeForm();
        } else {
            Notiflix.Notify.warning("Update failed: " + response);
        }
    };

    const handleDelete = () => {
        Notiflix.Confirm.show(
            "Delete Notification",
            "Are you sure you want to delete this notification?",
            "Yes, Delete",
            "Cancel",
            () => {
                let response = getHTTPServiceRequest(
                    "/notification/" + notification.id,
                    "DELETE",
                    null
                );

                if (response !== "AJAX error") {
                    Notiflix.Notify.success("Deleted successfully");
                    $("#NotificationAddForm").modal("hide");
                    loadInitialData();
                    refreshNotificationTable();
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

    const viewNotificationRecord = (dataOb) => {
        document.querySelector("#tdNotificationId").innerText = dataOb.id      || "-";
        document.querySelector("#tdType").innerText            = dataOb.type    || "-";
        document.querySelector("#tdMessage").innerText         = dataOb.message || "-";
        document.querySelector("#tdRole").innerText             = dataOb.role
            ? dataOb.role.name
            : "-";
        document.querySelector("#tdCreatedBy").innerText        = dataOb.user
            ? (dataOb.user.username || dataOb.user.id)
            : "-";
        document.querySelector("#tdCreatedAt").innerText        = dataOb.createddatetime
            ? dataOb.createddatetime.slice(0, 16).replace("T", " ")
            : "-";

        const editModalContent = notificationAddFormModalElement.querySelector(".modal-content");
        editModalContent.classList.add("blurred");

        const viewModal = new bootstrap.Modal(printViewNotificationModalElement);
        viewModal.show();

        printViewNotificationModalElement.addEventListener(
            "hidden.bs.modal",
            () => {
                editModalContent.classList.remove("blurred");
            },
            { once: true }
        );
    };

    const handlePrint = () => {
        viewNotificationRecord(notification);
    };

    const printNotificationRecord = () => {
        let newWindow = window.open();
        newWindow.document.write(
            "<html><head>" +
            "<title>Notification Details</title>" +
            '<link rel="stylesheet" href="/css/bootstrap-5.3.3/css/bootstrap.min.css">' +
            "</head><body>" +
            document.querySelector("#divCardPrintNotification").outerHTML +
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
        refreshNotificationTable();}
    window.initPage();
    window.printNotificationRecord = printNotificationRecord;

})();