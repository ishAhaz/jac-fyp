package lk.jac.farmer.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FarmerReportDTO {
    private long totalFarmers;
    private long activeFarmers;
    private long inactiveFarmers;
    private long newThisMonth;
    private List<DistrictCountDTO> byDistrict;
    private List<CropCountDTO> byCrop;
}