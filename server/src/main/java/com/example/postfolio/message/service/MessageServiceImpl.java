package com.example.postfolio.message.service;

import com.example.postfolio.connection.repository.ConnectionRepository;
import com.example.postfolio.message.dto.ConversationResponse;
import com.example.postfolio.message.dto.MessageResponse;
import com.example.postfolio.message.dto.SendMessageRequest;
import com.example.postfolio.message.entity.Conversation;
import com.example.postfolio.message.entity.Message;
import com.example.postfolio.message.repository.ConversationRepository;
import com.example.postfolio.message.repository.MessageRepository;
import com.example.postfolio.user.entity.User;
import com.example.postfolio.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;
    private final ConnectionRepository connectionRepository;

    @Override
    public MessageResponse sendMessage(SendMessageRequest request, String senderEmail) {
        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        Conversation conversation;
        User receiver;

        if (request.getConversationId() != null) {
            // Existing conversation
            conversation = conversationRepository.findById(request.getConversationId())
                    .orElseThrow(() -> new RuntimeException("Conversation not found"));

            // Verify sender is part of this conversation
            if (!conversation.getUser1().getId().equals(sender.getId()) &&
                    !conversation.getUser2().getId().equals(sender.getId())) {
                throw new RuntimeException("You are not part of this conversation");
            }

            // Get the other user in the conversation
            receiver = conversation.getUser1().getId().equals(sender.getId())
                    ? conversation.getUser2()
                    : conversation.getUser1();
        } else {
            // New conversation
            receiver = userRepository.findByEmail(request.getReceiverEmail())
                    .orElseThrow(() -> new RuntimeException("Receiver not found"));

            if (!areUsersConnected(senderEmail, request.getReceiverEmail())) {
                throw new RuntimeException("Users must be connected to send messages");
            }

            conversation = createOrGetConversationEntity(senderEmail, request.getReceiverEmail());
        }

        // Create and save the message
        Message message = Message.builder()
                .conversation(conversation)
                .sender(sender)
                .type(request.getType())
                .content(request.getContent())
                .imageData(request.getImageData())
                .imageName(request.getImageName())
                .imageType(request.getImageType())
                .timestamp(LocalDateTime.now())
                .isRead(false)
                .build();

        Message savedMessage = messageRepository.save(message);

        // Update conversation's last message timestamp
        conversation.setLastMessageAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        // Convert to response
        MessageResponse messageResponse = convertToMessageResponse(savedMessage);

        log.info("Message sent successfully from {} to {} in conversation: {}",
                sender.getEmail(), receiver.getEmail(), conversation.getId());

        return messageResponse;
    }

    @Override
    public List<MessageResponse> getConversationMessages(Long conversationId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        // Verify user is part of this conversation
        if (!conversation.getUser1().getId().equals(user.getId()) &&
                !conversation.getUser2().getId().equals(user.getId())) {
            throw new RuntimeException("You are not part of this conversation");
        }

        // Mark messages as read
        messageRepository.markMessagesAsRead(conversationId, user.getId());

        return messageRepository.findByConversationIdOrderByTimestampAsc(conversationId)
                .stream()
                .map(this::convertToMessageResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ConversationResponse> getUserConversations(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return conversationRepository.findByUserOrderByLastMessage(user)
                .stream()
                .map(conv -> convertToConversationResponse(conv, userEmail))
                .collect(Collectors.toList());
    }

    @Override
    public ConversationResponse getConversation(Long conversationId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        // Verify user is part of this conversation
        if (!conversation.getUser1().getId().equals(user.getId()) &&
                !conversation.getUser2().getId().equals(user.getId())) {
            throw new RuntimeException("You are not part of this conversation");
        }

        return convertToConversationResponse(conversation, userEmail);
    }

    @Override
    public void markConversationAsRead(Long conversationId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        // Verify user is part of this conversation
        if (!conversation.getUser1().getId().equals(user.getId()) &&
                !conversation.getUser2().getId().equals(user.getId())) {
            throw new RuntimeException("You are not part of this conversation");
        }

        messageRepository.markMessagesAsRead(conversationId, user.getId());
    }

    @Override
    public ConversationResponse createOrGetConversation(String user1Email, String user2Email) {
        Conversation conversation = createOrGetConversationEntity(user1Email, user2Email);
        return convertToConversationResponse(conversation, user1Email);
    }

    private Conversation createOrGetConversationEntity(String user1Email, String user2Email) {
        User user1 = userRepository.findByEmail(user1Email)
                .orElseThrow(() -> new RuntimeException("User 1 not found"));
        User user2 = userRepository.findByEmail(user2Email)
                .orElseThrow(() -> new RuntimeException("User 2 not found"));

        return conversationRepository.findByUsers(user1, user2)
                .orElseGet(() -> {
                    Conversation newConversation = Conversation.builder()
                            .user1(user1)
                            .user2(user2)
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();
                    return conversationRepository.save(newConversation);
                });
    }

    private boolean areUsersConnected(String user1Email, String user2Email) {
        User user1 = userRepository.findByEmail(user1Email)
                .orElseThrow(() -> new RuntimeException("User 1 not found"));
        User user2 = userRepository.findByEmail(user2Email)
                .orElseThrow(() -> new RuntimeException("User 2 not found"));

        return connectionRepository.areUsersConnected(user1, user2);
    }

    private MessageResponse convertToMessageResponse(Message message) {
        return MessageResponse.builder()
                .id(message.getId())
                .conversationId(message.getConversation().getId())
                .senderId(message.getSender().getId())
                .senderName(message.getSender().getName())
                .senderAvatar(
                        message.getSender().getProfile() != null ? message.getSender().getProfile().getPictureBase64()
                                : null)
                .type(message.getType())
                .content(message.getContent())
                .imageData(message.getImageData())
                .imageName(message.getImageName())
                .imageType(message.getImageType())
                .timestamp(message.getTimestamp())
                .isRead(message.isRead())
                .readAt(message.getReadAt())
                .build();
    }

    private ConversationResponse convertToConversationResponse(Conversation conversation, String currentUserEmail) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        User otherUser = conversation.getUser1().getId().equals(currentUser.getId())
                ? conversation.getUser2()
                : conversation.getUser1();

        long unreadCount = messageRepository.countUnreadMessages(conversation.getId(), currentUser.getId());

        return ConversationResponse.builder()
                .id(conversation.getId())
                .otherUserId(otherUser.getId())
                .otherUserName(otherUser.getName())
                .otherUserAvatar(otherUser.getProfile() != null ? otherUser.getProfile().getPictureBase64() : null)
                .lastMessage("") // We'll add this later if needed
                .lastMessageType("") // We'll add this later if needed
                .lastMessageAt(conversation.getLastMessageAt())
                .unreadCount((int) unreadCount)
                .createdAt(conversation.getCreatedAt())
                .build();
    }
}