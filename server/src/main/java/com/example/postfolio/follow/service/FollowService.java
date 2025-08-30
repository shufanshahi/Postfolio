package com.example.postfolio.follow.service;

import com.example.postfolio.follow.entity.Follow;
import com.example.postfolio.follow.repository.FollowRepository;
import com.example.postfolio.notification.service.NotificationService;
import com.example.postfolio.user.entity.User;
import com.example.postfolio.user.model.Role;
import com.example.postfolio.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class FollowService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /**
     * Follow an employer account
     */
    @Transactional
    public Follow followUser(Long followingUserId) {
        User follower = getCurrentUser();
        User following = userRepository.findById(followingUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if trying to follow self
        if (follower.getId().equals(followingUserId)) {
            throw new RuntimeException("Cannot follow yourself");
        }

        // Only allow following employer accounts
        if (following.getRole() != Role.Employer) {
            throw new RuntimeException("You can only follow employer accounts");
        }

        // Check if already following
        if (followRepository.existsByFollowerAndFollowing(follower, following)) {
            throw new RuntimeException("Already following this user");
        }

        Follow follow = Follow.builder()
                .follower(follower)
                .following(following)
                .build();

        Follow savedFollow = followRepository.save(follow);

        // Create notification for the followed user
        notificationService.createFollowNotification(
                followingUserId,
                follower.getId(),
                follower.getName());

        return savedFollow;
    }

    /**
     * Unfollow a user
     */
    @Transactional
    public void unfollowUser(Long followingUserId) {
        User follower = getCurrentUser();
        User following = userRepository.findById(followingUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Optional<Follow> followRelation = followRepository.findByFollowerAndFollowing(follower, following);
        if (followRelation.isEmpty()) {
            throw new RuntimeException("Not following this user");
        }

        followRepository.delete(followRelation.get());
    }

    /**
     * Check if current user is following another user
     */
    @Transactional(readOnly = true)
    public boolean isFollowing(Long followingUserId) {
        User follower = getCurrentUser();
        User following = userRepository.findById(followingUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return followRepository.existsByFollowerAndFollowing(follower, following);
    }

    /**
     * Get all users that current user is following
     */
    @Transactional(readOnly = true)
    public List<User> getFollowing() {
        User user = getCurrentUser();
        return followRepository.findFollowingByUser(user);
    }

    /**
     * Get all followers of current user
     */
    @Transactional(readOnly = true)
    public List<User> getFollowers() {
        User user = getCurrentUser();
        return followRepository.findFollowersByUser(user);
    }

    /**
     * Get follower count for a user
     */
    @Transactional(readOnly = true)
    public long getFollowerCount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return followRepository.countByFollowing(user);
    }

    /**
     * Get following count for a user
     */
    @Transactional(readOnly = true)
    public long getFollowingCount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return followRepository.countByFollower(user);
    }

    /**
     * Get all employer accounts that current user is following
     */
    @Transactional(readOnly = true)
    public List<User> getFollowedEmployers() {
        User user = getCurrentUser();
        return followRepository.findFollowedEmployersByUser(user);
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
