package lk.jac.farmer.dao;

import lk.jac.farmer.dto.CropCountDTO;
import lk.jac.farmer.entity.CropHasFarmer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CropHasFarmerRepository extends JpaRepository<CropHasFarmer,Integer> {
    @Query("SELECT s FROM CropHasFarmer s WHERE s.farmer.id = :farmerId AND s.deleteddatetime IS NULL")
    List<CropHasFarmer> findByFarmerId(@Param("farmerId") Integer farmerId);


    //to purchase order
    @Query("SELECT s FROM CropHasFarmer s " +
            "WHERE s.farmer.id = :farmerId " +
            "AND s.status = 'Active' " +
            "AND s.deleteddatetime IS NULL")
    List<CropHasFarmer> findActiveByFarmerId(@Param("farmerId") Integer farmerId);

    //to farmer report
    @Query("SELECT new lk.jac.farmer.dto.CropCountDTO(chf.cropListManagement.name, COUNT(chf)) " +
            "FROM CropHasFarmer chf " +
            "WHERE chf.deleteddatetime IS NULL " +
            "GROUP BY chf.cropListManagement.name " +
            "ORDER BY COUNT(chf) DESC")
    List<CropCountDTO> countFarmersByCrop();

}
