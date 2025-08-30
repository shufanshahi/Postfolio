package com.example.postfolio.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableRabbit
public class RabbitMQConfig {

    // Queue Names (matching AI service)
    public static final String POST_PROCESSING_QUEUE = "ai.post.processing";
    public static final String JOB_MATCHING_QUEUE = "ai.job.matching";
    public static final String MCQ_GENERATION_QUEUE = "ai.mcq.generation";
    public static final String INTERVIEW_GENERATION_QUEUE = "ai.interview.generation";

    // Result Queues (for receiving results from AI service)
    public static final String POST_RESULT_QUEUE = "ai.post.result";
    public static final String JOB_RESULT_QUEUE = "ai.job.result";
    public static final String MCQ_RESULT_QUEUE = "ai.mcq.result";
    public static final String INTERVIEW_RESULT_QUEUE = "ai.interview.result";

    // Exchange
    public static final String AI_EXCHANGE = "ai.exchange";

    @Bean
    public TopicExchange aiExchange() {
        return new TopicExchange(AI_EXCHANGE);
    }

    // Processing Queues (where we send requests)
    @Bean
    public Queue postProcessingQueue() {
        return QueueBuilder.durable(POST_PROCESSING_QUEUE).build();
    }

    @Bean
    public Queue jobMatchingQueue() {
        return QueueBuilder.durable(JOB_MATCHING_QUEUE).build();
    }

    @Bean
    public Queue mcqGenerationQueue() {
        return QueueBuilder.durable(MCQ_GENERATION_QUEUE).build();
    }

    @Bean
    public Queue interviewGenerationQueue() {
        return QueueBuilder.durable(INTERVIEW_GENERATION_QUEUE).build();
    }

    // Result Queues (where we receive results)
    @Bean
    public Queue postResultQueue() {
        return QueueBuilder.durable(POST_RESULT_QUEUE).build();
    }

    @Bean
    public Queue jobResultQueue() {
        return QueueBuilder.durable(JOB_RESULT_QUEUE).build();
    }

    @Bean
    public Queue mcqResultQueue() {
        return QueueBuilder.durable(MCQ_RESULT_QUEUE).build();
    }

    @Bean
    public Queue interviewResultQueue() {
        return QueueBuilder.durable(INTERVIEW_RESULT_QUEUE).build();
    }

    // Bindings for sending requests to AI service
    @Bean
    public Binding postProcessingBinding() {
        return BindingBuilder.bind(postProcessingQueue())
                .to(aiExchange())
                .with("ai.post.process");
    }

    @Bean
    public Binding jobMatchingBinding() {
        return BindingBuilder.bind(jobMatchingQueue())
                .to(aiExchange())
                .with("ai.job.match");
    }

    @Bean
    public Binding mcqGenerationBinding() {
        return BindingBuilder.bind(mcqGenerationQueue())
                .to(aiExchange())
                .with("ai.mcq.generate");
    }

    @Bean
    public Binding interviewGenerationBinding() {
        return BindingBuilder.bind(interviewGenerationQueue())
                .to(aiExchange())
                .with("ai.interview.generate");
    }

    // Message Converter
    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(messageConverter());
        return template;
    }

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(ConnectionFactory connectionFactory) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(messageConverter());
        factory.setConcurrentConsumers(2);
        factory.setMaxConcurrentConsumers(5);
        return factory;
    }
}
