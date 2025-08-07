package com.example.postfolio.connection.controller;

import com.example.postfolio.connection.dto.ConnectionRequest;
import com.example.postfolio.connection.dto.ConnectionResponse;
import com.example.postfolio.connection.entity.Connection;
import com.example.postfolio.connection.service.ConnectionService;
import com.example.postfolio.profile.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/connections")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ConnectionController {

    private final ConnectionService connectionService;
    private final ProfileRepository profileRepository;

    @PostMapping("/send")
    public ResponseEntity<ConnectionResponse> sendFriendRequest(@RequestBody ConnectionRequest request) {
        Connection connection = connectionService.sendFriendRequest(request.getReceiverId());
        return ResponseEntity.ok(convertToResponse(connection));
    }

    @PutMapping("/{id}/accept")
    public ResponseEntity<ConnectionResponse> acceptFriendRequest(@PathVariable Long id) {
        Connection connection = connectionService.acceptFriendRequest(id);
        return ResponseEntity.ok(convertToResponse(connection));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<ConnectionResponse> rejectFriendRequest(@PathVariable Long id) {
        Connection connection = connectionService.rejectFriendRequest(id);
        return ResponseEntity.ok(convertToResponse(connection));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeConnection(@PathVariable Long id) {
        connectionService.removeConnection(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my")
    public ResponseEntity<List<ConnectionResponse>> getMyConnections() {
        List<Connection> connections = connectionService.getMyConnections();
        List<ConnectionResponse> responses = connections.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/pending/sent")
    public ResponseEntity<List<ConnectionResponse>> getPendingRequestsSent() {
        List<Connection> connections = connectionService.getPendingRequestsSent();
        List<ConnectionResponse> responses = connections.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/pending/received")
    public ResponseEntity<List<ConnectionResponse>> getPendingRequestsReceived() {
        List<Connection> connections = connectionService.getPendingRequestsReceived();
        List<ConnectionResponse> responses = connections.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/status/{userId}")
    public ResponseEntity<String> getConnectionStatus(@PathVariable Long userId) {
        var status = connectionService.getConnectionStatus(userId);
        return ResponseEntity.ok(status != null ? status.name() : "NONE");
    }

    @GetMapping("/count")
    public ResponseEntity<Long> getConnectionCount() {
        long count = connectionService.getConnectionCount();
        return ResponseEntity.ok(count);
    }

    private ConnectionResponse convertToResponse(Connection connection) {
        // Get profile information for requester
        var requesterProfile = profileRepository.findByUser(connection.getRequester());
        var receiverProfile = profileRepository.findByUser(connection.getReceiver());

        return ConnectionResponse.builder()
                .id(connection.getId())
                .requesterId(connection.getRequester().getId())
                .requesterName(connection.getRequester().getName())
                .requesterEmail(connection.getRequester().getEmail())
                .requesterProfileId(requesterProfile.map(p -> p.getId()).orElse(null))
                .requesterPictureBase64(requesterProfile.map(p -> p.getPictureBase64()).orElse(null))
                .receiverId(connection.getReceiver().getId())
                .receiverName(connection.getReceiver().getName())
                .receiverEmail(connection.getReceiver().getEmail())
                .receiverProfileId(receiverProfile.map(p -> p.getId()).orElse(null))
                .receiverPictureBase64(receiverProfile.map(p -> p.getPictureBase64()).orElse(null))
                .status(connection.getStatus())
                .createdAt(connection.getCreatedAt())
                .updatedAt(connection.getUpdatedAt())
                .build();
    }
} 