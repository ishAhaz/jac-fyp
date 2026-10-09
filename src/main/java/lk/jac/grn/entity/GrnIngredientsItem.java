package lk.jac.grn.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lk.jac.ingredient.entity.PurchaseOrderItem;
import lombok.*;

@Entity
@Table(name = "grnitemingredient")
@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString(exclude = "grnIngredients")
@EqualsAndHashCode(exclude = "grnIngredients")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GrnIngredientsItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "grningredient_id", referencedColumnName = "id")
    @JsonIgnoreProperties("grnIngredientsItems")
    private GrnIngredients grnIngredients;

    private Double orderedqty;
    private  Double receivedqty;

    @Column(name = "`condition`")
    private Boolean condition;

    private String note;

    @ManyToOne
    @JoinColumn(name = "poitem_id" , referencedColumnName = "id")
    private PurchaseOrderItem purchaseOrderItem;

    private Double lineprice;



}
