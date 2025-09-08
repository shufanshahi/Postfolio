package com.example.postfolio.interview.service;

import com.example.postfolio.interview.dto.InterviewProgressRequest;
import com.example.postfolio.interview.dto.InterviewProgressResponse;
import com.example.postfolio.interview.entity.InterviewProgress;
import com.example.postfolio.interview.repository.InterviewProgressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InterviewProgressServiceImpl implements InterviewProgressService {

    private final InterviewProgressRepository interviewProgressRepository;

    @Override
    public InterviewProgressResponse createInterviewProgress(InterviewProgressRequest request) {
        InterviewProgress interviewProgress = InterviewProgress.builder()
                .profileId(request.getProfileId())
                .mockInterviewId(request.getMockInterviewId())
                .time(request.getTime())
                .score(request.getScore())
                .weaknesses(request.getWeaknesses())
                .improvements(request.getImprovements())
                .build();

        InterviewProgress savedProgress = interviewProgressRepository.save(interviewProgress);
        return convertToResponse(savedProgress);
    }

    @Override
    public List<InterviewProgressResponse> getAllInterviewProgress() {
        List<InterviewProgress> progressList = interviewProgressRepository.findAll();
        return progressList.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<InterviewProgressResponse> getInterviewProgressByProfileAndMockInterview(Long profileId, Long mockInterviewId) {
        List<InterviewProgress> progressList = interviewProgressRepository.findByProfileIdAndMockInterviewId(profileId, mockInterviewId);
        return progressList.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    private InterviewProgressResponse convertToResponse(InterviewProgress interviewProgress) {
        return InterviewProgressResponse.builder()
                .id(interviewProgress.getId())
                .profileId(interviewProgress.getProfileId())
                .mockInterviewId(interviewProgress.getMockInterviewId())
                .time(interviewProgress.getTime())
                .score(interviewProgress.getScore())
                .weaknesses(interviewProgress.getWeaknesses())
                .improvements(interviewProgress.getImprovements())
                .createdAt(interviewProgress.getCreatedAt())
                .updatedAt(interviewProgress.getUpdatedAt())
                .build();
    }
}
