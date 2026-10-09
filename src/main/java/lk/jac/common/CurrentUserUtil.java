package lk.jac.common;

import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Small static helper so controllers don't need to repeat
 * SecurityContextHolder boilerplate everywhere.
 */
public class CurrentUserUtil {

    private CurrentUserUtil() {
        // utility class - no instances
    }

    public static String getCurrentUsername() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}