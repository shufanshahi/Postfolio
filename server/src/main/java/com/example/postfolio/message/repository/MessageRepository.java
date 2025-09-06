package com.example.postfolio.message.repository;

import com.example.postfolio.message.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    Page<Message> findByConversationIdOrderByTimestampDesc(Long conversationId, Pageable pageable);

    List<Message> findByConversationIdOrderByTimestampAsc(Long conversationId);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.conversation.id = :conversationId AND m.sender.id != :userId AND m.isRead = false")
    long countUnreadMessages(@Param("conversationId") Long conversationId, @Param("userId") Long userId);

    @Modifying
    @Query("UPDATE Message m SET m.isRead = true, m.readAt = CURRENT_TIMESTAMP WHERE m.conversation.id = :conversationId AND m.sender.id != :userId AND m.isRead = false")
    void markMessagesAsRead(@Param("conversationId") Long conversationId, @Param("userId") Long userId);

    // Count messages sent by a user after a specific date
    @Query("SELECT COUNT(m) FROM Message m WHERE m.sender.id = :senderId AND m.timestamp >= :since")
    long countBySenderIdAndCreatedAtAfter(@Param("senderId") Long senderId, @Param("since") LocalDateTime since);
}
