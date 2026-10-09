package lk.jac.crop.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lk.jac.common.StatusPending;
import lk.jac.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "cropprice")

@Data
@AllArgsConstructor //allargument constructor
@NoArgsConstructor //empty constructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CropPrice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private Double suggestedpriceperkg;
    private LocalDateTime addeddatetime;
    private LocalDateTime updateddatetime;

    @ManyToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "crop_id", referencedColumnName = "id")
    @JsonIgnoreProperties("cropPrices")
    private CropListManagement crop;

    private Double markupprice;
    private Double realprice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusPending status;
    //Active','Inactive','Pending'

    private String priceid;

}
