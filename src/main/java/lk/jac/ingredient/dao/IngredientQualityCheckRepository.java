package lk.jac.ingredient.dao;

import lk.jac.common.SuggestionStatus;
import lk.jac.ingredient.entity.IngredientQualityCheck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface IngredientQualityCheckRepository extends JpaRepository<IngredientQualityCheck,Integer> {
    @Query("SELECT COUNT(i) FROM IngredientQualityCheck i " +
            "WHERE YEAR(i.createddatetime) = :year AND MONTH(i.createddatetime) = :month")
    Integer countByYearAndMonth(@Param("year") int year, @Param("month") int month);

    @Query("SELECT i FROM IngredientQualityCheck i WHERE i.grningredient.id = :grnId")
    IngredientQualityCheck findByGrnIngredientsId(@Param("grnId") Integer grnId);

    @Query("SELECT q FROM IngredientQualityCheck q " +
            "LEFT JOIN FETCH q.ingredientQualityCheckItems i " +
            "LEFT JOIN FETCH i.grnIngredientsItem gi " +
            "LEFT JOIN FETCH gi.purchaseOrderItem poi " +
            "LEFT JOIN FETCH poi.ingredient " +
            "WHERE q.id = :id")
    IngredientQualityCheck findByIdWithItems(@Param("id") Integer id);

    long countByQualitystatus(SuggestionStatus qualitystatus);
}
