package lk.jac.supermarket.dao;

import lk.jac.common.SaleStatus;
import lk.jac.supermarket.entity.SupermarketOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface SupermarketOrderRepository extends JpaRepository<SupermarketOrder, Integer> {

    SupermarketOrder findByIdAndDeleteddatetimeIsNull(int id);
    List<SupermarketOrder> findByDeleteddatetimeIsNull();

    @Query("SELECT o FROM SupermarketOrder o WHERE o.deleteddatetime IS NULL ORDER BY o.id DESC")
    List<SupermarketOrder> getSelectedSupermarketOrderData();

    @Query("SELECT o.number FROM SupermarketOrder o ORDER BY o.id DESC LIMIT 1")
    String getLastRegistrationNo();


    List<SupermarketOrder> findByOrderstatusBeforeAndDeleteddatetimeIsNull(SaleStatus saleStatus, LocalDateTime cutoff);
    @Query("SELECT COUNT(so) FROM SupermarketOrder so " +
            "WHERE YEAR(so.addeddatetime) = :year " +
            "AND MONTH(so.addeddatetime) = :month")
    Integer countByYearAndMonth(int year, int month);

    List<SupermarketOrder> findBySupermarketIdAndDeleteddatetimeIsNullOrderByAddeddatetimeDesc(Integer id);
}