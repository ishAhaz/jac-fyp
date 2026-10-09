package lk.jac.ingredient.controller;

import lk.jac.common.Status;
import lk.jac.ingredient.dao.IngredientRepository;
import lk.jac.ingredient.dao.SupplierHasIngredientRepository;
import lk.jac.ingredient.dao.SupplierRepository;
import lk.jac.ingredient.dto.IngredientInventoryDTO;
import lk.jac.ingredient.dto.SupplierIngredientReportDTO;
import lk.jac.ingredient.dto.SupplierPerIngredientDTO;
import lk.jac.ingredient.entity.IngredientInventory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.ModelAndView;

import java.util.List;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/reports/ingredientreport")
public class IngredientReportsController {

    @Autowired
    private SupplierRepository supplierDao;

    @Autowired
    private IngredientRepository ingredientDao;

    @Autowired
    private IngredientInventoryController ingredientInventoryController;

    @Autowired
    private SupplierHasIngredientRepository supplierHasIngredientDao;

    @GetMapping
    public ModelAndView reportPage(){
        ModelAndView mv = new ModelAndView();
        mv.setViewName("/dashboards/ingredientreports.html");
        return mv;
    }





    @GetMapping("/summary")
    @ResponseBody
    public ResponseEntity<SupplierIngredientReportDTO> getReportSummary() {

        long totalSuppliers = supplierDao.countByDeleteddatetimeIsNull();
        long activeSuppliers = supplierDao.countByStatusAndDeleteddatetimeIsNull(Status.Active);
        long inactiveSuppliers = supplierDao.countByStatusAndDeleteddatetimeIsNull(Status.Inactive);

        long totalIngredients = ingredientDao.countExcludingWater();

        // Full ingredient x grade list — includes zero-stock placeholders, excluding Water
        List<IngredientInventory> fullInventory = ingredientInventoryController.getAll().stream()
                .filter(i -> !"Water".equalsIgnoreCase(i.getIngredient().getName()))
                .collect(Collectors.toList());

        long inventoryItemCount = fullInventory.size();

        long outOfStockCount = fullInventory.stream()
                .filter(i -> i.getCurrentquantity() == null || i.getCurrentquantity() <= 0)
                .count();

        long lowStockCount = fullInventory.stream()
                .filter(i -> i.getCurrentquantity() != null
                        && i.getCurrentquantity() > 0
                        && i.getCurrentquantity() < 50)
                .count();

        long inStockCount = inventoryItemCount - outOfStockCount - lowStockCount;

        List<IngredientInventoryDTO> byInventory = fullInventory.stream()
                .map(i -> new IngredientInventoryDTO(
                        i.getIngredient().getName() + " (" + i.getGrade() + ")",
                        i.getCurrentquantity() != null ? i.getCurrentquantity() : 0.0
                ))
                .collect(Collectors.toList());

        List<SupplierPerIngredientDTO> bySupplierPerIngredient =
                supplierHasIngredientDao.countSuppliersPerIngredient();

        SupplierIngredientReportDTO dto = new SupplierIngredientReportDTO(
                totalSuppliers, activeSuppliers, inactiveSuppliers,
                totalIngredients, inventoryItemCount,
                inStockCount, lowStockCount, outOfStockCount,
                byInventory, bySupplierPerIngredient
        );

        return ResponseEntity.ok(dto);
    }
}