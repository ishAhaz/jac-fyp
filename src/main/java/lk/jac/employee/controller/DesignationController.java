package lk.jac.employee.controller;

import lk.jac.common.CommonController;
import lk.jac.common.CurrentUserUtil;
import lk.jac.employee.dao.DesignationRepository;
import lk.jac.employee.entity.Designation;
import lk.jac.privilege.checker.PrivilegeChecker;
import lk.jac.privilege.dao.PrivilegeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.ModelAndView;

import java.util.List;

@RestController
public class DesignationController implements CommonController<Designation> {
    @Autowired
    private DesignationRepository designationDao;

    @Autowired
    private PrivilegeRepository privilegeDao;

private static final String MODULE_NAME = "DESIGNATION";

    @GetMapping("/employee/designations")
    public ModelAndView designationsPage(){
        ModelAndView designationsUI = new ModelAndView();
        designationsUI.setViewName("designations.html");
        return designationsUI;
    }

    @GetMapping(value = "/employee/designations/alldata", produces = "application/json")
    public List<Designation> getAllDesignations() {
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canSelect()) {
            return List.of(); // no privilege - return empty list rather than throw
        }


        return designationDao.findAll();
    }


    @GetMapping(value = "/employee/designations/byid/{deid}", produces = "application/json")
    public Designation getDesignationById(@PathVariable Integer deid){
        return designationDao.findByIdAndDeleteddatetimeIsNull(deid);
    }

    @PostMapping("/employee/designations/save")
    @Override
    public String saveData(@RequestBody Designation designation) {
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canInsert()) {
            return "Access denied: insufficient privilege";
        }
        return "";
    }

    @PutMapping("/employee/designations/update")
    @Override
    public String updateData(@RequestBody Designation designation) {
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canUpdate()) {
            return "Access denied: insufficient privilege";
        }

        return "";
    }

    @DeleteMapping("/employee/designations/{id}")
    @Override
    public String deleteData(@PathVariable int id) {
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canDelete()) {
            return "Access denied: insufficient privilege";
        }

        return "";
    }
}
