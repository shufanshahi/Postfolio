package com.example.postfolio.profile.service;

import com.example.postfolio.profile.dto.ProfileRequest;
import com.example.postfolio.profile.dto.ProfileResponse;
import com.example.postfolio.profile.entity.Profile;
import com.example.postfolio.profile.repository.ProfileRepository;
import com.example.postfolio.user.entity.User;
import com.example.postfolio.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.apache.commons.io.IOUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDate;
import java.util.Base64;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final UserRepository userRepository;

    public void createOrUpdateProfile(ProfileRequest request) {
        // Get currently logged in user
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Find existing profile or create a new one
        Profile profile = profileRepository.findByUser(user).orElse(new Profile());

        // Set fields from request
        profile.setUser(user);
        if (request.profilePicture != null && !request.profilePicture.isEmpty()) {
            try {
                byte[] imageBytes = request.profilePicture.getBytes();
                String base64Image = Base64.getEncoder().encodeToString(imageBytes);
                profile.setPictureBase64(base64Image);
            } catch (IOException e) {
                throw new RuntimeException("Failed to process profile picture", e);
            }
        }

        profile.setBio(request.bio);
        profile.setPhoneNumber(request.phoneNumber);
        profile.setAddress(request.address);
        profile.setPositionOrInstitue(request.positionOrInstitue);

        if (request.birthDate != null && !request.birthDate.isBlank()) {
            profile.setBirthDate(LocalDate.parse(request.birthDate));
        }

        profile.setSscResult(request.sscResult);
        profile.setHscResult(request.hscResult);
        profile.setUniversityResult(request.universityResult);

        profileRepository.save(profile);
    }

    // Method that returns ProfileResponse for external API calls
    public Optional<ProfileResponse> getMyProfileResponse() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .flatMap(profileRepository::findByUserWithUser)
                .map(ProfileResponse::fromProfile);
    }

    // Method that returns ProfileResponse for external API calls
    public ProfileResponse getProfileResponseById(Long profileId) {
        Profile profile = profileRepository.findByIdWithUser(profileId)
                .orElseThrow(() -> new RuntimeException("Profile not found with id: " + profileId));
        return ProfileResponse.fromProfile(profile);
    }

    // Method that returns Profile entity for internal service calls
    public Optional<Profile> getMyProfile() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .flatMap(profileRepository::findByUser);
    }

    // Method that returns Profile entity for internal service calls
    public Profile getProfileById(Long profileId) {
        return profileRepository.findByIdWithUser(profileId)
                .orElseThrow(() -> new RuntimeException("Profile not found with id: " + profileId));
    }

    public void initializeProfileForUser(User user) {
        if (profileRepository.findByUser(user).isEmpty()) {
            Profile profile = new Profile();
            profile.setUser(user);
            profileRepository.save(profile);
        }
    }

    public void initializeProfileForCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        initializeProfileForUser(user);
    }
}
