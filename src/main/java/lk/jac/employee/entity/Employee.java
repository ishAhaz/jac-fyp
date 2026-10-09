package lk.jac.employee.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lk.jac.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "employee")

@Data
@AllArgsConstructor //allargument constructor
@NoArgsConstructor //empty constructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Employee {

@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)    
private Integer id;

@Column(unique = true)
private String number; 
private String fullname; 
private String callingname;
private String nic;
private String mobileno;
private String email;
private String address;
private LocalDate dob;
private String gender;
private String note;
private String landno;
private Boolean healthcondition;

private LocalDateTime addeddatetime;
private LocalDateTime updateddatetime;
private LocalDateTime deleteddatetime;

@ManyToOne
@JoinColumn(name = "user_id" ,referencedColumnName = "id")
@JsonIgnore
private User user;


@ManyToOne
@JoinColumn(name = "designation_id",referencedColumnName = "id")
private Designation designation_id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EmployeeStatus employeestatus_id;


    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CivilStatus civilstatus_id;

//alldata/selected
public Employee(Integer id, String fullname, String callingname, String nic,String gender, String email, String mobileno, Designation designation_id, LocalDate dob, EmployeeStatus employeestatus_id){

    this.id = id;
    this.fullname = fullname;
    this.callingname = callingname;
    this.nic = nic;
    this.gender = gender;
    this.email = email;
    this.mobileno = mobileno;
    this.designation_id = designation_id;
    this.employeestatus_id = employeestatus_id;
    this.dob = dob;
}

//alldata/fordropdown
public Employee(Integer id, String number , String callingname, String email){
    this.id = id;
    this.number = number;
    this.callingname = callingname;
    this.email = email;
}
}
