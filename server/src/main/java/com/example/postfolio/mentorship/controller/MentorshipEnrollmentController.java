package com.example.postfolio.mentorship.controller;

import com.example.postfolio.mentorship.dto.MentorshipEnrollmentDto;
import com.example.postfolio.mentorship.service.MentorshipEnrollmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mentorship-enrollments")
@RequiredArgsConstructor
public class MentorshipEnrollmentController {
    
    private final MentorshipEnrollmentService enrollmentService;
    
    @GetMapping
    public ResponseEntity<List<MentorshipEnrollmentDto>> getAllEnrollments() {
        List<MentorshipEnrollmentDto> enrollments = enrollmentService.getAllEnrollments();
        return ResponseEntity.ok(enrollments);
    }

    @GetMapping("/profile/{profileId}")
    public ResponseEntity<List<MentorshipEnrollmentDto>> getEnrollmentsByProfileId(@PathVariable Long profileId) {
        List<MentorshipEnrollmentDto> enrollments = enrollmentService.getEnrollmentsByProfileId(profileId);
        return ResponseEntity.ok(enrollments);
    }
}
