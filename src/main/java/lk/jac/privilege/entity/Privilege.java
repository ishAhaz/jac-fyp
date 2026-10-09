package lk.jac.privilege.entity;

import jakarta.persistence.*;
import lk.jac.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "privilege")

@Data
@AllArgsConstructor //allargument constructor

@NoArgsConstructor //empty constructor

public class Privilege {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;


    private Boolean privi_select;
    private Boolean privi_update;
    private Boolean privi_insert;
    private Boolean privi_delete;

    private String note;

    private LocalDateTime addeddatetime;
    private LocalDateTime updateddatetime;
    private LocalDateTime deleteddatetime;

   @ManyToOne
    @JoinColumn(name = "module_id",referencedColumnName = "id")
   private AppModule module;

   @ManyToOne
    @JoinColumn(name = "role_id",referencedColumnName = "id")
   private Role role;

   @ManyToOne
   @JoinColumn(name = "user_id", referencedColumnName = "id")
   private User user;

   public Privilege(Integer id,Role role,AppModule module, Boolean privi_select, Boolean privi_insert, Boolean privi_update, Boolean privi_delete) {

       this.id = id;
       this.role = role;
       this.module = module;
       this.privi_select = privi_select;
       this.privi_update = privi_update;
       this.privi_insert = privi_insert;
       this.privi_delete = privi_delete;

   }
}
