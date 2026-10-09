package lk.jac.ingredient.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SupplierIngredientReportDTO {
    private long totalSuppliers;
    private long activeSuppliers;
    private long inactiveSuppliers;
    private long totalIngredients;
    private long inventoryItemCount;
    private long inStockCount;
    private long lowStockCount;
    private long outOfStockCount;
    private List<IngredientInventoryDTO> byInventory;
    private List<SupplierPerIngredientDTO> bySupplierPerIngredient;
}