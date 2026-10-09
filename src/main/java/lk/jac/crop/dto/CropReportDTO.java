package lk.jac.crop.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CropReportDTO {

    private long totalCrops;
    private long activeCrops;
    private long inactiveCrops;

    private long totalFarmers;
    private long inventoryItemCount;

    private long inStockCount;
    private long lowStockCount;
    private long outOfStockCount;

    private List<InventoryLevel> byInventory;
    private List<FarmerPerCrop> byFarmerPerCrop;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InventoryLevel {
        private String cropName;
        private double quantity;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FarmerPerCrop {
        private String cropName;
        private double farmerCount;
    }
}