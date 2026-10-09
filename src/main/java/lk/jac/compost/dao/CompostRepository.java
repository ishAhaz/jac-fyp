package lk.jac.compost.dao;

import lk.jac.compost.entity.Compost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CompostRepository extends JpaRepository<Compost, Integer> {

    Compost findByIdAndDeleteddatetimeIsNull(int comid);

    Compost findByNameAndDeleteddatetimeIsNull(String name);




    @Query(value = "SELECT number FROM compost ORDER BY id DESC LIMIT 1", nativeQuery = true)
    String getLastRegistrationNo();


    @Query("SELECT DISTINCT c FROM Compost c " +
            "LEFT JOIN FETCH c.crops " +
            "LEFT JOIN FETCH c.ingredients " +
            "JOIN FETCH c.user u " +
            "WHERE c.deleteddatetime IS NULL")
    List<Compost> getSelectedCompostData();

    // uses ci.ingredient.id because ingredients is now List<CompostIngredient>
    @Query("SELECT DISTINCT c FROM Compost c " +
            "JOIN c.ingredients ci " +
            "WHERE ci.ingredient.id IN :ingredientIds " +
            "AND c.deleteddatetime IS NULL")
    List<Compost> findCompostsWithIngredients(@Param("ingredientIds") List<Integer> ingredientIds);


   //foe farmers
    List<Compost> findByDeleteddatetimeIsNull();
}