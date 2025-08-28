package com.example.postfolio.jobMatchingEngine.service;

import com.example.postfolio.cvInApp.entity.CvEntry;
import com.example.postfolio.cvInApp.model.CvType;
import com.example.postfolio.cvInApp.repository.CvEntryRepository;
import com.example.postfolio.job.entity.Job;
import com.example.postfolio.jobMatchingEngine.client.GeminiClient;
import com.example.postfolio.jobMatchingEngine.dto.ApplicantProfileDTO;
import com.example.postfolio.jobMatchingEngine.dto.MatchingResult;
import com.example.postfolio.profile.entity.Profile;
import com.google.gson.*;
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

    private final GeminiClient geminiClient;
    private final CvEntryRepository cvEntryRepository;
    private final JobMatchingCacheService cacheService;

    public MatchingResult scoreApplicant(Job job, Profile applicant) {
        try {
            // Generate cache key
            String profileHash = generateProfileHash(applicant);
            String jobHash = generateJobHash(job);
            String cacheKey = cacheService.generateCacheKey(profileHash, jobHash);

            // Check Redis cache first
            MatchingResult cached = cacheService.getCachedResult(cacheKey);
            if (cached != null) {
                log.debug("Using cached score for job {} and profile {}", job.getJobId(), applicant.getId());
                return cached;
            }

            // Calculate new score
            log.info("Calculating new score for job {} and profile {}", job.getJobId(), applicant.getId());
            ApplicantProfileDTO profileDTO = buildApplicantProfile(applicant);
            String prompt = buildScoringPrompt(job, profileDTO);
            String response = geminiClient.generateContent(prompt);
            MatchingResult result = parseGeminiResponse(response);

            // Cache the result in Redis
            cacheService.cacheResult(cacheKey, result);

            return result;
        } catch (Exception e) {
            log.error("Job matching failed for job: {} and applicant: {}", job.getJobId(), applicant.getId(), e);
            return createFallbackResult(e.getMessage());
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
                profile.getSchools()
                        .forEach(school -> profileData.append("SCHOOL:").append(school.getSchoolName()).append("|"));
            }
            if (profile.getUniversities() != null) {
                profile.getUniversities()
                        .forEach(uni -> profileData.append("UNI:").append(uni.getUniversityName()).append("|"));
            }

            byte[] hash = digest.digest(profileData.toString().getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hash);
        } catch (NoSuchAlgorithmException e) {
            log.error("Failed to generate profile hash", e);
            return String.valueOf(System.currentTimeMillis()); // Fallback
        }
    }

    public String generateJobHash(Job job) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            StringBuilder jobData = new StringBuilder();
            jobData.append(job.getTitle()).append("|");
            jobData.append(job.getPosition()).append("|");
            jobData.append(job.getDescription()).append("|");
            jobData.append(job.getRequiredSkills()).append("|");
            jobData.append(job.getRequiredExperience()).append("|");
            jobData.append(job.getRequiredEducation()).append("|");
            jobData.append(job.getRequiredProject()).append("|");
            jobData.append(job.getStatus()).append("|");

            byte[] hash = digest.digest(jobData.toString().getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hash);
        } catch (NoSuchAlgorithmException e) {
            log.error("Failed to generate job hash", e);
            return String.valueOf(System.currentTimeMillis()); // Fallback
        }
    }

    private String bytesToHex(byte[] hash) {
        StringBuilder hexString = new StringBuilder();
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
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
                    .map(uni -> String.format("%s, %s (%s) - %s, Result: %s%s",
                            uni.getUniversityName(),
                            uni.getDegreeName(),
                            uni.getSemesterDisplayName(),
                            uni.getAcademicYear(),
                            uni.getSemesterResult(),
                            uni.getIsCompleted() ? " (Completed)" : " (In Progress)"))
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

    public String buildScoringPrompt(Job job, ApplicantProfileDTO applicant) {
        return String.format("""
                You are an expert HR recruiter. Score this candidate for the job (0-100).

                JOB REQUIREMENTS:
                Position: %s
                Description: %s
                Required Skills: %s
                Required Experience: %s
                Required Education: %s
                Required Projects: %s

                CANDIDATE PROFILE:
                Bio: %s
                Current Position: %s

                Education:
                %s

                Work Experience:
                %s

                Technical Skills:
                %s

                Projects:
                %s

                Achievements:
                %s

                SCORING CRITERIA:
                - Skills Match (0-35): How well candidate's skills align with job requirements
                - Experience Match (0-30): Relevance and depth of work experience
                - Education Match (0-20): Educational background alignment
                - Additional Factors (0-15): Projects, achievements, career progression

                Return STRICT JSON format:
                {
                    "totalScore": (0-100),
                    "skillsScore": (0-35),
                    "experienceScore": (0-30),
                    "educationScore": (0-20),
                    "additionalScore": (0-15),
                    "explanation": "brief reasoning for the total score",
                    "strengths": ["list of candidate's strengths for this role"],
                    "gaps": ["list of areas where candidate doesn't meet requirements"]
                }

                Be objective and consider:
                - Exact skill matches vs transferable skills
                - Years of experience vs quality of experience
                - Educational relevance vs practical experience
                - Project complexity and relevance
                """,
                job.getPosition(),
                job.getDescription(),
                job.getRequiredSkills(),
                job.getRequiredExperience(),
                job.getRequiredEducation(),
                job.getRequiredProject(),
                applicant.getBio(),
                applicant.getPositionOrInstitute(),
                String.join("\n- ", applicant.getEducation()),
                String.join("\n- ", applicant.getExperiences()),
                String.join(", ", applicant.getSkills()),
                String.join("\n- ", applicant.getProjects()),
                String.join("\n- ", applicant.getAchievements()));
    }

    public MatchingResult parseGeminiResponse(String response) {
        try {
            String jsonContent = extractJsonFromText(response);
            JsonObject result = JsonParser.parseString(jsonContent).getAsJsonObject();

            // Validate response structure
            if (!result.has("totalScore") || !result.has("skillsScore") ||
                    !result.has("experienceScore") || !result.has("educationScore") ||
                    !result.has("additionalScore")) {
                throw new RuntimeException("Invalid Gemini response format - missing score fields");
            }

            // Parse scores
            int totalScore = result.get("totalScore").getAsInt();
            int skillsScore = result.get("skillsScore").getAsInt();
            int experienceScore = result.get("experienceScore").getAsInt();
            int educationScore = result.get("educationScore").getAsInt();
            int additionalScore = result.get("additionalScore").getAsInt();

            // Parse explanation
            String explanation = result.has("explanation") ? result.get("explanation").getAsString()
                    : "No explanation provided";

            // Parse strengths
            List<String> strengths = new ArrayList<>();
            if (result.has("strengths") && result.get("strengths").isJsonArray()) {
                JsonArray strengthsArray = result.getAsJsonArray("strengths");
                for (JsonElement element : strengthsArray) {
                    strengths.add(element.getAsString());
                }
            }

            // Parse gaps
            List<String> gaps = new ArrayList<>();
            if (result.has("gaps") && result.get("gaps").isJsonArray()) {
                JsonArray gapsArray = result.getAsJsonArray("gaps");
                for (JsonElement element : gapsArray) {
                    gaps.add(element.getAsString());
                }
            }

            return MatchingResult.builder()
                    .totalScore(totalScore)
                    .skillsScore(skillsScore)
                    .experienceScore(experienceScore)
                    .educationScore(educationScore)
                    .additionalScore(additionalScore)
                    .explanation(explanation)
                    .strengths(strengths)
                    .gaps(gaps)
                    .build();

        } catch (JsonSyntaxException e) {
            log.error("Invalid JSON response from Gemini: {}", response);
            throw new RuntimeException("Malformed JSON response from Gemini");
        } catch (Exception e) {
            log.error("Failed to parse Gemini response: {}", response, e);
            throw new RuntimeException("Failed to parse Gemini response: " + e.getMessage());
        }
    }

    private String extractJsonFromText(String text) {
        // If the response is wrapped in markdown code blocks
        if (text.trim().startsWith("```json")) {
            int start = text.indexOf("{");
            int end = text.lastIndexOf("}");
            if (start >= 0 && end > start) {
                return text.substring(start, end + 1);
            }
        }
        // If the response is just the JSON
        else if (text.trim().startsWith("{")) {
            return text;
        }
        throw new RuntimeException("Could not extract JSON from Gemini response: " + text);
    }

    MatchingResult createFallbackResult(String error) {
        return MatchingResult.builder()
                .totalScore(0)
                .skillsScore(0)
                .experienceScore(0)
                .educationScore(0)
                .additionalScore(0)
                .explanation("Error occurred during scoring: " + error)
                .strengths(List.of())
                .gaps(List.of("Manual review required"))
                .build();
    }
}