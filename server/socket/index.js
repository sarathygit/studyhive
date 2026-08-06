const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const Room = require('../models/Room');
const User = require('../models/User');

const activeUsers = new Map(); // roomId -> Map(socketId -> { socketId, userId, username, avatar })

const MAX_MESSAGE_LENGTH = 2000;

// Verify the JWT during the handshake. Without this any client could connect and
// impersonate any user simply by sending a chosen `sender._id`.
const authenticateSocket = async (socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
        return next(new Error('Authentication required'));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('username avatar');

        if (!user) {
            return next(new Error('Authentication failed'));
        }

        // The single source of truth for identity on this connection. Every
        // handler below reads from here and ignores client-supplied identity.
        socket.user = {
            _id: user._id.toString(),
            username: user.username,
            avatar: user.avatar
        };
        next();
    } catch (error) {
        next(new Error('Authentication failed'));
    }
};

// A socket may only act on a room it has actually joined, and joinRoom only
// admits verified participants — so this covers every downstream room event.
const inRoom = (socket, roomId) => Boolean(roomId) && socket.rooms.has(roomId);

module.exports = (io) => {
    io.use(authenticateSocket);

    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id} (${socket.user.username})`);

        socket.on('joinRoom', async ({ roomId }) => {
            try {
                const room = await Room.findById(roomId).select('participants isActive');

                if (!room || !room.isActive) {
                    return socket.emit('roomError', { message: 'Room not found' });
                }

                if (!room.participants.some(p => p.toString() === socket.user._id)) {
                    return socket.emit('roomError', { message: 'You are not a member of this room' });
                }

                socket.join(roomId);
                socket.roomId = roomId;

                if (!activeUsers.has(roomId)) {
                    activeUsers.set(roomId, new Map());
                }
                activeUsers.get(roomId).set(socket.id, {
                    socketId: socket.id,
                    userId: socket.user._id,
                    username: socket.user.username,
                    avatar: socket.user.avatar
                });

                io.to(roomId).emit('roomUsers', Array.from(activeUsers.get(roomId).values()));

                socket.to(roomId).emit('userJoined', {
                    username: socket.user.username,
                    message: `${socket.user.username} joined the room`
                });
            } catch (error) {
                console.error('joinRoom error:', error.message);
                socket.emit('roomError', { message: 'Could not join room' });
            }
        });

        socket.on('leaveRoom', ({ roomId }) => {
            handleLeaveRoom(socket, roomId, io);
        });

        socket.on('sendMessage', async ({ roomId, content }) => {
            if (!inRoom(socket, roomId)) return;

            const text = typeof content === 'string' ? content.trim() : '';
            if (!text || text.length > MAX_MESSAGE_LENGTH) return;

            try {
                // Sender comes from the authenticated socket, never from the payload.
                const message = await Message.create({
                    room: roomId,
                    sender: socket.user._id,
                    content: text,
                    type: 'text'
                });

                io.to(roomId).emit('newMessage', {
                    _id: message._id,
                    content: text,
                    sender: { ...socket.user },
                    timestamp: message.timestamp,
                    type: 'text'
                });
            } catch (error) {
                console.error('Message save error:', error);
            }
        });

        // Whiteboard events
        socket.on('drawStroke', ({ roomId, stroke }) => {
            if (!inRoom(socket, roomId)) return;
            socket.to(roomId).emit('drawStroke', stroke);
        });

        socket.on('clearCanvas', ({ roomId }) => {
            if (!inRoom(socket, roomId)) return;
            socket.to(roomId).emit('clearCanvas');
        });

        socket.on('undoStroke', ({ roomId }) => {
            if (!inRoom(socket, roomId)) return;
            socket.to(roomId).emit('undoStroke');
        });

        // Timer sync
        const relayTimer = ({ roomId, timerState }, toSelf) => {
            if (!inRoom(socket, roomId)) return;
            (toSelf ? io.to(roomId) : socket.to(roomId)).emit('timerSync', timerState);
        };

        socket.on('timerSync', (payload) => relayTimer(payload, false));
        socket.on('timerStart', (payload) => relayTimer(payload, true));
        socket.on('timerPause', (payload) => relayTimer(payload, true));
        socket.on('timerReset', (payload) => relayTimer(payload, true));

        socket.on('userStatus', ({ roomId, status }) => {
            if (!inRoom(socket, roomId)) return;
            socket.to(roomId).emit('userStatus', {
                userId: socket.user._id,
                username: socket.user.username,
                status
            });
        });

        // ─── WebRTC Voice Call Signaling ───

        // Signalling is peer-to-peer by socket id, so confirm the target really is
        // in the same room before relaying anything to it.
        const peerInSameRoom = (targetSocketId) => {
            const target = io.sockets.sockets.get(targetSocketId);
            return Boolean(target && socket.roomId && target.roomId === socket.roomId);
        };

        socket.on('voice-join', ({ roomId }) => {
            if (!inRoom(socket, roomId)) return;
            socket.voiceRoom = roomId;
            socket.to(roomId).emit('voice-user-joined', {
                socketId: socket.id,
                userId: socket.user._id,
                username: socket.user.username
            });
        });

        socket.on('voice-leave', ({ roomId }) => {
            if (!inRoom(socket, roomId)) return;
            socket.voiceRoom = null;
            socket.to(roomId).emit('voice-user-left', {
                socketId: socket.id,
                userId: socket.user._id,
                username: socket.user.username
            });
        });

        socket.on('voice-offer', ({ to, offer }) => {
            if (!peerInSameRoom(to)) return;
            io.to(to).emit('voice-offer', {
                from: socket.id,
                offer,
                userId: socket.user._id,
                username: socket.user.username
            });
        });

        socket.on('voice-answer', ({ to, answer }) => {
            if (!peerInSameRoom(to)) return;
            io.to(to).emit('voice-answer', { from: socket.id, answer });
        });

        socket.on('voice-ice-candidate', ({ to, candidate }) => {
            if (!peerInSameRoom(to)) return;
            io.to(to).emit('voice-ice-candidate', { from: socket.id, candidate });
        });

        socket.on('voice-mute-status', ({ roomId, isMuted }) => {
            if (!inRoom(socket, roomId)) return;
            socket.to(roomId).emit('voice-mute-status', {
                socketId: socket.id,
                userId: socket.user._id,
                username: socket.user.username,
                isMuted
            });
        });

        socket.on('disconnect', () => {
            if (socket.voiceRoom) {
                socket.to(socket.voiceRoom).emit('voice-user-left', {
                    socketId: socket.id,
                    userId: socket.user._id,
                    username: socket.user.username
                });
            }
            if (socket.roomId) {
                handleLeaveRoom(socket, socket.roomId, io);
            }
            console.log(`Socket disconnected: ${socket.id} (${socket.user.username})`);
        });
    });
};

function handleLeaveRoom(socket, roomId, io) {
    if (!roomId) return;

    socket.leave(roomId);

    if (activeUsers.has(roomId)) {
        activeUsers.get(roomId).delete(socket.id);

        if (activeUsers.get(roomId).size === 0) {
            activeUsers.delete(roomId);
        } else {
            io.to(roomId).emit('roomUsers', Array.from(activeUsers.get(roomId).values()));
        }
    }

    socket.to(roomId).emit('userLeft', {
        username: socket.user.username,
        message: `${socket.user.username} left the room`
    });
}
