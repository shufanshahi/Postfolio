package com.example.postfolio.message.service;

import com.example.postfolio.message.dto.ConversationResponse;
import com.example.postfolio.message.dto.MessageResponse;
import com.example.postfolio.message.dto.SendMessageRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface MessageService {
    
    MessageResponse sendMessage(SendMessageRequest request, String senderEmail);
    
    List<MessageResponse> getConversationMessages(Long conversationId, String userEmail);
    
    List<ConversationResponse> getUserConversations(String userEmail);
    
    ConversationResponse getConversation(Long conversationId, String userEmail);
    
    void markConversationAsRead(Long conversationId, String userEmail);
    
    ConversationResponse createOrGetConversation(String user1Email, String user2Email);
}
