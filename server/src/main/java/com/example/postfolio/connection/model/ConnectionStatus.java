package com.example.postfolio.connection.model;

public enum ConnectionStatus {
    PENDING,    // Friend request sent, waiting for response
    ACCEPTED,   // Friend request accepted
    REJECTED,   // Friend request rejected
    BLOCKED     // User blocked by another user
} 