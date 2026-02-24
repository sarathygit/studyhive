const Message = require('../models/Message');

const activeUsers = new Map(); // roomId -> Set of { socketId, userId, username }

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        // Join a room
        socket.on('joinRoom', ({ roomId, user }) => {
            socket.join(roomId);
            socket.roomId = roomId;
            socket.userData = user;

            // Track active user
            if (!activeUsers.has(roomId)) {
                activeUsers.set(roomId, new Map());
            }
            activeUsers.get(roomId).set(socket.id, {
                socketId: socket.id,
                userId: user._id,
                username: user.username,
                avatar: user.avatar
            });

            // Broadcast updated user list
            const roomUsers = Array.from(activeUsers.get(roomId).values());
            io.to(roomId).emit('roomUsers', roomUsers);

            // Notify others
            socket.to(roomId).emit('userJoined', {
                username: user.username,
                message: `${user.username} joined the room`
            });
        });

        // Leave room
        socket.on('leaveRoom', ({ roomId }) => {
            handleLeaveRoom(socket, roomId, io);
        });

        // Send message
        socket.on('sendMessage', async ({ roomId, content, sender }) => {
            try {
                const message = new Message({
                    room: roomId,
                    sender: sender._id,
                    content,
                    type: 'text'
                });
                await message.save();

                io.to(roomId).emit('newMessage', {
                    _id: message._id,
                    content,
                    sender: {
                        _id: sender._id,
                        username: sender.username,
                        avatar: sender.avatar
                    },
                    timestamp: message.timestamp,
                    type: 'text'
                });
            } catch (error) {
                console.error('Message save error:', error);
            }
        });

        // Whiteboard events
        socket.on('drawStroke', ({ roomId, stroke }) => {
            socket.to(roomId).emit('drawStroke', stroke);
        });

        socket.on('clearCanvas', ({ roomId }) => {
            socket.to(roomId).emit('clearCanvas');
        });

        socket.on('undoStroke', ({ roomId }) => {
            socket.to(roomId).emit('undoStroke');
        });

        // Timer sync
        socket.on('timerSync', ({ roomId, timerState }) => {
            socket.to(roomId).emit('timerSync', timerState);
        });

        socket.on('timerStart', ({ roomId, timerState }) => {
            io.to(roomId).emit('timerSync', timerState);
        });

        socket.on('timerPause', ({ roomId, timerState }) => {
            io.to(roomId).emit('timerSync', timerState);
        });

        socket.on('timerReset', ({ roomId, timerState }) => {
            io.to(roomId).emit('timerSync', timerState);
        });

        // User status
        socket.on('userStatus', ({ roomId, status }) => {
            socket.to(roomId).emit('userStatus', {
                userId: socket.userData?._id,
                username: socket.userData?.username,
                status
            });
        });

        // ─── WebRTC Voice Call Signaling ───

        socket.on('voice-join', ({ roomId }) => {
            socket.voiceRoom = roomId;
            // Notify all other peers in the room that a new user wants to connect
            socket.to(roomId).emit('voice-user-joined', {
                socketId: socket.id,
                userId: socket.userData?._id,
                username: socket.userData?.username
            });
        });

        socket.on('voice-leave', ({ roomId }) => {
            socket.voiceRoom = null;
            socket.to(roomId).emit('voice-user-left', {
                socketId: socket.id,
                userId: socket.userData?._id,
                username: socket.userData?.username
            });
        });

        socket.on('voice-offer', ({ to, offer }) => {
            io.to(to).emit('voice-offer', {
                from: socket.id,
                offer,
                userId: socket.userData?._id,
                username: socket.userData?.username
            });
        });

        socket.on('voice-answer', ({ to, answer }) => {
            io.to(to).emit('voice-answer', {
                from: socket.id,
                answer
            });
        });

        socket.on('voice-ice-candidate', ({ to, candidate }) => {
            io.to(to).emit('voice-ice-candidate', {
                from: socket.id,
                candidate
            });
        });

        socket.on('voice-mute-status', ({ roomId, isMuted }) => {
            socket.to(roomId).emit('voice-mute-status', {
                socketId: socket.id,
                userId: socket.userData?._id,
                username: socket.userData?.username,
                isMuted
            });
        });

        // Disconnect
        socket.on('disconnect', () => {
            if (socket.voiceRoom) {
                socket.to(socket.voiceRoom).emit('voice-user-left', {
                    socketId: socket.id,
                    userId: socket.userData?._id,
                    username: socket.userData?.username
                });
            }
            if (socket.roomId) {
                handleLeaveRoom(socket, socket.roomId, io);
            }
            console.log(`User disconnected: ${socket.id}`);
        });
    });
};

function handleLeaveRoom(socket, roomId, io) {
    socket.leave(roomId);

    if (activeUsers.has(roomId)) {
        activeUsers.get(roomId).delete(socket.id);

        if (activeUsers.get(roomId).size === 0) {
            activeUsers.delete(roomId);
        } else {
            const roomUsers = Array.from(activeUsers.get(roomId).values());
            io.to(roomId).emit('roomUsers', roomUsers);
        }
    }

    if (socket.userData) {
        socket.to(roomId).emit('userLeft', {
            username: socket.userData.username,
            message: `${socket.userData.username} left the room`
        });
    }
}
