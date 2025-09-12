package com.example.postfolio.mcqGeneration.service;

import com.itextpdf.text.Document;
import com.itextpdf.text.DocumentException;
import com.itextpdf.text.Font;
import com.itextpdf.text.FontFactory;
import com.itextpdf.text.PageSize;
import com.itextpdf.text.Paragraph;
import com.itextpdf.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class SummaryService {

    private final WebClient webClient;

    /**
     * Generate summary from text content using AI service and create PDF
     * 
     * @param documentContent The text content to summarize
     * @param documentName    The name of the document
     * @return PDF bytes containing the summary
     * @throws IOException If PDF generation fails
     */
    public byte[] generateSummaryPDF(String documentContent, String documentName) throws IOException {
        try {
            // Generate summary using AI service
            String summary = generateSummaryWithAI(documentContent);

            // Create PDF from summary
            return createSummaryPDF(summary, documentName);

        } catch (Exception e) {
            log.error("Error generating summary PDF for document: {}", documentName, e);
            throw new IOException("Failed to generate summary PDF: " + e.getMessage(), e);
        }
    }

    /**
     * Generate summary using AI microservice
     * 
     * @param documentContent The text content to summarize
     * @return The generated summary
     */
    private String generateSummaryWithAI(String documentContent) {
        try {
            log.info("Sending summarization request to AI service");

            // Create request payload for AI service
            SummaryAIRequest request = SummaryAIRequest.builder()
                    .documentContent(documentContent)
                    .build();

            // Call AI microservice synchronously
            Mono<String> summaryMono = webClient.post()
                    .uri("http://localhost:8081/api/ai/summarize")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(String.class);

            String summary = summaryMono.block();

            if (summary == null || summary.trim().isEmpty()) {
                throw new RuntimeException("AI service returned empty summary");
            }

            return summary;

        } catch (Exception e) {
            log.error("Error calling AI service for summarization: {}", e.getMessage(), e);
            // Fallback to simple summarization
            return generateFallbackSummary(documentContent);
        }
    }

    /**
     * Generate a simple fallback summary when AI service is unavailable
     * 
     * @param documentContent The original content
     * @return A basic summary
     */
    private String generateFallbackSummary(String documentContent) {
        log.warn("Using fallback summarization method");

        // Simple extraction of first few sentences as summary
        String[] sentences = documentContent.split("\\. ");
        StringBuilder summary = new StringBuilder();
        summary.append("Summary (Fallback Mode):\n\n");

        int maxSentences = Math.min(5, sentences.length);
        for (int i = 0; i < maxSentences; i++) {
            summary.append("• ").append(sentences[i].trim());
            if (!sentences[i].endsWith(".")) {
                summary.append(".");
            }
            summary.append("\n");
        }

        if (sentences.length > maxSentences) {
            summary.append("\n... and more content in the original document.");
        }

        return summary.toString();
    }

    /**
     * Create PDF document from summary text
     * 
     * @param summary      The summary text
     * @param documentName The original document name
     * @return PDF bytes
     * @throws DocumentException If PDF creation fails
     */
    private byte[] createSummaryPDF(String summary, String documentName) throws DocumentException, IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        try {
            Document document = new Document(PageSize.A4);
            PdfWriter.getInstance(document, baos);
            document.open();

            // Title
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Paragraph title = new Paragraph("Document Summary", titleFont);
            title.setAlignment(Paragraph.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            // Document info
            Font infoFont = FontFactory.getFont(FontFactory.HELVETICA, 12);
            Paragraph info = new Paragraph();
            info.add(new Paragraph("Original Document: " + documentName, infoFont));
            info.add(new Paragraph(
                    "Generated: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")),
                    infoFont));
            info.setSpacingAfter(20);
            document.add(info);

            // Summary content
            Font contentFont = FontFactory.getFont(FontFactory.HELVETICA, 11);

            // Split summary by lines and format bullet points
            String[] lines = summary.split("\n");
            for (String line : lines) {
                if (!line.trim().isEmpty()) {
                    Paragraph p = new Paragraph(line.trim(), contentFont);
                    p.setSpacingAfter(5);
                    document.add(p);
                }
            }

            document.close();

        } catch (DocumentException e) {
            log.error("Error creating PDF document", e);
            throw e;
        }

        return baos.toByteArray();
    }

    /**
     * Request DTO for AI summarization service
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    private static class SummaryAIRequest {
        private String documentContent;
    }
}