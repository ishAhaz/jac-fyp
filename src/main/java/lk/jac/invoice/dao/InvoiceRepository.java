package lk.jac.invoice.dao;

import lk.jac.common.InvoiceStatus;
import lk.jac.compost.entity.CompostSale;
import lk.jac.grn.entity.GrnCrop;
import lk.jac.grn.entity.GrnIngredients;
import lk.jac.invoice.entity.Invoice;
import lk.jac.invoice.entity.InvoiceDetails;
import lk.jac.supermarket.entity.SupermarketOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface InvoiceRepository extends JpaRepository<Invoice, Integer> {

    Invoice findByIdAndDeleteddatetimeIsNull(int id);

    List<Invoice> findByDeleteddatetimeIsNull();

    @Query("SELECT i FROM Invoice i WHERE i.deleteddatetime IS NULL ORDER BY i.addeddatetime DESC")
    List<Invoice> getSelectedInvoiceData();

    @Query(value = "SELECT invoicenumber FROM invoice ORDER BY id DESC LIMIT 1", nativeQuery = true)
    String getLastRegistrationNo();

    Invoice findByGrnCropAndDeleteddatetimeIsNull(GrnCrop grnCrop);

    Invoice findByGrnIngredientsAndDeleteddatetimeIsNull(GrnIngredients grnIngredients);

    Invoice findByCompostsaleAndDeleteddatetimeIsNull(CompostSale compostsale);

    Invoice findBySupermarketorderAndDeleteddatetimeIsNull(SupermarketOrder supermarketorder);


    @Query("SELECT COUNT(c) FROM Invoice c WHERE YEAR(c.addeddatetime) = :year AND MONTH(c.addeddatetime) = :month")
    Integer countByYearAndMonth(int year, int month);


    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.invoicestatus = 'Unpaid' ")
    long countByInvoicestatus(InvoiceStatus invoicestatus);
    // list view — only this user's invoices
    List<Invoice> findByIssuedtoAndDeleteddatetimeIsNullOrderByIssueddateDesc(String issuedto);

    // detail view — id AND issuedto must both match, so a stranger's id can't be pulled
    Invoice findByIdAndIssuedtoAndDeleteddatetimeIsNull(Long id, String issuedto);

    @Query("SELECT d FROM InvoiceDetails d WHERE d.invoice.id = :invoiceId AND d.invoice.issuedto = :issuedto")
    List<InvoiceDetails> findByInvoiceIdAndOwner(@Param("invoiceId") Long invoiceId, @Param("issuedto") String issuedto);

}