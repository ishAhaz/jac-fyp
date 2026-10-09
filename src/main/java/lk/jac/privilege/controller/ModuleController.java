package lk.jac.privilege.controller;

import lk.jac.privilege.dao.ModuleRepository;
import lk.jac.privilege.entity.AppModule;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class ModuleController {
    @Autowired
    private ModuleRepository moduleDao;

    @RequestMapping(value = "/privilege/module/alldata",method = RequestMethod.GET,produces = "application/json")
    public List<AppModule> getAllModules(){
        return moduleDao.findAll();
    }
}
