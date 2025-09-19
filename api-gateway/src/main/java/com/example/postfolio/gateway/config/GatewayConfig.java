package com.example.postfolio.gateway.config;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.time.Duration;

@Configuration
public class GatewayConfig {

        @Bean
        public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
                System.out.println("=== Creating Custom Route Locator ===");
                return builder.routes()
                                // Backend API routes (all /api/** except /api/ai/**)
                                .route("backend-api", r -> {
                                        System.out.println("Configuring backend-api route for /api/**");
                                        return r
                                                        .path("/api/**")
                                                        .and()
                                                        .not(p -> p.path("/api/ai/**"))
                                                        .uri("lb://postfolio-backend");
                                })

                                // AI Service routes
                                .route("ai-service", r -> {
                                        System.out.println("Configuring ai-service route for /api/ai/**");
                                        return r
                                                        .path("/api/ai/**")
                                                        .uri("lb://ai-service");
                                })

                                // Health check route
                                .route("health-check", r -> {
                                        System.out.println("Configuring health-check route");
                                        return r
                                                        .path("/health")
                                                        .filters(f -> f.setPath("/actuator/health"))
                                                        .uri("lb://postfolio-backend");
                                })

                                .build();
        }

        @Bean
        public CorsWebFilter corsWebFilter() {
                System.out.println("=== CORS Filter Bean Created ===");
                CorsConfiguration corsConfig = new CorsConfiguration();
                corsConfig.setAllowCredentials(true);

                // Explicitly allow only localhost:3000 for the frontend
                corsConfig.addAllowedOrigin("http://localhost:3000");
                corsConfig.addAllowedOrigin("http://127.0.0.1:3000");

                corsConfig.addAllowedHeader("*");
                corsConfig.addAllowedMethod("GET");
                corsConfig.addAllowedMethod("POST");
                corsConfig.addAllowedMethod("PUT");
                corsConfig.addAllowedMethod("DELETE");
                corsConfig.addAllowedMethod("OPTIONS");
                corsConfig.addAllowedMethod("PATCH");
                corsConfig.setMaxAge(3600L);

                System.out.println("CORS Config: " + corsConfig);
                System.out.println("Allowed Origins: " + corsConfig.getAllowedOrigins());

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", corsConfig);

                return new CorsWebFilter(source);
        }
}