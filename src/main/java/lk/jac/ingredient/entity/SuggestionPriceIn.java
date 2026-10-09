package lk.jac.ingredient.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lk.jac.common.SuggestionStatus;
import lk.jac.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "suggestionprice")
@Data
@AllArgsConstructor //allargument constructor
@NoArgsConstructor //empty constructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SuggestionPriceIn {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private Double suggestedprice;
    private LocalDateTime suggesteddatetime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SuggestionStatus status;
    //Pending','Approved','Rejected'

    private LocalDateTime revieweddatetime;

    @ManyToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "supplier_has_ingredient_id", referencedColumnName = "id")
    private SupplierHasIngredient supplierhasingredient;

    private Double supplierprice;
    private String note;

}
