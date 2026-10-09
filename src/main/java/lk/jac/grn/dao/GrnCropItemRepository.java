package lk.jac.grn.dao;

import lk.jac.grn.entity.GrnCropItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface GrnCropItemRepository extends JpaRepository<GrnCropItem, Integer> {
    // Find all items for a GRN
    @Query("SELECT i FROM GrnCropItem i WHERE i.grnCrop.id = :grnId")
    List<GrnCropItem> findByGrnCropId(@Param("grnId") Integer grnId);

}
