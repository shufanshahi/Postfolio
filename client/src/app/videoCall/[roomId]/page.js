"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import io from "socket.io-client";
import { Button } from "@/components/ui/button";

export default function VideoCallPage() {
  const { roomId } = useParams();
  const searchParams = useSearchParams();
  const role = (searchParams.get("role") || "participant").toLowerCase();
  const router = useRouter();

  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hasRemoteStream, setHasRemoteStream] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const socketRef = useRef(null);
  const pendingCandidatesRef = useRef([]);

  const rtcConfig = useMemo(() => ({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:global.stun.twilio.com:3478" },
      // Add TURN servers with proper credentials if needed, e.g.:
      // { urls: "turn:your.turn.server:3478", username: "user", credential: "pass" }
    ],
  }), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Capture refs at the start of the effect to avoid cleanup warnings
    const localVideo = localVideoRef.current;

    async function start() {
      try {
        // 1) Init media
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) return;
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        // 2) Init RTCPeerConnection
        const pc = new RTCPeerConnection(rtcConfig);
        pcRef.current = pc;
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));
        pc.ontrack = (event) => {
          const [remoteStream] = event.streams;
          if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
            setHasRemoteStream(true);
            // Attempt to play in case autoplay policy blocks it
            remoteVideoRef.current.play && remoteVideoRef.current.play().catch(() => {});
          }
        };
        pc.onconnectionstatechange = () => {
          console.log("PC state:", pc.connectionState);
        };
        pc.onicecandidate = (event) => {
          if (event.candidate && socketRef.current) {
            socketRef.current.emit("candidate", {
              roomId,
              candidate: event.candidate,
            });
          }
        };

        // 3) Connect signaling
        const socket = io("http://localhost:9092", {
          transports: ["websocket", "polling"],
          reconnection: true,
        });
        socketRef.current = socket;

        socket.on("connect", () => {
          setConnected(true);
          socket.emit("join", { roomId });
        });

        socket.on("disconnect", () => {
          setConnected(false);
        });

        // When both peers are in room, host can start offer. We don't hard-code host; whoever receives 'ready' just creates an offer if no remote description is set.
        socket.on("ready", async () => {
          // Only host initiates offer
          if (role !== "host") return;
          if (!pcRef.current || pcRef.current.remoteDescription) return;
          try {
            const offer = await pcRef.current.createOffer();
            await pcRef.current.setLocalDescription(offer);
            socket.emit("offer", { roomId, sdp: offer });
          } catch (e) {
            console.error("Failed to create/send offer", e);
          }
        });

        socket.on("offer", async (payload) => {
          try {
            if (!pcRef.current) return;
            if (!pcRef.current.remoteDescription) {
              await pcRef.current.setRemoteDescription(payload.sdp);
              const answer = await pcRef.current.createAnswer();
              await pcRef.current.setLocalDescription(answer);
              socket.emit("answer", { roomId, sdp: answer });
              // Flush pending candidates
              const pending = pendingCandidatesRef.current;
              pendingCandidatesRef.current = [];
              for (const c of pending) {
                try { await pcRef.current.addIceCandidate(c); } catch (e) { console.warn("flush candidate failed", e); }
              }
            }
          } catch (e) {
            console.error("Error handling offer", e);
          }
        });

        socket.on("answer", async (payload) => {
          try {
            if (!pcRef.current) return;
            if (!pcRef.current.remoteDescription) {
              await pcRef.current.setRemoteDescription(payload.sdp);
              // Flush pending candidates
              const pending = pendingCandidatesRef.current;
              pendingCandidatesRef.current = [];
              for (const c of pending) {
                try { await pcRef.current.addIceCandidate(c); } catch (e) { console.warn("flush candidate failed", e); }
              }
            }
          } catch (e) {
            console.error("Error handling answer", e);
          }
        });

        socket.on("candidate", async (payload) => {
          try {
            if (!pcRef.current) return;
            if (pcRef.current.remoteDescription) {
              await pcRef.current.addIceCandidate(payload.candidate);
            } else {
              pendingCandidatesRef.current.push(payload.candidate);
            }
          } catch (e) {
            console.error("Error adding ICE candidate", e);
          }
        });

        socket.on("peer-left", () => {
          // Reset remote media when peer leaves
          setHasRemoteStream(false);
          if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
            const remoteStream = remoteVideoRef.current.srcObject;
            if (remoteStream && remoteStream.getTracks) {
              remoteStream.getTracks().forEach((t) => t.stop());
            }
            remoteVideoRef.current.srcObject = null;
          }
        });

        socket.on("error-message", (msg) => setError(msg));
      } catch (err) {
        console.error(err);
        setError("Failed to start media or signaling.");
      }
    }

    start();
    return () => {
      cancelled = true;
      try {
        if (socketRef.current) {
          socketRef.current.emit("leave", { roomId });
          socketRef.current.disconnect();
        }
        if (pcRef.current) {
          pcRef.current.ontrack = null;
          pcRef.current.onicecandidate = null;
          pcRef.current.close();
          pcRef.current = null;
        }
        if (localVideoRef.current && localVideoRef.current.srcObject) {
          const stream = localVideoRef.current.srcObject;
          if (stream && stream.getTracks) stream.getTracks().forEach((t) => t.stop());
          localVideoRef.current.srcObject = null;
        }
      } catch (_) {}
    };
  }, [roomId, rtcConfig, role]);

  const toggleMute = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    setIsMuted((m) => !m);
  };

  const toggleCamera = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
    setIsCameraOff((c) => !c);
  };

  const hangUp = () => {
    router.push("/job-postings");
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      <div className="relative w-full h-screen overflow-hidden">
        {/* Error Message */}
        {error && (
          <div className="absolute top-4 left-4 right-4 z-50">
            <div className="p-3 rounded bg-red-900/60 border border-red-700 text-red-100 text-sm backdrop-blur-md">{error}</div>
          </div>
        )}

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
                <p className="text-white/40 text-sm mt-2">Room: {roomId}</p>
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
              <span className="text-white font-medium">Room: {roomId}</span>
              <span className="text-white/60">•</span>
              <span className="text-white/60">{role === 'host' ? 'Host' : 'Participant'}</span>
              {connected && (
                <>
                  <span className="text-white/60">•</span>
                  <span className="text-green-400 text-sm">Connected</span>
                </>
              )}
              {!connected && (
                <>
                  <span className="text-white/60">•</span>
                  <span className="text-yellow-400 text-sm">Connecting...</span>
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
                onClick={toggleCamera}
                className={`w-12 h-12 ${isCameraOff ? 'bg-red-500/80 hover:bg-red-600' : 'bg-white/10 hover:bg-white/20'} rounded-full flex items-center justify-center transition-all duration-200 border ${isCameraOff ? 'border-red-400/50 hover:border-red-300' : 'border-white/20 hover:border-white/40'}`}
              >
                {isCameraOff ? (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 5.636l12.728 12.728M9 9v6a2 2 0 002 2h6M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
              
              <button
                onClick={toggleMute}
                className={`w-12 h-12 ${isMuted ? 'bg-red-500/80 hover:bg-red-600' : 'bg-white/10 hover:bg-white/20'} rounded-full flex items-center justify-center transition-all duration-200 border ${isMuted ? 'border-red-400/50 hover:border-red-300' : 'border-white/20 hover:border-white/40'}`}
              >
                {isMuted ? (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </button>

              <button
                onClick={hangUp}
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
}


