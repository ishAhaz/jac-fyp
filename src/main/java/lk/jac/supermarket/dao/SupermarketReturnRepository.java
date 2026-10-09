package lk.jac.supermarket.dao;

import lk.jac.supermarket.entity.SupermarketReturn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface SupermarketReturnRepository extends JpaRepository<SupermarketReturn,Integer> {
    @Query("SELECT cr FROM SupermarketReturn cr WHERE cr.deleteddatetime IS NULL")
    List<SupermarketReturn> getSelectedSupermarketReturnData();

    SupermarketReturn findByIdAndDeleteddatetimeIsNull(int comrid);

    @Query("SELECT COUNT(c) FROM SupermarketReturn c WHERE YEAR(c.addeddatetime) = :year AND MONTH(c.addeddatetime) = :month")
    Integer countByYearAndMonth(int year, int month);
}
