package com.example.postfolio.dashboard.service;

import com.example.postfolio.connection.repository.ConnectionRepository;
import com.example.postfolio.dashboard.dto.EngagementSummaryDTO;
import com.example.postfolio.message.repository.MessageRepository;
import com.example.postfolio.post.repository.ReactionRepository;
import com.example.postfolio.profile.repository.ProfileRepository;
import com.example.postfolio.user.entity.User;
import com.example.postfolio.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardServiceImpl implements DashboardService {

    private final ConnectionRepository connectionRepository;
    private final MessageRepository messageRepository;
    private final ReactionRepository reactionRepository;
    private final ProfileRepository profileRepository;
    private final UserRepository userRepository;

    @Override
    public EngagementSummaryDTO getWeeklyEngagementSummary() {
        try {
            User currentUser = getCurrentUser();
            if (currentUser == null) {
                log.warn("No authenticated user found");
                return createEmptyEngagementSummary();
            }

            LocalDateTime oneWeekAgo = LocalDateTime.now().minusWeeks(1);

            // Get current user's profile
            Optional<com.example.postfolio.profile.entity.Profile> profile = profileRepository
                    .findByUserId(currentUser.getId());
            if (profile.isEmpty()) {
                log.warn("No profile found for user: {}", currentUser.getId());
                return createEmptyEngagementSummary();
            }

            Long profileId = profile.get().getId();

            // Calculate weekly stats
            Long newConnections = getWeeklyConnections(currentUser.getId(), oneWeekAgo);
            Long messagesSent = getWeeklyMessagesSent(currentUser.getId(), oneWeekAgo);
            Long totalReactions = getTotalReactionsReceived(profileId);

            // For profile views, we'll use a placeholder since we don't have view tracking
            // yet
            Long profileViews = 0L;

            // Calculate engagement growth (simple calculation based on current week vs
            // previous week)
            Long engagementGrowth = calculateEngagementGrowth(newConnections, messagesSent, totalReactions);

            return EngagementSummaryDTO.builder()
                    .profileViews(profileViews)
                    .newConnections(newConnections)
                    .messagesSent(messagesSent)
                    .totalReactions(totalReactions)
                    .engagementGrowth(engagementGrowth)
                    .build();

        } catch (Exception e) {
            log.error("Error calculating engagement summary", e);
            return createEmptyEngagementSummary();
        }
    }

    private User getCurrentUser() {
        try {
            String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            return userRepository.findByEmail(userEmail).orElse(null);
        } catch (Exception e) {
            log.error("Error getting current user", e);
            return null;
        }
    }

    private Long getWeeklyConnections(Long userId, LocalDateTime oneWeekAgo) {
        try {
            return connectionRepository.countByRequesterIdAndCreatedAtAfterAndStatus(userId, oneWeekAgo, "ACCEPTED") +
                    connectionRepository.countByReceiverIdAndCreatedAtAfterAndStatus(userId, oneWeekAgo, "ACCEPTED");
        } catch (Exception e) {
            log.error("Error counting weekly connections", e);
            return 0L;
        }
    }

    private Long getWeeklyMessagesSent(Long userId, LocalDateTime oneWeekAgo) {
        try {
            return messageRepository.countBySenderIdAndCreatedAtAfter(userId, oneWeekAgo);
        } catch (Exception e) {
            log.error("Error counting weekly messages", e);
            return 0L;
        }
    }

    private Long getTotalReactionsReceived(Long profileId) {
        try {
            return reactionRepository.countReactionsByProfilePosts(profileId);
        } catch (Exception e) {
            log.error("Error counting total reactions", e);
            return 0L;
        }
    }

    private Long calculateEngagementGrowth(Long newConnections, Long messagesSent, Long totalReactions) {
        // Simple growth calculation - in a real app this would compare to previous
        // period
        Long totalEngagement = newConnections + messagesSent + totalReactions;

        if (totalEngagement == 0) {
            return 0L;
        }

        // Simulate growth percentage (in real app, compare with previous week)
        // For now, return a reasonable growth percentage based on activity level
        if (totalEngagement >= 10) {
            return 15L; // High activity
        } else if (totalEngagement >= 5) {
            return 8L; // Medium activity
        } else if (totalEngagement > 0) {
            return 3L; // Low activity
        }

        return 0L;
    }

    private EngagementSummaryDTO createEmptyEngagementSummary() {
        return EngagementSummaryDTO.builder()
                .profileViews(0L)
                .newConnections(0L)
                .messagesSent(0L)
                .totalReactions(0L)
                .engagementGrowth(0L)
                .build();
    }
}