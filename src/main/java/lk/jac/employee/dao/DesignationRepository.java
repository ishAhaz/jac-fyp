package lk.jac.employee.dao;

import lk.jac.employee.entity.Designation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DesignationRepository extends JpaRepository<Designation, Integer> {

    //for edit
    Designation findByIdAndDeleteddatetimeIsNull(Integer deid);
}
