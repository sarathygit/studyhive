const express = require('express');
const StudySession = require('../models/StudySession');
const auth = require('../middleware/auth');
const router = express.Router();

// POST /api/sessions - Create a study session
router.post('/', auth, async (req, res) => {
    try {
        const { roomId, title, description, scheduledAt, duration } = req.body;
        const session = new StudySession({
            room: roomId,
            title,
            description,
            scheduledAt,
            duration: duration || 60,
            createdBy: req.user._id,
            participants: [req.user._id]
        });
        await session.save();
        await session.populate('createdBy participants', 'username avatar');
        res.status(201).json(session);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET /api/sessions/:roomId
router.get('/:roomId', auth, async (req, res) => {
    try {
        const sessions = await StudySession.find({
            room: req.params.roomId,
            scheduledAt: { $gte: new Date() }
        })
            .populate('createdBy participants', 'username avatar')
            .sort('scheduledAt');
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/sessions/:id/join
router.post('/:id/join', auth, async (req, res) => {
    try {
        const session = await StudySession.findById(req.params.id);
        if (!session) return res.status(404).json({ message: 'Session not found' });

        if (!session.participants.includes(req.user._id)) {
            session.participants.push(req.user._id);
            await session.save();
        }
        await session.populate('createdBy participants', 'username avatar');
        res.json(session);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/sessions/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        const session = await StudySession.findById(req.params.id);
        if (!session) return res.status(404).json({ message: 'Session not found' });
        if (session.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        await StudySession.findByIdAndDelete(req.params.id);
        res.json({ message: 'Session deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
