package com.example.postfolio.config;

import com.corundumstudio.socketio.SocketIOServer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SocketIOConfig {

    @Value("${socket.host}")
    private String host;

    @Value("${socket.port}")
    private int port;

    // Only keeping video call socket server for now
    @Bean("videoCallSocketIOServer")
    public SocketIOServer videoCallSocketIOServer() {
        com.corundumstudio.socketio.Configuration config = new com.corundumstudio.socketio.Configuration();
        config.setHostname(host);
        config.setPort(port);
        config.setOrigin("*");
        return new SocketIOServer(config);
    }

    // Messaging socket server removed - using polling instead
    // @Bean("messagingSocketIOServer")
    // public SocketIOServer messagingSocketIOServer() {
    //     com.corundumstudio.socketio.Configuration config = new com.corundumstudio.socketio.Configuration();
    //     config.setHostname(host);
    //     config.setPort(messagingPort);
    //     config.setOrigin("*");
    //     return new SocketIOServer(config);
    // }
}
