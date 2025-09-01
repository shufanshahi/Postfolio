"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
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
  const [interviewData, setInterviewData] = useState(null);
  const [loadingInterview, setLoadingInterview] = useState(true);

  // Whiteboard state
  const [whiteboardVisible, setWhiteboardVisible] = useState(false);
  const [brushColor, setBrushColor] = useState("#ff3b3b");
  const [brushSize, setBrushSize] = useState(4);
  const [drawMode, setDrawMode] = useState("draw"); // draw | erase

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const canvasRef = useRef(null);
  const canvasCtxRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 }); // normalized 0..1
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

  // Fetch interview data when component mounts
  useEffect(() => {
    const fetchInterviewData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("You are not logged in. Please login first.");
          return;
        }

        const res = await fetch(`http://localhost:8080/api/interviews/${roomId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setInterviewData(data);
        } else {
          setError("Failed to fetch interview information.");
        }
      } catch (error) {
        console.error("Error fetching interview data:", error);
        setError("Error fetching interview information.");
      } finally {
        setLoadingInterview(false);
      }
    };

    fetchInterviewData();
  }, [roomId]);

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

        // Whiteboard sync
        socket.on("whiteboard-event", (evt) => {
          handleRemoteWhiteboardEvent(evt);
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

  const hangUp = async () => {
    try {
    //   // If the user is a host, update interview status to COMPLETED and redirect to job-applicants
    //   if (role === "host" && interviewData) {
    //     const token = localStorage.getItem("token");
    //     if (token) {
    //       try {
    //         await fetch(`http://localhost:8080/api/interviews/update-status?profileId=${interviewData.profileId}&jobId=${interviewData.jobId}&status=COMPLETED`, {
    //           method: "PUT",
    //           headers: {
    //             "Content-Type": "application/json",
    //             Authorization: `Bearer ${token}`,
    //           },
    //         });
    //       } catch (error) {
    //         console.error("Error updating interview status:", error);
    //       }
    //     }
    //     // Redirect to job-applicants page with the jobId
    //     router.push(`/job-applicants/${interviewData.jobId}`);
    //   } else {
    //     // For participants or when interview data is not available, go to a default page
    //     router.push("/dashboard");
    //   }
    } catch (error) {
      console.error("Error during hangup:", error);
      router.push("/dashboard");
    }
  };

  // Whiteboard helpers
  const getCanvasRect = () => {
    const canvas = canvasRef.current;
    if (!canvas) return { width: 0, height: 0 };
    const rect = canvas.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  };

  const ensureCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = getCanvasRect();
    const newWidth = Math.max(1, Math.floor(width * dpr));
    const newHeight = Math.max(1, Math.floor(height * dpr));
    
    // Only resize if dimensions have actually changed to preserve content
    if (canvas.width !== newWidth || canvas.height !== newHeight) {
      // Save the current canvas content
      const imageData = canvas.width > 0 && canvas.height > 0 ? 
        canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height) : null;
      
      // Set new backing store size
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      canvasCtxRef.current = ctx;
      
      // Restore the previous content if it existed
      if (imageData) {
        ctx.putImageData(imageData, 0, 0);
      }
    } else {
      // Just update the context reference
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      canvasCtxRef.current = ctx;
    }
  }, []);

  useEffect(() => {
    if (!whiteboardVisible) return;
    ensureCanvasSize();
    const onResize = () => ensureCanvasSize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [whiteboardVisible, ensureCanvasSize]);

  const drawLineLocal = (fromNorm, toNorm, options) => {
    const ctx = canvasCtxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    const { width, height } = getCanvasRect();
    const fromX = fromNorm.x * width;
    const fromY = fromNorm.y * height;
    const toX = toNorm.x * width;
    const toY = toNorm.y * height;

    const mode = options?.mode || drawMode;
    const color = options?.color || brushColor;
    const size = options?.size || brushSize;

    ctx.save();
    if (mode === "erase") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
    }
    ctx.lineWidth = size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    ctx.restore();
  };

  const emitWhiteboard = (evt) => {
    if (!socketRef.current) return;
    socketRef.current.emit("whiteboard-event", { roomId, ...evt });
  };

  const pointerToNorm = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
  };

  const onPointerDown = (e) => {
    if (!whiteboardVisible) return;
    e.preventDefault();
    isDrawingRef.current = true;
    const p = pointerToNorm(e);
    lastPointRef.current = p;
    emitWhiteboard({ type: "begin", mode: drawMode, color: brushColor, size: brushSize, fromX: p.x, fromY: p.y, toX: p.x, toY: p.y });
  };

  const onPointerMove = (e) => {
    if (!whiteboardVisible || !isDrawingRef.current) return;
    e.preventDefault();
    const p = pointerToNorm(e);
    const from = lastPointRef.current;
    drawLineLocal(from, p);
    emitWhiteboard({ type: "draw", mode: drawMode, color: brushColor, size: brushSize, fromX: from.x, fromY: from.y, toX: p.x, toY: p.y });
    lastPointRef.current = p;
  };

  const onPointerUp = (e) => {
    if (!whiteboardVisible) return;
    e.preventDefault();
    if (isDrawingRef.current) {
      const p = pointerToNorm(e);
      emitWhiteboard({ type: "end", mode: drawMode, color: brushColor, size: brushSize, fromX: p.x, fromY: p.y, toX: p.x, toY: p.y });
    }
    isDrawingRef.current = false;
  };

  const applyRemoteWhiteboardEvent = (evt) => {
    if (!canvasCtxRef.current) {
      ensureCanvasSize();
    }
    const type = evt?.type;
    if (type === "clear") {
      const ctx = canvasCtxRef.current;
      const canvas = canvasRef.current;
      if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    // Only draw lines for draw events, not for begin/end events
    if (type === "draw") {
      const from = { x: evt.fromX, y: evt.fromY };
      const to = { x: evt.toX, y: evt.toY };
      drawLineLocal(from, to, { mode: evt.mode, color: evt.color, size: evt.size });
    }
  };

  const handleRemoteWhiteboardEvent = (evt) => {
    if (!whiteboardVisible) {
      setWhiteboardVisible(true);
      // Defer to allow canvas to mount
      setTimeout(() => applyRemoteWhiteboardEvent(evt), 0);
      return;
    }
    applyRemoteWhiteboardEvent(evt);
  };

  const clearWhiteboard = () => {
    const ctx = canvasCtxRef.current;
    const canvas = canvasRef.current;
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
    emitWhiteboard({ type: "clear" });
  };

  if (!mounted || loadingInterview) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white/60 text-lg">Loading interview...</p>
      </div>
    </div>
  );

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
          {whiteboardVisible && (
            <>
              <div className="absolute inset-0 bg-white"></div>
              <canvas
                ref={canvasRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
              />
            </>
          )}
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
              {interviewData && (
                <>
                  <span className="text-white/60">•</span>
                  <span className="text-white/60">Job ID: {interviewData.jobId}</span>
                </>
              )}
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

              {/* Whiteboard toggle */}
              <button
                onClick={() => setWhiteboardVisible(v => !v)}
                className={`w-12 h-12 ${whiteboardVisible ? 'bg-emerald-600/80 hover:bg-emerald-600' : 'bg-white/10 hover:bg-white/20'} rounded-full flex items-center justify-center transition-all duration-200 border ${whiteboardVisible ? 'border-emerald-300' : 'border-white/20 hover:border-white/40'}`}
                title="Toggle whiteboard"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10M4 18h6" />
                </svg>
              </button>

              {/* Clear whiteboard */}
              {whiteboardVisible && (
                <button
                  onClick={clearWhiteboard}
                  className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-200 border border-white/20"
                  title="Clear whiteboard"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M8 6v12m8-12v12M5 6l1 14a2 2 0 002 2h8a2 2 0 002-2l1-14" />
                  </svg>
                </button>
              )}

              <button
                onClick={hangUp}
                className="w-12 h-12 bg-red-500/80 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200 border border-red-400/50 hover:border-red-300"
                title={role === 'host' ? 'End Interview' : 'Leave Interview'}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Whiteboard toolbar */}
        {whiteboardVisible && (
          <div className="absolute top-20 right-4 bg-black/40 backdrop-blur-md rounded-xl p-3 border border-white/20 space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-white/70 text-xs">Color</span>
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="w-8 h-8 p-0 border-0 bg-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-white/70 text-xs">Size</span>
              <input
                type="range"
                min="2"
                max="20"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setDrawMode('draw')}
                className={`px-2 py-1 rounded text-xs ${drawMode === 'draw' ? 'bg-emerald-600/80 text-white' : 'bg-white/10 text-white/80'}`}
              >Draw</button>
              <button
                onClick={() => setDrawMode('erase')}
                className={`px-2 py-1 rounded text-xs ${drawMode === 'erase' ? 'bg-emerald-600/80 text-white' : 'bg-white/10 text-white/80'}`}
              >Erase</button>
            </div>
            <div className="text-[10px] text-white/60">Draws sync to everyone in this room.</div>
          </div>
        )}
      </div>
    </div>
  );
}


