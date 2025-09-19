package com.example.postfolio.mcqGeneration.service;

import com.example.postfolio.util.JwtTokenHelper;
import com.itextpdf.text.Document;
import com.itextpdf.text.DocumentException;
import com.itextpdf.text.Font;
import com.itextpdf.text.FontFactory;
import com.itextpdf.text.PageSize;
import com.itextpdf.text.Paragraph;
import com.itextpdf.text.Chunk;
import com.itextpdf.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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

    private final WebClient.Builder webClientBuilder;
    private final JwtTokenHelper jwtTokenHelper;

    @Value("${ai-service.base-url}")
    private String aiServiceBaseUrl;

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
            log.info("Sending summarization request to AI service via load balancer");

            // Create request payload for AI service
            SummaryAIRequest request = SummaryAIRequest.builder()
                    .documentContent(documentContent)
                    .build();

            // Create WebClient with JWT auth and load balancing
            String authHeader = jwtTokenHelper.getAuthorizationHeader();
            WebClient.Builder builder = webClientBuilder.baseUrl(aiServiceBaseUrl);

            if (authHeader != null) {
                builder = builder.defaultHeader("Authorization", authHeader);
            }

            WebClient webClient = builder.build();

            // Call AI microservice through load balancer
            Mono<String> summaryMono = webClient.post()
                    .uri("/api/ai/summarize")
                    .header("X-Service-Name", "summary-service")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(String.class);

            String summary = summaryMono.block();

            if (summary == null || summary.trim().isEmpty()) {
                throw new RuntimeException("AI service returned empty summary");
            }

            return summary;

        } catch (Exception e) {
            log.error("Error calling AI service via gateway for summarization: {}", e.getMessage(), e);
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
     * Create PDF document from summary text with proper markdown formatting
     * 
     * @param summary      The summary text with markdown formatting
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

            // Process summary content with markdown formatting
            parseAndAddFormattedContent(document, summary);

            document.close();

        } catch (DocumentException e) {
            log.error("Error creating PDF document", e);
            throw e;
        }

        return baos.toByteArray();
    }

    /**
     * Parse markdown-style formatting and add properly formatted content to PDF
     * 
     * @param document The PDF document
     * @param content  The markdown-formatted content
     * @throws DocumentException If PDF formatting fails
     */
    private void parseAndAddFormattedContent(Document document, String content) throws DocumentException {
        // Define fonts
        Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 11);
        Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
        Font subHeaderFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);

        String[] lines = content.split("\n");

        for (String line : lines) {
            line = line.trim();

            if (line.isEmpty()) {
                // Add spacing for empty lines
                document.add(new Paragraph(" "));
                continue;
            }

            // Check for headers (lines that end with : or are all caps and short)
            if (isHeader(line)) {
                Paragraph header = new Paragraph(line, line.length() < 30 ? headerFont : subHeaderFont);
                header.setSpacingBefore(10);
                header.setSpacingAfter(8);
                document.add(header);
            }
            // Check for bullet points
            else if (line.startsWith("•") || line.startsWith("-") || line.startsWith("*")) {
                // Create bullet point
                String bulletText = line.substring(1).trim();
                Paragraph bulletParagraph = parseFormattedText(bulletText, normalFont, boldFont);
                bulletParagraph.setIndentationLeft(20);
                bulletParagraph.setSpacingAfter(5);
                document.add(bulletParagraph);
            }
            // Check for sub-bullet points (indented)
            else if (line.startsWith("  •") || line.startsWith("  -") || line.startsWith("  *")) {
                String subBulletText = line.substring(3).trim();
                Paragraph subBulletParagraph = parseFormattedText(subBulletText, normalFont, boldFont);
                subBulletParagraph.setIndentationLeft(40);
                subBulletParagraph.setSpacingAfter(3);
                document.add(subBulletParagraph);
            }
            // Regular paragraph
            else {
                Paragraph paragraph = parseFormattedText(line, normalFont, boldFont);
                paragraph.setSpacingAfter(8);
                document.add(paragraph);
            }
        }
    }

    /**
     * Parse text with bold markdown formatting (**text**)
     * 
     * @param text       The text to parse
     * @param normalFont Normal font
     * @param boldFont   Bold font
     * @return Formatted paragraph
     */
    private Paragraph parseFormattedText(String text, Font normalFont, Font boldFont) {
        Paragraph paragraph = new Paragraph();

        // Parse bold text marked with **text**
        String[] parts = text.split("\\*\\*");
        boolean isBold = false;

        for (String part : parts) {
            if (!part.isEmpty()) {
                if (isBold) {
                    paragraph.add(new Chunk(part, boldFont));
                } else {
                    paragraph.add(new Chunk(part, normalFont));
                }
            }
            isBold = !isBold;
        }

        // If no bold formatting was found, treat as normal text
        if (paragraph.isEmpty()) {
            paragraph.add(new Chunk(text, normalFont));
        }

        return paragraph;
    }

    /**
     * Check if a line should be treated as a header
     * 
     * @param line The line to check
     * @return true if it's a header
     */
    private boolean isHeader(String line) {
        // Lines ending with : are likely headers
        if (line.endsWith(":")) {
            return true;
        }

        // Short lines that are mostly uppercase (like section titles)
        if (line.length() < 50 && line.toUpperCase().equals(line) && line.length() > 3) {
            return true;
        }

        // Lines that look like headers (common header patterns)
        String upperLine = line.toUpperCase();
        return upperLine.startsWith("SUMMARY") ||
                upperLine.startsWith("KEY POINTS") ||
                upperLine.startsWith("MAIN CONCEPTS") ||
                upperLine.startsWith("IMPORTANT") ||
                upperLine.matches("^[A-Z\\s]+$") && line.length() < 40 && line.length() > 5;
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