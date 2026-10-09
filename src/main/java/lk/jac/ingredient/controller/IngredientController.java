package lk.jac.ingredient.controller;

import lk.jac.common.CommonController;
import lk.jac.common.CurrentUserUtil;
import lk.jac.ingredient.dao.IngredientRepository;
import lk.jac.ingredient.entity.Ingredient;
import lk.jac.privilege.checker.PrivilegeChecker;
import lk.jac.privilege.dao.PrivilegeRepository;
import lk.jac.user.dao.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.ModelAndView;

import java.time.LocalDateTime;
import java.util.List;

@RestController
public class IngredientController implements CommonController<Ingredient> {
    @Autowired
    private IngredientRepository ingredientDao;

    @Autowired
    private PrivilegeRepository privilegeDao;

    @Autowired
    private UserRepository userDao;

    private static final String MODULE_NAME = "INGREDIENT_LIST";

    @GetMapping("/ingredient/ingredientlist")
    public ModelAndView ingredientpage(){
        ModelAndView ingredientUI = new ModelAndView();
        ingredientUI.setViewName("ingredient.html");
        return ingredientUI;
    }

    //=====links====
    //==============


    @GetMapping(value = "/ingredient/ingredientlist/byid/{ingid}", produces = "application/json")
    public Ingredient getIngredientById(@PathVariable int ingid){
        return ingredientDao.findByIdAndDeleteddatetimeIsNull(ingid);
    }

    @GetMapping(value = "/ingredient/ingredientlist/dropdown/selected", produces = "application/json")
    public List<Ingredient> getSelectedIngredientCompost() {
        return ingredientDao.findByDeleteddatetimeIsNull();
    }

    @GetMapping("/ingredient/ingredientlist/alldata/selected")
    public List<Ingredient> getSelectedIngredientData() {

        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canSelect()) {
            return List.of(); // no privilege - return empty list rather than throw
        }

        return ingredientDao.getSelectedIngredientData();
    }

    @GetMapping(value = "/ingredient/ingredientlist/dropdown/selected/excludewater", produces = "application/json")
    public List<Ingredient> getDropdownExcludingWater() {
        return ingredientDao.getSelectedIngredientDataExcludingWater();
    }
    //=====links====
    //==============

    @PostMapping("/ingredient/ingredientlist/save")
    @Override
    public String saveData(@RequestBody Ingredient ingredient) {
        //user privilege
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canInsert()) {
            return "Access denied: insufficient privilege";
        }


        //data duplication
        Ingredient existing = ingredientDao.findByNameAndDeleteddatetimeIsNull(ingredient.getName());
        if (existing != null) {
            return "Ingredient already exists for this ingredient name";
        }
        //try catch
        try{
            String regNo = generateRegistrationNo();
            ingredient.setIngredientid(regNo);

            ingredient.setAddeddatetime(LocalDateTime.now());
            ingredient.setUpdateddatetime(LocalDateTime.now());

            ingredientDao.save(ingredient);
            return "OK";
        } catch (Exception e) {
            System.err.println("Ingredient save error: " + e.getMessage());

            String msg = e.getMessage();
            if (msg != null && msg.contains("name_UNIQUE")) {
                return "Ingredient name already exists";
            }
            return "Something went wrong. Please try again.";
        }

    }

    private String generateRegistrationNo() {
        String lastNumber = ingredientDao.getLastRegistrationNo();

        if (lastNumber == null) {
            return "IN001";
        }

        String numberPart = lastNumber.substring(2);

        int nextNumber = Integer.parseInt(numberPart) + 1;

        return String.format("IN%03d", nextNumber);
    }

    @PutMapping("/ingredient/ingredientlist/update")
    @Override
    public String updateData(@RequestBody Ingredient ingredient) {
        //privilege

        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canUpdate()) {
            return "Access denied: insufficient privilege";
        }


        // correct existence check
        Ingredient extIngredient = ingredientDao.findByIdAndDeleteddatetimeIsNull(ingredient.getId());
        if (extIngredient == null) {
            return "Ingredient not found";
        }

        //  check ingredient name duplicate but exclude current ingredient
        Ingredient existingIngredientName = ingredientDao.findByNameAndDeleteddatetimeIsNull(ingredient.getName());
        if (existingIngredientName != null && !existingIngredientName.getId().equals(ingredient.getId())) {
            return "ingredient Name already exists";
        }
            try {

                // keep original addeddatetime
               ingredient.setAddeddatetime(extIngredient.getAddeddatetime());
                ingredient.setUpdateddatetime(LocalDateTime.now());

                ingredientDao.save(ingredient);
                return "OK";

            } catch (Exception e) {

                System.err.println("Ingredient save error: " + e.getMessage());

                String msg = e.getMessage();
                if (msg != null && msg.contains("name_UNIQUE")) {
                    return "Ingredient name already exists";
                }
                return "Something went wrong. Please try again.";
            }
    }

    @DeleteMapping("/ingredient/ingredientlist/{id}")
    @Override
    public String deleteData(@PathVariable int id) {
       //privilege

        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canDelete()) {
            return "Access denied: insufficient privilege";
        }

        //check existence
        Ingredient existingIngredient = ingredientDao.findByIdAndDeleteddatetimeIsNull(id);
        if (existingIngredient == null) {
            return "Ingredient delete not completed: Ingredient not available";
        }
        try{
            //soft delete
            existingIngredient.setDeleteddatetime(LocalDateTime.now());
            ingredientDao.save(existingIngredient);
            return "OK";

        } catch (Exception e) {
            return "Ingredient delete not completed";
        }
    }
    }

