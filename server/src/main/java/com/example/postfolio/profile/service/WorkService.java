package com.example.postfolio.profile.service;

import com.example.postfolio.profile.dto.WorkDto;
import com.example.postfolio.profile.entity.Profile;
import com.example.postfolio.profile.entity.Work;
import com.example.postfolio.profile.repository.ProfileRepository;
import com.example.postfolio.profile.repository.WorkRepository;
import com.example.postfolio.user.entity.User;
import com.example.postfolio.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkService {

        private final WorkRepository workRepository;
        private final ProfileRepository profileRepository;
        private final UserRepository userRepository;

        // Work operations
        public WorkDto createWork(WorkDto workDto, User user) {
                Profile profile = profileRepository.findByUser(user)
                                .orElseThrow(() -> new RuntimeException("Profile not found for user"));

                Work work = Work.builder()
                                .companyName(workDto.getCompanyName())
                                .position(workDto.getPosition())
                                .startDate(workDto.getStartDate())
                                .endDate(workDto.getEndDate())
                                .isCurrent(workDto.getIsCurrent())
                                .profile(profile)
                                .build();

                Work savedWork = workRepository.save(work);
                return convertToDto(savedWork);
        }

        public List<WorkDto> getUserWorks(User user) {
                Profile profile = profileRepository.findByUser(user)
                                .orElseThrow(() -> new RuntimeException("Profile not found for user"));
                List<Work> works = workRepository.findByProfileOrderByStartDateDesc(profile);
                return works.stream()
                                .map(this::convertToDto)
                                .collect(Collectors.toList());
        }

        // Get user works by user ID for public viewing
        public List<WorkDto> getUserWorksByUserId(Long userId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
                Profile profile = profileRepository.findByUser(user)
                                .orElseThrow(() -> new RuntimeException("Profile not found for user"));
                List<Work> works = workRepository.findByProfileOrderByStartDateDesc(profile);
                return works.stream()
                                .map(this::convertToDto)
                                .collect(Collectors.toList());
        }

        public WorkDto updateWork(Long workId, WorkDto workDto, User user) {
                Profile profile = profileRepository.findByUser(user)
                                .orElseThrow(() -> new RuntimeException("Profile not found for user"));

                Work work = workRepository.findById(workId)
                                .orElseThrow(() -> new RuntimeException("Work not found"));

                if (!work.getProfile().getId().equals(profile.getId())) {
                        throw new RuntimeException("Unauthorized access");
                }

                work.setCompanyName(workDto.getCompanyName());
                work.setPosition(workDto.getPosition());
                work.setStartDate(workDto.getStartDate());
                work.setEndDate(workDto.getEndDate());
                work.setIsCurrent(workDto.getIsCurrent());

                Work updatedWork = workRepository.save(work);
                return convertToDto(updatedWork);
        }

        public void deleteWork(Long workId, User user) {
                Profile profile = profileRepository.findByUser(user)
                                .orElseThrow(() -> new RuntimeException("Profile not found for user"));

                Work work = workRepository.findById(workId)
                                .orElseThrow(() -> new RuntimeException("Work not found"));

                if (!work.getProfile().getId().equals(profile.getId())) {
                        throw new RuntimeException("Unauthorized access");
                }

                workRepository.delete(work);
        }

        // Helper method to convert entity to DTO
        private WorkDto convertToDto(Work work) {
                return WorkDto.builder()
                                .id(work.getId())
                                .companyName(work.getCompanyName())
                                .position(work.getPosition())
                                .startDate(work.getStartDate())
                                .endDate(work.getEndDate())
                                .isCurrent(work.getIsCurrent())
                                .duration(work.getDuration())
                                .displayDateRange(work.getDisplayDateRange())
                                .build();
        }
}