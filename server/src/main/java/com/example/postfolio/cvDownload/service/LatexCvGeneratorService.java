package com.example.postfolio.cvDownload.service;

import com.example.postfolio.profile.entity.Profile;
import com.example.postfolio.post.entity.Post;
import com.example.postfolio.post.models.PostType;
import com.example.postfolio.profile.dto.EducationSummaryDto;
import com.example.postfolio.profile.dto.SchoolDto;
import com.example.postfolio.profile.dto.UniversityDegreeSummaryDto;
import com.example.postfolio.profile.service.EducationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LatexCvGeneratorService {

    private final EducationService educationService;

    public byte[] generateCv(Profile profile, List<Post> posts) throws Exception {
        // Create temporary directory for LaTeX compilation
        Path tempDir = Files.createTempDirectory("cv_generation");
        Path texFile = tempDir.resolve("cv.tex");
        Path pdfFile = tempDir.resolve("cv.pdf");

        try {
            // Generate LaTeX content
            String latexContent = generateLatexContent(profile, posts);
            
            // Write LaTeX content to file
            Files.write(texFile, latexContent.getBytes("UTF-8"));
            
            // Compile LaTeX to PDF
            compileToPdf(tempDir, texFile, pdfFile);
            
            // Read the generated PDF
            return Files.readAllBytes(pdfFile);
            
        } finally {
            // Clean up temporary files
            cleanupTempFiles(tempDir);
        }
    }

    private String generateLatexContent(Profile profile, List<Post> posts) {
        StringBuilder latex = new StringBuilder();
        
        // Document class and packages
        latex.append("\\documentclass[letterpaper,11pt]{article}\n");
        latex.append("\\usepackage{latexsym}\n");
        latex.append("\\usepackage[empty]{fullpage}\n");
        latex.append("\\usepackage{titlesec}\n");
        latex.append("\\usepackage{marvosym}\n");
        latex.append("\\usepackage[usenames,dvipsnames]{color}\n");
        latex.append("\\usepackage{verbatim}\n");
        latex.append("\\usepackage{enumitem}\n");
        latex.append("\\usepackage[hidelinks]{hyperref}\n");
        latex.append("\\usepackage{fancyhdr}\n");
        latex.append("\\usepackage[english]{babel}\n");
        latex.append("\\usepackage{tabularx}\n");
        latex.append("\\usepackage{fontawesome5}\n");
        latex.append("\\usepackage[utf8]{inputenc}\n");
        latex.append("\\usepackage[T1]{fontenc}\n");
        latex.append("\\usepackage{lmodern}\n");
        latex.append("\\usepackage{geometry}\n");
        latex.append("\\geometry{margin=0.7in}\n\n");

        // Custom commands and styling
        latex.append("\\pagestyle{fancy}\n");
        latex.append("\\fancyhf{}\n");
        latex.append("\\fancyfoot{}\n");
        latex.append("\\renewcommand{\\headrulewidth}{0pt}\n");
        latex.append("\\renewcommand{\\footrulewidth}{0pt}\n\n");

        latex.append("\\addtolength{\\oddsidemargin}{-0.5in}\n");
        latex.append("\\addtolength{\\evensidemargin}{-0.5in}\n");
        latex.append("\\addtolength{\\textwidth}{1in}\n");
        latex.append("\\addtolength{\\topmargin}{-.5in}\n");
        latex.append("\\addtolength{\\textheight}{1.0in}\n\n");

        latex.append("\\urlstyle{same}\n\n");

        latex.append("\\raggedbottom\n");
        latex.append("\\raggedright\n");
        latex.append("\\setlength{\\tabcolsep}{0in}\n\n");

        // Section formatting
        latex.append("\\titleformat{\\section}{\n");
        latex.append("  \\vspace{-4pt}\\scshape\\raggedright\\large\n");
        latex.append("}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]\n\n");

        // Custom commands
        latex.append("\\newcommand{\\resumeItem}[1]{\n");
        latex.append("  \\item\\small{\n");
        latex.append("    {#1 \\vspace{-2pt}}\n");
        latex.append("  }\n");
        latex.append("}\n\n");

        latex.append("\\newcommand{\\resumeSubheading}[4]{\n");
        latex.append("  \\vspace{-2pt}\\item\n");
        latex.append("    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}\n");
        latex.append("      \\textbf{#1} & #2 \\\\\n");
        latex.append("      \\textit{\\small#3} & \\textit{\\small #4} \\\\\n");
        latex.append("    \\end{tabular*}\\vspace{-7pt}\n");
        latex.append("}\n\n");

        latex.append("\\newcommand{\\resumeEducationHeading}[6]{\n");
        latex.append("  \\vspace{-2pt}\\item\n");
        latex.append("    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}\n");
        latex.append("      \\textbf{#1} & #2 \\\\\n");
        latex.append("      \\textit{\\small#3} & \\textit{\\small #4} \\\\\n");
        latex.append("      \\textit{\\small#5} & \\textit{\\small #6} \\\\\n");
        latex.append("    \\end{tabular*}\\vspace{-7pt}\n");
        latex.append("}\n\n");

        latex.append("\\newcommand{\\resumeSubItem}[1]{\\resumeItem{#1}\\vspace{-4pt}}\n\n");

        latex.append("\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}\n\n");

        latex.append("\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}\n");
        latex.append("\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}\n");
        latex.append("\\newcommand{\\resumeItemListStart}{\\begin{itemize}}\n");
        latex.append("\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}\n\n");

        // Begin document
        latex.append("\\begin{document}\n\n");

        // Header section
        generateHeader(latex, profile);

        // Contact section
        generateContact(latex, profile);

        // Professional Summary
        if (profile.getBio() != null && !profile.getBio().isEmpty()) {
            generateSummary(latex, profile);
        }

        // Education section
        generateEducation(latex, profile);

        // Professional Experience
        generateExperience(latex, profile);

        // Projects
        List<Post> projects = posts.stream()
                .filter(post -> post.getType() == PostType.PROJECT)
                .collect(Collectors.toList());
        if (!projects.isEmpty()) {
            generateProjects(latex, projects);
        }

        // Experience from posts
        List<Post> experiencePosts = posts.stream()
                .filter(post -> post.getType() == PostType.EXPERIENCE)
                .collect(Collectors.toList());
        if (!experiencePosts.isEmpty()) {
            generateExperiencePosts(latex, experiencePosts);
        }

        // Achievements
        List<Post> achievements = posts.stream()
                .filter(post -> post.getType() == PostType.ACHIEVEMENT)
                .collect(Collectors.toList());
        if (!achievements.isEmpty()) {
            generateAchievements(latex, achievements);
        }

        // Skills
        generateSkills(latex, posts);

        latex.append("\\end{document}\n");

        return latex.toString();
    }

    private void generateHeader(StringBuilder latex, Profile profile) {
        String name = profile.getUser().getName() != null ? 
            escapeLatexSpecialChars(profile.getUser().getName()) : 
            "Professional Resume";
        
        latex.append("\\begin{center}\n");
        latex.append("    \\textbf{\\Huge \\scshape ").append(name).append("} \\\\ \\vspace{1pt}\n");
        
        if (profile.getPositionOrInstitue() != null && !profile.getPositionOrInstitue().isEmpty()) {
            latex.append("    \\Large \\textit{").append(escapeLatexSpecialChars(profile.getPositionOrInstitue())).append("} \\\\ \\vspace{5pt}\n");
        }
        
        latex.append("\\end{center}\n\n");
    }

    private void generateContact(StringBuilder latex, Profile profile) {
        latex.append("\\begin{center}\n");
        latex.append("    \\small ");
        
        List<String> contactInfo = new ArrayList<>();
        
        if (profile.getUser().getEmail() != null) {
            contactInfo.add("\\faEnvelope\\ " + escapeLatexSpecialChars(profile.getUser().getEmail()));
        }
        
        if (profile.getPhoneNumber() != null) {
            contactInfo.add("\\faPhone\\ " + escapeLatexSpecialChars(profile.getPhoneNumber()));
        }
        
        if (profile.getAddress() != null) {
            contactInfo.add("\\faMapMarker\\ " + escapeLatexSpecialChars(profile.getAddress()));
        }
        
        // LinkedIn and GitHub URLs are not available in Profile entity
        // These would need to be added to Profile entity if needed
        
        latex.append(String.join(" $|$ ", contactInfo));
        latex.append("\n\\end{center}\n\n");
    }

    private void generateSummary(StringBuilder latex, Profile profile) {
        latex.append("\\section{Professional Summary}\n");
        latex.append("\\begin{justify}\n");
        latex.append(escapeLatexSpecialChars(profile.getBio()));
        latex.append("\n\\end{justify}\n\n");
    }

    private void generateEducation(StringBuilder latex, Profile profile) {
        try {
            EducationSummaryDto educationSummary = educationService
                    .getEducationSummaryByUserId(profile.getUser().getId());
            
            SchoolDto sscResult = educationSummary.getSscResult();
            SchoolDto hscResult = educationSummary.getHscResult();
            var universityDegreeSummaries = educationSummary.getUniversityDegreeSummaries();
            
            boolean hasEducation = sscResult != null || hscResult != null ||
                    (universityDegreeSummaries != null && !universityDegreeSummaries.isEmpty());
            
            if (!hasEducation) return;
            
            latex.append("\\section{Education}\n");
            latex.append("\\resumeSubHeadingListStart\n");
            
            // University degrees (multiple entries now properly handled)
            if (universityDegreeSummaries != null && !universityDegreeSummaries.isEmpty()) {
                for (UniversityDegreeSummaryDto degreeSummary : universityDegreeSummaries) {
                    latex.append("\\resumeEducationHeading\n");
                    latex.append("    {").append(escapeLatexSpecialChars(degreeSummary.getUniversityName())).append("}\n");
                    latex.append("    {").append(degreeSummary.getCompletionStatus()).append("}\n");
                    latex.append("    {").append(escapeLatexSpecialChars(degreeSummary.getDegreeName())).append("}\n");
                    latex.append("    {CGPA: ").append(degreeSummary.getFormattedCgpa()).append("}\n");
                    latex.append("    {").append(degreeSummary.getEndDate() != null ? 
                        degreeSummary.getEndDate().getYear() + "" : "In Progress").append("}\n");
                    latex.append("    {}\n");
                }
            }
            
            // HSC
            if (hscResult != null) {
                latex.append("\\resumeSubheading\n");
                latex.append("    {").append(escapeLatexSpecialChars(hscResult.getSchoolName())).append("}\n");
                latex.append("    {").append(hscResult.getAcademicYear() != null ? 
                    hscResult.getAcademicYear().toString() : "").append("}\n");
                latex.append("    {Higher Secondary Certificate (HSC)}\n");
                latex.append("    {Result: ").append(escapeLatexSpecialChars(hscResult.getResult())).append("}\n");
            }
            
            // SSC
            if (sscResult != null) {
                latex.append("\\resumeSubheading\n");
                latex.append("    {").append(escapeLatexSpecialChars(sscResult.getSchoolName())).append("}\n");
                latex.append("    {").append(sscResult.getAcademicYear() != null ? 
                    sscResult.getAcademicYear().toString() : "").append("}\n");
                latex.append("    {Secondary School Certificate (SSC)}\n");
                latex.append("    {Result: ").append(escapeLatexSpecialChars(sscResult.getResult())).append("}\n");
            }
            
            latex.append("\\resumeSubHeadingListEnd\n\n");
            
        } catch (Exception e) {
            System.err.println("Failed to load education data: " + e.getMessage());
        }
    }

    private void generateExperience(StringBuilder latex, Profile profile) {
        if (profile.getWorks() == null || profile.getWorks().isEmpty()) {
            return;
        }
        
        latex.append("\\section{Professional Experience}\n");
        latex.append("\\resumeSubHeadingListStart\n");
        
        for (com.example.postfolio.profile.entity.Work work : profile.getWorks()) {
            latex.append("\\resumeSubheading\n");
            latex.append("    {").append(escapeLatexSpecialChars(work.getPosition())).append("}\n");
            latex.append("    {").append(work.getDisplayDateRange());
            if (work.getIsCurrent()) {
                latex.append(" - Present");
            }
            latex.append("}\n");
            latex.append("    {").append(escapeLatexSpecialChars(work.getCompanyName())).append("}\n");
            latex.append("    {}\n"); // Location field not available in Work entity
            
            // Description field not available in Work entity - removed
        }
        
        latex.append("\\resumeSubHeadingListEnd\n\n");
    }

    private void generateProjects(StringBuilder latex, List<Post> projects) {
        latex.append("\\section{Projects}\n");
        latex.append("\\resumeSubHeadingListStart\n");
        
        for (Post project : projects) {
            String title = project.getCvHeading() != null ? project.getCvHeading() : 
                (project.getContent().length() > 50 ? project.getContent().substring(0, 50) + "..." : project.getContent());
            latex.append("\\resumeSubheading\n");
            latex.append("    {").append(escapeLatexSpecialChars(title)).append("}\n");
            latex.append("    {").append(project.getCreatedAt().getYear()).append("}\n");
            latex.append("    {Personal Project}\n");
            latex.append("    {");
            if (project.getTags() != null && !project.getTags().isEmpty()) {
                latex.append("Technologies: ").append(
                    project.getTags().stream()
                        .map(this::escapeLatexSpecialChars)
                        .collect(Collectors.joining(", "))
                );
            }
            latex.append("}\n");
            
            if (project.getContent() != null && !project.getContent().isEmpty()) {
                latex.append("    \\resumeItemListStart\n");
                latex.append("        \\resumeItem{").append(escapeLatexSpecialChars(project.getContent())).append("}\n");
                latex.append("    \\resumeItemListEnd\n");
            }
        }
        
        latex.append("\\resumeSubHeadingListEnd\n\n");
    }

    private void generateExperiencePosts(StringBuilder latex, List<Post> experiencePosts) {
        if (experiencePosts.isEmpty()) return;
        
        latex.append("\\section{Additional Experience}\n");
        latex.append("\\resumeSubHeadingListStart\n");
        
        for (Post exp : experiencePosts) {
            String title = exp.getCvHeading() != null ? exp.getCvHeading() : 
                (exp.getContent().length() > 50 ? exp.getContent().substring(0, 50) + "..." : exp.getContent());
            latex.append("\\resumeSubheading\n");
            latex.append("    {").append(escapeLatexSpecialChars(title)).append("}\n");
            latex.append("    {").append(exp.getCreatedAt().getYear()).append("}\n");
            latex.append("    {Experience}\n");
            latex.append("    {}\n");
            
            if (exp.getContent() != null && !exp.getContent().isEmpty()) {
                latex.append("    \\resumeItemListStart\n");
                latex.append("        \\resumeItem{").append(escapeLatexSpecialChars(exp.getContent())).append("}\n");
                latex.append("    \\resumeItemListEnd\n");
            }
        }
        
        latex.append("\\resumeSubHeadingListEnd\n\n");
    }

    private void generateAchievements(StringBuilder latex, List<Post> achievements) {
        latex.append("\\section{Achievements \\& Awards}\n");
        latex.append("\\resumeSubHeadingListStart\n");
        
        for (Post achievement : achievements) {
            String title = achievement.getCvHeading() != null ? achievement.getCvHeading() : 
                (achievement.getContent().length() > 50 ? achievement.getContent().substring(0, 50) + "..." : achievement.getContent());
            latex.append("\\resumeSubheading\n");
            latex.append("    {").append(escapeLatexSpecialChars(title)).append("}\n");
            latex.append("    {").append(achievement.getCreatedAt().getYear()).append("}\n");
            latex.append("    {Achievement}\n");
            latex.append("    {}\n");
            
            if (achievement.getContent() != null && !achievement.getContent().isEmpty()) {
                latex.append("    \\resumeItemListStart\n");
                latex.append("        \\resumeItem{").append(escapeLatexSpecialChars(achievement.getContent())).append("}\n");
                latex.append("    \\resumeItemListEnd\n");
            }
        }
        
        latex.append("\\resumeSubHeadingListEnd\n\n");
    }

    private void generateSkills(StringBuilder latex, List<Post> posts) {
        Set<String> skills = posts.stream()
                .filter(post -> post.getTags() != null)
                .flatMap(post -> post.getTags().stream())
                .collect(Collectors.toSet());
        
        if (skills.isEmpty()) return;
        
        latex.append("\\section{Technical Skills}\n");
        latex.append("\\begin{itemize}[leftmargin=0.15in, label={}]\n");
        latex.append("    \\small{\\item{\n");
        latex.append("     \\textbf{Technologies}{: ");
        latex.append(skills.stream()
                .map(this::escapeLatexSpecialChars)
                .collect(Collectors.joining(", ")));
        latex.append("} \\\\\n");
        latex.append("    }}\n");
        latex.append("\\end{itemize}\n\n");
    }

    private String escapeLatexSpecialChars(String text) {
        if (text == null) return "";
        return text.replace("\\", "\\textbackslash{}")
                   .replace("{", "\\{")
                   .replace("}", "\\}")
                   .replace("$", "\\$")
                   .replace("&", "\\&")
                   .replace("%", "\\%")
                   .replace("#", "\\#")
                   .replace("^", "\\textasciicircum{}")
                   .replace("_", "\\_")
                   .replace("~", "\\textasciitilde{}")
                   .replace("\"", "\\textquotedbl{}")
                   .replace("'", "\\textquotesingle{}");
    }

    private void compileToPdf(Path tempDir, Path texFile, Path pdfFile) throws Exception {
        // Build the pdflatex command
        ProcessBuilder processBuilder = new ProcessBuilder(
            "pdflatex", 
            "-interaction=nonstopmode",
            "-output-directory=" + tempDir.toString(),
            texFile.getFileName().toString()
        );
        
        processBuilder.directory(tempDir.toFile());
        processBuilder.redirectErrorStream(true);
        
        // Run pdflatex twice to ensure proper cross-references
        for (int i = 0; i < 2; i++) {
            Process process = processBuilder.start();
            
            // Capture output for debugging
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    System.out.println(line); // For debugging
                }
            }
            
            int exitCode = process.waitFor();
            if (exitCode != 0) {
                throw new RuntimeException("LaTeX compilation failed with exit code: " + exitCode);
            }
        }
        
        if (!Files.exists(pdfFile)) {
            throw new RuntimeException("PDF file was not generated successfully");
        }
    }

    private void cleanupTempFiles(Path tempDir) {
        try {
            Files.walk(tempDir)
                .sorted(Comparator.reverseOrder())
                .map(Path::toFile)
                .forEach(File::delete);
        } catch (IOException e) {
            System.err.println("Failed to cleanup temporary files: " + e.getMessage());
        }
    }
}
