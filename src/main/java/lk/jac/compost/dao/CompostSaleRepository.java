package lk.jac.compost.dao;

import lk.jac.common.SaleStatus;
import lk.jac.compost.entity.CompostSale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface CompostSaleRepository extends JpaRepository<CompostSale,Integer> {
    CompostSale findByIdAndDeleteddatetimeIsNull(int comsid);
    List<CompostSale> findByDeleteddatetimeIsNull();


    @Query("SELECT cs FROM CompostSale cs WHERE cs.deleteddatetime IS NULL")
    List<CompostSale> getSelectedCompostSaleData();


    @Query("SELECT o.compostsalenumber FROM CompostSale o ORDER BY o.id DESC LIMIT 1")
    String getLastRegistrationNo();



    @Query("SELECT COUNT(c) FROM CompostSale c WHERE YEAR(c.addeddatetime) = :year AND MONTH(c.addeddatetime) = :month")
    Integer countByYearAndMonth(int year, int month);

    List<CompostSale> findByComsalestatusBeforeAndDeleteddatetimeIsNull(
            SaleStatus status, LocalDateTime cutoff);


    List<CompostSale> findByFarmerIdAndDeleteddatetimeIsNullOrderByAddeddatetimeDesc(Integer id);
}
