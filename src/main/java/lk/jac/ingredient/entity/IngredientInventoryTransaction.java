package lk.jac.ingredient.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lk.jac.common.Grade;
import lk.jac.common.TransactionType;
import lk.jac.compost.entity.CompostSaleItem;
import lk.jac.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "ingredientinventorytransaction")
@Data
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class IngredientInventoryTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "compostsaleitem_id", referencedColumnName = "id")
    private CompostSaleItem sourceCompostSaleItem;

    @ManyToOne
    @JoinColumn(name = "ingredient_id", referencedColumnName = "id")
    private Ingredient ingredient;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Grade grade;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType transactiontype;

    private Double quantity;
    private LocalDateTime transactiondatetime;

    // Traceability — which quality check item caused this IN transaction
    @ManyToOne
    @JoinColumn(name = "ingredientqualitycheckitem_id", referencedColumnName = "id")
    private IngredientQualityCheckItem sourceQualityCheckItem;



    @ManyToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;
}
