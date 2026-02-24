const express = require('express');
const Room = require('../models/Room');
const auth = require('../middleware/auth');
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
router.get('/discover', auth, async (req, res) => {
    try {
        const { subject } = req.query;
        const query = { isActive: true };
        if (subject) {
            query.subject = new RegExp(subject, 'i');
        }
        const rooms = await Room.find(query)
            .populate('creator', 'username avatar')
            .sort('-createdAt')
            .limit(20);
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
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

// GET /api/rooms/:id
router.get('/:id', auth, async (req, res) => {
    try {
        const room = await Room.findById(req.params.id)
            .populate('creator participants', 'username avatar focusScore streak');
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }
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
