const mongoose = require('mongoose');
const Room = require('../models/Room');

// Middleware factory: confirms the authenticated user is a participant of the
// room before any room-scoped data (messages, notes, sessions) is returned.
// Without this, being logged in was enough to read every room in the database.
//
//   router.get('/:roomId', auth, roomMember(req => req.params.roomId), handler)
//
// On success the room document is attached as req.room.
const roomMember = (getRoomId) => async (req, res, next) => {
    try {
        const roomId = getRoomId(req);

        if (!roomId || !mongoose.isValidObjectId(roomId)) {
            return res.status(400).json({ message: 'A valid room id is required' });
        }

        const room = await Room.findById(roomId).select('participants isActive maxParticipants');

        if (!room || !room.isActive) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (!room.participants.some(p => p.equals(req.user._id))) {
            return res.status(403).json({ message: 'You are not a member of this room' });
        }

        req.room = room;
        next();
    } catch (error) {
        console.error('Room access check failed:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = roomMember;
