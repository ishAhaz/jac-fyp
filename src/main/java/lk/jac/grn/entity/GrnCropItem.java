package lk.jac.grn.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lk.jac.crop.entity.CropPurchaseItem;
import lombok.*;

@Entity
@Table(name = "grnitemcrop")
@Data
@AllArgsConstructor //allargument constructor
@NoArgsConstructor //empty constructor
@ToString(exclude = "grnCrop")
@EqualsAndHashCode(exclude = "grnCrop")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GrnCropItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "grncrop_id", referencedColumnName = "id")
    @JsonIgnoreProperties("grnCropItems")
    private GrnCrop grnCrop;

    private Double orderedqty;
    private Double receivedqty;

    @Column(name = "`condition`")
    private Boolean condition;

    private String note;

    @ManyToOne
    @JoinColumn(name = "croppurchaseitem_id", referencedColumnName = "id")
    private CropPurchaseItem cropPurchaseItem;

    private Double lineprice;






}
