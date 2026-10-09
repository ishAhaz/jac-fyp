package lk.jac.farmer.controller;

import lk.jac.common.Status;
import lk.jac.farmer.dao.CropHasFarmerRepository;
import lk.jac.farmer.dao.FarmerRepository;
import lk.jac.farmer.dto.CropCountDTO;
import lk.jac.farmer.dto.DistrictCountDTO;
import lk.jac.farmer.dto.FarmerReportDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.ModelAndView;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Controller
@RequestMapping("/reports/farmerreport")
public class FarmerReportsController {

    @Autowired
    private FarmerRepository farmerDao;

    @Autowired
    private CropHasFarmerRepository cropHasFarmerDao;

    @GetMapping
    public ModelAndView farmerReportsPage(){
        ModelAndView farmerReportsUI = new ModelAndView();
        farmerReportsUI.setViewName("/dashboards/farmerreports.html");
        return farmerReportsUI;
    }


    @GetMapping("/summary")
    @ResponseBody
    public ResponseEntity<FarmerReportDTO> getReportSummary() {

        long total = farmerDao.countByDeleteddatetimeIsNull();
        long active = farmerDao.countByStatusAndDeleteddatetimeIsNull(Status.Active);
        long inactive = farmerDao.countByStatusAndDeleteddatetimeIsNull(Status.Inactive);

        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        long newThisMonth = farmerDao.countNewThisMonth(startOfMonth);

        List<DistrictCountDTO> byDistrict = farmerDao.countFarmersByDistrict();
        List<CropCountDTO> byCrop = cropHasFarmerDao.countFarmersByCrop();

        FarmerReportDTO dto = new FarmerReportDTO(total, active, inactive, newThisMonth, byDistrict, byCrop);
        return ResponseEntity.ok(dto);
    }
}