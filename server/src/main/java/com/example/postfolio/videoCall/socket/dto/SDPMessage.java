package com.example.postfolio.videoCall.socket.dto;

public class SDPMessage {
    private String roomId;
    private Object sdp;

    public SDPMessage() {}

    public SDPMessage(String roomId, Object sdp) {
        this.roomId = roomId;
        this.sdp = sdp;
    }

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public Object getSdp() {
        return sdp;
    }

    public void setSdp(Object sdp) {
        this.sdp = sdp;
    }
}


