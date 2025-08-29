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
public class NewsSummarizationRequest implements Serializable {
    private String newsContent;
    private String targetAudience; // e.g., "job seekers", "professionals"
    private int maxLength; // maximum characters for the summary
    private String tone; // e.g., "engaging", "professional", "motivational"
    private boolean includeEmojis;
    private boolean includeCallToAction;
}
