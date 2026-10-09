package lk.jac.grn.dao;

import lk.jac.grn.entity.GrnIngredientsItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface GrnIngredientsItemRepository extends JpaRepository<GrnIngredientsItem, Integer> {

    // Find all items for a GRN
    @Query("SELECT i FROM GrnIngredientsItem i WHERE i.grnIngredients.id = :grnId")
    List<GrnIngredientsItem> findByGrnIngredientsId(@Param("grnId") Integer grnId);
}