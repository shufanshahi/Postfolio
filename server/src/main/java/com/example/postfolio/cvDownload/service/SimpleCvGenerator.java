package com.example.postfolio.cvDownload.service;

import com.example.postfolio.profile.entity.Profile;
import com.example.postfolio.post.entity.Post;
import com.example.postfolio.post.models.PostType;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.*;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SimpleCvGenerator {

    public byte[] generateCv(Profile profile, List<Post> posts) throws DocumentException {
        Document document = new Document();
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, outputStream);

        document.open();

        // 1. Personal Information (from profile)
        addPersonalInfo(document, profile);

        // 2. Experience (from posts)
        addPostsByType(document, "EXPERIENCE",
                posts.stream()
                        .filter(p -> p.getType() == PostType.EXPERIENCE)
                        .collect(Collectors.toList()));

        // 3. Education (from profile)
        addEducation(document, profile);

        // 4. Projects (from posts)
        addPostsByType(document, "PROJECTS",
                posts.stream()
                        .filter(p -> p.getType() == PostType.PROJECT)
                        .collect(Collectors.toList()));

        // 5. Achievements (from posts)
        addPostsByType(document, "ACHIEVEMENTS",
                posts.stream()
                        .filter(p -> p.getType() == PostType.ACHIEVEMENT)
                        .collect(Collectors.toList()));

        // 6. Skills (from all post tags)
        addSkills(document, posts);

        document.close();
        return outputStream.toByteArray();
    }

    private void addPersonalInfo(Document document, Profile profile) throws DocumentException {
        Paragraph section = new Paragraph("PERSONAL INFORMATION", boldFont(16));
        document.add(section);

        // Add profile picture if exists
        if (profile.getPictureBase64() != null) {
            try {
                Image img = Image.getInstance(Base64.getDecoder().decode(profile.getPictureBase64()));
                img.scaleToFit(100, 100);
                document.add(img);
            } catch (Exception e) {
                // Skip if image can't be processed
            }
        }

        // Add basic info
        List<String> info = new ArrayList<>();
        if (profile.getUser().getName() != null) info.add("Name: " + profile.getUser().getName());
        if (profile.getPositionOrInstitue() != null) info.add("Position: " + profile.getPositionOrInstitue());
        if (profile.getPhoneNumber() != null) info.add("Phone: " + profile.getPhoneNumber());
        if (profile.getUser().getEmail() != null) info.add("Email: " + profile.getUser().getEmail());
        if (profile.getAddress() != null) info.add("Address: " + profile.getAddress());
        if (profile.getBio() != null) info.add("Bio: " + profile.getBio());

        for (String line : info) {
            document.add(new Paragraph(line, normalFont(12)));
        }

        document.add(new Paragraph(" ")); // Add space
    }

    private void addEducation(Document document, Profile profile) throws DocumentException {
        Paragraph section = new Paragraph("EDUCATION", boldFont(16));
        document.add(section);

        List<String> education = new ArrayList<>();
        if (profile.getUniversityResult() != null) education.add("University: " + profile.getUniversityResult());
        if (profile.getHscResult() != null) education.add("Higher Secondary: " + profile.getHscResult());
        if (profile.getSscResult() != null) education.add("Secondary: " + profile.getSscResult());

        if (education.isEmpty()) {
            document.add(new Paragraph("No education information provided", italicFont(12)));
        } else {
            for (String edu : education) {
                document.add(new Paragraph(edu, normalFont(12)));
            }
        }

        document.add(new Paragraph(" "));
    }

    private void addPostsByType(Document document, String sectionTitle, List<Post> posts) throws DocumentException {
        Paragraph section = new Paragraph(sectionTitle, boldFont(16));
        document.add(section);

        if (posts.isEmpty()) {
            document.add(new Paragraph("No " + sectionTitle.toLowerCase() + " to display", italicFont(12)));
        } else {
            for (Post post : posts) {
                document.add(new Paragraph(post.getCvHeading(), normalFont(12)));
            }
        }

        document.add(new Paragraph(" "));
    }

    private void addSkills(Document document, List<Post> posts) throws DocumentException {
        Paragraph section = new Paragraph("SKILLS", boldFont(16));
        document.add(section);

        Set<String> skills = posts.stream()
                .filter(p -> p.getTags() != null)
                .flatMap(p -> p.getTags().stream())
                .collect(Collectors.toSet());

        if (skills.isEmpty()) {
            document.add(new Paragraph("No skills listed", italicFont(12)));
        } else {
            document.add(new Paragraph(String.join(", ", skills), normalFont(12)));
        }
    }

    // Helper methods for fonts
    private Font boldFont(float size) {
        return new Font(Font.FontFamily.HELVETICA, size, Font.BOLD);
    }

    private Font normalFont(float size) {
        return new Font(Font.FontFamily.HELVETICA, size);
    }

    private Font italicFont(float size) {
        return new Font(Font.FontFamily.HELVETICA, size, Font.ITALIC);
    }
}