package com.example.postfolio.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        // Serve interview audio files from classpath
        registry.addResourceHandler("/interview-audio/**")
                .addResourceLocations("classpath:/static/interview-audio/")
                .setCachePeriod(3600);
    }
}
