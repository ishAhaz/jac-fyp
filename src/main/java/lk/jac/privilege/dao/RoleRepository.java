package lk.jac.privilege.dao;

import lk.jac.privilege.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoleRepository extends JpaRepository<Role,Integer> {
    List<Role> findByNameNot(String name);
        Role findByNameIgnoreCase(String name);

}
