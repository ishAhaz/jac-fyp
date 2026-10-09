package lk.jac.ingredient.dto;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseOrderReportDTO {

    private long totalPOCount;
    private long openPOCount;
    private long completedPOCount;
    private long cancelledPOCount;

    private long pendingGRNCount;
    private long pendingQCCount;

    private List<StatusCount> byGRNStatus;
    private List<StatusCount> byQCStatus;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusCount {
        private String status;
        private long count;
    }
}
