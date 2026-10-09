package lk.jac.supermarket.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lk.jac.common.SaleStatus;

import lk.jac.user.entity.User;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "supermarketorder")

@Data
@AllArgsConstructor //allargument constructor
@NoArgsConstructor //empty constructor
@ToString(exclude = "supermarketOrderItems")
@EqualsAndHashCode(exclude = "supermarketOrderItems")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SupermarketOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;


    private double totalamount;

    @ManyToOne
    @JoinColumn(name = "supermarket_id", referencedColumnName = "id")
    private Supermarket supermarket;

    private LocalDate deliverydate;

    private String number;

    @ManyToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

   @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SaleStatus orderstatus;
   //ENUM('Pending', 'Confirmed', 'Delivered', 'Cancelled', 'AwaitingPayment', 'PaymentSubmitted', 'PaymentVerified', 'CancelledNoPayment')





    private LocalDateTime addeddatetime;
    private LocalDateTime updateddatetime;
    private LocalDateTime deleteddatetime;




    @OneToMany(mappedBy = "supermarketOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("supermarketOrder")
    private List<SupermarketOrderItem> supermarketOrderItems;
}
