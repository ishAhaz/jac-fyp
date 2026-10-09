package lk.jac.notification.controller;

import lk.jac.common.CurrentUserUtil;
import lk.jac.notification.dao.NotificationRepository;
import lk.jac.notification.entity.Notification;
import lk.jac.privilege.checker.PrivilegeChecker;
import lk.jac.privilege.dao.PrivilegeRepository;
import lk.jac.privilege.dao.RoleRepository;
import lk.jac.privilege.entity.Role;
import lk.jac.user.dao.UserRepository;
import lk.jac.user.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.ModelAndView;

import java.time.LocalDateTime;
import java.util.List;

@RestController
public class NotificationController {

    @Autowired
    private NotificationRepository notificationDao;

    @Autowired
    private PrivilegeRepository privilegeDao;

    @Autowired
    private UserRepository userDao;

    @Autowired
    private RoleRepository roleDao;

    private static final String MODULE_NAME = "NOTIFICATION";

    @GetMapping("/notification")
    public ModelAndView notificationPage() {
        ModelAndView notificationUI = new ModelAndView();
        notificationUI.setViewName("notification.html");
        return notificationUI;
    }

    //=======links=======
    //==================
    @GetMapping("/notification/alldata")
    public List<Notification> getAllNotifications() {
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canSelect()) {
            return List.of();
        }

        return notificationDao.findAllActive();
    }

    @GetMapping("/notification/byid/{id}")
    public Notification getById(@PathVariable Long id) {
        return notificationDao.findActiveById(id);
    }

    // Notifications for the currently logged-in user's role — used by the
    // shared topbar bell (notification-bar.js). No privilege check here:
    // every logged-in user is entitled to see notifications aimed at their
    // own role.
    @GetMapping("/notification/allfor")
    public List<Notification> allForCurrentUser() {
        String username = CurrentUserUtil.getCurrentUsername();
        User user = userDao.findByUsername(username);

        if (user == null || user.getRoles() == null || user.getRoles().isEmpty()) {
            return List.of();
        }

        List<Integer> roleIds = user.getRoles().stream()
                .map(Role::getId)
                .toList();

        return notificationDao.findByRole_IdInAndDeleteddatetimeIsNullOrderByCreateddatetimeDesc(roleIds);
    }

    // Role dropdown in the form pulls from /privilege/role/assignable
    // (see notification.js -> loadRoles()) — no dedicated endpoint needed here.

    //=======links=======
    //==================

    //=======crud=======
    //==================

    @PostMapping("/notification/save")
    public String saveData(@RequestBody Notification notification) {

        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canInsert()) {
            return "Access denied: insufficient privilege";
        }

        if (notification.getType() == null || notification.getType().isBlank()) {
            return "Type is required";
        }
        if (notification.getMessage() == null || notification.getMessage().isBlank()) {
            return "Message is required";
        }
        if (notification.getRole() == null || notification.getRole().getId() == null) {
            return "Target role is required";
        }

        try {
            Role role = roleDao.findById(notification.getRole().getId()).orElse(null);
            if (role == null) {
                return "Selected role no longer exists";
            }
            notification.setRole(role);

            User createdBy = userDao.findByUsername(username);
            notification.setUser(createdBy);

            notification.setCreateddatetime(LocalDateTime.now());
            notification.setDeleteddatetime(null);

            notificationDao.save(notification);
            return "OK";
        } catch (Exception e) {
            return e.getMessage();
        }
    }

    @PutMapping("/notification/update")
    public String updateData(@RequestBody Notification notification) {
        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canUpdate()) {
            return "Access denied: insufficient privilege";
        }

        if (notification.getRole() == null || notification.getRole().getId() == null) {
            return "Target role is required";
        }

        try {
            Notification existing = notificationDao.findActiveById(notification.getId());
            if (existing == null) {
                return "Notification not found";
            }

            Role role = roleDao.findById(notification.getRole().getId()).orElse(null);
            if (role == null) {
                return "Selected role no longer exists";
            }
            notification.setRole(role);

            notification.setCreateddatetime(existing.getCreateddatetime());
            notification.setDeleteddatetime(existing.getDeleteddatetime());

            notificationDao.save(notification);
            return "OK";
        } catch (Exception e) {
            return e.getMessage();
        }
    }

    @DeleteMapping("/notification/{id}")
    public String deleteData(@PathVariable Long id) {

        String username = CurrentUserUtil.getCurrentUsername();

        PrivilegeChecker privilege = new PrivilegeChecker(
                privilegeDao.getPrivilegeByUserAndModule(username, MODULE_NAME)
        );

        if (!privilege.canDelete()) {
            return "Access denied: insufficient privilege";
        }

        try {
            Notification existing = notificationDao.findActiveById(id);
            if (existing == null) {
                return "Notification not found";
            }
            existing.setDeleteddatetime(LocalDateTime.now());
            notificationDao.save(existing);
            return "OK";
        } catch (Exception e) {
            return "AJAX error";
        }
    }
}