package lk.jac.ingredient.controller;

import lk.jac.common.CurrentUserUtil;
import lk.jac.common.Grade;
import lk.jac.common.SubUnits;
import lk.jac.common.TransactionType;
import lk.jac.compost.entity.Compost;
import lk.jac.compost.entity.CompostHasIngredient;
import lk.jac.compost.entity.CompostSale;
import lk.jac.compost.entity.CompostSaleItem;
import lk.jac.ingredient.dao.IngredientInventoryRepository;
import lk.jac.ingredient.dao.IngredientInventoryTransactionRepository;
import lk.jac.ingredient.dao.IngredientRepository;
import lk.jac.ingredient.entity.*;
import lk.jac.ingredient.exception.InsufficientStockException;
import lk.jac.user.dao.UserRepository;
import lk.jac.user.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.ModelAndView;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@RestController
public class IngredientInventoryController {

    @Autowired
    private IngredientInventoryRepository ingredientInventoryDao;

    @Autowired
    private IngredientInventoryTransactionRepository ingredientInventoryTransactionDao;

    @Autowired
    private IngredientRepository ingredientDao;

    @Autowired
    private UserRepository userDao;


    @GetMapping("/ingredient/ingredientinventory")
    public ModelAndView ingredientInventoryPage() {
        ModelAndView ingredientInventoryUI = new ModelAndView();
        ingredientInventoryUI.setViewName("ingredientinventory.html");
        return ingredientInventoryUI;
    }



    @GetMapping(value = "/ingredient/ingredientinventory/alldata/selected", produces = "application/json")
    public List<IngredientInventory> getAll() {

        List<Ingredient> allIngredients = ingredientDao.findAll();
        List<IngredientInventory> fullList = new ArrayList<>();

        for (Ingredient ingredient : allIngredients) {
            for (Grade grade : Grade.values()) {
                IngredientInventory existing =
                        ingredientInventoryDao.findByIngredientIdAndGrade(ingredient.getId(), grade);

                if (existing != null) {
                    fullList.add(existing);
                } else {
                    // No stock movement yet for this ingredient+grade — show as zero, not missing
                    IngredientInventory placeholder = new IngredientInventory();
                    placeholder.setIngredient(ingredient);
                    placeholder.setGrade(grade);
                    placeholder.setCurrentquantity(0.0);
                    placeholder.setLastupdatetime(null);
                    fullList.add(placeholder);
                }
            }
        }

        return fullList;
    }

    @GetMapping(value = "/ingredient/ingredientinventory/transactions/{ingredientId}/{grade}", produces = "application/json")
    public List<IngredientInventoryTransaction> getTransactions(@PathVariable Integer ingredientId, @PathVariable Grade grade) {
        return ingredientInventoryTransactionDao.findByIngredientIdAndGrade(ingredientId, grade);
    }

    // Called by IngredientQualityCheckController when a check transitions to Approved.
    @Transactional
    public void createInventoryFromQualityCheck(IngredientQualityCheck qualityCheck) {
        if (qualityCheck.getIngredientQualityCheckItems() == null) return;

        String username = CurrentUserUtil.getCurrentUsername();
        User currentUser = userDao.findByUsernameAndDeleteddatetimeIsNull(username);

        for (IngredientQualityCheckItem item : qualityCheck.getIngredientQualityCheckItems()) {

            if (ingredientInventoryTransactionDao.findBySourceQualityCheckItemId(item.getId()) != null) continue;

            Ingredient ingredient = item.getGrnIngredientsItem().getPurchaseOrderItem().getIngredient();
            Grade grade = item.getGrade();
            double qty = item.getQuantity() != null ? item.getQuantity() : 0;

            IngredientInventoryTransaction txn = new IngredientInventoryTransaction();
            txn.setIngredient(ingredient);
            txn.setGrade(grade);
            txn.setTransactiontype(TransactionType.IN);
            txn.setQuantity(qty);
            txn.setTransactiondatetime(LocalDateTime.now());
            txn.setSourceQualityCheckItem(item);

            txn.setUser(currentUser);   // ← add this

            ingredientInventoryTransactionDao.save(txn);

            // 2) Update (or create) the running balance for this ingredient+grade
            IngredientInventory balance = ingredientInventoryDao.findByIngredientIdAndGrade(ingredient.getId(), grade);
            if (balance == null) {
                balance = new IngredientInventory();
                balance.setIngredient(ingredient);
                balance.setGrade(grade);
                balance.setCurrentquantity(qty);
            } else {
                balance.setCurrentquantity(balance.getCurrentquantity() + qty);
            }
            balance.setLastupdatetime(LocalDateTime.now());
            ingredientInventoryDao.save(balance);
        }
    }



    public long countOutOfStock() {
        List<IngredientInventory> fullList = getAll();
        return fullList.stream()
                .filter(i -> i.getCurrentquantity() == null || i.getCurrentquantity() <= 0)
                .count();
    }



    // ======== CONSUME (compost sale confirmed) ========
// For each ingredient required by the compost recipe, reduce stock
// cascading A -> B -> C until the required quantity is met.
    @Transactional
    public void reduceInventoryForCompostSale(CompostSale sale) {
        if (sale.getCompostSaleItems() == null) return;

        String username = CurrentUserUtil.getCurrentUsername();
        User currentUser = userDao.findByUsernameAndDeleteddatetimeIsNull(username);

        for (CompostSaleItem item : sale.getCompostSaleItems()) {

            Compost compost = item.getCompost();
            if (compost == null || compost.getIngredients() == null) continue;

            for (CompostHasIngredient recipeLine : compost.getIngredients()) {

                Ingredient ingredient = recipeLine.getIngredient();

                if ("Water".equalsIgnoreCase(ingredient.getName())) continue;

                if (ingredientInventoryTransactionDao
                        .existsBySourceCompostSaleItemIdAndIngredientId(item.getId(), ingredient.getId())) {
                    continue;
                }

                // Recipe quantity is stored per-kg-of-compost in g/ml (SubUnits),
                // but inventory balances are tracked in the ingredient's own
                // stocked unit (Kg/L, per Ingredient.unit) — convert before
                // multiplying by kg of compost sold.
                double qtyPerUnitConverted = toIngredientUnit(recipeLine.getQtyperunit(), recipeLine.getQtyunit());
                double required = qtyPerUnitConverted * item.getQuantity();
                double remaining = required;

                for (Grade grade : new Grade[]{Grade.A, Grade.B, Grade.C}) {
                    if (remaining <= 0) break;

                    IngredientInventory balance =
                            ingredientInventoryDao.findByIngredientIdAndGrade(ingredient.getId(), grade);

                    double available = (balance != null && balance.getCurrentquantity() != null)
                            ? balance.getCurrentquantity() : 0.0;

                    if (available <= 0) continue;

                    double consume = Math.min(available, remaining);

                    IngredientInventoryTransaction txn = new IngredientInventoryTransaction();
                    txn.setIngredient(ingredient);
                    txn.setGrade(grade);
                    txn.setTransactiontype(TransactionType.OUT);
                    txn.setQuantity(consume);
                    txn.setTransactiondatetime(LocalDateTime.now());
                    txn.setSourceCompostSaleItem(item);
                    txn.setUser(currentUser);
                    ingredientInventoryTransactionDao.save(txn);

                    balance.setCurrentquantity(available - consume);
                    balance.setLastupdatetime(LocalDateTime.now());
                    ingredientInventoryDao.save(balance);

                    remaining -= consume;
                }

                if (remaining > 0) {
                    throw new InsufficientStockException(
                            "Insufficient stock for ingredient: " + ingredient.getName()
                                    + " (short by " + remaining + " " + ingredient.getUnit() + ")"
                    );
                }
            }
        }
    }

    // Converts a recipe quantity (grams or millilitres) into the ingredient's
// stocked unit (Kg or L respectively). g and ml both use a 1000 divisor.
    private double toIngredientUnit(double qty, SubUnits recipeUnit) {
        return switch (recipeUnit) {
            case g  -> qty / 1000.0;
            case ml -> qty / 1000.0;
        };
    }


    // ======== RELEASE (compost sale auto-cancelled unpaid) ========
// Reverses whatever was consumed for this sale — re-adds the same
// quantity back to the same grade it was taken from.
    @Transactional
    public void releaseInventoryForCompostSale(CompostSale sale) {
        if (sale.getCompostSaleItems() == null) return;

        String username = CurrentUserUtil.getCurrentUsername();
        User currentUser = userDao.findByUsernameAndDeleteddatetimeIsNull(username);

        for (CompostSaleItem item : sale.getCompostSaleItems()) {

            List<IngredientInventoryTransaction> consumedTxns =
                    ingredientInventoryTransactionDao.findBySourceCompostSaleItemId(item.getId());

            for (IngredientInventoryTransaction consumed : consumedTxns) {
                if (consumed.getTransactiontype() != TransactionType.OUT) continue;

                IngredientInventoryTransaction reversal = new IngredientInventoryTransaction();
                reversal.setIngredient(consumed.getIngredient());
                reversal.setGrade(consumed.getGrade());
                reversal.setTransactiontype(TransactionType.IN);
                reversal.setQuantity(consumed.getQuantity());
                reversal.setTransactiondatetime(LocalDateTime.now());
                reversal.setSourceCompostSaleItem(item);
                reversal.setUser(currentUser);
                ingredientInventoryTransactionDao.save(reversal);

                IngredientInventory balance = ingredientInventoryDao
                        .findByIngredientIdAndGrade(consumed.getIngredient().getId(), consumed.getGrade());

                if (balance != null) {
                    balance.setCurrentquantity(
                            (balance.getCurrentquantity() != null ? balance.getCurrentquantity() : 0.0)
                                    + consumed.getQuantity()
                    );
                    balance.setLastupdatetime(LocalDateTime.now());
                    ingredientInventoryDao.save(balance);
                }
            }
        }
    }
}