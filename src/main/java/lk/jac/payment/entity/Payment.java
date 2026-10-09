package lk.jac.payment.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lk.jac.compost.entity.CompostSale;
import lk.jac.farmer.entity.Farmer;

import lk.jac.supermarket.entity.Supermarket;
import lk.jac.supermarket.entity.SupermarketOrder;
import lk.jac.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "payment")

@Data
@AllArgsConstructor //allargument constructor
@NoArgsConstructor //empty constructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "supermarket_id", referencedColumnName = "id")
    private Supermarket supermarket;

    @ManyToOne
    @JoinColumn(name = "supermarketorder_id" , referencedColumnName = "id")
    private SupermarketOrder supermarketOrder;


    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod paymentmethod;
    //Cash,Bank_Transfer,Card,Cheque

   private Double paidamount;

   @ManyToOne
    @JoinColumn(name = "farmer_id", referencedColumnName = "id")
    private Farmer farmer;

   @ManyToOne
    @JoinColumn(name = "compostsale_id", referencedColumnName = "id")
    private CompostSale compostsale;

    private LocalDateTime paymentdatetime;
    private LocalDateTime updateddatetime;
    private LocalDateTime deleteddatetime;
    private String paymentno;
    @ManyToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    private String note;


    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus paymentstatus;
//    Paid,Unpaid,Partial






    @OneToOne(mappedBy = "payment", cascade = CascadeType.ALL, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonManagedReference("payment-banktransfer")
    private BankTransfer bankTransfer;

    @OneToOne(mappedBy = "payment", cascade = CascadeType.ALL, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonManagedReference("payment-cardpayment")
    private CardPayment cardPayment;

    @OneToOne(mappedBy = "payment", cascade = CascadeType.ALL, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonManagedReference("payment-chequepayment")
    private ChequePayment chequePayment;

}







