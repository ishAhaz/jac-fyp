package lk.jac.ingredient.controller;

import lk.jac.common.CurrentUserUtil;
import lk.jac.common.SuggestionStatus;
import lk.jac.grn.dao.GrnIngredientsItemRepository;
import lk.jac.grn.entity.GrnIngredients;
import lk.jac.grn.entity.GrnIngredientsItem;
import lk.jac.ingredient.dao.IngredientQualityCheckItemRepository;
import lk.jac.ingredient.dao.IngredientQualityCheckRepository;
import lk.jac.ingredient.entity.IngredientQualityCheck;
import lk.jac.ingredient.entity.IngredientQualityCheckItem;
import lk.jac.privilege.checker.PrivilegeChecker;
import lk.jac.privilege.dao.PrivilegeRepository;
import lk.jac.user.dao.UserRepository;
import lk.jac.user.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.ModelAndView;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@RestController
public class IngredientQualityCheckController {

    @Autowired
    private IngredientQualityCheckRepository ingredientQualityCheckDao;

    @Autowired
    private GrnIngredientsItemRepository grnIngredientsItemDao;

    @Autowired
    private IngredientQualityCheckItemRepository ingredientQualityCheckItemDao;

    @Autowired
    private IngredientInventoryController ingredientInventoryController;

    @Autowired
    private PrivilegeRepository privilegeDao;

    @Autowired
    private UserRepository userDao;

    private static final String MODULE_NAME = "INGREDIENT_QUALITY";

    @GetMapping("/ingredient/ingredientquality")
    public ModelAndView ingredientQualityCheckPage() {
        ModelAndView ingredientQualityUI = new ModelAndView();
        ingredientQualityUI.setViewName("ingredientqualitycheck.html");
        return ingredientQualityUI;
    }


    @GetMapping(value = "/ingredient/ingredientqualitycheck/alldata/selected", produces = "application/json")
    public List<IngredientQualityCheck> getAll() {
        String username = CurrentUserUtil.getCurrentUsername();
        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );
        if (!privilege.canSelect()) {
            return List.of(); // no privilege - return empty list rather than throw
        }

        return ingredientQualityCheckDao.findAll();
    }

    @GetMapping(value = "/ingredient/ingredientqualitycheck/byid/{id}", produces = "application/json")
    public IngredientQualityCheck getById(@PathVariable Integer id) {
        return ingredientQualityCheckDao.findByIdWithItems(id);
    }

    //======links=========
    //====================


    @PutMapping("/ingredient/ingredientqualitycheck/update")
    @Transactional
    public String updateData(@RequestBody IngredientQualityCheck ingredientQualityCheck) {
        String username = CurrentUserUtil.getCurrentUsername();
        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );
        if (!privilege.canUpdate()) {
            return "Access denied: insufficient privilege";
        }

        IngredientQualityCheck existing =
                ingredientQualityCheckDao.findById(ingredientQualityCheck.getId()).orElse(null);
        if (existing == null) return "Quality Check not found";

        // Lock — Approved or Rejected is final, protects inventory FK integrity
        if (existing.getQualitystatus() == SuggestionStatus.Approved ||
                existing.getQualitystatus() == SuggestionStatus.Rejected) {
            return "Cannot update a " + existing.getQualitystatus() + " Quality Check";
        }

        try {
            SuggestionStatus previousStatus = existing.getQualitystatus();

            existing.setCheckeddate(ingredientQualityCheck.getCheckeddate());
            existing.setQualitystatus(ingredientQualityCheck.getQualitystatus());
            existing.setUpdateddatetime(LocalDateTime.now());

            if (ingredientQualityCheck.getIngredientQualityCheckItems() != null) {
                existing.getIngredientQualityCheckItems().clear();
                for (IngredientQualityCheckItem item : ingredientQualityCheck.getIngredientQualityCheckItems()) {
                    item.setId(null);
                    item.setIngredientQualityCheck(existing);
                    existing.getIngredientQualityCheckItems().add(item);
                }
            }

            IngredientQualityCheck saved = ingredientQualityCheckDao.save(existing);

            boolean nowApproved = saved.getQualitystatus() == SuggestionStatus.Approved &&
                    previousStatus != SuggestionStatus.Approved;

            if (nowApproved) {
                // Re-fetch with full item→GRN item→PO item→ingredient chain populated,
                // since incoming items only carry minimal {id} references
                IngredientQualityCheck freshCheck = ingredientQualityCheckDao.findByIdWithItems(saved.getId());
                ingredientInventoryController.createInventoryFromQualityCheck(freshCheck);
            }

            return "OK";

        } catch (Exception e) {
            System.err.println("Quality check update error: " + e.getMessage());
            e.printStackTrace();
            return "Something went wrong. Please try again";
        }
    }


    private String generateCheckNumber(LocalDateTime addedAt) {
        int year  = addedAt.getYear();
        int month = addedAt.getMonthValue();

        Integer count = ingredientQualityCheckDao.countByYearAndMonth(year, month);

        String yy  = String.valueOf(year).substring(2);
        String mm  = String.format("%02d", month);
        String seq = String.format("%03d", count != null ? count : 1);

        return "QCI" + yy + mm + seq;
    }


    // public so GrnIngredientsController can call it.
    @Transactional
    public void autoCreateQualityCheckFromGrn(GrnIngredients grnIngredients) {
        try {
            IngredientQualityCheck existing =
                    ingredientQualityCheckDao.findByGrnIngredientsId(grnIngredients.getId());
            if (existing != null) return;

            IngredientQualityCheck newQualityCheck = new IngredientQualityCheck();
            newQualityCheck.setGrningredient(grnIngredients);
            newQualityCheck.setQualitystatus(SuggestionStatus.Pending);
            newQualityCheck.setCreateddatetime(LocalDateTime.now());
            newQualityCheck.setUpdateddatetime(null);

            String username = CurrentUserUtil.getCurrentUsername();
            User currentUser = userDao.findByUsernameAndDeleteddatetimeIsNull(username);
            newQualityCheck.setUser(currentUser);

            newQualityCheck.setCheckno("TEMP");
            IngredientQualityCheck saved = ingredientQualityCheckDao.save(newQualityCheck);

            String checkNo = generateCheckNumber(saved.getCreateddatetime());
            saved.setCheckno(checkNo);
            ingredientQualityCheckDao.save(saved);

            // Pre-populate items from the GRN's line items
            List<GrnIngredientsItem> grnIngredientItems =
                    grnIngredientsItemDao.findByGrnIngredientsId(grnIngredients.getId());

            List<IngredientQualityCheckItem> lineItems = new ArrayList<>();
            for (GrnIngredientsItem grnIngredientsItem : grnIngredientItems) {
                IngredientQualityCheckItem lineItem = new IngredientQualityCheckItem();
                lineItem.setIngredientQualityCheck(saved);
                lineItem.setGrnIngredientsItem(grnIngredientsItem);
                lineItem.setQuantity(grnIngredientsItem.getReceivedqty());
                lineItem.setGrade(null);
                lineItem.setNote(null);
                lineItems.add(lineItem);
            }

            ingredientQualityCheckItemDao.saveAll(lineItems);

        } catch (Exception e) {
            System.err.println("Auto-create quality check error: " + e.getMessage());
            e.printStackTrace();
       }
    }

}