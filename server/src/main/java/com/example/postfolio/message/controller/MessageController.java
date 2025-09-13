package com.example.postfolio.message.controller;

import com.example.postfolio.message.dto.ConversationResponse;
import com.example.postfolio.message.dto.MessageResponse;
import com.example.postfolio.message.dto.SendMessageRequest;
import com.example.postfolio.message.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @PostMapping("/send")
    public ResponseEntity<MessageResponse> sendMessage(@RequestBody SendMessageRequest request) {
        String userEmail = getCurrentUserEmail();
        MessageResponse response = messageService.sendMessage(request, userEmail);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationResponse>> getUserConversations() {
        String userEmail = getCurrentUserEmail();
        List<ConversationResponse> conversations = messageService.getUserConversations(userEmail);
        return ResponseEntity.ok(conversations);
    }

    @GetMapping("/conversations/{conversationId}")
    public ResponseEntity<ConversationResponse> getConversation(@PathVariable Long conversationId) {
        String userEmail = getCurrentUserEmail();
        ConversationResponse conversation = messageService.getConversation(conversationId, userEmail);
        return ResponseEntity.ok(conversation);
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<List<MessageResponse>> getConversationMessages(@PathVariable Long conversationId) {
        String userEmail = getCurrentUserEmail();
        List<MessageResponse> messages = messageService.getConversationMessages(conversationId, userEmail);
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/conversations/{conversationId}/read")
    public ResponseEntity<Void> markConversationAsRead(@PathVariable Long conversationId) {
        String userEmail = getCurrentUserEmail();
        messageService.markConversationAsRead(conversationId, userEmail);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/conversations/create")
    public ResponseEntity<ConversationResponse> createConversation(@RequestParam String otherUserEmail) {
        String userEmail = getCurrentUserEmail();
        ConversationResponse conversation = messageService.createOrGetConversation(userEmail, otherUserEmail);
        return ResponseEntity.ok(conversation);
    }

    private String getCurrentUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            return authentication.getName();
        }
        throw new RuntimeException("User not authenticated");
    }
}
