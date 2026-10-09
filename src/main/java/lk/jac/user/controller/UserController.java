package lk.jac.user.controller;

import lk.jac.common.CommonController;
import lk.jac.common.CurrentUserUtil;
import lk.jac.common.StatusPending;
import lk.jac.employee.dao.EmployeeRepository;
import lk.jac.employee.entity.Employee;
import lk.jac.farmer.dao.FarmerRepository;
import lk.jac.farmer.entity.Farmer;
import lk.jac.ingredient.dao.SupplierRepository;
import lk.jac.ingredient.entity.Supplier;
import lk.jac.privilege.checker.PrivilegeChecker;
import lk.jac.privilege.dao.PrivilegeRepository;
import lk.jac.privilege.dao.RoleRepository;
import lk.jac.privilege.entity.Role;
import lk.jac.supermarket.dao.SupermarketRepository;
import lk.jac.supermarket.entity.Supermarket;
import lk.jac.user.dao.UserRepository;
import lk.jac.user.entity.AccountType;
import lk.jac.user.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.ModelAndView;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

@RestController
public class UserController implements CommonController<User> {
    @Autowired
    private UserRepository userDao;

    @Autowired
    private BCryptPasswordEncoder encoder;

    @Autowired
    private PrivilegeRepository privilegeDao;

    @Autowired
    private RoleRepository roleDao;

    @Autowired
    private EmployeeRepository employeeDao;

    @Autowired
    private FarmerRepository farmerDao;

    @Autowired
    private SupplierRepository supplierDao;

    @Autowired
    private SupermarketRepository supermarketDao;

    private static final String MODULE_NAME = "USER";



    @GetMapping("/user/usermanagement")
    public ModelAndView userPage(){
        ModelAndView userUI = new ModelAndView();
        userUI.setViewName("user.html");
        return userUI;
    }

    @GetMapping("/user/account")
    public ModelAndView userAccountPage(){
        ModelAndView userAccountUI = new ModelAndView();
        userAccountUI.setViewName("useraccount.html");
        return userAccountUI;
    }

    //=======links=========
    //=====================


    // ======== One-time backfill: create Pending users for existing records ========
//================================================================================
    @PostMapping(value = "/user/usermanagement/backfill-pending-accounts")
    public String backfillPendingAccounts() {
        String username = CurrentUserUtil.getCurrentUsername();
        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );
        if (!privilege.canInsert()) {
            return "Access denied: insufficient privilege";
        }

        int created = 0;

        for (Employee e : employeeDao.findAllByDeleteddatetimeIsNull()) {
            if (userDao.findAllByEmployeeAndDeleteddatetimeIsNull(e).isEmpty()) {
                createPendingUserForEmployee(e);
                created++;
            }
        }

        for (Farmer f : farmerDao.findAllByDeleteddatetimeIsNull()) {
            if (userDao.findAllByFarmerAndDeleteddatetimeIsNull(f).isEmpty()) {
                createPendingUserForFarmer(f);
                created++;
            }
        }

        for (Supplier s : supplierDao.findAllByDeleteddatetimeIsNull()) {
            if (userDao.findAllBySupplierAndDeleteddatetimeIsNull(s).isEmpty()) {
                createPendingUserForSupplier(s);
                created++;
            }
        }

        for (Supermarket sm : supermarketDao.findAllByDeleteddatetimeIsNull()) {
            if (userDao.findAllBySupermarketAndDeleteddatetimeIsNull(sm).isEmpty()) {
                createPendingUserForSupermarket(sm);
                created++;
            }
        }

        return created + " pending user account(s) created";
    }

    @GetMapping(value = "/user/usermanagement/byid/{uid}" , produces = "application/json")
    public User getUserById(@PathVariable int uid){
        return userDao.findByIdAndDeleteddatetimeIsNull(uid);
    }

    //for selected date for table
    @GetMapping(value = "/user/usermanagement/alldata/selected", produces = "application/json")
    public List<User> getSelectedUserData() {

        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canSelect()) {
            return List.of(); // no privilege - return empty list rather than throw
        }
        return userDao.getSelectedColumns(); // returns limited fields
    }


    //=======links=========
    //=====================

    @PostMapping(value ="/user/usermanagement/save")
    @Override
    public String saveData(@RequestBody User user) {
        //user privilege
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canInsert()) {
            return "Access denied: insufficient privilege";
        }

        //date duplication

        //try catch

        String ownerErr = validateAccountOwner(user);
        if (ownerErr != null) return ownerErr;


        try{
            //do operation
            //duplicate check
            User existing = userDao.findByUsernameAndEmployeeAndDeleteddatetimeIsNull(
                    user.getUsername(),    user.getEmployee()
            );
            if (existing != null){
                return "user already exists for this username and email";
            }

            // convert base64 image string to byte[]
            if (user.getImageBase64() != null && !user.getImageBase64().isEmpty()) {
                String base64 = user.getImageBase64();
                // remove "data:image/png;base64," prefix
                if (base64.contains(",")) {
                    base64 = base64.split(",")[1];
                }
                user.setImage(Base64.getDecoder().decode(base64));
            }

            user.setPassword(encoder.encode(user.getPassword()));
            user.setAddeddatetime(LocalDateTime.now());
            user.setUpdateddatetime(LocalDateTime.now());

            //extra security , postman can send the admin because of that this prevent from that
            for (Role role : user.getRoles()) {
                if ("ADMIN".equalsIgnoreCase(role.getName())) {
                    return "Admin role cannot be assigned.";
                }
            }
            userDao.save(user);

            // Keep the linked owner record's email in sync with this
            // account's email — whatever email is set on the User form
            // is the source of truth going forward.
            syncEmailToOwner(user);

            return "OK";
        } catch (Exception e) {
            return "User save not completed:" +e.getMessage();
        }
    }

    @PutMapping(value = "/user/usermanagement/update")
    @Override
    public String updateData(@RequestBody User user) {
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canUpdate()) {
            return "Access denied: insufficient privilege";
        }

        //================================================

        String ownerErr = validateAccountOwner(user);
        if (ownerErr != null) return ownerErr;
        try {
            //  Check if user exists in DB
            User existingUser = userDao.findById(user.getId()).orElse(null);
            if (existingUser == null) {
                return "User not found";
            }

            //  Duplicate check - exclude current record by ID
            User duplicate = userDao.findByUsernameAndEmployeeAndDeleteddatetimeIsNull(
                    user.getUsername(), user.getEmployee()
            );
            if (duplicate != null && !duplicate.getId().equals(user.getId())) {
                return "User already exists for this username and employee";
            }

            //  Decode base64 image if provided, otherwise keep existing image
            if (user.getImageBase64() != null && !user.getImageBase64().isEmpty()) {
                String base64 = user.getImageBase64();
                if (base64.contains(",")) {
                    base64 = base64.split(",")[1];
                }
                user.setImage(Base64.getDecoder().decode(base64));
            }else if (user.isImageRemoved()) {
                //  user deliberately removed the image → set null
                user.setImage(null);
            }
            else {
                user.setImage(existingUser.getImage()); // keep old image
            }

            // Preserve original addeddatetime, update only updateddatetime
            user.setAddeddatetime(existingUser.getAddeddatetime());
            user.setUpdateddatetime(LocalDateTime.now());

            //  Preserve password if not sent from frontend
            // Preserve old password if no new password is entered
            if (user.getPassword() == null || user.getPassword().isBlank()) {
                user.setPassword(existingUser.getPassword());
            } else {
                // Encrypt the new password
                user.setPassword(encoder.encode(user.getPassword()));
            }

            //extra security , postman can send the admin because of that this prevent from that
            for (Role role : user.getRoles()) {
                if ("ADMIN".equalsIgnoreCase(role.getName())) {
                    return "Admin role cannot be assigned.";
                }
            }
            userDao.save(user);

            // Keep the linked owner record's email in sync with this
            // account's email — whatever email is set/edited on the User
            // form overwrites the owner's stored email.
            syncEmailToOwner(user);

            return "OK";

        } catch (Exception e) {
            return "User update not completed: " + e.getMessage();
        }
    }

    @DeleteMapping(value = "/user/usermanagement/{id}")
    @Override
    public String deleteData(@PathVariable int id) {

        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canDelete()) {
            return "Access denied: insufficient privilege";
        }

        //===========================================
        User existingUser = userDao.findByIdAndDeleteddatetimeIsNull(id);
        if (existingUser == null) {
            return "User delete not completed: User not available";
        }

        try {
            List<String> modules = userDao.findUserInteractionModules(id);

            if (!modules.isEmpty()) {
                existingUser.setStatus(StatusPending.Inactive);
                existingUser.setUpdateddatetime(LocalDateTime.now());
                userDao.save(existingUser);

                String moduleMsg;
                if (modules.size() == 1) {
                    moduleMsg = modules.get(0);
                } else if (modules.size() == 2) {
                    moduleMsg = modules.get(0) + " and " + modules.get(1);
                } else {
                    // size == 3 because of LIMIT 3, meaning there are more than 2 total
                    moduleMsg = modules.get(0) + ", " + modules.get(1) + " and etc";
                }

                return "Cannot delete: user has interactions in " + moduleMsg
                        + " module(s). Status changed to Inactive instead.";
            } else {
                existingUser.setDeleteddatetime(LocalDateTime.now());
                userDao.save(existingUser);
                return "OK";
            }

        } catch (Exception e) {
            return "User delete not completed: " + e.getMessage();
        }
    }



    private String validateAccountOwner(User user) {
        int filled = 0;
        if (user.getEmployee() != null) filled++;
        if (user.getFarmer() != null) filled++;
        if (user.getSupermarket() != null) filled++;
        if (user.getSupplier() != null) filled++;

        if (filled != 1) {
            return "User must be linked to exactly one of Employee, Farmer, Supermarket, or Supplier";
        }
        if (user.getAccounttype() == AccountType.Employee && user.getEmployee() == null) {
            return "accountType is EMPLOYEE but no employee is linked";
        }
        if (user.getAccounttype() == AccountType.Farmer && user.getFarmer() == null) {
            return "accountType is FARMER but no farmer is linked";
        }
        if (user.getAccounttype() == AccountType.Supermarket && user.getSupermarket() == null) {
            return "accountType is SUPERMARKET but no supermarket is linked";
        }
        if (user.getAccounttype() == AccountType.Supplier && user.getSupplier() == null) {
            return "accountType is SUPPLIER but no supplier is linked";
        }
        return null;
    }

    // ======== Keep linked owner record's email synced with the User account ========
    //================================================================================
    // Whatever email is on the User form is treated as the source of truth,
    // and gets written back onto the Employee/Farmer/Supermarket/Supplier
    // row this account is linked to. Runs after the User itself is already
    // saved, using whichever single owner relation is set (validateAccountOwner
    // guarantees exactly one is non-null).
    private void syncEmailToOwner(User user) {
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            return; // nothing to sync
        }

        if (user.getAccounttype() == AccountType.Employee && user.getEmployee() != null) {
            Employee emp = employeeDao.findById(user.getEmployee().getId()).orElse(null);
            if (emp != null && !user.getEmail().equals(emp.getEmail())) {
                emp.setEmail(user.getEmail());
                employeeDao.save(emp);
            }
        } else if (user.getAccounttype() == AccountType.Farmer && user.getFarmer() != null) {
            Farmer farmer = farmerDao.findById(user.getFarmer().getId()).orElse(null);
            if (farmer != null && !user.getEmail().equals(farmer.getEmail())) {
                farmer.setEmail(user.getEmail());
                farmerDao.save(farmer);
            }
        } else if (user.getAccounttype() == AccountType.Supermarket && user.getSupermarket() != null) {
            Supermarket supermarket = supermarketDao.findById(user.getSupermarket().getId()).orElse(null);
            if (supermarket != null && !user.getEmail().equals(supermarket.getEmail())) {
                supermarket.setEmail(user.getEmail());
                supermarketDao.save(supermarket);
            }
        } else if (user.getAccounttype() == AccountType.Supplier && user.getSupplier() != null) {
            Supplier supplier = supplierDao.findById(user.getSupplier().getId()).orElse(null);
            if (supplier != null && !user.getEmail().equals(supplier.getEmail())) {
                supplier.setEmail(user.getEmail());
                supplierDao.save(supplier);
            }
        }
    }


    //========crud========
    //====================





    //========user account======
    //==========================
    @GetMapping(value = "/user/account/me", produces = "application/json")
    public User getMyAccount() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userDao.findByUsernameAndDeleteddatetimeIsNull(username);
    }

    @PutMapping(value = "/user/account/me")
    public String updateMyAccount(@RequestBody User incoming) {
        User me = getMyAccount();
        if (me == null) return "Account not found";

        try {
            // duplicate check same as updateData, excluding self
            User duplicate = userDao.findByUsernameAndEmployeeAndDeleteddatetimeIsNull(
                    incoming.getUsername(), me.getEmployee()
            );
            if (duplicate != null && !duplicate.getId().equals(me.getId())) {
                return "Username already in use";
            }

            me.setUsername(incoming.getUsername());
            me.setEmail(incoming.getEmail());
            me.setNote(incoming.getNote());
            me.setUpdateddatetime(LocalDateTime.now());
            // deliberately NOT touching roles/status/employee here

            userDao.save(me);

            // keep the linked owner record's email in sync here too
            syncEmailToOwner(me);

            return "OK";
        } catch (Exception e) {
            return "Account update not completed: " + e.getMessage();
        }
    }

    @PutMapping(value = "/user/account/me/photo")
    public String updateMyPhoto(@RequestBody User incoming) {
        User me = getMyAccount();
        if (me == null) return "Account not found";

        if (incoming.getImageBase64() != null && !incoming.getImageBase64().isEmpty()) {
            String base64 = incoming.getImageBase64();
            if (base64.contains(",")) base64 = base64.split(",")[1];
            me.setImage(Base64.getDecoder().decode(base64));
        } else if (incoming.isImageRemoved()) {
            me.setImage(null);
        } else {
            return "No image provided";
        }

        me.setUpdateddatetime(LocalDateTime.now());
        userDao.save(me);
        return "OK";
    }

    @PutMapping(value = "/user/account/me/password")
    public String updateMyPassword(@RequestBody java.util.Map<String, String> body) {
        User me = getMyAccount();
        if (me == null) return "Account not found";

        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");

        if (!encoder.matches(currentPassword, me.getPassword())) {
            return "Current password is incorrect";
        }

        try {
            me.setPassword(encoder.encode(newPassword));
            me.setUpdateddatetime(LocalDateTime.now());
            userDao.save(me);
            return "OK";
        } catch (Exception e) {
            return "Password update not completed: " + e.getMessage();
        }
    }




    // ======== Auto-create Pending user accounts (called by module controllers) ========
//==========================================================================

    public void createPendingUserForEmployee(Employee employee) {
        User user = new User();
        user.setEmployee(employee);
        user.setAccounttype(AccountType.Employee);
        user.setStatus(StatusPending.Pending);
        user.setAddeddatetime(LocalDateTime.now());
        user.setUpdateddatetime(LocalDateTime.now());

        // Derive role from the employee's designation name (e.g. "Manager", "Officer", "Clerk")
        if (employee.getDesignation_id() != null) {
            String designationName = employee.getDesignation_id().getName();
            Role matchedRole = roleDao.findByNameIgnoreCase(designationName);
            if (matchedRole != null) {
                user.setRoles(new ArrayList<>(List.of(matchedRole)));
            }
            // no match -> roles left empty, admin assigns manually when approving
        }

        userDao.save(user);
    }

    public void createPendingUserForFarmer(Farmer farmer) {
        User user = new User();
        user.setFarmer(farmer);
        user.setAccounttype(AccountType.Farmer);
        user.setStatus(StatusPending.Pending);
        user.setAddeddatetime(LocalDateTime.now());
        user.setUpdateddatetime(LocalDateTime.now());

        Role farmerRole = roleDao.findByNameIgnoreCase("Farmer");
        if (farmerRole != null) {
            user.setRoles(new ArrayList<>(List.of(farmerRole)));
        }

        userDao.save(user);
    }

    public void createPendingUserForSupermarket(Supermarket supermarket) {
        User user = new User();
        user.setSupermarket(supermarket);
        user.setAccounttype(AccountType.Supermarket);
        user.setStatus(StatusPending.Pending);
        user.setAddeddatetime(LocalDateTime.now());
        user.setUpdateddatetime(LocalDateTime.now());

        Role supermarketRole = roleDao.findByNameIgnoreCase("Supermarket");
        if (supermarketRole != null) {
            user.setRoles(new ArrayList<>(List.of(supermarketRole)));
        }

        userDao.save(user);
    }

    public void createPendingUserForSupplier(Supplier supplier) {
        User user = new User();
        user.setSupplier(supplier);
        user.setAccounttype(AccountType.Supplier);
        user.setStatus(StatusPending.Pending);
        user.setAddeddatetime(LocalDateTime.now());
        user.setUpdateddatetime(LocalDateTime.now());

        Role supplierRole = roleDao.findByNameIgnoreCase("Supplier");
        if (supplierRole != null) {
            user.setRoles(new ArrayList<>(List.of(supplierRole)));
        }

        userDao.save(user);
    }
}