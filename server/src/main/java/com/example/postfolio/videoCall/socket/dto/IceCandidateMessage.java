package com.example.postfolio.videoCall.socket.dto;

public class IceCandidateMessage {
    private String roomId;
    private Object candidate;

    public IceCandidateMessage() {}

    public IceCandidateMessage(String roomId, Object candidate) {
        this.roomId = roomId;
        this.candidate = candidate;
    }

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public Object getCandidate() {
        return candidate;
    }

    public void setCandidate(Object candidate) {
        this.candidate = candidate;
    }
}


