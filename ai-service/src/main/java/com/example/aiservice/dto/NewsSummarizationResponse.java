package com.example.aiservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NewsSummarizationResponse implements Serializable {
    private String originalContent;
    private String summarizedContent;
    private int originalLength;
    private int summarizedLength;
    private boolean success;
    private String errorMessage;
}
