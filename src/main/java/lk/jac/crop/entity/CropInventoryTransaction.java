package lk.jac.crop.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lk.jac.common.Grade;
import lk.jac.common.TransactionType;
import lk.jac.supermarket.entity.SupermarketOrderItem;
import lk.jac.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
@Entity
@Table(name = "cropinventorytransaction")
@Data
@AllArgsConstructor //allargument constructor
@NoArgsConstructor //empty constructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CropInventoryTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "crop_id", referencedColumnName = "id")
    private CropListManagement crop;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Grade grade;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType transactiontype;

    private Double quantity;
    private LocalDateTime transactiondatetime;


    // Traceability — which quality check item caused this IN transaction
    @ManyToOne
    @JoinColumn(name = "cropqualitycheckitem_id" , referencedColumnName = "id")
    private CropQualityCheckItem sourceQualityCheckItem;



    @ManyToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;


    @ManyToOne
    @JoinColumn(name = "supermarketorderitem_id", referencedColumnName = "id")
    private SupermarketOrderItem sourceSupermarketOrderItem;

}
