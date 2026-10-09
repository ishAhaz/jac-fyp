package lk.jac.ingredient.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lk.jac.common.EncryptionConverter;
import lk.jac.common.Status;
import lk.jac.user.entity.User;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(name = "supplier")

@Data
@AllArgsConstructor //allargument constructor
@NoArgsConstructor //empty constructor
@ToString(exclude = "ingredients")
@EqualsAndHashCode(exclude = "ingredients")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Supplier {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String companyname;
    private String contactperson;
    private String address;
    private String email;
    private String mobilenum;


    private String bankname;
    private String branchname;
    private String branchno;
    @Convert(converter = EncryptionConverter.class)
    private String bankaccno;

   @Enumerated(EnumType.STRING)
   @Column(nullable = false)
   private Status status;
   //'Active','Inactive'

    private LocalDateTime addeddatetime;
    private LocalDateTime updateddatetime;
    private LocalDateTime deleteddatetime;

    @ManyToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    private String supplierid;

    @OneToMany(mappedBy = "supplier", cascade = CascadeType.ALL, orphanRemoval = false)
    @JsonIgnoreProperties("supplier")
    private Set<SupplierHasIngredient> ingredients;

    public Supplier(Integer id,String supplierid,String contactperson,String companyname, String mobilenum, String email, Status status
            ,Set<SupplierHasIngredient> ingredients) {
    this.id=id;
    this.companyname=companyname;
    this.contactperson=contactperson;
    this.email=email;
    this.mobilenum=mobilenum;
    this.supplierid=supplierid;
    this.status=status;
    this.ingredients=ingredients;
    }




}
