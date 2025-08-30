package com.example.postfolio.news.service;

import com.example.postfolio.follow.service.FollowService;
import com.example.postfolio.profile.entity.Profile;
import com.example.postfolio.profile.repository.ProfileRepository;
import com.example.postfolio.user.entity.User;
import com.example.postfolio.user.model.Role;
import com.example.postfolio.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class NewsAccountService {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;
    private final FollowService followService;

    private static final String NEWS_ACCOUNT_EMAIL = "news@postfolio.com";
    private static final String NEWS_ACCOUNT_NAME = "News";
    private static final String NEWS_ACCOUNT_PASSWORD = "admin";

    /**
     * Create the News account if it doesn't exist
     */
    @Transactional
    public User createNewsAccountIfNotExists() {
        Optional<User> existingNewsAccount = userRepository.findByEmail(NEWS_ACCOUNT_EMAIL);

        if (existingNewsAccount.isPresent()) {
            log.info("News account already exists with ID: {}", existingNewsAccount.get().getId());
            return existingNewsAccount.get();
        }

        // Create news user account
        User newsUser = User.builder()
                .name(NEWS_ACCOUNT_NAME)
                .email(NEWS_ACCOUNT_EMAIL)
                .password(passwordEncoder.encode(NEWS_ACCOUNT_PASSWORD))
                .role(Role.Employer)
                .build();

        User savedUser = userRepository.save(newsUser);
        log.info("Created News account with ID: {}", savedUser.getId());

        // Create profile for news account
        Profile newsProfile = Profile.builder()
                .bio("Official news account for job market updates, career insights, and industry trends. Follow for daily updates!")
                .positionOrInstitue("Job Market News & Updates")
                .user(savedUser)
                .build();

        profileRepository.save(newsProfile);
        log.info("Created News profile");

        return savedUser;
    }

    /**
     * Get the News account
     */
    @Transactional(readOnly = true)
    public Optional<User> getNewsAccount() {
        return userRepository.findByEmail(NEWS_ACCOUNT_EMAIL);
    }

    /**
     * Make all existing users follow the News account
     */
    @Transactional
    public void makeAllUsersFollowNews() {
        Optional<User> newsAccountOpt = getNewsAccount();
        if (newsAccountOpt.isEmpty()) {
            log.error("News account not found, cannot make users follow");
            return;
        }

        User newsAccount = newsAccountOpt.get();
        List<User> allUsers = userRepository.findAll();

        int followedCount = 0;
        for (User user : allUsers) {
            // Skip the news account itself and employers
            if (user.getId().equals(newsAccount.getId()) || user.getRole() == Role.Employer) {
                continue;
            }

            try {
                // Check if already following
                if (!followService.isFollowing(newsAccount.getId())) {
                    followService.followUser(newsAccount.getId());
                    followedCount++;
                }
            } catch (Exception e) {
                log.warn("Failed to make user {} follow news account: {}", user.getId(), e.getMessage());
            }
        }

        log.info("Made {} users follow the News account", followedCount);
    }

    /**
     * Auto-follow news account for new users
     */
    @Transactional
    public void autoFollowNewsForUser(User user) {
        // Only regular users should auto-follow news
        if (user.getRole() != Role.User) {
            return;
        }

        Optional<User> newsAccountOpt = getNewsAccount();
        if (newsAccountOpt.isEmpty()) {
            log.warn("News account not found, cannot auto-follow for user {}", user.getId());
            return;
        }

        User newsAccount = newsAccountOpt.get();

        try {
            followService.followUser(newsAccount.getId());
            log.info("User {} automatically started following News account", user.getId());
        } catch (Exception e) {
            log.warn("Failed to auto-follow news account for user {}: {}", user.getId(), e.getMessage());
        }
    }
}
