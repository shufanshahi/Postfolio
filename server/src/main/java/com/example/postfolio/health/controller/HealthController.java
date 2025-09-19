package com.example.postfolio.health.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
@Slf4j
public class HealthController {

    @Value("${server.port:8082}")
    private String serverPort;

    @GetMapping("/instance")
    public ResponseEntity<Map<String, Object>> getInstanceInfo() {
        Map<String, Object> response = new HashMap<>();

        try {
            InetAddress inetAddress = InetAddress.getLocalHost();

            response.put("service", "postfolio-backend");
            response.put("port", serverPort);
            response.put("hostname", inetAddress.getHostName());
            response.put("ipAddress", inetAddress.getHostAddress());
            response.put("timestamp", LocalDateTime.now().toString());
            response.put("status", "UP");

            // Add JVM info for more detail
            Runtime runtime = Runtime.getRuntime();
            Map<String, Object> jvmInfo = new HashMap<>();
            jvmInfo.put("totalMemory", runtime.totalMemory());
            jvmInfo.put("freeMemory", runtime.freeMemory());
            jvmInfo.put("maxMemory", runtime.maxMemory());
            response.put("jvmInfo", jvmInfo);

            log.info("Health check called on instance - Port: {}, Hostname: {}",
                    serverPort, inetAddress.getHostName());

        } catch (UnknownHostException e) {
            log.error("Error getting host information", e);
            response.put("service", "postfolio-backend");
            response.put("port", serverPort);
            response.put("hostname", "unknown");
            response.put("error", e.getMessage());
            response.put("timestamp", LocalDateTime.now().toString());
            response.put("status", "ERROR");
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/load-test")
    public ResponseEntity<Map<String, Object>> loadTest() {
        Map<String, Object> response = new HashMap<>();

        try {
            // Simulate some processing time
            Thread.sleep(100);

            response.put("service", "postfolio-backend");
            response.put("port", serverPort);
            response.put("hostname", InetAddress.getLocalHost().getHostName());
            response.put("requestId", System.nanoTime());
            response.put("timestamp", LocalDateTime.now().toString());
            response.put("message", "Load balancing test successful");

            log.info("Load test endpoint called on port: {}", serverPort);

        } catch (Exception e) {
            log.error("Error in load test", e);
            response.put("error", e.getMessage());
        }

        return ResponseEntity.ok(response);
    }
}