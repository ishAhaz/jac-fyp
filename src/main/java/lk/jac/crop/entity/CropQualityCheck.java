package lk.jac.crop.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lk.jac.common.SuggestionStatus;
import lk.jac.grn.entity.GrnCrop;
import lk.jac.user.entity.User;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "cropqualitycheck")

@Data
@AllArgsConstructor //allargument constructor
@NoArgsConstructor //empty constructor
@ToString(exclude = "cropQualityCheckItems")
@EqualsAndHashCode(exclude = "cropQualityCheckItems")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CropQualityCheck {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private LocalDateTime checkeddate;
    private LocalDateTime updateddatetime;
    private String checkno;

    @ManyToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;



    @ManyToOne
    @JoinColumn(name = "grncrop_id", referencedColumnName = "id")
    private GrnCrop grncrop;

    private LocalDateTime createddatetime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    private SuggestionStatus qualitystatus;

    @OneToMany(mappedBy = "cropQualityCheck", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CropQualityCheckItem> cropQualityCheckItems;













}
