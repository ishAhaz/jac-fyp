package lk.jac.crop.dao;

import lk.jac.common.Grade;
import lk.jac.common.TransactionType;
import lk.jac.crop.entity.CropInventoryTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CropInventoryTransactionRepository extends JpaRepository<CropInventoryTransaction, Integer> {

    @Query("""
            SELECT t
            FROM CropInventoryTransaction t
            WHERE t.crop.id = :cropId
              AND t.grade = :grade
            ORDER BY t.transactiondatetime DESC
            """)
    List<CropInventoryTransaction> findByCropIdAndGrade(
            @Param("cropId") Integer cropId,
            @Param("grade") Grade grade);

    @Query("""
            SELECT t
            FROM CropInventoryTransaction t
            WHERE t.sourceQualityCheckItem.id = :itemId
            """)
    CropInventoryTransaction findBySourceQualityCheckItemId(
            @Param("itemId") Integer itemId);

    @Query("""
            SELECT t
            FROM CropInventoryTransaction t
            WHERE t.sourceSupermarketOrderItem.id = :itemId
              AND t.transactiontype = :type
            ORDER BY t.transactiondatetime
            """)
    List<CropInventoryTransaction> findBySourceSupermarketOrderItemIdAndTransactiontype(
            @Param("itemId") Integer itemId,
            @Param("type") TransactionType type);
}