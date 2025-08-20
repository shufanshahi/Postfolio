package com.example.postfolio.post.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class CreatePostDTO {
    @NotNull(message = "Profile ID is required")
    private Long profileId;

    @NotBlank(message = "Content cannot be empty")
    private String content;

    @Size(max = 4, message = "Maximum 4 images allowed per post")
    private List<String> images = new ArrayList<>();
}