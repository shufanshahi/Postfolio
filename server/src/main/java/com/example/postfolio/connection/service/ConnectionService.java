package com.example.postfolio.connection.service;

import com.example.postfolio.connection.entity.Connection;
import com.example.postfolio.connection.model.ConnectionStatus;
import com.example.postfolio.connection.repository.ConnectionRepository;
import com.example.postfolio.user.entity.User;
import com.example.postfolio.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConnectionService {

    private final ConnectionRepository connectionRepository;
    private final UserRepository userRepository;

    /**
     * Send a friend request from current user to another user
     */
    @Transactional
    public Connection sendFriendRequest(Long receiverId) {
        User requester = getCurrentUser();
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        // Check if users are the same
        if (requester.getId().equals(receiverId)) {
            throw new RuntimeException("Cannot send friend request to yourself");
        }

        // Check if connection already exists
        Optional<Connection> existingConnection = connectionRepository.findConnectionBetweenUsers(requester, receiver);
        if (existingConnection.isPresent()) {
            Connection connection = existingConnection.get();
            if (connection.getStatus() == ConnectionStatus.PENDING) {
                throw new RuntimeException("Friend request already sent");
            } else if (connection.getStatus() == ConnectionStatus.ACCEPTED) {
                throw new RuntimeException("Users are already connected");
            } else if (connection.getStatus() == ConnectionStatus.BLOCKED) {
                throw new RuntimeException("Cannot send request to blocked user");
            }
        }

        // Create new connection
        Connection connection = Connection.builder()
                .requester(requester)
                .receiver(receiver)
                .status(ConnectionStatus.PENDING)
                .build();

        return connectionRepository.save(connection);
    }

    /**
     * Accept a friend request
     */
    @Transactional
    public Connection acceptFriendRequest(Long connectionId) {
        User currentUser = getCurrentUser();
        Connection connection = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new RuntimeException("Connection not found"));

        // Verify the current user is the receiver
        if (!connection.getReceiver().getId().equals(currentUser.getId())) {
            throw new RuntimeException("You can only accept requests sent to you");
        }

        if (connection.getStatus() != ConnectionStatus.PENDING) {
            throw new RuntimeException("Connection is not in pending status");
        }

        connection.setStatus(ConnectionStatus.ACCEPTED);
        return connectionRepository.save(connection);
    }

    /**
     * Reject a friend request
     */
    @Transactional
    public Connection rejectFriendRequest(Long connectionId) {
        User currentUser = getCurrentUser();
        Connection connection = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new RuntimeException("Connection not found"));

        // Verify the current user is the receiver
        if (!connection.getReceiver().getId().equals(currentUser.getId())) {
            throw new RuntimeException("You can only reject requests sent to you");
        }

        if (connection.getStatus() != ConnectionStatus.PENDING) {
            throw new RuntimeException("Connection is not in pending status");
        }

        connection.setStatus(ConnectionStatus.REJECTED);
        return connectionRepository.save(connection);
    }

    /**
     * Remove a connection (unfriend)
     */
    @Transactional
    public void removeConnection(Long connectionId) {
        User currentUser = getCurrentUser();
        Connection connection = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new RuntimeException("Connection not found"));

        // Verify the current user is part of this connection
        if (!connection.getRequester().getId().equals(currentUser.getId()) && 
            !connection.getReceiver().getId().equals(currentUser.getId())) {
            throw new RuntimeException("You can only remove your own connections");
        }

        connectionRepository.delete(connection);
    }

    /**
     * Get all accepted connections for current user
     */
    @Transactional(readOnly = true)
    public List<Connection> getMyConnections() {
        User currentUser = getCurrentUser();
        return connectionRepository.findAcceptedConnectionsByUser(currentUser);
    }

    /**
     * Get pending requests sent by current user
     */
    @Transactional(readOnly = true)
    public List<Connection> getPendingRequestsSent() {
        User currentUser = getCurrentUser();
        return connectionRepository.findPendingRequestsSentByUser(currentUser);
    }

    /**
     * Get pending requests received by current user
     */
    @Transactional(readOnly = true)
    public List<Connection> getPendingRequestsReceived() {
        User currentUser = getCurrentUser();
        return connectionRepository.findPendingRequestsReceivedByUser(currentUser);
    }

    /**
     * Check if two users are connected
     */
    @Transactional(readOnly = true)
    public boolean areUsersConnected(Long userId1, Long userId2) {
        User user1 = userRepository.findById(userId1)
                .orElseThrow(() -> new RuntimeException("User not found"));
        User user2 = userRepository.findById(userId2)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return connectionRepository.areUsersConnected(user1, user2);
    }

    /**
     * Check if there's a pending request between users
     */
    @Transactional(readOnly = true)
    public boolean hasPendingRequest(Long userId1, Long userId2) {
        User user1 = userRepository.findById(userId1)
                .orElseThrow(() -> new RuntimeException("User not found"));
        User user2 = userRepository.findById(userId2)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return connectionRepository.hasPendingRequest(user1, user2);
    }

    /**
     * Get connection status between current user and another user
     */
    @Transactional(readOnly = true)
    public ConnectionStatus getConnectionStatus(Long otherUserId) {
        User currentUser = getCurrentUser();
        User otherUser = userRepository.findById(otherUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Optional<Connection> connection = connectionRepository.findConnectionBetweenUsers(currentUser, otherUser);
        return connection.map(Connection::getStatus).orElse(null);
    }

    /**
     * Get connection count for current user
     */
    @Transactional(readOnly = true)
    public long getConnectionCount() {
        User currentUser = getCurrentUser();
        return connectionRepository.countAcceptedConnectionsByUser(currentUser);
    }

    /**
     * Get current authenticated user
     */
    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
} 