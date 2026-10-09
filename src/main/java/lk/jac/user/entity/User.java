package lk.jac.user.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lk.jac.common.StatusPending;
import lk.jac.employee.entity.Employee;
import lk.jac.farmer.entity.Farmer;
import lk.jac.ingredient.entity.Supplier;
import lk.jac.privilege.entity.Role;
import lk.jac.supermarket.entity.Supermarket;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;

@Entity
@Table(name = "user")

@Data
@AllArgsConstructor //allargument constructor
@NoArgsConstructor //empty constructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String username;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    private String email;



    private LocalDateTime addeddatetime;
    private LocalDateTime updateddatetime;
    private LocalDateTime deleteddatetime;
    private String note ;
    @Lob
   @Column(name = "image", columnDefinition = "MEDIUMBLOB")
    private byte[] image;

    @Transient // ← not a DB column, just for receiving from frontend
    private String imageBase64;

    @Transient
    private boolean imageRemoved;

    //this method to auto-convert byte[] to base64 when serializing to JSON
    @PostLoad
    public void loadImage() {
        if (this.image != null) {
            this.imageBase64 = "data:image/png;base64," +
                    Base64.getEncoder().encodeToString(this.image);
        }
    }

//    Save:   frontend sends imageBase64 string → backend converts to byte[] → saved to DB
//    Load:   DB has byte[] → @PostLoad converts to imageBase64 string → frontend displays it


    @ManyToOne
    @JoinColumn(name = "supplier_id", referencedColumnName = "id")
    @JsonIgnoreProperties("user")
    private Supplier supplier;

    @ManyToOne
    @JoinColumn(name = "employee_id", referencedColumnName = "id")
    @JsonIgnoreProperties("user")
    private Employee employee;

    @ManyToOne
    @JoinColumn(name = "farmer_id", referencedColumnName = "id")
    @JsonIgnoreProperties("user")
    private Farmer farmer;

    @ManyToOne
    @JoinColumn(name = "supermarket_id", referencedColumnName = "id")
    @JsonIgnoreProperties("user")
    private Supermarket supermarket;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccountType accounttype;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusPending status;

    @ManyToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    @JsonIgnoreProperties({"user", "roles", "employee", "farmer", "supermarket", "supplier"})
    private User user;


    @ManyToMany
    @JoinTable(
            name = "user_has_role",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private List<Role> roles;

    public User(Integer id, String username ,  Employee employee ,StatusPending status){
        this.id = id;
        this.username = username;
        this.employee = employee;
        this.status = status;
    }

    public User(Integer id, String username) {
        this.id = id;
        this.username = username;
    }
}
