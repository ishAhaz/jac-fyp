package lk.jac.dashboard.config;

import java.util.List;
import java.util.Map;

public class DashboardStats {

    // ══════════════════════════════════════════
    // Stat keys per role — order = display order.
    // Controller computes the actual "value" for
    // each key; this class only decides WHICH
    // cards a role is entitled to see.
    // ══════════════════════════════════════════
    public static final Map<String, List<String>> ROLE_STATS = Map.of(

            "Admin", List.of(
                    "TOTAL_FARMERS", "CROP_LOW_STOCK",
                    "INGREDIENT_LOW_STOCK", "UNPAID_INVOICES"
            ),

            "Manager", List.of(
                    "TOTAL_FARMERS", "CROP_LOW_STOCK",
                    "INGREDIENT_LOW_STOCK", "UNPAID_INVOICES"
            ),

            "Officer", List.of(
                    "TOTAL_FARMERS", "CROP_LOW_STOCK",
                    "INGREDIENT_LOW_STOCK", "UNPAID_INVOICES"
            ),

            "Clerk", List.of(
                    "TOTAL_FARMERS", "CROP_LOW_STOCK",
                    "INGREDIENT_LOW_STOCK", "UNPAID_INVOICES"
            ),

            "Farmer", List.of(
                    "TOTAL_FARMERS", "CROP_LOW_STOCK",
                    "INGREDIENT_LOW_STOCK", "UNPAID_INVOICES"
            ),

            "Supermarket", List.of(
                    "TOTAL_FARMERS", "CROP_LOW_STOCK",
                    "INGREDIENT_LOW_STOCK", "UNPAID_INVOICES"
            ),

            "Supplier", List.of(
                    "TOTAL_FARMERS", "CROP_LOW_STOCK",
                    "INGREDIENT_LOW_STOCK", "UNPAID_INVOICES"
            )
    );

    public static List<String> getForRole(String roleName) {
        return ROLE_STATS.getOrDefault(roleName, List.of());
    }
}