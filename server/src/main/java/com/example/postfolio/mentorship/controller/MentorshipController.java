package com.example.postfolio.mentorship.controller;

import com.example.postfolio.mentorship.dto.MentorshipDto;
import com.example.postfolio.mentorship.service.MentorshipService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/mentorships")
@RequiredArgsConstructor
public class MentorshipController {
    
    private final MentorshipService mentorshipService;
    
    @GetMapping
    public ResponseEntity<List<MentorshipDto>> getAllMentorships() {
        List<MentorshipDto> mentorships = mentorshipService.getAllMentorships();
        return ResponseEntity.ok(mentorships);
    }
}
