package lk.jac.ingredient.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class IngredientInventoryDTO {
    private String ingredientName;
    private Double quantity;
}