package lk.jac.payment.dao;

import lk.jac.payment.entity.ExpensePayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ExpensePaymentRepository extends JpaRepository<ExpensePayment, Integer> {

    ExpensePayment findByIdAndDeleteddatetimeIsNull(int id);

    List<ExpensePayment> findByDeleteddatetimeIsNull();

    @Query("SELECT e FROM ExpensePayment e WHERE e.deleteddatetime IS NULL ORDER BY e.addeddatetime DESC")
    List<ExpensePayment> getSelectedExpensePaymentData();

    @Query("SELECT COUNT(p) FROM ExpensePayment p " +
            "WHERE YEAR(p.addeddatetime) = :year " +
            "AND MONTH(p.addeddatetime) = :month")
    Integer countByYearAndMonth(int year, int month);
}