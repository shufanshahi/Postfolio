package com.example.postfolio.profile.controller;



import com.example.postfolio.profile.dto.EducationSummaryDto;
import com.example.postfolio.profile.dto.SchoolDto;
import com.example.postfolio.profile.dto.UniversityDto;
import com.example.postfolio.profile.service.EducationService;
import com.example.postfolio.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/education")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EducationController {

    private final EducationService educationService;

    // School endpoints
    @PostMapping("/schools")
    public ResponseEntity<SchoolDto> createSchool(@RequestBody SchoolDto schoolDto, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        SchoolDto createdSchool = educationService.createSchool(schoolDto, user);
        return ResponseEntity.ok(createdSchool);
    }

    @GetMapping("/schools")
    public ResponseEntity<List<SchoolDto>> getUserSchools(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<SchoolDto> schools = educationService.getUserSchools(user);
        return ResponseEntity.ok(schools);
    }

    @PutMapping("/schools/{schoolId}")
    public ResponseEntity<SchoolDto> updateSchool(@PathVariable Long schoolId,
                                                  @RequestBody SchoolDto schoolDto,
                                                  Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        SchoolDto updatedSchool = educationService.updateSchool(schoolId, schoolDto, user);
        return ResponseEntity.ok(updatedSchool);
    }

    @DeleteMapping("/schools/{schoolId}")
    public ResponseEntity<Void> deleteSchool(@PathVariable Long schoolId, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        educationService.deleteSchool(schoolId, user);
        return ResponseEntity.noContent().build();
    }

    // University endpoints
    @PostMapping("/universities")
    public ResponseEntity<UniversityDto> createUniversity(@RequestBody UniversityDto universityDto,
                                                          Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        UniversityDto createdUniversity = educationService.createUniversity(universityDto, user);
        return ResponseEntity.ok(createdUniversity);
    }

    @GetMapping("/universities")
    public ResponseEntity<List<UniversityDto>> getUserUniversities(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<UniversityDto> universities = educationService.getUserUniversities(user);
        return ResponseEntity.ok(universities);
    }

    @PutMapping("/universities/{universityId}")
    public ResponseEntity<UniversityDto> updateUniversity(@PathVariable Long universityId,
                                                          @RequestBody UniversityDto universityDto,
                                                          Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        UniversityDto updatedUniversity = educationService.updateUniversity(universityId, universityDto, user);
        return ResponseEntity.ok(updatedUniversity);
    }

    @DeleteMapping("/universities/{universityId}")
    public ResponseEntity<Void> deleteUniversity(@PathVariable Long universityId, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        educationService.deleteUniversity(universityId, user);
        return ResponseEntity.noContent().build();
    }

    // Education summary endpoint
    @GetMapping("/summary")
    public ResponseEntity<EducationSummaryDto> getEducationSummary(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        EducationSummaryDto summary = educationService.getEducationSummary(user);
        return ResponseEntity.ok(summary);
    }
}