package com.example.postfolio.postservice.post.dto;

import com.example.postfolio.postservice.post.model.ReactionType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ReactionResponseDTO {
    private Long id;
    private ReactionType type;
    private String userName;
    private LocalDateTime createdAt;
} 