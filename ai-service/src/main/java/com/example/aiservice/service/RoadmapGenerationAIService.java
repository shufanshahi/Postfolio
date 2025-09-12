package com.example.aiservice.service;

import com.example.aiservice.client.GeminiClient;
import com.example.aiservice.dto.RoadmapGenerationRequest;
import com.example.aiservice.dto.RoadmapGenerationResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoadmapGenerationAIService {

    private final GeminiClient geminiClient;
    private final ObjectMapper objectMapper;

    public RoadmapGenerationResponse generateRoadmap(RoadmapGenerationRequest request) {
        try {
            log.info("Generating AI-powered roadmap for job {} and profile {}",
                    request.getJobId(), request.getProfileId());

            String prompt = buildRoadmapPrompt(request);
            String aiResponse = geminiClient.generateContent(prompt);

            return parseAIResponse(aiResponse, request);

        } catch (Exception e) {
            log.error("Error generating roadmap with AI: ", e);
            return RoadmapGenerationResponse.builder()
                    .jobId(request.getJobId())
                    .profileId(request.getProfileId())
                    .success(false)
                    .errorMessage("Failed to generate roadmap: " + e.getMessage())
                    .build();
        }
    }

    private String buildRoadmapPrompt(RoadmapGenerationRequest request) {
        StringBuilder prompt = new StringBuilder();

        prompt.append("You are an expert career counselor and technical interview coach. ");
        prompt.append("Create a comprehensive, day-by-day preparation roadmap for a job interview. ");
        prompt.append(
                "Return your response ONLY as a valid JSON object (no markdown, no backticks, no explanations).\n\n");

        prompt.append("Job Details:\n");
        prompt.append("- Title: ").append(request.getJobTitle()).append("\n");
        prompt.append("- Description: ").append(request.getJobDescription()).append("\n");
        prompt.append("- Required Skills: ").append(request.getRequiredSkills()).append("\n");
        prompt.append("- Required Experience: ").append(request.getRequiredExperience()).append("\n");
        prompt.append("- Required Education: ").append(request.getRequiredEducation()).append("\n");
        prompt.append("- Location: ").append(request.getLocation()).append("\n");
        prompt.append("- Interview Date: ").append(request.getInterviewDate()).append("\n");
        prompt.append("- Days until interview: ").append(request.getDaysUntilInterview()).append("\n\n");

        if (request.getCandidateSkills() != null && !request.getCandidateSkills().isEmpty()) {
            prompt.append("Candidate Current Skills: ").append(request.getCandidateSkills()).append("\n");
        }
        if (request.getCandidateExperience() != null && !request.getCandidateExperience().isEmpty()) {
            prompt.append("Candidate Experience: ").append(request.getCandidateExperience()).append("\n");
        }

        prompt.append("\nCreate a roadmap with the following JSON structure:\n");
        prompt.append("{\n");
        prompt.append("  \"title\": \"Comprehensive Interview Preparation Plan\",\n");
        prompt.append("  \"description\": \"AI-generated preparation roadmap\",\n");
        prompt.append("  \"items\": [\n");
        prompt.append("    {\n");
        prompt.append("      \"date\": \"2025-09-13\",\n");
        prompt.append("      \"type\": \"LEARN_TOPIC\",\n");
        prompt.append("      \"title\": \"Topic Title\",\n");
        prompt.append("      \"description\": \"Detailed description of what to learn/do\",\n");
        prompt.append(
                "      \"resources\": [\"https://example.com/resource1\", \"Book: Title\", \"YouTube: Channel/Video\"],\n");
        prompt.append("      \"estimatedHours\": 4,\n");
        prompt.append("      \"priority\": \"HIGH\"\n");
        prompt.append("    }\n");
        prompt.append("  ]\n");
        prompt.append("}\n\n");

        prompt.append("Guidelines:\n");
        prompt.append(
                "- Include diverse item types: LEARN_TOPIC, REVISION, PRACTICE, MOCK_INTERVIEW, BREAK_DAY, FINAL_REVIEW\n");
        prompt.append("- Provide real, useful resources (websites, courses, books, YouTube channels)\n");
        prompt.append("- Balance learning with practice and rest\n");
        prompt.append("- Estimate realistic hours per day (2-8 hours)\n");
        prompt.append("- Prioritize based on job requirements and candidate gaps\n");
        prompt.append("- Include coding practice, system design, behavioral questions as needed\n");
        prompt.append("- Add company research and role-specific preparation\n");
        prompt.append("- Schedule lighter days before the interview\n");
        prompt.append("- Start from today (").append(LocalDate.now().toString())
                .append(") and plan up to the interview date\n\n");

        prompt.append("Return ONLY the JSON object, no other text:");

        return prompt.toString();
    }

    private RoadmapGenerationResponse parseAIResponse(String aiResponse, RoadmapGenerationRequest request) {
        try {
            // Clean the response to ensure it's valid JSON
            String cleanedResponse = aiResponse.trim();
            if (cleanedResponse.startsWith("```json")) {
                cleanedResponse = cleanedResponse.substring(7);
            }
            if (cleanedResponse.startsWith("```")) {
                cleanedResponse = cleanedResponse.substring(3);
            }
            if (cleanedResponse.endsWith("```")) {
                cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length() - 3);
            }
            cleanedResponse = cleanedResponse.trim();

            // Parse the JSON response
            var jsonNode = objectMapper.readTree(cleanedResponse);

            String title = jsonNode.get("title").asText();
            String description = jsonNode.get("description").asText();

            List<RoadmapGenerationResponse.RoadmapItemResponse> items = new ArrayList<>();
            var itemsArray = jsonNode.get("items");

            if (itemsArray != null && itemsArray.isArray()) {
                for (var itemNode : itemsArray) {
                    var item = new RoadmapGenerationResponse.RoadmapItemResponse();
                    item.setDate(itemNode.get("date").asText());
                    item.setType(itemNode.get("type").asText());
                    item.setTitle(itemNode.get("title").asText());
                    item.setDescription(itemNode.get("description").asText());
                    item.setEstimatedHours(itemNode.get("estimatedHours").asInt());
                    item.setPriority(itemNode.get("priority").asText());

                    // Parse resources array
                    List<String> resources = new ArrayList<>();
                    var resourcesArray = itemNode.get("resources");
                    if (resourcesArray != null && resourcesArray.isArray()) {
                        for (var resourceNode : resourcesArray) {
                            resources.add(resourceNode.asText());
                        }
                    }
                    item.setResources(resources);

                    items.add(item);
                }
            }

            return RoadmapGenerationResponse.builder()
                    .jobId(request.getJobId())
                    .profileId(request.getProfileId())
                    .title(title)
                    .description(description)
                    .items(items)
                    .success(true)
                    .build();

        } catch (Exception e) {
            log.error("Error parsing AI response: ", e);
            log.debug("AI Response was: {}", aiResponse);
            return createFallbackRoadmap(request);
        }
    }

    private RoadmapGenerationResponse createFallbackRoadmap(RoadmapGenerationRequest request) {
        // Create a simple fallback roadmap if AI parsing fails
        List<RoadmapGenerationResponse.RoadmapItemResponse> items = new ArrayList<>();

        LocalDate currentDate = LocalDate.now();
        for (int i = 0; i < Math.min(request.getDaysUntilInterview(), 14); i++) {
            LocalDate itemDate = currentDate.plusDays(i);

            var item = new RoadmapGenerationResponse.RoadmapItemResponse();
            item.setDate(itemDate.toString());

            if (i == 0) {
                item.setType("LEARN_TOPIC");
                item.setTitle("Job Requirements Review");
                item.setDescription("Review job description and required skills thoroughly");
                item.setResources(List.of("Job posting", "Company website"));
                item.setEstimatedHours(3);
                item.setPriority("HIGH");
            } else if (i == request.getDaysUntilInterview() - 1) {
                item.setType("FINAL_REVIEW");
                item.setTitle("Final Interview Preparation");
                item.setDescription("Light review and mental preparation for interview");
                item.setResources(List.of("Resume review", "Common questions practice"));
                item.setEstimatedHours(2);
                item.setPriority("HIGH");
            } else if (i % 7 == 0 && i > 0) {
                item.setType("BREAK_DAY");
                item.setTitle("Rest Day");
                item.setDescription("Take a break to recharge");
                item.setResources(List.of());
                item.setEstimatedHours(0);
                item.setPriority("LOW");
            } else {
                item.setType("PRACTICE");
                item.setTitle("Skills Practice");
                item.setDescription("Practice relevant technical or soft skills");
                item.setResources(List.of("Online coding platforms", "Interview prep books"));
                item.setEstimatedHours(4);
                item.setPriority("MEDIUM");
            }

            items.add(item);
        }

        return RoadmapGenerationResponse.builder()
                .jobId(request.getJobId())
                .profileId(request.getProfileId())
                .title("Basic Interview Preparation Roadmap")
                .description("Fallback roadmap generated due to AI processing issues")
                .items(items)
                .success(true)
                .build();
    }
}
