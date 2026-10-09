package lk.jac.compost.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lk.jac.crop.entity.CropListManagement;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "compost_has_crop")
@Data
@EqualsAndHashCode(exclude = {"compost"})
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CompostHasCrop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "compost_id")
    @JsonIgnoreProperties({"ingredients", "crops", "user", "description",
            "addeddatetime", "updateddatetime", "deleteddatetime"})
    private Compost compost;

    @ManyToOne
    @JoinColumn(name = "crop_id")
    @JsonIgnoreProperties({"user", "addeddatetime", "updateddatetime",
            "deleteddatetime", "note", "status"})
    private CropListManagement crop;

    private Double qtyperacre;
}