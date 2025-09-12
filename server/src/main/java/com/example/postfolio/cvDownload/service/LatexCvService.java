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
public class LatexCvService {

    private final EducationService educationService;

    /**
     * Generate LaTeX source code for the CV
     */
    public String generateLatexSource(Profile profile, List<Post> posts) {
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
        latex.append("\\usepackage[utf8]{inputenc}\n");
        latex.append("\\usepackage[T1]{fontenc}\n");
        latex.append("\\usepackage{lmodern}\n");
        latex.append("\\usepackage{geometry}\n");
        latex.append("\\usepackage{graphicx}\n");
        latex.append("\\usepackage{tikz}\n");
        latex.append("\\geometry{margin=0.7in}\n\n");

        // Custom styling
        addCustomStyling(latex);

        // Begin document
        latex.append("\\begin{document}\n\n");

        // Two-column layout using minipages: left sidebar (narrow) + right content
        // (existing sections)
        latex.append("\\noindent\n");
        latex.append("\\begin{minipage}[t]{0.27\\textwidth}\n");
        generateSidebar(latex, profile, null); // Image path will be injected in overloaded method when available
        latex.append("\\end{minipage}\\hfill\n");
        latex.append("\\begin{minipage}[t]{0.70\\textwidth}\n");

       

        // Professional Summary (right column)
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

        latex.append("\\end{minipage}\n\n");

        latex.append("\\end{document}\n");

        return latex.toString();
    }

    /**
     * Generate PDF from LaTeX source if LaTeX is available, otherwise return null
     */
    public byte[] generatePdfFromLatex(Profile profile, List<Post> posts) {
        try {
            // Check if pdflatex is available
            System.out.println("Checking if pdflatex is available...");
            ProcessBuilder testBuilder = new ProcessBuilder("pdflatex", "--version");
            Process testProcess = testBuilder.start();
            int exitCode = testProcess.waitFor();

            if (exitCode != 0) {
                System.err.println("pdflatex is not available on this system. Exit code: " + exitCode);
                return null;
            }

            System.out.println("pdflatex is available, proceeding with compilation...");

            // Create temporary directory for LaTeX compilation
            Path tempDir = Files.createTempDirectory("cv_generation");
            Path texFile = tempDir.resolve("cv.tex");
            Path pdfFile = tempDir.resolve("cv.pdf");

            System.out.println("Temporary directory created: " + tempDir.toString());

            try {
                // Generate LaTeX content
                // If there's a profile picture, decode and save to the temp directory so LaTeX
                // can include it
                String imageFileName = null;
                if (profile.getPictureBase64() != null && !profile.getPictureBase64().isEmpty()) {
                    try {
                        String b64 = profile.getPictureBase64();
                        String ext = "png";
                        int commaIdx = b64.indexOf(',');
                        if (b64.startsWith("data:image/")) {
                            int slashIdx = b64.indexOf('/');
                            int semiIdx = b64.indexOf(';');
                            if (slashIdx >= 0 && semiIdx > slashIdx) {
                                ext = b64.substring(slashIdx + 1, semiIdx);
                                if ("jpeg".equalsIgnoreCase(ext))
                                    ext = "jpg";
                            }
                            if (commaIdx > 0) {
                                b64 = b64.substring(commaIdx + 1);
                            }
                        }
                        byte[] imgBytes = Base64.getDecoder().decode(b64);
                        imageFileName = "profile_pic." + ext;
                        Files.write(tempDir.resolve(imageFileName), imgBytes);
                    } catch (Exception ex) {
                        System.err.println("Failed to decode/write profile image: " + ex.getMessage());
                        imageFileName = null;
                    }
                }

                String latexContent = generateLatexSourceWithImage(profile, posts, imageFileName);
                System.out.println("LaTeX content generated, length: " + latexContent.length());

                // Write LaTeX content to file
                Files.write(texFile, latexContent.getBytes("UTF-8"));
                System.out.println("LaTeX file written: " + texFile.toString());

                // Compile LaTeX to PDF
                compileToPdf(tempDir, texFile, pdfFile);
                System.out.println("LaTeX compilation completed");

                // Read the generated PDF
                byte[] pdfBytes = Files.readAllBytes(pdfFile);
                System.out.println("PDF file read, size: " + pdfBytes.length + " bytes");
                return pdfBytes;

            } finally {
                // Clean up temporary files
                cleanupTempFiles(tempDir);
                System.out.println("Temporary files cleaned up");
            }
        } catch (Exception e) {
            System.err.println("Error generating PDF: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    // Overloaded generator that can receive a relative path to an image placed
    // alongside the .tex file
    private String generateLatexSourceWithImage(Profile profile, List<Post> posts, String imageFileName) {
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
        latex.append("\\usepackage[utf8]{inputenc}\n");
        latex.append("\\usepackage[T1]{fontenc}\n");
        latex.append("\\usepackage{lmodern}\n");
        latex.append("\\usepackage{geometry}\n");
        latex.append("\\usepackage{graphicx}\n");
        latex.append("\\usepackage{tikz}\n");
        latex.append("\\geometry{margin=0.7in}\n\n");

        // Custom styling
        addCustomStyling(latex);

        // Helper command for round picture
        latex.append("% round profile picture helper\n");
        latex.append("\\newcommand{\\profilepic}[1]{%\n");
        latex.append("  \\begin{tikzpicture}\n");
        latex.append("    \\clip (0,0) circle (1.65cm);\n");
        latex.append("    \\node at (0,0) {\\includegraphics[width=3.3cm,height=3.3cm,keepaspectratio]{#1}};\n");
        latex.append("  \\end{tikzpicture}\n");
        latex.append("}\n\n");

        // Begin document
        latex.append("\\begin{document}\n\n");

        latex.append("\\noindent\n");
        latex.append("\\begin{minipage}[t]{0.27\\textwidth}\n");
        generateSidebar(latex, profile, imageFileName);
        latex.append("\\end{minipage}\\hfill\n");
        latex.append("\\begin{minipage}[t]{0.70\\textwidth}\n");

      

        // Professional Summary (right column)
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

        latex.append("\\end{minipage}\n\n");

        latex.append("\\end{document}\n");

        return latex.toString();
    }

    private void generateSidebar(StringBuilder latex, Profile profile, String imageFileName) {
        latex.append("% --- Left sidebar ---\n");
        latex.append("\\begin{center}\n");
        if (imageFileName != null) {
            latex.append("  \\profilepic{" + imageFileName + "}\\\n");
            latex.append("  \\vspace{8pt}\\\n");
        }
        latex.append("\\end{center}\n");

        latex.append("\\small\n");
        List<String> lines = new ArrayList<>();
        lines.add("\\textbf{Name:} " + escapeLatexSpecialChars(profile.getUser().getName()));
        if (profile.getPhoneNumber() != null && !profile.getPhoneNumber().isEmpty()) {
            lines.add("\\textbf{Mobile:} " + escapeLatexSpecialChars(profile.getPhoneNumber()));
        }
        if (profile.getUser() != null && profile.getUser().getEmail() != null
                && !profile.getUser().getEmail().isEmpty()) {
            lines.add("\\textbf{Email:} " + escapeLatexSpecialChars(profile.getUser().getEmail()));
        }
        if (profile.getAddress() != null && !profile.getAddress().isEmpty()) {
            lines.add("\\textbf{Location:} " + escapeLatexSpecialChars(profile.getAddress()));
        }
        for (int i = 0; i < lines.size(); i++) {
            latex.append(lines.get(i));
            latex.append("\\\\\n");
        }
        latex.append("\\vspace{10pt}\n\n");
    }

    private void addCustomStyling(StringBuilder latex) {
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
        latex.append("    \\end{tabular*}\\vspace{-12pt}\n");
        latex.append("}\n\n");

        latex.append("\\newcommand{\\resumeSubItem}[1]{\\resumeItem{#1}\\vspace{-4pt}}\n\n");

        latex.append("\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}\n\n");

        latex.append("\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}\n");
        latex.append("\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}\n");
        latex.append("\\newcommand{\\resumeItemListStart}{\\begin{itemize}}\n");
        latex.append("\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}\n\n");
    }

    @SuppressWarnings("unused")
    private void generateContact(StringBuilder latex, Profile profile) {
        latex.append("\\begin{center}\n");
        latex.append("    \\small ");

        List<String> contactInfo = new ArrayList<>();

        if (profile.getUser().getEmail() != null) {
            contactInfo.add("\\textbf{Email:} " + escapeLatexSpecialChars(profile.getUser().getEmail()));
        }

        if (profile.getPhoneNumber() != null) {
            contactInfo.add("\\textbf{Phone:} " + escapeLatexSpecialChars(profile.getPhoneNumber()));
        }

        if (profile.getAddress() != null) {
            contactInfo.add("\\textbf{Address:} " + escapeLatexSpecialChars(profile.getAddress()));
        }

        latex.append(String.join(" $|$ ", contactInfo));
        latex.append("\n\\end{center}\n\n");
    }

    private void generateSummary(StringBuilder latex, Profile profile) {
        latex.append("\\section{Professional Summary}\n");
        latex.append(escapeLatexSpecialChars(profile.getBio()));
        latex.append("\n\n");
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

            if (!hasEducation)
                return;

            latex.append("\\section{Education}\n");
            latex.append("\\resumeSubHeadingListStart\n");

            // University degrees (multiple entries properly handled)
            if (universityDegreeSummaries != null && !universityDegreeSummaries.isEmpty()) {
                for (UniversityDegreeSummaryDto degreeSummary : universityDegreeSummaries) {
                    latex.append("\\resumeEducationHeading\n");
                    latex.append("    {").append(escapeLatexSpecialChars(degreeSummary.getUniversityName()))
                            .append("}\n");
                    latex.append("    {}\n");
                    latex.append("    {").append(escapeLatexSpecialChars(degreeSummary.getDegreeName())).append("}\n");
                    latex.append("    {CGPA: ").append(degreeSummary.getFormattedCgpa()).append("}\n");
                    latex.append("    {}\n");
                    latex.append("    {}\n");
                }
            }

            // HSC
            if (hscResult != null) {
                latex.append("\\resumeSubheading\n");
                latex.append("    {").append(escapeLatexSpecialChars(hscResult.getSchoolName())).append("}\n");
                latex.append("    {}\n");
                latex.append("    {Higher Secondary Certificate (HSC)}\n");
                latex.append("    {Result: ").append(escapeLatexSpecialChars(hscResult.getResult())).append("}\n");
            }

            // SSC
            if (sscResult != null) {
                latex.append("\\resumeSubheading\n");
                latex.append("    {").append(escapeLatexSpecialChars(sscResult.getSchoolName())).append("}\n");
                latex.append("    {}\n");
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
            latex.append("}\n");
            latex.append("    {").append(escapeLatexSpecialChars(work.getCompanyName())).append("}\n");
            latex.append("    {}\n"); // Location field not available
        }

        latex.append("\\resumeSubHeadingListEnd\n\n");
    }

    private void generateProjects(StringBuilder latex, List<Post> projects) {
        latex.append("\\section{Projects}\n");
        latex.append("\\resumeSubHeadingListStart\n");

        for (Post project : projects) {
            String title = project.getCvHeading() != null ? project.getCvHeading()
                    : (project.getContent().length() > 50 ? project.getContent().substring(0, 50) + "..."
                            : project.getContent());
            latex.append("\\resumeSubheading\n");
            latex.append("    {").append(escapeLatexSpecialChars(title)).append("}\n");
            latex.append("    {").append(project.getCreatedAt().getYear()).append("}\n");
            latex.append("    {}\n");
            latex.append("    {}\n");
        }

        latex.append("\\resumeSubHeadingListEnd\n\n");
    }

    private void generateExperiencePosts(StringBuilder latex, List<Post> experiencePosts) {
        if (experiencePosts.isEmpty())
            return;

        latex.append("\\section{Additional Experience}\n");
        latex.append("\\resumeSubHeadingListStart\n");

        for (Post exp : experiencePosts) {
            String title = exp.getCvHeading() != null ? exp.getCvHeading()
                    : (exp.getContent().length() > 50 ? exp.getContent().substring(0, 50) + "..." : exp.getContent());
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
            String title = achievement.getCvHeading() != null ? achievement.getCvHeading()
                    : (achievement.getContent().length() > 50 ? achievement.getContent().substring(0, 50) + "..."
                            : achievement.getContent());
            latex.append("\\resumeSubheading\n");
            latex.append("    {").append(escapeLatexSpecialChars(title)).append("}\n");
            latex.append("    {").append(achievement.getCreatedAt().getYear()).append("}\n");
            latex.append("    {}\n");
            latex.append("    {}\n");
        }

        latex.append("\\resumeSubHeadingListEnd\n\n");
    }

    private void generateSkills(StringBuilder latex, List<Post> posts) {
        Set<String> skills = posts.stream()
                .filter(post -> post.getTags() != null)
                .flatMap(post -> post.getTags().stream())
                .collect(Collectors.toSet());

        if (skills.isEmpty())
            return;

        latex.append("\\section{Skills}\n");
        latex.append("\\begin{itemize}[leftmargin=0.15in, label={}]\n");
        latex.append("    \\small{\\item{\n");
        latex.append("     \\textbf{Skills}{: ");
        latex.append(skills.stream()
                .map(this::escapeLatexSpecialChars)
                .collect(Collectors.joining(", ")));
        latex.append("} \\\\\n");
        latex.append("    }}\n");
        latex.append("\\end{itemize}\n\n");
    }

    private String escapeLatexSpecialChars(String text) {
        if (text == null)
            return "";
        return text.replace("\\", "\\textbackslash{}")
                .replace("{", "\\{")
                .replace("}", "\\}")
                .replace("$", "\\$")
                .replace("&", "\\&")
                .replace("%", "\\%")
                .replace("#", "\\#")
                .replace("^", "\\textasciicircum{}")
                .replace("_", "\\_")
                .replace("~", "\\textasciitilde{}");
    }

    private void compileToPdf(Path tempDir, Path texFile, Path pdfFile) throws Exception {
        System.out.println("Starting LaTeX compilation...");

        ProcessBuilder processBuilder = new ProcessBuilder(
                "pdflatex",
                "-interaction=nonstopmode",
                "-output-directory=" + tempDir.toString(),
                texFile.getFileName().toString());

        processBuilder.directory(tempDir.toFile());
        processBuilder.redirectErrorStream(true);

        // Run pdflatex twice for proper cross-references
        for (int i = 0; i < 2; i++) {
            System.out.println("Running pdflatex compilation pass " + (i + 1) + "...");

            Process process = processBuilder.start();

            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                    System.out.println("LaTeX: " + line);
                }
            }

            int exitCode = process.waitFor();
            System.out.println("pdflatex pass " + (i + 1) + " completed with exit code: " + exitCode);

            if (exitCode != 0) {
                System.err.println("LaTeX compilation failed with exit code: " + exitCode);
                System.err.println("LaTeX output:\n" + output.toString());
                throw new RuntimeException(
                        "LaTeX compilation failed with exit code: " + exitCode + "\nOutput:\n" + output.toString());
            }
        }

        if (!Files.exists(pdfFile)) {
            System.err.println("PDF file was not generated successfully. Expected file: " + pdfFile.toString());
            // List files in temp directory for debugging
            try {
                Files.list(tempDir).forEach(file -> System.out.println("File in temp dir: " + file.toString()));
            } catch (Exception e) {
                System.err.println("Could not list temp directory contents: " + e.getMessage());
            }
            throw new RuntimeException("PDF file was not generated successfully");
        }

        System.out.println("PDF file generated successfully: " + pdfFile.toString());
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
