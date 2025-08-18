package com.example.postfolio.mcqGeneration.controller;

import com.example.postfolio.mcqGeneration.dto.MCQGenerationRequest;
import com.example.postfolio.mcqGeneration.dto.MCQSetResponse;
import com.example.postfolio.mcqGeneration.service.MCQService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/preparation")
@CrossOrigin(origins = "http://localhost:3000")
public class PreparationController {

    @Autowired
    private MCQService mcqService;

    @PostMapping("/generate-mcq")
    public ResponseEntity<MCQSetResponse> generateMCQFromDocument(
            @RequestParam("document") MultipartFile file,
            Authentication authentication) {

        try {
            // Get user ID from authentication
            Long userId = getUserIdFromAuth(authentication);

            // Read file content
            String documentContent = new String(file.getBytes(), StandardCharsets.UTF_8);

            // Create request
            MCQGenerationRequest request = new MCQGenerationRequest();
            request.setDocumentContent(documentContent);
            request.setDocumentName(file.getOriginalFilename());

            // Generate MCQs
            MCQSetResponse response = mcqService.generateMCQsFromDocument(request, userId);

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/generate-mcq-text")
    public ResponseEntity<MCQSetResponse> generateMCQFromText(
            @RequestBody MCQGenerationRequest request,
            Authentication authentication) {

        Long userId = getUserIdFromAuth(authentication);
        MCQSetResponse response = mcqService.generateMCQsFromDocument(request, userId);

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
