package lk.jac.ingredient.dao;

import lk.jac.ingredient.dto.SupplierPerIngredientDTO;
import lk.jac.ingredient.entity.SupplierHasIngredient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SupplierHasIngredientRepository extends JpaRepository<SupplierHasIngredient,Integer> {
    @Query("SELECT s FROM SupplierHasIngredient s WHERE s.supplier.id = :supplierId AND s.deleteddatetime IS NULL")
    List<SupplierHasIngredient> findBySupplierId(@Param("supplierId") Integer supplierId);


    //to purchase order
    @Query("SELECT s FROM SupplierHasIngredient s " +
            "WHERE s.supplier.id = :supplierId " +
            "AND s.status = 'Active' " +
            "AND s.deleteddatetime IS NULL")
    List<SupplierHasIngredient> findActiveBySupplierId(@Param("supplierId") Integer supplierId);

//for reports
@Query("SELECT new lk.jac.ingredient.dto.SupplierPerIngredientDTO(shi.ingredient.name, COUNT(DISTINCT shi.supplier.id)) " +
        "FROM SupplierHasIngredient shi " +
        "WHERE shi.deleteddatetime IS NULL " +
        "GROUP BY shi.ingredient.name " +
        "ORDER BY COUNT(DISTINCT shi.supplier.id) DESC")
List<SupplierPerIngredientDTO> countSuppliersPerIngredient();
}
