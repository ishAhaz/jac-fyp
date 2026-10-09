package lk.jac.employee.controller;


import lk.jac.common.CurrentUserUtil;
import lk.jac.common.StatusPending;
import lk.jac.employee.dao.EmployeeRepository;
import lk.jac.employee.entity.Employee;
import lk.jac.privilege.checker.PrivilegeChecker;
import lk.jac.privilege.dao.PrivilegeRepository;
import lk.jac.user.controller.UserController;
import lk.jac.user.dao.UserRepository;
import lk.jac.user.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.ModelAndView;

import java.time.LocalDateTime;
import java.util.List;

@RestController
public class EmployeeController {

    //interface walata instance hdanna ba e unta me annotation eke
//ekta solution ekak denwa, ,meka nathuaw me class eke constructorgenuth meka krnna puluwan
    @Autowired//create object
    private EmployeeRepository employeeDao;

    //for auto generated records in driver html


    @Autowired
    private UserRepository userDao;

    @Autowired
    private PrivilegeRepository privilegeDao;

    @Autowired
    private UserController userController;

    private static final String MODULE_NAME = "EMPLOYEE";

    //catch the html and set the link
    @RequestMapping("/employee/employeelist")
    public ModelAndView employeePage(){
        ModelAndView employeeUI = new ModelAndView();
        employeeUI.setViewName("employee.html");
        return employeeUI;
    }

    //create get mapping for get employee object by given id
    @GetMapping(value = "/employee/employeelist/byid/{emid}", produces = "application/json")
    public Employee getEmployeeById(@PathVariable Integer emid){
        return employeeDao.findByIdAndDeleteddatetimeIsNull(emid);
    }



    //for selected date for table
    @GetMapping(value = "/employee/employeelist/alldata/selected", produces = "application/json")
    public List<Employee> getSelectedEmployeeData() {
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canSelect()) {
            return List.of(); // no privilege - return empty list rather than throw
        }


        return employeeDao.getSelectedColumns(); // returns limited fields
    }

    //for number for user control
    @GetMapping(value = "/employee/employeelist/alldata/fordropdown", produces = "application/json")
    public List<Employee> getEmployeeDataForDropdown() {
        return employeeDao.getEmployeeDataForDropdown();
    }

    //create mapping for save employee
    @PostMapping(value ="/employee/employeelist/save")
    public String saveEmployee(@RequestBody Employee employee) {
        //need to check user privilege

        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canInsert()) {
            return "Access denied: insufficient privilege";
        }

        //need to check data duplicate
        Employee existingEmployee = employeeDao.findByNicAndDeleteddatetimeIsNull(employee.getNic());
        //check dependencies(user account ekak hdnna one nm methndi)
        if (existingEmployee != null) {
            return "Employee save not completed: NIC already exists";
        }

        Employee existingMobile = employeeDao.findByMobilenoAndDeleteddatetimeIsNull(employee.getMobileno());
        if (existingMobile != null){
            return "Mobile number already exists";
        }

        Employee existingEmail = employeeDao.findByEmailAndDeleteddatetimeIsNull(employee.getEmail());
        if (existingEmail != null){
            return "Email already exists";
        }
        //try catch
        try{

            //do operation
            employee.setAddeddatetime(LocalDateTime.now());
            employee.setUpdateddatetime(LocalDateTime.now());
            employee.setNumber("TEMP");

            Employee saved = employeeDao.save(employee); // DB assigns the ID here

          // generate number — count already includes this employee
            String regNo = generateRegistrationNo(saved.getAddeddatetime());
            saved.setNumber(regNo);
            employeeDao.save(saved); // second save just updates the number

            userController.createPendingUserForEmployee(saved);

            return "OK";
        } catch (Exception e) {
            System.err.println("Employee save error: " + e.getMessage());

            String msg = e.getMessage();
            if (msg != null && msg.contains("mobileno_UNIQUE")) {
                return "Mobile number already exists";
            }
            if (msg != null && msg.contains("nic_UNIQUE")) {
                return "NIC already exists";
            }
            if (msg != null && msg.contains("email_UNIQUE")) {
                return "Email already exists";
            }

            return "Something went wrong. Please try again.";
        }

    }
    private String generateRegistrationNo(LocalDateTime registeredAt) {
        int year = registeredAt.getYear();
        int month = registeredAt.getMonthValue();

        // Count employees already registered this month (AFTER saving, so count includes current)
        Integer count = employeeDao.countByYearAndMonth(year, month);

        String yy = String.valueOf(year).substring(2);         // "23"
        String mm = String.format("%02d", month);               // "01"
        String seq = String.format("%03d", count);              // "001", "002"...

        return "E" + yy + mm + seq;
    }


    @DeleteMapping(value = "/employee/employeelist/{id}")
    public String deleteEmployee(@PathVariable int id) {
//===============================================================
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canDelete()) {
            return "Access denied: insufficient privilege";
        }
//===============================================================

        Employee existingEmployee = employeeDao.findByIdAndDeleteddatetimeIsNull(id);
        if (existingEmployee == null) {
            return "Employee not found";
        }


        List<User> linkedUsers = userDao.findAllByEmployeeAndDeleteddatetimeIsNull(existingEmployee);

        // if users account exists AND it has interactions, block the employee delete too
        if (!linkedUsers.isEmpty()) {
            for (User u : linkedUsers) {
                List<String> modules = userDao.findUserInteractionModules(u.getId());
                if (!modules.isEmpty()) {
                    String moduleMsg;
                    if (modules.size() == 1) {
                        moduleMsg = modules.get(0);
                    } else if (modules.size() == 2) {
                        moduleMsg = modules.get(0) + " and " + modules.get(1);
                    } else {
                        moduleMsg = modules.get(0) + ", " + modules.get(1) + " and etc";
                    }
                    return "Cannot delete: linked user account (" + u.getUsername() + ") has interactions in "
                            + moduleMsg + " module(s). Please deactivate the user account instead.";
                }
            }
        }

        try {
            existingEmployee.setDeleteddatetime(LocalDateTime.now());
            employeeDao.save(existingEmployee);


            // If a user account exists with NO interactions, deactivate it (safe cleanup)
            for (User u : linkedUsers) {
                if (u.getStatus() != StatusPending.Inactive) {
                    u.setStatus(StatusPending.Inactive);
                    u.setUpdateddatetime(LocalDateTime.now());
                    userDao.save(u);
                }
            }
            return "OK";
        } catch (Exception e) {
            System.err.println("Employee delete error: " + e.getMessage());
            return "Something went wrong. Please try again.";
        }
    }



    //create mapping for update employee
    @PutMapping(value = "/employee/employeelist/update")
    public String updateEmployee(@RequestBody Employee employee) {
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canUpdate()) {
            return "Access denied: insufficient privilege";
        }
        Employee extEmployee = employeeDao.findByIdAndDeleteddatetimeIsNull(employee.getId());
        if (extEmployee == null) {
            return "Employee not found";
        }


        Employee existingNIC = employeeDao.findByNicAndDeleteddatetimeIsNull(employee.getNic());
        if (existingNIC != null && !existingNIC.getId().equals(employee.getId())) {
            return "NIC already exists";
        }

        Employee existingMobile = employeeDao.findByMobilenoAndDeleteddatetimeIsNull(employee.getMobileno());
        if (existingMobile != null && !existingMobile.getId().equals(employee.getId())) {
            return "Mobile number already exists";
        }

        Employee existingEmail = employeeDao.findByEmailAndDeleteddatetimeIsNull(employee.getEmail());
        if (existingEmail != null && !existingEmail.getId().equals(employee.getId())) {
            return "Email already exists";
        }

        try {

            // Get the OLD designation before saving
            String oldDesignation = extEmployee.getDesignation_id().getName();

            employee.setAddeddatetime(extEmployee.getAddeddatetime());
            employee.setUpdateddatetime(LocalDateTime.now());
            employeeDao.save(employee);


            //user dependencie
            List<User> linkedUsers = userDao.findAllByEmployeeAndDeleteddatetimeIsNull(employee);
            String newEmployeeStatusCheck = employee.getEmployeestatus_id().name();

            for (User existingUser : linkedUsers) {
                if ( newEmployeeStatusCheck.equalsIgnoreCase("Resign")) {

                    if (existingUser.getStatus() != StatusPending.Inactive) {
                        existingUser.setStatus(StatusPending.Inactive);
                        existingUser.setUpdateddatetime(LocalDateTime.now());
                        userDao.save(existingUser);
                    }

                } else if (newEmployeeStatusCheck.equalsIgnoreCase("Active")) {

                    // don't auto-activate — put it up for review instead
                    if (existingUser.getStatus() == StatusPending.Inactive) {
                        existingUser.setStatus(StatusPending.Pending);
                        existingUser.setUpdateddatetime(LocalDateTime.now());
                        userDao.save(existingUser);
                    }
                    // if it's already Active, leave it
                }
            }

            // If employee status changed TO Resign — soft delete the driver record
            String newEmployeeStatus = employee.getEmployeestatus_id().name();




            return "OK";

        } catch (Exception e) {
            System.err.println("Employee update error: " + e.getMessage());

            String msg = e.getMessage();
            if (msg != null && msg.contains("mobileno_UNIQUE")) {
                return "Mobile number already exists";
            }
            if (msg != null && msg.contains("nic_UNIQUE")) {
                return "NIC already exists";
            }
            if (msg != null && msg.contains("email_UNIQUE")) {
                return "Email already exists";
            }

            return "Something went wrong. Please try again.";
        }
    }
}