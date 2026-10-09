package lk.jac.payment.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lk.jac.farmer.entity.Farmer;
import lk.jac.grn.entity.GrnCrop;
import lk.jac.grn.entity.GrnIngredients;
import lk.jac.ingredient.entity.Supplier;
import lk.jac.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "expensepayment")

@Data
@AllArgsConstructor //allargument constructor
@NoArgsConstructor //empty constructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ExpensePayment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExpensePartytype partytype;


    @ManyToOne
    @JoinColumn(name = "farmer_id",referencedColumnName = "id")
    private Farmer farmer;

    @ManyToOne
    @JoinColumn(name = "supplier_id",referencedColumnName = "id")
    private Supplier supplier;


    @ManyToOne
    @JoinColumn(name = "grningredient_id", referencedColumnName = "id")
    private GrnIngredients grnIngredients;

    @ManyToOne
    @JoinColumn(name = "grncrop_id", referencedColumnName = "id")
    private GrnCrop grnCrop;

private String paymentno;
    private Double paidamount;

    @ManyToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    private LocalDateTime addeddatetime;
    private LocalDateTime updateddatetime;
    private LocalDateTime deleteddatetime;


    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus paymentstatus;
//    Paid,Unpaid,Partial

    @OneToOne(mappedBy = "expensePayment", cascade = CascadeType.ALL, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonManagedReference("expensepayment-banktransfer")
    private BankTransfer bankTransfer;

    @OneToOne(mappedBy = "expensePayment", cascade = CascadeType.ALL, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonManagedReference("expensepayment-cardpayment")
    private CardPayment cardPayment;

    @OneToOne(mappedBy = "expensePayment", cascade = CascadeType.ALL, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonManagedReference("expensepayment-chequepayment")
    private ChequePayment chequePayment;

}

