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
                                .semesterCount(universityDto.getSemesterCount())
                                .semesterResults(universityDto.getSemesterResults())
                                .cgpa(universityDto.getCgpa())
                                .profile(profile)
                                .build();

                // Calculate CGPA if semester results are provided
                if (university.getSemesterResults() != null && !university.getSemesterResults().isEmpty()) {
                        university.updateCGPA();
                }

                University savedUniversity = universityRepository.save(university);
                return convertToDto(savedUniversity);
        }

        public List<UniversityDto> getUserUniversities(User user) {
                Profile profile = profileRepository.findByUser(user)
                                .orElseThrow(() -> new RuntimeException("Profile not found for user"));
                List<University> universities = universityRepository.findByProfile(profile);
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
                university.setSemesterCount(universityDto.getSemesterCount());
                university.setSemesterResults(universityDto.getSemesterResults());
                
                // Update CGPA when semester results change
                university.updateCGPA();

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

        // Add semester result to existing university
        public UniversityDto addSemesterResult(Long universityId, Double gpa, User user) {
                Profile profile = profileRepository.findByUser(user)
                                .orElseThrow(() -> new RuntimeException("Profile not found for user"));

                University university = universityRepository.findById(universityId)
                                .orElseThrow(() -> new RuntimeException("University not found"));

                if (!university.getProfile().getId().equals(profile.getId())) {
                        throw new RuntimeException("Unauthorized access");
                }

                // Check if we can add more semester results
                if (university.getSemesterResults() != null && 
                    university.getSemesterResults().size() >= university.getSemesterCount()) {
                        throw new RuntimeException("Cannot add more semester results. Maximum semesters reached.");
                }

                university.addSemesterResult(gpa);
                University updatedUniversity = universityRepository.save(university);
                return convertToDto(updatedUniversity);
        }

        // Update specific semester result
        public UniversityDto updateSemesterResult(Long universityId, int semesterIndex, Double gpa, User user) {
                Profile profile = profileRepository.findByUser(user)
                                .orElseThrow(() -> new RuntimeException("Profile not found for user"));

                University university = universityRepository.findById(universityId)
                                .orElseThrow(() -> new RuntimeException("University not found"));

                if (!university.getProfile().getId().equals(profile.getId())) {
                        throw new RuntimeException("Unauthorized access");
                }

                university.updateSemesterResult(semesterIndex, gpa);
                University updatedUniversity = universityRepository.save(university);
                return convertToDto(updatedUniversity);
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
                return universities.stream()
                                .map(university -> {
                                        // Use the CGPA directly from the university
                                        Double averageCgpa = university.getCgpa();

                                        // Get semester counts from the university
                                        int totalSemesters = university.getSemesterCount();
                                        int completedSemesters = university.getCompletedSemestersCount();

                                        // Determine if degree is completed
                                        boolean isCompleted = university.getIsDegreeCompleted();

                                        return UniversityDegreeSummaryDto.builder()
                                                        .universityName(university.getUniversityName())
                                                        .degreeName(university.getDegreeName())
                                                        .averageCgpa(averageCgpa)
                                                        .totalSemesters(totalSemesters)
                                                        .completedSemesters(completedSemesters)
                                                        .startDate(null) // Not available in new structure
                                                        .endDate(null) // Not available in new structure
                                                        .isCompleted(isCompleted)
                                                        .semesters(List.of(university)) // Single university entry
                                                        .build();
                                })
                                .collect(Collectors.toList());
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
                                .semesterCount(university.getSemesterCount())
                                .semesterResults(university.getSemesterResults())
                                .cgpa(university.getCgpa())
                                .completedSemestersCount(university.getCompletedSemestersCount())
                                .progressPercentage(university.getProgressPercentage())
                                .isDegreeCompleted(university.isDegreeCompleted())
                                .degreeDisplayName(university.getDegreeDisplayName())
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