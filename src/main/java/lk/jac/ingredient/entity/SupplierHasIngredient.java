package lk.jac.ingredient.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lk.jac.common.StatusReject;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "supplier_has_ingredient")

@Data
@AllArgsConstructor //allargument constructor
@NoArgsConstructor //empty constructor
@ToString(exclude = "supplier")
@EqualsAndHashCode(exclude = "supplier")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SupplierHasIngredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "supplier_id", referencedColumnName = "id")
    @JsonIgnoreProperties("ingredients")
    private Supplier supplier;

    @ManyToOne
    @JoinColumn(name = "ingredient_id", referencedColumnName = "id")
    private Ingredient ingredient;

    private Double price;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusReject status;

    private LocalDateTime deleteddatetime;

}
