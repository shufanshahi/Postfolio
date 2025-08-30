package com.example.postfolio.profile.controller;

import com.example.postfolio.profile.dto.WorkDto;
import com.example.postfolio.profile.service.WorkService;
import com.example.postfolio.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/work")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class WorkController {

    private final WorkService workService;

    @PostMapping
    public ResponseEntity<WorkDto> createWork(@RequestBody WorkDto workDto, @AuthenticationPrincipal User user) {
        WorkDto createdWork = workService.createWork(workDto, user);
        return ResponseEntity.ok(createdWork);
    }

    @GetMapping
    public ResponseEntity<List<WorkDto>> getUserWorks(@AuthenticationPrincipal User user) {
        List<WorkDto> works = workService.getUserWorks(user);
        return ResponseEntity.ok(works);
    }

    // Public endpoint to get works by user ID
    @GetMapping("/{userId}")
    public ResponseEntity<List<WorkDto>> getUserWorksByUserId(@PathVariable Long userId) {
        List<WorkDto> works = workService.getUserWorksByUserId(userId);
        return ResponseEntity.ok(works);
    }

    @PutMapping("/{workId}")
    public ResponseEntity<WorkDto> updateWork(@PathVariable Long workId, @RequestBody WorkDto workDto,
            @AuthenticationPrincipal User user) {
        WorkDto updatedWork = workService.updateWork(workId, workDto, user);
        return ResponseEntity.ok(updatedWork);
    }

    @DeleteMapping("/{workId}")
    public ResponseEntity<Void> deleteWork(@PathVariable Long workId, @AuthenticationPrincipal User user) {
        workService.deleteWork(workId, user);
        return ResponseEntity.ok().build();
    }
}