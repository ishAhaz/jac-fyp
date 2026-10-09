package lk.jac.logistics.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lk.jac.compost.entity.CompostSale;
import lk.jac.payment.entity.Payment;
import lk.jac.payment.entity.PaymentStatus;
import lk.jac.supermarket.entity.SupermarketOrder;
import lk.jac.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "delivery")

@Data
@AllArgsConstructor //allargument constructor
@NoArgsConstructor //empty constructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Delivery {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;


    private LocalDate deliverdate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus paymentstatus;


    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeliveryStatus deliverystatus;




   @ManyToOne
   @JoinColumn(name = "payment_id", referencedColumnName = "id")
   private Payment payment;

    @ManyToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

@ManyToOne
@JoinColumn(name ="supermarketorder_id", referencedColumnName = "id")
private SupermarketOrder supermarketorder;

@ManyToOne
@JoinColumn(name = "compostsale_id", referencedColumnName = "id")
private CompostSale compostSale;


    private LocalDateTime addeddatetime;
    private LocalDateTime updateddatetime;

    private String deliverynumber;

    private String deliveryaddress;







}
