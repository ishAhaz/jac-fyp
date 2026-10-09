package lk.jac.supermarket.controller;

import lk.jac.common.CommonController;
import lk.jac.common.CurrentUserUtil;
import lk.jac.privilege.checker.PrivilegeChecker;
import lk.jac.privilege.dao.PrivilegeRepository;
import lk.jac.supermarket.dao.SupermarketReturnRepository;
import lk.jac.supermarket.entity.SupermarketReturn;
import lk.jac.supermarket.entity.SupermarketReturnItem;
import lk.jac.user.dao.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.ModelAndView;

import java.time.LocalDateTime;
import java.util.List;

@RestController
public class SupermarketReturnController implements CommonController<SupermarketReturn> {
    @Autowired
    private SupermarketReturnRepository supermarketReturnDao;

    @Autowired
    private PrivilegeRepository privilegeDao;

    @Autowired
    private UserRepository userDao;

    // module name as stored in the "module" table - verify this matches your DB row exactly
    private static final String MODULE_NAME = "SUPERMARKET_RETURN";

    @GetMapping("/supermarket/supermarketreturn")
    public ModelAndView supermarketReturnPage(){
        ModelAndView supermarketReturnUI = new ModelAndView();
        supermarketReturnUI.setViewName("supermarketreturn.html");
        return supermarketReturnUI;
    }

    //=====links=========
    //===================
    @GetMapping(value = "/supermarket/supermarketreturn/alldata/selected", produces = "application/json")
    public List<SupermarketReturn> getSelectedSupermarketReturnData(){
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canSelect()) {
            return List.of(); // no privilege - return empty list rather than throw
        }
        return supermarketReturnDao.getSelectedSupermarketReturnData();
    }


    @GetMapping(value = "/supermarket/supermarketreturn/byid/{smrid}", produces = "application/json")
    public SupermarketReturn getSupermarketReturnById(@PathVariable("smrid") int smrid){
        return supermarketReturnDao.findByIdAndDeleteddatetimeIsNull(smrid);
    }
    //=====links=========
    //===================

    @PostMapping("/supermarket/supermarketreturn/save")
    @Override
    public String saveData(@RequestBody SupermarketReturn supermarketReturn) {
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canInsert()) {
            return "Access denied: insufficient privilege";
        }

        LocalDateTime now = LocalDateTime.now();

        supermarketReturn.setAddeddatetime(now);
        supermarketReturn.setUpdateddatetime(null);
        supermarketReturn.setDeleteddatetime(null);
        supermarketReturn.setReturnid(generateReturnId(now));

        // Must happen BEFORE save(): cascade = CascadeType.ALL on
        // supermarketReturnItems means Hibernate inserts the child rows as part
        // of this same save call. The JSON payload only carries parent ->
        // children, not children -> parent, so supermarketreturn is null on each
        // item until we set it here.
        if (supermarketReturn.getSupermarketReturnItems() != null) {
            for (SupermarketReturnItem item : supermarketReturn.getSupermarketReturnItems()) {
                item.setId(null); // ensure these insert as new rows, not accidental updates
                item.setSupermarketreturn(supermarketReturn);
            }
        }

        supermarketReturnDao.save(supermarketReturn);

        return "OK";
    }

    @PutMapping("/supermarket/supermarketreturn/update")
    @Override
    public String updateData(@RequestBody SupermarketReturn supermarketReturn) {
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canUpdate()) {
            return "Access denied: insufficient privilege";
        }

        SupermarketReturn existing = supermarketReturnDao.findByIdAndDeleteddatetimeIsNull(supermarketReturn.getId());
        if (existing == null) {
            return "Update failed: record not found";
        }

        supermarketReturn.setAddeddatetime(existing.getAddeddatetime());
        supermarketReturn.setReturnid(existing.getReturnid());
        supermarketReturn.setDeleteddatetime(null);
        supermarketReturn.setUpdateddatetime(LocalDateTime.now());

        // orphanRemoval=true on supermarketReturnItems means Hibernate will delete
        // any child row that's no longer in this list, and insert any new one
        // (id == null). Re-attach the parent reference on whatever came in.
        if (supermarketReturn.getSupermarketReturnItems() != null) {
            for (SupermarketReturnItem item : supermarketReturn.getSupermarketReturnItems()) {
                item.setSupermarketreturn(supermarketReturn);
            }
        }

        supermarketReturnDao.save(supermarketReturn);

        return "OK";
    }

    @DeleteMapping("/supermarket/supermarketreturn/{id}")
    @Override
    public String deleteData(@PathVariable int id) {

        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canDelete()) {
            return "Access denied: insufficient privilege";
        }

        SupermarketReturn existing = supermarketReturnDao.findByIdAndDeleteddatetimeIsNull(id);
        if (existing == null) {
            return "AJAX error";
        }

        existing.setDeleteddatetime(LocalDateTime.now());
        supermarketReturnDao.save(existing);

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

        Integer count = supermarketReturnDao.countByYearAndMonth(year, month);

        String yy  = String.valueOf(year).substring(2);
        String mm  = String.format("%02d", month);
        String seq = String.format("%03d", count != null ? count : 1);

        return "SR" + yy + mm + seq;
    }
}