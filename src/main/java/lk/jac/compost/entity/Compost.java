package lk.jac.compost.entity;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lk.jac.common.Status;
import lk.jac.common.Unit;
import lk.jac.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(name = "compost")

@Data
@EqualsAndHashCode(exclude = {"ingredients", "crops"})
@AllArgsConstructor //allargument constructor
@NoArgsConstructor //empty constructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Compost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;


   private String name;
   private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @Column(unique = true, nullable = false)
    private String number;

    @ManyToOne
    @JoinColumn(name = "user_id",referencedColumnName = "id")
    @JsonIgnoreProperties({
            "password", "email", "addeddatetime", "updateddatetime",
            "deleteddatetime", "note", "imageBase64", "imageRemoved",
            "employee", "roles", "status"
    })
    private User user;

    private LocalDateTime addeddatetime;
    private LocalDateTime updateddatetime;
    private LocalDateTime deleteddatetime;


    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Unit unit;


 @OneToMany(mappedBy = "compost", cascade = CascadeType.ALL, orphanRemoval = true)
 private Set<CompostHasIngredient> ingredients;

 @OneToMany(mappedBy = "compost", cascade = CascadeType.ALL, orphanRemoval = true)
 private Set<CompostHasCrop> crops;


 public Compost(Integer id, String number, String name, Status status) {
  this.id = id;
  this.number = number;
  this.name = name;
  this.status = status;


 }

}
