package com.example.postfolio.roadmap.service;

import com.example.postfolio.roadmap.dto.RoadmapDTO;
import com.example.postfolio.roadmap.dto.RoadmapItemDTO;
import com.example.postfolio.roadmap.dto.RoadmapRequest;

import java.util.List;
import java.util.Optional;

public interface RoadmapService {
    RoadmapDTO createRoadmap(RoadmapRequest request);

    Optional<RoadmapDTO> getRoadmapByJobAndProfile(Long jobId, Long profileId);

    List<RoadmapDTO> getRoadmapsByProfile(Long profileId);

    RoadmapDTO updateRoadmapItem(Long roadmapId, Long itemId, RoadmapItemDTO itemDTO);

    boolean deleteRoadmap(Long roadmapId);

    RoadmapDTO markItemAsCompleted(Long roadmapId, Long itemId, String completionNotes);
}
