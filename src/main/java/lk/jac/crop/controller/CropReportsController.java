package lk.jac.crop.controller;

import lk.jac.common.StatusReject;
import lk.jac.crop.dao.CropInventoryRepository;
import lk.jac.crop.dao.CropListManagementRepository;
import lk.jac.crop.dto.CropReportDTO;
import lk.jac.crop.entity.CropInventory;
import lk.jac.farmer.dao.CropHasFarmerRepository;
import lk.jac.farmer.dao.FarmerRepository;
import lk.jac.farmer.entity.CropHasFarmer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.ModelAndView;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/reports/cropreport")
public class CropReportsController {

    @Autowired
    private CropListManagementRepository cropRepository;

    @Autowired
    private FarmerRepository farmerRepository;

    @Autowired
    private CropHasFarmerRepository cropHasFarmerRepository;

    @Autowired
    private CropInventoryRepository cropInventoryRepository;

    // No reorder-level field exists on CropInventory — using a fixed threshold
    // until one is added to the entity. Adjust/replace as needed.
    private static final double LOW_STOCK_THRESHOLD = 10.0;

    @GetMapping
    public ModelAndView cropReportPage(){
        ModelAndView cropUI = new ModelAndView();
        cropUI.setViewName("/dashboards/cropreports.html");
        return cropUI;
    }

    @GetMapping("/summary")
    @ResponseBody
    public CropReportDTO getReportSummary() {

        long activeCrops   = cropRepository.countByDeleteddatetimeIsNull();
        long inactiveCrops = cropRepository.countByDeleteddatetimeIsNotNull();
        long totalCrops    = activeCrops + inactiveCrops;

        long totalFarmers  = farmerRepository.countByDeleteddatetimeIsNull();

        List<CropInventory> inventory = cropInventoryRepository.findAll();

        // Sum currentquantity per crop across grades
        Map<String, Double> quantityByCrop = inventory.stream()
                .collect(Collectors.groupingBy(
                        i -> i.getCrop().getName(),
                        Collectors.summingDouble(i ->
                                i.getCurrentquantity() != null ? i.getCurrentquantity() : 0.0)));

        long inStockCount = quantityByCrop.values().stream()
                .filter(q -> q > LOW_STOCK_THRESHOLD)
                .count();
        long lowStockCount = quantityByCrop.values().stream()
                .filter(q -> q > 0 && q <= LOW_STOCK_THRESHOLD)
                .count();
        long outOfStockCount = quantityByCrop.values().stream()
                .filter(q -> q <= 0)
                .count();

        List<CropReportDTO.InventoryLevel> byInventory = quantityByCrop.entrySet().stream()
                .map(e -> new CropReportDTO.InventoryLevel(e.getKey(), e.getValue()))
                .collect(Collectors.toList());

        List<CropHasFarmer> activeLinks = cropHasFarmerRepository.findAll().stream()
                .filter(chf -> chf.getStatus() == StatusReject.Active)
                .collect(Collectors.toList());

        Map<String, Long> farmerCountByCrop = activeLinks.stream()
                .collect(Collectors.groupingBy(
                        chf -> chf.getCropListManagement().getName(),
                        Collectors.counting()));

        List<CropReportDTO.FarmerPerCrop> byFarmerPerCrop = farmerCountByCrop.entrySet().stream()
                .map(e -> new CropReportDTO.FarmerPerCrop(e.getKey(), e.getValue()))
                .collect(Collectors.toList());

        return new CropReportDTO(
                totalCrops,
                activeCrops,
                inactiveCrops,
                totalFarmers,
                quantityByCrop.size(),
                inStockCount,
                lowStockCount,
                outOfStockCount,
                byInventory,
                byFarmerPerCrop
        );
    }
}