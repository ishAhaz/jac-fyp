package lk.jac.ingredient.dao;

import lk.jac.ingredient.entity.Ingredient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface IngredientRepository extends JpaRepository<Ingredient, Integer> {
    //for compost form
    List<Ingredient> findByDeleteddatetimeIsNull();

    //get data by id
    Ingredient findByIdAndDeleteddatetimeIsNull(int ingid);

    //duplicate and existing
    Ingredient findByNameAndDeleteddatetimeIsNull(String name);

   //for ID
    @Query("SELECT i.ingredientid FROM Ingredient i WHERE i.deleteddatetime IS NULL ORDER BY i.id DESC LIMIT 1")
    String getLastRegistrationNo();

    //for table
    @Query("SELECT i FROM Ingredient i WHERE i.deleteddatetime IS NULL")
    List<Ingredient> getSelectedIngredientData();

    //without water
    @Query("SELECT i FROM Ingredient i WHERE i.deleteddatetime IS NULL AND i.name <> 'Water'")
    List<Ingredient> getSelectedIngredientDataExcludingWater();

    //for report

    @Query("SELECT COUNT(i) FROM Ingredient i WHERE i.deleteddatetime IS NULL AND i.name <> 'Water'")
    long countExcludingWater();

// same pattern for the other 3
}
