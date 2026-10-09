package lk.jac.config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;

@Configuration
@EnableWebSecurity
public class WebConfig {

    // filter chain
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests((auth) -> {
                    auth
                            // ── public ─────────────────────────────────
                            .requestMatchers("/login").permitAll()
                            .requestMatchers("/createadmin").permitAll()
                            .requestMatchers("/css/**", "/images/**", "/js/**").permitAll()

                            // ── main ───────────────────────────────────
                            // Driver removed. All remaining roles land on the dashboard.
                            .requestMatchers("/dashboard/**")
                               .hasAnyAuthority("Admin", "Manager", "Clerk", "Officer", "Farmer", "Supermarket","Supplier")
                            .requestMatchers("/notification/**").hasAnyAuthority("Admin", "Manager")

                            // ── compost ────────────────────────────────
                            .requestMatchers("/compost/compostlist/**").hasAnyAuthority("Admin", "Manager", "Clerk", "Officer")
                            .requestMatchers("/compost/compostprice/**").hasAnyAuthority("Admin", "Manager", "Clerk")
                            .requestMatchers("/compost/compostsale/**").hasAnyAuthority("Admin", "Manager", "Clerk", "Officer")
                            .requestMatchers("/compost/compostreturn/**").hasAnyAuthority("Admin", "Manager", "Clerk", "Officer")
                            .requestMatchers("/compost/mycompostorder/**").hasAnyAuthority("Admin", "Manager", "Farmer")

                            // ── crop ───────────────────────────────────
                            .requestMatchers("/crop/croplist/**").hasAnyAuthority("Admin", "Manager", "Clerk", "Officer","Farmer","Supermarket")
                            .requestMatchers("/crop/croppurchase/**").hasAnyAuthority("Admin", "Manager", "Clerk", "Officer")
                            .requestMatchers("/crop/cropquality/**").hasAnyAuthority("Admin", "Manager", "Clerk", "Officer")
                            .requestMatchers("/crop/cropinventory/**").hasAnyAuthority("Admin", "Manager", "Clerk", "Officer")
                            .requestMatchers("/crop/cropprice/**").hasAnyAuthority("Admin", "Manager", "Clerk")
                            .requestMatchers("/crop/cropsuggestionprice/**").hasAnyAuthority("Admin", "Manager")

                            // ── employee ───────────────────────────────
                            .requestMatchers("/employee/employeelist/**").hasAnyAuthority("Admin", "Manager")
                            .requestMatchers("/employee/designations/**").hasAnyAuthority("Admin", "Manager")

                            // ── farmer ─────────────────────────────────
                            .requestMatchers("/farmer/farmerlist/**").hasAnyAuthority("Admin", "Manager", "Clerk")

                            // ── grn ────────────────────────────────────
                            .requestMatchers("/grn/grningredients/**").hasAnyAuthority("Admin", "Manager", "Clerk", "Officer")
                            .requestMatchers("/grn/grncrop/**").hasAnyAuthority("Admin", "Manager", "Clerk", "Officer")

                            // ── ingredient ─────────────────────────────
                            .requestMatchers("/ingredient/ingredientlist/**").hasAnyAuthority("Admin", "Manager", "Clerk", "Officer")
                            .requestMatchers("/ingredient/ingredientquality/**").hasAnyAuthority("Admin", "Manager", "Clerk", "Officer")
                            .requestMatchers("/ingredient/ingredientinventory/**").hasAnyAuthority("Admin", "Manager", "Clerk", "Officer")
                            .requestMatchers("/ingredient/ingredientprice/**").hasAnyAuthority("Admin", "Manager", "Clerk")
                            .requestMatchers("/ingredient/suggestionpricein/**").hasAnyAuthority("Admin", "Manager")
                            .requestMatchers("/ingredient/purchaseorder/**").hasAnyAuthority("Admin", "Manager", "Clerk")
                            .requestMatchers("/ingredient/supplier/**").hasAnyAuthority("Admin", "Manager", "Clerk")

                            // ── invoice ────────────────────────────────
                            .requestMatchers("/invoice/invoicelist/**").hasAnyAuthority("Admin", "Manager", "Clerk")
                            .requestMatchers("/invoice/myinvoices/**").hasAnyAuthority("Admin", "Manager", "Supermarket","Suppliers","Farmers")

                            // ── privilege ──────────────────────────────
                            .requestMatchers("/privilege/**").hasAnyAuthority("Admin", "Manager")


                            // ── supermarket ────────────────────────────
                            .requestMatchers("/supermarket/supermarketlist/**").hasAnyAuthority("Admin", "Manager", "Clerk")
                            .requestMatchers("/supermarket/supermarketorder/**").hasAnyAuthority("Admin", "Manager", "Clerk", "Officer")
                            .requestMatchers("/supermarket/supermarketreturn/**").hasAnyAuthority("Admin", "Manager", "Clerk", "Officer")
                            .requestMatchers("/supermarket/mycroporder/**").hasAnyAuthority("Admin", "Manager", "Supermarket")

                            // ── user ───────────────────────────────────
                            .requestMatchers("/user/usermanagement/**").hasAnyAuthority("Admin", "Manager")
                            .requestMatchers("/user/account/**")
                                .hasAnyAuthority("Admin", "Manager", "Clerk", "Officer", "Farmer", "Supermarket","Supplier")

                            // ── payments ───────────────────────────────
                            .requestMatchers("/payments/paymentlist/**").hasAnyAuthority("Admin", "Manager", "Clerk")
                            .requestMatchers("/payments/expensepaymentlist/**").hasAnyAuthority("Admin", "Manager", "Clerk")

                            // ── reports ────────────────────────────────
                            .requestMatchers("/reports/farmerreport/**").hasAnyAuthority("Admin", "Manager")
                            .requestMatchers("/reports/ingredientreport/**").hasAnyAuthority("Admin", "Manager")
                            .requestMatchers("/reports/purchaseorderreport/**").hasAnyAuthority("Admin", "Manager")
                            .requestMatchers("/reports/cropreport/**").hasAnyAuthority("Admin", "Manager")

                            .anyRequest().authenticated();
                })
                // login
                .formLogin((login) -> {
                    login.loginPage("/login")
                            .loginProcessingUrl("/login")
                            .successHandler(jsonSuccessHandler())
                            .failureHandler(jsonFailureHandler())
                            .usernameParameter("username")
                            .passwordParameter("password");
                })
                .logout((logout) -> {
                    logout.logoutUrl("/logout")
                            .clearAuthentication(true)
                            .logoutSuccessUrl("/login");
                })
                .exceptionHandling((error) -> {
                    error.accessDeniedPage("/errorpage");
                })
                // means to access data in js file
                .csrf((csrf) -> {
                    csrf.disable();
                });
        return http.build();
    }

    // password encoder
    @Bean
    public BCryptPasswordEncoder bCryptPasswordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // returns JSON instead of a redirect, so login.js gets {success, message}
    @Bean
    public AuthenticationSuccessHandler jsonSuccessHandler() {
        return (request, response, authentication) -> {
            response.setContentType("application/json");
            response.setStatus(HttpServletResponse.SC_OK);
            response.getWriter().write("{\"success\": true, \"message\": \"Login successful\"}");
        };
    }

    @Bean
    public AuthenticationFailureHandler jsonFailureHandler() {
        return (request, response, exception) -> {
            response.setContentType("application/json");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"success\": false, \"message\": \"Invalid username or password.\"}");
        };
    }
}