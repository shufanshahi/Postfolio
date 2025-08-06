# Minimal Video Call System

This is a minimal working video call system with only essential files.

## Files Structure

### Client (Next.js)
```
client/src/app/videoCall/
├── page.js          # Main React component with video call functionality
└── MINIMAL_SETUP.md # This file
```

### Server (Spring Boot)
```
server/src/main/java/com/example/postfolio/videoCall/
└── SocketHandler.java  # Socket.IO event handler for WebRTC signaling
```

## How to Run

1. **Start Server:**
   ```bash
   cd server
   ./mvnw spring-boot:run
   ```

2. **Start Client:**
   ```bash
   cd client
   npm run dev
   ```

3. **Access:**
   - Navigate to `http://localhost:3000/videoCall`
   - Enter a room name and join
   - Open the same room in another browser tab to test

## Features

- ✅ Real-time video/audio communication
- ✅ Room-based connections
- ✅ Toggle video/audio controls
- ✅ Automatic peer connection
- ✅ Responsive UI

## Dependencies

- **Client**: `socket.io-client@2.3.0`
- **Server**: `netty-socketio@2.0.6`
- **Ports**: Client (3000), Server (8080), Socket.IO (9092) 