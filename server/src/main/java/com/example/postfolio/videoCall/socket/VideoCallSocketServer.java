package com.example.postfolio.videoCall.socket;

import com.corundumstudio.socketio.AckRequest;
import com.corundumstudio.socketio.BroadcastOperations;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.listener.ConnectListener;
import com.corundumstudio.socketio.listener.DataListener;
import com.corundumstudio.socketio.listener.DisconnectListener;
import com.example.postfolio.videoCall.socket.dto.IceCandidateMessage;
import com.example.postfolio.videoCall.socket.dto.JoinPayload;
import com.example.postfolio.videoCall.socket.dto.SDPMessage;
import com.example.postfolio.videoCall.socket.dto.WhiteboardEvent;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@Component
public class VideoCallSocketServer {

    private static final Logger log = LoggerFactory.getLogger(VideoCallSocketServer.class);

    private final SocketIOServer server;

    // Track room -> set of session IDs to enforce 1:1 calls
    private final Map<String, Set<String>> roomParticipants = new HashMap<>();

    public VideoCallSocketServer(SocketIOServer server) {
        this.server = server;
    }

    @PostConstruct
    public void start() {
        log.info("Starting Socket.IO signaling server");

        // Basic lifecycle logs
        server.addConnectListener(new ConnectListener() {
            @Override
            public void onConnect(SocketIOClient client) {
                log.info("Client connected: {}", client.getSessionId());
            }
        });

        server.addDisconnectListener(new DisconnectListener() {
            @Override
            public void onDisconnect(SocketIOClient client) {
                log.info("Client disconnected: {}", client.getSessionId());
                // Remove from any rooms it joined
                for (Map.Entry<String, Set<String>> e : roomParticipants.entrySet()) {
                    if (e.getValue().remove(client.getSessionId().toString())) {
                        BroadcastOperations room = server.getRoomOperations(e.getKey());
                        room.sendEvent("peer-left");
                        break;
                    }
                }
            }
        });

        // Join room
        server.addEventListener("join", JoinPayload.class, new DataListener<JoinPayload>() {
            @Override
            public void onData(SocketIOClient client, JoinPayload data, AckRequest ackSender) {
                String roomId = data.getRoomId();
                if (roomId == null || roomId.isBlank()) {
                    client.sendEvent("error-message", "roomId is required");
                    return;
                }

                Set<String> participants = roomParticipants.computeIfAbsent(roomId, k -> new HashSet<>());
                if (participants.size() >= 2 && !participants.contains(client.getSessionId().toString())) {
                    client.sendEvent("error-message", "Room is full");
                    return;
                }

                client.joinRoom(roomId);
                participants.add(client.getSessionId().toString());
                log.info("Client {} joined room {} ({} participants)", client.getSessionId(), roomId, participants.size());

                // When two participants are present, signal readiness
                if (participants.size() == 2) {
                    server.getRoomOperations(roomId).sendEvent("ready");
                }
            }
        });

        // Leave room (explicit)
        server.addEventListener("leave", JoinPayload.class, new DataListener<JoinPayload>() {
            @Override
            public void onData(SocketIOClient client, JoinPayload data, AckRequest ackSender) {
                String roomId = data.getRoomId();
                if (roomId == null) return;
                client.leaveRoom(roomId);
                Set<String> participants = roomParticipants.get(roomId);
                if (participants != null) {
                    participants.remove(client.getSessionId().toString());
                }
                server.getRoomOperations(roomId).sendEvent("peer-left");
            }
        });

        // WebRTC signaling relays
        server.addEventListener("offer", SDPMessage.class, new DataListener<SDPMessage>() {
            @Override
            public void onData(SocketIOClient client, SDPMessage data, AckRequest ackSender) {
                relay(client, data.getRoomId(), "offer", data);
            }
        });
        server.addEventListener("answer", SDPMessage.class, new DataListener<SDPMessage>() {
            @Override
            public void onData(SocketIOClient client, SDPMessage data, AckRequest ackSender) {
                relay(client, data.getRoomId(), "answer", data);
            }
        });
        server.addEventListener("candidate", IceCandidateMessage.class, new DataListener<IceCandidateMessage>() {
            @Override
            public void onData(SocketIOClient client, IceCandidateMessage data, AckRequest ackSender) {
                relay(client, data.getRoomId(), "candidate", data);
            }
        });

        // Whiteboard relay events (shared within a room)
        server.addEventListener("whiteboard-event", WhiteboardEvent.class, new DataListener<WhiteboardEvent>() {
            @Override
            public void onData(SocketIOClient client, WhiteboardEvent data, AckRequest ackSender) {
                relay(client, data.getRoomId(), "whiteboard-event", data);
            }
        });

        server.start();
    }

    private void relay(SocketIOClient sender, String roomId, String event, Object payload) {
        if (roomId == null || roomId.isBlank()) {
            sender.sendEvent("error-message", "roomId is required");
            return;
        }
        BroadcastOperations room = server.getRoomOperations(roomId);
        // Send to everyone in the room EXCEPT the sender to prevent self-echo
        for (SocketIOClient client : room.getClients()) {
            if (!client.getSessionId().equals(sender.getSessionId())) {
                client.sendEvent(event, payload);
            }
        }
    }

    @PreDestroy
    public void stop() {
        try {
            log.info("Stopping Socket.IO signaling server");
            server.stop();
        } catch (Exception e) {
            log.warn("Error while stopping Socket.IO server", e);
        }
    }
}


