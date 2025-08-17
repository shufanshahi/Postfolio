package com.example.postfolio.profile.repository;

import com.example.postfolio.profile.entity.Profile;
import com.example.postfolio.profile.entity.University;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UniversityRepository extends JpaRepository<University, Long> {

    List<University> findByProfileOrderBySemesterNumberAsc(Profile profile);

    List<University> findByProfileAndSemesterNumber(Profile profile, Integer semesterNumber);

    List<University> findByProfileAndUniversityNameOrderBySemesterNumberAsc(Profile profile, String universityName);

    List<University> findByProfileAndDegreeNameOrderBySemesterNumberAsc(Profile profile, String degreeName);

    List<University> findByProfileAndIsCompleted(Profile profile, Boolean isCompleted);
}