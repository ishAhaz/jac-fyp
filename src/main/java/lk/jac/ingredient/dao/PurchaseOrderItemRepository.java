package lk.jac.ingredient.dao;

import lk.jac.ingredient.entity.PurchaseOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PurchaseOrderItemRepository extends JpaRepository<PurchaseOrderItem, Integer> {

    // Load all items for a PO
    @Query("SELECT i FROM PurchaseOrderItem i WHERE i.purchaseOrder.id = :poId")
    List<PurchaseOrderItem> findByPurchaseOrderId(@Param("poId") Integer poId);
}