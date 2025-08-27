package com.example.postfolio.message.socket;

import com.corundumstudio.socketio.AckRequest;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.listener.ConnectListener;
import com.corundumstudio.socketio.listener.DataListener;
import com.corundumstudio.socketio.listener.DisconnectListener;
import com.example.postfolio.message.dto.MessageResponse;
import com.example.postfolio.user.entity.User;
import com.example.postfolio.user.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

// @Component - Disabled: Using polling instead of real-time messaging
@Slf4j
public class MessagingSocketServer {

    private final SocketIOServer server;
    private final UserRepository userRepository;

    // Track user email -> session ID mapping
    private final Map<String, String> userSessions = new HashMap<>();
    // Track session ID -> user email mapping
    private final Map<String, String> sessionUsers = new HashMap<>();

    public MessagingSocketServer(
            @Qualifier("messagingSocketIOServer") SocketIOServer server,
            UserRepository userRepository) {
        this.server = server;
        this.userRepository = userRepository;
    }

    @PostConstruct
    public void start() {
        log.info("Starting Messaging Socket.IO server");

        // Handle client connections
        server.addConnectListener(new ConnectListener() {
            @Override
            public void onConnect(SocketIOClient client) {
                log.info("Messaging client connected: {}", client.getSessionId());
            }
        });

        // Handle client disconnections
        server.addDisconnectListener(new DisconnectListener() {
            @Override
            public void onDisconnect(SocketIOClient client) {
                String sessionId = client.getSessionId().toString();
                String userEmail = sessionUsers.remove(sessionId);
                if (userEmail != null) {
                    userSessions.remove(userEmail);
                    log.info("User {} disconnected from messaging", userEmail);
                }
                log.info("Messaging client disconnected: {}", sessionId);
            }
        });

        // Handle user authentication and room joining
        server.addEventListener("authenticate", String.class, new DataListener<String>() {
            @Override
            public void onData(SocketIOClient client, String userEmail, AckRequest ackSender) {
                String sessionId = client.getSessionId().toString();

                // Verify user exists
                Optional<User> userOpt = userRepository.findByEmail(userEmail);
                if (userOpt.isEmpty()) {
                    client.sendEvent("authentication-error", "User not found");
                    return;
                }

                // Store session mappings
                userSessions.put(userEmail, sessionId);
                sessionUsers.put(sessionId, userEmail);

                // Join user to their personal room
                client.joinRoom("user_" + userEmail);

                log.info("User {} authenticated for messaging, session: {}", userEmail, sessionId);
                client.sendEvent("authenticated", "Successfully authenticated");
            }
        });

        // Handle new message notifications
        server.addEventListener("typing", TypingEvent.class, new DataListener<TypingEvent>() {
            @Override
            public void onData(SocketIOClient client, TypingEvent data, AckRequest ackRequest) {
                // Notify other user in conversation that someone is typing
                String senderEmail = sessionUsers.get(client.getSessionId().toString());
                if (senderEmail != null) {
                    // Send typing indicator to the other user
                    server.getRoomOperations("user_" + data.getReceiverEmail())
                            .sendEvent("typing", new TypingEvent(senderEmail, data.getReceiverEmail(), true));
                }
            }
        });

        // Handle stop typing notifications
        server.addEventListener("stop-typing", TypingEvent.class, new DataListener<TypingEvent>() {
            @Override
            public void onData(SocketIOClient client, TypingEvent data, AckRequest ackRequest) {
                // Notify other user in conversation that typing stopped
                String senderEmail = sessionUsers.get(client.getSessionId().toString());
                if (senderEmail != null) {
                    // Send stop typing indicator to the other user
                    server.getRoomOperations("user_" + data.getReceiverEmail())
                            .sendEvent("typing", new TypingEvent(senderEmail, data.getReceiverEmail(), false));
                }
            }
        });

        server.start();
        log.info("Messaging Socket.IO server started");
    }

    /**
     * Send a new message to the recipient via WebSocket
     */
    public void sendMessageToUser(String recipientEmail, MessageResponse message) {
        String sessionId = userSessions.get(recipientEmail);
        if (sessionId != null) {
            try {
                UUID uuid = UUID.fromString(sessionId);
                SocketIOClient client = server.getClient(uuid);
                if (client != null) {
                    client.sendEvent("new-message", message);
                    log.info("Sent real-time message notification to: {}", recipientEmail);
                }
            } catch (IllegalArgumentException e) {
                log.error("Invalid session ID format: {}", sessionId);
            }
        }
    }

    /**
     * Send typing indicator to a user
     */
    public void sendTypingIndicator(String recipientEmail, String senderEmail, boolean isTyping) {
        String sessionId = userSessions.get(recipientEmail);
        if (sessionId != null) {
            try {
                UUID uuid = UUID.fromString(sessionId);
                SocketIOClient client = server.getClient(uuid);
                if (client != null) {
                    client.sendEvent("typing", new TypingEvent(senderEmail, recipientEmail, isTyping));
                }
            } catch (IllegalArgumentException e) {
                log.error("Invalid session ID format: {}", sessionId);
            }
        }
    }

    @PreDestroy
    public void stop() {
        if (server != null) {
            server.stop();
            log.info("Messaging Socket.IO server stopped");
        }
    }

    // Inner class for typing events
    public static class TypingEvent {
        private String senderEmail;
        private String receiverEmail;
        private boolean isTyping;

        public TypingEvent() {
        }

        public TypingEvent(String senderEmail, String receiverEmail, boolean isTyping) {
            this.senderEmail = senderEmail;
            this.receiverEmail = receiverEmail;
            this.isTyping = isTyping;
        }

        public String getSenderEmail() {
            return senderEmail;
        }

        public void setSenderEmail(String senderEmail) {
            this.senderEmail = senderEmail;
        }

        public String getReceiverEmail() {
            return receiverEmail;
        }

        public void setReceiverEmail(String receiverEmail) {
            this.receiverEmail = receiverEmail;
        }

        public boolean isTyping() {
            return isTyping;
        }

        public void setIsTyping(boolean isTyping) {
            this.isTyping = isTyping;
        }
    }
}