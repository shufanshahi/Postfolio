package com.example.postfolio.search.service;

import com.example.postfolio.connection.model.ConnectionStatus;
import com.example.postfolio.connection.service.ConnectionService;
import com.example.postfolio.user.entity.User;
import com.example.postfolio.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final UserRepository userRepository;
    private final ConnectionService connectionService;

    public List<UserSearchResult> searchUsers(String searchTerm) {
        User currentUser = getCurrentUser();
        
        List<User> users = userRepository.searchUsers(searchTerm, currentUser.getId());
        
        return users.stream()
                .map(user -> {
                    ConnectionStatus connectionStatus = connectionService.getConnectionStatus(user.getId());
                    return UserSearchResult.builder()
                            .id(user.getId())
                            .name(user.getName())
                            .email(user.getEmail())
                            .connectionStatus(connectionStatus)
                            .build();
                })
                .collect(Collectors.toList());
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public static class UserSearchResult {
        private Long id;
        private String name;
        private String email;
        private ConnectionStatus connectionStatus;

        // Builder pattern
        public static UserSearchResultBuilder builder() {
            return new UserSearchResultBuilder();
        }

        public static class UserSearchResultBuilder {
            private UserSearchResult result = new UserSearchResult();

            public UserSearchResultBuilder id(Long id) {
                result.id = id;
                return this;
            }

            public UserSearchResultBuilder name(String name) {
                result.name = name;
                return this;
            }

            public UserSearchResultBuilder email(String email) {
                result.email = email;
                return this;
            }

            public UserSearchResultBuilder connectionStatus(ConnectionStatus connectionStatus) {
                result.connectionStatus = connectionStatus;
                return this;
            }

            public UserSearchResult build() {
                return result;
            }
        }

        // Getters
        public Long getId() { return id; }
        public String getName() { return name; }
        public String getEmail() { return email; }
        public ConnectionStatus getConnectionStatus() { return connectionStatus; }
    }
} 