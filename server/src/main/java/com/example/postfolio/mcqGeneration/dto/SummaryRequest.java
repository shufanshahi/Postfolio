package com.example.postfolio.mcqGeneration.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SummaryRequest {
    private String documentContent;
    private String documentName;
}