package lk.jac.privilege.controller;

import lk.jac.privilege.dao.RoleRepository;
import lk.jac.privilege.entity.Role;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class RoleController {
    @Autowired
    private RoleRepository roleDao;

    @RequestMapping(value = "/privilege/role/alldata",method = RequestMethod.GET,produces = "application/json")
    public List<Role> getAllRoles(){
        return roleDao.findAll();
    }

    @GetMapping("/privilege/role/assignable")
    public List<Role> getAssignableRoles() {
        return roleDao.findByNameNot("ADMIN");
    }
}
