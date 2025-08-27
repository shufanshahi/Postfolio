package com.example.postfolio.interview.dto;

import lombok.Data;
import java.util.List;

@Data
public class EvaluationResponse {
    private int rating;
    private List<String> strengths;
    private List<String> weaknesses;
    private List<String> improvements;
}
