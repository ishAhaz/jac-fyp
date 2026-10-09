package lk.jac.compost.dao;

import lk.jac.compost.entity.CompostReturn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CompostReturnRepository extends JpaRepository<CompostReturn, Integer> {


    @Query("SELECT cr FROM CompostReturn cr WHERE cr.deleteddatetime IS NULL")
    List<CompostReturn> getSelectedCompostReturnData();

    CompostReturn findByIdAndDeleteddatetimeIsNull(int comrid);

    @Query("SELECT COUNT(c) FROM CompostReturn c WHERE YEAR(c.addeddatetime) = :year AND MONTH(c.addeddatetime) = :month")
    Integer countByYearAndMonth(int year, int month);
}
