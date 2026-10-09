package lk.jac.crop.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lk.jac.common.Grade;
import lk.jac.grn.entity.GrnCropItem;
import lombok.*;

@Entity
@Table(name = "cropqualitycheckitem")

@Data
@AllArgsConstructor //allargument constructor
@NoArgsConstructor //empty constructor
@ToString(exclude = "cropQualityCheck")
@EqualsAndHashCode(exclude = "cropQualityCheck")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CropQualityCheckItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "cropqualitycheck_id", referencedColumnName = "id")
    @JsonIgnoreProperties("cropQualityCheckItems")
    private CropQualityCheck cropQualityCheck;

    @Enumerated(EnumType.STRING)
    private Grade grade;

    @ManyToOne
    @JoinColumn(name = "grnitemcrop_id", referencedColumnName = "id")
    private GrnCropItem grnItemCrop;

    private Double quantity;
    private String note;


}
