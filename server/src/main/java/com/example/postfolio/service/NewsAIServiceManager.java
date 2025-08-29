package com.example.postfolio.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class NewsAIServiceManager {

    private final WebClient webClient;

    @Value("${ai-service.base-url:http://localhost:8081}")
    private String aiServiceBaseUrl;

    public Map<String, Object> summarizeNews(String newsContent, String targetAudience,
            int maxLength, String tone,
            boolean includeEmojis, boolean includeCallToAction) {
        try {
            log.info("Calling AI service for news summarization - target audience: {}", targetAudience);

            Map<String, Object> request = Map.of(
                    "newsContent", newsContent,
                    "targetAudience", targetAudience,
                    "maxLength", maxLength,
                    "tone", tone,
                    "includeEmojis", includeEmojis,
                    "includeCallToAction", includeCallToAction);

            Mono<Map<String, Object>> response = webClient.post()
                    .uri(aiServiceBaseUrl + "/api/ai/summarize-news")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
                    });

            Map<String, Object> result = response.block();

            if (result != null && result.containsKey("summary")) {
                log.info("Successfully received news summary from AI service");
                return result;
            } else {
                log.warn("Invalid response from AI service for news summarization");
                return Map.of(
                        "summary", "News summary unavailable",
                        "success", false,
                        "error", "Invalid AI service response");
            }

        } catch (Exception e) {
            log.error("Error calling AI service for news summarization: {}", e.getMessage(), e);
            return Map.of(
                    "summary", "Error generating news summary",
                    "success", false,
                    "error", e.getMessage());
        }
    }

    public Map<String, Object> summarizeNewsWithDefaults(String newsContent) {
        return summarizeNews(
                newsContent,
                "job seekers",
                500,
                "engaging",
                true,
                true);
    }
}
