package com.example.postfolio.config;

import com.example.postfolio.post.dto.PostResponseDTO;
import com.example.postfolio.post.entity.Post;
import org.modelmapper.AbstractConverter;
import org.modelmapper.Converter;
import org.modelmapper.ModelMapper;
import org.modelmapper.convention.MatchingStrategies;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Configuration
public class ModelMapperConfig {

    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Bean
    public ModelMapper modelMapper() {
        ModelMapper modelMapper = new ModelMapper();

        // Global configuration
        modelMapper.getConfiguration()
                .setMatchingStrategy(MatchingStrategies.STRICT)
                .setFieldMatchingEnabled(true)
                .setFieldAccessLevel(org.modelmapper.config.Configuration.AccessLevel.PRIVATE)
                .setAmbiguityIgnored(true);

        // Custom type converters
        modelMapper.addConverter(localDateTimeToStringConverter);
        modelMapper.addConverter(stringToLocalDateTimeConverter);

        // Post to PostResponseDTO mapping
        modelMapper.typeMap(Post.class, PostResponseDTO.class)
                .addMappings(mapper -> {
                    mapper.map(Post::getCvHeading, PostResponseDTO::setCvHeading);
                    mapper.map(Post::getType, PostResponseDTO::setType);
                    mapper.map(Post::getTags, PostResponseDTO::setTags);
                    mapper.map(Post::getAutoTagged, PostResponseDTO::setAutoTagged);
                    mapper.using(localDateTimeToStringConverter)
                            .map(Post::getCreatedAt, PostResponseDTO::setCreatedAt);
                    mapper.using(localDateTimeToStringConverter)
                            .map(Post::getUpdatedAt, PostResponseDTO::setUpdatedAt);
                });

        return modelMapper;
    }

    // Converters
    private final Converter<LocalDateTime, String> localDateTimeToStringConverter =
            ctx -> ctx.getSource() != null ? ctx.getSource().format(DATE_FORMATTER) : null;

    private final Converter<String, LocalDateTime> stringToLocalDateTimeConverter =
            ctx -> ctx.getSource() != null ? LocalDateTime.parse(ctx.getSource(), DATE_FORMATTER) : null;

    // List conversion helper
    public static <S, T> List<T> mapList(List<S> source, Class<T> targetClass, ModelMapper modelMapper) {
        return source.stream()
                .map(element -> modelMapper.map(element, targetClass))
                .collect(Collectors.toList());
    }
}