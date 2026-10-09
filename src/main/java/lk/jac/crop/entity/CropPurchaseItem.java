package lk.jac.crop.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lk.jac.farmer.entity.CropHasFarmer;
import lombok.*;

@Entity
@Table(name = "croppurchaseitem")
@Data
@AllArgsConstructor //allargument constructor
@NoArgsConstructor //empty constructor
@ToString(exclude = "cropPurchase")
@EqualsAndHashCode(exclude = "cropPurchase")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CropPurchaseItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "croppurchase_id", referencedColumnName = "id")
    @JsonIgnoreProperties("cropPurchaseItems")
    private CropPurchase cropPurchase;

    @ManyToOne
    @JoinColumn(name = "crop_id", referencedColumnName = "id")
    private CropListManagement crop;

    private Double quantity;
    private Double unitprice;
    private Double linetotalprice;

    @ManyToOne
    @JoinColumn(name = "crop_has_farmer_id", referencedColumnName = "id")
    private CropHasFarmer crophasfarmer;
    //assosiation table of crop and farmer



}
