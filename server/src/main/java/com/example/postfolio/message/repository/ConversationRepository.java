package com.example.postfolio.message.repository;

import com.example.postfolio.message.entity.Conversation;
import com.example.postfolio.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    
    @Query("SELECT c FROM Conversation c WHERE (c.user1 = :user1 AND c.user2 = :user2) OR (c.user1 = :user2 AND c.user2 = :user1)")
    Optional<Conversation> findByUsers(@Param("user1") User user1, @Param("user2") User user2);
    
    @Query("SELECT c FROM Conversation c WHERE c.user1 = :user OR c.user2 = :user ORDER BY c.lastMessageAt DESC")
    List<Conversation> findByUserOrderByLastMessage(@Param("user") User user);
    
    @Query("SELECT c FROM Conversation c WHERE (c.user1 = :user1 AND c.user2 = :user2) OR (c.user1 = :user2 AND c.user2 = :user1)")
    boolean existsByUsers(@Param("user1") User user1, @Param("user2") User user2);
}
