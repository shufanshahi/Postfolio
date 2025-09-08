package com.example.postfolio.profile.repository;

import com.example.postfolio.profile.entity.Profile;
import com.example.postfolio.profile.entity.School;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SchoolRepository extends JpaRepository<School, Long> {

    List<School> findByProfileOrderByClassLevelAsc(Profile profile);

    List<School> findByProfileAndClassLevel(Profile profile, Integer classLevel);

    List<School> findByProfileAndSchoolNameOrderByClassLevelAsc(Profile profile, String schoolName);

    List<School> findByProfileAndSchoolNameAndClassLevel(Profile profile, String schoolName, Integer classLevel);
}
