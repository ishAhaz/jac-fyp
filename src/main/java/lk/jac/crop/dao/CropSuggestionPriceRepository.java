package lk.jac.crop.dao;

import lk.jac.crop.entity.CropSuggestionPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CropSuggestionPriceRepository extends JpaRepository<CropSuggestionPrice, Integer> {
    // Find suggestion for a specific chf — only if that chf is not soft-deleted
    @Query("SELECT s FROM CropSuggestionPrice s WHERE s.crophasfarmer.id = :id " +
            "AND s.crophasfarmer.deleteddatetime IS NULL")
    CropSuggestionPrice findByCropHasFarmerId(@Param("id") Integer id);

    // Table — show all, but only where the linked chf is not soft-deleted
    @Query("SELECT s FROM CropSuggestionPrice s WHERE s.crophasfarmer.deleteddatetime IS NULL")
    List<CropSuggestionPrice> getSelectedCropSuggestionPriceData();


    // Highest approved price for a crop (only Active/approved chf rows count)
    @Query("SELECT MAX(s.farmerprice) FROM CropSuggestionPrice s " +
            "WHERE s.crophasfarmer.cropListManagement.id = :cropId " +
            "AND s.status = 'Approved' " +
            "AND s.crophasfarmer.deleteddatetime IS NULL")
    Double findHighestPriceByCropId(@Param("cropId") Integer cropId);

    //to delete of farmer
    void deleteByCrophasfarmer_Id(Integer cropHasFarmerId);

    @Query("SELECT s FROM CropSuggestionPrice s " +
            "WHERE s.crophasfarmer.cropListManagement.id = :cropId " +
            "AND s.status = 'Pending' " +
            "AND s.crophasfarmer.deleteddatetime IS NULL")
    List<CropSuggestionPrice> findPendingByCropId(@Param("cropId") Integer cropId);
}