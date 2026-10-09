package lk.jac.payment.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Base64;

@Entity
@Table(name = "chequepayment")

@Data
@AllArgsConstructor //allargument constructor
@NoArgsConstructor //empty constructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ChequePayment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String chequenumber;
    private String bankname;
    private String branch;
    private LocalDate chequedate;
    private LocalDate clearingdate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChequeStatus chequestatus;
    //Pending,Cleared,Bounced,Cancelled


    //image
    @Lob
    @Column(name = "receiptimage", columnDefinition = "MEDIUMBLOB")
    private byte[] receiptimage;

    @Transient // ← not a DB column, just for receiving from frontend
    private String imageBase64;

    @Transient
    private boolean imageRemoved;

    //this method to auto-convert byte[] to base64 when serializing to JSON
    @PostLoad
    public void loadImage() {
        if (this.receiptimage != null) {
            this.imageBase64 = "data:image/png;base64," +
                    Base64.getEncoder().encodeToString(this.receiptimage);
        }
    }

//    Save:   frontend sends imageBase64 string → backend converts to byte[] → saved to DB
//    Load:   DB has byte[] → @PostLoad converts to imageBase64 string → frontend displays it



    @OneToOne
    @JoinColumn(name = "payment_id", referencedColumnName = "id")
    @com.fasterxml.jackson.annotation.JsonBackReference("payment-chequepayment")
    private Payment payment;

    @OneToOne
    @JoinColumn(name = "expensepayment_id", referencedColumnName = "id")
    @com.fasterxml.jackson.annotation.JsonBackReference("expensepayment-chequepayment")
    private ExpensePayment expensePayment;

}
