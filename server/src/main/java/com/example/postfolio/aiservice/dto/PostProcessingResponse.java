package com.example.postfolio.aiservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostProcessingResponse implements Serializable {
    private Long postId;
    private String cvHeading;
    private List<String> tags;
    private boolean autoTagged;
    private String postType;
    private boolean success;
    private String errorMessage;
}
