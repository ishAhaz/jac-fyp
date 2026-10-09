package lk.jac.compost.controller;

import lk.jac.common.CommonController;
import lk.jac.common.CurrentUserUtil;
import lk.jac.compost.dao.CompostReturnRepository;
import lk.jac.compost.entity.CompostReturn;
import lk.jac.compost.entity.CompostReturnItem;
import lk.jac.privilege.checker.PrivilegeChecker;
import lk.jac.privilege.dao.PrivilegeRepository;
import lk.jac.user.dao.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.ModelAndView;

import java.time.LocalDateTime;
import java.util.List;

@RestController
public class CompostReturnController implements CommonController<CompostReturn> {
    @Autowired
    private CompostReturnRepository compostReturnDao;



    @Autowired
    private PrivilegeRepository privilegeDao;

    @Autowired
    private UserRepository userDao;

    // module name as stored in the "module" table - verify this matches your DB row exactly
    private static final String MODULE_NAME = "COMPOST_RETURN";

    @GetMapping("/compost/compostreturn")
    public ModelAndView compostReturnPage(){
        ModelAndView compostReturnUI = new ModelAndView();
        compostReturnUI.setViewName("compostreturn.html");
        return compostReturnUI;
    }

    //=====links=========
    //===================
    @GetMapping(value = "/compost/compostreturn/alldata/selected", produces = "application/json")
    public List<CompostReturn> getSelectedCompostReturnData(){
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canSelect()) {
            return List.of(); // no privilege - return empty list rather than throw
        }
        return compostReturnDao.getSelectedCompostReturnData();
    }


    @GetMapping(value = "/compost/compostreturn/byid/{comrid}", produces = "application/json")
    public CompostReturn getCompostReturnById(@PathVariable("comrid") int comrid){
        return compostReturnDao.findByIdAndDeleteddatetimeIsNull(comrid);
    }
    //=====links=========
    //===================

    @PostMapping("/compost/compostreturn/save")
    @Override
    public String saveData(@RequestBody CompostReturn compostReturn) {
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canInsert()) {
            return "Access denied: insufficient privilege";
        }

        LocalDateTime now = LocalDateTime.now();

        compostReturn.setAddeddatetime(now);
        compostReturn.setUpdateddatetime(null);
        compostReturn.setDeleteddatetime(null);
        compostReturn.setReturnid(generateReturnId(now));

        // Must happen BEFORE save(): cascade = CascadeType.ALL on
        // compostReturnItems means Hibernate inserts the child rows as part
        // of this same save call. The JSON payload only carries parent ->
        // children, not children -> parent, so compostreturn is null on each
        // item until we set it here.
        if (compostReturn.getCompostReturnItems() != null) {
            for (CompostReturnItem item : compostReturn.getCompostReturnItems()) {
                item.setId(null); // ensure these insert as new rows, not accidental updates
                item.setCompostreturn(compostReturn);
            }
        }

        compostReturnDao.save(compostReturn);

        return "OK";
    }

    @PutMapping("/compost/compostreturn/update")
    @Override
    public String updateData(@RequestBody CompostReturn compostReturn) {
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canUpdate()) {
            return "Access denied: insufficient privilege";
        }

        CompostReturn existing = compostReturnDao.findByIdAndDeleteddatetimeIsNull(compostReturn.getId());
        if (existing == null) {
            return "Update failed: record not found";
        }

        compostReturn.setAddeddatetime(existing.getAddeddatetime());
        compostReturn.setReturnid(existing.getReturnid());
        compostReturn.setDeleteddatetime(null);
        compostReturn.setUpdateddatetime(LocalDateTime.now());

        // orphanRemoval=true on compostReturnItems means Hibernate will delete
        // any child row that's no longer in this list, and insert any new one
        // (id == null). Re-attach the parent reference on whatever came in.
        if (compostReturn.getCompostReturnItems() != null) {
            for (CompostReturnItem item : compostReturn.getCompostReturnItems()) {
                item.setCompostreturn(compostReturn);
            }
        }

        compostReturnDao.save(compostReturn);

        return "OK";
    }

    @DeleteMapping("/compost/compostreturn/{id}")
    @Override
    public String deleteData(@PathVariable int id) {

        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canDelete()) {
            return "Access denied: insufficient privilege";
        }

        CompostReturn existing = compostReturnDao.findByIdAndDeleteddatetimeIsNull(id);
        if (existing == null) {
            return "AJAX error";
        }

        existing.setDeleteddatetime(LocalDateTime.now());
        compostReturnDao.save(existing);

        return "OK";
    }

    // ------------------------------------------------------------------
    // Naive PREFIX+YY+MM+%04d generator based on total row count.
    // Swap this out for your existing shared ID-generation utility if one
    // is already used by the other modules (crop, farmer, supplier, etc.)
    // to keep the sequence consistent and collision-safe across months.
    // ------------------------------------------------------------------
    private String generateReturnId(LocalDateTime createdAt) {
        int year  = createdAt.getYear();
        int month = createdAt.getMonthValue();

        Integer count = compostReturnDao.countByYearAndMonth(year, month);

        String yy  = String.valueOf(year).substring(2);
        String mm  = String.format("%02d", month);
        String seq = String.format("%03d", count != null ? count : 1);

        return "CR" + yy + mm + seq;
    }
}