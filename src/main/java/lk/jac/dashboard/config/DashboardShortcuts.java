package lk.jac.dashboard.config;

import lk.jac.dashboard.dto.Shortcut;

import java.util.List;
import java.util.Map;

public class DashboardShortcuts {

    public static final Map<String, List<Shortcut>> ROLE_SHORTCUTS = Map.of(

            // ══════════════════════════════════════════
            // ADMIN — full access to every module
            // ══════════════════════════════════════════
            "Admin", List.of(
                    new Shortcut("Manage Privileges",       "/privilege/privilegelist",      "fa-shield-halved"),
                    new Shortcut("Manage User Accounts",    "/user/usermanagement",          "fa-users-gear"),
                    new Shortcut("Add Employee",            "/employee/employeelist",        "fa-user-plus"),
                    new Shortcut("Manage Designations",     "/employee/designations",        "fa-sitemap"),
                    new Shortcut("Farmer Registration",     "/farmer/farmerlist",             "fa-id-card"),
                    new Shortcut("Supplier Management",     "/ingredient/supplier",          "fa-truck-ramp-box"),
                    new Shortcut("View Farmer Reports",     "/reports/farmerreport",         "fa-chart-line"),
                    new Shortcut("View Ingredient Reports", "/reports/ingredientreport",     "fa-boxes-stacked"),
                    new Shortcut("View Order Reports",      "/reports/purchaseorderreport",  "fa-file-invoice"),
                    new Shortcut("View Crop Reports",       "/reports/cropreport",           "fa-seedling")
            ),

            // ══════════════════════════════════════════
            // MANAGER — full access to every module
            // ══════════════════════════════════════════
            "Manager", List.of(
                    new Shortcut("Manage Privileges",       "/privilege/privilegelist",      "fa-shield-halved"),
                    new Shortcut("Manage User Accounts",    "/user/usermanagement",          "fa-users-gear"),
                    new Shortcut("Add Employee",            "/employee/employeelist",        "fa-user-plus"),
                    new Shortcut("Suggestion Prices",       "/crop/cropsuggestionprice",     "fa-lightbulb"),
                    new Shortcut("Invoice Management",      "/invoice/invoicelist",          "fa-file-invoice-dollar"),
                    new Shortcut("View Farmer Reports",     "/reports/farmerreport",         "fa-chart-line"),
                    new Shortcut("View Ingredient Reports", "/reports/ingredientreport",     "fa-boxes-stacked"),
                    new Shortcut("View Order Reports",      "/reports/purchaseorderreport",  "fa-file-invoice"),
                    new Shortcut("View Crop Reports",       "/reports/cropreport",           "fa-seedling")
            ),

            // ══════════════════════════════════════════
            // OFFICER — GRN + Quality Check focused
            // (matches Rule 4 exactly: only modules Officer
            // actually has select/update access to)
            // ══════════════════════════════════════════
            "Officer", List.of(
                    new Shortcut("GRN - Ingredient",         "/grn/grningredients",            "fa-flask"),
                    new Shortcut("GRN - Crop",                "/grn/grncrop",                   "fa-seedling"),
                    new Shortcut("Ingredient Quality Check", "/ingredient/ingredientquality",  "fa-magnifying-glass-chart"),
                    new Shortcut("Crop Quality Check",       "/crop/cropquality",               "fa-magnifying-glass-chart"),
                    new Shortcut("Crop Purchase Orders",     "/crop/croppurchase",              "fa-file-invoice"),
                    new Shortcut("Crop Inventory",           "/crop/cropinventory",             "fa-boxes-stacked"),
                    new Shortcut("Compost Sales",            "/compost/compostsale",            "fa-sack-dollar"),
                    new Shortcut("Supermarket Orders",       "/supermarket/supermarketorder",   "fa-cart-shopping")
            ),

            "Clerk", List.of(
                    new Shortcut("Crop Purchase Order",       "/crop/croppurchase",             "fa-file-invoice"),
                    new Shortcut("Ingredient Purchase Order", "/ingredient/purchaseorder",      "fa-cart-plus"),
                    new Shortcut("Farmer Registration",       "/farmer/farmerlist",             "fa-id-card"),
                    new Shortcut("Supplier Management",       "/ingredient/supplier",           "fa-truck-ramp-box"),
                    new Shortcut("Compost Return",            "/compost/compostreturn",         "fa-rotate-left"),
                    new Shortcut("Supermarket Orders",        "/supermarket/supermarketorder",  "fa-cart-shopping"),
                    new Shortcut("Invoice Management",        "/invoice/invoicelist",           "fa-file-invoice-dollar"),
                    new Shortcut("Payment Management",        "/payments/paymentlist",          "fa-hand-holding-dollar")
            ),

            "Farmer", List.of(
                    new Shortcut("My Compost Orders",         "/compost/mycompostorder",              "fa-seedling"),
                    new Shortcut("Place New Compost Order",   "/compost/mycompostorder?new=true",     "fa-cart-plus"),
                    new Shortcut("My Invoices",       "/invoice/myinvoices",             "fa-file-invoice"),
                     new Shortcut("My Account",                "/user/account",                          "fa-circle-user")
            ),

            "Supermarket", List.of(
                    new Shortcut("My Crop Orders",            "/supermarket/mycroporder",              "fa-cart-shopping"),
                    new Shortcut("Place New Crop Order",      "/supermarket/mycroporder?new=true",     "fa-cart-plus"),
                    new Shortcut("My Invoices",          "/invoice/myinvoices",                 "fa-file-invoice"),
                    new Shortcut("My Account",                "/user/account",                           "fa-circle-user")
            ),
            "Supplier", List.of(
                    new Shortcut("Ingredient Orders",         "/ingredient/purchaseorder",              "fa-seedling"),
                    new Shortcut("My Invoices",       "/invoice/myinvoices",             "fa-file-invoice"),
                    new Shortcut("My Account",                "/user/account",                          "fa-circle-user")
            )

    );

    public static List<Shortcut> getForRole(String roleName) {
        return ROLE_SHORTCUTS.getOrDefault(roleName, List.of());
    }
}