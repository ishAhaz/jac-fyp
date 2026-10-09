package lk.jac.crop.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lk.jac.common.Grade;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "cropinventory",
uniqueConstraints = @UniqueConstraint(columnNames = {"crop_id","grade"}))

@Data
@AllArgsConstructor //allargument constructor
@NoArgsConstructor //empty constructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CropInventory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "crop_id", referencedColumnName = "id")
    private CropListManagement crop;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Grade grade;

    private Double currentquantity;
    private LocalDateTime lastupdatetime;





}
