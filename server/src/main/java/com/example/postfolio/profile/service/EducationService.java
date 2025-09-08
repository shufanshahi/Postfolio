package com.example.postfolio.profile.service;

import com.example.postfolio.profile.dto.EducationSummaryDto;
import com.example.postfolio.profile.dto.SchoolDto;
import com.example.postfolio.profile.dto.UniversityDto;
import com.example.postfolio.profile.dto.UniversityDegreeSummaryDto;
import com.example.postfolio.profile.dto.WorkDto;
import com.example.postfolio.profile.entity.Profile;
import com.example.postfolio.profile.entity.School;
import com.example.postfolio.profile.entity.University;
import com.example.postfolio.profile.entity.Work;
import com.example.postfolio.profile.repository.ProfileRepository;
import com.example.postfolio.profile.repository.SchoolRepository;
import com.example.postfolio.profile.repository.UniversityRepository;
import com.example.postfolio.profile.repository.WorkRepository;
import com.example.postfolio.user.entity.User;
import com.example.postfolio.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EducationService {

        private final SchoolRepository schoolRepository;
        private final UniversityRepository universityRepository;
        private final WorkRepository workRepository;
        private final ProfileRepository profileRepository;
        private final UserRepository userRepository;

        // School operations
        public SchoolDto createSchool(SchoolDto schoolDto, User user) {
                Profile profile = profileRepository.findByUser(user)
                                .orElseThrow(() -> new RuntimeException("Profile not found for user"));

                School school = School.builder()
                                .schoolName(schoolDto.getSchoolName())
                                .classLevel(schoolDto.getClassLevel())
                                .academicYear(schoolDto.getAcademicYear())
                                .result(schoolDto.getResult())
                                .profile(profile)
                                .build();

                School savedSchool = schoolRepository.save(school);
                return convertToDto(savedSchool);
        }

        public List<SchoolDto> getUserSchools(User user) {
                Profile profile = profileRepository.findByUser(user)
                                .orElseThrow(() -> new RuntimeException("Profile not found for user"));
                List<School> schools = schoolRepository.findByProfileOrderByClassLevelAsc(profile);
                return schools.stream()
                                .map(this::convertToDto)
                                .collect(Collectors.toList());
        }

        public SchoolDto updateSchool(Long schoolId, SchoolDto schoolDto, User user) {
                Profile profile = profileRepository.findByUser(user)
                                .orElseThrow(() -> new RuntimeException("Profile not found for user"));

                School school = schoolRepository.findById(schoolId)
                                .orElseThrow(() -> new RuntimeException("School not found"));

                if (!school.getProfile().getId().equals(profile.getId())) {
                        throw new RuntimeException("Unauthorized access");
                }

                school.setSchoolName(schoolDto.getSchoolName());
                school.setClassLevel(schoolDto.getClassLevel());
                school.setAcademicYear(schoolDto.getAcademicYear());
                school.setResult(schoolDto.getResult());

                School updatedSchool = schoolRepository.save(school);
                return convertToDto(updatedSchool);
        }

        public void deleteSchool(Long schoolId, User user) {
                Profile profile = profileRepository.findByUser(user)
                                .orElseThrow(() -> new RuntimeException("Profile not found for user"));

                School school = schoolRepository.findById(schoolId)
                                .orElseThrow(() -> new RuntimeException("School not found"));

                if (!school.getProfile().getId().equals(profile.getId())) {
                        throw new RuntimeException("Unauthorized access");
                }

                schoolRepository.delete(school);
        }

        public SchoolDto addClassResult(Long schoolId, Integer classLevel, String academicYear, String result,
                        User user) {
                Profile profile = profileRepository.findByUser(user)
                                .orElseThrow(() -> new RuntimeException("Profile not found for user"));

                // Check if the school exists and belongs to the user
                School school = schoolRepository.findById(schoolId)
                                .orElseThrow(() -> new RuntimeException("School not found"));

                if (!school.getProfile().getId().equals(profile.getId())) {
                        throw new RuntimeException("Unauthorized access");
                }

                // Check if a school entry already exists for this class level
                List<School> existingSchools = schoolRepository.findByProfileAndSchoolNameAndClassLevel(
                                profile, school.getSchoolName(), classLevel);

                if (!existingSchools.isEmpty()) {
                        throw new RuntimeException("Result for this class level already exists for this school");
                }

                // Create a new school entry for this specific class
                School newClassEntry = School.builder()
                                .schoolName(school.getSchoolName())
                                .classLevel(classLevel)
                                .academicYear(academicYear)
                                .result(result)
                                .profile(profile)
                                .build();

                School savedSchool = schoolRepository.save(newClassEntry);
                return convertToDto(savedSchool);
        }

        // University operations
        public UniversityDto createUniversity(UniversityDto universityDto, User user) {
                Profile profile = profileRepository.findByUser(user)
                                .orElseThrow(() -> new RuntimeException("Profile not found for user"));

                University university = University.builder()
                                .universityName(universityDto.getUniversityName())
                                .degreeName(universityDto.getDegreeName())
                                .semesterNumber(universityDto.getSemesterNumber())
                                .academicYear(universityDto.getAcademicYear())
                                .semesterResult(universityDto.getSemesterResult())
                                .totalCredits(universityDto.getTotalCredits())
                                .completionDate(universityDto.getCompletionDate())
                                .transcriptUrl(universityDto.getTranscriptUrl())
                                .isCompleted(universityDto.getIsCompleted())
                                .profile(profile)
                                .build();

                University savedUniversity = universityRepository.save(university);
                return convertToDto(savedUniversity);
        }

        public List<UniversityDto> getUserUniversities(User user) {
                Profile profile = profileRepository.findByUser(user)
                                .orElseThrow(() -> new RuntimeException("Profile not found for user"));
                List<University> universities = universityRepository.findByProfileOrderBySemesterNumberAsc(profile);
                return universities.stream()
                                .map(this::convertToDto)
                                .collect(Collectors.toList());
        }

        public UniversityDto updateUniversity(Long universityId, UniversityDto universityDto, User user) {
                Profile profile = profileRepository.findByUser(user)
                                .orElseThrow(() -> new RuntimeException("Profile not found for user"));

                University university = universityRepository.findById(universityId)
                                .orElseThrow(() -> new RuntimeException("University not found"));

                if (!university.getProfile().getId().equals(profile.getId())) {
                        throw new RuntimeException("Unauthorized access");
                }

                university.setUniversityName(universityDto.getUniversityName());
                university.setDegreeName(universityDto.getDegreeName());
                university.setSemesterNumber(universityDto.getSemesterNumber());
                university.setAcademicYear(universityDto.getAcademicYear());
                university.setSemesterResult(universityDto.getSemesterResult());
                university.setTotalCredits(universityDto.getTotalCredits());
                university.setCompletionDate(universityDto.getCompletionDate());
                university.setTranscriptUrl(universityDto.getTranscriptUrl());
                university.setIsCompleted(universityDto.getIsCompleted());

                University updatedUniversity = universityRepository.save(university);
                return convertToDto(updatedUniversity);
        }

        public void deleteUniversity(Long universityId, User user) {
                Profile profile = profileRepository.findByUser(user)
                                .orElseThrow(() -> new RuntimeException("Profile not found for user"));

                University university = universityRepository.findById(universityId)
                                .orElseThrow(() -> new RuntimeException("University not found"));

                if (!university.getProfile().getId().equals(profile.getId())) {
                        throw new RuntimeException("Unauthorized access");
                }

                universityRepository.delete(university);
        }

        // Work operations
        public List<WorkDto> getUserWorks(User user) {
                Profile profile = profileRepository.findByUser(user)
                                .orElseThrow(() -> new RuntimeException("Profile not found for user"));
                List<Work> works = workRepository.findByProfileOrderByStartDateDesc(profile);
                return works.stream()
                                .map(this::convertToWorkDto)
                                .collect(Collectors.toList());
        }

        // Get complete education summary
        public EducationSummaryDto getEducationSummary(User user) {
                List<SchoolDto> schools = getUserSchools(user);
                List<UniversityDto> universities = getUserUniversities(user);
                List<WorkDto> works = getUserWorks(user);
                List<UniversityDegreeSummaryDto> universityDegreeSummaries = calculateUniversityDegreeSummaries(
                                universities);

                return EducationSummaryDto.builder()
                                .schools(schools)
                                .universities(universities)
                                .works(works)
                                .universityDegreeSummaries(universityDegreeSummaries)
                                .build();
        }

        // Get complete education summary by user ID for public viewing
        public EducationSummaryDto getEducationSummaryByUserId(Long userId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

                List<SchoolDto> schools = getUserSchools(user);
                List<UniversityDto> universities = getUserUniversities(user);
                List<WorkDto> works = getUserWorks(user);
                List<UniversityDegreeSummaryDto> universityDegreeSummaries = calculateUniversityDegreeSummaries(
                                universities);

                return EducationSummaryDto.builder()
                                .schools(schools)
                                .universities(universities)
                                .works(works)
                                .universityDegreeSummaries(universityDegreeSummaries)
                                .build();
        }

        // Calculate university degree summaries with average CGPA
        private List<UniversityDegreeSummaryDto> calculateUniversityDegreeSummaries(List<UniversityDto> universities) {
                // Group universities by university name and degree name
                Map<String, List<UniversityDto>> groupedByDegree = universities.stream()
                                .collect(Collectors.groupingBy(u -> u.getUniversityName() + "|" + u.getDegreeName()));

                return groupedByDegree.entrySet().stream()
                                .map(entry -> {
                                        String[] parts = entry.getKey().split("\\|");
                                        String universityName = parts[0];
                                        String degreeName = parts[1];
                                        List<UniversityDto> semesters = entry.getValue();

                                        // Calculate average CGPA
                                        Double averageCgpa = calculateAverageCgpa(semesters);

                                        // Count semesters
                                        int totalSemesters = semesters.size();
                                        int completedSemesters = (int) semesters.stream()
                                                        .filter(UniversityDto::getIsCompleted)
                                                        .count();

                                        // Determine if degree is completed (all 8 semesters completed)
                                        boolean isCompleted = completedSemesters >= 8;

                                        // Get start and end dates
                                        var startDate = semesters.stream()
                                                        .filter(s -> s.getCompletionDate() != null)
                                                        .map(UniversityDto::getCompletionDate)
                                                        .min(java.time.LocalDate::compareTo)
                                                        .orElse(null);

                                        var endDate = semesters.stream()
                                                        .filter(s -> s.getCompletionDate() != null)
                                                        .map(UniversityDto::getCompletionDate)
                                                        .max(java.time.LocalDate::compareTo)
                                                        .orElse(null);

                                        return UniversityDegreeSummaryDto.builder()
                                                        .universityName(universityName)
                                                        .degreeName(degreeName)
                                                        .averageCgpa(averageCgpa)
                                                        .totalSemesters(totalSemesters)
                                                        .completedSemesters(completedSemesters)
                                                        .startDate(startDate)
                                                        .endDate(endDate)
                                                        .isCompleted(isCompleted)
                                                        .semesters(semesters)
                                                        .build();
                                })
                                .collect(Collectors.toList());
        }

        // Calculate average CGPA from semester results
        private Double calculateAverageCgpa(List<UniversityDto> semesters) {
                List<Double> cgpaValues = semesters.stream()
                                .map(semester -> {
                                        try {
                                                // Try to parse the semester result as a double (CGPA)
                                                return Double.parseDouble(semester.getSemesterResult());
                                        } catch (NumberFormatException e) {
                                                // If it's not a number, return null (will be filtered out)
                                                return null;
                                        }
                                })
                                .filter(cgpa -> cgpa != null && cgpa > 0) // Filter out null and zero values
                                .collect(Collectors.toList());

                if (cgpaValues.isEmpty()) {
                        return null; // No valid CGPA values found
                }

                // Calculate average
                double sum = cgpaValues.stream().mapToDouble(Double::doubleValue).sum();
                return sum / cgpaValues.size();
        }

        // Helper methods to convert entities to DTOs
        private SchoolDto convertToDto(School school) {
                return SchoolDto.builder()
                                .id(school.getId())
                                .schoolName(school.getSchoolName())
                                .classLevel(school.getClassLevel())
                                .academicYear(school.getAcademicYear())
                                .result(school.getResult())
                                .displayName(school.getDisplayName())
                                .build();
        }

        private UniversityDto convertToDto(University university) {
                return UniversityDto.builder()
                                .id(university.getId())
                                .universityName(university.getUniversityName())
                                .degreeName(university.getDegreeName())
                                .semesterNumber(university.getSemesterNumber())
                                .academicYear(university.getAcademicYear())
                                .semesterResult(university.getSemesterResult())
                                .totalCredits(university.getTotalCredits())
                                .completionDate(university.getCompletionDate())
                                .transcriptUrl(university.getTranscriptUrl())
                                .isCompleted(university.getIsCompleted())
                                .semesterDisplayName(university.getSemesterDisplayName())
                                .academicLevel(university.getAcademicLevel())
                                .build();
        }

        private WorkDto convertToWorkDto(Work work) {
                return WorkDto.builder()
                                .id(work.getId())
                                .companyName(work.getCompanyName())
                                .position(work.getPosition())
                                .startDate(work.getStartDate())
                                .endDate(work.getEndDate())
                                .isCurrent(work.getIsCurrent())
                                .duration(work.getDuration())
                                .displayDateRange(work.getDisplayDateRange())
                                .build();
        }
}