package com.example.postfolio.tts.dto;

public class TtsRequest {
    private String text;

    public TtsRequest() {}

    public TtsRequest(String text) {
        this.text = text;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }
}
