package com.example.aiservice.service;

import com.example.aiservice.client.GeminiClient;
import com.example.aiservice.dto.NewsSummarizationRequest;
import com.example.aiservice.dto.NewsSummarizationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NewsSummarizationAIService {

    private final GeminiClient geminiClient;

    public NewsSummarizationResponse summarizeNews(NewsSummarizationRequest request) {
        try {
            log.info("Starting news summarization for content length: {}", request.getNewsContent().length());

            String prompt = buildNewsSummarizationPrompt(request);
            String geminiResponse = geminiClient.generateContent(prompt);

            // Clean up the response
            String summarizedContent = geminiResponse.trim();

            log.info("Completed news summarization - Original: {} chars, Summarized: {} chars",
                    request.getNewsContent().length(), summarizedContent.length());

            return NewsSummarizationResponse.builder()
                    .originalContent(request.getNewsContent())
                    .summarizedContent(summarizedContent)
                    .originalLength(request.getNewsContent().length())
                    .summarizedLength(summarizedContent.length())
                    .success(true)
                    .build();

        } catch (Exception e) {
            log.error("Error in news summarization", e);

            return NewsSummarizationResponse.builder()
                    .originalContent(request.getNewsContent())
                    .summarizedContent(createFallbackSummary(request.getNewsContent(), request.getMaxLength()))
                    .originalLength(request.getNewsContent().length())
                    .summarizedLength(request.getMaxLength())
                    .success(false)
                    .errorMessage("News summarization failed: " + e.getMessage())
                    .build();
        }
    }

    private String buildNewsSummarizationPrompt(NewsSummarizationRequest request) {
        StringBuilder promptBuilder = new StringBuilder();

        promptBuilder.append("Transform this job market news into an engaging professional social media post.\n\n");

        promptBuilder.append("REQUIREMENTS:\n");
        promptBuilder.append("- Keep it under ").append(request.getMaxLength()).append(" characters\n");
        promptBuilder.append("- Make it engaging and actionable for ").append(request.getTargetAudience()).append("\n");

        if (request.isIncludeEmojis()) {
            promptBuilder.append("- Include relevant emojis\n");
        }

        promptBuilder.append("- Tone should be ").append(request.getTone()).append("\n");
        promptBuilder.append("- Focus on opportunities and career insights\n");
        promptBuilder.append("- Add a motivational or forward-looking perspective\n");

        if (request.isIncludeCallToAction()) {
            promptBuilder.append("- End with an encouraging call-to-action\n");
        }

        promptBuilder.append("\nNEWS CONTENT:\n");
        promptBuilder.append(request.getNewsContent()).append("\n\n");

        promptBuilder.append("Return only the processed post content, no additional formatting or explanations.");

        return promptBuilder.toString();
    }

    private String createFallbackSummary(String originalContent, int maxLength) {
        if (originalContent.length() <= maxLength) {
            return originalContent;
        }

        // Simple truncation with ellipsis
        return originalContent.substring(0, maxLength - 3) + "...";
    }
}
