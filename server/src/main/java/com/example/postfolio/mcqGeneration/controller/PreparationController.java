package com.example.postfolio.mcqGeneration.controller;

import com.example.postfolio.mcqGeneration.dto.MCQGenerationRequest;
import com.example.postfolio.mcqGeneration.dto.MCQSetResponse;
import com.example.postfolio.mcqGeneration.service.DocumentTextExtractionService;
import com.example.postfolio.mcqGeneration.service.MCQService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/preparation")
@CrossOrigin(origins = "http://localhost:3000")
public class PreparationController {

    @Autowired
    private MCQService mcqService;

    @Autowired
    private DocumentTextExtractionService documentTextExtractionService;

    @PostMapping("/generate-mcq")
    public ResponseEntity<MCQSetResponse> generateMCQFromDocument(
            @RequestParam("document") MultipartFile file,
            @RequestParam(value = "topic", required = false) String topic,
            @RequestParam(value = "questionCount", defaultValue = "5") int questionCount,
            @RequestParam(value = "difficulty", defaultValue = "Medium") String difficulty,
            Authentication authentication) {

        try {
            // Get user ID from authentication
            Long userId = getUserIdFromAuth(authentication);

            // Extract text content from file (supports both TXT and PDF)
            String documentContent = documentTextExtractionService.extractTextFromFile(file);

            // Create request with all parameters
            MCQGenerationRequest request = MCQGenerationRequest.builder()
                    .documentContent(documentContent)
                    .documentName(file.getOriginalFilename())
                    .topic(topic)
                    .questionCount(questionCount)
                    .difficulty(difficulty)
                    .build();

            // Generate MCQs using AI microservice (async)
            MCQSetResponse response = mcqService.generateMCQsWithAI(request, userId);

            return ResponseEntity.ok(response);

        } catch (UnsupportedOperationException e) {
            return ResponseEntity.badRequest()
                    .body(MCQSetResponse.builder()
                            .success(false)
                            .message("Unsupported file type. Please upload a .txt or .pdf file.")
                            .build());
        } catch (IOException e) {
            return ResponseEntity.badRequest()
                    .body(MCQSetResponse.builder()
                            .success(false)
                            .message("Error reading file: " + e.getMessage())
                            .build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(MCQSetResponse.builder()
                            .success(false)
                            .message("Internal server error occurred while processing the file")
                            .build());
        }
    }

    @PostMapping("/generate-mcq-sync")
    public ResponseEntity<MCQSetResponse> generateMCQFromDocumentSync(
            @RequestParam("document") MultipartFile file,
            @RequestParam(value = "topic", required = false) String topic,
            @RequestParam(value = "questionCount", defaultValue = "5") int questionCount,
            @RequestParam(value = "difficulty", defaultValue = "Medium") String difficulty,
            Authentication authentication) {

        try {
            // Get user ID from authentication
            Long userId = getUserIdFromAuth(authentication);

            // Extract text content from file (supports both TXT and PDF)
            String documentContent = documentTextExtractionService.extractTextFromFile(file);

            // Create request with all parameters
            MCQGenerationRequest request = MCQGenerationRequest.builder()
                    .documentContent(documentContent)
                    .documentName(file.getOriginalFilename())
                    .topic(topic)
                    .questionCount(questionCount)
                    .difficulty(difficulty)
                    .build();

            // Generate MCQs using AI microservice (sync)
            MCQSetResponse response = mcqService.generateMCQsWithAISync(request, userId);

            return ResponseEntity.ok(response);

        } catch (UnsupportedOperationException e) {
            return ResponseEntity.badRequest()
                    .body(MCQSetResponse.builder()
                            .success(false)
                            .message("Unsupported file type. Please upload a .txt or .pdf file.")
                            .build());
        } catch (IOException e) {
            return ResponseEntity.badRequest()
                    .body(MCQSetResponse.builder()
                            .success(false)
                            .message("Error reading file: " + e.getMessage())
                            .build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(MCQSetResponse.builder()
                            .success(false)
                            .message("Internal server error occurred while processing the file")
                            .build());
        }
    }

    @PostMapping("/generate-mcq-text")
    public ResponseEntity<MCQSetResponse> generateMCQFromText(
            @RequestBody MCQGenerationRequest request,
            Authentication authentication) {

        Long userId = getUserIdFromAuth(authentication);
        MCQSetResponse response = mcqService.generateMCQsWithAISync(request, userId);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/mcq-sets")
    public ResponseEntity<List<MCQSetResponse>> getUserMCQSets(Authentication authentication) {
        Long userId = getUserIdFromAuth(authentication);
        List<MCQSetResponse> mcqSets = mcqService.getUserMCQSets(userId);
        return ResponseEntity.ok(mcqSets);
    }

    @GetMapping("/mcq-sets/{id}")
    public ResponseEntity<MCQSetResponse> getMCQSetById(
            @PathVariable Long id,
            Authentication authentication) {

        Long userId = getUserIdFromAuth(authentication);
        MCQSetResponse mcqSet = mcqService.getMCQSetById(id, userId);
        return ResponseEntity.ok(mcqSet);
    }

    private Long getUserIdFromAuth(Authentication authentication) {
        // Implement based on your authentication setup
        // This should extract the user ID from the authentication object
        return 1L; // Placeholder - replace with actual implementation
    }
}
