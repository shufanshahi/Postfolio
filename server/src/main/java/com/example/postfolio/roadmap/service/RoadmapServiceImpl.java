package com.example.postfolio.roadmap.service;

import com.example.postfolio.job.entity.Job;
import com.example.postfolio.job.service.JobService;
import com.example.postfolio.roadmap.dto.RoadmapDTO;
import com.example.postfolio.roadmap.dto.RoadmapItemDTO;
import com.example.postfolio.roadmap.dto.RoadmapRequest;
import com.example.postfolio.roadmap.entity.Roadmap;
import com.example.postfolio.roadmap.entity.RoadmapItem;
import com.example.postfolio.roadmap.model.RoadmapItemType;
import com.example.postfolio.roadmap.repository.RoadmapItemRepository;
import com.example.postfolio.roadmap.repository.RoadmapRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoadmapServiceImpl implements RoadmapService {

    private final RoadmapRepository roadmapRepository;
    private final RoadmapItemRepository roadmapItemRepository;
    private final JobService jobService;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();
    
    @Value("${ai.service.url:http://localhost:8081}")
    private String aiServiceUrl;

    @Override
    @Transactional
    public RoadmapDTO createRoadmap(RoadmapRequest request) {
        // Check if roadmap already exists
        if (roadmapRepository.existsByJobIdAndProfileId(request.getJobId(), request.getProfileId())) {
            throw new RuntimeException("Roadmap already exists for this job and profile");
        }

        // Get job details
        Job job = jobService.findById(request.getJobId());
        if (job == null) {
            throw new RuntimeException("Job not found with ID: " + request.getJobId());
        }

        // Create roadmap
        Roadmap roadmap = Roadmap.builder()
                .jobId(request.getJobId())
                .profileId(request.getProfileId())
                .interviewDate(request.getInterviewDate())
                .title(request.getTitle() != null ? request.getTitle()
                        : "Interview Preparation Roadmap for " + job.getTitle())
                .description(request.getDescription() != null ? request.getDescription()
                        : "Structured learning path to prepare for the " + job.getTitle() + " position")
                .build();

        roadmap = roadmapRepository.save(roadmap);

        // Generate roadmap items based on job requirements and interview date
        generateRoadmapItems(roadmap, job);

        return convertToDTO(roadmap);
    }

    @Override
    public Optional<RoadmapDTO> getRoadmapByJobAndProfile(Long jobId, Long profileId) {
        return roadmapRepository.findByJobIdAndProfileId(jobId, profileId)
                .map(this::convertToDTO);
    }

    @Override
    public List<RoadmapDTO> getRoadmapsByProfile(Long profileId) {
        return roadmapRepository.findByProfileIdOrderByCreatedAtDesc(profileId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public RoadmapDTO updateRoadmapItem(Long roadmapId, Long itemId, RoadmapItemDTO itemDTO) {
        RoadmapItem item = roadmapItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Roadmap item not found"));

        if (!item.getRoadmap().getId().equals(roadmapId)) {
            throw new RuntimeException("Roadmap item does not belong to the specified roadmap");
        }

        // Update item
        item.setTitle(itemDTO.getTitle());
        item.setDescription(itemDTO.getDescription());
        item.setResourceLinks(convertListToJson(itemDTO.getResourceLinks()));
        item.setVideoLinks(convertListToJson(itemDTO.getVideoLinks()));
        item.setWebsiteLinks(convertListToJson(itemDTO.getWebsiteLinks()));
        item.setEstimatedHours(itemDTO.getEstimatedHours());

        roadmapItemRepository.save(item);
        return convertToDTO(item.getRoadmap());
    }

    @Override
    @Transactional
    public boolean deleteRoadmap(Long roadmapId) {
        if (roadmapRepository.existsById(roadmapId)) {
            roadmapRepository.deleteById(roadmapId);
            return true;
        }
        return false;
    }

    @Override
    @Transactional
    public RoadmapDTO markItemAsCompleted(Long roadmapId, Long itemId, String completionNotes) {
        RoadmapItem item = roadmapItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Roadmap item not found"));

        if (!item.getRoadmap().getId().equals(roadmapId)) {
            throw new RuntimeException("Roadmap item does not belong to the specified roadmap");
        }

        item.setIsCompleted(true);
        item.setCompletionNotes(completionNotes);
        roadmapItemRepository.save(item);

        return convertToDTO(item.getRoadmap());
    }

    private void generateRoadmapItems(Roadmap roadmap, Job job) {
        LocalDate startDate = LocalDate.now();
        LocalDate interviewDate = roadmap.getInterviewDate().toLocalDate();
        long totalDays = ChronoUnit.DAYS.between(startDate, interviewDate);

        if (totalDays <= 0) {
            throw new RuntimeException("Interview date must be in the future");
        }

        try {
            // Call AI service to generate roadmap
            List<RoadmapItem> roadmapItems = generateAIRoadmapItems(roadmap, job, totalDays);
            roadmapItemRepository.saveAll(roadmapItems);
            
        } catch (Exception e) {
            log.error("Failed to generate AI roadmap, falling back to basic roadmap: ", e);
            // Fallback to basic roadmap generation
            generateBasicRoadmapItems(roadmap, job, totalDays);
        }
    }

    private List<RoadmapItem> generateAIRoadmapItems(Roadmap roadmap, Job job, long totalDays) {
        try {
            // Prepare request for AI service
            Map<String, Object> aiRequest = new HashMap<>();
            aiRequest.put("jobId", job.getJobId());
            aiRequest.put("profileId", roadmap.getProfileId());
            aiRequest.put("jobTitle", job.getTitle());
            aiRequest.put("jobDescription", job.getDescription());
            aiRequest.put("requiredSkills", job.getRequiredSkills());
            aiRequest.put("requiredExperience", job.getRequiredExperience());
            aiRequest.put("requiredEducation", job.getRequiredEducation());
            aiRequest.put("location", job.getLocation());
            aiRequest.put("interviewDate", roadmap.getInterviewDate().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            aiRequest.put("daysUntilInterview", (int) totalDays);
            
            // Set up HTTP headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(aiRequest, headers);
            
            // Call AI service
            String aiServiceEndpoint = aiServiceUrl + "/api/ai/generate-roadmap";
            log.info("Calling AI service at: {}", aiServiceEndpoint);
            
            ResponseEntity<JsonNode> response = restTemplate.postForEntity(
                aiServiceEndpoint, entity, JsonNode.class);
                
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return parseAIRoadmapResponse(response.getBody(), roadmap);
            } else {
                throw new RuntimeException("AI service returned unsuccessful response");
            }
            
        } catch (Exception e) {
            log.error("Error calling AI service for roadmap generation: ", e);
            throw e;
        }
    }

    private List<RoadmapItem> parseAIRoadmapResponse(JsonNode aiResponse, Roadmap roadmap) {
        List<RoadmapItem> roadmapItems = new ArrayList<>();
        
        try {
            if (aiResponse.has("success") && !aiResponse.get("success").asBoolean()) {
                throw new RuntimeException("AI service reported failure: " + 
                    aiResponse.get("errorMessage").asText());
            }
            
            JsonNode itemsArray = aiResponse.get("items");
            if (itemsArray != null && itemsArray.isArray()) {
                for (JsonNode itemNode : itemsArray) {
                    RoadmapItem item = new RoadmapItem();
                    item.setRoadmap(roadmap);
                    
                    // Parse date
                    String dateStr = itemNode.get("date").asText();
                    LocalDate itemDate = LocalDate.parse(dateStr);
                    item.setDayDate(itemDate);
                    
                    // Parse type
                    String typeStr = itemNode.get("type").asText();
                    item.setItemType(RoadmapItemType.valueOf(typeStr));
                    
                    // Set basic fields
                    item.setTitle(itemNode.get("title").asText());
                    item.setDescription(itemNode.get("description").asText());
                    item.setEstimatedHours(itemNode.get("estimatedHours").asInt());
                    item.setIsCompleted(false);
                    
                    // Parse resources
                    JsonNode resourcesNode = itemNode.get("resources");
                    if (resourcesNode != null && resourcesNode.isArray()) {
                        List<String> resources = new ArrayList<>();
                        for (JsonNode resourceNode : resourcesNode) {
                            resources.add(resourceNode.asText());
                        }
                        
                        // Separate resources by type (basic categorization)
                        List<String> videoLinks = new ArrayList<>();
                        List<String> websiteLinks = new ArrayList<>();
                        List<String> otherResources = new ArrayList<>();
                        
                        for (String resource : resources) {
                            if (resource.toLowerCase().contains("youtube") || 
                                resource.toLowerCase().contains("video")) {
                                videoLinks.add(resource);
                            } else if (resource.startsWith("http")) {
                                websiteLinks.add(resource);
                            } else {
                                otherResources.add(resource);
                            }
                        }
                        
                        item.setVideoLinks(convertListToJson(videoLinks));
                        item.setWebsiteLinks(convertListToJson(websiteLinks));
                        item.setResourceLinks(convertListToJson(otherResources));
                    }
                    
                    roadmapItems.add(item);
                }
            }
            
        } catch (Exception e) {
            log.error("Error parsing AI roadmap response: ", e);
            throw new RuntimeException("Failed to parse AI roadmap response", e);
        }
        
        return roadmapItems;
    }

    private void generateBasicRoadmapItems(Roadmap roadmap, Job job, long totalDays) {
        LocalDate startDate = LocalDate.now();
        LocalDate interviewDate = roadmap.getInterviewDate().toLocalDate();
        
        List<RoadmapItem> roadmapItems = new ArrayList<>();

        // Parse job skills and requirements
        List<String> skills = parseSkills(job.getRequiredSkills());
        String position = job.getPosition();

        // Generate learning items based on available days
        if (totalDays <= 7) {
            // Short preparation (1 week or less)
            roadmapItems.addAll(generateShortTermRoadmap(roadmap, startDate, skills, position));
        } else if (totalDays <= 30) {
            // Medium preparation (1 month or less)
            roadmapItems.addAll(generateMediumTermRoadmap(roadmap, startDate, skills, position, totalDays));
        } else {
            // Long-term preparation (more than 1 month)
            roadmapItems.addAll(generateLongTermRoadmap(roadmap, startDate, skills, position, totalDays));
        }

        // Always add final review day
        RoadmapItem finalReview = createFinalReviewItem(roadmap, interviewDate.minusDays(1));
        roadmapItems.add(finalReview);

        roadmapItemRepository.saveAll(roadmapItems);
    }

    private List<RoadmapItem> generateShortTermRoadmap(Roadmap roadmap, LocalDate startDate,
            List<String> skills, String position) {
        List<RoadmapItem> items = new ArrayList<>();
        LocalDate currentDate = startDate;

        // Focus on core skills and interview prep
        for (int i = 0; i < Math.min(skills.size(), 3); i++) {
            String skill = skills.get(i);
            items.add(createLearningItem(roadmap, currentDate, skill, position));
            currentDate = currentDate.plusDays(1);
        }

        // Add practice day if there are remaining days
        if (currentDate.isBefore(roadmap.getInterviewDate().toLocalDate().minusDays(1))) {
            items.add(createPracticeItem(roadmap, currentDate, position));
        }

        return items;
    }

    private List<RoadmapItem> generateMediumTermRoadmap(Roadmap roadmap, LocalDate startDate,
            List<String> skills, String position, long totalDays) {
        List<RoadmapItem> items = new ArrayList<>();
        LocalDate currentDate = startDate;
        int daysUsed = 0;

        // Learning phase (60% of time)
        int learningDays = (int) (totalDays * 0.6);
        for (int i = 0; i < skills.size() && daysUsed < learningDays; i++) {
            String skill = skills.get(i);
            items.add(createLearningItem(roadmap, currentDate, skill, position));
            currentDate = currentDate.plusDays(1);
            daysUsed++;

            // Add break day every 3-4 days
            if ((daysUsed + 1) % 4 == 0 && daysUsed < learningDays - 1) {
                items.add(createBreakItem(roadmap, currentDate));
                currentDate = currentDate.plusDays(1);
                daysUsed++;
            }
        }

        // Practice phase (30% of time)
        int practiceDays = (int) (totalDays * 0.3);
        for (int i = 0; i < practiceDays
                && currentDate.isBefore(roadmap.getInterviewDate().toLocalDate().minusDays(1)); i++) {
            if (i % 3 == 0) {
                items.add(createRevisionItem(roadmap, currentDate));
            } else {
                items.add(createPracticeItem(roadmap, currentDate, position));
            }
            currentDate = currentDate.plusDays(1);
        }

        return items;
    }

    private List<RoadmapItem> generateLongTermRoadmap(Roadmap roadmap, LocalDate startDate,
            List<String> skills, String position, long totalDays) {
        List<RoadmapItem> items = new ArrayList<>();
        LocalDate currentDate = startDate;
        int daysUsed = 0;

        // Phase 1: Deep learning (50% of time)
        int deepLearningDays = (int) (totalDays * 0.5);
        for (String skill : skills) {
            if (daysUsed >= deepLearningDays)
                break;

            items.add(createLearningItem(roadmap, currentDate, skill, position));
            currentDate = currentDate.plusDays(1);
            daysUsed++;

            // Add practice day after each learning topic
            if (daysUsed < deepLearningDays) {
                items.add(createPracticeItem(roadmap, currentDate, skill + " practice"));
                currentDate = currentDate.plusDays(1);
                daysUsed++;
            }

            // Add break day every week
            if (daysUsed % 7 == 0 && daysUsed < deepLearningDays - 1) {
                items.add(createBreakItem(roadmap, currentDate));
                currentDate = currentDate.plusDays(1);
                daysUsed++;
            }
        }

        // Phase 2: Practice and mock interviews (30% of time)
        int practiceDays = (int) (totalDays * 0.3);
        for (int i = 0; i < practiceDays
                && currentDate.isBefore(roadmap.getInterviewDate().toLocalDate().minusDays(7)); i++) {
            if (i % 5 == 0) {
                items.add(createMockInterviewItem(roadmap, currentDate));
            } else if (i % 3 == 0) {
                items.add(createRevisionItem(roadmap, currentDate));
            } else {
                items.add(createPracticeItem(roadmap, currentDate, position));
            }
            currentDate = currentDate.plusDays(1);
        }

        // Phase 3: Final week intensive review (remaining time)
        while (currentDate.isBefore(roadmap.getInterviewDate().toLocalDate().minusDays(1))) {
            if (currentDate.equals(roadmap.getInterviewDate().toLocalDate().minusDays(2))) {
                items.add(createMockInterviewItem(roadmap, currentDate));
            } else {
                items.add(createRevisionItem(roadmap, currentDate));
            }
            currentDate = currentDate.plusDays(1);
        }

        return items;
    }

    private RoadmapItem createLearningItem(Roadmap roadmap, LocalDate date, String skill, String position) {
        Map<String, List<String>> resources = generateLearningResources(skill, position);

        return RoadmapItem.builder()
                .roadmap(roadmap)
                .dayDate(date)
                .itemType(RoadmapItemType.LEARN_TOPIC)
                .title("Learn " + skill)
                .description("Deep dive into " + skill + " concepts and practical applications for " + position)
                .resourceLinks(convertListToJson(resources.get("resources")))
                .videoLinks(convertListToJson(resources.get("videos")))
                .websiteLinks(convertListToJson(resources.get("websites")))
                .estimatedHours(6)
                .isCompleted(false)
                .build();
    }

    private RoadmapItem createPracticeItem(Roadmap roadmap, LocalDate date, String context) {
        return RoadmapItem.builder()
                .roadmap(roadmap)
                .dayDate(date)
                .itemType(RoadmapItemType.PRACTICE)
                .title("Practice " + context)
                .description("Hands-on practice and coding exercises for " + context)
                .resourceLinks(convertListToJson(Arrays.asList(
                        "LeetCode", "HackerRank", "CodeSignal", "InterviewBit")))
                .websiteLinks(convertListToJson(Arrays.asList(
                        "https://leetcode.com",
                        "https://hackerrank.com",
                        "https://codesignal.com")))
                .estimatedHours(4)
                .isCompleted(false)
                .build();
    }

    private RoadmapItem createRevisionItem(Roadmap roadmap, LocalDate date) {
        return RoadmapItem.builder()
                .roadmap(roadmap)
                .dayDate(date)
                .itemType(RoadmapItemType.REVISION)
                .title("Revision Day")
                .description("Review and reinforce previously learned concepts")
                .estimatedHours(4)
                .isCompleted(false)
                .build();
    }

    private RoadmapItem createMockInterviewItem(Roadmap roadmap, LocalDate date) {
        return RoadmapItem.builder()
                .roadmap(roadmap)
                .dayDate(date)
                .itemType(RoadmapItemType.MOCK_INTERVIEW)
                .title("Mock Interview")
                .description("Practice interview questions and scenarios")
                .resourceLinks(convertListToJson(Arrays.asList(
                        "Pramp", "InterviewBuddy", "Mock Interview Questions")))
                .websiteLinks(convertListToJson(Arrays.asList(
                        "https://pramp.com",
                        "https://interviewbuddy.in")))
                .estimatedHours(3)
                .isCompleted(false)
                .build();
    }

    private RoadmapItem createBreakItem(Roadmap roadmap, LocalDate date) {
        return RoadmapItem.builder()
                .roadmap(roadmap)
                .dayDate(date)
                .itemType(RoadmapItemType.BREAK_DAY)
                .title("Break Day")
                .description("Rest and recharge. Light review or complete rest.")
                .estimatedHours(2)
                .isCompleted(false)
                .build();
    }

    private RoadmapItem createFinalReviewItem(Roadmap roadmap, LocalDate date) {
        return RoadmapItem.builder()
                .roadmap(roadmap)
                .dayDate(date)
                .itemType(RoadmapItemType.FINAL_REVIEW)
                .title("Final Review")
                .description("Final preparation and mental preparation for the interview")
                .estimatedHours(3)
                .isCompleted(false)
                .build();
    }

    private Map<String, List<String>> generateLearningResources(String skill, String position) {
        Map<String, List<String>> resources = new HashMap<>();

        List<String> resourceLinks = new ArrayList<>();
        List<String> videoLinks = new ArrayList<>();
        List<String> websiteLinks = new ArrayList<>();

        // Generic resources based on common skills
        String skillLower = skill.toLowerCase();

        if (skillLower.contains("java")) {
            videoLinks.addAll(Arrays.asList(
                    "Java Full Course - YouTube",
                    "Java OOP Concepts - YouTube",
                    "Spring Boot Tutorial - YouTube"));
            websiteLinks.addAll(Arrays.asList(
                    "https://docs.oracle.com/javase/tutorial/",
                    "https://spring.io/guides",
                    "https://www.baeldung.com"));
        } else if (skillLower.contains("python")) {
            videoLinks.addAll(Arrays.asList(
                    "Python Full Course - YouTube",
                    "Django Tutorial - YouTube",
                    "Flask Tutorial - YouTube"));
            websiteLinks.addAll(Arrays.asList(
                    "https://docs.python.org/3/tutorial/",
                    "https://realpython.com",
                    "https://python-course.eu"));
        } else if (skillLower.contains("javascript") || skillLower.contains("js")) {
            videoLinks.addAll(Arrays.asList(
                    "JavaScript Full Course - YouTube",
                    "React.js Tutorial - YouTube",
                    "Node.js Tutorial - YouTube"));
            websiteLinks.addAll(Arrays.asList(
                    "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
                    "https://javascript.info",
                    "https://reactjs.org/tutorial/tutorial.html"));
        } else if (skillLower.contains("sql") || skillLower.contains("database")) {
            videoLinks.addAll(Arrays.asList(
                    "SQL Tutorial - YouTube",
                    "Database Design - YouTube",
                    "MySQL Tutorial - YouTube"));
            websiteLinks.addAll(Arrays.asList(
                    "https://www.w3schools.com/sql/",
                    "https://sqlbolt.com",
                    "https://www.postgresql.org/docs/"));
        } else {
            // Generic programming resources
            videoLinks.addAll(Arrays.asList(
                    skill + " Tutorial - YouTube",
                    skill + " Best Practices - YouTube"));
            websiteLinks.addAll(Arrays.asList(
                    "https://www.tutorialspoint.com",
                    "https://www.geeksforgeeks.org",
                    "https://stackoverflow.com"));
        }

        resources.put("resources", resourceLinks);
        resources.put("videos", videoLinks);
        resources.put("websites", websiteLinks);

        return resources;
    }

    private List<String> parseSkills(String requiredSkills) {
        if (requiredSkills == null || requiredSkills.trim().isEmpty()) {
            return Arrays.asList("Programming", "Problem Solving", "System Design");
        }

        return Arrays.stream(requiredSkills.split(","))
                .map(String::trim)
                .filter(skill -> !skill.isEmpty())
                .collect(Collectors.toList());
    }

    private String convertListToJson(List<String> list) {
        if (list == null || list.isEmpty()) {
            return "[]";
        }
        try {
            return objectMapper.writeValueAsString(list);
        } catch (JsonProcessingException e) {
            log.error("Error converting list to JSON", e);
            return "[]";
        }
    }

    private List<String> convertJsonToList(String json) {
        if (json == null || json.trim().isEmpty() || "[]".equals(json)) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {
            });
        } catch (JsonProcessingException e) {
            log.error("Error converting JSON to list", e);
            return new ArrayList<>();
        }
    }

    private RoadmapDTO convertToDTO(Roadmap roadmap) {
        List<RoadmapItemDTO> itemDTOs = roadmapItemRepository
                .findByRoadmapIdOrderByDayDate(roadmap.getId())
                .stream()
                .map(this::convertItemToDTO)
                .collect(Collectors.toList());

        long totalItems = roadmapItemRepository.countTotalItemsByRoadmapId(roadmap.getId());
        long completedItems = roadmapItemRepository.countCompletedItemsByRoadmapId(roadmap.getId());
        double completionPercentage = totalItems > 0 ? (double) completedItems / totalItems * 100 : 0;

        return RoadmapDTO.builder()
                .id(roadmap.getId())
                .jobId(roadmap.getJobId())
                .profileId(roadmap.getProfileId())
                .interviewDate(roadmap.getInterviewDate())
                .createdAt(roadmap.getCreatedAt())
                .updatedAt(roadmap.getUpdatedAt())
                .title(roadmap.getTitle())
                .description(roadmap.getDescription())
                .roadmapItems(itemDTOs)
                .totalItems(totalItems)
                .completedItems(completedItems)
                .completionPercentage(completionPercentage)
                .build();
    }

    private RoadmapItemDTO convertItemToDTO(RoadmapItem item) {
        return RoadmapItemDTO.builder()
                .id(item.getId())
                .dayDate(item.getDayDate())
                .itemType(item.getItemType())
                .title(item.getTitle())
                .description(item.getDescription())
                .resourceLinks(convertJsonToList(item.getResourceLinks()))
                .videoLinks(convertJsonToList(item.getVideoLinks()))
                .websiteLinks(convertJsonToList(item.getWebsiteLinks()))
                .isCompleted(item.getIsCompleted())
                .completionNotes(item.getCompletionNotes())
                .estimatedHours(item.getEstimatedHours())
                .build();
    }
}
