"use client"
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import io from 'socket.io-client';

const VideoCall = () => {
  const params = useParams();
  const [roomName, setRoomName] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isInRoom, setIsInRoom] = useState(false);
  const [isCaller, setIsCaller] = useState(false);
  const [hasRemoteStream, setHasRemoteStream] = useState(false);
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
      if (error.name === 'AbortError') {
        alert('Timeout accessing camera/microphone. Please ensure no other application is using them and try again.');
      } else if (error.name === 'NotAllowedError') {
        alert('Permission denied for camera/microphone. Please check your browser settings.');
      } else {
        alert('Error accessing camera/microphone. Please check permissions and hardware.');
      }
    }
  }, []);

  const createPeerConnection = useCallback(() => {
    console.log('Creating peer connection...');
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
      console.log('Received remote stream:', event.streams[0]);
      console.log('Remote stream tracks:', event.streams[0].getTracks());
      console.log('Remote video element:', remoteVideoRef.current);
      
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setHasRemoteStream(true);
        
        // Force video element to play
        remoteVideoRef.current.play().catch(error => {
          console.error('Error playing remote video:', error);
        });
        
        console.log('Remote video srcObject set successfully');
      } else {
        console.error('Remote video element is not available');
      }
    };

    // Ensure the remote video element is updated when the peer connection is established
    peerConnectionRef.current.onconnectionstatechange = () => {
      console.log('Peer connection state changed:', peerConnectionRef.current.connectionState);
      if (peerConnectionRef.current.connectionState === 'connected') {
        console.log('Peer connection established');
        // Check if we have any receivers with tracks
        if (peerConnectionRef.current.getReceivers) {
          const receivers = peerConnectionRef.current.getReceivers();
          console.log('Receivers:', receivers);
          const tracks = receivers.map(receiver => receiver.track).filter(track => track);
          console.log('Available tracks:', tracks);
          
          if (tracks.length > 0 && remoteVideoRef.current) {
            const remoteStream = new MediaStream(tracks);
            console.log('Creating new MediaStream from tracks:', remoteStream);
            remoteVideoRef.current.srcObject = remoteStream;
            setHasRemoteStream(true);
            
            // Force video element to play
            remoteVideoRef.current.play().catch(error => {
              console.error('Error playing remote video from connection state change:', error);
            });
          }
        }
      }
    };

    // Add local tracks to peer connection
    if (localStreamRef.current) {
      console.log('Adding local tracks to peer connection');
      localStreamRef.current.getTracks().forEach(track => {
        console.log('Adding track:', track.kind);
        peerConnectionRef.current.addTrack(track, localStreamRef.current);
      });
    } else {
      console.warn('Local stream not available when creating peer connection');
    }
  }, [roomName]);

  // Periodic check for remote video stream
  useEffect(() => {
    if (hasRemoteStream && peerConnectionRef.current) {
      const interval = setInterval(() => {
        if (remoteVideoRef.current && peerConnectionRef.current.connectionState === 'connected') {
          const receivers = peerConnectionRef.current.getReceivers();
          const tracks = receivers.map(receiver => receiver.track).filter(track => track);
          
          if (tracks.length > 0 && !remoteVideoRef.current.srcObject) {
            console.log('Recreating remote video stream from tracks');
            const remoteStream = new MediaStream(tracks);
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch(error => {
              console.error('Error playing remote video on periodic check:', error);
            });
          }
        }
      }, 2000); // Check every 2 seconds
      
      return () => clearInterval(interval);
    }
  }, [hasRemoteStream]);

  // Monitor remote video element
  useEffect(() => {
    if (remoteVideoRef.current) {
      const video = remoteVideoRef.current;
      
      const handleLoadedMetadata = () => {
        console.log('Remote video loaded metadata');
      };
      
      const handleCanPlay = () => {
        console.log('Remote video can play');
        video.play().catch(error => {
          console.error('Error playing remote video on canplay:', error);
        });
      };
      
      const handlePlay = () => {
        console.log('Remote video started playing');
      };
      
      const handleError = (error) => {
        console.error('Remote video error:', error);
      };
      
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('play', handlePlay);
      video.addEventListener('error', handleError);
      
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('error', handleError);
      };
    }
  }, [hasRemoteStream]);

  const createOffer = useCallback(async () => {
    try {
      console.log('Creating offer...');
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      console.log('Offer created and set as local description');
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
      console.log('Handling offer...');
      remoteDescriptionPromiseRef.current = peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(offer)
      );
      
      await remoteDescriptionPromiseRef.current;
      console.log('Remote description set successfully');
      
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      console.log('Answer created and set as local description');
      
      socketRef.current.emit('answer', {
        type: 'answer',
        sdp: answer,
        room: roomName,
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }, [roomName]);

  const handleJoinRoom = useCallback(() => {
    if (!roomName.trim()) {
      console.log('Room name is empty, cannot join');
      return;
    }
    
    if (!isConnected) {
      console.log('Not connected to server yet');
      return;
    }

    console.log('Joining room:', roomName);
    socketRef.current.emit('joinRoom', roomName);
    setIsInRoom(true);
  }, [roomName, isConnected]);

  // Set room name from URL params
  useEffect(() => {
    if (params.roomId) {
      setRoomName(params.roomId);
    }
  }, [params.roomId]);

  // Auto-join room when connected and room name is set
  useEffect(() => {
    if (roomName && isConnected && !isInRoom) {
      handleJoinRoom();
    }
  }, [roomName, isConnected, isInRoom, handleJoinRoom]);

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
      // Create peer connection immediately when joining as participant
      if (!isCaller) {
        createPeerConnection();
      }
      socketRef.current.emit('ready', roomName);
    });

    socketRef.current.on('ready', (room) => {
      console.log('Peer is ready in room:', room, 'isCaller:', isCaller);
      if (isCaller) {
        createPeerConnection();
        createOffer();
      } else {
        // Participant should already have peer connection created
        console.log('Participant is ready, waiting for offer...');
      }
    });

    socketRef.current.on('offer', (offer) => {
      console.log('Received offer:', offer, 'isCaller:', isCaller);
      if (!isCaller) {
        // Ensure peer connection exists
        if (!peerConnectionRef.current) {
          console.log('Creating peer connection for participant (fallback)');
          createPeerConnection();
        }
        handleOffer(offer);
      }
    });

    socketRef.current.on('answer', (answer) => {
      console.log('Received answer:', answer, 'isCaller:', isCaller);
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

        if (peerConnectionRef.current.remoteDescription) {
          // Remote description is already set, add candidate immediately
          peerConnectionRef.current.addIceCandidate(iceCandidate)
            .catch(error => console.error('Error adding ICE candidate:', error));
        } else if (remoteDescriptionPromiseRef.current) {
          // Remote description is being set, wait for it
          remoteDescriptionPromiseRef.current
            .then(() => peerConnectionRef.current.addIceCandidate(iceCandidate))
            .catch(error => console.error('Error adding ICE candidate:', error));
        } else {
          // Store candidates for later if no remote description yet
          console.log('Storing ICE candidate for later use');
        }
      }
    });

    socketRef.current.on('userDisconnected', (clientId) => {
      console.log('User disconnected:', clientId);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
        setHasRemoteStream(false);
      }
      setIsCaller(true);
    });

    socketRef.current.on('setCaller', (callerId) => {
      console.log('Setting caller ID:', callerId, 'Current socket ID:', socketRef.current.id);
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

  const refreshRemoteVideo = () => {
    if (peerConnectionRef.current && peerConnectionRef.current.connectionState === 'connected') {
      console.log('Manually refreshing remote video stream');
      const receivers = peerConnectionRef.current.getReceivers();
      const tracks = receivers.map(receiver => receiver.track).filter(track => track);
      
      if (tracks.length > 0 && remoteVideoRef.current) {
        const remoteStream = new MediaStream(tracks);
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch(error => {
          console.error('Error playing remote video on manual refresh:', error);
        });
        setHasRemoteStream(true);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      <div className="relative w-full h-screen overflow-hidden">
        {/* Remote Video - Full Screen */}
        <div className="absolute inset-0 bg-gray-900">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {/* Overlay when no remote video */}
          {!hasRemoteStream && (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-gray-900 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-white/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-12 h-12 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="text-white/60 text-lg">Waiting for participant...</p>
                {roomName && (
                  <p className="text-white/40 text-sm mt-2">Room: {roomName}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Local Video - Corner */}
        <div className="absolute top-4 right-4 w-64 h-48 bg-gray-800 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 backdrop-blur-sm">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2">
            <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full">You</span>
          </div>
        </div>

        {/* Top Header */}
        <div className="absolute top-4 left-4 right-80">
          <div className="bg-black/30 backdrop-blur-md rounded-xl px-4 py-2 border border-white/20">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-white font-medium">Room: {roomName}</span>
              <span className="text-white/60">•</span>
              <span className="text-white/60">{isCaller ? 'Host' : 'Participant'}</span>
              {isConnected && (
                <>
                  <span className="text-white/60">•</span>
                  <span className="text-green-400 text-sm">Connected</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
          <div className="bg-black/40 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/20 shadow-2xl">
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleVideo}
                className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-200 border border-white/20 hover:border-white/40"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              
              <button
                onClick={toggleAudio}
                className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-200 border border-white/20 hover:border-white/40"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>

              <button
                onClick={refreshRemoteVideo}
                className="w-12 h-12 bg-blue-500/80 hover:bg-blue-600 rounded-full flex items-center justify-center transition-all duration-200 border border-blue-400/50 hover:border-blue-300"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8 8 0 0116.5 2.5M9 11H3m12 0h1.01M12 7h.01M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>

              <button
                onClick={() => window.location.href = '/job-postings'}
                className="w-12 h-12 bg-red-500/80 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200 border border-red-400/50 hover:border-red-300"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
