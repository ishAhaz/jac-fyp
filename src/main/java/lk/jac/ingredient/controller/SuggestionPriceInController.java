package lk.jac.ingredient.controller;

import lk.jac.common.CurrentUserUtil;
import lk.jac.common.SuggestionStatus;
import lk.jac.common.StatusReject;
import lk.jac.ingredient.dao.SuggestionPriceInRepository;
import lk.jac.ingredient.dao.SupplierHasIngredientRepository;
import lk.jac.ingredient.entity.SuggestionPriceIn;
import lk.jac.ingredient.entity.SupplierHasIngredient;
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
public class SuggestionPriceInController {

    @Autowired
    private SuggestionPriceInRepository suggestionPriceInDao;

    @Autowired
    private SupplierHasIngredientRepository supplierHasIngredientDao;

    @Autowired
    private IngredientPriceController ingredientPriceController;

    @Autowired
    private PrivilegeRepository privilegeDao;

    @Autowired
    private UserRepository userDao;

    private static final String MODULE_NAME = "INGREDIENT_SUGGESTION_PRICE";


    // ======== PAGE ========
    @GetMapping("/ingredient/suggestionpricein")
    public ModelAndView suggestionPriceInPage() {
        ModelAndView mv = new ModelAndView();
        mv.setViewName("suggestionpricein.html");
        return mv;
    }

    // ======== LINKS ========

    @GetMapping(value = "/ingredient/suggestionpricein/alldata/selected", produces = "application/json")
    public List<SuggestionPriceIn> getSelectedSuggestionPriceInData() {
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canSelect()) {
            return List.of(); // no privilege - return empty list rather than throw
        }

        return suggestionPriceInDao.getSelectedSuggestionPriceInData();
    }

    @GetMapping(value = "/ingredient/suggestionpricein/byid/{id}", produces = "application/json")
    public SuggestionPriceIn getById(@PathVariable Integer id) {
        return suggestionPriceInDao.findById(id).orElse(null);
    }

    // ======== UPDATE  ========

    @PutMapping("/ingredient/suggestionpricein/update")
    public String updateData(@RequestBody SuggestionPriceIn suggestionpricein) {


        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canUpdate()) {
            return "Access denied: insufficient privilege";
        }




        SuggestionPriceIn existing = suggestionPriceInDao.findById(suggestionpricein.getId()).orElse(null);
        if (existing == null) {
            return "Record not found";
        }

        try {
            existing.setSuggestedprice(suggestionpricein.getSuggestedprice());
            existing.setStatus(suggestionpricein.getStatus());
            existing.setNote(suggestionpricein.getNote());

            // Stamp review datetime on Approved or Rejected
            if (suggestionpricein.getStatus() == SuggestionStatus.Approved ||
                    suggestionpricein.getStatus() == SuggestionStatus.Rejected) {
                existing.setRevieweddatetime(LocalDateTime.now());
            } else {
                existing.setRevieweddatetime(null);
            }



            suggestionPriceInDao.save(existing);


            // ← Reload shi fresh from DB using the existing record's relationship
            Integer shiId = existing.getSupplierhasingredient().getId();
            SupplierHasIngredient shi = supplierHasIngredientDao.findById(shiId).orElse(null);


            // Sync status back to supplier_has_ingredient

            if (shi != null) {
                if (suggestionpricein.getStatus() == SuggestionStatus.Approved) {
                    shi.setStatus(StatusReject.Active);
                    supplierHasIngredientDao.save(shi);


                    ingredientPriceController.createOrUpdateIngredientPrice(existing);

                } else if (suggestionpricein.getStatus() == SuggestionStatus.Rejected) {
                    shi.setStatus(StatusReject.Rejected);
                    supplierHasIngredientDao.save(shi);

                } else {
                    shi.setStatus(StatusReject.Pending);
                    supplierHasIngredientDao.save(shi);
                }
            }

            return "OK";
        } catch (Exception e) {
            System.err.println("SuggestionPrice update error: " + e.getMessage());
            return "Something went wrong. Please try again";
        }
    }

    // ======== AUTO-CREATE called from SupplierController ========

    public void createOrUpdateSuggestion(SupplierHasIngredient shi) {
        try {
            Double highestPrice = suggestionPriceInDao.findHighestPriceByIngredientId(
                    shi.getIngredient().getId()
            );

            // Compare current shi's price too, since this row may not be
            // committed/visible yet in the same transaction
            double suggested = (highestPrice != null)
                    ? Math.max(highestPrice, shi.getPrice())
                    : shi.getPrice();

            // TEMP user until login module is ready
            String username = CurrentUserUtil.getCurrentUsername();
            User currentUser = userDao.findByUsernameAndDeleteddatetimeIsNull(username);


            SuggestionPriceIn existing = suggestionPriceInDao
                    .findBySupplierhasingredientId(shi.getId());

            if (existing == null) {
                SuggestionPriceIn newRecord = new SuggestionPriceIn();
                newRecord.setSupplierhasingredient(shi);
                newRecord.setSupplierprice(shi.getPrice());
                newRecord.setSuggestedprice(highestPrice != null ? highestPrice : shi.getPrice());
                newRecord.setSuggesteddatetime(LocalDateTime.now());
                newRecord.setStatus(SuggestionStatus.Pending);
                newRecord.setUser(currentUser);
                suggestionPriceInDao.save(newRecord);
            } else {
                existing.setSupplierprice(shi.getPrice());
                existing.setSuggestedprice(highestPrice != null ? highestPrice : shi.getPrice());
                existing.setSuggesteddatetime(LocalDateTime.now());
                existing.setStatus(SuggestionStatus.Pending);
                existing.setRevieweddatetime(null);
                existing.setNote(null);
                existing.setUser(currentUser);
                suggestionPriceInDao.save(existing);
            }
        } catch (Exception e) {
            System.err.println("Auto-create suggestion error: " + e.getMessage());
        }
    }
}