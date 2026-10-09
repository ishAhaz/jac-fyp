package lk.jac.compost.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lk.jac.common.SubUnits;
import lk.jac.ingredient.entity.Ingredient;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "compost_has_ingredient")
@Data
@EqualsAndHashCode(exclude = {"compost"})
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CompostHasIngredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "compost_id")
    @JsonIgnoreProperties({"ingredients", "crops", "user", "description",
            "addeddatetime", "updateddatetime", "deleteddatetime"})
    private Compost compost;

    @ManyToOne
    @JoinColumn(name = "ingredient_id")
    @JsonIgnoreProperties({"user", "addeddatetime", "updateddatetime",
            "deleteddatetime", "description", "status"})
    private Ingredient ingredient;

    private Double qtyperunit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubUnits qtyunit;


}