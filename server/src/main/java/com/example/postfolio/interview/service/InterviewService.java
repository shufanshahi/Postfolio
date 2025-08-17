package com.example.postfolio.interview.service;

import com.example.postfolio.interview.dto.InterviewRequest;
import com.example.postfolio.interview.dto.InterviewResponse;

import java.util.List;

public interface InterviewService {
    String scheduleInterview(InterviewRequest request);
    List<InterviewResponse> getInterviewsByProfile(Long profileId);
    InterviewResponse getInterviewByProfileAndJob(Long profileId, Long jobId);
    String updateInterviewStatus(Long profileId, Long jobId, String status);
}
