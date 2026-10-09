package lk.jac.crop.dao;

import lk.jac.crop.entity.CropPurchaseItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CropPurchaseItemRepository extends JpaRepository<CropPurchaseItem, Integer> {
    // Load all items for a PO
    @Query("SELECT i FROM CropPurchaseItem i WHERE i.cropPurchase.id = :poId")
    List<CropPurchaseItem> findByCropPurchaseId(@Param("poId") Integer poId);
}
