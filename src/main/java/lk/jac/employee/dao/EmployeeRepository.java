package lk.jac.employee.dao;

import lk.jac.employee.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EmployeeRepository extends JpaRepository<Employee,Integer> {

    //insert update wage crud liynna one naha, ewa okkom thyenwa meke

    @Query("SELECT COUNT(e) FROM Employee e WHERE YEAR(e.addeddatetime) = :year AND MONTH(e.addeddatetime) = :month")
    Integer countByYearAndMonth(@Param("year") int year, @Param("month") int month);


    // EmployeeRepository edit
    Employee findByIdAndDeleteddatetimeIsNull(Integer id);

    //duplicate
    Employee findByNicAndDeleteddatetimeIsNull(String nic);
    Employee findByMobilenoAndDeleteddatetimeIsNull(String mobileno);
    Employee findByEmailAndDeleteddatetimeIsNull(String email);

    @Query("SELECT new lk.jac.employee.entity.Employee(e.id, e.fullname, e.callingname, " +
            "e.nic, e.gender, e.email, e.mobileno, e.designation_id, e.dob, e.employeestatus_id) " +
            "FROM Employee e WHERE e.deleteddatetime IS NULL")
    List<Employee> getSelectedColumns();

    //for number , user control
    @Query(value = "SELECT new Employee(e.id, e.number, e.callingname , e.email) FROM Employee e WHERE e.deleteddatetime IS NULL")
    List<Employee> getEmployeeDataForDropdown();

    List<Employee> findAllByDeleteddatetimeIsNull();
}
