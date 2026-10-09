package lk.jac.crop.dao;

import lk.jac.crop.entity.CropQualityCheck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CropQualityCheckRepository extends JpaRepository<CropQualityCheck, Integer> {
    @Query("SELECT COUNT(i) FROM CropQualityCheck i " +
            "WHERE YEAR(i.createddatetime) = :year AND MONTH(i.createddatetime) = :month")
    Integer countByYearAndMonth(@Param("year") int year, @Param("month") int month);

    @Query("SELECT i FROM CropQualityCheck i WHERE i.grncrop.id = :grnId")
    CropQualityCheck findByGrnCropsId(@Param("grnId") Integer grnId);

    @Query("SELECT q FROM CropQualityCheck q " +
            "LEFT JOIN FETCH q.cropQualityCheckItems i " +
            "LEFT JOIN FETCH i.grnItemCrop gi " +
            "LEFT JOIN FETCH gi.cropPurchaseItem poi " +
            "LEFT JOIN FETCH poi.crop " +
            "WHERE q.id = :id")
    CropQualityCheck findByIdWithItems(@Param("id") Integer id);

}
