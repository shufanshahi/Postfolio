package com.example.postfolio.user.repository;

import com.example.postfolio.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    // Search users by name or email (excluding current user)
    @Query("SELECT u FROM User u WHERE " +
            "(LOWER(u.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(u.email) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) AND " +
            "u.id != :currentUserId")
    List<User> searchUsers(@Param("searchTerm") String searchTerm, @Param("currentUserId") Long currentUserId);
}
