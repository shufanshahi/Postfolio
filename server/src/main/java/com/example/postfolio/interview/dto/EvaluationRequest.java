package com.example.postfolio.interview.dto;

import lombok.Data;
import java.util.List;

@Data
public class EvaluationRequest {
    private List<QuestionAnswer> questionAnswers;
    
    @Data
    public static class QuestionAnswer {
        private String question;
        private String answer;
    }
}
