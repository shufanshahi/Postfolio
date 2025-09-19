package com.example.postfolio.gateway.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class LoggingGlobalFilter implements GlobalFilter, Ordered {

    private static final Logger logger = LoggerFactory.getLogger(LoggingGlobalFilter.class);

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();

        logger.info("Gateway Request: {} {} from {}",
                request.getMethod(),
                request.getURI(),
                request.getRemoteAddress());

        return chain.filter(exchange)
                .doFinally(signalType -> {
                    ServerHttpResponse response = exchange.getResponse();
                    logger.info("Gateway Response: {} for {} {}",
                            response.getStatusCode(),
                            request.getMethod(),
                            request.getURI());
                });
    }

    @Override
    public int getOrder() {
        return -1;
    }
}