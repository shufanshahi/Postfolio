"use client"
import React, { useState, useRef, useEffect, useCallback } from 'react';
import io from 'socket.io-client';

const VideoCall = () => {
  const [roomName, setRoomName] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isInRoom, setIsInRoom] = useState(false);
  const [isCaller, setIsCaller] = useState(false);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const remoteDescriptionPromiseRef = useRef(null);

  const getUserMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: true 
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
      alert('Error accessing camera/microphone. Please check permissions.');
    }
  }, []);

  const createPeerConnection = useCallback(() => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    peerConnectionRef.current = new RTCPeerConnection(configuration);
    
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Sending ICE candidate');
        socketRef.current.emit('candidate', {
          type: 'candidate',
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: event.candidate.candidate,
          room: roomName,
        });
      }
    };

    peerConnectionRef.current.ontrack = (event) => {
      console.log('Received remote stream');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Add local tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, localStreamRef.current);
      });
    }
  }, [roomName]);

  const createOffer = useCallback(async () => {
    try {
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      socketRef.current.emit('offer', {
        type: 'offer',
        sdp: offer,
        room: roomName,
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }, [roomName]);

  const handleOffer = useCallback(async (offer) => {
    try {
      remoteDescriptionPromiseRef.current = peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(offer)
      );
      
      await remoteDescriptionPromiseRef.current;
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      
      socketRef.current.emit('answer', {
        type: 'answer',
        sdp: answer,
        room: roomName,
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }, [roomName]);

  useEffect(() => {
    // Connect to Socket.IO server
    socketRef.current = io('http://localhost:9092', {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to Socket.IO server');
      setIsConnected(true);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
      setIsConnected(false);
      setIsInRoom(false);
    });

    // WebRTC signaling events
    socketRef.current.on('created', (room) => {
      console.log('Room created:', room);
      getUserMedia();
      setIsCaller(true);
    });

    socketRef.current.on('joined', (room) => {
      console.log('Joined room:', room);
      getUserMedia();
      socketRef.current.emit('ready', roomName);
    });

    socketRef.current.on('ready', (room) => {
      console.log('Peer is ready in room:', room);
      if (isCaller) {
        createPeerConnection();
        createOffer();
      }
    });

    socketRef.current.on('offer', (offer) => {
      console.log('Received offer:', offer);
      if (!isCaller) {
        createPeerConnection();
        handleOffer(offer);
      }
    });

    socketRef.current.on('answer', (answer) => {
      console.log('Received answer:', answer);
      if (isCaller && peerConnectionRef.current?.signalingState === 'have-local-offer') {
        remoteDescriptionPromiseRef.current = peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      }
    });

    socketRef.current.on('candidate', (candidate) => {
      console.log('Received ICE candidate:', candidate);
      if (peerConnectionRef.current) {
        const iceCandidate = new RTCIceCandidate({
          sdpMLineIndex: candidate.label,
          candidate: candidate.candidate,
        });

        if (remoteDescriptionPromiseRef.current) {
          remoteDescriptionPromiseRef.current
            .then(() => peerConnectionRef.current.addIceCandidate(iceCandidate))
            .catch(error => console.error('Error adding ICE candidate:', error));
        }
      }
    });

    socketRef.current.on('userDisconnected', (clientId) => {
      console.log('User disconnected:', clientId);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      setIsCaller(true);
    });

    socketRef.current.on('setCaller', (callerId) => {
      setIsCaller(socketRef.current.id === callerId);
    });

    socketRef.current.on('full', (room) => {
      alert('Room is full!');
      window.location.reload();
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [roomName, isCaller, getUserMedia, createPeerConnection, createOffer, handleOffer]);

  const handleJoinRoom = () => {
    if (!roomName.trim()) {
      alert('Room name cannot be empty');
      return;
    }
    
    if (!isConnected) {
      alert('Not connected to server. Please wait...');
      return;
    }

    console.log('Joining room:', roomName);
    socketRef.current.emit('joinRoom', roomName);
    setIsInRoom(true);
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Video Call</h1>
        
        {!isInRoom ? (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex gap-4 items-center justify-center">
              <input
                type="text"
                placeholder="Enter room name"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
              />
              <button 
                onClick={handleJoinRoom}
                disabled={!isConnected}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isConnected ? 'Join Room' : 'Connecting...'}
              </button>
            </div>
            {!isConnected && (
              <p className="text-center text-gray-600 mt-2">
                Connecting to server...
              </p>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Remote Video */}
              <div className="relative">
                <div className="bg-gray-800 rounded-lg overflow-hidden aspect-video">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-center mt-2 text-gray-600">Remote Video</p>
              </div>

              {/* Local Video */}
              <div className="relative">
                <div className="bg-gray-800 rounded-lg overflow-hidden aspect-video">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-center mt-2 text-gray-600">Local Video</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={toggleVideo}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Toggle Video
              </button>
              <button
                onClick={toggleAudio}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Toggle Audio
              </button>
            </div>

            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">
                Room: {roomName} | Status: {isCaller ? 'Caller' : 'Receiver'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCall;
