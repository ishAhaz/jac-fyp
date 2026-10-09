package lk.jac.notification.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lk.jac.privilege.entity.Role;
import lk.jac.user.entity.User;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notification")

@Data
@AllArgsConstructor //allargument constructor
@NoArgsConstructor //empty constructor
@ToString(exclude = {"user", "role", "module"})
@EqualsAndHashCode(exclude = {"user", "role", "module"})
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String type;
    private String message;

    @ManyToOne
    @JoinColumn(name = "createdby_id", referencedColumnName = "id")
    private User user;

   private String title ;

    @ManyToOne
    @JoinColumn(name = "role_id", referencedColumnName = "id")
    private Role role;



    private LocalDateTime createddatetime;
    private LocalDateTime deleteddatetime;


}