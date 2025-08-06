package com.example.postfolio.profile.repository;

import com.example.postfolio.profile.entity.Profile;
import com.example.postfolio.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProfileRepository extends JpaRepository<Profile, Long> {
    Optional<Profile> findByUser(User user);
    
    @Query("SELECT p FROM Profile p JOIN FETCH p.user WHERE p.id = :id")
    Optional<Profile> findByIdWithUser(@Param("id") Long id);
    
    @Query("SELECT p FROM Profile p JOIN FETCH p.user WHERE p.user = :user")
    Optional<Profile> findByUserWithUser(@Param("user") User user);
}
