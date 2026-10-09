package lk.jac.logistics.dao;

import lk.jac.logistics.entity.Delivery;
import lk.jac.payment.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface DeliveryRepository extends JpaRepository<Delivery,Integer> {
    @Query("SELECT d FROM Delivery d WHERE d.addeddatetime IS NOT NULL")
    List<Delivery> getSelectedDeliveryData();

    Delivery findByPayment(Payment payment);
}
