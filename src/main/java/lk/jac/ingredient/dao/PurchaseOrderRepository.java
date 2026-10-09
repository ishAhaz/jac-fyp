package lk.jac.ingredient.dao;

import lk.jac.common.OrderStatus;
import lk.jac.ingredient.entity.PurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Integer> {

    // Table — exclude soft-deleted
    @Query("SELECT p FROM PurchaseOrder p WHERE p.deleteddatetime IS NULL")
    List<PurchaseOrder> getSelectedPurchaseOrders();

    // Edit — load with items
    @Query("SELECT p FROM PurchaseOrder p " +
            "LEFT JOIN FETCH p.purchaseOrderItems i " +
            "WHERE p.id = :id AND p.deleteddatetime IS NULL")
    PurchaseOrder findByIdWithItems(@Param("id") Integer id);

    // Simple find
    PurchaseOrder findByIdAndDeleteddatetimeIsNull(Integer id);

    // PO ID generation
    @Query("SELECT COUNT(p) FROM PurchaseOrder p " +
            "WHERE YEAR(p.createddatetime) = :year " +
            "AND MONTH(p.createddatetime) = :month")
    Integer countByYearAndMonth(@Param("year") int year, @Param("month") int month);
    long countByPostatusAndDeleteddatetimeIsNull(OrderStatus postatus);
}