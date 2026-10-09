package lk.jac.compost.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lk.jac.common.SaleStatus;
import lk.jac.farmer.entity.Farmer;

import lk.jac.user.entity.User;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "compostsale")

@Data
@AllArgsConstructor //allargument constructor
@NoArgsConstructor //empty constructor
@ToString(exclude = "compostSaleItems")
@EqualsAndHashCode(exclude = "compostSaleItems")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CompostSale {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private Double totalamount;
    @ManyToOne
    @JoinColumn(name = "farmer_id", referencedColumnName = "id")
    private Farmer farmer;

   private LocalDate deliverydate;
   @ManyToOne
   @JoinColumn(name  = "user_id", referencedColumnName = "id")
   private User user;
    private LocalDateTime addeddatetime;
    private LocalDateTime updateddatetime;
    private LocalDateTime deleteddatetime;
   private String compostsalenumber;

   @Enumerated(EnumType.STRING)
   @Column(nullable = false)
   private SaleStatus comsalestatus;
    //ENUM('Pending', 'Confirmed', 'Delivered', 'Cancelled', 'AwaitingPayment', 'PaymentSubmitted', 'PaymentVerified', 'CancelledNoPayment')



    @OneToMany(mappedBy = "compostsale", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("compostsale")
    private List<CompostSaleItem> compostSaleItems;

}
