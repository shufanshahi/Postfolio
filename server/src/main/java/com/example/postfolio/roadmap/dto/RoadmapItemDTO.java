package com.example.postfolio.roadmap.dto;

import com.example.postfolio.roadmap.model.RoadmapItemType;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoadmapItemDTO {
    private Long id;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate dayDate;

    private RoadmapItemType itemType;
    private String title;
    private String description;
    private List<String> resourceLinks;
    private List<String> videoLinks;
    private List<String> websiteLinks;
    private Boolean isCompleted;
    private String completionNotes;
    private Integer estimatedHours;
}
