package lk.jac.privilege.dao;

import lk.jac.privilege.entity.AppModule;
import lk.jac.privilege.entity.Privilege;
import lk.jac.privilege.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PrivilegeRepository extends JpaRepository<Privilege,Integer> {

    @Query(value = "SELECT new Privilege (p.id, p.role, p.module, p.privi_select, p.privi_update, p.privi_insert, p.privi_delete) " +
            "FROM Privilege as p " +
            "WHERE p.deleteddatetime is NULL " +
            "AND p.role.name <> 'Admin' ")
    List<Privilege> getSelectedColumns();

    // for byid - exclude deleted
    Privilege findByIdAndDeleteddatetimeIsNull(Integer id);

    // for duplicate check
    Privilege findByRoleAndModuleAndDeleteddatetimeIsNull(Role role, AppModule module);

    // get privilege according to logged user and module (supports multiple roles per user via bit_or)
    @Query(value =
            "SELECT " +
                    "  bit_or(p.privi_select)  as pri_select, " +
                    "  bit_or(p.privi_insert)  as pri_insert, " +
                    "  bit_or(p.privi_update)  as pri_update, " +
                    "  bit_or(p.privi_delete)  as pri_delete " +
                    "FROM privilege p " +
                    "WHERE p.deleteddatetime is NULL " +
                    "  AND p.module_id in (select m.id from module m where m.name = :moduleName) " +
                    "  AND p.role_id in ( " +
                    "        select uhr.role_id from user_has_role uhr " +
                    "        where uhr.user_id in (select u.id from user u where u.username = :username) " +
                    "  )",
            nativeQuery = true)
    PrivilegeProjection getPrivilegeByUserAndModule(@Param("username") String username, @Param("moduleName") String moduleName);
}