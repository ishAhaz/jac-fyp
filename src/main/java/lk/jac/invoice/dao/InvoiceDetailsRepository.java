package lk.jac.invoice.dao;

import lk.jac.invoice.entity.Invoice;
import lk.jac.invoice.entity.InvoiceDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface InvoiceDetailsRepository extends JpaRepository<InvoiceDetails, Integer> {

    // Transactions under one invoice, oldest first — used by the frontend
    // "Transactions" list in the read-only Invoice Detail modal.
    List<InvoiceDetails> findByInvoice_IdOrderByAddeddatetimeAsc(Integer invoiceId);

    List<InvoiceDetails> findByInvoice(Invoice invoice);

    @Query("SELECT d FROM InvoiceDetails d WHERE d.invoice.id = :invoiceId " +
            "AND d.invoice.issuedto = :issuedto ")
    List<InvoiceDetails> findByInvoiceIdAndOwner(@Param("invoiceId") Long invoiceId,
                                                @Param("issuedto") String issuedto);


}