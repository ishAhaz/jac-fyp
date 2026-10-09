package lk.jac.privilege.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity          //
@Table(name = "module")  //
@Data
@AllArgsConstructor
@NoArgsConstructor

public class AppModule {

    @Id                  //
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private String name; //
}