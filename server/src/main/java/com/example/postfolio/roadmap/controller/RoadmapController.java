package com.example.postfolio.roadmap.controller;

import com.example.postfolio.roadmap.dto.RoadmapDTO;
import com.example.postfolio.roadmap.dto.RoadmapItemDTO;
import com.example.postfolio.roadmap.dto.RoadmapRequest;
import com.example.postfolio.roadmap.service.RoadmapService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/roadmaps")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:3000")
public class RoadmapController {

    private final RoadmapService roadmapService;

    @PostMapping
    public ResponseEntity<?> createRoadmap(@RequestBody RoadmapRequest request) {
        try {
            RoadmapDTO roadmap = roadmapService.createRoadmap(request);
            return ResponseEntity.ok(roadmap);
        } catch (RuntimeException e) {
            log.error("Error creating roadmap: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error creating roadmap", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Internal server error"));
        }
    }

    @GetMapping("/job/{jobId}/profile/{profileId}")
    public ResponseEntity<?> getRoadmapByJobAndProfile(
            @PathVariable Long jobId,
            @PathVariable Long profileId) {
        try {
            Optional<RoadmapDTO> roadmap = roadmapService.getRoadmapByJobAndProfile(jobId, profileId);
            if (roadmap.isPresent()) {
                return ResponseEntity.ok(roadmap.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error getting roadmap for job {} and profile {}", jobId, profileId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Internal server error"));
        }
    }

    @GetMapping("/profile/{profileId}")
    public ResponseEntity<?> getRoadmapsByProfile(@PathVariable Long profileId) {
        try {
            List<RoadmapDTO> roadmaps = roadmapService.getRoadmapsByProfile(profileId);
            return ResponseEntity.ok(roadmaps);
        } catch (Exception e) {
            log.error("Error getting roadmaps for profile {}", profileId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Internal server error"));
        }
    }

    @PutMapping("/{roadmapId}/items/{itemId}")
    public ResponseEntity<?> updateRoadmapItem(
            @PathVariable Long roadmapId,
            @PathVariable Long itemId,
            @RequestBody RoadmapItemDTO itemDTO) {
        try {
            RoadmapDTO roadmap = roadmapService.updateRoadmapItem(roadmapId, itemId, itemDTO);
            return ResponseEntity.ok(roadmap);
        } catch (RuntimeException e) {
            log.error("Error updating roadmap item: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error updating roadmap item", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Internal server error"));
        }
    }

    @PostMapping("/{roadmapId}/items/{itemId}/complete")
    public ResponseEntity<?> markItemAsCompleted(
            @PathVariable Long roadmapId,
            @PathVariable Long itemId,
            @RequestBody(required = false) Map<String, String> requestBody) {
        try {
            String completionNotes = requestBody != null ? requestBody.get("completionNotes") : null;
            RoadmapDTO roadmap = roadmapService.markItemAsCompleted(roadmapId, itemId, completionNotes);
            return ResponseEntity.ok(roadmap);
        } catch (RuntimeException e) {
            log.error("Error marking item as completed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error marking item as completed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Internal server error"));
        }
    }

    @DeleteMapping("/{roadmapId}")
    public ResponseEntity<?> deleteRoadmap(@PathVariable Long roadmapId) {
        try {
            boolean deleted = roadmapService.deleteRoadmap(roadmapId);
            if (deleted) {
                return ResponseEntity.ok(Map.of("message", "Roadmap deleted successfully"));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error deleting roadmap {}", roadmapId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Internal server error"));
        }
    }

    @GetMapping("/check/{jobId}/{profileId}")
    public ResponseEntity<?> checkRoadmapExists(
            @PathVariable Long jobId,
            @PathVariable Long profileId) {
        try {
            Optional<RoadmapDTO> roadmap = roadmapService.getRoadmapByJobAndProfile(jobId, profileId);
            return ResponseEntity.ok(Map.of("exists", roadmap.isPresent()));
        } catch (Exception e) {
            log.error("Error checking roadmap existence for job {} and profile {}", jobId, profileId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Internal server error"));
        }
    }
}
