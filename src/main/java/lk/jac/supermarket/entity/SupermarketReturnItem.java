package lk.jac.supermarket.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "supermarketreturnitem")

@Data
@AllArgsConstructor //allargument constructor
@NoArgsConstructor //empty constructor
@ToString(exclude = "supermarketreturn")
@EqualsAndHashCode(exclude = "supermarketreturn")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SupermarketReturnItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "supermarketreturn_id", referencedColumnName = "id")
    @JsonIgnoreProperties("supermarketReturnItems")
    private SupermarketReturn supermarketreturn;

    @ManyToOne
    @JoinColumn(name = "supermarketorderitem_id" , referencedColumnName = "id")
    private SupermarketOrderItem supermarketorderitem;

    private double quantity;

}
