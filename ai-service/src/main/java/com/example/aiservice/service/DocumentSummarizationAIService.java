package com.example.aiservice.service;

import com.example.aiservice.client.GeminiClient;
import com.example.aiservice.dto.DocumentSummarizationRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentSummarizationAIService {

    private final GeminiClient geminiClient;

    public String summarizeDocument(DocumentSummarizationRequest request) {
        try {
            log.info("Starting document summarization for content length: {}", request.getDocumentContent().length());

            String prompt = buildDocumentSummarizationPrompt(request);
            String geminiResponse = geminiClient.generateContent(prompt);

            // Clean up the response
            String summary = geminiResponse.trim();

            log.info("Completed document summarization - Original: {} chars, Summary: {} chars",
                    request.getDocumentContent().length(), summary.length());

            return summary;

        } catch (Exception e) {
            log.error("Error in document summarization", e);
            return createFallbackSummary(request.getDocumentContent());
        }
    }

    private String buildDocumentSummarizationPrompt(DocumentSummarizationRequest request) {
        StringBuilder promptBuilder = new StringBuilder();

        promptBuilder.append("Create a comprehensive study summary of the following document.\n\n");

        promptBuilder.append("REQUIREMENTS:\n");
        promptBuilder.append("- Extract the most important concepts, facts, and key points\n");
        promptBuilder.append("- Organize information into clear bullet points\n");
        promptBuilder.append("- Use headings and subheadings where appropriate\n");
        promptBuilder.append("- Include definitions for technical terms when relevant\n");
        promptBuilder.append("- Focus on information that would be valuable for studying and revision\n");
        promptBuilder.append("- Make it well-structured and easy to read\n");
        promptBuilder.append("- Aim for about 20-30% of the original length while retaining key information\n\n");

        promptBuilder.append("FORMAT:\n");
        promptBuilder.append("- Use bullet points (•) for main points\n");
        promptBuilder.append("- Use sub-bullets for details\n");
        promptBuilder.append("- Add section headers with clear titles\n");
        promptBuilder.append("- Include key terms in bold formatting where relevant\n\n");

        promptBuilder.append("DOCUMENT CONTENT:\n");
        promptBuilder.append(request.getDocumentContent()).append("\n\n");

        promptBuilder.append("Return a well-formatted summary that would be perfect for studying and quick reference.");

        return promptBuilder.toString();
    }

    private String createFallbackSummary(String originalContent) {
        log.warn("Using fallback summarization method");

        // Simple extraction of key sentences
        String[] sentences = originalContent.split("\\. ");
        StringBuilder summary = new StringBuilder();
        summary.append("Document Summary\n\n");
        summary.append("Key Points:\n\n");

        // Take first and important sentences
        int maxSentences = Math.min(8, sentences.length);
        for (int i = 0; i < maxSentences; i++) {
            String sentence = sentences[i].trim();
            if (sentence.length() > 20) { // Filter out very short sentences
                summary.append("• ").append(sentence);
                if (!sentence.endsWith(".")) {
                    summary.append(".");
                }
                summary.append("\n");
            }
        }

        if (sentences.length > maxSentences) {
            summary.append("\n... (Additional content available in original document)");
        }

        return summary.toString();
    }
}