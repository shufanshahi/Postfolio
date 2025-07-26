package com.example.postfolio.post.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class UpdatePostDTO {
    @NotNull(message = "Profile ID is required")
    private Long profileId;

    @NotBlank(message = "Content cannot be empty")
    private String content;

    // NEW: Allow manual tag overrides
    private List<String> tags;
}