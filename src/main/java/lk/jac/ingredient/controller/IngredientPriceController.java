package lk.jac.ingredient.controller;

import lk.jac.common.CurrentUserUtil;
import lk.jac.common.StatusPending;
import lk.jac.compost.controller.CompostPriceController;
import lk.jac.ingredient.dao.IngredientPriceRepository;
import lk.jac.ingredient.entity.IngredientPrice;
import lk.jac.ingredient.entity.SuggestionPriceIn;
import lk.jac.privilege.checker.PrivilegeChecker;
import lk.jac.privilege.dao.PrivilegeRepository;
import lk.jac.user.dao.UserRepository;
import lk.jac.user.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.ModelAndView;

import java.time.LocalDateTime;
import java.util.List;

@RestController
public class IngredientPriceController  {
    @Autowired
    private IngredientPriceRepository ingredientPriceDao;

    @Autowired
    private PrivilegeRepository privilegeDao;

    @Autowired
    private UserRepository userDao;

    @Autowired
    private CompostPriceController compostPriceController;

    private static final String MODULE_NAME  = "INGREDIENT_PRICE";

    @GetMapping("/ingredient/ingredientprice")
    public ModelAndView ingredientPricePage() {
        ModelAndView ingredientPriceUI = new ModelAndView();
        ingredientPriceUI.setViewName("ingredientprice.html");
        return ingredientPriceUI;
    }

    //========links========
    //=====================



    @GetMapping(value = "/ingredient/ingredientprice/alldata/selected", produces = "application/json")
    public List<IngredientPrice> getSelectedIngredientPriceData() {
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canSelect()) {
            return List.of(); // no privilege - return empty list rather than throw
        }
        return ingredientPriceDao.getSelectedIngredientPriceData();
    }

    @GetMapping(value = "/ingredient/ingredientprice/byid/{id}", produces = "application/json")
    public IngredientPrice getById(@PathVariable Integer id) {
        return ingredientPriceDao.findById(id).orElse(null);
    }




    //========links========
    //=====================


    //========Crud========
    //=====================


    @PutMapping("/ingredient/ingredientprice/update")
    public String updateData(@RequestBody IngredientPrice ingredientPrice) {
        String username = CurrentUserUtil.getCurrentUsername();
        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );
        if (!privilege.canUpdate()) {
            return "Access denied: insufficient privilege";
        }

        IngredientPrice existing = ingredientPriceDao.findById(ingredientPrice.getId()).orElse(null);
        if (existing == null) return "Record not found";

        // capture BEFORE mutation - same pattern as the PO/GRN fix
        boolean approvingNow = ingredientPrice.getStatus() == StatusPending.Active
                && existing.getStatus() != StatusPending.Active;

        boolean priceChangedWhileActive = ingredientPrice.getStatus() == StatusPending.Active
                && existing.getStatus() == StatusPending.Active
                && !existing.getRealprice().equals(ingredientPrice.getRealprice());

        if (approvingNow || priceChangedWhileActive) {

            compostPriceController.regenerateForIngredient(existing.getIngredient().getId());
        }

        try {
            existing.setMarkuppricepkg(ingredientPrice.getMarkuppricepkg());
            existing.setRealprice(ingredientPrice.getRealprice());
            existing.setSuggestedpriceperkg(ingredientPrice.getSuggestedpriceperkg());
            existing.setStatus(ingredientPrice.getStatus());
            existing.setUpdateddatetime(LocalDateTime.now());

            ingredientPriceDao.save(existing);

            if (approvingNow) {
                ingredientPriceDao.deactivateOtherRecords(
                        existing.getIngredient().getId(),
                        existing.getId(),
                        StatusPending.Inactive
                );

                // trigger compost price regeneration for every compost
                // that uses this ingredient, now that its Active price changed
                compostPriceController.regenerateForIngredient(existing.getIngredient().getId());
            }

            return "OK";

        } catch (Exception e) {
            System.err.println("IngredientPrice update error: " + e.getMessage());
            return "Something went wrong. Please try again";
        }
    }

    public void createOrUpdateIngredientPrice(SuggestionPriceIn suggestion) {
        try {
            // Always create a NEW record — history is kept, old ones stay as Inactive
            IngredientPrice newRecord = new IngredientPrice();
            newRecord.setIngredient(suggestion.getSupplierhasingredient().getIngredient());
            newRecord.setSuggestedpriceperkg(suggestion.getSuggestedprice());
            newRecord.setStatus(StatusPending.Pending);
            newRecord.setAddeddatetime(LocalDateTime.now());

            String username = CurrentUserUtil.getCurrentUsername();
            User currentUser = userDao.findByUsernameAndDeleteddatetimeIsNull(username);
            newRecord.setUser(currentUser);

            // Generate price ID
            newRecord.setPriceid(generatePriceId(newRecord.getAddeddatetime()));

            ingredientPriceDao.save(newRecord);

        } catch (Exception e) {
            System.err.println("Auto-create IngredientPrice error: " + e.getMessage());
        }
    }

    private String generatePriceId(LocalDateTime addedAt) {
        int year  = addedAt.getYear();
        int month = addedAt.getMonthValue();

        Integer count = ingredientPriceDao.countByYearAndMonth(year, month);

        String yy  = String.valueOf(year).substring(2);
        String mm  = String.format("%02d", month);
        String seq = String.format("%03d", count != null ? count : 1);

        return "IP" + yy + mm + seq;
    }

}
