package lk.jac.ingredient.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lk.jac.common.OrderStatus;
import lk.jac.user.entity.User;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "purchaseorder")
@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString(exclude = "purchaseOrderItems")
@EqualsAndHashCode(exclude = "purchaseOrderItems")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PurchaseOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "supplier_id", referencedColumnName = "id")
    private Supplier supplier;

    private LocalDateTime createddatetime;
    private LocalDate expecteddate;

    @ManyToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    private Double amount;


   @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus postatus;
   //'Pending','Approved',,'Cancelled')
    
    private String ponumber;
    private LocalDateTime updateddatetime;
    private LocalDateTime deleteddatetime;

    @OneToMany(mappedBy = "purchaseOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("purchaseOrder")
    private List<PurchaseOrderItem> purchaseOrderItems;
}
