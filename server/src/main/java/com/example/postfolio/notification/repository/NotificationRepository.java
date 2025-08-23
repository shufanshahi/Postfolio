package com.example.postfolio.notification.repository;

import com.example.postfolio.notification.entity.Notification;
import com.example.postfolio.notification.entity.NotificationType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.userId = :userId AND n.isRead = false")
    Long countUnreadByUserId(@Param("userId") Long userId);

    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);

    // Check if connection request notification already exists
    Optional<Notification> findByUserIdAndFromUserIdAndTypeAndRelatedEntityId(
            Long userId, Long fromUserId, NotificationType type, Long relatedEntityId);

    // Delete connection request notification when accepted/rejected
    @Modifying
    @Transactional
    void deleteByUserIdAndFromUserIdAndTypeAndRelatedEntityId(
            Long userId, Long fromUserId, NotificationType type, Long relatedEntityId);
}
