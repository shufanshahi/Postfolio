package com.example.postfolio.profile.repository;

import com.example.postfolio.profile.entity.Profile;
import com.example.postfolio.profile.entity.University;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UniversityRepository extends JpaRepository<University, Long> {

    List<University> findByProfile(Profile profile);

    List<University> findByProfileAndUniversityName(Profile profile, String universityName);

    List<University> findByProfileAndDegreeName(Profile profile, String degreeName);

    List<University> findByProfileAndUniversityNameAndDegreeName(Profile profile, String universityName, String degreeName);
}