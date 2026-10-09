package lk.jac.grn.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lk.jac.common.ProcessStatus;
import lk.jac.crop.entity.CropPurchase;
import lk.jac.user.entity.User;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "grncrop")

@Data
@AllArgsConstructor //allargument constructor
@NoArgsConstructor //empty constructor
@ToString(exclude = "grnCropItems")
@EqualsAndHashCode(exclude = "grnCropItems")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GrnCrop {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(unique = true)
    private String grncropnumber;

    @ManyToOne
    @JoinColumn(name = "croppurchase_id", referencedColumnName = "id")
    @JsonIgnoreProperties("cropPurchaseItems")
    private CropPurchase cropPurchase;

   private LocalDate recieveddate;
   private String note;

    @ManyToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProcessStatus grnstatus;
    //Pending,Complete,Partial,Rejected

    private LocalDateTime addeddatetime;
    private LocalDateTime updateddatetime;
    private Double totalprice;

    @OneToMany(mappedBy = "grnCrop", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("grnCrop")
    private List<GrnCropItem> grnCropItems = new ArrayList<>();



}
