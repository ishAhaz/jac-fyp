package lk.jac.ingredient.dao;

import lk.jac.ingredient.entity.SuggestionPriceIn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SuggestionPriceInRepository extends JpaRepository<SuggestionPriceIn, Integer> {

    // Find suggestion for a specific SHI — only if that SHI is not soft-deleted
    @Query("SELECT s FROM SuggestionPriceIn s WHERE s.supplierhasingredient.id = :id " +
            "AND s.supplierhasingredient.deleteddatetime IS NULL")
    SuggestionPriceIn findBySupplierhasingredientId(@Param("id") Integer id);

    // Table — show all, but only where the linked SHI is not soft-deleted
    @Query("SELECT s FROM SuggestionPriceIn s WHERE s.supplierhasingredient.deleteddatetime IS NULL")
    List<SuggestionPriceIn> getSelectedSuggestionPriceInData();


    // Highest price for an ingredient, excluding the current SHI row being evaluated
    @Query("SELECT MAX(shi.price) FROM SupplierHasIngredient shi " +
            "WHERE shi.ingredient.id = :ingredientId " +
            "AND shi.status != 'Rejected' " +
            "AND shi.deleteddatetime IS NULL")
    Double findHighestPriceByIngredientId(@Param("ingredientId") Integer ingredientId);
}