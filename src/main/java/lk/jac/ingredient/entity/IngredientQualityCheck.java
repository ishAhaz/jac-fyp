package lk.jac.ingredient.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lk.jac.common.SuggestionStatus;
import lk.jac.grn.entity.GrnIngredients;
import lk.jac.user.entity.User;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "ingredientqualitycheck")
@Data
@AllArgsConstructor //allargument constructor
@NoArgsConstructor //empty constructor
@ToString(exclude = "ingredientQualityCheckItems")
@EqualsAndHashCode(exclude = "ingredientQualityCheckItems")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class IngredientQualityCheck {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;


    private LocalDate checkeddate;
    private LocalDateTime updateddatetime;
    private String checkno;

    @ManyToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;



    @ManyToOne
    @JoinColumn(name = "grningredient_id", referencedColumnName = "id")
    private GrnIngredients grningredient;

    private LocalDateTime createddatetime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    private SuggestionStatus qualitystatus;


    @OneToMany(mappedBy = "ingredientQualityCheck", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<IngredientQualityCheckItem> ingredientQualityCheckItems;


}

