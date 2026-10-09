package lk.jac.ingredient.dao;

import lk.jac.ingredient.entity.IngredientPrice;
import lk.jac.common.StatusPending;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface IngredientPriceRepository extends JpaRepository<IngredientPrice, Integer> {

    // Table — show all records (no soft delete filter needed)
    @Query("SELECT ip FROM IngredientPrice ip")
    List<IngredientPrice> getSelectedIngredientPriceData();

    // Find existing active/pending record for an ingredient
    @Query("SELECT ip FROM IngredientPrice ip WHERE ip.ingredient.id = :ingredientId")
    List<IngredientPrice> findAllByIngredientId(@Param("ingredientId") Integer ingredientId);

    // Auto-deactivate all OTHER records for same ingredient when one goes Active
    @Modifying
    @Transactional
    @Query("UPDATE IngredientPrice ip SET ip.status = :status WHERE ip.ingredient.id = :ingredientId AND ip.id != :excludeId")
    void deactivateOtherRecords(
            @Param("ingredientId") Integer ingredientId,
            @Param("excludeId") Integer excludeId,
            @Param("status") StatusPending status
    );

    // ID generation
    @Query("SELECT COUNT(ip) FROM IngredientPrice ip WHERE YEAR(ip.addeddatetime) = :year AND MONTH(ip.addeddatetime) = :month")
    Integer countByYearAndMonth(@Param("year") int year, @Param("month") int month);

    //Compost price
    IngredientPrice findByIngredient_IdAndStatus(Integer ingredientId, StatusPending status);
}