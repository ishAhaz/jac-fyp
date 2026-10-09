package lk.jac.grn.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lk.jac.common.ProcessStatus;
import lk.jac.ingredient.entity.PurchaseOrder;
import lk.jac.user.entity.User;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "grningredient")
@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString(exclude = "grnIngredientsItems")
@EqualsAndHashCode(exclude = "grnIngredientsItems")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GrnIngredients {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(unique = true)
    private String grningredientnumber;

    @ManyToOne
    @JoinColumn(name = "purchaseorder_id", referencedColumnName = "id")
    @JsonIgnoreProperties("purchaseOrderItems")
    private PurchaseOrder purchaseOrder;

    private LocalDate recieveddate;
    private String note;

    @ManyToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProcessStatus grnstatus;
    //Pending,Complete,Partial,Rejected

    private LocalDateTime addeddatetime;
    private LocalDateTime updateddatetime;
    private Double totalprice;

    @OneToMany(mappedBy = "grnIngredients", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("grnIngredients")
    private List<GrnIngredientsItem> grnIngredientsItems = new ArrayList<>();


}
