package com.example.postfolio.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "aiProcessingExecutor")
    public Executor aiProcessingExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5); // Minimum number of threads
        executor.setMaxPoolSize(20); // Maximum number of threads
        executor.setQueueCapacity(100); // Queue size for pending tasks
        executor.setThreadNamePrefix("ai-processing-");
        executor.setKeepAliveSeconds(60); // Keep idle threads alive for 60 seconds
        executor.setRejectedExecutionHandler(new java.util.concurrent.ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }

    @Bean(name = "jobMatchingExecutor")
    public Executor jobMatchingExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(3); // Minimum number of threads
        executor.setMaxPoolSize(10); // Maximum number of threads
        executor.setQueueCapacity(50); // Queue size for pending tasks
        executor.setThreadNamePrefix("job-matching-");
        executor.setKeepAliveSeconds(60); // Keep idle threads alive for 60 seconds
        executor.setRejectedExecutionHandler(new java.util.concurrent.ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }
}
