package com.example.postfolio.message.entity;

public enum MessageType {
    TEXT,       // Regular text message
    IMAGE,      // Image message (base64)
    EMOJI,     // Emoji message
    SYSTEM      // System message (e.g., user joined, left)
}
