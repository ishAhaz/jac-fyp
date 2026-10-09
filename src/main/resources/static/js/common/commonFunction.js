//commonFunction.js


//validation
// commonFunction.js — add near the top, alongside removeValidationStyles

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


//define function for filldataintodropdown()


const fillDataIntoSelect = (selectElementID, message, dataList, property) => {
  selectElementID.innerHTML = "";

  if (message !== "") {
    let optionmsg = document.createElement("option");
    optionmsg.innerText = message;
    optionmsg.value = "";
    optionmsg.selected = true;
    optionmsg.disabled = true;

    selectElementID.appendChild(optionmsg);
  }

  dataList.forEach((dataob) => {
    let optionTag = document.createElement("option");
    optionTag.value = JSON.stringify(dataob);
    //optionTag.value = dataob[property];
    optionTag.innerText = dataob[property];
    selectElementID.appendChild(optionTag);
  });
};

//degine function for active row color
const activeTableBody = (tbodyId, index, color) => {
  for (const rowelement of tbodyId.children) {
    rowelement.removeAttribute("style");
  }
  if (tbodyId.children[index]) {
    tbodyId.children[index].style.backgroundColor = color;
  }


};





const fillDataIntoTableThree = (
    allTableBodyId, dataLists, displayPropertyList, editFunction, buttonOptions = {}) => {

  const {
    iconClass = "fa-pen-to-square", btnClass= "btn-outline-warning", btnTitle  = "Edit",
  } = buttonOptions;

  allTableBodyId.innerHTML = "";

  dataLists.forEach((dataOb, index) => {
    let tr = document.createElement("tr");
    tr.setAttribute("data-row-index", index);
    allTableBodyId.appendChild(tr);

    let tdIndex = document.createElement("td");
    tdIndex.innerHTML = index + 1;
    tr.appendChild(tdIndex);

    displayPropertyList.forEach((column) => {
      let td = document.createElement("td");
      tr.appendChild(td);
      if (column.dataType == "string") td.innerText = dataOb[column.propertyName];
      if (column.dataType == "function") td.innerHTML = column.propertyName(dataOb);
    });

    if (editFunction) {
      let tdButtons = document.createElement("td");
      tr.appendChild(tdButtons);

      let tdEdit = document.createElement("button");
      tdEdit.className = `btn ${btnClass} edit-row-btn`;
      tdEdit.title = btnTitle;
      tdEdit.innerHTML = `<i class="fa-solid ${iconClass}" style="color:#000000;"></i>`;
      tdButtons.appendChild(tdEdit);
    }
  });

  allTableBodyId.onclick = (e) => {
    if (!editFunction) return;
    const tr = e.target.closest("tr");
    if (!tr) return;
    const index = parseInt(tr.getAttribute("data-row-index"));
    const dataOb = dataLists[index];
    if (!dataOb) return;

    if (e.target.closest(".edit-row-btn")) {
      activeTableBody(allTableBodyId, index, "orange");
      editFunction(dataOb);
    }
  };
};


//instead of removing classess one by one

const removeValidationStyles = (formElement) => {
  const inputs = formElement.querySelectorAll("input,select,textarea");

  inputs.forEach((input) => {
    input.classList.remove("is-valid", "is-invalid", "is-blue");
  });
};


//date generator
function getTodayDateTime() {
  const now = new Date();

  const options = {timeZone: "Asia/Colombo", year: "numeric", month: "2-digit",
    day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false};

  const parts = new Intl.DateTimeFormat("en-CA", options).formatToParts(now);

  const get = (type) => parts.find(p => p.type === type).value;

  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}:${get("second")}`;
}



//get data from db to UI
const getServiceRequest = (url)=>{
  let getResponse = [];
  $.ajax({
    url: url, //the URL to send the request to
    type: "GET",// the type of request (GET,POST,PUT,DELETE)
    async:false,
    dataType: "json",// the expected data type of the response
    success: function(response){
      //this function is executed if the request is successful
      console.log("Data received:", response);
      getResponse = response;
      // refreshEmployeeTable();
      //update the DOM with the received data
    },
    error: function (Xhr,status,error){
//this function is executed if the request fails
      console.error("AJAX error:", status,error);

    },
    complete: function(){
      //this function is always ecuted after the request is complete (success or error)
      console.log("AJAX request complete.");
    }

  });
  return getResponse;
}


//define function for request POST,PUT,DELETE
const getHTTPServiceRequest = (url,method,data)=>{
  let serviceResponse = "";

  $.ajax({
    url: url, //the URL to send the request to
    type: method,// the type of request (GET,POST,PUT,DELETE)
    async:false,
    contentType: "application/json",
    data: data ? JSON.stringify(data):null,
    // dataType: "json",// the expected data type of the response
    success: function(response){
      //this function is executed if the request is successful
      console.log("Data received:", response);
      serviceResponse = response;
      // refreshEmployeeTable();
      //update the DOM with the received data
    },
    error: function (Xhr,status,error){
//this function is executed if the request fails
      console.error("AJAX error:", status,error);
      serviceResponse = "AJAX error:"+status+","+error;
    },
    complete: function(){
      //this function is always ecuted after the request is complete (success or error)
      console.log("AJAX request complete.");
    }

  });
  return serviceResponse;
}


//===========for notifications===================
//===============================================
Notiflix.Notify.init({
  width: '400px',        // wider box, so text wraps less
  fontSize: '15px',      // slightly bigger text
  position: 'right-top', // or 'center-top', 'right-bottom' etc.
  distance: '10px',
  opacity: 1,
  borderRadius: '8px',
  timeout: 4000,          // stays visible longer for longer messages
  messageMaxLength: 300,  // default is 110 — raise this so long text isn't cut off
});


//===========for notifications===================
//===============================================





// ============================================================
// COMMON — LOGGED-IN USER RESOLUTION
// Used across modules (farmer, crop, ingredient, GRN, etc.)
// to auto-fill the "created/owned by" user field from the
// server session instead of trusting frontend-typed values.
// ============================================================

let cachedCurrentUser = null;

// Fetches the logged-in user once and caches it for the page session.
// Pass forceRefresh = true if you need to bypass the cache.
const getCurrentUser = (forceRefresh = false) => {
  if (cachedCurrentUser && !forceRefresh) {
    return cachedCurrentUser;
  }
  cachedCurrentUser = getServiceRequest("/user/account/me");
  return cachedCurrentUser;
};

// Generic helper: fills targetObject.user = {id} and displays the
// username in the given input element.
// Example: loadLoggedInUserInto(farmer, userIdElement);
const loadLoggedInUserInto = (targetObject, displayElement) => {
  const currentUser = getCurrentUser();

  if (currentUser && currentUser.id) {
    targetObject.user = { id: currentUser.id };
    if (displayElement) {
      displayElement.value = currentUser.username;
      setValid(displayElement);
    }
  } else {
    targetObject.user = null;
    if (displayElement) {
      displayElement.value = "";
      setInvalid(displayElement);
    }
  }
};