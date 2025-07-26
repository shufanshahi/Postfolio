package com.example.postfolio.post.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdatePostDTO {
    @NotNull(message = "Profile ID is required")
    private Long profileId;

    @NotBlank(message = "Content cannot be empty")
    private String content;
}