package com.example.postfolio.follow.repository;

import com.example.postfolio.follow.entity.Follow;
import com.example.postfolio.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FollowRepository extends JpaRepository<Follow, Long> {

    // Find follow relationship between two users
    Optional<Follow> findByFollowerAndFollowing(User follower, User following);

    // Check if user is following another user
    boolean existsByFollowerAndFollowing(User follower, User following);

    // Get all users that the given user is following
    @Query("SELECT f.following FROM Follow f WHERE f.follower = :user")
    List<User> findFollowingByUser(@Param("user") User user);

    // Get all followers of a user
    @Query("SELECT f.follower FROM Follow f WHERE f.following = :user")
    List<User> findFollowersByUser(@Param("user") User user);

    // Count followers of a user
    long countByFollowing(User following);

    // Count users that a user is following
    long countByFollower(User follower);

    // Get all employer accounts that a user is following
    @Query("SELECT f.following FROM Follow f WHERE f.follower = :user AND f.following.role = 'Employer'")
    List<User> findFollowedEmployersByUser(@Param("user") User user);
}
