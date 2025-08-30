package com.example.postfolio.mentorship.service;

import com.example.postfolio.mentorship.dto.MentorshipDto;
import com.example.postfolio.mentorship.entity.Mentorship;
import com.example.postfolio.mentorship.repository.MentorshipRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MentorshipService {
    
    private final MentorshipRepository mentorshipRepository;
    
    public List<MentorshipDto> getAllMentorships() {
        List<Mentorship> mentorships = mentorshipRepository.findAll();
        return mentorships.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    private MentorshipDto convertToDto(Mentorship mentorship) {
        return new MentorshipDto(
                mentorship.getId(),
                mentorship.getName(),
                mentorship.getSpecialization(),
                mentorship.getStatus(),
                mentorship.getPrice(),
                mentorship.getTotalEnrolled(),
                mentorship.getRating(),
                mentorship.getProfileId(),
                mentorship.getEnrolledIds()
        );
    }
}
