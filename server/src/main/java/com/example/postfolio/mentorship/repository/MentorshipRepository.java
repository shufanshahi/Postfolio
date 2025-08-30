package com.example.postfolio.mentorship.repository;

import com.example.postfolio.mentorship.entity.Mentorship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MentorshipRepository extends JpaRepository<Mentorship, Long> {
}
