package lk.jac.employee.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "designation")

@Data
@AllArgsConstructor //allargument constructor
@NoArgsConstructor //empty constructor
public class Designation {

@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)    
private Integer id;
private String name;

private LocalDateTime addeddatetime;
private LocalDateTime updateddatetime;
private LocalDateTime deleteddatetime;

private String designationid;

}
