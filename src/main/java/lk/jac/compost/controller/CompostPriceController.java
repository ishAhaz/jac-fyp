package lk.jac.compost.controller;

import lk.jac.common.CurrentUserUtil;
import lk.jac.common.StatusPending;
import lk.jac.common.SubUnits;
import lk.jac.compost.dao.CompostHasIngredientRepository;
import lk.jac.compost.dao.CompostPriceRepository;
import lk.jac.compost.dao.CompostRepository;
import lk.jac.compost.entity.Compost;
import lk.jac.compost.entity.CompostHasIngredient;
import lk.jac.compost.entity.CompostPrice;
import lk.jac.ingredient.dao.IngredientPriceRepository;
import lk.jac.ingredient.entity.IngredientPrice;
import lk.jac.privilege.checker.PrivilegeChecker;
import lk.jac.privilege.dao.PrivilegeRepository;
import lk.jac.user.dao.UserRepository;
import lk.jac.user.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.ModelAndView;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
public class CompostPriceController {

    @Autowired
    private CompostPriceRepository compostPriceDao;

    @Autowired
    private CompostRepository compostDao;

    @Autowired
    private CompostHasIngredientRepository compostHasIngredientDao;

    @Autowired
    private IngredientPriceRepository ingredientPriceDao;

    @Autowired
    private PrivilegeRepository privilegeDao;

    @Autowired
    private UserRepository userDao;

    private static final String MODULE_NAME = "COMPOST_PRICE";

    @GetMapping("/compost/compostprice")
    public ModelAndView compostPricePage() {
        ModelAndView compostPriceUI = new ModelAndView();
        compostPriceUI.setViewName("compostprice.html");
        return compostPriceUI;
    }

    //=====links=========
    //===================
    @GetMapping(value = "/compost/compostprice/alldata/selected", produces = "application/json")
    public List<CompostPrice> getSelectedCompostPriceData() {
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canSelect()) {
            return List.of();
        }
        // NOTE: repository query must also filter cp.compost.deleteddatetime IS NULL
        // (see CompostPriceRepository.getSelectedCompostPriceData) so records
        // belonging to a soft-deleted Compost don't leak into this list.
        return compostPriceDao.getSelectedCompostPriceData();
    }

    @GetMapping(value = "/compost/compostprice/byid/{compid}", produces = "application/json")
    public CompostPrice getCompostPriceById(@PathVariable("compid") int compid) {
        return compostPriceDao.findByIdAndDeleteddatetimeIsNull(compid);
    }

    // ============================================================
    // Ingredient cost lookup — used by the modal when Compost is
    // selected, to auto-fill "Total Price / Unit" (the suggested
    // price before markup).
    // ============================================================
    @GetMapping(value = "/compost/ingredientcost/{compostId}", produces = "application/json")
    public Map<String, Object> getIngredientCostForCompost(@PathVariable("compostId") int compostId) {
        Compost compost = compostDao.findByIdAndDeleteddatetimeIsNull(compostId);

        double total = calculateSuggestedTotalPrice(compost);

        Map<String, Object> result = new HashMap<>();
        result.put("ingredientcostperkg", total);
        result.put("totalprice", total);
        return result;
    }

    // Sums qtyperunit * active ingredient price across all
    // ingredients used by this compost.
    // ASSUMPTION: qtyperunit and IngredientPrice.realprice are in
    // the same unit basis (e.g. both per kg). If qtyunit varies
    // (g vs kg etc.) this needs a conversion step first.
    private double calculateSuggestedTotalPrice(Compost compost) {
        double total = 0.0;

        if (compost == null || compost.getIngredients() == null) {
            return total;
        }

        for (CompostHasIngredient chi : compost.getIngredients()) {
            IngredientPrice activePrice = ingredientPriceDao.findByIngredient_IdAndStatus(
                    chi.getIngredient().getId(), StatusPending.Active
            );

            if (activePrice == null || activePrice.getRealprice() == null || chi.getQtyperunit() == null) {
                continue;
            }

            double normalizedQty = normalizeToBaseUnit(chi.getQtyperunit(), chi.getQtyunit());
            total += normalizedQty * activePrice.getRealprice();
        }

        return total;
    }

    // Converts qtyperunit into kg/L basis, matching how realprice is priced
    // (realprice is assumed to be Rs. per kg or Rs. per L — same 1:1 basis
    // used elsewhere in JAC, e.g. water excluded from ingredient counts).
    private double normalizeToBaseUnit(double qty, SubUnits unit) {
        return switch (unit) {
            case g, ml -> qty / 1000.0;
        };
    }

    // ============================================================
    // Auto-trigger: call this from the IngredientPrice approval
    // endpoint (when an ingredient's price flips to Active) so
    // every compost using that ingredient gets a fresh Pending
    // CompostPrice record reflecting the new suggested cost.
    // ============================================================
    @PostMapping(value = "/compost/compostprice/regenerate-for-ingredient/{ingredientId}", produces = "application/json")
    public String regenerateForIngredient(@PathVariable("ingredientId") int ingredientId) {
        List<CompostHasIngredient> usages = compostHasIngredientDao.findByIngredient_Id(ingredientId);

        Set<Compost> affectedComposts = usages.stream()
                .map(CompostHasIngredient::getCompost)
                .filter(compost -> compost != null && compost.getDeleteddatetime() == null)
                .collect(Collectors.toSet());

        String username = CurrentUserUtil.getCurrentUsername();
        User currentUser = userDao.findByUsername(username);

        for (Compost compost : affectedComposts) {
            double suggestedTotal = calculateSuggestedTotalPrice(compost);
            createPendingPriceRecord(compost, suggestedTotal, currentUser);
        }

        return "OK";
    }

    // Ensures a compost has at most ONE live Pending record at a time.
    // If a Pending record already exists for this compost, it gets
    // soft-deleted (drops out of the price list) before the fresh
    // snapshot is inserted. Active/Inactive rows are untouched here —
    // that lifecycle is handled separately in updateData().
    private CompostPrice createPendingPriceRecord(Compost compost, double totalPrice, User user) {
        CompostPrice existingPending = compostPriceDao.findByCompost_IdAndStatuspendingAndDeleteddatetimeIsNull(
                compost.getId(), StatusPending.Pending
        );

        if (existingPending != null) {
            existingPending.setDeleteddatetime(LocalDateTime.now());
            compostPriceDao.save(existingPending);
        }

        CompostPrice pending = new CompostPrice();
        pending.setCompost(compost);
        pending.setTotalprice(totalPrice);
        pending.setMarkupperkg(0.0);
        pending.setSaleprice(totalPrice); // markup 0 at creation
        pending.setStatuspending(StatusPending.Pending);
        pending.setAddeddatetime(LocalDateTime.now());
        pending.setUser(user);
        pending.setPriceid(generatePriceId());

        return compostPriceDao.save(pending);
    }

    private String generatePriceId() {
        String yy = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yy"));
        String mm = LocalDateTime.now().format(DateTimeFormatter.ofPattern("MM"));
        long seq = compostPriceDao.countAllForIdGeneration() + 1;
        return "CP" + yy + mm + String.format("%04d", seq);
    }

    //=====links=========
    //===================

    // ============================================================
    // Approval flow lives here:
    // - saleprice is always recalculated server-side as
    //   totalprice + markupperkg (never trust the client's saleprice)
    // - "approvingNow" is captured BEFORE mutating the existing
    //   record's status, to avoid the previousStatus-after-mutation
    //   bug seen in the ingredient PO/GRN flow.
    // - When approvingNow is true, whatever record currently holds
    //   Active status for this compost gets flipped to Inactive.
    // ============================================================
    @PutMapping("/compost/compostprice/update")
    public String updateData(@RequestBody CompostPrice compostPrice) {
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canUpdate()) {
            return "Access denied: insufficient privilege";
        }

        CompostPrice existing = compostPriceDao.findByIdAndDeleteddatetimeIsNull(compostPrice.getId());
        if (existing == null) {
            return "Record not found";
        }

        boolean approvingNow = compostPrice.getStatuspending() == StatusPending.Active
                && existing.getStatuspending() != StatusPending.Active;

        existing.setMarkupperkg(compostPrice.getMarkupperkg());
        existing.setSaleprice(existing.getTotalprice() + compostPrice.getMarkupperkg());
        existing.setUser(compostPrice.getUser());
        existing.setUpdateddatetime(LocalDateTime.now());
        existing.setStatuspending(compostPrice.getStatuspending());

        if (approvingNow) {
            CompostPrice currentActive = compostPriceDao.findByCompost_IdAndStatuspendingAndDeleteddatetimeIsNull(
                    existing.getCompost().getId(), StatusPending.Active
            );

            if (currentActive != null && !currentActive.getId().equals(existing.getId())) {
                currentActive.setStatuspending(StatusPending.Inactive);
                currentActive.setUpdateddatetime(LocalDateTime.now());
                compostPriceDao.save(currentActive);
            }
        }

        compostPriceDao.save(existing);
        return "OK";
    }

}