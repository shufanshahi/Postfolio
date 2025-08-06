package com.example.postfolio.post.dto;

import com.example.postfolio.post.models.PostType;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PostResponseDTO {
    private Long id;
    private String content;
    private PostType type;
    private List<String> tags;
    private String cvHeading;
    private Boolean autoTagged;
    private Long profileId;
    private String profileName;
    private String profilePictureBase64;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}