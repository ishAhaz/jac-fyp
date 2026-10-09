package lk.jac.grn.dao;

import lk.jac.common.ProcessStatus;
import lk.jac.grn.entity.GrnIngredients;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface GrnIngredientsRepository extends JpaRepository<GrnIngredients, Integer> {

    // Table
    @Query("SELECT g FROM GrnIngredients g")
    List<GrnIngredients> getSelectedGrnIngredientsData();

    // Edit — fetch with items
    @Query("SELECT g FROM GrnIngredients g " +
            "LEFT JOIN FETCH g.grnIngredientsItems i " +
            "LEFT JOIN FETCH i.purchaseOrderItem poi " +
            "LEFT JOIN FETCH poi.ingredient " +
            "WHERE g.id = :id")
    GrnIngredients findByIdWithItems(@Param("id") Integer id);

    // Find by purchase order — to check if GRN already exists
    @Query("SELECT g FROM GrnIngredients g WHERE g.purchaseOrder.id = :poId")
    GrnIngredients findByPurchaseOrderId(@Param("poId") Integer poId);

    // ID generation
    @Query("SELECT COUNT(g) FROM GrnIngredients g " +
            "WHERE YEAR(g.addeddatetime) = :year " +
            "AND MONTH(g.addeddatetime) = :month")
    Integer countByYearAndMonth(@Param("year") int year, @Param("month") int month);
    long countByGrnstatus(ProcessStatus grnstatus);

}