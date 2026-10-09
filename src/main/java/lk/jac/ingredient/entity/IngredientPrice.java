package lk.jac.ingredient.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lk.jac.common.StatusPending;
import lk.jac.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "ingredientprice")

@Data
@AllArgsConstructor //allargument constructor
@NoArgsConstructor //empty constructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class IngredientPrice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private Double suggestedpriceperkg;
    private LocalDateTime addeddatetime;
    private LocalDateTime updateddatetime;

    @ManyToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "ingredient_id", referencedColumnName = "id")
    private Ingredient ingredient;

    private Double markuppricepkg;
    private Double realprice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusPending status;
    //'Active','Inactive','Pending')

    private String priceid;

}
