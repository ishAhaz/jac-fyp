package lk.jac.ingredient.controller;

import lk.jac.common.OrderStatus;
import lk.jac.common.ProcessStatus;
import lk.jac.common.SuggestionStatus;
import lk.jac.grn.dao.GrnIngredientsRepository;
import lk.jac.ingredient.dao.IngredientQualityCheckRepository;
import lk.jac.ingredient.dao.PurchaseOrderRepository;
import lk.jac.ingredient.dto.PurchaseOrderReportDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.ModelAndView;

import java.util.Arrays;
import java.util.List;

@Controller
@RequestMapping("/reports/purchaseorderreport")
public class IngredientPOReportsController {

    @Autowired
    private PurchaseOrderRepository poRepository;

    @Autowired
    private GrnIngredientsRepository grnRepository;

    @Autowired
    private IngredientQualityCheckRepository qcRepository;

    @GetMapping
    public ModelAndView POreportPage(){
        ModelAndView mvPO = new ModelAndView();
        mvPO.setViewName("/dashboards/purchaseorderreport.html");
        return mvPO;
    }

    @GetMapping("/summary")
    @ResponseBody
    public PurchaseOrderReportDTO getReportSummary() {

        long pendingCount   = poRepository.countByPostatusAndDeleteddatetimeIsNull(OrderStatus.Pending);
        long approvedCount  = poRepository.countByPostatusAndDeleteddatetimeIsNull(OrderStatus.Approved);
        long cancelledCount = poRepository.countByPostatusAndDeleteddatetimeIsNull(OrderStatus.Cancelled);
        long totalPOCount   = pendingCount + approvedCount + cancelledCount;

        long pendingGRNCount = grnRepository.countByGrnstatus(ProcessStatus.Pending);
        long pendingQCCount  = qcRepository.countByQualitystatus(SuggestionStatus.Pending);

        List<PurchaseOrderReportDTO.StatusCount> byGRNStatus = Arrays.asList(
                new PurchaseOrderReportDTO.StatusCount("Pending",  grnRepository.countByGrnstatus(ProcessStatus.Pending)),
                new PurchaseOrderReportDTO.StatusCount("Complete", grnRepository.countByGrnstatus(ProcessStatus.Complete)),
                new PurchaseOrderReportDTO.StatusCount("Partial",  grnRepository.countByGrnstatus(ProcessStatus.Partial)),
                new PurchaseOrderReportDTO.StatusCount("Rejected", grnRepository.countByGrnstatus(ProcessStatus.Rejected))
        );

        List<PurchaseOrderReportDTO.StatusCount> byQCStatus = Arrays.asList(
                new PurchaseOrderReportDTO.StatusCount("Pending",  qcRepository.countByQualitystatus(SuggestionStatus.Pending)),
                new PurchaseOrderReportDTO.StatusCount("Approved", qcRepository.countByQualitystatus(SuggestionStatus.Approved)),
                new PurchaseOrderReportDTO.StatusCount("Rejected", qcRepository.countByQualitystatus(SuggestionStatus.Rejected))
        );

        return new PurchaseOrderReportDTO(
                totalPOCount,
                pendingCount,     // openPOCount
                approvedCount,    // completedPOCount
                cancelledCount,   // cancelledPOCount
                pendingGRNCount,
                pendingQCCount,
                byGRNStatus,
                byQCStatus
        );
    }
}