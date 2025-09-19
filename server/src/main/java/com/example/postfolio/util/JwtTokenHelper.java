package com.example.postfolio.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;

@Component
@Slf4j
public class JwtTokenHelper {

    /**
     * Extract the current JWT token from the HTTP request context
     * 
     * @return JWT token without "Bearer " prefix, or null if not found
     */
    public String getCurrentJwtToken() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder
                    .getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                String authHeader = request.getHeader("Authorization");

                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    String token = authHeader.substring(7); // Remove "Bearer " prefix
                    log.debug("Extracted JWT token from request context: {}...",
                            token.substring(0, Math.min(20, token.length())));
                    return token;
                }
            }

            log.warn("No JWT token found in request context");
            return null;

        } catch (Exception e) {
            log.error("Error extracting JWT token from request context", e);
            return null;
        }
    }

    /**
     * Get the Authorization header value with "Bearer " prefix
     * 
     * @return Full Authorization header value or null if not found
     */
    public String getAuthorizationHeader() {
        String token = getCurrentJwtToken();
        return token != null ? "Bearer " + token : null;
    }
}