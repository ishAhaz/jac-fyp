package lk.jac.payment.dao;

import lk.jac.payment.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Integer> {

    // ── Soft-delete-aware lookups (same pattern used across the app) ──
    Payment findByIdAndDeleteddatetimeIsNull(int id);

    List<Payment> findByDeleteddatetimeIsNull();

    // ── Main table listing ──
    // NOTE: adjust ordering/fields to match however ExpensePaymentRepository's
    // equivalent getSelectedExpensePaymentData() is actually written — this
    // mirrors the same "not soft-deleted, most recent first" shape.
    @Query("SELECT p FROM Payment p WHERE p.deleteddatetime IS NULL ORDER BY p.paymentdatetime DESC")
    List<Payment> getSelectedPaymentData();

    // ── Sequence counter for PMT+YY+MM+#### number generation ──
    // Counts existing (including soft-deleted) records created in the
    // given year/month so the sequence never reuses a number, mirroring
    // PurchaseOrderRepository.countByYearAndMonth(...) / the equivalent
    // method already used by ExpensePaymentRepository.
    @Query("SELECT COUNT(p) FROM Payment p WHERE YEAR(p.paymentdatetime) = :year AND MONTH(p.paymentdatetime) = :month")
    Integer countByYearAndMonth(@Param("year") int year, @Param("month") int month);


    Payment findBySupermarketOrderId(Integer supermarketOrderId);

    Payment findByCompostsaleId(Integer compostsaleId);

}