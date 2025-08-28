package com.example.postfolio.config;

import com.example.postfolio.jobMatchingEngine.service.JobMatchingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

@Configuration
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
public class CacheConfig {

    private final JobMatchingService jobMatchingService;

    // Log cache statistics every hour (Redis handles expiration automatically)
    @Scheduled(fixedRate = 3600000) // 1 hour in milliseconds
    public void logCacheStatistics() {
        log.info("Cache statistics: {}", jobMatchingService.getCacheStats());
    }
}