package lk.jac.crop.dao;

import lk.jac.common.Grade;
import lk.jac.crop.entity.CropInventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CropInventoryRepository extends JpaRepository<CropInventory,Integer> {
    @Query("SELECT i FROM CropInventory i")
    List<CropInventory> getSelectedInventory();

    @Query("SELECT i FROM CropInventory i WHERE i.crop.id = :cropId AND i.grade = :grade")
    CropInventory findByCropIdAndGrade(@Param("cropId") Integer cropId, @Param("grade") Grade grade);

}
