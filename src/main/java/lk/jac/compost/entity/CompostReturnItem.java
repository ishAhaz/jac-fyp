package lk.jac.compost.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "compostreturnitem")

@Data
@AllArgsConstructor //allargument constructor
@NoArgsConstructor //empty constructor
@ToString(exclude = "compostreturn")
@EqualsAndHashCode(exclude = "compostreturn")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CompostReturnItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "compostreturn_id", referencedColumnName = "id")
    @JsonIgnoreProperties("compostReturnItems")
    private CompostReturn compostreturn;

    @ManyToOne
    @JoinColumn(name = "compostsaleitem_id", referencedColumnName = "id")
    private CompostSaleItem compostsaleitem;

    private String quantity;

}
