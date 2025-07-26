package com.example.postfolio.profile.repository;

import com.example.postfolio.profile.entity.Profile;
import com.example.postfolio.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProfileRepository extends JpaRepository<Profile, Long> {
    Optional<Profile> findByUser(User user);
}
