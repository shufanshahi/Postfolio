package com.example.postfolio.profile.dto;

import com.example.postfolio.profile.entity.Profile;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class ProfileResponse {
    private Long id;
    private String name;
    private String email;
    private String pictureBase64;
    private String bio;
    private LocalDate birthDate;
    private String sscResult;
    private String hscResult;
    private String universityResult;
    private String positionOrInstitue;
    private String phoneNumber;
    private String address;

    public static ProfileResponse fromProfile(Profile profile) {
        return ProfileResponse.builder()
                .id(profile.getId())
                .name(profile.getUser().getName())
                .email(profile.getUser().getEmail())
                .pictureBase64(profile.getPictureBase64())
                .bio(profile.getBio())
                .birthDate(profile.getBirthDate())
                .sscResult(profile.getSscResult())
                .hscResult(profile.getHscResult())
                .universityResult(profile.getUniversityResult())
                .positionOrInstitue(profile.getPositionOrInstitue())
                .phoneNumber(profile.getPhoneNumber())
                .address(profile.getAddress())
                .build();
    }
} 