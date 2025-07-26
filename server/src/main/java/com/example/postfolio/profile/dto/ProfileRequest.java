package com.example.postfolio.profile.dto;

import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
public class ProfileRequest {
    public String bio;
    public String phoneNumber;
    public String address;
    public String positionOrInstitue;
    public String sscResult;        // optional
    public String hscResult;        // optional
    public String universityResult; // optional
    public String birthDate;        // expected format: "yyyy-MM-dd"
    public MultipartFile profilePicture; // ✅ profile picture
}
