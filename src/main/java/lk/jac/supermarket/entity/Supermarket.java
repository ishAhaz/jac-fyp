package lk.jac.supermarket.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lk.jac.common.District;
import lk.jac.common.Status;
import lk.jac.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "supermarket")

@Data
@AllArgsConstructor //allargument constructor
@NoArgsConstructor //empty constructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Supermarket {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private District district;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    private String name;
    private String branch;
    private String contactperson;
    private String contactpersonno;
    private String address;
    private String email;
    private String number;
    private String businessregno;
    private String landnum;
    private Double creditlimit;
   private Double dueamount;
   private String note;

    private LocalDateTime addeddatetime;
    private LocalDateTime updateddatetime;
    private LocalDateTime deleteddatetime;

    @ManyToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    public Supermarket(Integer id,String name, String contactperson, String contactpersonno,
                       String address,String businessregno,String email,Status status){
        this.name = name;
        this.contactperson = contactperson;
        this.contactpersonno = contactpersonno;
        this.address = address;
        this.businessregno = businessregno;
        this.status = status;
        this.email = email;
        this.id = id;
    }

}
