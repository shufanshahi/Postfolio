package com.example.postfolio.interview.service;

import com.example.postfolio.interview.dto.InterviewRequest;
import com.example.postfolio.interview.dto.InterviewResponse;
import com.example.postfolio.interview.entity.Interview;
import com.example.postfolio.interview.model.InterviewStatus;
import com.example.postfolio.interview.repository.InterviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InterviewServiceImpl implements InterviewService {

    @Autowired
    private InterviewRepository interviewRepository;

    @Override
    public String scheduleInterview(InterviewRequest request) {
        Interview existingInterview = interviewRepository.findByProfileIdAndJobId(request.getProfileId(), request.getJobId());
        if (existingInterview != null) {
            existingInterview.setSchedule(request.getSchedule());
            existingInterview.setNotes(request.getNotes());
            interviewRepository.save(existingInterview);
            return "Interview schedule updated successfully.";
        }
        Interview interview = Interview.builder()
                .jobId(request.getJobId())
                .profileId(request.getProfileId())
                .schedule(request.getSchedule())
                .status(request.getStatus() != null ? request.getStatus() : InterviewStatus.PENDING)
                .notes(request.getNotes())
                .build();
        interviewRepository.save(interview);
        return "Interview scheduled successfully.";
    }
    
    @Override
    public List<InterviewResponse> getInterviewsByProfile(Long profileId) {
        return interviewRepository.findByProfileId(profileId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public InterviewResponse getInterviewByProfileAndJob(Long profileId, Long jobId) {
        Interview interview = interviewRepository.findByProfileIdAndJobId(profileId, jobId);
        if (interview == null) {
            return null;
        }
        return mapToResponse(interview);
    }
    
    @Override
    public InterviewResponse getInterviewById(Long interviewId) {
        Interview interview = interviewRepository.findById(interviewId).orElse(null);
        if (interview == null) {
            return null;
        }
        return mapToResponse(interview);
    }
    
    private InterviewResponse mapToResponse(Interview interview) {
        InterviewResponse response = new InterviewResponse();
        BeanUtils.copyProperties(interview, response);
        return response;
    }

    @Override
    public String updateInterviewStatus(Long profileId, Long jobId, String status) {
        Interview interview = interviewRepository.findByProfileIdAndJobId(profileId, jobId);
        if (interview == null) {
            return "Interview not found.";
        }
        interview.setStatus(InterviewStatus.valueOf(status.toUpperCase()));
        interviewRepository.save(interview);
        return "Interview status updated successfully.";
    }
}
