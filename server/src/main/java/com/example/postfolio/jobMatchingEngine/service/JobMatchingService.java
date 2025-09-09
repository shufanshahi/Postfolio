package com.example.postfolio.jobMatchingEngine.service;

import com.example.postfolio.aiservice.dto.JobMatchingRequest;
import com.example.postfolio.aiservice.dto.JobMatchingResponse;
import com.example.postfolio.aiservice.service.JobMatchingAIServiceManager;
import com.example.postfolio.cvInApp.entity.CvEntry;
import com.example.postfolio.cvInApp.model.CvType;
import com.example.postfolio.cvInApp.repository.CvEntryRepository;
import com.example.postfolio.job.entity.Job;
import com.example.postfolio.jobMatchingEngine.dto.ApplicantProfileDTO;
import com.example.postfolio.jobMatchingEngine.dto.MatchingResult;
import com.example.postfolio.profile.entity.Profile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobMatchingService {

    private final JobMatchingAIServiceManager jobMatchingAIServiceManager;
    private final CvEntryRepository cvEntryRepository;
    private final JobMatchingCacheService cacheService;

    public MatchingResult scoreApplicant(Job job, Profile applicant) {
        try {
            // Generate cache key - COMMENTED OUT FOR DIRECT API CALLS
            // String profileHash = generateProfileHash(applicant);
            // String jobHash = generateJobHash(job);
            // String cacheKey = cacheService.generateCacheKey(profileHash, jobHash);

            // Check Redis cache first - COMMENTED OUT FOR DIRECT API CALLS
            // MatchingResult cached = cacheService.getCachedResult(cacheKey);
            // if (cached != null) {
            // log.debug("Using cached score for job {} and profile {}: {}", job.getJobId(),
            // applicant.getId(),
            // cached.getTotalScore());
            // return cached;
            // }

            // Calculate new score using AI microservice
            log.info("Calculating new score for job {} and profile {} - calling AI service", job.getJobId(),
                    applicant.getId());
            ApplicantProfileDTO profileDTO = buildApplicantProfile(applicant);

            // Extract education details for AI service
            String sscResult = extractSSCResult(applicant);
            String hscResult = extractHSCResult(applicant);
            String[] degreeNames = extractDegreeNames(applicant);
            String[] cgpas = extractCGPAs(applicant);

            // Create request for AI service
            JobMatchingRequest aiRequest = JobMatchingRequest.builder()
                    .jobId(job.getJobId())
                    .profileId(applicant.getId())
                    .jobTitle(job.getTitle())
                    .jobDescription(job.getDescription())
                    .jobRequirements(job.getDescription()) // Extract from description
                    .jobSkills(job.getRequiredSkills()) // Add job skills
                    .jobExperience(job.getRequiredExperience()) // Add job experience
                    .jobLocation(job.getLocation()) // Add job location
                    .profileSkills(String.join(", ", profileDTO.getSkills()))
                    .profileWorkExperience(String.join("; ", profileDTO.getExperiences()))
                    .sscResult(sscResult)
                    .hscResult(hscResult)
                    .degreeNames(degreeNames)
                    .cgpas(cgpas)
                    .build();

            // Call AI microservice
            log.info("Sending request to AI service for job {} and profile {}", job.getJobId(), applicant.getId());
            JobMatchingResponse aiResponse = jobMatchingAIServiceManager.matchJobSync(aiRequest);
            log.info("Received response from AI service: score={}, success={}", aiResponse.getScore(),
                    aiResponse.isSuccess());

            // Convert AI response to MatchingResult
            MatchingResult result = MatchingResult.builder()
                    .totalScore((int) aiResponse.getScore())
                    .explanation(aiResponse.getExplanation())
                    .build();

            // Cache the result in Redis - COMMENTED OUT FOR DIRECT API CALLS
            // cacheService.cacheResult(cacheKey, result);
            // log.info("Cached new score for job {} and profile {}: {}", job.getJobId(),
            // applicant.getId(),
            // result.getTotalScore());
            return result;

        } catch (Exception e) {
            log.error("Job matching failed for job: {} and applicant: {}", job.getJobId(), applicant.getId(), e);
            MatchingResult fallback = createFallbackResult(e.getMessage());
            log.warn("Returning fallback score: {}", fallback.getTotalScore());
            return fallback;
        }
    }

    // Method to invalidate cache when profile or job changes
    public void invalidateProfileCache(Profile profile) {
        String profileHash = generateProfileHash(profile);
        cacheService.invalidateProfileCache(profileHash);
        log.info("Invalidated cache for profile {}", profile.getId());
    }

    public void invalidateJobCache(Job job) {
        String jobHash = generateJobHash(job);
        cacheService.invalidateJobCache(jobHash);
        log.info("Invalidated cache for job {}", job.getJobId());
    }

    // Get cache statistics
    public Map<String, Object> getCacheStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalEntries", cacheService.getCacheSize());
        stats.put("cacheType", "Redis");
        return stats;
    }

    public String generateProfileHash(Profile profile) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            StringBuilder profileData = new StringBuilder();
            profileData.append(profile.getBio()).append("|");
            profileData.append(profile.getPositionOrInstitue()).append("|");

            // Add CV entries
            List<CvEntry> cvEntries = cvEntryRepository.findByProfileId(profile.getId());
            for (CvEntry entry : cvEntries) {
                profileData.append(entry.getType()).append(":").append(entry.getContent()).append("|");
            }

            // Add education data
            if (profile.getSchools() != null) {
                for (var school : profile.getSchools()) {
                    profileData.append("SCHOOL:").append(school.getSchoolName())
                            .append(":").append(school.getResult()).append("|");
                }
            }

            if (profile.getUniversities() != null) {
                for (var uni : profile.getUniversities()) {
                    profileData.append("UNI:").append(uni.getUniversityName())
                            .append(":").append(uni.getDegreeName())
                            .append(":").append(uni.getCgpa() != null ? uni.getCgpa().toString() : "N/A").append("|");
                }
            }

            byte[] hashBytes = digest.digest(profileData.toString().getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();

        } catch (NoSuchAlgorithmException e) {
            log.error("Failed to generate profile hash", e);
            return String.valueOf(profile.getId().hashCode());
        }
    }

    public String generateJobHash(Job job) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            StringBuilder jobData = new StringBuilder();
            jobData.append(job.getTitle()).append("|");
            jobData.append(job.getDescription()).append("|");
            jobData.append(job.getPosition()).append("|");
            jobData.append(job.getMinSalary()).append("|");
            jobData.append(job.getMaxSalary()).append("|");

            byte[] hashBytes = digest.digest(jobData.toString().getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();

        } catch (NoSuchAlgorithmException e) {
            log.error("Failed to generate job hash", e);
            return String.valueOf(job.getJobId().hashCode());
        }
    }

    public ApplicantProfileDTO buildApplicantProfile(Profile applicant) {
        // Get all CV entries for this profile
        List<CvEntry> cvEntries = cvEntryRepository.findByProfileId(applicant.getId());

        // Group CV entries by type
        Map<CvType, List<String>> groupedEntries = cvEntries.stream()
                .collect(Collectors.groupingBy(
                        CvEntry::getType,
                        Collectors.mapping(CvEntry::getContent, Collectors.toList())));

        // Build education list from profile
        List<String> education = new ArrayList<>();

        // Add school information
        if (applicant.getSchools() != null) {
            education.addAll(applicant.getSchools().stream()
                    .map(school -> String.format("%s (%s) - %s, Result: %s",
                            school.getSchoolName(),
                            school.getDisplayName(),
                            school.getAcademicYear(),
                            school.getResult()))
                    .collect(Collectors.toList()));
        }

        // Add university information
        if (applicant.getUniversities() != null) {
            education.addAll(applicant.getUniversities().stream()
                    .map(uni -> String.format("%s, %s - %d semesters, CGPA: %s%s",
                            uni.getUniversityName(),
                            uni.getDegreeName(),
                            uni.getSemesterCount(),
                            uni.getCgpa() != null ? uni.getCgpa().toString() : "N/A",
                            uni.isDegreeCompleted() ? " (Completed)" : " (In Progress)"))
                    .collect(Collectors.toList()));
        }

        return ApplicantProfileDTO.builder()
                .bio(applicant.getBio())
                .positionOrInstitute(applicant.getPositionOrInstitue())
                .education(education)
                .experiences(groupedEntries.getOrDefault(CvType.EXPERIENCE, new ArrayList<>()))
                .skills(groupedEntries.getOrDefault(CvType.SKILL, new ArrayList<>()))
                .projects(groupedEntries.getOrDefault(CvType.PROJECT, new ArrayList<>()))
                .achievements(groupedEntries.getOrDefault(CvType.ACHIEVEMENT, new ArrayList<>()))
                .build();
    }

    // Helper methods to extract specific education data for AI service
    private String extractSSCResult(Profile applicant) {
        if (applicant.getSchools() == null)
            return null;

        return applicant.getSchools().stream()
                .filter(school -> school.getClassLevel() == 10)
                .map(school -> school.getResult())
                .findFirst()
                .orElse(null);
    }

    private String extractHSCResult(Profile applicant) {
        if (applicant.getSchools() == null)
            return null;

        return applicant.getSchools().stream()
                .filter(school -> school.getClassLevel() == 12)
                .map(school -> school.getResult())
                .findFirst()
                .orElse(null);
    }

    private String[] extractDegreeNames(Profile applicant) {
        if (applicant.getUniversities() == null || applicant.getUniversities().isEmpty()) {
            return new String[0];
        }

        // Group universities by degree name and get unique degree names
        return applicant.getUniversities().stream()
                .map(uni -> uni.getDegreeName())
                .filter(degreeName -> degreeName != null && !degreeName.isEmpty())
                .distinct()
                .toArray(String[]::new);
    }

    private String[] extractCGPAs(Profile applicant) {
        if (applicant.getUniversities() == null || applicant.getUniversities().isEmpty()) {
            return new String[0];
        }

        // Get CGPA for each university degree
        return applicant.getUniversities().stream()
                .map(uni -> uni.getCgpa() != null ? uni.getCgpa().toString() : "N/A")
                .toArray(String[]::new);
    }

    private MatchingResult createFallbackResult(String errorMessage) {
        return MatchingResult.builder()
                .totalScore(0)
                .skillsScore(0)
                .experienceScore(0)
                .educationScore(0)
                .additionalScore(0)
                .explanation("Job matching service unavailable: " + errorMessage)
                .strengths(new ArrayList<>())
                .gaps(List.of("Service temporarily unavailable"))
                .build();
    }
}
