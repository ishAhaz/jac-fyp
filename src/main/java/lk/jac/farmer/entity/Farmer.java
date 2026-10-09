package lk.jac.farmer.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lk.jac.common.District;
import lk.jac.common.EncryptionConverter;
import lk.jac.common.Status;
import lk.jac.user.entity.User;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(name = "farmer")
@Data
@AllArgsConstructor //allargument constructor
@NoArgsConstructor //empty constructor
@ToString(exclude = "crops")
@EqualsAndHashCode(exclude = "crops")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Farmer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String fullname;

    @Column(unique = true)
    private String  number;

    private String nic;
    private String mobileno;
    private String email;

    private String landno;
    private String address;
    private String bankname;
    private String bankbranch;

    @Convert(converter = EncryptionConverter.class)
    private String accountno;

    private LocalDateTime addeddatetime;
    private LocalDateTime updateddatetime;
    private LocalDateTime deleteddatetime;
    private String bankbranchno ;


    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private District district;


    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    private Double dueamount;
    private Double creditlimit;

    @ManyToOne
    @JoinColumn(name = "user_id" ,referencedColumnName = "id")
    private User user;

    private Boolean compost;

    @OneToMany(mappedBy = "farmer", cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JsonIgnoreProperties("farmer")
    private Set<CropHasFarmer> crops;










}
