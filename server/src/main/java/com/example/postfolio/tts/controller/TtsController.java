package com.example.postfolio.tts.controller;

import com.example.postfolio.tts.dto.TtsRequest;
import com.example.postfolio.tts.service.TtsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tts")
@CrossOrigin(origins = "*")
public class TtsController {

    @Autowired
    private TtsService ttsService;

    @PostMapping("/generate")
    public ResponseEntity<Resource> generateSpeech(@RequestBody TtsRequest request) {
        try {
            if (request.getText() == null || request.getText().trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }

            // Limit text length for performance
            String text = request.getText().trim();
            if (text.length() > 1000) {
                text = text.substring(0, 1000);
            }

            Resource audioResource = ttsService.generateSpeech(text);
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"speech.mp3\"")
                    .header(HttpHeaders.CACHE_CONTROL, "no-cache")
                    .contentType(MediaType.parseMediaType("audio/mpeg"))
                    .body(audioResource);
                    
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(null);
        }
    }

    @GetMapping("/test")
    public ResponseEntity<String> testEndpoint() {
        return ResponseEntity.ok("TTS service is running!");
    }
}
