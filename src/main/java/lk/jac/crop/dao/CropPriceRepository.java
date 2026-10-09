package lk.jac.crop.dao;

import lk.jac.common.StatusPending;
import lk.jac.crop.entity.CropPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface CropPriceRepository extends JpaRepository<CropPrice, Integer> {

    // Table — show all records (no soft delete filter needed)
    @Query("SELECT ip FROM CropPrice ip")
    List<CropPrice> getSelectedCropPriceData();

    // Find existing active/pending record for an Crop
    @Query("SELECT ip FROM CropPrice ip WHERE ip.crop.id = :cropId")
    List<CropPrice> findAllByCropId(@Param("cropId") Integer cropId);

    // Auto-deactivate all OTHER records for same crop when one goes Active
    @Modifying
    @Transactional
    @Query("UPDATE CropPrice ip SET ip.status = :status WHERE ip.crop.id = :cropId AND ip.id != :excludeId")
    void deactivateOtherRecords(
            @Param("cropId") Integer cropId,
            @Param("excludeId") Integer excludeId,
            @Param("status") StatusPending status
    );

    // ID generation
    @Query("SELECT COUNT(ip) FROM CropPrice ip WHERE YEAR(ip.addeddatetime) = :year AND MONTH(ip.addeddatetime) = :month")
    Integer countByYearAndMonth(@Param("year") int year, @Param("month") int month);

    List<CropPrice> findByStatus(StatusPending statusPending);
}
