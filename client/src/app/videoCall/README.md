# Video Call Feature

This video call feature uses WebRTC for peer-to-peer video communication with Socket.IO for signaling.

## Setup

### Server (Spring Boot)
1. The server runs on port 8080 (main application) and 9092 (Socket.IO)
2. Socket.IO configuration is in `server/src/main/java/com/example/postfolio/config/SocketIOConfig.java`
3. Socket event handling is in `server/src/main/java/com/example/postfolio/videoCall/SocketHandler.java`

### Client (Next.js)
1. Socket.IO client is installed: `npm install socket.io-client`
2. The video call component is in `client/src/app/videoCall/page.js`

## How to Use

1. **Start the server:**
   ```bash
   cd server
   mvn spring-boot:run
   ```

2. **Start the client:**
   ```bash
   cd client
   npm run dev
   ```

3. **Access the video call:**
   - Navigate to `http://localhost:3000/videoCall`
   - Enter a room name
   - Click "Join Room"
   - Allow camera and microphone permissions

4. **Testing with multiple users:**
   - Open the same room name in different browser tabs/windows
   - The first user becomes the "caller"
   - The second user becomes the "receiver"
   - Video and audio should stream between them

## Features

- ✅ Real-time video and audio communication
- ✅ Room-based connections
- ✅ Toggle video/audio controls
- ✅ Automatic peer connection establishment
- ✅ Connection status indicators
- ✅ Responsive UI with Tailwind CSS

## Technical Details

- **WebRTC**: Peer-to-peer video/audio streaming
- **Socket.IO**: Signaling server for WebRTC connection establishment
- **STUN Servers**: Google's public STUN servers for NAT traversal
- **React Hooks**: useState, useEffect, useRef for state management
- **Tailwind CSS**: Modern responsive styling

## Troubleshooting

1. **Connection issues**: Check if the server is running on port 9092
2. **Camera/microphone not working**: Check browser permissions
3. **No video stream**: Ensure both users have joined the same room
4. **CORS errors**: The server is configured to allow all origins for development 