package lk.jac.dashboard.controller;

import jakarta.servlet.http.HttpServletResponse;
import lk.jac.common.CurrentUserUtil;
import lk.jac.common.StatusPending;
import lk.jac.crop.controller.CropInventoryController;
import lk.jac.dashboard.config.DashboardShortcuts;
import lk.jac.dashboard.config.DashboardStats;
import lk.jac.dashboard.dto.Shortcut;
import lk.jac.dashboard.dto.StatCard;
import lk.jac.farmer.dao.FarmerRepository;
import lk.jac.ingredient.controller.IngredientInventoryController;
import lk.jac.invoice.controller.InvoiceController;
import lk.jac.notification.dao.NotificationRepository;
import lk.jac.notification.entity.Notification;
import lk.jac.privilege.dao.RoleRepository;
import lk.jac.privilege.entity.Role;
import lk.jac.user.dao.UserRepository;
import lk.jac.user.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.ModelAndView;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
public class DashboardController {

    private final FarmerRepository farmerRepository;

    @Autowired
    private IngredientInventoryController ingredientInventoryController;

    @Autowired
    private CropInventoryController cropInventoryController;

    @Autowired
    private UserRepository userDao;

    @Autowired
    private BCryptPasswordEncoder bCryptPasswordEncoder;

    @Autowired
    private RoleRepository roleDao;

    @Autowired
    private NotificationRepository notificationDao;
    @Autowired
    private InvoiceController invoiceController;
    public DashboardController(FarmerRepository farmerRepository) {
        this.farmerRepository = farmerRepository;
    }

    @GetMapping("/dashboard")
    private ModelAndView dashboardPage() {
        ModelAndView dashboardUI = new ModelAndView();
        dashboardUI.setViewName("/dashboards/dashboard.html");
        return dashboardUI;
    }

    //login page
    @GetMapping("/login")
    public ModelAndView loginPage() {
        ModelAndView loginUI = new ModelAndView();
        loginUI.setViewName("login.html");
        return loginUI;
    }

    @GetMapping("/errorpage")
    public ModelAndView errorPagePage() {
        ModelAndView errorPageUI = new ModelAndView();
        errorPageUI.setViewName("/dashboards/errorpage.html");
        return errorPageUI;
    }

    @GetMapping("/components/topbar")
    public ModelAndView topbarComponent(HttpServletResponse response) {
        response.setHeader("Cache-Control", "no-store");

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        ModelAndView topbarUI = new ModelAndView();
        topbarUI.setViewName("components/topbar.html");
        topbarUI.addObject("loggedusername", authentication != null ? authentication.getName() : "-");
        return topbarUI;
    }

    @GetMapping("/createadmin")
    public String createAdmin(){
        User extAdmin = userDao.getByUsername("Admin");
        if(extAdmin==null){
            User admin = new User();
            admin.setUsername("Admin");
            admin.setPassword(bCryptPasswordEncoder.encode("123456"));
            admin.setAddeddatetime(LocalDateTime.now());
            admin.setStatus(StatusPending.Active);

            List<Role> roles = new ArrayList<>();
            roles.add(roleDao.getReferenceById(1));
            admin.setRoles(roles);
            admin.setEmail("admin@gmail.com");
            userDao.save(admin);
            System.out.println("----admin user created-----");
            return "redirect:/login";
        }else {
            return "redirect:/login";
        }
    }


    @GetMapping(value = "/api/dashboard/recent-alerts", produces = "application/json")
    public List<Notification> getRecentAlerts() {
        String username = CurrentUserUtil.getCurrentUsername();
        User currentUser = userDao.findByUsernameAndDeleteddatetimeIsNull(username);

        if (currentUser == null || currentUser.getRoles() == null || currentUser.getRoles().isEmpty()) {
            return List.of();
        }

        List<Integer> roleIds = currentUser.getRoles().stream()
                .map(Role::getId)
                .collect(Collectors.toList());

        return notificationDao.findRecentByRoleIds(roleIds, PageRequest.of(0, 5));
    }

    // ── Role-based Quick Actions ────────────────────────────────
    @GetMapping(value = "/api/dashboard/quick-actions", produces = "application/json")
    public List<Shortcut> getQuickActions() {
        String username = CurrentUserUtil.getCurrentUsername();
        User currentUser = userDao.findByUsernameAndDeleteddatetimeIsNull(username);

        if (currentUser == null || currentUser.getRoles() == null || currentUser.getRoles().isEmpty()) {
            return List.of();
        }

        // Merge + dedupe shortcuts across all roles the user holds (by label)
        Set<String> seenLabels = new LinkedHashSet<>();
        List<Shortcut> merged = new ArrayList<>();

        for (Role role : currentUser.getRoles()) {
            for (Shortcut s : DashboardShortcuts.getForRole(role.getName())) {
                if (seenLabels.add(s.getLabel())) {
                    merged.add(s);
                }
            }
        }
        return merged;
    }


    // ── Role-based Dashboard Stats ──────────────────────────────
    @GetMapping(value = "/api/dashboard/summary", produces = "application/json")
    public List<StatCard> getDashboardSummary() {
        String username = CurrentUserUtil.getCurrentUsername();
        User currentUser = userDao.findByUsernameAndDeleteddatetimeIsNull(username);

        if (currentUser == null || currentUser.getRoles() == null || currentUser.getRoles().isEmpty()) {
            return List.of();
        }

        // Merge + dedupe stat keys across all roles the user holds
        Set<String> seenKeys = new LinkedHashSet<>();
        List<String> mergedKeys = new ArrayList<>();

        for (Role role : currentUser.getRoles()) {
            for (String key : DashboardStats.getForRole(role.getName())) {
                if (seenKeys.add(key)) {
                    mergedKeys.add(key);
                }
            }
        }

        List<StatCard> cards = new ArrayList<>();
        for (String key : mergedKeys) {
            cards.add(buildStatCard(key, currentUser));
        }
        return cards;
    }

    // ── Resolves one stat key into its live value + display styling ──
    private StatCard buildStatCard(String key, User currentUser) {
        switch (key) {
            case "TOTAL_FARMERS":
                return new StatCard("Total Farmers",
                        String.valueOf(farmerRepository.countByDeleteddatetimeIsNull()),
                        "fa-person-digging", "#d1e7dd", "#198754");

//            case "PENDING_ORDERS":
//                return new StatCard("Pending Orders", "0",
//                        "fa-cart-shopping", "#fff3cd", "#ffc107");

            case "CROP_LOW_STOCK":
                return new StatCard("Crop Low Stock Alerts",
                        String.valueOf(cropInventoryController.countOutOfStock()),
                        "fa-triangle-exclamation", "#f8d7da", "#dc3545");

            case "INGREDIENT_LOW_STOCK":
                return new StatCard("Ingredient Low Stock Alerts",
                        String.valueOf(ingredientInventoryController.countOutOfStock()),
                        "fa-triangle-exclamation", "#f8d7da", "#dc3545");

            case "UNPAID_INVOICES":
                return new StatCard("Unpaid Invoices", String.valueOf(invoiceController.countUnpaidInvoices()),
                        "fa-file-invoice-dollar", "#e2d9f3", "#6f42c1");
            // ── Officer / Clerk keys — repos not yet wired, see note below ──
            case "PENDING_CROP_PO":
                return new StatCard("Pending Crop Purchase Orders", "0",
                        "fa-file-invoice", "#fff3cd", "#ffc107");

            case "PENDING_INGREDIENT_PO":
                return new StatCard("Pending Ingredient Purchase Orders", "0",
                        "fa-cart-plus", "#fff3cd", "#ffc107");

            case "PENDING_SUPERMARKET_ORDERS":
                return new StatCard("Pending Supermarket Orders", "0",
                        "fa-cart-shopping", "#fff3cd", "#ffc107");

            // ── Farmer / Supermarket personal keys — repos not yet wired ──
            case "MY_PENDING_COMPOST_ORDERS":
                return new StatCard("My Pending Compost Orders", "0",
                        "fa-seedling", "#fff3cd", "#ffc107");

            case "MY_UNPAID_INVOICES":
                return new StatCard("My Unpaid Invoices", "0",
                        "fa-file-invoice-dollar", "#e2d9f3", "#6f42c1");

            case "MY_PENDING_CROP_ORDERS":
                return new StatCard("My Pending Crop Orders", "0",
                        "fa-cart-shopping", "#fff3cd", "#ffc107");

            default:
                return new StatCard(key, "0", "fa-circle-question", "#e9ecef", "#6c757d");
        }
    }
}