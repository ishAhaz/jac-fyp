package lk.jac.compost.controller;

import lk.jac.common.CommonController;
import lk.jac.common.CurrentUserUtil;
import lk.jac.compost.dao.CompostRepository;
import lk.jac.compost.entity.Compost;
import lk.jac.compost.entity.CompostHasIngredient;
import lk.jac.privilege.checker.PrivilegeChecker;
import lk.jac.privilege.dao.PrivilegeRepository;
import lk.jac.user.dao.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.ModelAndView;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
public class CompostController  implements CommonController<Compost> {
    @Autowired
    private CompostRepository compostDao;


    @Autowired
    private PrivilegeRepository privilegeDao;

    @Autowired
    private UserRepository userDao;

    // module name as stored in the "module" table - verify this matches your DB row exactly
    private static final String MODULE_NAME = "COMPOST_LIST";



    @GetMapping("/compost/compostlist")
    public ModelAndView compostPage(){
        ModelAndView compostUI = new ModelAndView();
        compostUI.setViewName("compost.html");
        return compostUI;
    }

    //========links========
    //=====================

    @GetMapping(value = "/compost/compostlist/byid/{comid}", produces = "application/json")
    public Compost getCompostById(@PathVariable int comid)
    {
        return compostDao.findByIdAndDeleteddatetimeIsNull(comid);
    }


    @GetMapping(value = "/compost/compostlist/alldata/selected", produces = "application/json")
    public List<Compost> getSelectedCompostData()
    {
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canSelect()) {
            return List.of(); // no privilege - return empty list rather than throw
        }

        return compostDao.getSelectedCompostData();
    }

    @GetMapping(value = "/compost/compostlist/dropdown/selected", produces = "application/json")
    public List<Compost> getSelectedCompostFarmer(){
        return compostDao.findByDeleteddatetimeIsNull();
    }
    //========links========
    //=====================




    //======CRUD======
    //================
    @PostMapping("/compost/compostlist/save")
   @Override
    public String saveData(@RequestBody Compost compost) {
        //user privilege
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canInsert()) {
            return "Access denied: insufficient privilege";
        }

        //data duplication
        Compost existing = compostDao.findByNameAndDeleteddatetimeIsNull(
                compost.getName());
        if (existing != null){
            return "Compost already exists for this  name";
        }

        if (hasDuplicateIngredients(compost, null)) {
            return "compost with the same ingredients already exists";
        }

        // link each junction entity back to parent compost
        if (compost.getIngredients() != null) {
            compost.getIngredients().forEach(i -> i.setCompost(compost));
        }

        if (compost.getCrops() != null) {
            compost.getCrops().forEach(c -> c.setCompost(compost));
        }

        //try catch
        try{
            //do operation
            //duplicate check
            //generate number
            compost.setAddeddatetime(LocalDateTime.now());
            compost.setUpdateddatetime(null);

            //  generate number — count already includes this compost
            String regNo = generateRegistrationNo();
            compost.setNumber(regNo);

//            compost.setUser(getLoggedUser(authentication));

            compostDao.save(compost); // second save just updates the number
            return "OK";

        } catch (Exception e) {
            System.err.println("Compost save error: " + e.getMessage());

            String msg = e.getMessage();
            if (msg != null && msg.contains("name_UNIQUE")) {
                return "Compost name already exists";
            }
            if (msg != null && msg.contains("ingredient_UNIQUE")) {
                return "Ingredient already exists";
            }

            return "Something went wrong. Please try again.";
        }
    }

    private String generateRegistrationNo() {
        String lastNumber = compostDao.getLastRegistrationNo();

        if (lastNumber == null) {
            return "CO001";
        }

        String numberPart = lastNumber.substring(2);

        int nextNumber = Integer.parseInt(numberPart) + 1;

        return String.format("CO%03d", nextNumber);
    }

    private boolean hasDuplicateIngredients(Compost newCompost, Integer excludeId) {

        // get ingredient ids from the new compost
        List<Integer> ingredientIds = newCompost.getIngredients()
                .stream()
                .map(i -> i.getIngredient().getId())  //  go through junction to ingredient
                .collect(Collectors.toList());

        if (ingredientIds.isEmpty()) return false;

        List<Compost> candidates = compostDao.findCompostsWithIngredients(ingredientIds);

        for (Compost candidate : candidates) {

            if (excludeId != null && candidate.getId().equals(excludeId)) continue;

            Set<CompostHasIngredient> candidateIngredients = candidate.getIngredients();

            // must have same count
            if (candidateIngredients.size() != newCompost.getIngredients().size()) continue;

            // check every ingredient id AND qty matches
            boolean exactMatch = newCompost.getIngredients().stream().allMatch(newIng ->
                    candidateIngredients.stream().anyMatch(existIng ->
                            existIng.getIngredient().getId().equals(newIng.getIngredient().getId()) //
                                    && existIng.getQtyperunit().equals(newIng.getQtyperunit())              // qty check
                                    && existIng.getQtyunit().equals(newIng.getQtyunit())                    //  unit check
                    )
            );

            if (exactMatch) return true;
        }

        return false;
    }


    @PutMapping("/compost/compostlist/update")
   @Override
    public String updateData(@RequestBody Compost compost) {

        //privilege
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canUpdate()) {
            return "Access denied: insufficient privilege";
        }


        // correct existence check
        Compost extCompost = compostDao.findByIdAndDeleteddatetimeIsNull(compost.getId());
        if (extCompost == null) {
            return "Compost not found";
        }

        //  check compost name duplicate but exclude current Compost
        Compost existingCompostName = compostDao.findByNameAndDeleteddatetimeIsNull(compost.getName());
        if (existingCompostName != null && !existingCompostName.getId().equals(compost.getId())) {
            return "Compost Name already exists";
        }

        //duplicate ingredients check — exclude current
        if (hasDuplicateIngredients(compost, compost.getId())) {
            return "A compost with the same ingredients already exists";
        }

        if (compost.getIngredients() != null) {
            compost.getIngredients().forEach(i -> i.setCompost(compost));
        }
        if (compost.getCrops() != null) {
            compost.getCrops().forEach(c -> c.setCompost(compost));
        }

        try {

            // keep original addeddatetime
            compost.setAddeddatetime(extCompost.getAddeddatetime());
            compost.setUpdateddatetime(LocalDateTime.now());

//            compost.setUser(getLoggedUser(authentication));

            compostDao.save(compost);
            return "OK";

        } catch (Exception e) {
            System.err.println("Compost update error: " + e.getMessage());

            String msg = e.getMessage();
            if (msg != null && msg.contains("name_UNIQUE")) {
                return "Compost name already exists";
            }
            if (msg != null && msg.contains("ingredient_UNIQUE")) {
                return "Ingredient already exists";
            }

            return "Something went wrong. Please try again.";
        }
    }


    @DeleteMapping("/compost/compostlist/{id}")
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
        Compost existingCompost = compostDao.findByIdAndDeleteddatetimeIsNull(id);
        if (existingCompost == null) {
            return "Compost delete not completed: Compost not available";
        }
        try{
            //soft delete
            existingCompost.setDeleteddatetime(LocalDateTime.now());
            compostDao.save(existingCompost);
            return "OK";

        } catch (Exception e) {
            return "Compost delete not completed";
        }
    }


    //======CRUD======
    //================
}