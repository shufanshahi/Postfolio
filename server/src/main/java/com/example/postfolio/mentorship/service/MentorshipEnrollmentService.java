package com.example.postfolio.mentorship.service;

import com.example.postfolio.mentorship.dto.MentorshipEnrollmentDto;
import com.example.postfolio.mentorship.entity.MentorshipEnrollment;
import com.example.postfolio.mentorship.repository.MentorshipEnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MentorshipEnrollmentService {
    
    private final MentorshipEnrollmentRepository enrollmentRepository;
    
    public List<MentorshipEnrollmentDto> getAllEnrollments() {
        List<MentorshipEnrollment> enrollments = enrollmentRepository.findAll();
        return enrollments.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    

    public List<MentorshipEnrollmentDto> getEnrollmentsByProfileId(Long profileId) {
        List<MentorshipEnrollment> enrollments = enrollmentRepository.findByProfileId(profileId);
        return enrollments.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    private MentorshipEnrollmentDto convertToDto(MentorshipEnrollment enrollment) {
        return new MentorshipEnrollmentDto(
                enrollment.getId(),
                enrollment.getProfileId(),
                enrollment.getMentorshipId(),
                enrollment.getStatus()
        );
    }
}
