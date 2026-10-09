package lk.jac.privilege.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity          //
@Table(name = "role")    //
@Data
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Role {

    @Id                  //
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private String name; //
}