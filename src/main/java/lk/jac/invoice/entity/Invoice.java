package lk.jac.invoice.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lk.jac.common.InvoiceStatus;
import lk.jac.common.Partytype;
import lk.jac.compost.entity.CompostSale;
import lk.jac.grn.entity.GrnCrop;
import lk.jac.grn.entity.GrnIngredients;
import lk.jac.supermarket.entity.SupermarketOrder;
import lk.jac.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "invoice")

@Data
@AllArgsConstructor //allargument constructor
@NoArgsConstructor //empty constructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Invoice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String notes;

    @ManyToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvoiceStatus invoicestatus;
    //'Unpaid','Partial','Paid','Overdue')


    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Partytype partytype;
    //'Supermarket','Farmer','Supplier')



    private LocalDateTime addeddatetime;
    private LocalDateTime updateddatetime;
    private LocalDateTime deleteddatetime;




    @ManyToOne
    @JoinColumn(name = "grningredient_id", referencedColumnName = "id")
    private GrnIngredients grnIngredients;

    @ManyToOne
    @JoinColumn(name = "grncrop_id", referencedColumnName = "id")
    private GrnCrop grnCrop;


    private Double paidamount;
    private String invoicenumber;
    private String issuedto;
    private LocalDateTime issueddate;
    private LocalDate duedate;
    private Double totalamount;
    private Double remainingamount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SourceType sourcetype;
//Order,GRN

    @ManyToOne
    @JoinColumn(name = "supermarketorder_id", referencedColumnName = "id")
    private SupermarketOrder supermarketorder;

    @ManyToOne
    @JoinColumn(name = "compostsale_id", referencedColumnName = "id")
    private CompostSale compostsale;



}
