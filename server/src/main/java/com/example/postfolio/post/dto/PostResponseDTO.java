package com.example.postfolio.post.dto;

import com.example.postfolio.post.models.PostType;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Builder
@Data
public class PostResponseDTO {
    private Long id;
    private String content;
    private String cvHeading;      // NEW: AI-generated summary
    private PostType type;        // NEW: EXPERIENCE, PROJECT, etc.
    private List<String> tags;    // NEW: AI-generated tags
    private Boolean autoTagged;   // NEW: Flag for manual edits
    private Long profileId;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
}