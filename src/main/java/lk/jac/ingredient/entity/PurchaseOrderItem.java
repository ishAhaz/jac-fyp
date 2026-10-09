package lk.jac.ingredient.entity;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "poitem")
@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString(exclude = "purchaseOrder")
@EqualsAndHashCode(exclude = "purchaseOrder")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PurchaseOrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private Double quantity;
    private Double unitprice;
    private Double linetotalprice;

    @ManyToOne
    @JoinColumn(name = "ingredient_id", referencedColumnName = "id")
    private Ingredient ingredient;

    @ManyToOne
    @JoinColumn(name = "purchaseorder_id", referencedColumnName = "id")
    @JsonIgnoreProperties("purchaseOrderItems")
    private PurchaseOrder purchaseOrder;

    @ManyToOne
    @JoinColumn(name = "supplier_has_ingredient_id", referencedColumnName = "id")
    private SupplierHasIngredient supplierHasIngredient;


}
