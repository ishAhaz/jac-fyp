package lk.jac.notification.dao;

import lk.jac.notification.entity.Notification;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @Query("SELECT n FROM Notification n WHERE n.deleteddatetime IS NULL ORDER BY n.createddatetime DESC")
    List<Notification> findAllActive();

    @Query("SELECT n FROM Notification n WHERE n.id = :id AND n.deleteddatetime IS NULL")
    Notification findActiveById(Long id);

    // Used by DashboardController.getRecentAlerts() for the role-based
    // "recent alerts" widget — a user can hold multiple roles (see
    // User.getRoles()), so this takes a list of role ids, not a single one.
    @Query("SELECT n FROM Notification n " +
            "WHERE n.role.id IN :roleIds " +
            "AND n.deleteddatetime IS NULL " +
            "ORDER BY n.createddatetime DESC")
    List<Notification> findRecentByRoleIds(@Param("roleIds") List<Integer> roleIds, Pageable pageable);



    List<Notification> findByRole_IdInAndDeleteddatetimeIsNullOrderByCreateddatetimeDesc(Collection<Integer> roleIds);;
}