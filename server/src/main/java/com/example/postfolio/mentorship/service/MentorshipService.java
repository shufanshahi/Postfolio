package com.example.postfolio.mentorship.service;

import com.example.postfolio.mentorship.dto.MentorshipDto;
import com.example.postfolio.mentorship.entity.Mentorship;
import com.example.postfolio.mentorship.repository.MentorshipRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
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
    
    public MentorshipDto createMentorship(MentorshipDto mentorshipDto) {
        Mentorship mentorship = convertToEntity(mentorshipDto);
        Mentorship savedMentorship = mentorshipRepository.save(mentorship);
        return convertToDto(savedMentorship);
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
    
    private Mentorship convertToEntity(MentorshipDto mentorshipDto) {
        Mentorship mentorship = new Mentorship();
        mentorship.setId(mentorshipDto.getId());
        mentorship.setName(mentorshipDto.getName());
        mentorship.setSpecialization(mentorshipDto.getSpecialization());
        mentorship.setStatus(mentorshipDto.getStatus());
        mentorship.setPrice(mentorshipDto.getPrice());
        mentorship.setTotalEnrolled(mentorshipDto.getTotalEnrolled() != null ? mentorshipDto.getTotalEnrolled() : 0);
        mentorship.setRating(mentorshipDto.getRating() != null ? mentorshipDto.getRating() : 0.0);
        mentorship.setProfileId(mentorshipDto.getProfileId());
        mentorship.setEnrolledIds(mentorshipDto.getEnrolledIds() != null ? mentorshipDto.getEnrolledIds() : new ArrayList<>());
        return mentorship;
    }
}
