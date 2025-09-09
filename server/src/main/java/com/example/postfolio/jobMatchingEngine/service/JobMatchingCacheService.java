package com.example.postfolio.jobMatchingEngine.service;

import com.example.postfolio.jobMatchingEngine.dto.MatchingResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobMatchingCacheService {

    private final RedisTemplate<String, Object> redisTemplate;

    private static final String CACHE_PREFIX = "job_matching:";
    // Pattern constants retained for future use if needed
    private static final String PROFILE_PATTERN = "job_matching:*:profileId:";
    private static final String JOB_PATTERN = "job_matching:*:jobId:";
    private static final Duration CACHE_TTL = Duration.ofHours(24);

    /**
     * Get cached matching result
     */
    public MatchingResult getCachedResult(String cacheKey) {
        try {
            Object cached = redisTemplate.opsForValue().get(CACHE_PREFIX + cacheKey);
            if (cached instanceof MatchingResult) {
                log.debug("Cache hit for key: {}", cacheKey);
                return (MatchingResult) cached;
            }
            log.debug("Cache miss for key: {}", cacheKey);
            return null;
        } catch (Exception e) {
            log.warn("Failed to get cached result for key: {}", cacheKey, e);
            return null;
        }
    }

    /**
     * Cache a matching result
     */
    public void cacheResult(String cacheKey, MatchingResult result) {
        try {
            redisTemplate.opsForValue().set(CACHE_PREFIX + cacheKey, result, CACHE_TTL);
            log.debug("Cached result for key: {}", cacheKey);
        } catch (Exception e) {
            log.warn("Failed to cache result for key: {}", cacheKey, e);
        }
    }

    /**
     * Invalidate cache entries for a specific profile
     */
    public void invalidateProfileCache(String profileId) {
        try {
            // Keys look like: job_matching:profileId:{profileId}:jobId:{jobId}
            String pattern = CACHE_PREFIX + "profileId:" + profileId + ":jobId:*";
            Set<String> keys = redisTemplate.keys(pattern);
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
                log.info("Invalidated {} cache entries for profileId: {}", keys.size(), profileId);
            }
        } catch (Exception e) {
            log.warn("Failed to invalidate profile cache for profileId: {}", profileId, e);
        }
    }

    /**
     * Invalidate cache entries for a specific job
     */
    public void invalidateJobCache(String jobId) {
        try {
            // Keys look like: job_matching:profileId:{profileId}:jobId:{jobId}
            String pattern = CACHE_PREFIX + "profileId:*:jobId:" + jobId;
            Set<String> keys = redisTemplate.keys(pattern);
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
                log.info("Invalidated {} cache entries for jobId: {}", keys.size(), jobId);
            }
        } catch (Exception e) {
            log.warn("Failed to invalidate job cache for jobId: {}", jobId, e);
        }
    }

    /**
     * Get cache statistics
     */
    public long getCacheSize() {
        try {
            Set<String> keys = redisTemplate.keys(CACHE_PREFIX + "*");
            return keys != null ? keys.size() : 0;
        } catch (Exception e) {
            log.warn("Failed to get cache size", e);
            return -1;
        }
    }

    /**
     * Clear all cache entries
     */
    public void clearCache() {
        try {
            Set<String> keys = redisTemplate.keys(CACHE_PREFIX + "*");
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
                log.info("Cleared {} cache entries", keys.size());
            }
        } catch (Exception e) {
            log.warn("Failed to clear cache", e);
        }
    }

    /**
     * Generate cache key with profile and job hashes
     */
    public String generateCacheKey(String profileId, String jobId) {
        return String.format("profileId:%s:jobId:%s", profileId, jobId);
    }
}
