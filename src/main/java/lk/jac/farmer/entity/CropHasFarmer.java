package lk.jac.farmer.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lk.jac.common.StatusReject;
import lk.jac.crop.entity.CropListManagement;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "crop_has_farmer")

@Data
@AllArgsConstructor //allargument constructor
@NoArgsConstructor //empty constructor
@ToString(exclude = "farmer")
@EqualsAndHashCode(exclude = "farmer")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CropHasFarmer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "crop_id" ,referencedColumnName = "id")
    private CropListManagement cropListManagement;

    @ManyToOne
    @JoinColumn(name ="farmer_id", referencedColumnName = "id")
    private Farmer farmer;

    private Double price;
    private LocalDateTime deleteddatetime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusReject status;


}
