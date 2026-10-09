package lk.jac.ingredient.dao;

import lk.jac.common.Status;
import lk.jac.ingredient.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SupplierRepository extends JpaRepository<Supplier, Integer> {

    // Table — excludes soft-deleted suppliers and soft-deleted ingredients
    @Query("SELECT s FROM Supplier s " +
            "LEFT JOIN FETCH s.ingredients i " +
            "LEFT JOIN FETCH i.ingredient " +
            "WHERE s.deleteddatetime IS NULL " +
            "AND (i IS NULL OR i.deleteddatetime IS NULL)")
    List<Supplier> getSelectedSupplierData();

    // Edit — load single supplier with active ingredients only
    @Query("SELECT s FROM Supplier s " +
            "LEFT JOIN FETCH s.ingredients i " +
            "LEFT JOIN FETCH i.ingredient " +
            "WHERE s.id = :id " +
            "AND s.deleteddatetime IS NULL " +
            "AND (i IS NULL OR i.deleteddatetime IS NULL)")
    Supplier findByIdWithIngredients(@Param("id") Integer id);

    Supplier findByIdAndDeleteddatetimeIsNull(Integer id);

    // Duplicate checks
    Supplier findByContactpersonAndDeleteddatetimeIsNull(String contactperson);
    Supplier findByCompanynameAndDeleteddatetimeIsNull(String companyname);
    Supplier findByMobilenumAndDeleteddatetimeIsNull(String mobilenum);
    Supplier findByEmailAndDeleteddatetimeIsNull(String email);

    // Supplier ID generation
    @Query("SELECT COUNT(s) FROM Supplier s WHERE YEAR(s.addeddatetime) = :year AND MONTH(s.addeddatetime) = :month")
    Integer countByYearAndMonth(@Param("year") int year, @Param("month") int month);

//for report
   long countByDeleteddatetimeIsNull();
    long countByStatusAndDeleteddatetimeIsNull(Status status);

    List<Supplier> findAllByDeleteddatetimeIsNull();

}