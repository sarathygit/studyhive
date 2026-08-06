const express = require('express');
const Room = require('../models/Room');
const auth = require('../middleware/auth');
const roomMember = require('../middleware/roomAccess');
const router = express.Router();

// POST /api/rooms - Create a room
router.post('/', auth, async (req, res) => {
    try {
        const { name, subject, tags } = req.body;
        const room = new Room({
            name,
            subject,
            tags: tags || [],
            creator: req.user._id,
            participants: [req.user._id]
        });
        await room.save();
        await room.populate('creator participants', 'username avatar');
        res.status(201).json(room);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET /api/rooms - Get user's rooms
router.get('/', auth, async (req, res) => {
    try {
        const rooms = await Room.find({ participants: req.user._id, isActive: true })
            .populate('creator participants', 'username avatar')
            .sort('-createdAt');
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/rooms/discover - Discover rooms by subject
// Deliberately excludes `code`: the join code is a shareable secret, and
// returning it here made every room joinable by anyone browsing the list.
router.get('/discover', auth, async (req, res) => {
    try {
        const { subject } = req.query;
        const query = { isActive: true };
        if (subject) {
            query.subject = new RegExp(subject, 'i');
        }
        const rooms = await Room.find(query)
            .select('-code')
            .populate('creator', 'username avatar')
            .sort('-createdAt')
            .limit(20);
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/rooms/:id/join - Join a room discovered via the browse list.
// Discover no longer exposes codes, so joining by id is how that flow works now.
router.post('/:id/join', auth, async (req, res) => {
    try {
        const room = await Room.findOne({ _id: req.params.id, isActive: true });

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (!room.participants.some(p => p.equals(req.user._id))) {
            if (room.participants.length >= room.maxParticipants) {
                return res.status(400).json({ message: 'Room is full' });
            }
            room.participants.push(req.user._id);
            await room.save();
        }

        await room.populate('creator participants', 'username avatar');
        res.json(room);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// POST /api/rooms/join - Join room by code
router.post('/join', auth, async (req, res) => {
    try {
        const { code } = req.body;
        const room = await Room.findOne({ code: code.toUpperCase(), isActive: true });

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (room.participants.includes(req.user._id)) {
            await room.populate('creator participants', 'username avatar');
            return res.json(room);
        }

        if (room.participants.length >= room.maxParticipants) {
            return res.status(400).json({ message: 'Room is full' });
        }

        room.participants.push(req.user._id);
        await room.save();
        await room.populate('creator participants', 'username avatar');
        res.json(room);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET /api/rooms/:id - members only (the response includes the join code)
router.get('/:id', auth, roomMember(req => req.params.id), async (req, res) => {
    try {
        const room = await Room.findById(req.params.id)
            .populate('creator participants', 'username avatar focusScore streak');
        res.json(room);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/rooms/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) return res.status(404).json({ message: 'Room not found' });
        if (room.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        room.isActive = false;
        await room.save();
        res.json({ message: 'Room deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
