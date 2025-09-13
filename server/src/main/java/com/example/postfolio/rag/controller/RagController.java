package com.example.postfolio.rag.controller;

import com.example.postfolio.rag.dto.QuestionRequest;
import com.example.postfolio.rag.dto.QuestionResponse;
import com.example.postfolio.rag.service.RagService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/rag")
@CrossOrigin(origins = "http://localhost:3000")
public class RagController {

    @Autowired
    private RagService ragService;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadDocument(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("Please select a file to upload");
            }

            if (!"application/pdf".equals(file.getContentType())) {
                return ResponseEntity.badRequest().body("Only PDF files are supported");
            }

            String documentId = ragService.processDocument(file);
            
            return ResponseEntity.ok().body(new UploadResponse(
                "Document uploaded and processed successfully", 
                documentId
            ));
            
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Failed to process the document");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("An unexpected error occurred");
        }
    }

    @PostMapping("/question")
    public ResponseEntity<QuestionResponse> askQuestion(@RequestBody QuestionRequest request) {
        try {
            if (request.getQuestion() == null || request.getQuestion().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                    new QuestionResponse("Please provide a valid question", "")
                );
            }

            QuestionResponse response = ragService.answerQuestion(request);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(
                new QuestionResponse("An error occurred while processing your question", "")
            );
        }
    }
    
    @GetMapping("/status")
    public ResponseEntity<?> getDocumentStatus() {
        try {
            return ResponseEntity.ok().body(new DocumentStatusResponse(
                ragService.hasDocuments(),
                ragService.getDocumentCount(),
                ragService.hasDocuments() ? "Document ready for questions" : "No document uploaded"
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error checking document status");
        }
    }
    
    @GetMapping("/test")
    public ResponseEntity<String> testGroqConnection() {
        try {
            // Test with a simple question to verify API connection
            QuestionRequest testRequest = new QuestionRequest("What is artificial intelligence?");
            QuestionResponse response = ragService.answerQuestion(testRequest);
            
            if (response.getAnswer().contains("error") || response.getAnswer().contains("apologize")) {
                return ResponseEntity.internalServerError().body("Groq API connection failed");
            }
            
            return ResponseEntity.ok("Groq API connection successful. Response: " + response.getAnswer());
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Groq API test failed: " + e.getMessage());
        }
    }

    // DTO for upload response
    public static class UploadResponse {
        private String message;
        private String documentId;

        public UploadResponse(String message, String documentId) {
            this.message = message;
            this.documentId = documentId;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public String getDocumentId() {
            return documentId;
        }

        public void setDocumentId(String documentId) {
            this.documentId = documentId;
        }
    }
    
    // DTO for document status response
    public static class DocumentStatusResponse {
        private boolean hasDocument;
        private int documentCount;
        private String status;

        public DocumentStatusResponse(boolean hasDocument, int documentCount, String status) {
            this.hasDocument = hasDocument;
            this.documentCount = documentCount;
            this.status = status;
        }

        public boolean isHasDocument() {
            return hasDocument;
        }

        public void setHasDocument(boolean hasDocument) {
            this.hasDocument = hasDocument;
        }

        public int getDocumentCount() {
            return documentCount;
        }

        public void setDocumentCount(int documentCount) {
            this.documentCount = documentCount;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }
    }
}