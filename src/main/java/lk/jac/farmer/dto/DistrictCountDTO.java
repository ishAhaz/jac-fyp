package lk.jac.farmer.dto;

import lk.jac.common.District;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DistrictCountDTO {
    private District district;
    private long count;
}