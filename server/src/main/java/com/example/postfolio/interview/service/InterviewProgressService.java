package com.example.postfolio.interview.service;

import com.example.postfolio.interview.dto.InterviewProgressRequest;
import com.example.postfolio.interview.dto.InterviewProgressResponse;

import java.util.List;

public interface InterviewProgressService {
    
    InterviewProgressResponse createInterviewProgress(InterviewProgressRequest request);
    
    List<InterviewProgressResponse> getAllInterviewProgress();
    
    List<InterviewProgressResponse> getInterviewProgressByProfileAndMockInterview(Long profileId, Long mockInterviewId);
}
