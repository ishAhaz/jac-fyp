package lk.jac.ingredient.dao;

import lk.jac.common.Grade;
import lk.jac.ingredient.entity.IngredientInventoryTransaction;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface IngredientInventoryTransactionRepository extends JpaRepository<IngredientInventoryTransaction, Integer> {

    @Query("SELECT t FROM IngredientInventoryTransaction t " +
            "WHERE t.ingredient.id = :ingredientId AND t.grade = :grade " +
            "ORDER BY t.transactiondatetime DESC")
    List<IngredientInventoryTransaction> findByIngredientIdAndGrade(@Param("ingredientId") Integer ingredientId, @Param("grade") Grade grade);

    @Query("SELECT t FROM IngredientInventoryTransaction  t WHERE t.sourceQualityCheckItem.id = :itemId")
    IngredientInventoryTransaction findBySourceQualityCheckItemId(@Param("itemId") Integer itemId);

    List<IngredientInventoryTransaction> findBySourceCompostSaleItemId(Integer compostSaleItemId);

    boolean existsBySourceCompostSaleItemIdAndIngredientId(Integer compostSaleItemId, Integer ingredientId);
}