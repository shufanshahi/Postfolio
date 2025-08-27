package com.example.postfolio.cvDownload.service;

import com.example.postfolio.profile.entity.Profile;
import com.example.postfolio.post.entity.Post;
import com.example.postfolio.post.models.PostType;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class CvGeneratorService {

    // Font configurations
    private static final Font HEADER_FONT = new Font(Font.FontFamily.HELVETICA, 18, Font.BOLD);
    private static final Font SECTION_FONT = new Font(Font.FontFamily.HELVETICA, 14, Font.BOLD);
    private static final Font NORMAL_FONT = new Font(Font.FontFamily.HELVETICA, 12);
    private static final Font ITALIC_FONT = new Font(Font.FontFamily.HELVETICA, 12, Font.ITALIC);

    public byte[] generateCv(Profile profile, List<Post> posts) throws DocumentException {
        Document document = new Document();
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, outputStream);

        document.open();

        // 1. Personal Information Section
        addPersonalInfoSection(document, profile);

        // 2. Work Experience Section
        addWorkExperienceSection(document, profile);

        // 3. Experience Section (from posts)
        addPostSection(document, "EXPERIENCE",
                filterPostsByType(posts, PostType.EXPERIENCE));

        // 4. Education Section
        //addEducationSection(document, profile);

        // 4. Projects Section
        addPostSection(document, "PROJECTS",
                filterPostsByType(posts, PostType.PROJECT));

        // 5. Achievements Section
        addPostSection(document, "ACHIEVEMENTS",
                filterPostsByType(posts, PostType.ACHIEVEMENT));

        // 6. Skills Section
        addSkillsSection(document, posts);

        document.close();
        return outputStream.toByteArray();
    }

    private void addPersonalInfoSection(Document document, Profile profile) throws DocumentException {
        Paragraph sectionTitle = new Paragraph("PERSONAL INFORMATION", HEADER_FONT);
        sectionTitle.setSpacingAfter(10f);
        document.add(sectionTitle);

        // Name
        if (profile.getUser().getName() != null) {
            document.add(new Paragraph(profile.getUser().getName(), NORMAL_FONT));
        }

        // Contact Info
        StringBuilder contactInfo = new StringBuilder();
        if (profile.getPhoneNumber() != null) {
            contactInfo.append(profile.getPhoneNumber()).append(" | ");
        }
        if (profile.getUser().getEmail() != null) {
            contactInfo.append(profile.getUser().getEmail());
        }
        if (contactInfo.length() > 0) {
            document.add(new Paragraph(contactInfo.toString(), NORMAL_FONT));
        }

        // Bio
        if (profile.getBio() != null && !profile.getBio().isEmpty()) {
            document.add(new Paragraph(profile.getBio(), NORMAL_FONT));
        }

        document.add(Chunk.NEWLINE);
    }

    private void addWorkExperienceSection(Document document, Profile profile) throws DocumentException {
        Paragraph sectionTitle = new Paragraph("PROFESSIONAL EXPERIENCE", HEADER_FONT);
        sectionTitle.setSpacingAfter(10f);
        document.add(sectionTitle);

        if (profile.getWorks() == null || profile.getWorks().isEmpty()) {
            document.add(new Paragraph("No work experience to display", ITALIC_FONT));
        } else {
            for (com.example.postfolio.profile.entity.Work work : profile.getWorks()) {
                // Job title and company
                Paragraph jobInfo = new Paragraph();
                jobInfo.add(new Chunk(work.getPosition(), SECTION_FONT));
                jobInfo.add(new Chunk(" at " + work.getCompanyName(), NORMAL_FONT));
                document.add(jobInfo);

                // Location and dates
                StringBuilder details = new StringBuilder();
                if (work.getLocation() != null && !work.getLocation().isEmpty()) {
                    details.append(work.getLocation()).append(" | ");
                }
                details.append(work.getDisplayDateRange());
                if (work.getIsCurrent()) {
                    details.append(" (Current)");
                }
                document.add(new Paragraph(details.toString(), ITALIC_FONT));

                // Description
                if (work.getDescription() != null && !work.getDescription().isEmpty()) {
                    document.add(new Paragraph(work.getDescription(), NORMAL_FONT));
                }

                // Achievements
                if (work.getAchievements() != null && !work.getAchievements().isEmpty()) {
                    document.add(new Paragraph("Key Achievements:", NORMAL_FONT));
                    String[] achievements = work.getAchievements().split(",");
                    for (String achievement : achievements) {
                        document.add(new Paragraph("• " + achievement.trim(), NORMAL_FONT));
                    }
                }

                // Technologies
                if (work.getTechnologiesUsed() != null && !work.getTechnologiesUsed().isEmpty()) {
                    document.add(new Paragraph("Technologies: " + work.getTechnologiesUsed(), ITALIC_FONT));
                }

                document.add(Chunk.NEWLINE);
            }
        }

        document.add(Chunk.NEWLINE);
    }

//    private void addEducationSection(Document document, Profile profile) throws DocumentException {
//        Paragraph sectionTitle = new Paragraph("EDUCATION", HEADER_FONT);
//        sectionTitle.setSpacingAfter(10f);
//        document.add(sectionTitle);
//
//        boolean hasEducation = false;
//
//        if (profile.getUniversityResult() != null) {
//            document.add(new Paragraph("University: " + profile.getUniversityResult(), NORMAL_FONT));
//            hasEducation = true;
//        }
//        if (profile.getHscResult() != null) {
//            document.add(new Paragraph("Higher Secondary: " + profile.getHscResult(), NORMAL_FONT));
//            hasEducation = true;
//        }
//        if (profile.getSscResult() != null) {
//            document.add(new Paragraph("Secondary: " + profile.getSscResult(), NORMAL_FONT));
//            hasEducation = true;
//        }
//
//        if (!hasEducation) {
//            document.add(new Paragraph("No education information provided", ITALIC_FONT));
//        }
//
//        document.add(Chunk.NEWLINE);
//    }

    private void addPostSection(Document document, String sectionName, List<Post> posts) throws DocumentException {
        Paragraph sectionTitle = new Paragraph(sectionName, HEADER_FONT);
        sectionTitle.setSpacingAfter(10f);
        document.add(sectionTitle);

        if (posts.isEmpty()) {
            document.add(new Paragraph("No " + sectionName.toLowerCase() + " to display", ITALIC_FONT));
        } else {
            for (Post post : posts) {
                if (post.getCvHeading() != null) {
                    document.add(new Paragraph(post.getCvHeading(), NORMAL_FONT));
                }
            }
        }

        document.add(Chunk.NEWLINE);
    }

    private void addSkillsSection(Document document, List<Post> posts) throws DocumentException {
        Paragraph sectionTitle = new Paragraph("SKILLS", HEADER_FONT);
        sectionTitle.setSpacingAfter(10f);
        document.add(sectionTitle);

        Set<String> skills = posts.stream()
                .filter(post -> post.getTags() != null)
                .flatMap(post -> post.getTags().stream())
                .collect(Collectors.toSet());

        if (skills.isEmpty()) {
            document.add(new Paragraph("No skills listed", ITALIC_FONT));
        } else {
            document.add(new Paragraph(String.join(", ", skills), NORMAL_FONT));
        }
    }

    private List<Post> filterPostsByType(List<Post> posts, PostType type) {
        return posts.stream()
                .filter(post -> post.getType() == type)
                .collect(Collectors.toList());
    }
}