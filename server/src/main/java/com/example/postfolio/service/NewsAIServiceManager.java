package com.example.postfolio.service;

import com.example.postfolio.util.JwtTokenHelper;
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

        private final WebClient.Builder webClientBuilder;
        private final JwtTokenHelper jwtTokenHelper;

        @Value("${ai-service.base-url}")
        private String aiServiceBaseUrl;

        public Map<String, Object> summarizeNews(String newsContent, String targetAudience,
                        int maxLength, String tone,
                        boolean includeEmojis, boolean includeCallToAction) {
                try {
                        log.info("🤖 AI SERVICE CALL: Requesting news summarization");
                        log.info("📊 Request parameters - audience: '{}', maxLength: {}, tone: '{}', emojis: {}, CTA: {}",
                                        targetAudience, maxLength, tone, includeEmojis, includeCallToAction);
                        log.info("📰 Input content length: {} characters", newsContent.length());
                        log.info("📰 Input preview: {}",
                                        newsContent.substring(0, Math.min(100, newsContent.length())) + "...");

                        Map<String, Object> request = Map.of(
                                        "newsContent", newsContent,
                                        "targetAudience", targetAudience,
                                        "maxLength", maxLength,
                                        "tone", tone,
                                        "includeEmojis", includeEmojis,
                                        "includeCallToAction", includeCallToAction);

                        log.info("🚀 Sending request to AI service: {}/api/ai/summarize-news", aiServiceBaseUrl);

                        String authHeader = jwtTokenHelper.getAuthorizationHeader();
                        WebClient.Builder builder = webClientBuilder.baseUrl(aiServiceBaseUrl);

                        if (authHeader != null) {
                                builder = builder.defaultHeader("Authorization", authHeader);
                        }

                        WebClient webClient = builder.build();

                        Mono<Map<String, Object>> response = webClient.post()
                                        .uri("/api/ai/summarize-news")
                                        .bodyValue(request)
                                        .retrieve()
                                        .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
                                        });

                        Map<String, Object> result = response.block();

                        if (result != null && result.containsKey("summarizedContent")) {
                                String summary = (String) result.get("summarizedContent");
                                log.info("✅ AI SERVICE SUCCESS: Received summary from AI service");
                                log.info("🤖 AI GENERATED SUMMARY ({} chars): {}", summary.length(), summary);
                                log.info("📋 Full AI service response: {}", result);

                                // Return in the expected format with 'summary' key for backward compatibility
                                return Map.of(
                                                "summary", summary,
                                                "originalContent", result.getOrDefault("originalContent", ""),
                                                "originalLength", result.getOrDefault("originalLength", 0),
                                                "summarizedLength", result.getOrDefault("summarizedLength", 0),
                                                "success", result.getOrDefault("success", true));
                        } else {
                                log.warn("❌ AI SERVICE FAILED: Invalid response from AI service for news summarization");
                                log.warn("📋 Invalid AI response received: {}", result);
                                return Map.of(
                                                "summary", "News summary unavailable",
                                                "success", false,
                                                "error", "Invalid AI service response");
                        }

                } catch (Exception e) {
                        log.error("❌ AI SERVICE ERROR: Failed to call AI service for news summarization: {}",
                                        e.getMessage(), e);
                        log.error("🔧 AI service URL: {}/api/ai/summarize-news", aiServiceBaseUrl);
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
