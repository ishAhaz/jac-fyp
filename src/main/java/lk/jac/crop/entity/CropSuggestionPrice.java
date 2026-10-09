package lk.jac.crop.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lk.jac.common.SuggestionStatus;
import lk.jac.farmer.entity.CropHasFarmer;
import lk.jac.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "cropsuggetionprice")
@Data
@AllArgsConstructor //allargument constructor
@NoArgsConstructor //empty constructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CropSuggestionPrice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private Double suggestedprice;
    private LocalDateTime suggesteddatetime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SuggestionStatus status;
  //('Pending','Approved','Rejected')

    private LocalDateTime reviewdatetime;

    @ManyToOne
    @JoinColumn(name = "User_id", referencedColumnName = "id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "crop_has_farmer_id", referencedColumnName = "id")
    private CropHasFarmer crophasfarmer;

   private Double farmerprice;
   private String note;





}
