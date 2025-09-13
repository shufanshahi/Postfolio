package com.example.postfolio.rag.dto;

public class QuestionResponse {
    private String answer;
    private String context;

    public QuestionResponse() {}

    public QuestionResponse(String answer, String context) {
        this.answer = answer;
        this.context = context;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public String getContext() {
        return context;
    }

    public void setContext(String context) {
        this.context = context;
    }
}