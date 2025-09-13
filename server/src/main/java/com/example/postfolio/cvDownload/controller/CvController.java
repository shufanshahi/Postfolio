package com.example.postfolio.cvDownload.controller;

import com.example.postfolio.cvDownload.service.LatexCvService;
import com.example.postfolio.profile.service.ProfileService;
import com.example.postfolio.post.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cv")
@RequiredArgsConstructor
public class CvController {

    private final ProfileService profileService;
    private final PostService postService;
    private final LatexCvService latexCvService;

    @GetMapping("/generate/{profileId}")
    public ResponseEntity<byte[]> generateCv(@PathVariable Long profileId) {
        try {
            // Try LaTeX generation first
            byte[] pdfBytes = latexCvService.generatePdfFromLatex(
                    profileService.getProfileById(profileId),
                    postService.getAllPostsByProfile(profileId));

            if (pdfBytes != null) {
                return ResponseEntity.ok()
                        .header("Content-Type", "application/pdf")
                        .header("Content-Disposition", "attachment; filename=\"professional_cv.pdf\"")
                        .body(pdfBytes);
            } else {
                return ResponseEntity.status(503)
                        .header("Content-Type", "text/plain")
                        .body("LaTeX compilation not available. Please install LaTeX using setup-latex.sh script or use /api/cv/generate/latex-source/{profileId} to download LaTeX source."
                                .getBytes());
            }
        } catch (Exception e) {
            e.printStackTrace(); // For debugging
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/generate/latex/{profileId}")
    public ResponseEntity<byte[]> generateLatexCv(@PathVariable Long profileId) {
        try {
            // Try to generate PDF using LaTeX compilation
            byte[] pdfBytes = latexCvService.generatePdfFromLatex(
                    profileService.getProfileById(profileId),
                    postService.getAllPostsByProfile(profileId));

            if (pdfBytes != null) {
                return ResponseEntity.ok()
                        .header("Content-Type", "application/pdf")
                        .header("Content-Disposition", "attachment; filename=\"professional_cv_latex.pdf\"")
                        .body(pdfBytes);
            } else {
                return ResponseEntity.status(503)
                        .header("Content-Type", "text/plain")
                        .body("LaTeX compilation not available. Please install LaTeX using setup-latex.sh script."
                                .getBytes());
            }
        } catch (Exception e) {
            e.printStackTrace(); // For debugging
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/generate/latex-source/{profileId}")
    public ResponseEntity<String> generateLatexSource(@PathVariable Long profileId) {
        try {
            String latexSource = latexCvService.generateLatexSource(
                    profileService.getProfileById(profileId),
                    postService.getAllPostsByProfile(profileId));

            return ResponseEntity.ok()
                    .header("Content-Type", "text/plain")
                    .header("Content-Disposition", "attachment; filename=\"professional_cv.tex\"")
                    .body(latexSource);
        } catch (Exception e) {
            e.printStackTrace(); // For debugging
            return ResponseEntity.internalServerError().build();
        }
    }
}