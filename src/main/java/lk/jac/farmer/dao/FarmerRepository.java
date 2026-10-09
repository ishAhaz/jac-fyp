package lk.jac.farmer.dao;

import lk.jac.common.Status;
import lk.jac.farmer.dto.DistrictCountDTO;
import lk.jac.farmer.entity.Farmer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface FarmerRepository extends JpaRepository<Farmer, Integer> {
    Farmer findByIdAndDeleteddatetimeIsNull(int fid);

    //table
    @Query("SELECT DISTINCT f FROM Farmer f " +
            "LEFT JOIN FETCH f.crops " +
            "WHERE f.deleteddatetime IS NULL")
    List<Farmer> getSelectedFarmerData();


    //duplicate
    Farmer findByNicAndDeleteddatetimeIsNull(String nic);

    Farmer findByEmailAndDeleteddatetimeIsNull(String email);

    Farmer findByMobilenoAndDeleteddatetimeIsNull(String mobileno);

    //ID
    @Query("SELECT COUNT(f) FROM Farmer f WHERE YEAR(f.addeddatetime) = :year AND MONTH(f.addeddatetime) = :month")
    Integer countByYearAndMonth(int year, int month);

   //to the dashboard
    Long countByDeleteddatetimeIsNull();

    //farmer report
    long countByStatusAndDeleteddatetimeIsNull(Status status);

    @Query("SELECT COUNT(f) FROM Farmer f WHERE f.deleteddatetime IS NULL " +
            "AND f.addeddatetime >= :startOfMonth")
    long countNewThisMonth(@Param("startOfMonth") LocalDateTime startOfMonth);

    @Query("SELECT new lk.jac.farmer.dto.DistrictCountDTO(f.district, COUNT(f)) " +
            "FROM Farmer f WHERE f.deleteddatetime IS NULL " +
            "GROUP BY f.district ORDER BY COUNT(f) DESC")
    List<DistrictCountDTO> countFarmersByDistrict();

    List<Farmer> findAllByDeleteddatetimeIsNull();


    @Query("SELECT f.number FROM Farmer f ORDER BY f.id DESC LIMIT 1")
    String getLastRegistrationNo();
    List<Farmer> findByCompostTrueAndDeleteddatetimeIsNull();

}


