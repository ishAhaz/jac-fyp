package lk.jac.supermarket.controller;

import lk.jac.common.CommonController;
import lk.jac.common.CurrentUserUtil;
import lk.jac.privilege.checker.PrivilegeChecker;
import lk.jac.privilege.dao.PrivilegeRepository;
import lk.jac.supermarket.dao.SupermarketRepository;
import lk.jac.supermarket.entity.Supermarket;
import lk.jac.user.controller.UserController;
import lk.jac.user.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.ModelAndView;

import java.time.LocalDateTime;
import java.util.List;

@RestController
public class SupermarketController implements CommonController<Supermarket> {
    @Autowired
    private SupermarketRepository supermarketDao;

    @Autowired
    private UserController userController;

    @Autowired
    private PrivilegeRepository privilegeDao;

    private static final String MODULE_NAME = "SUPERMARKET_LIST";

    @GetMapping("/supermarket/supermarketlist")
    public ModelAndView supermarketPage(){
        ModelAndView supermarketUI = new ModelAndView();
        supermarketUI.setViewName("supermarket.html");
        return supermarketUI;
    }
    //=====links======
    //================

    @GetMapping(value = "/supermarket/supermarketlist/byid/{suid}", produces = "application/json")
    public Supermarket getSupermarketById(@PathVariable int suid){
        return supermarketDao.findByIdAndDeleteddatetimeIsNull(suid);
    }

    @GetMapping(value = "/supermarket/supermarketlist/alldata/selected", produces = "application/json")
    public List<Supermarket> getSelectedSupermarketData(){
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canSelect()) {
            return List.of(); // no privilege - return empty list rather than throw
        }

        return supermarketDao.getSelectedSupermarketData();
    }
    //=======links======
    //==================



    //=======crud=======
    //==================
    @PostMapping("/supermarket/supermarketlist/save")
    @Override
    public String saveData(@RequestBody Supermarket supermarket) {
        //user privilege
        //===========================
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canInsert()) {
            return "Access denied: insufficient privilege";
        }

        //data duplication
        Supermarket existingName = supermarketDao.findByNameAndDeleteddatetimeIsNull(
                supermarket.getName());
        if (existingName != null){
            return "Supermarket already exists for this  name";
        }


        Supermarket existingBusinessRegiNo = supermarketDao.findByBusinessregnoAndDeleteddatetimeIsNull(
                supermarket.getBusinessregno());
        if (existingBusinessRegiNo != null){
            return "Supermarket already exists for this business register number";
        }


        Supermarket existingContactPerson = supermarketDao.findByContactpersonAndDeleteddatetimeIsNull(
                supermarket.getContactperson());
        if (existingContactPerson != null){
            return "Supermarket already exists for this contact person";
        }


        Supermarket existingContactPersonNumber = supermarketDao.findByContactpersonnoAndDeleteddatetimeIsNull(
                supermarket.getContactpersonno());
        if (existingContactPersonNumber != null){
            return "Supermarket already exists for this contact person number";
        }


        Supermarket existingEmail = supermarketDao.findByEmailAndDeleteddatetimeIsNull(
                supermarket.getEmail());
        if (existingEmail != null){
            return "Supermarket already exists for this email";
        }


        Supermarket existingLandNumber = supermarketDao.findByLandnumAndDeleteddatetimeIsNull(
                supermarket.getLandnum());
        if (existingLandNumber != null){
            return "Supermarket already exists for this Land number";
        }

        try{
            supermarket.setAddeddatetime(LocalDateTime.now());
            supermarket.setUpdateddatetime(null);

            supermarket.setNumber("TEMP");
            Supermarket saved = supermarketDao.save(supermarket);


            String soNumber = generateRegistrationNo(saved.getAddeddatetime());
            saved.setNumber(soNumber);
            supermarketDao.save(supermarket); // second save just updates the number

            userController.createPendingUserForSupermarket(supermarket);
            return "OK";
        }catch (Exception e){
            System.err.println("Supermarket save error: " + e.getMessage());

            String msg = e.getMessage();
            if (msg != null && msg.contains("name_UNIQUE")) {
                return "Supermarket name already exists";
            }
            if (msg != null && msg.contains("businessregno_UNIQUE")) {
                return "Supermarket business register number already exists";
            }
            if (msg != null && msg.contains("contactperson_UNIQUE")) {
                return "Supermarket contact person already exists";
            }
            if (msg != null && msg.contains("email_UNIQUE")) {
                return "Supermarket email already exists";
            }
            if (msg != null && msg.contains("landnum_UNIQUE")) {
                return "Supermarket land number already exists";
            }
            if (msg != null && msg.contains("contactpersonno_UNIQUE")) {
                return "Supermarket contact person number already exists";
            }
            return "Something went wrong. Please try again.";
        }

    }

    private String generateRegistrationNo(LocalDateTime createdAt) {
        int year  = createdAt.getYear();
        int month = createdAt.getMonthValue();

        Integer count = supermarketDao.countByYearAndMonth(year, month);

        String yy  = String.valueOf(year).substring(2);
        String mm  = String.format("%02d", month);
        String seq = String.format("%03d", count != null ? count : 1);

        return "SM" + yy + mm + seq;
    }

    @PutMapping("/supermarket/supermarketlist/update")
    @Override
    public String updateData(@RequestBody Supermarket supermarket) {

        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canUpdate()) {
            return "Access denied: insufficient privilege";
        }




        // correct existence check
        Supermarket extSupermarket = supermarketDao.findByIdAndDeleteddatetimeIsNull(supermarket.getId());
        if (extSupermarket == null) {
            return "Supermarket not found";
        }

        Supermarket existingName = supermarketDao.findByNameAndDeleteddatetimeIsNull(
                supermarket.getName());
        if (existingName != null && !existingName.getId().equals(supermarket.getId())){
            return "Supermarket name already exists";
        }

        Supermarket existingBusinessRegiNo = supermarketDao.findByBusinessregnoAndDeleteddatetimeIsNull(
                supermarket.getBusinessregno());
        if (existingBusinessRegiNo != null && !existingBusinessRegiNo.getId().equals(supermarket.getId())) {
            return "Business register number  already exists";
        }

        Supermarket existingContactPerson = supermarketDao.findByContactpersonAndDeleteddatetimeIsNull(
                supermarket.getContactperson());
        if (existingContactPerson != null && !existingContactPerson.getId().equals(supermarket.getId())) {
            return "Contact person already exists";
        }

        Supermarket existingContactPersonNumber = supermarketDao.findByContactpersonnoAndDeleteddatetimeIsNull(
                supermarket.getContactpersonno());
        if (existingContactPersonNumber != null && !existingContactPersonNumber.getId().equals(supermarket.getId())) {
            return "Contact person already exists";
        }

        Supermarket existingEmail = supermarketDao.findByEmailAndDeleteddatetimeIsNull(
                supermarket.getEmail());
        if (existingEmail != null && !existingEmail.getId().equals(supermarket.getId())) {
            return "Email already exists";
        }

        Supermarket existingLandNumber = supermarketDao.findByLandnumAndDeleteddatetimeIsNull(
                supermarket.getLandnum());
        if (existingLandNumber != null && !existingLandNumber.getId().equals(supermarket.getId())) {
            return "Land number already exists";
        }


        try{
            // keep original addeddatetime
            supermarket.setAddeddatetime(extSupermarket.getAddeddatetime());
            supermarket.setUpdateddatetime(LocalDateTime.now());


            // TEMP - remove when user login is implemented
            User tempUser = new User();
            tempUser.setId(4);
            supermarket.setUser(tempUser);

            supermarketDao.save(supermarket);
            return "OK";
        }catch (Exception e){
            System.err.println("Supermarket update error: " + e.getMessage());

            String msg = e.getMessage();
            if (msg != null && msg.contains("name_UNIQUE")) {
                return "Supermarket name already exists";
            }
            if (msg != null && msg.contains("businessregno_UNIQUE")) {
                return "Supermarket business register number already exists";
            }
            if (msg != null && msg.contains("contactperson_UNIQUE")) {
                return "Supermarket contact person already exists";
            }
            if (msg != null && msg.contains("email_UNIQUE")) {
                return "Supermarket email already exists";
            }
            if (msg != null && msg.contains("landnum_UNIQUE")) {
                return "Supermarket land number already exists";
            }
            if (msg != null && msg.contains("contactpersonno_UNIQUE")) {
                return "Supermarket contact person number already exists";
            }
            return "Something went wrong. Please try again.";
        }
    }

    @DeleteMapping("/supermarket/supermarketlist/{id}")
    @Override
    public String deleteData(@PathVariable int id) {

        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canDelete()) {
            return "Access denied: insufficient privilege";
        }

        //check existence
        Supermarket existingSupermarket = supermarketDao.findByIdAndDeleteddatetimeIsNull(id);
        if (existingSupermarket == null) {
            return "Compost delete not completed: Compost not available";
        }
        try{
            //soft delete
            existingSupermarket.setDeleteddatetime(LocalDateTime.now());
            supermarketDao.save(existingSupermarket);
            return "OK";

        } catch (Exception e) {
            return "Supermarket delete not completed";
        }
    }
}
