package com.example.postfolio.mcqGeneration.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Service
@Slf4j
public class DocumentTextExtractionService {

    /**
     * Extract text from a multipart file supporting both TXT and PDF formats
     * 
     * @param file The uploaded file
     * @return The extracted text content
     * @throws IOException                   If file cannot be read or processed
     * @throws UnsupportedOperationException If file type is not supported
     */
    public String extractTextFromFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be null or empty");
        }

        String fileName = file.getOriginalFilename();
        if (fileName == null) {
            throw new IllegalArgumentException("File name cannot be null");
        }

        String contentType = file.getContentType();
        log.info("Processing file: {} with content type: {}", fileName, contentType);

        // Extract text based on file type
        if (isTextFile(fileName, contentType)) {
            return extractTextFromTxtFile(file);
        } else if (isPdfFile(fileName, contentType)) {
            return extractTextFromPdfFile(file);
        } else {
            throw new UnsupportedOperationException(
                    "Unsupported file type. Only .txt and .pdf files are supported. File: " + fileName);
        }
    }

    /**
     * Check if the file is a text file
     */
    private boolean isTextFile(String fileName, String contentType) {
        return (contentType != null && contentType.equals("text/plain"))
                || fileName.toLowerCase().endsWith(".txt");
    }

    /**
     * Check if the file is a PDF file
     */
    private boolean isPdfFile(String fileName, String contentType) {
        return (contentType != null && contentType.equals("application/pdf"))
                || fileName.toLowerCase().endsWith(".pdf");
    }

    /**
     * Extract text from a TXT file
     */
    private String extractTextFromTxtFile(MultipartFile file) throws IOException {
        try {
            String content = new String(file.getBytes(), StandardCharsets.UTF_8);
            log.debug("Extracted {} characters from TXT file: {}", content.length(), file.getOriginalFilename());
            return content;
        } catch (IOException e) {
            log.error("Error reading TXT file: {}", file.getOriginalFilename(), e);
            throw new IOException("Failed to read text file: " + e.getMessage(), e);
        }
    }

    /**
     * Extract text from a PDF file using Apache PDFBox
     */
    private String extractTextFromPdfFile(MultipartFile file) throws IOException {
        try (PDDocument document = Loader.loadPDF(file.getBytes())) {
            if (document.isEncrypted()) {
                log.warn("PDF file is encrypted, attempting to decrypt: {}", file.getOriginalFilename());
                // Try to decrypt with empty password (common case)
                document.setAllSecurityToBeRemoved(true);
            }

            PDFTextStripper textStripper = new PDFTextStripper();

            // Configure text stripper for better text extraction
            textStripper.setSortByPosition(true);
            textStripper.setLineSeparator("\n");

            String extractedText = textStripper.getText(document);

            // Clean up the extracted text
            extractedText = cleanExtractedText(extractedText);

            log.info("Extracted {} characters from PDF file: {} ({} pages)",
                    extractedText.length(), file.getOriginalFilename(), document.getNumberOfPages());

            if (extractedText.trim().isEmpty()) {
                log.warn("No text could be extracted from PDF: {}", file.getOriginalFilename());
                throw new IOException(
                        "PDF file appears to contain no extractable text. It might be image-based or corrupted.");
            }

            return extractedText;

        } catch (IOException e) {
            log.error("Error extracting text from PDF file: {}", file.getOriginalFilename(), e);
            throw new IOException("Failed to extract text from PDF: " + e.getMessage(), e);
        }
    }

    /**
     * Clean up extracted text by removing excessive whitespace and formatting
     */
    private String cleanExtractedText(String text) {
        if (text == null) {
            return "";
        }

        // Remove excessive whitespace while preserving line breaks
        return text.replaceAll("\\r\\n", "\n") // Normalize line endings
                .replaceAll("\\r", "\n") // Convert remaining \r to \n
                .replaceAll(" +", " ") // Multiple spaces to single space
                .replaceAll("\\n\\s*\\n\\s*\\n", "\n\n") // Multiple line breaks to double
                .trim();
    }

    /**
     * Get supported file extensions
     */
    public String[] getSupportedFileTypes() {
        return new String[] { ".txt", ".pdf" };
    }

    /**
     * Check if a file type is supported
     */
    public boolean isFileTypeSupported(String fileName) {
        if (fileName == null) {
            return false;
        }

        String lowerFileName = fileName.toLowerCase();
        return lowerFileName.endsWith(".txt") || lowerFileName.endsWith(".pdf");
    }
}