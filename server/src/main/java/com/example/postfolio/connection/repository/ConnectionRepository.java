package com.example.postfolio.connection.repository;

import com.example.postfolio.connection.entity.Connection;
import com.example.postfolio.connection.model.ConnectionStatus;
import com.example.postfolio.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConnectionRepository extends JpaRepository<Connection, Long> {
    
    // Find connection between two users (in any direction)
    @Query("SELECT c FROM Connection c WHERE " +
           "(c.requester = :user1 AND c.receiver = :user2) OR " +
           "(c.requester = :user2 AND c.receiver = :user1)")
    Optional<Connection> findConnectionBetweenUsers(@Param("user1") User user1, @Param("user2") User user2);
    
    // Find all connections for a user (accepted only)
    @Query("SELECT c FROM Connection c WHERE " +
           "(c.requester = :user OR c.receiver = :user) AND c.status = 'ACCEPTED'")
    List<Connection> findAcceptedConnectionsByUser(@Param("user") User user);
    
    // Find pending requests sent by user
    @Query("SELECT c FROM Connection c WHERE c.requester = :user AND c.status = 'PENDING'")
    List<Connection> findPendingRequestsSentByUser(@Param("user") User user);
    
    // Find pending requests received by user
    @Query("SELECT c FROM Connection c WHERE c.receiver = :user AND c.status = 'PENDING'")
    List<Connection> findPendingRequestsReceivedByUser(@Param("user") User user);
    
    // Find all connections by status for a user
    @Query("SELECT c FROM Connection c WHERE " +
           "(c.requester = :user OR c.receiver = :user) AND c.status = :status")
    List<Connection> findConnectionsByUserAndStatus(@Param("user") User user, @Param("status") ConnectionStatus status);
    
    // Check if two users are connected (accepted status)
    @Query("SELECT COUNT(c) > 0 FROM Connection c WHERE " +
           "((c.requester = :user1 AND c.receiver = :user2) OR " +
           "(c.requester = :user2 AND c.receiver = :user1)) AND c.status = 'ACCEPTED'")
    boolean areUsersConnected(@Param("user1") User user1, @Param("user2") User user2);
    
    // Check if there's a pending request between users
    @Query("SELECT COUNT(c) > 0 FROM Connection c WHERE " +
           "((c.requester = :user1 AND c.receiver = :user2) OR " +
           "(c.requester = :user2 AND c.receiver = :user1)) AND c.status = 'PENDING'")
    boolean hasPendingRequest(@Param("user1") User user1, @Param("user2") User user2);
    
    // Get connection count for a user (accepted only)
    @Query("SELECT COUNT(c) FROM Connection c WHERE " +
           "(c.requester = :user OR c.receiver = :user) AND c.status = 'ACCEPTED'")
    long countAcceptedConnectionsByUser(@Param("user") User user);
} 