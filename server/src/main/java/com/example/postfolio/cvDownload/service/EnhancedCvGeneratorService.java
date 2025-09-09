package com.example.postfolio.cvDownload.service;

import com.example.postfolio.profile.entity.Profile;
import com.example.postfolio.post.entity.Post;
import com.example.postfolio.post.models.PostType;
import com.example.postfolio.profile.dto.EducationSummaryDto;
import com.example.postfolio.profile.dto.SchoolDto;
import com.example.postfolio.profile.dto.UniversityDto;
import com.example.postfolio.profile.service.EducationService;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.*;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EnhancedCvGeneratorService {

    private final EducationService educationService;

    // Enhanced color scheme matching in-app design
    private static final BaseColor TEAL_PRIMARY = new BaseColor(20, 184, 166); // teal-500
    private static final BaseColor TEAL_LIGHT = new BaseColor(153, 246, 228); // teal-200
    private static final BaseColor INDIGO_PRIMARY = new BaseColor(99, 102, 241); // indigo-500
    private static final BaseColor SLATE_DARK = new BaseColor(51, 65, 85); // slate-700
    private static final BaseColor SLATE_MEDIUM = new BaseColor(100, 116, 139); // slate-500
    private static final BaseColor SLATE_LIGHT = new BaseColor(226, 232, 240); // slate-200
    private static final BaseColor WHITE = BaseColor.WHITE;
    private static final BaseColor LIGHT_GRAY = new BaseColor(248, 250, 252); // slate-50

    // Enhanced font configurations
    private static final Font NAME_FONT = new Font(Font.FontFamily.HELVETICA, 28, Font.BOLD, SLATE_DARK);
    private static final Font SECTION_HEADER_FONT = new Font(Font.FontFamily.HELVETICA, 16, Font.BOLD, TEAL_PRIMARY);
    private static final Font SUBSECTION_FONT = new Font(Font.FontFamily.HELVETICA, 14, Font.BOLD, SLATE_DARK);
    private static final Font NORMAL_FONT = new Font(Font.FontFamily.HELVETICA, 11, Font.NORMAL, SLATE_DARK);
    private static final Font SMALL_FONT = new Font(Font.FontFamily.HELVETICA, 9, Font.NORMAL, SLATE_MEDIUM);
    private static final Font ITALIC_FONT = new Font(Font.FontFamily.HELVETICA, 11, Font.ITALIC, SLATE_MEDIUM);
    private static final Font BIO_FONT = new Font(Font.FontFamily.HELVETICA, 12, Font.NORMAL, SLATE_MEDIUM);

    public byte[] generateCv(Profile profile, List<Post> posts) throws DocumentException, IOException {
        // Create document with custom page size and margins
        Rectangle pageSize = PageSize.A4;
        Document document = new Document(pageSize, 40, 40, 50, 50);
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        PdfWriter writer = PdfWriter.getInstance(document, outputStream);

        // Set up custom page events for styling
        writer.setPageEvent(new CvPageEvent());

        document.open();

        // Add header section with profile info
        addEnhancedHeader(document, profile);

        // Add contact information section
        addContactSection(document, profile);

        // Add bio section if available
        if (profile.getBio() != null && !profile.getBio().isEmpty()) {
            addBioSection(document, profile);
        }

        // Add education summary
        addEducationSummary(document, profile);

        // Add professional experience
        addProfessionalExperience(document, profile);

        // Group and add post sections
        Map<PostType, List<Post>> postsByType = posts.stream()
                .collect(Collectors.groupingBy(Post::getType));

        // Add sections in order of importance
        addPostSectionEnhanced(document, "Projects", postsByType.getOrDefault(PostType.PROJECT, new ArrayList<>()));
        addPostSectionEnhanced(document, "Experience",
                postsByType.getOrDefault(PostType.EXPERIENCE, new ArrayList<>()));
        addPostSectionEnhanced(document, "Achievements",
                postsByType.getOrDefault(PostType.ACHIEVEMENT, new ArrayList<>()));

        // Add skills section
        addSkillsSection(document, posts);

        document.close();
        return outputStream.toByteArray();
    }

    private void addEnhancedHeader(Document document, Profile profile) throws DocumentException {
        // Create a modern header with gradient-like styling
        PdfPTable headerTable = new PdfPTable(2);
        headerTable.setWidthPercentage(100);
        headerTable.setWidths(new float[] { 1, 3 });
        headerTable.setSpacingAfter(25f);

        // Profile picture cell with modern styling
        PdfPCell imageCell = new PdfPCell();
        imageCell.setBorder(Rectangle.NO_BORDER);
        imageCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        imageCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        imageCell.setPadding(15);
        imageCell.setBackgroundColor(new BaseColor(240, 253, 250)); // teal-50

        // Add profile picture if available
        if (profile.getPictureBase64() != null && !profile.getPictureBase64().isEmpty()) {
            try {
                byte[] imageBytes = Base64.getDecoder().decode(profile.getPictureBase64());
                Image profileImage = Image.getInstance(imageBytes);
                profileImage.scaleToFit(90, 90);

                // Create circular border effect
                profileImage.setBorder(Rectangle.BOX);
                profileImage.setBorderWidth(3);
                profileImage.setBorderColor(TEAL_PRIMARY);

                imageCell.addElement(profileImage);
            } catch (Exception e) {
                // Fallback placeholder with modern styling
                PdfPTable placeholderTable = new PdfPTable(1);
                placeholderTable.setWidthPercentage(100);

                PdfPCell placeholderCell = new PdfPCell();
                placeholderCell.setBorder(Rectangle.BOX);
                placeholderCell.setBorderColor(TEAL_PRIMARY);
                placeholderCell.setBorderWidth(3);
                placeholderCell.setBackgroundColor(TEAL_LIGHT);
                placeholderCell.setPadding(20);
                placeholderCell.setFixedHeight(90);

                Paragraph placeholder = new Paragraph("📷",
                        new Font(Font.FontFamily.HELVETICA, 24, Font.NORMAL, TEAL_PRIMARY));
                placeholder.setAlignment(Element.ALIGN_CENTER);
                placeholderCell.addElement(placeholder);

                placeholderTable.addCell(placeholderCell);
                imageCell.addElement(placeholderTable);
            }
        } else {
            // Create modern placeholder
            PdfPTable placeholderTable = new PdfPTable(1);
            placeholderTable.setWidthPercentage(100);

            PdfPCell placeholderCell = new PdfPCell();
            placeholderCell.setBorder(Rectangle.BOX);
            placeholderCell.setBorderColor(TEAL_PRIMARY);
            placeholderCell.setBorderWidth(3);
            placeholderCell.setBackgroundColor(TEAL_LIGHT);
            placeholderCell.setPadding(20);
            placeholderCell.setFixedHeight(90);

            Paragraph placeholder = new Paragraph("📷",
                    new Font(Font.FontFamily.HELVETICA, 24, Font.NORMAL, TEAL_PRIMARY));
            placeholder.setAlignment(Element.ALIGN_CENTER);
            placeholderCell.addElement(placeholder);

            placeholderTable.addCell(placeholderCell);
            imageCell.addElement(placeholderTable);
        }

        // Name and title cell with enhanced styling
        PdfPCell nameCell = new PdfPCell();
        nameCell.setBorder(Rectangle.NO_BORDER);
        nameCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        nameCell.setPadding(15);
        nameCell.setBackgroundColor(new BaseColor(248, 250, 252)); // slate-50

        // Add name with large, bold styling
        String fullName = profile.getUser().getName() != null ? profile.getUser().getName() : "Name Not Available";
        Paragraph name = new Paragraph(fullName,
                new Font(Font.FontFamily.HELVETICA, 32, Font.BOLD, SLATE_DARK));
        name.setSpacingAfter(8);
        nameCell.addElement(name);

        // Add position/title if available with modern styling
        if (profile.getPositionOrInstitue() != null && !profile.getPositionOrInstitue().isEmpty()) {
            Paragraph position = new Paragraph(profile.getPositionOrInstitue(),
                    new Font(Font.FontFamily.HELVETICA, 16, Font.BOLD, INDIGO_PRIMARY));
            position.setSpacingAfter(12);
            nameCell.addElement(position);
        }

        // Add "Professional Portfolio" subtitle with emoji
        Paragraph subtitle = new Paragraph("🌟 Professional Portfolio",
                new Font(Font.FontFamily.HELVETICA, 14, Font.ITALIC, TEAL_PRIMARY));
        nameCell.addElement(subtitle);

        headerTable.addCell(imageCell);
        headerTable.addCell(nameCell);
        document.add(headerTable);

        // Add modern separator line with gradient effect
        addModernSeparatorLine(document);
    }

    private void addContactSection(Document document, Profile profile) throws DocumentException {
        // Contact information in a modern card-style layout
        PdfPTable contactContainer = new PdfPTable(1);
        contactContainer.setWidthPercentage(100);
        contactContainer.setSpacingAfter(20f);
        contactContainer.setSpacingBefore(5f);

        // Main contact card
        PdfPCell contactCard = new PdfPCell();
        contactCard.setBorder(Rectangle.BOX);
        contactCard.setBorderColor(TEAL_LIGHT);
        contactCard.setBorderWidth(1);
        contactCard.setBackgroundColor(new BaseColor(240, 253, 250)); // teal-50
        contactCard.setPadding(15);

        // Contact grid inside the card
        int contactCount = 0;
        if (profile.getUser().getEmail() != null)
            contactCount++;
        if (profile.getPhoneNumber() != null)
            contactCount++;
        if (profile.getAddress() != null)
            contactCount++;

        if (contactCount > 0) {
            PdfPTable contactGrid = new PdfPTable(Math.min(contactCount, 3));
            contactGrid.setWidthPercentage(100);

            // Email
            if (profile.getUser().getEmail() != null) {
                PdfPCell emailCell = createModernContactCell("✉️", "Email", profile.getUser().getEmail());
                contactGrid.addCell(emailCell);
            }

            // Phone
            if (profile.getPhoneNumber() != null) {
                PdfPCell phoneCell = createModernContactCell("📞", "Phone", profile.getPhoneNumber());
                contactGrid.addCell(phoneCell);
            }

            // Location
            if (profile.getAddress() != null) {
                PdfPCell locationCell = createModernContactCell("📍", "Location", profile.getAddress());
                contactGrid.addCell(locationCell);
            }

            contactCard.addElement(contactGrid);
            contactContainer.addCell(contactCard);
            document.add(contactContainer);
        }
    }

    private PdfPCell createModernContactCell(String emoji, String label, String value) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(8);

        // Icon and label row
        PdfPTable iconLabelTable = new PdfPTable(2);
        iconLabelTable.setWidthPercentage(100);
        try {
            iconLabelTable.setWidths(new float[] { 0.2f, 0.8f });
        } catch (DocumentException e) {
            // Use default widths if setting fails
        }

        // Icon cell
        PdfPCell iconCell = new PdfPCell();
        iconCell.setBorder(Rectangle.NO_BORDER);
        iconCell.setPadding(2);
        Paragraph iconPara = new Paragraph(emoji, new Font(Font.FontFamily.HELVETICA, 12, Font.NORMAL));
        iconPara.setAlignment(Element.ALIGN_CENTER);
        iconCell.addElement(iconPara);

        // Label cell
        PdfPCell labelCell = new PdfPCell();
        labelCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setPadding(2);
        Paragraph labelPara = new Paragraph(label, new Font(Font.FontFamily.HELVETICA, 9, Font.BOLD, TEAL_PRIMARY));
        labelCell.addElement(labelPara);

        iconLabelTable.addCell(iconCell);
        iconLabelTable.addCell(labelCell);
        cell.addElement(iconLabelTable);

        // Value
        Paragraph valuePara = new Paragraph(value, new Font(Font.FontFamily.HELVETICA, 9, Font.NORMAL, SLATE_DARK));
        valuePara.setSpacingBefore(3);
        cell.addElement(valuePara);

        return cell;
    }

    private void addBioSection(Document document, Profile profile) throws DocumentException {
        // Section header with modern styling
        Paragraph bioHeader = new Paragraph("💼 Professional Summary", SECTION_HEADER_FONT);
        bioHeader.setSpacingBefore(20f);
        bioHeader.setSpacingAfter(12f);
        document.add(bioHeader);

        // Bio content in a modern styled card
        PdfPTable bioContainer = new PdfPTable(1);
        bioContainer.setWidthPercentage(100);
        bioContainer.setSpacingAfter(20f);

        PdfPCell bioCard = new PdfPCell();
        bioCard.setBorder(Rectangle.BOX);
        bioCard.setBorderColor(new BaseColor(99, 102, 241)); // indigo-500
        bioCard.setBorderWidth(2);
        bioCard.setBackgroundColor(new BaseColor(238, 242, 255)); // indigo-50
        bioCard.setPadding(18);

        // Quote-style styling for bio
        Paragraph quoteMark = new Paragraph("\"",
                new Font(Font.FontFamily.HELVETICA, 24, Font.BOLD, INDIGO_PRIMARY));
        quoteMark.setSpacingAfter(8);
        bioCard.addElement(quoteMark);

        Paragraph bioText = new Paragraph(profile.getBio(),
                new Font(Font.FontFamily.HELVETICA, 12, Font.ITALIC, SLATE_DARK));
        bioText.setAlignment(Element.ALIGN_JUSTIFIED);
        bioText.setSpacingAfter(8);
        bioCard.addElement(bioText);

        Paragraph closeQuote = new Paragraph("\"",
                new Font(Font.FontFamily.HELVETICA, 24, Font.BOLD, INDIGO_PRIMARY));
        closeQuote.setAlignment(Element.ALIGN_RIGHT);
        bioCard.addElement(closeQuote);

        bioContainer.addCell(bioCard);
        document.add(bioContainer);
    }

    private void addEducationSummary(Document document, Profile profile) throws DocumentException {
        try {
            EducationSummaryDto educationSummary = educationService
                    .getEducationSummaryByUserId(profile.getUser().getId());

            SchoolDto sscResult = educationSummary.getSscResult();
            SchoolDto hscResult = educationSummary.getHscResult();
            var universityDegreeSummaries = educationSummary.getUniversityDegreeSummaries();

            boolean hasEducation = sscResult != null || hscResult != null ||
                    (universityDegreeSummaries != null && !universityDegreeSummaries.isEmpty());

            if (!hasEducation)
                return;

            // Section header with modern styling and emoji
            Paragraph eduHeader = new Paragraph("🎓 Education Summary", SECTION_HEADER_FONT);
            eduHeader.setSpacingBefore(20f);
            eduHeader.setSpacingAfter(15f);
            document.add(eduHeader);

            // Count available education data for dynamic layout
            int sscCount = (sscResult != null) ? 1 : 0;
            int hscCount = (hscResult != null) ? 1 : 0;
            int universityCount = (universityDegreeSummaries != null) ? universityDegreeSummaries.size() : 0;
            
            if (sscCount + hscCount + universityCount == 0)
                return;

            // Create a flexible table that can handle multiple universities
            // Use 3 columns per row, but create multiple rows if needed
            int columnsPerRow = 3;
            int totalItems = sscCount + hscCount + universityCount;
            int numberOfRows = (int) Math.ceil((double) totalItems / columnsPerRow);

            // Add items in order
            List<PdfPCell> educationCells = new ArrayList<>();
            
            // Add SSC result
            if (sscResult != null) {
                PdfPCell sscCell = createModernEducationCell("SSC", sscResult.getResult(), TEAL_PRIMARY);
                educationCells.add(sscCell);
            }

            // Add HSC result
            if (hscResult != null) {
                PdfPCell hscCell = createModernEducationCell("HSC", hscResult.getResult(), INDIGO_PRIMARY);
                educationCells.add(hscCell);
            }

            // Add ALL University degree summaries (with calculated CGPA)
            if (universityDegreeSummaries != null && !universityDegreeSummaries.isEmpty()) {
                for (var degreeSummary : universityDegreeSummaries) {
                    String universityText = degreeSummary.getUniversityName() + "\n" +
                            degreeSummary.getDegreeName() + "\n" +
                            "CGPA: " + degreeSummary.getFormattedCgpa() + "\n" +
                            degreeSummary.getCompletionStatus();
                    PdfPCell uniCell = createModernEducationCell("University", universityText,
                            new BaseColor(245, 158, 11)); // amber-500
                    educationCells.add(uniCell);
                }
            }

            // Create tables row by row to accommodate all universities
            for (int row = 0; row < numberOfRows; row++) {
                int startIndex = row * columnsPerRow;
                int endIndex = Math.min(startIndex + columnsPerRow, educationCells.size());
                int cellsInThisRow = endIndex - startIndex;
                
                PdfPTable eduRowTable = new PdfPTable(cellsInThisRow);
                eduRowTable.setWidthPercentage(100);
                eduRowTable.setSpacingAfter(15f);
                if (row == 0) {
                    eduRowTable.setSpacingBefore(5f);
                }
                
                // Add cells for this row
                for (int i = startIndex; i < endIndex; i++) {
                    eduRowTable.addCell(educationCells.get(i));
                }
                
                document.add(eduRowTable);
            }
        } catch (Exception e) {
            // If education service fails, silently skip
            System.err.println("Failed to load education data: " + e.getMessage());
        }
    }

    private PdfPCell createModernEducationCell(String level, String result, BaseColor accentColor) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(0);

        // Create inner table for modern card layout
        PdfPTable cardTable = new PdfPTable(1);
        cardTable.setWidthPercentage(100);

        // Card container with rounded border effect
        PdfPCell cardCell = new PdfPCell();
        cardCell.setBorder(Rectangle.BOX);
        cardCell.setBorderColor(accentColor);
        cardCell.setBorderWidth(2f);
        cardCell.setPadding(15);
        cardCell.setBackgroundColor(new BaseColor(249, 250, 251)); // gray-50

        // Level header with accent color background
        PdfPTable headerTable = new PdfPTable(1);
        headerTable.setWidthPercentage(100);

        PdfPCell headerCell = new PdfPCell();
        headerCell.setBorder(Rectangle.NO_BORDER);
        headerCell.setBackgroundColor(accentColor);
        headerCell.setPadding(8);

        Paragraph levelPara = new Paragraph(level,
                new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD, BaseColor.WHITE));
        levelPara.setAlignment(Element.ALIGN_CENTER);
        headerCell.addElement(levelPara);

        headerTable.addCell(headerCell);
        cardCell.addElement(headerTable);

        // Add some spacing
        cardCell.addElement(new Paragraph(" ", SMALL_FONT));

        // Result content
        Paragraph resultPara = new Paragraph(result,
                new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL, SLATE_DARK));
        resultPara.setAlignment(Element.ALIGN_CENTER);
        resultPara.setSpacingAfter(5);
        cardCell.addElement(resultPara);

        cardTable.addCell(cardCell);
        cell.addElement(cardTable);

        return cell;
    }

    private void addProfessionalExperience(Document document, Profile profile) throws DocumentException {
        if (profile.getWorks() == null || profile.getWorks().isEmpty()) {
            return;
        }

        // Section header with modern styling
        Paragraph expHeader = new Paragraph("💼 Professional Experience", SECTION_HEADER_FONT);
        expHeader.setSpacingBefore(20f);
        expHeader.setSpacingAfter(12f);
        document.add(expHeader);

        for (com.example.postfolio.profile.entity.Work work : profile.getWorks()) {
            // Work entry with modern card design
            PdfPTable workContainer = new PdfPTable(1);
            workContainer.setWidthPercentage(100);
            workContainer.setSpacingAfter(15f);

            PdfPCell workCard = new PdfPCell();
            workCard.setBorder(Rectangle.BOX);
            workCard.setBorderColor(new BaseColor(99, 102, 241)); // indigo-500
            workCard.setBorderWidth(2);
            workCard.setPadding(15);
            workCard.setBackgroundColor(BaseColor.WHITE);

            // Position and company with enhanced styling
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            try {
                headerTable.setWidths(new float[] { 0.7f, 0.3f });
            } catch (DocumentException e) {
                // Use default widths
            }

            // Left: Position and company
            PdfPCell positionCell = new PdfPCell();
            positionCell.setBorder(Rectangle.NO_BORDER);
            positionCell.setPadding(0);

            Paragraph positionPara = new Paragraph();
            positionPara.add(new Chunk(work.getPosition(),
                    new Font(Font.FontFamily.HELVETICA, 14, Font.BOLD, SLATE_DARK)));
            positionPara.add(new Chunk(" at ", NORMAL_FONT));
            positionPara.add(new Chunk(work.getCompanyName(),
                    new Font(Font.FontFamily.HELVETICA, 14, Font.BOLD, INDIGO_PRIMARY)));
            positionPara.setSpacingAfter(5);
            positionCell.addElement(positionPara);

            // Right: Date range
            PdfPCell dateCell = new PdfPCell();
            dateCell.setBorder(Rectangle.NO_BORDER);
            dateCell.setPadding(0);

            String dateRange = work.getDisplayDateRange();
            if (work.getIsCurrent()) {
                dateRange += " (Current)";
            }
            Paragraph datePara = new Paragraph(dateRange,
                    new Font(Font.FontFamily.HELVETICA, 10, Font.ITALIC, SLATE_MEDIUM));
            datePara.setAlignment(Element.ALIGN_RIGHT);
            dateCell.addElement(datePara);

            headerTable.addCell(positionCell);
            headerTable.addCell(dateCell);
            workCard.addElement(headerTable);

            // Add separator line
            PdfPTable separatorTable = new PdfPTable(1);
            separatorTable.setWidthPercentage(100);
            separatorTable.setSpacingBefore(5);
            separatorTable.setSpacingAfter(8);

            PdfPCell separatorCell = new PdfPCell();
            separatorCell.setBorder(Rectangle.NO_BORDER);
            separatorCell.setBorderWidthBottom(1);
            separatorCell.setBorderColorBottom(INDIGO_PRIMARY);
            separatorCell.setFixedHeight(5);

            separatorTable.addCell(separatorCell);
            workCard.addElement(separatorTable);

            workContainer.addCell(workCard);
            document.add(workContainer);
        }
    }

    private void addPostSectionEnhanced(Document document, String sectionName, List<Post> posts)
            throws DocumentException {
        if (posts.isEmpty())
            return;

        // Get appropriate emoji for section
        String emoji = getSectionEmoji(sectionName);

        // Section header with modern styling
        Paragraph sectionHeader = new Paragraph(emoji + " " + sectionName, SECTION_HEADER_FONT);
        sectionHeader.setSpacingBefore(20f);
        sectionHeader.setSpacingAfter(12f);
        document.add(sectionHeader);

        for (Post post : posts) {
            if (post.getCvHeading() != null && !post.getCvHeading().trim().isEmpty()) {
                // Post entry with modern card design
                PdfPTable postContainer = new PdfPTable(1);
                postContainer.setWidthPercentage(100);
                postContainer.setSpacingAfter(12f);

                PdfPCell postCard = new PdfPCell();
                postCard.setBorder(Rectangle.BOX);
                postCard.setBorderColor(getSectionAccentColor(sectionName));
                postCard.setBorderWidth(2);
                postCard.setPadding(15);
                postCard.setBackgroundColor(getSectionBackgroundColor(sectionName));

                // Add bullet point for visual hierarchy
                Paragraph bulletPoint = new Paragraph("• " + post.getCvHeading(),
                        new Font(Font.FontFamily.HELVETICA, 11, Font.NORMAL, SLATE_DARK));
                bulletPoint.setAlignment(Element.ALIGN_JUSTIFIED);
                bulletPoint.setIndentationLeft(10);
                postCard.addElement(bulletPoint);

                postContainer.addCell(postCard);
                document.add(postContainer);
            }
        }
    }

    private String getSectionEmoji(String sectionName) {
        switch (sectionName.toLowerCase()) {
            case "projects":
                return "🚀";
            case "experience":
                return "💼";
            case "achievements":
                return "🏆";
            default:
                return "📋";
        }
    }

    private BaseColor getSectionAccentColor(String sectionName) {
        switch (sectionName.toLowerCase()) {
            case "projects":
                return new BaseColor(34, 197, 94); // green-500
            case "experience":
                return INDIGO_PRIMARY;
            case "achievements":
                return new BaseColor(245, 158, 11); // amber-500
            default:
                return TEAL_PRIMARY;
        }
    }

    private BaseColor getSectionBackgroundColor(String sectionName) {
        switch (sectionName.toLowerCase()) {
            case "projects":
                return new BaseColor(240, 253, 244); // green-50
            case "experience":
                return new BaseColor(238, 242, 255); // indigo-50
            case "achievements":
                return new BaseColor(255, 251, 235); // amber-50
            default:
                return new BaseColor(240, 253, 250); // teal-50
        }
    }

    private void addSkillsSection(Document document, List<Post> posts) throws DocumentException {
        Set<String> skills = posts.stream()
                .filter(post -> post.getTags() != null)
                .flatMap(post -> post.getTags().stream())
                .collect(Collectors.toSet());

        if (skills.isEmpty())
            return;

        // Section header with modern styling
        Paragraph skillsHeader = new Paragraph("⚡ Skills & Technologies", SECTION_HEADER_FONT);
        skillsHeader.setSpacingBefore(20f);
        skillsHeader.setSpacingAfter(12f);
        document.add(skillsHeader);

        // Skills container with modern card design
        PdfPTable skillsContainer = new PdfPTable(1);
        skillsContainer.setWidthPercentage(100);
        skillsContainer.setSpacingAfter(20f);

        PdfPCell skillsCard = new PdfPCell();
        skillsCard.setBorder(Rectangle.BOX);
        skillsCard.setBorderColor(TEAL_LIGHT);
        skillsCard.setBorderWidth(2);
        skillsCard.setBackgroundColor(new BaseColor(240, 253, 250)); // teal-50
        skillsCard.setPadding(15);

        // Create modern skill tags layout
        PdfPTable skillsGrid = new PdfPTable(4); // 4 columns for better tag distribution
        skillsGrid.setWidthPercentage(100);

        List<String> skillsList = new ArrayList<>(skills);
        for (String skill : skillsList) {
            PdfPCell skillTag = createModernSkillTag(skill);
            skillsGrid.addCell(skillTag);
        }

        // Fill remaining cells if needed
        int remainingCells = 4 - (skillsList.size() % 4);
        if (remainingCells < 4) {
            for (int i = 0; i < remainingCells; i++) {
                PdfPCell emptyCell = new PdfPCell();
                emptyCell.setBorder(Rectangle.NO_BORDER);
                skillsGrid.addCell(emptyCell);
            }
        }

        skillsCard.addElement(skillsGrid);
        skillsContainer.addCell(skillsCard);
        document.add(skillsContainer);
    }

    private PdfPCell createModernSkillTag(String skill) {
        PdfPCell tagCell = new PdfPCell();
        tagCell.setBorder(Rectangle.NO_BORDER);
        tagCell.setPadding(4);

        // Create tag with rounded border effect
        PdfPTable tagTable = new PdfPTable(1);
        tagTable.setWidthPercentage(100);

        PdfPCell tag = new PdfPCell();
        tag.setBorder(Rectangle.BOX);
        tag.setBorderColor(TEAL_PRIMARY);
        tag.setBorderWidth(1);
        tag.setBackgroundColor(new BaseColor(204, 251, 241)); // teal-100
        tag.setPadding(6);

        Paragraph skillText = new Paragraph(skill,
                new Font(Font.FontFamily.HELVETICA, 9, Font.BOLD, TEAL_PRIMARY));
        skillText.setAlignment(Element.ALIGN_CENTER);
        tag.addElement(skillText);

        tagTable.addCell(tag);
        tagCell.addElement(tagTable);

        return tagCell;
    }

    private void addModernSeparatorLine(Document document) throws DocumentException {
        // Create a modern separator with multiple lines for gradient effect
        PdfPTable separator = new PdfPTable(1);
        separator.setWidthPercentage(100);
        separator.setSpacingAfter(15f);
        separator.setSpacingBefore(5f);

        // Main line with primary color
        PdfPCell mainLineCell = new PdfPCell();
        mainLineCell.setBorder(Rectangle.NO_BORDER);
        mainLineCell.setBorderWidthBottom(3);
        mainLineCell.setBorderColorBottom(TEAL_PRIMARY);
        mainLineCell.setFixedHeight(8);

        separator.addCell(mainLineCell);

        // Accent line with lighter color
        PdfPCell accentLineCell = new PdfPCell();
        accentLineCell.setBorder(Rectangle.NO_BORDER);
        accentLineCell.setBorderWidthBottom(1);
        accentLineCell.setBorderColorBottom(TEAL_LIGHT);
        accentLineCell.setFixedHeight(3);

        separator.addCell(accentLineCell);

        document.add(separator);
    }

    // Custom page event class for modern styling
    private static class CvPageEvent extends PdfPageEventHelper {
        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            PdfContentByte cb = writer.getDirectContent();

            // Add modern page border with gradient effect
            cb.saveState();

            // Outer border in primary color
            cb.setColorStroke(new BaseColor(20, 184, 166)); // teal-500
            cb.setLineWidth(2f);
            cb.rectangle(document.leftMargin() - 15, document.bottomMargin() - 15,
                    document.getPageSize().getWidth() - document.leftMargin() - document.rightMargin() + 30,
                    document.getPageSize().getHeight() - document.topMargin() - document.bottomMargin() + 30);
            cb.stroke();

            // Inner border for depth effect
            cb.setColorStroke(new BaseColor(153, 246, 228)); // teal-200
            cb.setLineWidth(1f);
            cb.rectangle(document.leftMargin() - 10, document.bottomMargin() - 10,
                    document.getPageSize().getWidth() - document.leftMargin() - document.rightMargin() + 20,
                    document.getPageSize().getHeight() - document.topMargin() - document.bottomMargin() + 20);
            cb.stroke();

            cb.restoreState();

            // Add modern page number with background
            PdfPTable pageNumberTable = new PdfPTable(1);
            pageNumberTable.setTotalWidth(60);

            PdfPCell pageNumberCell = new PdfPCell();
            pageNumberCell.setBorder(Rectangle.BOX);
            pageNumberCell.setBorderColor(new BaseColor(20, 184, 166)); // teal-500
            pageNumberCell.setBackgroundColor(new BaseColor(240, 253, 250)); // teal-50
            pageNumberCell.setPadding(4);

            Paragraph pageNum = new Paragraph(String.valueOf(writer.getPageNumber()),
                    new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, new BaseColor(20, 184, 166)));
            pageNum.setAlignment(Element.ALIGN_CENTER);
            pageNumberCell.addElement(pageNum);

            pageNumberTable.addCell(pageNumberCell);
            pageNumberTable.writeSelectedRows(0, -1,
                    document.getPageSize().getWidth() / 2 - 30,
                    document.bottomMargin() - 5, cb);
        }
    }
}
