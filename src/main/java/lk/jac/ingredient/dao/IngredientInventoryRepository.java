package lk.jac.ingredient.dao;

import lk.jac.common.Grade;
import lk.jac.ingredient.entity.IngredientInventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface IngredientInventoryRepository extends JpaRepository<IngredientInventory, Integer> {

    @Query("SELECT i FROM IngredientInventory i")
    List<IngredientInventory> getSelectedInventory();

    @Query("SELECT i FROM IngredientInventory i WHERE i.ingredient.id = :ingredientId AND i.grade = :grade")
    IngredientInventory findByIngredientIdAndGrade(@Param("ingredientId") Integer ingredientId, @Param("grade") Grade grade);


    //for reports

    long count();
}