package lk.jac.privilege.controller;


import lk.jac.common.CommonController;
import lk.jac.common.CurrentUserUtil;
import lk.jac.privilege.checker.PrivilegeChecker;
import lk.jac.privilege.dao.PrivilegeRepository;
import lk.jac.privilege.entity.Privilege;
import lk.jac.user.dao.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.ModelAndView;

import java.time.LocalDateTime;
import java.util.List;

@RestController
public class PrivilegeController implements CommonController<Privilege> {



    @Autowired
    private PrivilegeRepository privilegeDao;

    @Autowired
    private UserRepository userDao;

    @RequestMapping("/privilege/privilegelist")
    public ModelAndView privilegePage(){
        ModelAndView privilegeUI = new ModelAndView();
        privilegeUI.setViewName("/privilege.html");
        return privilegeUI;
    }

    private static final String MODULE_NAME = "PRIVILEGE";


    //create get mapping for get privilege object by given id
    @GetMapping(value = "/privilege/privilegelist/byid/{pid}", produces = "application/json")
    public Privilege getPrivilegeById(@PathVariable Integer pid) {
        return privilegeDao.findByIdAndDeleteddatetimeIsNull(pid);
    }


    @GetMapping(value = "/privilege/privilegelist/alldata/selected", produces = "application/json")
    public List<Privilege> getAllDataSelected() {
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canSelect()) {
            return List.of(); // no privilege - return empty list rather than throw
        }

        return privilegeDao.getSelectedColumns();
    }

    @PostMapping(value = "/privilege/privilegelist/save")
    @Override
    public String saveData(@RequestBody Privilege privilege) {
        //user privilege
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilegeCheck = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilegeCheck.canInsert()) {
            return "Access denied: insufficient privilege";
        }

        //data duplicate

        //try catch
        try{
            //do operation
            // duplicate check - same role and module combination
            Privilege existing = privilegeDao.findByRoleAndModuleAndDeleteddatetimeIsNull(
                    privilege.getRole(), privilege.getModule()
            );
            if (existing != null) {
                return "Privilege already exists for this role and module";
            }

            privilege.setAddeddatetime(LocalDateTime.now());
            privilege.setUpdateddatetime(LocalDateTime.now());
            privilegeDao.save(privilege);
            return "OK";
        } catch (Exception e) {
            return "Privilege save not completed: " + e.getMessage();

        }

    }


    @PutMapping(value = "/privilege/privilegelist/update")
    @Override
    public String updateData(@RequestBody Privilege privilege) {

        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilegeCheck = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilegeCheck.canUpdate()) {
            return "Access denied: insufficient privilege";
        }

        //do operate
        //check dependencies



        //try catch
        try{
            Privilege extPrivilege = privilegeDao.findByIdAndDeleteddatetimeIsNull(privilege.getId());
            if (extPrivilege == null) {
                return "Privilege not found";
            }

            // duplicate check but exclude current
            Privilege existing = privilegeDao.findByRoleAndModuleAndDeleteddatetimeIsNull(
                    privilege.getRole(), privilege.getModule()
            );
            if (existing != null && !existing.getId().equals(privilege.getId())) {
                return "Privilege already exists for this role and module"; // 400
            }

            privilege.setAddeddatetime(extPrivilege.getAddeddatetime());
            privilege.setUpdateddatetime(LocalDateTime.now());
            privilegeDao.save(privilege);
            return "OK";
        } catch (Exception e) {
            return "Privilege update not completed: " + e.getMessage();
        }
    }


    @DeleteMapping(value = "/privilege/privilegelist/{id}")
    @Override
    public String deleteData(@PathVariable int id) {
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilegeCheck = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilegeCheck.canDelete()) {
            return "Access denied: insufficient privilege";
        }

        Privilege extPrivilege = privilegeDao.findByIdAndDeleteddatetimeIsNull(id);
        if (extPrivilege == null) {
            return "Privilege not found"; // 404
        }

        try{
          //do operation

          //check dependencies
            extPrivilege.setDeleteddatetime(LocalDateTime.now());
            privilegeDao.save(extPrivilege);
            return "OK";
      } catch (Exception e) {
            return "Privilege delete not completed: " + e.getMessage(); // 500

        }
    }
}