package lk.jac.crop.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lk.jac.common.OrderStatus;
import lk.jac.farmer.entity.Farmer;
import lk.jac.user.entity.User;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "croppurchase")
@Data
@AllArgsConstructor //allargument constructor
@NoArgsConstructor //empty constructor
@ToString(exclude = "cropPurchaseItems")
@EqualsAndHashCode(exclude = "cropPurchaseItems")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CropPurchase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private Double total;
    private LocalDateTime purchasedatetime;

    @ManyToOne
    @JoinColumn(name = "farmer_id", referencedColumnName = "id")
    private Farmer farmer;

    @ManyToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    private LocalDateTime updateddatetime;
    private LocalDateTime deleteddatetime;

   private LocalDate expecteddate;


    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus postatus;
    //Pending','Approved','Cancelled

    private String ponumber;

   @OneToMany(mappedBy = "cropPurchase", cascade = CascadeType.ALL, orphanRemoval = true)
   @JsonIgnoreProperties("cropPurchase")
    private List<CropPurchaseItem> cropPurchaseItems;

}
