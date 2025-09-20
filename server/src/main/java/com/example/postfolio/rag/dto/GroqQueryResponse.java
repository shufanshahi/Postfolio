package com.example.postfolio.rag.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroqQueryResponse {
    private String answer;
    private String model;
    private boolean success;
    private String error;
}