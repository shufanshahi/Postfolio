package com.example.postfolio.post.service;

import com.example.postfolio.post.models.PostType;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
public class MockAiService {

    public AiResponse analyzeContent(String content) {
        // Simple mock logic - replace with real AI integration
        return AiResponse.builder()
                .summary(generateSummary(content))
                .postType(detectPostType(content))
                .tags(extractTags(content))
                .build();
    }

    private String generateSummary(String content) {
        if (content.length() > 30) {
            return content.substring(0, 30) + "...";
        }
        return content;
    }

    private PostType detectPostType(String content) {
        String lowerContent = content.toLowerCase();
        if (lowerContent.contains("built") || lowerContent.contains("developed")) {
            return PostType.PROJECT;
        } else if (lowerContent.contains("work") || lowerContent.contains("at")) {
            return PostType.EXPERIENCE;
        } else if (lowerContent.contains("learn") || lowerContent.contains("study")) {
            return PostType.EDUCATION;
        }
        return PostType.ACHIEVEMENT;
    }

    private List<String> extractTags(String content) {
        // Simple keyword matching - replace with NLP in production
        return Arrays.stream(content.split(" "))
                .filter(word -> word.length() > 3 && !List.of("the", "and", "with").contains(word))
                .limit(5)
                .toList();
    }
}