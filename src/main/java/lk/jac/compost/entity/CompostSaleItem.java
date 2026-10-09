package lk.jac.compost.entity;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "compostsaleitem")

@Data
@AllArgsConstructor //allargument constructor
@NoArgsConstructor //empty constructor
@ToString(exclude = "compostsale")
@EqualsAndHashCode(exclude = "compostsale")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CompostSaleItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "compostsale_id", referencedColumnName = "id")
    @JsonIgnoreProperties("compostSaleItems")
    private CompostSale compostsale;

    @ManyToOne
    @JoinColumn(name = "compostprice_id", referencedColumnName = "id")
    private CompostPrice compostprice;
  private double quantity;

  @ManyToOne
  @JoinColumn(name = "compost_id", referencedColumnName = "id")
  private Compost compost;

  private double unitprice;
  private double linetotalprice;

}
