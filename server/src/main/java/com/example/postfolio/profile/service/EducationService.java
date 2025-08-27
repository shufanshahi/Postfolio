package com.example.postfolio.profile.service;

import com.example.postfolio.profile.dto.EducationSummaryDto;
import com.example.postfolio.profile.dto.SchoolDto;
import com.example.postfolio.profile.dto.UniversityDto;
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

        // School operations
        public SchoolDto createSchool(SchoolDto schoolDto, User user) {
                Profile profile = profileRepository.findByUser(user)
                                .orElseThrow(() -> new RuntimeException("Profile not found for user"));

                School school = School.builder()
                                .schoolName(schoolDto.getSchoolName())
                                .classLevel(schoolDto.getClassLevel())
                                .academicYear(schoolDto.getAcademicYear())
                                .result(schoolDto.getResult())
                                .resultType(schoolDto.getResultType())
                                .completionDate(schoolDto.getCompletionDate())
                                .certificateUrl(schoolDto.getCertificateUrl())
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
                school.setResultType(schoolDto.getResultType());
                school.setCompletionDate(schoolDto.getCompletionDate());
                school.setCertificateUrl(schoolDto.getCertificateUrl());

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

                return EducationSummaryDto.builder()
                                .schools(schools)
                                .universities(universities)
                                .works(works)
                                .build();
        }

        // Helper methods to convert entities to DTOs
        private SchoolDto convertToDto(School school) {
                return SchoolDto.builder()
                                .id(school.getId())
                                .schoolName(school.getSchoolName())
                                .classLevel(school.getClassLevel())
                                .academicYear(school.getAcademicYear())
                                .result(school.getResult())
                                .resultType(school.getResultType())
                                .completionDate(school.getCompletionDate())
                                .certificateUrl(school.getCertificateUrl())
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