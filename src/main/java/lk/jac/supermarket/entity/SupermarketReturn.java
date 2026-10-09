package lk.jac.supermarket.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lk.jac.common.ReturnStatus;
import lk.jac.user.entity.User;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "supermarketreturn")

@Data
@AllArgsConstructor //allargument constructor
@NoArgsConstructor //empty constructor
@ToString(exclude = "supermarketReturnItems")
@EqualsAndHashCode(exclude = "supermarketReturnItems")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SupermarketReturn {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

   @ManyToOne
    @JoinColumn(name = "supermarketorder_id", referencedColumnName = "id")
    private SupermarketOrder supermarketorder;

    private String reason;
    private LocalDate returndate;

    @ManyToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReturnStatus returnstatus;



    private LocalDateTime addeddatetime;
    private LocalDateTime updateddatetime;
    private LocalDateTime deleteddatetime;

    private String returnid;

    @OneToMany(mappedBy = "supermarketreturn", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("supermarketreturn")
    private List<SupermarketReturnItem> supermarketReturnItems;

}
