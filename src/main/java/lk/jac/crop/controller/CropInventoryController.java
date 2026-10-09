package lk.jac.crop.controller;

import lk.jac.common.CurrentUserUtil;
import lk.jac.common.Grade;
import lk.jac.common.TransactionType;
import lk.jac.crop.dao.CropInventoryRepository;
import lk.jac.crop.dao.CropInventoryTransactionRepository;
import lk.jac.crop.dao.CropListManagementRepository;
import lk.jac.crop.entity.*;
import lk.jac.crop.exception.InsufficientStockException;
import lk.jac.supermarket.entity.SupermarketOrder;
import lk.jac.supermarket.entity.SupermarketOrderItem;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
public class CropInventoryController {

    @Autowired
    private CropInventoryRepository cropInventoryDao;

    @Autowired
    private CropInventoryTransactionRepository cropInventoryTransactionDao;

    @Autowired
    private CropListManagementRepository cropListManagementDao;

    @Autowired
    private UserRepository userDao;

    @GetMapping("/crop/cropinventory")
    public ModelAndView cropInventoryPage() {
        ModelAndView cropInventoryUI = new ModelAndView();
        cropInventoryUI.setViewName("cropinventory.html");
        return cropInventoryUI;
    }

    @GetMapping(value = "/crop/cropinventory/alldata/selected", produces = "application/json")
    public List<CropInventory> getAll() {

        List<CropListManagement> allCrops = cropListManagementDao.findAll();
        List<CropInventory> fullList = new ArrayList<>();

        for (CropListManagement crop : allCrops) {
            for (Grade grade : Grade.values()) {
                CropInventory existing =
                        cropInventoryDao.findByCropIdAndGrade(crop.getId(), grade);

                if (existing != null) {
                    fullList.add(existing);
                } else {
                    CropInventory placeholder = new CropInventory();
                    placeholder.setCrop(crop);
                    placeholder.setGrade(grade);
                    placeholder.setCurrentquantity(0.0);
                    placeholder.setLastupdatetime(null);
                    fullList.add(placeholder);
                }
            }
        }

        return fullList;
    }

    @GetMapping(value = "/crop/cropinventory/transactions/{cropId}/{grade}", produces = "application/json")
    public List<CropInventoryTransaction> getTransactions(@PathVariable Integer cropId, @PathVariable Grade grade) {
        return cropInventoryTransactionDao.findByCropIdAndGrade(cropId, grade);
    }

    // Called by CropQualityCheckController when a check transitions to Approved.
    @Transactional
    public void createInventoryFromQualityCheck(CropQualityCheck qualityCheck) {
        if (qualityCheck.getCropQualityCheckItems() == null) return;

        String username = CurrentUserUtil.getCurrentUsername();
        User currentUser = userDao.findByUsernameAndDeleteddatetimeIsNull(username);

        for (CropQualityCheckItem item : qualityCheck.getCropQualityCheckItems()) {

            if (cropInventoryTransactionDao.findBySourceQualityCheckItemId(item.getId()) != null) continue;

            CropListManagement crop = item.getGrnItemCrop().getCropPurchaseItem().getCrop();
            Grade grade = item.getGrade();
            double qty = item.getQuantity() != null ? item.getQuantity() : 0;

            CropInventoryTransaction txn = new CropInventoryTransaction();
            txn.setCrop(crop);
            txn.setGrade(grade);
            txn.setTransactiontype(TransactionType.IN);
            txn.setQuantity(qty);
            txn.setTransactiondatetime(LocalDateTime.now());
            txn.setSourceQualityCheckItem(item);
            txn.setUser(currentUser);

            cropInventoryTransactionDao.save(txn);

            CropInventory balance = cropInventoryDao.findByCropIdAndGrade(crop.getId(), grade);
            if (balance == null) {
                balance = new CropInventory();
                balance.setCrop(crop);
                balance.setGrade(grade);
                balance.setCurrentquantity(qty);
            } else {
                balance.setCurrentquantity(balance.getCurrentquantity() + qty);
            }
            balance.setLastupdatetime(LocalDateTime.now());
            cropInventoryDao.save(balance);
        }
    }

    //======SUPERMARKET ORDER RESERVE / RELEASE======
    //  Called by SupermarketOrderController:
    //    - reduceInventoryForSupermarketOrder()  when an order is Confirmed
    //    - releaseInventoryForSupermarketOrder() when a Confirmed order
    //      has gone unpaid for over a day (auto-release job)
    //
    //  Supermarket order items don't carry a Grade — the customer just
    //  orders a crop + quantity. Stock is drawn Grade A first, then B,
    //  then C, splitting across tiers as needed. If total stock across
    //  all three grades can't cover the full order, NOTHING is reserved
    //  (InsufficientStockException rolls the whole transaction back) and
    //  the caller is expected to keep the order at Pending instead of
    //  confirming it.
    //================================================

    @Transactional
    public void reduceInventoryForSupermarketOrder(SupermarketOrder order) {
        if (order.getSupermarketOrderItems() == null) return;

        String username = CurrentUserUtil.getCurrentUsername();
        User currentUser = userDao.findByUsernameAndDeleteddatetimeIsNull(username);

        for (SupermarketOrderItem item : order.getSupermarketOrderItems()) {

            // idempotency guard - don't double-reserve the same item
            List<CropInventoryTransaction> existingOut = cropInventoryTransactionDao
                    .findBySourceSupermarketOrderItemIdAndTransactiontype(item.getId(), TransactionType.OUT);
            if (existingOut != null && !existingOut.isEmpty()) continue;

            CropListManagement crop = item.getCroplistmanagement();
            double remaining = item.getQuantity();

            // Work out how much to draw from each grade (A -> B -> C) without
            // touching the DB yet, so we can bail out cleanly if there isn't
            // enough stock anywhere.
            Map<Grade, Double> draws = new LinkedHashMap<>();
            Map<Grade, CropInventory> balances = new LinkedHashMap<>();

            for (Grade grade : Grade.values()) { // relies on enum declared in order A, B, C
                if (remaining <= 0) break;

                CropInventory balance = cropInventoryDao.findByCropIdAndGrade(crop.getId(), grade);
                double available = (balance != null && balance.getCurrentquantity() != null)
                        ? balance.getCurrentquantity() : 0.0;
                if (available <= 0) continue;

                double take = Math.min(available, remaining);
                draws.put(grade, take);
                balances.put(grade, balance);
                remaining -= take;
            }

            if (remaining > 0) {
                throw new InsufficientStockException(
                        "Not enough stock for crop '" + crop.getName() + "' (short by " + remaining + ")");
            }

            // Commit: one transaction + balance update per grade drawn from
            for (Map.Entry<Grade, Double> draw : draws.entrySet()) {
                Grade grade = draw.getKey();
                double qty = draw.getValue();

                CropInventoryTransaction txn = new CropInventoryTransaction();
                txn.setCrop(crop);
                txn.setGrade(grade);
                txn.setTransactiontype(TransactionType.OUT);
                txn.setQuantity(qty);

                txn.setTransactiondatetime(LocalDateTime.now());
                txn.setSourceSupermarketOrderItem(item);
                txn.setUser(currentUser);
                cropInventoryTransactionDao.save(txn);

                CropInventory balance = balances.get(grade);
                balance.setCurrentquantity(balance.getCurrentquantity() - qty);
                balance.setLastupdatetime(LocalDateTime.now());
                cropInventoryDao.save(balance);
            }
        }
    }

    @Transactional
    public void releaseInventoryForSupermarketOrder(SupermarketOrder order) {
        if (order.getSupermarketOrderItems() == null) return;

        String username = CurrentUserUtil.getCurrentUsername();
        User currentUser = userDao.findByUsernameAndDeleteddatetimeIsNull(username);

        for (SupermarketOrderItem item : order.getSupermarketOrderItems()) {

            List<CropInventoryTransaction> outTxns = cropInventoryTransactionDao
                    .findBySourceSupermarketOrderItemIdAndTransactiontype(item.getId(), TransactionType.OUT);
            if (outTxns == null || outTxns.isEmpty()) continue; // never reserved

            List<CropInventoryTransaction> inTxns = cropInventoryTransactionDao
                    .findBySourceSupermarketOrderItemIdAndTransactiontype(item.getId(), TransactionType.IN);
            if (inTxns != null && !inTxns.isEmpty()) continue; // already released

            CropListManagement crop = item.getCroplistmanagement();

            // Release back exactly what was drawn, per grade, mirroring the
            // original OUT transactions rather than re-running the waterfall.
            for (CropInventoryTransaction out : outTxns) {
                Grade grade = out.getGrade();
                double qty = out.getQuantity();

                CropInventoryTransaction txn = new CropInventoryTransaction();
                txn.setCrop(crop);
                txn.setGrade(grade);
                txn.setTransactiontype(TransactionType.IN);
                txn.setQuantity(qty);
                txn.setTransactiondatetime(LocalDateTime.now());
                txn.setSourceSupermarketOrderItem(item);
                txn.setUser(currentUser);
                cropInventoryTransactionDao.save(txn);

                CropInventory balance = cropInventoryDao.findByCropIdAndGrade(crop.getId(), grade);
                if (balance != null) {
                    balance.setCurrentquantity(balance.getCurrentquantity() + qty);
                    balance.setLastupdatetime(LocalDateTime.now());
                    cropInventoryDao.save(balance);
                }
            }
        }
    }

    public long countOutOfStock() {
        List<CropInventory> fullList = getAll();
        return fullList.stream()
                .filter(i -> i.getCurrentquantity() == null || i.getCurrentquantity() <= 0)
                .count();
    }
}