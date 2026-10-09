package lk.jac.ingredient.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lk.jac.common.Grade;
import lk.jac.grn.entity.GrnIngredientsItem;
import lombok.*;

@Entity
@Table(name = "ingredientqualitycheckitem")
@Data
@AllArgsConstructor //allargument constructor
@NoArgsConstructor //empty constructor
@ToString(exclude = "ingredientQualityCheck")
@EqualsAndHashCode(exclude = "ingredientQualityCheck")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class IngredientQualityCheckItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "ingredientqualitycheck_id", referencedColumnName = "id")
    @JsonIgnoreProperties("ingredientQualityCheckItems")
    private IngredientQualityCheck ingredientQualityCheck;

    @Enumerated(EnumType.STRING)
    private Grade grade;

    @ManyToOne
    @JoinColumn(name = "grnitemingredient_id", referencedColumnName = "id")
    private GrnIngredientsItem grnIngredientsItem;

    private Double quantity;
    private String note;

}
