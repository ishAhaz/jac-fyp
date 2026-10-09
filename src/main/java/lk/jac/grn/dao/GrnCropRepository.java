package lk.jac.grn.dao;

import lk.jac.grn.entity.GrnCrop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface GrnCropRepository extends JpaRepository<GrnCrop,Integer> {
    // Table
    @Query("SELECT g FROM GrnCrop g")
    List<GrnCrop> getSelectedGrnCropData();

    // Edit — fetch with items
    @Query("SELECT g FROM GrnCrop g " +
            "LEFT JOIN FETCH g.grnCropItems i " +
            "LEFT JOIN FETCH i.cropPurchaseItem poi " +
            "LEFT JOIN FETCH poi.crop " +
            "WHERE g.id = :id")
    GrnCrop findByIdWithItems(@Param("id") Integer id);

    // Find by purchase order — to check if GRN already exists
    @Query("SELECT g FROM GrnCrop g WHERE g.cropPurchase.id = :poId")
    GrnCrop findByCropPurchaseId(@Param("poId") Integer poId);

    // ID generation
    @Query("SELECT COUNT(g) FROM GrnCrop g " +
            "WHERE YEAR(g.addeddatetime) = :year " +
            "AND MONTH(g.addeddatetime) = :month")
    Integer countByYearAndMonth(@Param("year") int year, @Param("month") int month);


}
