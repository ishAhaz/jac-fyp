package lk.jac.supermarket.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lk.jac.crop.entity.CropListManagement;
import lk.jac.crop.entity.CropPrice;
import lombok.*;

@Entity
@Table(name = "supermarketorderitem")

@Data
@AllArgsConstructor //allargument constructor
@NoArgsConstructor //empty constructor
@ToString(exclude = "supermarketOrder")
@EqualsAndHashCode(exclude = "supermarketOrder")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SupermarketOrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private double quantity;;
    private double linetotalprice;

    @ManyToOne
    @JoinColumn(name = "supermarketorder_id", referencedColumnName = "id")
    @JsonIgnoreProperties("supermarketOrderItems")
    private SupermarketOrder supermarketOrder;

   @ManyToOne
    @JoinColumn(name = "crop_id", referencedColumnName = "id")
    private CropListManagement croplistmanagement;


   private double unitprice;

   @ManyToOne
    @JoinColumn(name = "cropprice_id", referencedColumnName = "id")
    private CropPrice cropprice;

}
