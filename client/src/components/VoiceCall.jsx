import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ]
};

export default function VoiceCall({ roomId }) {
    const { socket, addNotification } = useSocket();
    const { user } = useAuth();
    const [inCall, setInCall] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [peers, setPeers] = useState([]); // { socketId, userId, username, isMuted, isSpeaking }
    const [isSpeaking, setIsSpeaking] = useState(false);

    const localStreamRef = useRef(null);
    const peerConnectionsRef = useRef(new Map()); // socketId -> RTCPeerConnection
    const audioContextRef = useRef(null);
    const analyserMapRef = useRef(new Map()); // socketId -> { analyser, dataArray, interval }

    // ─── Join Voice Call ───
    const joinCall = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            localStreamRef.current = stream;
            setInCall(true);
            setIsMuted(false);

            // Set up local speaking detection
            setupLocalSpeakingDetection(stream);

            // Tell the room we joined
            socket.emit('voice-join', { roomId });
            addNotification({ type: 'success', message: '🎙️ Joined voice call' });
        } catch (err) {
            console.error('Mic access error:', err);
            addNotification({ type: 'error', message: '❌ Could not access microphone' });
        }
    }, [socket, roomId]);

    // ─── Leave Voice Call ───
    const leaveCall = useCallback(() => {
        // Close all peer connections
        peerConnectionsRef.current.forEach((pc, socketId) => {
            pc.close();
        });
        peerConnectionsRef.current.clear();

        // Stop local stream
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
            localStreamRef.current = null;
        }

        // Clean up analysers
        analyserMapRef.current.forEach(({ interval }) => clearInterval(interval));
        analyserMapRef.current.clear();

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        setInCall(false);
        setIsMuted(false);
        setIsSpeaking(false);
        setPeers([]);

        socket?.emit('voice-leave', { roomId });
    }, [socket, roomId]);

    // ─── Mute / Unmute ───
    const toggleMute = useCallback(() => {
        if (!localStreamRef.current) return;
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            const newMuted = !audioTrack.enabled;
            setIsMuted(newMuted);
            socket?.emit('voice-mute-status', { roomId, isMuted: newMuted });
        }
    }, [socket, roomId]);

    // ─── Create Peer Connection ───
    const createPeerConnection = useCallback((remoteSocketId, remoteUserId, remoteUsername) => {
        if (peerConnectionsRef.current.has(remoteSocketId)) {
            peerConnectionsRef.current.get(remoteSocketId).close();
        }

        const pc = new RTCPeerConnection(ICE_SERVERS);

        // Add local tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current);
            });
        }

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('voice-ice-candidate', {
                    to: remoteSocketId,
                    candidate: event.candidate
                });
            }
        };

        // Handle remote stream
        pc.ontrack = (event) => {
            const remoteStream = event.streams[0];
            // Play audio
            const audio = new Audio();
            audio.srcObject = remoteStream;
            audio.autoplay = true;
            audio.id = `audio-${remoteSocketId}`;
            document.body.appendChild(audio);

            // Set up remote speaking detection
            setupRemoteSpeakingDetection(remoteSocketId, remoteStream);
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                removePeer(remoteSocketId);
            }
        };

        peerConnectionsRef.current.set(remoteSocketId, pc);

        // Add peer to state
        setPeers(prev => {
            if (prev.find(p => p.socketId === remoteSocketId)) return prev;
            return [...prev, {
                socketId: remoteSocketId,
                userId: remoteUserId,
                username: remoteUsername,
                isMuted: false,
                isSpeaking: false
            }];
        });

        return pc;
    }, [socket]);

    // ─── Remove Peer ───
    const removePeer = useCallback((socketId) => {
        const pc = peerConnectionsRef.current.get(socketId);
        if (pc) pc.close();
        peerConnectionsRef.current.delete(socketId);

        // Remove audio element
        const audioEl = document.getElementById(`audio-${socketId}`);
        if (audioEl) {
            audioEl.srcObject = null;
            audioEl.remove();
        }

        // Clean up analyser
        const analyserData = analyserMapRef.current.get(socketId);
        if (analyserData) {
            clearInterval(analyserData.interval);
            analyserMapRef.current.delete(socketId);
        }

        setPeers(prev => prev.filter(p => p.socketId !== socketId));
    }, []);

    // ─── Speaking Detection (Local) ───
    const setupLocalSpeakingDetection = useCallback((stream) => {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioCtx;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.4;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const interval = setInterval(() => {
            analyser.getByteFrequencyData(dataArray);
            const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            setIsSpeaking(avg > 15);
        }, 150);

        analyserMapRef.current.set('local', { analyser, dataArray, interval });
    }, []);

    // ─── Speaking Detection (Remote) ───
    const setupRemoteSpeakingDetection = useCallback((socketId, stream) => {
        if (!audioContextRef.current) return;
        const audioCtx = audioContextRef.current;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.4;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const interval = setInterval(() => {
            analyser.getByteFrequencyData(dataArray);
            const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            setPeers(prev => prev.map(p =>
                p.socketId === socketId ? { ...p, isSpeaking: avg > 15 } : p
            ));
        }, 150);

        analyserMapRef.current.set(socketId, { analyser, dataArray, interval });
    }, []);

    // ─── Socket Event Handlers ───
    useEffect(() => {
        if (!socket) return;

        // A new user joined voice → we send them an offer
        const handleUserJoined = async ({ socketId, userId, username }) => {
            if (!inCall || !localStreamRef.current) return;
            const pc = createPeerConnection(socketId, userId, username);
            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.emit('voice-offer', { to: socketId, offer });
            } catch (err) {
                console.error('Offer error:', err);
            }
        };

        // Received an offer → create answer
        const handleOffer = async ({ from, offer, userId, username }) => {
            if (!inCall || !localStreamRef.current) return;
            const pc = createPeerConnection(from, userId, username);
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('voice-answer', { to: from, answer });
            } catch (err) {
                console.error('Answer error:', err);
            }
        };

        // Received an answer
        const handleAnswer = async ({ from, answer }) => {
            const pc = peerConnectionsRef.current.get(from);
            if (pc) {
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(answer));
                } catch (err) {
                    console.error('Set answer error:', err);
                }
            }
        };

        // Received ICE candidate
        const handleIce = async ({ from, candidate }) => {
            const pc = peerConnectionsRef.current.get(from);
            if (pc) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (err) {
                    console.error('ICE error:', err);
                }
            }
        };

        // User left voice
        const handleUserLeft = ({ socketId, username }) => {
            removePeer(socketId);
            if (inCall) {
                addNotification({ type: 'info', message: `🎙️ ${username} left the call` });
            }
        };

        // Mute status
        const handleMuteStatus = ({ socketId, isMuted }) => {
            setPeers(prev => prev.map(p =>
                p.socketId === socketId ? { ...p, isMuted } : p
            ));
        };

        socket.on('voice-user-joined', handleUserJoined);
        socket.on('voice-offer', handleOffer);
        socket.on('voice-answer', handleAnswer);
        socket.on('voice-ice-candidate', handleIce);
        socket.on('voice-user-left', handleUserLeft);
        socket.on('voice-mute-status', handleMuteStatus);

        return () => {
            socket.off('voice-user-joined', handleUserJoined);
            socket.off('voice-offer', handleOffer);
            socket.off('voice-answer', handleAnswer);
            socket.off('voice-ice-candidate', handleIce);
            socket.off('voice-user-left', handleUserLeft);
            socket.off('voice-mute-status', handleMuteStatus);
        };
    }, [socket, inCall, createPeerConnection, removePeer]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (inCall) leaveCall();
        };
    }, []);

    // ─── Render ───
    return (
        <div className="card p-5">
            <h3 className="text-sm font-display font-bold text-dark-700 dark:text-dark-300 mb-4 flex items-center gap-2">
                🎙️ Voice Call
                {inCall && (
                    <span className="badge bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] animate-pulse-soft">
                        ● Live
                    </span>
                )}
            </h3>

            {!inCall ? (
                /* ─── Join Button ─── */
                <button onClick={joinCall} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    Join Voice Call
                </button>
            ) : (
                <div className="space-y-4">
                    {/* ─── You ─── */}
                    <div className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isSpeaking && !isMuted
                            ? 'bg-green-50 dark:bg-green-900/20 ring-2 ring-green-400 dark:ring-green-600'
                            : 'bg-dark-50 dark:bg-dark-800'
                        }`}>
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white font-bold text-sm">
                                {user?.username?.[0]?.toUpperCase()}
                            </div>
                            {isSpeaking && !isMuted && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                                    <div className="w-2 h-2 bg-white rounded-full" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-dark-900 dark:text-white truncate">
                                {user?.username} <span className="text-dark-400 text-xs">(You)</span>
                            </p>
                            <p className="text-[10px] text-dark-500 dark:text-dark-400">
                                {isMuted ? '🔇 Muted' : isSpeaking ? '🗣️ Speaking' : '🎙️ Connected'}
                            </p>
                        </div>
                        {/* Mic Activity Bars */}
                        {!isMuted && (
                            <div className="flex items-end gap-0.5 h-5">
                                {[1, 2, 3].map(i => (
                                    <div
                                        key={i}
                                        className={`w-1 rounded-full transition-all duration-150 ${isSpeaking
                                                ? 'bg-green-500 animate-bounce-soft'
                                                : 'bg-dark-300 dark:bg-dark-600'
                                            }`}
                                        style={{
                                            height: isSpeaking ? `${8 + i * 5}px` : '4px',
                                            animationDelay: `${i * 100}ms`
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ─── Peers ─── */}
                    {peers.map(peer => (
                        <div
                            key={peer.socketId}
                            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${peer.isSpeaking && !peer.isMuted
                                    ? 'bg-green-50 dark:bg-green-900/20 ring-2 ring-green-400 dark:ring-green-600'
                                    : 'bg-dark-50 dark:bg-dark-800'
                                }`}
                        >
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-hive-500 flex items-center justify-center text-white font-bold text-sm">
                                    {peer.username?.[0]?.toUpperCase()}
                                </div>
                                {peer.isSpeaking && !peer.isMuted && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                                        <div className="w-2 h-2 bg-white rounded-full" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-dark-900 dark:text-white truncate">
                                    {peer.username}
                                </p>
                                <p className="text-[10px] text-dark-500 dark:text-dark-400">
                                    {peer.isMuted ? '🔇 Muted' : peer.isSpeaking ? '🗣️ Speaking' : '🎙️ Connected'}
                                </p>
                            </div>
                            {/* Mic Activity Bars */}
                            {!peer.isMuted && (
                                <div className="flex items-end gap-0.5 h-5">
                                    {[1, 2, 3].map(i => (
                                        <div
                                            key={i}
                                            className={`w-1 rounded-full transition-all duration-150 ${peer.isSpeaking
                                                    ? 'bg-green-500 animate-bounce-soft'
                                                    : 'bg-dark-300 dark:bg-dark-600'
                                                }`}
                                            style={{
                                                height: peer.isSpeaking ? `${8 + i * 5}px` : '4px',
                                                animationDelay: `${i * 100}ms`
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {peers.length === 0 && (
                        <p className="text-xs text-center text-dark-400 dark:text-dark-500 py-2">
                            Waiting for others to join...
                        </p>
                    )}

                    {/* ─── Controls ─── */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleMute}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all ${isMuted
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40'
                                    : 'bg-dark-100 dark:bg-dark-800 text-dark-700 dark:text-dark-200 hover:bg-dark-200 dark:hover:bg-dark-700'
                                }`}
                        >
                            {isMuted ? (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                    </svg>
                                    Unmute
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                    Mute
                                </>
                            )}
                        </button>

                        <button
                            onClick={leaveCall}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm bg-red-500 hover:bg-red-600 text-white transition-all"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                            </svg>
                            Leave
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
