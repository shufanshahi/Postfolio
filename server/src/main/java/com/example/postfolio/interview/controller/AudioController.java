package com.example.postfolio.interview.controller;

import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/audio")
@RequiredArgsConstructor
public class AudioController {

    private final ResourceLoader resourceLoader;
    private static final String AUDIO_DIR = "server/src/main/resources/static/interview-audio/";

    @GetMapping("/interview-audio/{filename}")
    public ResponseEntity<Resource> getAudioFile(@PathVariable String filename) {
        try {
            // First try to load from classpath
            Resource resource = resourceLoader.getResource("classpath:static/interview-audio/" + filename);
            
            // If not found in classpath, try file system
            if (!resource.exists()) {
                Path audioPath = Paths.get(AUDIO_DIR, filename);
                if (Files.exists(audioPath)) {
                    resource = resourceLoader.getResource("file:" + audioPath.toString());
                }
            }
            
            if (!resource.exists()) {
                return ResponseEntity.notFound().build();
            }

            // Set appropriate headers for audio files
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("audio/mpeg"));
            headers.set(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"");
            headers.setCacheControl("max-age=3600");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(resource);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/test")
    public ResponseEntity<String> testAudioEndpoint() {
        try {
            Path audioDir = Paths.get(AUDIO_DIR);
            boolean dirExists = Files.exists(audioDir);
            long fileCount = dirExists ? Files.list(audioDir).count() : 0;
            
            return ResponseEntity.ok(String.format(
                "Audio directory exists: %s, File count: %d, Directory path: %s",
                dirExists, fileCount, audioDir.toAbsolutePath()
            ));
        } catch (IOException e) {
            return ResponseEntity.ok("Error checking audio directory: " + e.getMessage());
        }
    }
}