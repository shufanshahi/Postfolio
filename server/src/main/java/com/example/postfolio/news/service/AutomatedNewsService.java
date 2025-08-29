package com.example.postfolio.news.service;

import com.example.postfolio.post.service.PostService;
import com.example.postfolio.service.NewsAIServiceManager;
import com.example.postfolio.user.entity.User;
import com.google.gson.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class AutomatedNewsService {

    private final RestTemplate restTemplate;
    private final PostService postService;
    private final NewsAccountService newsAccountService;
    private final NewsAIServiceManager newsAIServiceManager;

    @Value("${news.api.key}")
    private String newsApiKey;

    private static final String NEWS_API_URL = "https://newsapi.org/v2/everything";

    // Job market related keywords for better news filtering
    private static final String[] JOB_KEYWORDS = {
            "job market", "employment trends", "hiring", "career opportunities",
            "tech jobs", "remote work", "salary trends", "workplace", "employment",
            "job prospects", "career development", "skills demand", "future of work",
            "job market outlook", "employment opportunities"
    };

    // Run every hour (0 minutes of every hour)
    @Scheduled(cron = "0 0 * * * *")
    @Async
    public void postHourlyJobNews() {
        log.info("Starting hourly job news fetch and post");

        try {
            // Create news account if it doesn't exist
            newsAccountService.createNewsAccountIfNotExists();

            // Fetch and post news
            String newsContent = fetchJobMarketNews();
            if (newsContent != null && !newsContent.isEmpty()) {
                String processedNews = generateNewsSummary(newsContent);
                postAsNewsAccount(processedNews);
                log.info("Successfully posted hourly news update");
            } else {
                // Fallback to motivational/general job market content
                postFallbackContent();
            }

        } catch (Exception e) {
            log.error("Failed to post hourly news", e);
            // Post fallback content in case of error
            try {
                postFallbackContent();
            } catch (Exception fallbackError) {
                log.error("Failed to post fallback content", fallbackError);
            }
        }
    }

    // Manual trigger for testing
    public CompletableFuture<String> testNewsPosting() {
        return CompletableFuture.supplyAsync(() -> {
            try {
                log.info("Manual news posting test triggered");

                // Create news account if it doesn't exist
                newsAccountService.createNewsAccountIfNotExists();

                String newsContent = fetchJobMarketNews();
                if (newsContent != null && !newsContent.isEmpty()) {
                    String processedNews = generateNewsSummary(newsContent);
                    postAsNewsAccount(processedNews);
                    return "✅ Successfully posted test news: "
                            + processedNews.substring(0, Math.min(100, processedNews.length())) + "...";
                } else {
                    postFallbackContent();
                    return "✅ Posted fallback content as no news was found";
                }

            } catch (Exception e) {
                log.error("Manual news posting test failed", e);
                return "❌ Failed to post news: " + e.getMessage();
            }
        });
    }

    private String fetchJobMarketNews() {
        try {
            String today = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
            String yesterday = LocalDate.now().minusDays(1).format(DateTimeFormatter.ISO_LOCAL_DATE);

            // Build query with job-related keywords
            String query = String.join(" OR ", JOB_KEYWORDS);

            String url = NEWS_API_URL +
                    "?q=(" + query + ")" +
                    "&from=" + yesterday +
                    "&to=" + today +
                    "&language=en" +
                    "&sortBy=popularity" +
                    "&pageSize=5" +
                    "&apiKey=" + newsApiKey;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("User-Agent", "Postfolio-News-Bot/1.0");

            HttpEntity<String> request = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                return extractNewsContent(response.getBody());
            } else {
                log.warn("NewsAPI returned non-success status: {}", response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("Failed to fetch news from NewsAPI", e);
        }

        return null;
    }

    private String extractNewsContent(String jsonResponse) {
        try {
            JsonObject response = JsonParser.parseString(jsonResponse).getAsJsonObject();

            if (response.has("status") && !"ok".equals(response.get("status").getAsString())) {
                log.warn("NewsAPI error: {}", response.get("message").getAsString());
                return null;
            }

            JsonArray articles = response.getAsJsonArray("articles");

            if (articles.size() == 0) {
                log.info("No articles found from NewsAPI");
                return null;
            }

            StringBuilder newsContent = new StringBuilder();
            newsContent.append("📰 Latest Job Market News:\n\n");

            for (int i = 0; i < Math.min(3, articles.size()); i++) {
                JsonObject article = articles.get(i).getAsJsonObject();
                String title = article.get("title").getAsString();
                String description = article.has("description") && !article.get("description").isJsonNull()
                        ? article.get("description").getAsString()
                        : "";

                newsContent.append("🔸 ").append(title).append("\n");
                if (!description.isEmpty()) {
                    newsContent.append(description.substring(0, Math.min(200, description.length())));
                    if (description.length() > 200)
                        newsContent.append("...");
                    newsContent.append("\n\n");
                }
            }

            return newsContent.toString();

        } catch (Exception e) {
            log.error("Failed to parse news response", e);
            return null;
        }
    }

    private String generateNewsSummary(String newsContent) {
        try {
            log.info("Generating news summary using AI service");

            Map<String, Object> aiResponse = newsAIServiceManager.summarizeNews(
                    newsContent,
                    "job seekers and professionals",
                    300,
                    "engaging",
                    true,
                    true);

            if (aiResponse.containsKey("summary")) {
                String summary = (String) aiResponse.get("summary");
                log.info("Successfully generated news summary via AI service");
                return summary;
            } else {
                log.warn("AI service returned invalid response, using fallback");
                return newsContent.length() > 300 ? newsContent.substring(0, 297) + "..." : newsContent;
            }

        } catch (Exception e) {
            log.error("Failed to generate news summary with AI service: {}", e.getMessage());
            // Fallback to truncated original content
            return newsContent.length() > 300 ? newsContent.substring(0, 297) + "..." : newsContent;
        }
    }

    private void postFallbackContent() {
        String[] fallbackPosts = {
                "💼 Job Market Update: The demand for tech professionals continues to grow! Companies are actively seeking skilled developers, data scientists, and cybersecurity experts. Keep building your skills! 🚀 #CareerGrowth",

                "🌟 Career Tip: Remote work opportunities are expanding across industries. Update your LinkedIn profile to highlight your remote work capabilities and digital collaboration skills! 💻 #RemoteWork",

                "📈 Industry Insight: AI and automation are creating new job opportunities rather than just eliminating them. Focus on learning complementary skills to stay ahead! 🤖 #FutureOfWork",

                "🎯 Professional Development: Continuous learning is key in today's job market. Consider upskilling in emerging technologies or improving your soft skills! 📚 #ProfessionalGrowth",

                "💡 Job Search Strategy: Networking remains one of the most effective ways to find opportunities. Engage with your professional community and build meaningful connections! 🤝 #Networking"
        };

        int randomIndex = (int) (Math.random() * fallbackPosts.length);
        String content = fallbackPosts[randomIndex];

        try {
            postAsNewsAccount(content);
            log.info("Posted fallback content successfully");
        } catch (Exception e) {
            log.error("Failed to post fallback content", e);
        }
    }

    private void postAsNewsAccount(String content) {
        try {
            Optional<User> newsAccountOpt = newsAccountService.getNewsAccount();
            if (newsAccountOpt.isEmpty()) {
                log.error("News account not found, cannot post");
                return;
            }

            User newsAccount = newsAccountOpt.get();
            Long profileId = newsAccount.getProfile().getId();

            postService.createPost(profileId, content, null);
            log.info("Successfully posted as news account: {}", content.substring(0, Math.min(50, content.length())));

        } catch (Exception e) {
            log.error("Failed to post as news account", e);
            throw e;
        }
    }

    // Test method specifically for AI service integration
    public String testAIServiceIntegration() {
        try {
            log.info("Testing AI service integration with real news data");

            // Step 1: Fetch real news from news API
            String realNewsContent = fetchJobMarketNews();

            if (realNewsContent == null || realNewsContent.isEmpty()) {
                return "❌ AI Service Integration Test FAILED: Could not fetch real news data from API\n\n" +
                        "Please check your news API configuration and internet connection.";
            }

            log.info("✅ Successfully fetched real news data ({} characters), now testing AI summarization",
                    realNewsContent.length());

            // Step 2: Test AI service with real news content
            Map<String, Object> aiResponse = newsAIServiceManager.summarizeNews(
                    realNewsContent,
                    "job seekers and professionals",
                    280,
                    "engaging",
                    true,
                    true);

            if (aiResponse.containsKey("summary")) {
                String summary = (String) aiResponse.get("summary");
                log.info("✅ AI service integration test successful with real news");
                return "✅ AI Service Integration Test PASSED!\n\n" +
                        "📰 Real News Fetched: " + realNewsContent.length() + " characters\n" +
                        "📰 First 200 chars: " + realNewsContent.substring(0, Math.min(200, realNewsContent.length()))
                        + "...\n\n" +
                        "🤖 AI Generated Summary (" + summary.length() + " chars): " + summary + "\n\n" +
                        "✅ Both News API and AI Service are working correctly!";
            } else {
                String errorMsg = "❌ AI service returned invalid response structure";
                log.error(errorMsg);
                return errorMsg + "\n\n" +
                        "✅ News API worked (fetched " + realNewsContent.length() + " chars)\n" +
                        "❌ AI Service failed\n" +
                        "Response: " + aiResponse.toString();
            }

        } catch (Exception e) {
            String errorMsg = "❌ AI Service Integration Test FAILED: " + e.getMessage();
            log.error(errorMsg, e);
            return errorMsg;
        }
    }
}
