package lk.jac.crop.dao;

import lk.jac.crop.entity.CropPurchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CropPurchaseRepository extends JpaRepository<CropPurchase, Integer> {

    // Table — exclude soft-deleted
    @Query("SELECT p FROM CropPurchase p WHERE p.deleteddatetime IS NULL")
    List<CropPurchase> getSelectedCropPurchases();

    // Edit — load with items
    @Query("SELECT p FROM CropPurchase p " +
            "LEFT JOIN FETCH p.cropPurchaseItems i " +
            "WHERE p.id = :id AND p.deleteddatetime IS NULL")
    CropPurchase findByIdWithItems(@Param("id") Integer id);

    // Simple find
    CropPurchase findByIdAndDeleteddatetimeIsNull(Integer id);

    // PO ID generation
    @Query("SELECT COUNT(p) FROM CropPurchase p " +
            "WHERE YEAR(p.purchasedatetime) = :year " +
            "AND MONTH(p.purchasedatetime) = :month")
    Integer countByYearAndMonth(@Param("year") int year, @Param("month") int month);

}
