package com.example.postfolio.postservice.post.dto;

import com.example.postfolio.postservice.post.models.PostType;
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
    private List<ReactionResponseDTO> reactions;
} 