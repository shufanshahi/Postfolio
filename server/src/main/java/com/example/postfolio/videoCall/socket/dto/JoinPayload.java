package com.example.postfolio.videoCall.socket.dto;

public class JoinPayload {
    private String roomId;

    public JoinPayload() {}

    public JoinPayload(String roomId) {
        this.roomId = roomId;
    }

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }
}


