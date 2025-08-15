package com.example.postfolio.postservice.post.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class TagUpdateDTO {
    @NotNull
    private Long profileId;

    @NotNull
    private List<String> tags;
} 