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
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
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

    // Simplified keywords for better URL compatibility
    private static final String JOB_SEARCH_QUERY = "job market OR employment OR hiring OR career";

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
            String fromDate = LocalDate.now().minusDays(7).format(DateTimeFormatter.ISO_LOCAL_DATE); // Use 7 days
                                                                                                     // instead of 1

            // Build query with job-related keywords - Use simplified query without complex
            // OR operations
            String query = JOB_SEARCH_QUERY;

            String url = NEWS_API_URL +
                    "?q=" + URLEncoder.encode(query, StandardCharsets.UTF_8) +
                    "&from=" + fromDate +
                    "&to=" + today +
                    "&language=en" +
                    "&sortBy=popularity" +
                    "&pageSize=10" + // Increase page size to get more results
                    "&apiKey=" + newsApiKey;

            log.info("Fetching news from URL: {}", url.replace(newsApiKey, "***API_KEY***"));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("User-Agent", "Postfolio-News-Bot/1.0");

            HttpEntity<String> request = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("NewsAPI response received, parsing content...");
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
            log.info("NewsAPI returned {} articles", articles.size());

            if (articles.size() == 0) {
                log.info("No articles found from NewsAPI");
                return null;
            }

            // Add randomness to article selection
            int totalArticles = articles.size();
            int maxArticlesToShow = Math.min(3, totalArticles);

            // Generate random starting point to get different articles each time
            int startIndex = totalArticles > maxArticlesToShow
                    ? (int) (Math.random() * (totalArticles - maxArticlesToShow + 1))
                    : 0;

            log.info("Selecting {} articles starting from index {} out of {} total articles",
                    maxArticlesToShow, startIndex, totalArticles);

            StringBuilder newsContent = new StringBuilder();
            newsContent.append("📰 Latest Job Market News:\n\n");

            for (int i = 0; i < maxArticlesToShow; i++) {
                JsonObject article = articles.get(startIndex + i).getAsJsonObject();
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

            log.info("Successfully extracted news content with {} articles", maxArticlesToShow);
            return newsContent.toString();

        } catch (Exception e) {
            log.error("Failed to parse news response", e);
            return null;
        }
    }

    private String generateNewsSummary(String newsContent) {
        try {
            log.info("Generating news summary using AI service");
            log.info("Input news content ({} chars): {}", newsContent.length(),
                    newsContent.substring(0, Math.min(150, newsContent.length())) + "...");

            Map<String, Object> aiResponse = newsAIServiceManager.summarizeNews(
                    newsContent,
                    "job seekers and professionals on a career platform",
                    400, // Increase target length for better summaries
                    "professional and engaging",
                    true,
                    true);

            log.info("AI service response received: {}", aiResponse);

            if (aiResponse.containsKey("summary")) {
                String summary = (String) aiResponse.get("summary");
                log.info("AI SERVICE GENERATED SUMMARY ({} chars): {}", summary.length(), summary);

                // Check if summary is too short or generic
                if (summary.length() < 50 || summary.toLowerCase().contains("unavailable") ||
                        summary.toLowerCase().contains("not available")) {
                    log.warn("AI service returned poor quality summary, using fallback with original content");
                    log.warn("Poor quality AI summary detected: '{}'", summary);
                    String fallbackSummary = createFallbackSummary(newsContent);
                    log.info("FALLBACK SUMMARY USED ({} chars): {}", fallbackSummary.length(), fallbackSummary);
                    return fallbackSummary;
                }

                log.info("✅ High quality AI summary accepted and will be used");
                return summary;
            } else {
                log.warn("AI service returned invalid response, using fallback");
                log.warn("Invalid AI response structure: {}", aiResponse);
                String fallbackSummary = createFallbackSummary(newsContent);
                log.info("FALLBACK SUMMARY USED ({} chars): {}", fallbackSummary.length(), fallbackSummary);
                return fallbackSummary;
            }

        } catch (Exception e) {
            log.error("Failed to generate news summary with AI service: {}", e.getMessage(), e);
            // Fallback to truncated original content
            String fallbackSummary = createFallbackSummary(newsContent);
            log.info("EXCEPTION FALLBACK SUMMARY USED ({} chars): {}", fallbackSummary.length(), fallbackSummary);
            return fallbackSummary;
        }
    }

    private String createFallbackSummary(String newsContent) {
        log.info("Creating fallback summary from original content ({} chars)", newsContent.length());

        // Create a better fallback summary by extracting key information
        if (newsContent.length() <= 400) {
            log.info("Original content is already short enough, using as-is");
            return newsContent; // Return as-is if already short enough
        }

        // Find the first complete sentence within limit
        String truncated = newsContent.substring(0, 350);
        int lastSentence = Math.max(
                truncated.lastIndexOf('.'),
                Math.max(truncated.lastIndexOf('!'), truncated.lastIndexOf('?')));

        if (lastSentence > 100) {
            String result = newsContent.substring(0, lastSentence + 1);
            log.info("Fallback summary created by sentence boundary ({} chars)", result.length());
            return result;
        } else {
            String result = newsContent.substring(0, 350) + "...";
            log.info("Fallback summary created by character limit ({} chars)", result.length());
            return result;
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

            // Step 1: Create news account if it doesn't exist
            newsAccountService.createNewsAccountIfNotExists();

            // Step 2: Fetch real news from news API
            String realNewsContent = fetchJobMarketNews();

            if (realNewsContent == null || realNewsContent.isEmpty()) {
                return "❌ AI Service Integration Test FAILED: Could not fetch real news data from API\n\n" +
                        "Please check your news API configuration and internet connection.";
            }

            log.info("✅ Successfully fetched real news data ({} characters), now testing AI summarization",
                    realNewsContent.length());

            // Step 3: Test AI service with real news content
            Map<String, Object> aiResponse = newsAIServiceManager.summarizeNews(
                    realNewsContent,
                    "job seekers and professionals on a career platform",
                    350, // Increase target length for test
                    "professional and engaging",
                    true,
                    true);

            if (aiResponse.containsKey("summary")) {
                String summary = (String) aiResponse.get("summary");
                log.info("✅ AI service integration test successful with real news");

                // Check if AI summary is of good quality
                boolean isGoodSummary = summary.length() >= 50 &&
                        !summary.toLowerCase().contains("unavailable") &&
                        !summary.toLowerCase().contains("not available");

                String summaryStatus = isGoodSummary ? "✅ Good quality AI summary"
                        : "⚠️ Poor quality AI summary (using fallback)";

                // If poor quality, generate fallback summary for posting
                String finalSummary = isGoodSummary ? summary : createFallbackSummary(realNewsContent);

                // Step 4: Post the summarized news via news account
                try {
                    postAsNewsAccount(finalSummary);
                    log.info("✅ Successfully posted summarized news via news account");

                    return "✅ AI Service Integration Test PASSED!\n\n" +
                            "📰 Real News Fetched: " + realNewsContent.length() + " characters\n" +
                            "📰 First 200 chars: "
                            + realNewsContent.substring(0, Math.min(200, realNewsContent.length()))
                            + "...\n\n" +
                            "🤖 AI Response (" + summary.length() + " chars): " + summary + "\n" +
                            "📝 " + summaryStatus + "\n" +
                            "📝 Posted Summary (" + finalSummary.length() + " chars): "
                            + finalSummary.substring(0, Math.min(100, finalSummary.length())) + "...\n\n" +
                            "📝 Posted via News Account: ✅ Successfully posted to feed\n\n" +
                            "✅ Complete end-to-end test PASSED! News API → AI Service → Posted to Feed";
                } catch (Exception postError) {
                    log.error("Failed to post summarized news", postError);
                    return "✅ AI Service Integration Test PASSED!\n\n" +
                            "📰 Real News Fetched: " + realNewsContent.length() + " characters\n" +
                            "🤖 AI Generated Summary (" + summary.length() + " chars): " + summary + "\n\n" +
                            "❌ Posting Failed: " + postError.getMessage() + "\n\n" +
                            "✅ News API and AI Service working correctly, but posting failed";
                }
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
