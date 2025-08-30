package com.example.postfolio.config;

import com.example.postfolio.news.service.NewsAccountService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ApplicationStartupConfig {

    private final NewsAccountService newsAccountService;

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        try {
            log.info("Application startup: Initializing News account...");
            newsAccountService.createNewsAccountIfNotExists();
            log.info("News account initialization completed");
        } catch (Exception e) {
            log.error("Failed to initialize News account", e);
        }
    }
}
