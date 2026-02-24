const express = require('express');
const Message = require('../models/Message');
const auth = require('../middleware/auth');
const router = express.Router();

// GET /api/messages/:roomId
router.get('/:roomId', auth, async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const messages = await Message.find({ room: req.params.roomId })
            .populate('sender', 'username avatar')
            .sort('timestamp')
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Message.countDocuments({ room: req.params.roomId });

        res.json({
            messages,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
