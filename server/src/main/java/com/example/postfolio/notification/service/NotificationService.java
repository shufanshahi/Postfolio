package com.example.postfolio.notification.service;

import com.example.postfolio.notification.entity.Notification;
import com.example.postfolio.notification.entity.NotificationType;
import com.example.postfolio.notification.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    // Create connection request notification
    public void createConnectionRequestNotification(Long receiverId, Long senderId, String senderName,
            Long connectionRequestId) {
        // Check if notification already exists
        Optional<Notification> existingNotification = notificationRepository
                .findByUserIdAndFromUserIdAndTypeAndRelatedEntityId(
                        receiverId, senderId, NotificationType.CONNECTION_REQUEST, connectionRequestId);

        if (existingNotification.isPresent()) {
            return; // Don't create duplicate notifications
        }

        Notification notification = new Notification(
                receiverId,
                senderId,
                senderName,
                "New Connection Request",
                senderName + " wants to connect with you",
                NotificationType.CONNECTION_REQUEST);
        notification.setRelatedEntityId(connectionRequestId);
        notification.setActionUrl("/connections");

        notificationRepository.save(notification);
    }

    // Create connection accepted notification
    public void createConnectionAcceptedNotification(Long senderId, Long accepterId, String accepterName,
            Long connectionRequestId) {
        // Delete the original connection request notification
        notificationRepository.deleteByUserIdAndFromUserIdAndTypeAndRelatedEntityId(
                accepterId, senderId, NotificationType.CONNECTION_REQUEST, connectionRequestId);

        // Create accepted notification for the original sender
        Notification notification = new Notification(
                senderId,
                accepterId,
                accepterName,
                "Connection Accepted",
                "You are now connected with " + accepterName,
                NotificationType.CONNECTION_ACCEPTED);
        notification.setRelatedEntityId(connectionRequestId);
        notification.setActionUrl("/connections");

        notificationRepository.save(notification);
    }

    // Create connection rejected notification (optional)
    public void createConnectionRejectedNotification(Long senderId, Long rejecterId, String rejecterName,
            Long connectionRequestId) {
        // Delete the original connection request notification
        notificationRepository.deleteByUserIdAndFromUserIdAndTypeAndRelatedEntityId(
                rejecterId, senderId, NotificationType.CONNECTION_REQUEST, connectionRequestId);

        // Optionally create rejected notification for the original sender
        Notification notification = new Notification(
                senderId,
                rejecterId,
                rejecterName,
                "Connection Request Declined",
                rejecterName + " declined your connection request",
                NotificationType.CONNECTION_REJECTED);
        notification.setRelatedEntityId(connectionRequestId);

        notificationRepository.save(notification);
    }

    // Generic notification creation
    public Notification createNotification(Long userId, Long fromUserId, String fromUserName,
            String title, String message, NotificationType type) {
        Notification notification = new Notification(userId, fromUserId, fromUserName, title, message, type);
        return notificationRepository.save(notification);
    }

    // Create follow notification
    public void createFollowNotification(Long followedUserId, Long followerId, String followerName) {
        // Don't send notification if user follows themselves
        if (followedUserId.equals(followerId)) {
            return;
        }

        Notification notification = new Notification(
                followedUserId,
                followerId,
                followerName,
                "New Follower",
                followerName + " started following you",
                NotificationType.FOLLOW);
        notification.setActionUrl("/profile");

        notificationRepository.save(notification);
    }

    // Create post celebrated notification
    public void createPostCelebratedNotification(Long postOwnerId, Long celebratorId, String celebratorName,
            Long postId) {
        // Don't send notification if user celebrates their own post
        if (postOwnerId.equals(celebratorId)) {
            return;
        }

        // Check if notification already exists for this celebration
        Optional<Notification> existingNotification = notificationRepository
                .findByUserIdAndFromUserIdAndTypeAndRelatedEntityId(
                        postOwnerId, celebratorId, NotificationType.POST_LIKED, postId);

        if (existingNotification.isPresent()) {
            return; // Don't create duplicate notifications
        }

        Notification notification = new Notification(
                postOwnerId,
                celebratorId,
                celebratorName,
                "Post Celebrated! 🎉",
                celebratorName + " celebrated your post with confetti!",
                NotificationType.POST_LIKED);
        notification.setRelatedEntityId(postId);
        notification.setActionUrl("/myfeed");

        notificationRepository.save(notification);
    }

    // Remove post celebrated notification (when uncelebrated)
    public void removePostCelebratedNotification(Long postOwnerId, Long celebratorId, Long postId) {
        notificationRepository.deleteByUserIdAndFromUserIdAndTypeAndRelatedEntityId(
                postOwnerId, celebratorId, NotificationType.POST_LIKED, postId);
    }

    // Create post grief notification
    public void createPostGriefNotification(Long postOwnerId, Long griefererId, String grieferName,
            Long postId) {
        // Don't send notification if user griefs their own post
        if (postOwnerId.equals(griefererId)) {
            return;
        }

        // Check if notification already exists for this grief
        Optional<Notification> existingNotification = notificationRepository
                .findByUserIdAndFromUserIdAndTypeAndRelatedEntityId(
                        postOwnerId, griefererId, NotificationType.POST_GRIEF, postId);

        if (existingNotification.isPresent()) {
            return; // Don't create duplicate notifications
        }

        Notification notification = new Notification(
                postOwnerId,
                griefererId,
                grieferName,
                "Post Grief 😢",
                grieferName + " expressed grief on your post",
                NotificationType.POST_GRIEF);
        notification.setRelatedEntityId(postId);
        notification.setActionUrl("/myfeed");

        notificationRepository.save(notification);
    }

    // Remove post grief notification (when ungriefed)
    public void removePostGriefNotification(Long postOwnerId, Long griefererId, Long postId) {
        notificationRepository.deleteByUserIdAndFromUserIdAndTypeAndRelatedEntityId(
                postOwnerId, griefererId, NotificationType.POST_GRIEF, postId);
    }

    // Create message notification
    public void createMessageNotification(Long receiverId, Long senderId, String senderName, String messageContent,
            String messageType, Long conversationId) {
        // Don't send notification if user sends message to themselves
        if (receiverId.equals(senderId)) {
            return;
        }

        String title = "New Message";
        String message;

        if ("IMAGE".equals(messageType)) {
            message = senderName + " sent you an image";
        } else {
            String content = messageContent != null ? messageContent : "New message";
            // Truncate message if too long
            if (content.length() > 50) {
                content = content.substring(0, 50) + "...";
            }
            message = senderName + ": " + content;
        }

        Notification notification = new Notification(
                receiverId,
                senderId,
                senderName,
                title,
                message,
                NotificationType.MESSAGE);
        notification.setRelatedEntityId(conversationId);
        notification.setActionUrl("/connections"); // Navigate to messages tab in connections

        notificationRepository.save(notification);
    }

    // Get user notifications
    public List<Notification> getUserNotifications(Long userId, int page, int size) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size));
    }

    // Get unread count
    public Long getUnreadCount(Long userId) {
        return notificationRepository.countUnreadByUserId(userId);
    }

    // Mark as read
    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            notification.setIsRead(true);
            notificationRepository.save(notification);
        });
    }

    // Mark all as read
    public void markAllAsRead(Long userId) {
        List<Notification> unreadNotifications = notificationRepository
                .findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        unreadNotifications.forEach(notification -> notification.setIsRead(true));
        notificationRepository.saveAll(unreadNotifications);
    }
}
