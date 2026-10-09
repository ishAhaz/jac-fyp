//********************************
//*******id query Selector********

//***********Query select and id start***********
//***********************************************
(function () {
let privilegeAddFormModelElement
    ,  tableBody
    ,  privilegeAddElement
    ,  privilegeForm
    ,  formTitleNewElement
    ,  formTitleEditElement
    ,  regDateElement
    ,  updateDateElement
    ,  formRoleElement
    ,  formModuleElement
    ,  formPrivSelectElement
    ,  formPrivInsertElement
    ,  formPrivUpdateElement
    ,  formPrivDeleteElement
    ,  formPrivApproveElement
    ,  labelSelectElement
    ,  labelInsertElement
    ,  labelUpdateElement
    ,  labelDeleteElement
    ,  userIdElement
    ,  formNoteElement
    ,  btnClearElement
    , btnPrintElement
    ,  btnDeleteElement
    ,  btnUpdateElement
    ,  btnSubmitElement
    ,  tableHeadElement
    ,  privilegeViewModalElement
    ,  printCardElement
    ,  printEmployeeElement
    ,  printUsernameElement
    ,  printEmailElement
    ,  printRoleElement
    ,printStatusElement;

const queryElements = () => {
   privilegeAddFormModelElement = document.querySelector("#privilegeAddForm");

// table body
     tableBody = document.querySelector("#tableBodyId");
     privilegeAddElement = document.querySelector("#addNewPrivilegeId");

// form fields
     privilegeForm = document.querySelector("#formPrivilege");
     formTitleNewElement = document.querySelector("#formTitleNew");
     formTitleEditElement = document.querySelector("#formTitleEdit");

//dates
     regDateElement = document.querySelector("#regDate");
     updateDateElement = document.querySelector("#updateDate");

// dropdowns
     formRoleElement = document.querySelector("#selectRole");
     formModuleElement = document.querySelector("#selectModule");

// checkboxes
     formPrivSelectElement = document.querySelector("#PrivSelect");
     formPrivInsertElement = document.querySelector("#PrivInsert");
     formPrivUpdateElement = document.querySelector("#PrivUpdate");
     formPrivDeleteElement = document.querySelector("#PrivDelete");
     formPrivApproveElement = document.querySelector("#PrivApprove");

// checkbox labels
     labelSelectElement = document.querySelector("#labelSelect");
     labelInsertElement = document.querySelector("#labelInsert");
     labelUpdateElement = document.querySelector("#labelUpdate");
     labelDeleteElement = document.querySelector("#labelDelete");


//user
     userIdElement = document.querySelector("#userId");
// note
     formNoteElement = document.querySelector("#textPrivilegeNote");

// buttons
     btnClearElement = document.querySelector("#buttonClear");
     btnPrintElement = document.querySelector("#buttonPrint");
     btnDeleteElement = document.querySelector("#buttonDelete");
     btnUpdateElement = document.querySelector("#buttonUpdate");
     btnSubmitElement = document.querySelector("#buttonSubmit");

// table
     tableHeadElement = document.querySelector("#tableHeadId");
     privilegeViewModalElement = document.querySelector("#PrivilegeViewModal");

// print view
     printCardElement = document.querySelector("#divCardPrintPrivilege")
     printEmployeeElement = document.querySelector("#tdEmployee");
     printUsernameElement = document.querySelector("#tdUsername");
     printEmailElement = document.querySelector("#tdEmail");
     printRoleElement = document.querySelector("#tdRole");
     printStatusElement = document.querySelector("#tdStatus");
  }
//***********query select and id end***********
//***********************************************
//********************************
//********************************





//********************************
//******object and window load****

let privilegeList = [];

let privilege = {};
let oldPrivilege = {};
let formMode = "ADD";


//********************************
//********************************





//********************************
//****initializeEventListeners****
const initializeEventListeners = () => {
  //form field validation
  formRoleElement.addEventListener("change", validateRole);
  formModuleElement.addEventListener("change", validateModule);
  formPrivDeleteElement.addEventListener("click",validateDelete);
  formPrivInsertElement.addEventListener("click",validateInsert);
  formPrivSelectElement.addEventListener("click",validateSelect);
  formPrivUpdateElement.addEventListener("click",validateUpdate);
  formNoteElement.addEventListener("input",validateNote);
  // userIdElement is read-only and fully managed by loadLoggedInUserInto()
  // (on open/ADD) and by hasPrivilegeChanged() (on update) — no manual input
  // validation needed here anymore.
  privilegeAddElement.addEventListener("click", () => {
    initializeForm();
    formTitleEditElement.classList.add("d-none");
    formTitleNewElement.classList.remove("d-none");
  });


  btnSubmitElement.addEventListener("click", handleSubmit);
  btnUpdateElement.addEventListener("click", handleUpdate);
  btnClearElement.addEventListener("click", handleClear);
  btnDeleteElement.addEventListener("click", handleDelete);
  btnPrintElement.addEventListener("click", handlePrint);
}
//********************************
//********************************




//********************************
//*******initializeForm***********
const initializeForm = () => {
  privilege = {};
  oldPrivilege = {};
  formMode = "ADD";
  privilegeForm.reset();
  removeValidationStyles(privilegeForm);

  let dateTime = getTodayDateTime();
  let date = dateTime.slice(0,10);
  let time = dateTime.slice(11,19);
  regDateElement.textContent = date + " " + time;
  updateDateElement.textContent = "-";

  formModuleElement.value = "";
  formRoleElement.value = "";
  labelSelectElement.innerText = "Select Privilege Not Granted";
  labelInsertElement.innerText = "Insert Privilege Not Granted";
  labelUpdateElement.innerText = "Update Privilege Not Granted";
  labelDeleteElement.innerText = "Delete Privilege Not Granted";


  privilege.privi_select = false;
  privilege.privi_insert = false;
  privilege.privi_update = false;
  privilege.privi_delete = false;
  privilege.note = null;

  // Auto fill currently logged-in user as the record's user (creation case)
  loadLoggedInUserInto(privilege, userIdElement);
  userIdElement.readOnly = true;

  btnSubmitElement.classList.remove("d-none");
  btnUpdateElement.classList.add("d-none");
  btnDeleteElement.classList.add("d-none");
  btnPrintElement.classList.add("d-none");

  formTitleNewElement.classList.remove("d-none");
  formTitleEditElement.classList.add("d-none");
}

//********************************
//********************************





//********************************
//******loadInitialData***********
const loadInitialData = () => {
  loadRoles();
  generateRoles();
  loadModules();
  generateModules();
  privilegeList = getServiceRequest("/privilege/privilegelist/alldata/selected");
};
//********************************
//********************************








//********************************
//*******refreshUserTable ****
const refreshPrivilegeTable = () => {
  if ($.fn.DataTable.isDataTable("#tablePrivilege")) {
    $("#tablePrivilege").DataTable().destroy();
  }

  tableBody.innerHTML = "";
  let displayProperty = [
    { propertyName: getRole, dataType: "function" },
    { propertyName: getModule, dataType: "function" },
    { propertyName: getSelect, dataType: "function" },
    { propertyName: getInsert, dataType: "function" },
    { propertyName: getUpdate, dataType: "function" },
    { propertyName: getDelete, dataType: "function" },
  ]

  fillDataIntoTableThree(
      tableBody,
      privilegeList,
      displayProperty,
      refillPrivilegeForm,
  );

  $("#tablePrivilege").DataTable();

}


// fillDataIntoTableThree
//********************************
//********************************






//********************************
//********getDesignation**********
// const getDesignation = (ob) => {
//   return ob.designation_id.name;
// };
const getRole = (ob) =>{
  return ob.role.name;
};
const getModule = (ob) =>{
  return  ob.module.name;
};
const getSelect = (ob) => {
  if (ob.privi_select) {
    return '<p class="p-1 bg-success">Granted</p>'
  } else {
    return '<p class="p-1 bg-danger">Not Granted</p>'
  }
};

const getInsert = (ob) => {
  if (ob.privi_insert) {
    return '<p class="p-1 bg-success">Granted</p>'
  } else {
    return '<p class="p-1 bg-danger">Not Granted</p>'
  }
};

const getUpdate = (ob) => {
  if (ob.privi_update) {
    return '<p class="p-1 bg-success">Granted</p>'
  } else {
    return '<p class="p-1 bg-danger">Not Granted</p>'
  }
};

const getDelete = (ob) => {
  if (ob.privi_delete) {
    return '<p class="p-1 bg-success">Granted</p>'
  } else {
    return '<p class="p-1 bg-danger">Not Granted</p>'
  }
};



//********************************
//********************************







//********************************
//*******validations************
let roles = [];
const loadRoles = () =>{
  roles = getServiceRequest("/privilege/role/assignable");
};
const generateRoles = () =>{
  fillDataIntoSelect(formRoleElement, "Select Role..", roles, "name");
};
const validateRole = ()=>{
  const value = formRoleElement.value;
  if (value === "") {
    privilege.role = null;
    setInvalid(formRoleElement);
    return;
  }
  privilege.role = JSON.parse(value);
  if (formMode === "EDIT" && JSON.stringify(privilege.role) !== JSON.stringify(oldPrivilege.role)) {
    setUpdated(formRoleElement);
  } else {
    setValid(formRoleElement);
  }
};





let modules = [];
const loadModules = () =>{
  modules = getServiceRequest("/privilege/module/alldata");
};
const generateModules = () =>{
  fillDataIntoSelect(formModuleElement, "Select Module..", modules, "name");
};
const validateModule = ()=>{
  const value = formModuleElement.value;
  if (value === "") {
    privilege.module= null;
    setInvalid(formModuleElement);
    return;
  }
  privilege.module = JSON.parse(value);
  if (formMode === "EDIT" && JSON.stringify(privilege.module) !== JSON.stringify(oldPrivilege.module)) {
    setUpdated(formModuleElement);
  } else {
    setValid(formModuleElement);
  }
};





const validateSelect = ()=>{
  if (formPrivSelectElement.checked) {
    labelSelectElement.innerText = "Select Privilage Granted"
    privilege.privi_select = true;
  } else {
    labelSelectElement.innerText = "Select Privilage not Granted"
    privilege.privi_select = false;
  }
};
const validateUpdate = ()=>{
  if (formPrivUpdateElement.checked) {
    labelUpdateElement.innerText = "Update Privilege Granted";
    privilege.privi_update = true;
  } else {
    labelUpdateElement.innerText = "Update Privilege Not Granted";
    privilege.privi_update = false;
  }


};
const validateInsert = ()=>{
  if (formPrivInsertElement.checked) {
    labelInsertElement.innerText = "Insert Privilege Granted";
    privilege.privi_insert = true;
  } else {
    labelInsertElement.innerText = "Insert Privilege Not Granted";
    privilege.privi_insert = false;
  }
};
const validateDelete = ()=>{
  if (formPrivDeleteElement.checked) {
    labelDeleteElement.innerText = "Delete Privilege Granted";
    privilege.privi_delete = true;
  } else {
    labelDeleteElement.innerText = "Delete Privilege Not Granted";
    privilege.privi_delete = false;
  }
};



const validateNote = ()=>{
  const noteValue = formNoteElement.value;
  const pattern = /^.{10,200}$/;
  if(noteValue ===""){
    privilege.note = null;
    setInvalid(formNoteElement);
    return;
  }
  if(pattern.test(noteValue)){
    privilege.note = noteValue;
    if (formMode === "EDIT" && noteValue !== oldPrivilege.note) {
      setUpdated(formNoteElement);
    } else {
      setValid(formNoteElement);
    }
  }else{

    privilege.note = null;
    setInvalid(formNoteElement);
  }
}

//********************************
//********************************



//********************************
//********************************









//********************************
//***refillPrivilegeForm **********
const refillPrivilegeForm = (dataob) => {
  removeValidationStyles(privilegeForm);
  let mymodal = new bootstrap.Modal(privilegeAddFormModelElement, {});
  formMode = "EDIT";

  privilege = getServiceRequest("/privilege/privilegelist/byid/" + dataob.id);
  oldPrivilege = JSON.parse(JSON.stringify(privilege));

  let dateTimeEdit = privilege.addeddatetime;
  let dateEdit = dateTimeEdit.slice(0,10);
  let timeEdit = dateTimeEdit.slice(11,19);
  regDateElement.textContent = dateEdit + " " +timeEdit;


  if (!privilege.updateddatetime ){
    updateDateElement.textContent = "-";
  }else{

    let dateTimeUpdate = privilege.updateddatetime;
    let dateUpdate = dateTimeUpdate.slice(0,10);
    let timeUpdate = dateTimeUpdate.slice(11,19);
    updateDateElement.textContent = dateUpdate + " " +timeUpdate;
  }


  generateRoles();
  formRoleElement.value = JSON.stringify(privilege.role);

  generateModules();
  formModuleElement.value = JSON.stringify(privilege.module);

  formPrivSelectElement.checked = privilege.privi_select;
  formPrivInsertElement.checked = privilege.privi_insert;
  formPrivUpdateElement.checked = privilege.privi_update;
  formPrivDeleteElement.checked = privilege.privi_delete;

  labelSelectElement.innerText = privilege.privi_select ? "Select Privilege Granted" : "Select Privilege Not Granted";
  labelInsertElement.innerText = privilege.privi_insert ? "Insert Privilege Granted" : "Insert Privilege Not Granted";
  labelUpdateElement.innerText = privilege.privi_update ? "Update Privilege Granted" : "Update Privilege Not Granted";
  labelDeleteElement.innerText = privilege.privi_delete ? "Delete Privilege Granted" : "Delete Privilege Not Granted";

  formNoteElement.value = privilege.note || "";

  // User field is DISPLAY ONLY here — shows whoever is currently
  // stamped on the record (last updater, or creator if never
  // updated). We do NOT touch privilege.user on open. It only gets
  // reassigned to the current session user inside handleUpdate(),
  // and only if the record is actually changed and saved — see
  // hasPrivilegeChanged(). Opening or cancelling never reassigns it.
  userIdElement.value    = privilege.user?.username || privilege.user?.id || "-";
  userIdElement.readOnly = true;

  btnSubmitElement.classList.add("d-none");
  btnUpdateElement.classList.remove("d-none");
  btnDeleteElement.classList.remove("d-none");
  btnPrintElement.classList.remove("d-none");

  formTitleEditElement.classList.remove("d-none");
  formTitleNewElement.classList.add("d-none");

  mymodal.show();

};

//********************************
//********************************









//********************************
//**CHANGE DETECTION**************
// used to decide whether the "last updated by" user should be
// overwritten with the currently logged-in user.
//********************************

const hasPrivilegeChanged = () => {
  if (JSON.stringify(privilege.role) !== JSON.stringify(oldPrivilege.role)) return true;
  if (JSON.stringify(privilege.module) !== JSON.stringify(oldPrivilege.module)) return true;
  if (privilege.privi_select !== oldPrivilege.privi_select) return true;
  if (privilege.privi_insert !== oldPrivilege.privi_insert) return true;
  if (privilege.privi_update !== oldPrivilege.privi_update) return true;
  if (privilege.privi_delete !== oldPrivilege.privi_delete) return true;
  if ((privilege.note || null) !== (oldPrivilege.note || null)) return true;
  return false;
};

//********************************
//********************************









//********************************
//*checkFormErrors and handlers***

//print funtions

const checkFormErrors = () => {
  let errors = [];
  if (!privilege.role) errors.push("Role is required");
  if (!privilege.module) errors.push("Module is required");
  if (!privilege.user) errors.push("User ID has an error. Please check again");
  return errors;
};



const handleSubmit = () => {
  const errors = checkFormErrors();
  if (errors.length > 0) {
    Notiflix.Notify.warning(errors.join(" | "));
    return;
  }
  console.log("Submitting privilege:", privilege);


  let response = getHTTPServiceRequest("/privilege/privilegelist/save", "POST", privilege);

  if (response === "OK") {
    //alert("Saved successfully");
    Notiflix.Notify.success("Saved successfully");
    $("#privilegeAddForm").modal("hide");
    loadInitialData();
    refreshPrivilegeTable();
    initializeForm();
  } else {
    //alert("Save failed: " + response);
    Notiflix.Notify.warning("Save failed:" + response);
  }

};

const handleUpdate = () => {
  const errors = checkFormErrors();
  if (errors.length > 0) {
    // alert(errors.join("\n"));
    Notiflix.Notify.warning(errors.join(" | "));
    return;
  }

  // Only reassign "who touched this record" if something actually
  // changed. Records saved without any real edit keep whoever was
  // already stamped on them.
  if (hasPrivilegeChanged()) {
    loadLoggedInUserInto(privilege, userIdElement);
  }

  console.log("updated privilege:", privilege);

  let response = getHTTPServiceRequest("/privilege/privilegelist/update", "PUT", privilege);

  if (response === "OK") {
    // alert("Updated successfully");
    updateDateElement.textContent = new Date().toLocaleString();
    Notiflix.Notify.success("Updated successfully");
    $("#privilegeAddForm").modal("hide");
    loadInitialData();
    refreshPrivilegeTable();
    initializeForm();
  } else {
    Notiflix.Notify.warning("Update failed: "+response);
  }


};

const handleDelete = () => {
  Notiflix.Confirm.show(
      "Delete Privilege",
      "Are you sure you want to delete this privilege record?",
      "Yes, Delete",
      "Cancel",
      () => {
        // On confirm
        let response = getHTTPServiceRequest(
            "/privilege/privilegelist/" + privilege.id,
            "DELETE",
            null
        );

        if (response !== "AJAX error") {
          Notiflix.Notify.success("Deleted successfully");
          $("#privilegeAddForm").modal("hide");
          loadInitialData();
          refreshPrivilegeTable();
          initializeForm();
        } else {
          Notiflix.Notify.failure("Delete failed");
        }
      },
      () => {
        // On cancel - do nothing
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

}

//print function start
const printPrivilegeRecord = () => {
  let new_window = window.open();
  //document.write("<h2>employee</h2>");
  new_window.document.write(
      "<html><head>" +
      "<title>print privilege</title>" +
      '<link rel="stylesheet" href="../Resources/bootstrap-5.3.3/css/bootstrap.min.css">' +
      "</head><body>" +
      divCardPrintPrivilege.outerHTML +
      "</body></html>"
  );

  setInterval(() => {
    new_window.stop();
    new_window.print();
    new_window.close();
  }, 500);
};
const viewPrivilege = (dataOb) => {



  tdFullname.innerText = dataOb.fullname;
  tdCallingName.innerText = dataOb.callingname;
  tdNic.innerText = dataOb.nic;
  // mymodal_view.show();

  const editModalContent =
      privilegeAddFormModelElement.querySelector(".modal-content");

  editModalContent.classList.add("blurred");

  const viewModal = new bootstrap.Modal(printViewModelElement);
  viewModal.show();

  // remove blur when view modal closes
  printViewModelElement.addEventListener(
      "hidden.bs.modal",
      () => {
        editModalContent.classList.remove("blurred");
      },
      { once: true }
  );

}
const handlePrint = () =>{
  viewPrivilege(privilege);
}
//********************************
//********************************




  window.initPage = function () {


queryElements();
    loadInitialData();
    initializeForm();
    initializeEventListeners();
    refreshPrivilegeTable();}
  window.initPage();
window.printPrivilegeRecord = printPrivilegeRecord;

})();