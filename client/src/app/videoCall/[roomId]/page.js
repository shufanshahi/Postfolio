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
    router.back();
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-white text-xl md:text-2xl font-semibold">Room: {roomId}</h1>
          <div className="text-sm text-gray-400">{connected ? "Connected" : "Connecting..."}</div>
        </div>

        {error && (
          <div className="p-3 rounded bg-red-900/60 border border-red-700 text-red-100 text-sm">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="aspect-video bg-black rounded overflow-hidden border border-gray-700">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
          </div>
          <div className="aspect-video bg-black rounded overflow-hidden border border-gray-700">
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-contain" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={toggleMute} className="bg-gray-700 hover:bg-gray-600">
            {isMuted ? "Unmute" : "Mute"}
          </Button>
          <Button onClick={toggleCamera} className="bg-gray-700 hover:bg-gray-600">
            {isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
          </Button>
          <Button onClick={hangUp} className="bg-red-700 hover:bg-red-600">End</Button>
        </div>
      </div>
    </div>
  );
}


