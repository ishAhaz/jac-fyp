// ==========================================
// Compost Management JS
// ==========================================
(function () {

// ==========================================
// ELEMENTS (queried fresh every time initPage() runs, since AJAX nav
// replaces the DOM nodes under #mainContent on every navigation)
// ==========================================
    let compostAddFormModelElement, printViewModelElement;
    let tableBody;
    let compostForm;
    let compostAddElement;
    let regDateElement, updateDateElement, regNoElement;
    let nameElement, statusElement, unitElement, userElement, descriptionElement;
    let ingredientElement, qtyPerUnitElement, qtyUnitElement, addIngredientButton, ingredientTableBody;
    let cropElement, qtyPerAcreElement, addCropButton, cropTableBody;
    let titleNewHide, titleEditHide;
    let submitElement, updateElement, clearElement, deleteElement, printElement;

    const queryElements = () => {

        compostAddFormModelElement = document.querySelector("#CompostAddForm");
        printViewModelElement = document.querySelector("#CompostViewModal");

        tableBody = document.querySelector("#tableBodyId");

        compostForm = document.querySelector("#formCompost");

        compostAddElement = document.querySelector("#addNewCompostId");

        regDateElement = document.querySelector("#regDate");
        updateDateElement = document.querySelector("#updateDate");
        regNoElement = document.querySelector("#InputRegNo");

        nameElement = document.querySelector("#textName");
        statusElement = document.querySelector("#selectStatus");
        unitElement = document.querySelector("#selectUnit");
        userElement = document.querySelector("#userId");
        descriptionElement = document.querySelector("#textDescription");

        ingredientElement = document.querySelector("#selectIngredient");
        qtyPerUnitElement = document.querySelector("#textQtyPerUnit");
        qtyUnitElement = document.querySelector("#selectQtyUnit");
        addIngredientButton = document.querySelector("#buttonAddIngredient");

        ingredientTableBody = document.querySelector("#tableIngredientsBody");

        cropElement = document.querySelector("#selectCrop");
        qtyPerAcreElement = document.querySelector("#textQtyPerAcre");
        addCropButton = document.querySelector("#buttonAddCrop");

        cropTableBody = document.querySelector("#tableCropsBody");

        titleNewHide = document.querySelector("#formTitleNew");
        titleEditHide = document.querySelector("#formTitleEdit");

        submitElement = document.querySelector("#buttonSubmit");
        updateElement = document.querySelector("#buttonUpdate");
        clearElement = document.querySelector("#buttonClear");
        deleteElement = document.querySelector("#buttonDelete");
        printElement = document.querySelector("#buttonPrint");
    };

// ==========================================
// VARIABLES
// ==========================================
    let compostList = [];

    let compost = {};
    let oldCompost = {};

    let formMode = "ADD";

    let selectedIngredients = [];
    let selectedCrops = [];

    let compostStatuses = [];
    let ingredients = [];
    let crops = [];

// ==========================================
// INITIAL DATA
// ==========================================
    const loadInitialData = () => {

        loadCompostStatuses();

        ingredients = getServiceRequest("/ingredient/ingredientlist/dropdown/selected");
        crops       = getServiceRequest("/crop/croplist/dropdown/selected");

        compostList = getServiceRequest("/compost/compostlist/alldata/selected");
    };

// ==========================================
// INITIALIZE FORM
// ==========================================
    const initializeForm = () => {

        compost = {};
        oldCompost = {};

        selectedIngredients = [];
        selectedCrops = [];

        formMode = "ADD";

        compostForm.reset();

        removeValidationStyles(compostForm);

        regNoElement.textContent = "-";

        let dateTime = getTodayDateTime();
        let date = dateTime.slice(0,10);
        let time = dateTime.slice(11,19);

        regDateElement.textContent = date + " " + time;
        updateDateElement.textContent = "-";

        generateStatus();
        generateIngredients();
        generateCrops();

        renderIngredientTable();
        renderCropTable();


        loadLoggedInUserInto(compost, userElement);
        userElement.readOnly = true;

        submitElement.classList.remove("d-none");
        updateElement.classList.add("d-none");
        deleteElement.classList.add("d-none");
        printElement.classList.add("d-none");
    };

// ==========================================
// EVENT LISTENERS
// ==========================================
    const initializeEventListeners = () => {

        nameElement.addEventListener("input", validateName);
        statusElement.addEventListener("change", validateStatus);
        unitElement.addEventListener("change", validateUnit);
        descriptionElement.addEventListener("input", validateDescription);

        addIngredientButton.addEventListener("click", addIngredient);
        ingredientElement.addEventListener("change", autoSetIngredientUnit);
        addCropButton.addEventListener("click", addCrop);

        submitElement.addEventListener("click", handleSubmit);
        updateElement.addEventListener("click", handleUpdate);
        deleteElement.addEventListener("click", handleDelete);
        clearElement.addEventListener("click", handleClear);
        printElement.addEventListener("click", handlePrint);

        compostAddElement.addEventListener("click", () => {

            initializeForm();
            titleEditHide.classList.add("d-none");
            titleNewHide.classList.remove("d-none");
        });
    };

// ==========================================
// REFRESH TABLE
// ==========================================
    const refreshCompostTable = () => {

        if ($.fn.DataTable.isDataTable("#tableCompost")) {
            $("#tableCompost").DataTable().destroy();
        }

        tableBody.innerHTML = "";

        let displayProperty = [

            { propertyName: "number", dataType: "string" },
            { propertyName: "name", dataType: "string" },
            { propertyName: getIngredients, dataType: "function" },
            { propertyName: getCrops, dataType: "function" },
            { propertyName: getStatus, dataType: "function" }

        ];

        fillDataIntoTableThree(
            tableBody,
            compostList,
            displayProperty,
            refillCompostForm
        );

        $("#tableCompost").DataTable();
    };

// ==========================================
// DISPLAY FUNCTIONS
// ==========================================
    const getIngredients = (ob) => {

        if (!ob.ingredients || ob.ingredients.length === 0) {
            return "No Ingredients";
        }

        return ob.ingredients.map(i => i.ingredient.name).join(", ");
    };

    const getCrops = (ob) => {

        if (!ob.crops || ob.crops.length === 0) {
            return "No Crops";
        }

        return ob.crops.map(c => c.crop.name).join(", ");
    };

    const getStatus = (ob) => {

        if (ob.status === "Active") {
            return '<p class="p-1 bg-info">Active</p>';
        }

        if (ob.status === "Inactive") {
            return '<p class="p-1 bg-danger">Inactive</p>';
        }

        return ob.status;
    };

// ==========================================
// STATUS
// ==========================================
    const loadCompostStatuses = () => {

        compostStatuses = [
            { name: "Active" },
            { name: "Inactive" }
        ];
    };

    const generateStatus = () => {

        fillDataIntoSelect(
            statusElement,
            "Select Status",
            compostStatuses,
            "name"
        );
    };

    const validateStatus = () => {

        const value = statusElement.value;

        if (value === "") {

            compost.status = null;
            setInvalid(statusElement);

            return;
        }

        compost.status = JSON.parse(value).name;

        if (formMode === "EDIT" &&
            compost.status !== oldCompost.status) {

            setUpdated(statusElement);

        } else {

            setValid(statusElement);
        }
    };

// ==========================================
// VALIDATIONS
// ==========================================
    const validateName = () => {

        const value = nameElement.value.trim();
        const pattern = /^([A-Z][a-z]{2,}[ ])+(de[ ])?([A-Z][a-z]{2,})$/;

        if(!pattern.test(value)){
            compost.name = null;
            setInvalid(nameElement);
            return;
        }


        compost.name = value;

        if (formMode === "EDIT" && value !== oldCompost.name) {

            setUpdated(nameElement);

        } else {

            setValid(nameElement);
        }
    };

    const validateUnit = () => {

        const value = unitElement.value;

        if (value === "") {

            compost.unit = null;
            setInvalid(unitElement);

            return;
        }


        compost.unit = value;
        if (formMode === "EDIT" &&
            value !== oldCompost.unit) {

            setUpdated(unitElement);

        } else {

            setValid(unitElement);
        }
    };



    const validateDescription = () => {

        const value = descriptionElement.value.trim();

        compost.description = value;

        if (value.length > 0) {

            setValid(descriptionElement);

        } else {

            descriptionElement.classList.remove("is-valid");
        }
    };

// ==========================================
// GENERATE SELECTS
// ==========================================
    const generateIngredients = () => {

        fillDataIntoSelect(
            ingredientElement,
            "Select Ingredient",
            ingredients,
            "name"
        );
    };

    const generateCrops = () => {

        fillDataIntoSelect(
            cropElement,
            "Select Crop",
            crops,
            "name"
        );
    };

// ==========================================
// ADD INGREDIENT
// ==========================================
    const addIngredient = () => {

        if (ingredientElement.value === "") {

            Notiflix.Notify.warning("Please select ingredient");
            return;
        }

        if (qtyPerUnitElement.value === "") {

            Notiflix.Notify.warning("Please enter quantity");
            return;
        }

        const ingredientObj = JSON.parse(ingredientElement.value);

        const exists = selectedIngredients.find(
            i => i.ingredient.id === ingredientObj.id

        );

        if (exists) {
            Notiflix.Notify.warning("Ingredient already added");
            return;
        }

        let ingredientData = {
            ingredient: ingredientObj,
            qtyperunit: parseFloat(qtyPerUnitElement.value),
            qtyunit: qtyUnitElement.value
        };

        selectedIngredients.push(ingredientData);

        renderIngredientTable();

        ingredientElement.value = "";
        qtyPerUnitElement.value = "";
    };

// ==========================================
// RENDER INGREDIENT TABLE
// ==========================================
    const renderIngredientTable = () => {

        ingredientTableBody.innerHTML = "";

        if (selectedIngredients.length === 0) {

            ingredientTableBody.innerHTML =
                `<tr>
                <td colspan="4" class="text-center text-muted py-3">
                    No ingredients added yet
                </td>
            </tr>`;

            return;
        }

        selectedIngredients.forEach((ing, index) => {

            ingredientTableBody.innerHTML += `
        
            <tr>
                <td>${index + 1}</td>
                <td>${ing.ingredient.name}</td>
                <td>${ing.qtyperunit} ${ing.qtyunit}</td>
                <td class="text-center">
                    <button type="button"
                        class="btn btn-sm btn-outline-danger"
                        onclick="removeIngredient(${index})">
                        ✕
                    </button>
                </td>
            </tr>
        `;
        });

        compost.ingredients = selectedIngredients;
    };

// ==========================================
// REMOVE INGREDIENT
// ==========================================
    const removeIngredient = (index) => {

        selectedIngredients.splice(index, 1);

        renderIngredientTable();
    };


    const autoSetIngredientUnit = () => {
        if (ingredientElement.value === "") return;

        const ingredientObj = JSON.parse(ingredientElement.value);

        // Ingredient.unit is "Kg" or "L" — map to subunit
        if (ingredientObj.unit) {
            const unit = ingredientObj.unit.toLowerCase();
            // Kg ingredient → measure in g, L ingredient → measure in ml
            if (unit === "kg") {
                qtyUnitElement.value = "g";
            } else if (unit === "l") {
                qtyUnitElement.value = "ml";
            }
        }
    };




// ==========================================
// ADD CROP
// ==========================================
    const addCrop = () => {

        if (cropElement.value === "") {

            Notiflix.Notify.warning("Please select crop");
            return;
        }

        if (qtyPerAcreElement.value === "") {

            Notiflix.Notify.warning("Please enter quantity");
            return;
        }

        const cropObj = JSON.parse(cropElement.value);

        const exists = selectedCrops.find(
            c => c.crop.id === cropObj.id
        );
        if (exists) {

            Notiflix.Notify.warning("Crop already added");
            return;
        }


        let cropData = {
            crop: cropObj,
            qtyperacre: parseFloat(qtyPerAcreElement.value)
        };

        selectedCrops.push(cropData);

        renderCropTable();

        cropElement.value = "";
        qtyPerAcreElement.value = "";
    };

// ==========================================
// RENDER CROP TABLE
// ==========================================
    const renderCropTable = () => {

        cropTableBody.innerHTML = "";

        if (selectedCrops.length === 0) {

            cropTableBody.innerHTML =
                `<tr>
                <td colspan="4" class="text-center text-muted py-3">
                    No crops added yet
                </td>
            </tr>`;

            return;
        }

        selectedCrops.forEach((crop, index) => {

            cropTableBody.innerHTML += `
        
            <tr>
                <td>${index + 1}</td>
                <td>${crop.crop.name}</td>
                <td>${crop.qtyperacre}</td>
                <td class="text-center">
                    <button type="button"
                        class="btn btn-sm btn-outline-danger"
                        onclick="removeCrop(${index})">
                        ✕
                    </button>
                </td>
            </tr>
        `;
        });

        compost.crops = selectedCrops;
    };

// ==========================================
// REMOVE CROP
// ==========================================
    const removeCrop = (index) => {

        selectedCrops.splice(index, 1);

        renderCropTable();
    };

// ==========================================
// VALIDATION STYLE FUNCTIONS
// setValid / setInvalid / setUpdated are NOT defined here.
// They live once, globally, in commonFunction.js — the same
// pattern compostprice.js uses. commonFunction.js's own
// loadLoggedInUserInto() also calls them directly, so if a
// module keeps its own local copy inside an IIFE, that local
// copy shadows nothing for commonFunction.js and you get
// "setValid is not defined" the moment loadLoggedInUserInto()
// runs. Don't redeclare them here — just call them.
// ==========================================

// ==========================================
// REFILL FORM
// ==========================================
    const refillCompostForm = (dataob) => {

        removeValidationStyles(compostForm);

        let mymodal = new bootstrap.Modal(compostAddFormModelElement,{});

        formMode = "EDIT";

        compost = getServiceRequest("/compost/compostlist/byid/" + dataob.id);

        oldCompost = JSON.parse(JSON.stringify(compost));

        regNoElement.textContent = compost.number;


        // Registration date
        if (compost.addeddatetime) {
            regDateElement.textContent = compost.addeddatetime.slice(0, 10) + " " + compost.addeddatetime.slice(11, 19);
        } else {
            regDateElement.textContent = "-";
        }

// Updated date
        if (compost.updateddatetime) {
            updateDateElement.textContent = compost.updateddatetime.slice(0, 10) + " " + compost.updateddatetime.slice(11, 19);
        } else {
            updateDateElement.textContent = "-";
        }

        nameElement.value = compost.name;

        generateStatus();
        statusElement.value = JSON.stringify({
            name : compost.status
        });

        unitElement.value = compost.unit;

        // User field is DISPLAY ONLY here — shows whoever is currently
        // stamped on the record (last updater, or creator if never
        // updated). We do NOT touch compost.user on open. It only gets
        // reassigned to the current session user inside handleUpdate(),
        // and only if the record is actually changed and saved — see
        // hasCompostChanged(). Opening or cancelling never reassigns it.
        userElement.value = compost.user.username;
        userElement.readOnly = true;


        descriptionElement.value = compost.description || "";

        selectedIngredients = compost.ingredients || [];
        selectedCrops = compost.crops || [];

        renderIngredientTable();
        renderCropTable();

        titleEditHide.classList.remove("d-none");
        titleNewHide.classList.add("d-none");
        submitElement.classList.add("d-none");
        updateElement.classList.remove("d-none");
        deleteElement.classList.remove("d-none");
        printElement.classList.remove("d-none");

        mymodal.show();
    };

// ==========================================
// CHANGE DETECTION — used to decide whether the
// "last updated by" user should be overwritten with the
// currently logged-in user.
// ==========================================

// Normalizes ingredient sub-items to a comparable, order-independent shape.
    const normalizeIngredientItems = (items) => {
        return (items || [])
            .map(item => ({
                id: item.ingredient?.id,
                qtyperunit: Number(item.qtyperunit),
                qtyunit: item.qtyunit
            }))
            .sort((a, b) => (a.id > b.id ? 1 : a.id < b.id ? -1 : 0));
    };

// Normalizes crop sub-items to a comparable, order-independent shape.
    const normalizeCompostCropItems = (items) => {
        return (items || [])
            .map(item => ({
                id: item.crop?.id,
                qtyperacre: Number(item.qtyperacre)
            }))
            .sort((a, b) => (a.id > b.id ? 1 : a.id < b.id ? -1 : 0));
    };

// Returns true if the name, status, unit, description, ingredients,
// or crops differ from the original snapshot taken when the record
// was opened for edit.
    const hasCompostChanged = () => {
        if (compost.name !== oldCompost.name) return true;
        if (compost.status !== oldCompost.status) return true;
        if (compost.unit !== oldCompost.unit) return true;
        if ((compost.description || "") !== (oldCompost.description || "")) return true;

        const ingredientsChanged = JSON.stringify(normalizeIngredientItems(selectedIngredients))
            !== JSON.stringify(normalizeIngredientItems(oldCompost.ingredients));
        if (ingredientsChanged) return true;

        const cropsChanged = JSON.stringify(normalizeCompostCropItems(selectedCrops))
            !== JSON.stringify(normalizeCompostCropItems(oldCompost.crops));
        if (cropsChanged) return true;

        return false;
    };

// ==========================================
// CHECK ERRORS
// ==========================================
    const checkFormErrors = () => {

        let errors = [];

        if (!compost.name) {
            errors.push("Compost name has errors");
        }

        if (!compost.status) {
            errors.push("Status has errors");
        }

        if (!compost.unit) {
            errors.push("Unit has errors");
        }

        if (!compost.user) {
            errors.push("User has errors");
        }

        if (!compost.ingredients ||
            compost.ingredients.length === 0) {

            errors.push("Please add ingredients");
        }

        if (!compost.crops ||
            compost.crops.length === 0) {

            errors.push("Please add crops");
        }

        return errors;
    };

// ==========================================
// SUBMIT
// ==========================================
    const handleSubmit = () => {

        const errors = checkFormErrors();

        if (errors.length > 0) {

            Notiflix.Notify.warning(errors.join(" | "));
            return;
        }

        let response = getHTTPServiceRequest(
            "/compost/compostlist/save",
            "POST",
            compost
        );

        if (response === "OK") {

            Notiflix.Notify.success("Saved Successfully");

            $("#CompostAddForm").modal("hide");

            loadInitialData();
            refreshCompostTable();
            initializeForm();

        } else {

            Notiflix.Notify.warning("Save Failed : " + response);
        }
    };

// ==========================================
// UPDATE
// ==========================================
    const handleUpdate = () => {

        const errors = checkFormErrors();

        if (errors.length > 0) {

            Notiflix.Notify.warning(errors.join(" | "));
            return;
        }

        // Only reassign "who touched this record" if something actually
        // changed. Records saved without any real edit keep whoever was
        // already stamped on them.
        if (hasCompostChanged()) {
            loadLoggedInUserInto(compost, userElement);
        }

        let response = getHTTPServiceRequest(
            "/compost/compostlist/update",
            "PUT",
            compost
        );

        if (response === "OK") {

            Notiflix.Notify.success("Updated Successfully");

            $("#CompostAddForm").modal("hide");

            loadInitialData();
            refreshCompostTable();
            initializeForm();

        } else {

            Notiflix.Notify.warning("Update Failed : " + response);
        }
    };

// ==========================================
// DELETE
// ==========================================
    const handleDelete = () => {

        Notiflix.Confirm.show(
            "Delete Compost",
            "Are you sure to delete this compost?",
            "Yes",
            "Cancel",

            () => {

                let response = getHTTPServiceRequest(
                    "/compost/compostlist/" + compost.id,
                    "DELETE",
                    null
                );

                if (response === "OK") {

                    Notiflix.Notify.success("Deleted Successfully");

                    $("#CompostAddForm").modal("hide");

                    loadInitialData();
                    refreshCompostTable();
                    initializeForm();

                } else {

                    Notiflix.Notify.failure("Delete Failed");
                }
            },

            () => {
                Notiflix.Notify.info("Delete Cancelled");
            }
        );
    };

// ==========================================
// CLEAR
// ==========================================
    const handleClear = () => {

        Notiflix.Confirm.show(
            "Clear Form",
            "Are you sure to clear the form?",
            "Yes",
            "Cancel",

            () => {
                initializeForm();
            },

            () => {}
        );
    };

// ==========================================
// PRINT
// ==========================================
    const printCompostRecord = () => {

        let new_window = window.open();

        new_window.document.write(
            "<html><head>" +
            "<title>Print Compost</title>" +
            '<link rel="stylesheet" href="../Resources/bootstrap-5.3.3/css/bootstrap.min.css">' +
            "</head><body>" +
            divCardPrintCompost.outerHTML +
            "</body></html>"
        );

        setInterval(() => {

            new_window.stop();
            new_window.print();
            new_window.close();

        }, 500);
    };

// ==========================================
// VIEW
// ==========================================
    const viewCompost = (dataOb) => {

        tdName.innerText = dataOb.name;
        tdStatus.innerText = dataOb.status;
        tdUnit.innerText = dataOb.unit;
        tdDescription.innerText = dataOb.description || "-";

        const viewModal = new bootstrap.Modal(printViewModelElement);

        viewModal.show();
    };

    const handlePrint = () => {

        viewCompost(compost);
    };

// ==========================================
// INIT — re-runnable entry point.
// layout-sidebar.js calls window.initPage() every time this module
// is re-entered via AJAX navigation (the DOM under #mainContent gets
// replaced, so element references and listeners must be redone).
// Runs once immediately below for the very first real page load too.
// ==========================================
    window.initPage = function () {

        queryElements();

        loadInitialData();
        initializeForm();
        initializeEventListeners();
        refreshCompostTable();
    };

    window.initPage();

// ==========================================
// EXPOSE FUNCTIONS CALLED FROM INLINE onclick=""
// IN THE TABLE ROWS / HTML — these need to exist on
// window since they're invoked outside this closure
// ==========================================
    window.removeIngredient = removeIngredient;
    window.removeCrop = removeCrop;
    window.printCompostRecord = printCompostRecord;

})();