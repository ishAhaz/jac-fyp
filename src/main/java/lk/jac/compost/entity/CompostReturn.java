package lk.jac.compost.entity;

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
@Table(name = "compostreturn")

@Data
@AllArgsConstructor //allargument constructor
@NoArgsConstructor //empty constructor
@ToString(exclude = "compostReturnItems")
@EqualsAndHashCode(exclude = "compostReturnItems")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CompostReturn {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String reason;
    private LocalDate returndate;

    @ManyToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

   @ManyToOne
    @JoinColumn(name  = "compostsale_id", referencedColumnName = "id")
    private CompostSale compostsale;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReturnStatus returnstatus;
    private LocalDateTime addeddatetime;
    private LocalDateTime updateddatetime;
    private LocalDateTime deleteddatetime;

    private String returnid;

    @OneToMany(mappedBy = "compostreturn" , cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("compostreturn")
    private List<CompostReturnItem> compostReturnItems;

}
