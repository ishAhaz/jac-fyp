
(function () {
  let employeeAddFormModelElement
      , tableBody

,editCanvasDesignation
      , editCanvasStatus
      , healthcheckElement
      , healthNoteElement
      ,  printViewModelElement
 , employeeForm
,  employeeAddElement
 , regDateElement
 , updateDateElement
,  regNoElement
 , fullnameElement
,  callingnameElement
 , NICElement
 , DOBElement
 , radioMale
 , radioFemale
,  CivilStatusElement
,  EmailElement
 , MobileElement
 , LandMElement
  ,AddressElement
 , NoteElement
 , userIdElement
,  statushide
,  titleNewHide
,  titleEditHide
 , submitElement
 , updateElement
 , clearElement
,printElement
  ,deleteElement;
  const queryElements = () => {
     employeeAddFormModelElement = document.querySelector("#EmployeeAddForm");

// Table body
     tableBody = document.querySelector("#tableBodyId");

// Dropdowns
     editCanvasDesignation = document.querySelector("#selectDesignation");
     editCanvasStatus = document.querySelector("#selectStatus");

// Health inputs
     healthcheckElement = document.querySelector("#healthId");
     healthNoteElement = document.querySelector("#healthNote");

// Print view modal
     printViewModelElement = document.querySelector("#EmployeeViewModal");

// Form fields
     employeeForm = document.querySelector("#formEmployee");
     employeeAddElement = document.querySelector("#addNewEmployeeId");
     regDateElement = document.querySelector("#regDate");
     updateDateElement = document.querySelector("#updateDate");
     regNoElement = document.querySelector("#InputRegNo");
     fullnameElement = document.querySelector("#textFullname");
     callingnameElement = document.querySelector("#selectCallingName");
     NICElement = document.querySelector("#textNIC");
     DOBElement = document.querySelector("#dateDOB");
     radioMale = document.querySelector("#radioMale");
     radioFemale = document.querySelector("#radioFemale");
     CivilStatusElement = document.querySelector("#selectCivilStatus");
     EmailElement = document.querySelector("#textEmail");
     MobileElement = document.querySelector("#textMobile");
     LandMElement = document.querySelector("#textLand");
     AddressElement = document.querySelector("#textAddress");
     NoteElement = document.querySelector("#textNote");
     userIdElement = document.querySelector("#userId");
     statushide = document.querySelector("#employeeStatusCol");
     titleNewHide = document.querySelector("#formTitleNew");
     titleEditHide = document.querySelector("#formTitleEdit");


// Buttons
     submitElement = document.querySelector("#buttonSubmit");
     updateElement = document.querySelector("#buttonUpdate");
     clearElement = document.querySelector("#buttonClear");
     printElement = document.querySelector("#buttonPrint");
     deleteElement = document.querySelector("#buttonDelete");
  }
let employeeList = [];

let employee = {};
let oldEmployee = {};
let formMode = "ADD";







//********************************
//********************************
const initializeEventListeners = () => {
  //form field validation
  fullnameElement.addEventListener("input", validateFullname);
  callingnameElement.addEventListener("change", validateCallingname);
  NICElement.addEventListener("input", validateNIC);
  // DOBElement.addEventListener("input", validateDOB);
  EmailElement.addEventListener("input",validateEmail);
  MobileElement.addEventListener("input",validateMobile);
  LandMElement.addEventListener("input" ,validateLandM);
  CivilStatusElement.addEventListener("change",validateCivilStatus);
  editCanvasDesignation.addEventListener("change",validateDesignation);
  editCanvasStatus.addEventListener("change",validateStatus);
  AddressElement.addEventListener("input", validateAddress);
  healthcheckElement.addEventListener("click", validateHealthNote);
  NoteElement.addEventListener("input",validateNote);
  // userIdElement is read-only and fully managed by loadLoggedInUserInto()
  // (on open/ADD) and by hasEmployeeChanged() (on update) — no manual input
  // validation needed here, same as crop.js.
  employeeAddElement.addEventListener("click", () => {
    initializeForm();
    titleEditHide.classList.add("d-none");
    titleNewHide.classList.remove("d-none");
  });

  //buttons
  submitElement.addEventListener("click", handleSubmit);
  updateElement.addEventListener("click", handleUpdate);
  //clearElement.addEventListener("click", initializeForm);
  clearElement.addEventListener("click",handleClear);
  deleteElement.addEventListener("click", handleDelete);
  printElement.addEventListener("click",handlePrint);
};





// refreshform


const initializeForm = () => {
  employee = {};
  oldEmployee = {};
  formMode = "ADD";



  employeeForm.reset();

  removeValidationStyles(employeeForm);
  // Re-enable all fields in case previous record was Resign/Inactive
  document.querySelectorAll("#formEmployee input, #formEmployee select, #formEmployee textarea")
      .forEach(el => el.disabled = false);

  regNoElement.textContent = "-";

  let dateTime = getTodayDateTime();
  let date = dateTime.slice(0,10);
  let time = dateTime.slice(11,19);
  regDateElement.textContent = date + " " +time;
  updateDateElement.textContent = "-";

  validateHealthNote();
  generateCivilStatus();
  generateDesignation();
  generateStatus();
  callingnameElement.value = "";
  editCanvasDesignation.value = "";
  editCanvasStatus.value = "";

  const activeStatus = employeesStatuses.find(s => s.name === "Active");
  if (activeStatus) {
    employee.employeestatus_id = activeStatus.name;
    editCanvasStatus.value = JSON.stringify(activeStatus);
  }
  statushide.classList.add("d-none");


  loadLoggedInUserInto(employee, userIdElement);
  userIdElement.readOnly = true;

  submitElement.classList.remove("d-none");
  updateElement.classList.add("d-none");
  deleteElement.classList.add("d-none");
  printElement.classList.add("d-none");
};

const loadInitialData = () => {
  //need data array


  loadEmployeeStatus();
  loadDesignations();       // load designations from DB
  loadCivilStatus();
  employeeList = getServiceRequest("/employee/employeelist/alldata/selected");

};
//********************************
//********************************







//********************************
//********************************
//define function for refresh table start
const refreshEmployeeTable = () => {
  if ($.fn.DataTable.isDataTable("#tableEmployee")) {
    $("#tableEmployee").DataTable().destroy();
  }

  tableBody.innerHTML = ""; // clear old rows

  let displayProperty = [
    { propertyName: "fullname", dataType: "string" },
    { propertyName: "callingname", dataType: "string" },
    { propertyName: "nic", dataType: "string" },
    { propertyName: "gender", dataType: "string" },
    { propertyName: "dob", dataType: "string" },
    { propertyName: getBirthYear, dataType: "function" },
    { propertyName: "mobileno", dataType: "string" },
    { propertyName: "email", dataType: "string" },
    { propertyName: getDesignation, dataType: "function" },
    { propertyName: getStatus, dataType: "function" },
  ];
  //console.log("Filling table with:", employeeList.length);

  fillDataIntoTableThree(
      tableBody,
      employeeList,
      displayProperty,
      refillEmployeeForm,
  );

  $("#tableEmployee").DataTable();
};

//get designation
const getDesignation = (ob) => {
  return ob.designation_id.name;
};
//get status
const getStatus = (ob) => {
  if (ob.employeestatus_id === "Active") {
    return '<p class="p-1 bg-info">Active</p>';
  }
  if (ob.employeestatus_id === "Resign") {
    return '<p class="p-1 bg-danger">Resign</p>';
  }

};
//get birthyear
const getBirthYear = (ob) => {
  return new Date(ob.dob).getFullYear();
};
//********************************
//********************************








//********************************
//********************************
const validateFullname = () => {
  const value = fullnameElement.value.trim();
  const pattern = /^([A-Z][a-z]{2,}[ ])+(de[ ])?([A-Z][a-z]{2,})$/;

  if (!pattern.test(value)) {
    employee.fullname = null;
    employee.callingname = null;
    setInvalid(fullnameElement);
    setInvalid(callingnameElement);
    callingnameElement.innerHTML = "";
    return;
  }

  employee.fullname = value;

  // Always generate calling names
  generateCallingNames(value);

  if (formMode === "EDIT" && value !== oldEmployee.fullname) {
    setUpdated(fullnameElement);
  } else {
    setValid(fullnameElement);
  }
};


const generateCallingNames = (fullname) => {
  callingnameElement.innerHTML = "";

  const defaultOpt = document.createElement("option");
  defaultOpt.innerText = "Select a calling name";
  defaultOpt.value = "";
  defaultOpt.selected = true;
  defaultOpt.disabled = true;
  callingnameElement.appendChild(defaultOpt);

  const nameParts = fullname.split(" ");

  nameParts.forEach((part) => {
    if (part.length > 2) {
      const option = document.createElement("option");
      option.innerText = part;
      option.value = part;
      callingnameElement.appendChild(option);
    }
  });
};

const validateCallingname = () => {
  employee.callingname = callingnameElement.value;
  const value = callingnameElement.value;

  if (!value) {
    employee.callingname = null;
    setInvalid(callingnameElement);
    return;
  }

  employee.callingname = value;

  if (formMode === "EDIT" && value !== oldEmployee.callingname) {
    setUpdated(callingnameElement);
  } else {
    setValid(callingnameElement);
  }
};



const validateNIC = () => {
  const NICValue = NICElement.value;
  const pattern = /^(([0-9]{12})|([0-9]{9}[VXvx]))$/;
  if (pattern.test(NICValue)) {
    //check age
    let dobYear;
    let genderValue;
    let birthDM;

    if (NICValue.length === 10) {
      dobYear = "19" + NICValue.substring(0, 2);
      genderValue = NICValue.substring(2, 5);
      birthDM = parseInt(genderValue);
    } else {
      dobYear = NICValue.substring(0, 4);
      genderValue = NICValue.substring(4, 7);
      birthDM = parseInt(genderValue);
    }

    //generate dob
    let actualDay;

    if (birthDM > 0 && birthDM <= 366) {
      actualDay = birthDM; // male
    } else if (birthDM > 500 && birthDM <= 866) {
      actualDay = birthDM - 500; // female
    } else {
      setInvalid(NICElement);
      return;
    }

    let dateObj = new Date(dobYear, 0); // January 1 of that year
    dateObj.setDate(actualDay);//like 260

    let month = String(dateObj.getMonth() + 1).padStart(2, "0");
    let day = String(dateObj.getDate()).padStart(2, "0");

    let fullDOB = `${dobYear}-${month}-${day}`;

    //validate age
    let currentYear = new Date().getFullYear();
    let age = parseInt(currentYear) - parseInt(dobYear);
    if (age >= 18 && age <= 60) {
      employee.nic = NICValue;
      employee.dob = fullDOB;
      DOBElement.value = fullDOB;
      //generate gender
      if (birthDM >= 500) {
        employee.gender = "female";
        radioFemale.checked = true;
        radioMale.checked = false;
      } else {
        employee.gender = "male";
        radioMale.checked = true;
        radioFemale.checked = false;
      }
    } else {
      //age is wrong
      employee.nic = null;
      employee.gender = null;
      employee.dob = null;
    }

    //validate - edit and add mode
    if (formMode === "EDIT" && NICValue !== oldEmployee.nic) {
      setUpdated(NICElement);
      setUpdated(DOBElement);
    } else {
      setValid(NICElement);
      setValid(DOBElement);
    }
  } else {
    employee.nic = null;
    employee.gender = null;
    employee.dob = null;
    setInvalid(NICElement);
    setInvalid(DOBElement);
  }
};

const validateHealthNote = () => {
  healthNoteElement.classList.add("d-none");
  if (healthcheckElement.checked) {
    healthNoteElement.classList.remove("d-none");
    employee.healthcondition = true;

    employee.note = NoteElement.value;
  } else {
    healthNoteElement.classList.add("d-none");
    employee.healthcondition = false;
    employee.note = null;
  }
};

const validateNote = ()=>{
  if (healthcheckElement.checked) {
    employee.note = NoteElement.value;
  }
};



const validateEmail = () => {
  const EmailValue = EmailElement.value.trim();
  const patternEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  //empty
  if (EmailValue === "") {
    employee.email = null;
    setInvalid(EmailElement);
    return;
  }

  if (patternEmail.test(EmailValue)) {
    employee.email = EmailValue;

    if (formMode === "EDIT" && EmailValue !== oldEmployee.email) {
      //updated
      setUpdated(EmailElement);
    } else {
      //new
      setValid(EmailElement);
    }

  } else {
    //error
    employee.email = null;
    setInvalid(EmailElement);
  }
};

const validateMobile = () =>{
  const MobileValue = MobileElement.value;
  const pattern = /^07[01245678][0-9]{7}$/;
  if (MobileValue === "") {
    employee.mobileno = null;
    setInvalid(MobileElement);
    return;
  }
  if (pattern.test(MobileValue)) {
    employee.mobileno = MobileValue;

    if (formMode === "EDIT" && MobileValue !== oldEmployee.mobileno) {
      setUpdated(MobileElement);
    } else {
      setValid(MobileElement);
    }
  }
  else{
    employee.mobileno = null;
    setInvalid(MobileElement);
  }
}

const validateLandM = () =>{
  const LandMValue = LandMElement.value;
  const pattern = /^0[1-9][0-9]{8}$/;
  if(LandMValue === ""){
    employee.landno = null;

    LandMElement.classList.remove("is-valid","is-invalid");
    return;
  }
  if (pattern.test(LandMValue)) {
    employee.landno = LandMValue;
    if (formMode === "EDIT" && LandMValue !== oldEmployee.landno) {
      setUpdated(LandMElement);
    } else {
      setValid(LandMElement);
    }
  }else{
    employee.landno = null;
    setInvalid(LandMElement)
  }

}



let civilStatuses = [];

const loadCivilStatus = () =>{
  civilStatuses = [
    { name: "Single" },
    { name: "Married" }
  ]
}
const generateCivilStatus = ()=>{
  fillDataIntoSelect(
      CivilStatusElement,
      "Please select civil status..",
      civilStatuses,
      "name"
  );
}
const validateCivilStatus = () =>{
  const CivilValue = CivilStatusElement.value;
  if(CivilValue === ""){
    employee.civilstatus_id = null;
    setInvalid(CivilStatusElement);
    return;
  }
  const parsed = JSON.parse(CivilValue);
  employee.civilstatus_id = parsed.name;
  if (formMode === "EDIT" && JSON.stringify(employee.civilstatus_id) !==
      JSON.stringify(oldEmployee.civilstatus_id)) {

    setUpdated(CivilStatusElement);
  } else  {

    setValid(CivilStatusElement);
  }

}




let designations = [];

const loadDesignations = () => {
  designations = getServiceRequest("/employee/designations/alldata");
}
const generateDesignation = () => {
  fillDataIntoSelect(
      editCanvasDesignation,
      "Please select designation..",
      designations,
      "name"
  );
}
const validateDesignation = () =>{
  const DesigValue = editCanvasDesignation.value;

  if(DesigValue === ""){
    employee.designation_id = null;
    setInvalid(editCanvasDesignation);
    return;
  }
  employee.designation_id = JSON.parse(DesigValue);
  if (formMode === "EDIT" &&
      JSON.stringify(employee.designation_id) !==
      JSON.stringify(oldEmployee.designation_id)) {
    setUpdated(editCanvasDesignation);
  } else {
    setValid(editCanvasDesignation);
  }
}



let employeesStatuses = [];
const loadEmployeeStatus = ()=>{
  employeesStatuses = [
    { name: "Active" },
    { name: "Resign" }
  ];
}
const generateStatus = ()=>{
  fillDataIntoSelect(
      editCanvasStatus,
      "Please select status..",
      employeesStatuses,
      "name"
  );
}
const validateStatus = () => {
  const StatusValue = editCanvasStatus.value;

  if (StatusValue === "") {
    employee.employeestatus_id = null;
    setInvalid(editCanvasStatus);
    return;
  }

  const parsed = JSON.parse(StatusValue);
  employee.employeestatus_id = parsed.name;

  if (formMode === "EDIT") {
    if (parsed.name === "Resign") {
      // Lock all except status
      document.querySelectorAll("#formEmployee input, #formEmployee select, #formEmployee textarea")
          .forEach(el => {
            if (el.id !== "selectStatus") el.disabled = true;
          });
      deleteElement.classList.add("d-none");

    } else if (parsed.name === "Active") {
      // Unlock all
      document.querySelectorAll("#formEmployee input, #formEmployee select, #formEmployee textarea")
          .forEach(el => el.disabled = false);
      deleteElement.classList.remove("d-none");
    }
  }

  if (JSON.stringify(employee.employeestatus_id) !== JSON.stringify(oldEmployee.employeestatus_id)) {
    setUpdated(editCanvasStatus);
  } else {
    setValid(editCanvasStatus);
  }
}



const validateAddress = () =>{
  const AddressValue = AddressElement.value;
  // const pattern = /^(([a-z]{2,})|([0-9]{2,}[/]a?[A-Z]a*))([,]a?[a-z]{2,}){1,}([,]a?[a-z]{2,})$/;
  const pattern = /^.{10,200}$/;
  if (AddressValue ==="") {
    employee.address = null;
    setInvalid(AddressElement);
    return;
  }
  if (pattern.test(AddressValue)) {
    employee.address = AddressValue;
    if (formMode === "EDIT" && AddressValue !== oldEmployee.address) {
      setUpdated(AddressElement);
    } else {
      setValid(AddressElement);
    }
  } else {
    employee.address = null;
    setInvalid(AddressElement);
  }

}
//********************************
//********************************



//********************************
//********************************
const refillEmployeeForm = (dataob) => {
  removeValidationStyles(employeeForm);

  let mymodal = new bootstrap.Modal(employeeAddFormModelElement, {});
  formMode = "EDIT";

  employee = getServiceRequest("/employee/employeelist/byid/" + dataob.id);
  oldEmployee = JSON.parse(JSON.stringify(employee));

  // Meta dates
  let dateTimeEdit = employee.addeddatetime;
  let dateEdit = dateTimeEdit.slice(0, 10);
  let timeEdit = dateTimeEdit.slice(11, 19);
  regDateElement.textContent = dateEdit + " " + timeEdit;

  if (!employee.updateddatetime) {
    updateDateElement.textContent = "-";
  } else {
    let dateTimeUpdate = employee.updateddatetime;
    let dateUpdate = dateTimeUpdate.slice(0, 10);
    let timeUpdate = dateTimeUpdate.slice(11, 19);
    updateDateElement.textContent = dateUpdate + " " + timeUpdate;
  }

  // Fill fields
  regNoElement.textContent = employee.number;
  fullnameElement.value = employee.fullname;

  generateCallingNames(employee.fullname);
  callingnameElement.value = employee.callingname;



  NICElement.value = employee.nic;
  DOBElement.value = employee.dob;

  if (employee.gender === "male") {
    radioMale.checked = true;
    radioFemale.checked = false;
  } else if (employee.gender === "female") {
    radioFemale.checked = true;
    radioMale.checked = false;
  }

  EmailElement.value = employee.email;
  MobileElement.value = employee.mobileno;
  LandMElement.value = employee.landno || "";

  generateCivilStatus();
  CivilStatusElement.value = JSON.stringify({ name: employee.civilstatus_id });

  generateDesignation();
  editCanvasDesignation.value = JSON.stringify(employee.designation_id);

  generateStatus();
  editCanvasStatus.value = JSON.stringify({ name: employee.employeestatus_id });

  AddressElement.value = employee.address;

  if (employee.healthcondition) {
    healthcheckElement.checked = true;
    healthNoteElement.classList.remove("d-none");
    NoteElement.value = employee.note;
  } else {
    healthcheckElement.checked = false;
    healthNoteElement.classList.add("d-none");
    NoteElement.value = "";
  }

  // User field is DISPLAY ONLY here — shows whoever is currently
  // stamped on the record (last updater, or creator if never
  // updated). We do NOT touch employee.user on open. It only gets
  // reassigned to the current session user inside handleUpdate(),
  // and only if the record is actually changed and saved — see
  // hasEmployeeChanged(). Opening or cancelling never reassigns it.
  //
  userIdElement.value = employee.user?.username || employee.user?.id || "-";
  userIdElement.readOnly = true;

  // ── Button visibility — EDIT mode (always set first) ──
  statushide.classList.remove("d-none");
  submitElement.classList.add("d-none");
  updateElement.classList.remove("d-none");
  deleteElement.classList.remove("d-none");
  printElement.classList.remove("d-none");
  titleEditHide.classList.remove("d-none");
  titleNewHide.classList.add("d-none");




  // Re-enable all fields first
  document.querySelectorAll("#formEmployee input, #formEmployee select, #formEmployee textarea")
      .forEach(el => el.disabled = false);

  if (employee.employeestatus_id === "Resign") {
    // Lock everything except the status dropdown
    document.querySelectorAll("#formEmployee input, #formEmployee select, #formEmployee textarea")
        .forEach(el => {
          if (el.id !== "selectStatus") {
            el.disabled = true;
          }
        });

    updateElement.classList.remove("d-none"); // still allow saving status change
    deleteElement.classList.add("d-none");

    Notiflix.Notify.warning("This employee has resigned. Only status can be changed.");
  }

  mymodal.show();
};
//********************************
//********************************



//********************************
//********************************

// user should be overwritten with the currently logged-in user.

const hasEmployeeChanged = () => {
  if (employee.fullname !== oldEmployee.fullname) return true;
  if (employee.callingname !== oldEmployee.callingname) return true;
  if (employee.nic !== oldEmployee.nic) return true;
  if (employee.dob !== oldEmployee.dob) return true;
  if (employee.gender !== oldEmployee.gender) return true;
  if (employee.email !== oldEmployee.email) return true;
  if (employee.mobileno !== oldEmployee.mobileno) return true;
  if ((employee.landno || null) !== (oldEmployee.landno || null)) return true;
  if (employee.civilstatus_id !== oldEmployee.civilstatus_id) return true;
  if (JSON.stringify(employee.designation_id) !== JSON.stringify(oldEmployee.designation_id)) return true;
  if (employee.employeestatus_id !== oldEmployee.employeestatus_id) return true;
  if (employee.address !== oldEmployee.address) return true;
  if (employee.healthcondition !== oldEmployee.healthcondition) return true;
  if ((employee.note || null) !== (oldEmployee.note || null)) return true;
  return false;
};
//********************************
//********************************



//********************************
//********************************
const checkFormErrors = () => {
  let errors = [];

  if (!employee.fullname) errors.push("Fullname has a error .\n Please check again");
  if (!employee.nic) errors.push("NIC has a error .\n Please check again");
  if (!employee.email) errors.push("Email has a error .\n Please check again");
  if (!employee.designation_id) errors.push("Designation has a error .\n Please check again");
  if (!employee.mobileno) errors.push("Mobile Number has a error .\n Please check again");
  if (!employee.employeestatus_id) errors.push("Status has a error .\n Please check again")
  if (!employee.callingname) errors.push("Callingname has a error .\n Please check again");
  if (!employee.civilstatus_id) errors.push("Civil status has an error. \n Please check again");
  if (!employee.address) errors.push("Address has a error. \n Please check again");
  if (!employee.user) errors.push("User ID has an error. Please check again"); // ← NEW: mirrors crop.js

  const landValue = LandMElement.value.trim();
  if (landValue !== "" && !employee.landno) {
    errors.push("Land number format is invalid. Please check again");
  }
  return errors;
};
//********************************
//********************************






//********************************
//********************************
const handleSubmit = () => {
  const errors = checkFormErrors();
  if (errors.length > 0) {
    //alert(errors.join("\n"));
    Notiflix.Notify.warning(errors.join(" | "));
    return;
  }
  console.log("Submitting employee:", employee);


  let response = getHTTPServiceRequest("/employee/employeelist/save", "POST", employee);

  if (response === "OK") {
    //alert("Saved successfully");
    Notiflix.Notify.success("Saved successfully");
    $("#EmployeeAddForm").modal("hide");
    loadInitialData();
    refreshEmployeeTable();
    initializeForm();
  } else {
    //alert("Save failed: " + response);
    Notiflix.Notify.warning(response);
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
  // already stamped on them. ← mirrors crop.js exactly
  if (hasEmployeeChanged()) {
    loadLoggedInUserInto(employee, userIdElement);
  }

  // Resign transition: send status-only payload off oldEmployee,
  // since fields other than status are disabled/untouched in this mode.
  if (employee.employeestatus_id === "Resign" && oldEmployee.employeestatus_id !== "Resign") {
    const resignPayload = {
      ...oldEmployee,
      employeestatus_id: "Resign",
      user: employee.user,          // stamped user carried over
      updateddatetime: null
    };

    console.log("Resigning employee:", resignPayload);

    const response = getHTTPServiceRequest("/employee/employeelist/update", "PUT", resignPayload);

    if (response === "OK") {
      updateDateElement.textContent = new Date().toLocaleString();
      Notiflix.Notify.success("Status updated to Resign");
      $("#EmployeeAddForm").modal("hide");
      loadInitialData();
      refreshEmployeeTable();
      initializeForm();
    } else {
      Notiflix.Notify.warning("Update failed: " + response);
    }
    return;
  }

  // Reactivate transition: Resign → Active
  if (oldEmployee.employeestatus_id === "Resign" && employee.employeestatus_id === "Active") {
    const reactivatePayload = {
      ...oldEmployee,
      employeestatus_id: "Active",
      user: employee.user,
      updateddatetime: null
    };

    console.log("Reactivating employee:", reactivatePayload);

    const response = getHTTPServiceRequest("/employee/employeelist/update", "PUT", reactivatePayload);

    if (response === "OK") {
      updateDateElement.textContent = new Date().toLocaleString();
      Notiflix.Notify.success("Employee reactivated");
      $("#EmployeeAddForm").modal("hide");
      loadInitialData();
      refreshEmployeeTable();
      initializeForm();
    } else {
      Notiflix.Notify.warning("Update failed: " + response);
    }
    return;
  }

  // Normal update
  console.log("Updating employee:", employee);

  const response = getHTTPServiceRequest("/employee/employeelist/update", "PUT", employee);

  if (response === "OK") {
    updateDateElement.textContent = new Date().toLocaleString();
    Notiflix.Notify.success("Updated successfully");
    $("#EmployeeAddForm").modal("hide");
    loadInitialData();
    refreshEmployeeTable();
    initializeForm();
  } else {
    Notiflix.Notify.warning("Update failed: " + response);
  }
};

const handleDelete = () => {
  Notiflix.Confirm.show(
      "Delete Employee",
      "Are you sure you want to delete this employee?",
      "Yes, Delete",
      "Cancel",
      () => {
        let response = getHTTPServiceRequest(
            "/employee/employeelist/" + employee.id,
            "DELETE",
            null
        );

        if (response === "OK") {
          Notiflix.Notify.success("Deleted successfully");
          $("#EmployeeAddForm").modal("hide");
          loadInitialData();
          refreshEmployeeTable();
          initializeForm();
        } else {
          Notiflix.Notify.warning(response);  // shows the actual backend message
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

//print function start
const printEmployeeRecord = () => {
  let new_window = window.open();
  //document.write("<h2>employee</h2>");
  new_window.document.write(
      "<html><head>" +
      "<title>print employee</title>" +
      '<link rel="stylesheet" href="../Resources/bootstrap-5.3.3/css/bootstrap.min.css">' +
      "</head><body>" +
      divCardPrintEmployee.outerHTML +
      "</body></html>"
  );

  setInterval(() => {
    new_window.stop();
    new_window.print();
    new_window.close();
  }, 500);
};
const viewEmployee = (dataOb) => {


  tdFullname.innerText = dataOb.fullname;
  tdCallingName.innerText = dataOb.callingname;
  tdNic.innerText = dataOb.nic;
  // mymodal_view.show();

  const editModalContent =
      employeeAddFormModelElement.querySelector(".modal-content");

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
  viewEmployee(employee);
}
//********************************
//********************************




  window.initPage = function () {
  queryElements();
    loadInitialData();
    initializeForm();
    initializeEventListeners();
    refreshEmployeeTable();}
window.initPage();
    window.printEmployeeRecord = printEmployeeRecord;
})();