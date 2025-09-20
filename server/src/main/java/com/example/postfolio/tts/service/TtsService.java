package com.example.postfolio.tts.service;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;

import java.io.*;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class TtsService {

    private static final String TEMP_DIR = System.getProperty("java.io.tmpdir");
    private static final int TIMEOUT_SECONDS = 30;

    public Resource generateSpeech(String text) throws IOException, InterruptedException {
        // Generate unique filename
        String fileName = "speech_" + UUID.randomUUID().toString() + ".mp3";
        Path audioPath = Paths.get(TEMP_DIR, fileName);

        // Get the Python script from resources
        ClassPathResource scriptResource = new ClassPathResource("tts_script.py");
        Path tempScriptPath = Paths.get(TEMP_DIR, "tts_script_" + UUID.randomUUID().toString() + ".py");

        try (InputStream inputStream = scriptResource.getInputStream()) {
            String scriptContent = StreamUtils.copyToString(inputStream, Charset.defaultCharset());
            Files.write(tempScriptPath, scriptContent.getBytes());
        }

        try {
            // Execute Python script with arguments
            ProcessBuilder pb = new ProcessBuilder(
                    "python3",
                    tempScriptPath.toString(),
                    "--text", text,
                    "--output", audioPath.toString());

            pb.redirectErrorStream(true);
            Process process = pb.start();

            // Read output for debugging
            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }
            }

            boolean finished = process.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);

            if (!finished) {
                process.destroyForcibly();
                throw new RuntimeException("TTS process timed out after " + TIMEOUT_SECONDS + " seconds");
            }

            int exitCode = process.exitValue();

            if (exitCode != 0) {
                System.err.println("Python script output: " + output.toString());
                throw new RuntimeException("Python script execution failed with exit code: " + exitCode);
            }

            // Return the audio file as Resource
            File audioFile = audioPath.toFile();
            if (audioFile.exists() && audioFile.length() > 0) {
                return new FileSystemResource(audioFile);
            } else {
                throw new RuntimeException("Audio file was not created or is empty. Output: " + output.toString());
            }

        } finally {
            // Clean up the temporary Python script
            try {
                Files.deleteIfExists(tempScriptPath);
            } catch (IOException e) {
                System.err.println("Could not delete temporary script: " + e.getMessage());
            }
        }
    }
}
