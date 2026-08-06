const express = require('express');
const FocusSession = require('../models/FocusSession');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// A single Pomodoro is 25 minutes; allow headroom without letting a crafted
// request post an arbitrary number straight to the top of the leaderboard.
const MAX_SESSION_MINUTES = 120;
const MAX_DAILY_MINUTES = 16 * 60;

// POST /api/focus - Record a focus session
router.post('/', auth, async (req, res) => {
    try {
        const { duration, roomId, completed } = req.body;

        const minutes = Number(duration);
        if (!Number.isInteger(minutes) || minutes < 1 || minutes > MAX_SESSION_MINUTES) {
            return res.status(400).json({
                message: `Duration must be a whole number of minutes between 1 and ${MAX_SESSION_MINUTES}`
            });
        }

        // Cap the daily total so the endpoint can't be looped for free points.
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const [today] = await FocusSession.aggregate([
            { $match: { user: req.user._id, date: { $gte: startOfDay } } },
            { $group: { _id: null, total: { $sum: '$duration' } } }
        ]);

        if ((today?.total || 0) + minutes > MAX_DAILY_MINUTES) {
            return res.status(429).json({ message: 'Daily focus time limit reached' });
        }

        const session = new FocusSession({
            user: req.user._id,
            room: roomId || undefined,
            duration: minutes,
            completed: completed !== false
        });
        await session.save();

        // Update user focus stats
        const user = await User.findById(req.user._id);
        user.focusScore += Math.floor(minutes / 5);
        user.totalFocusTime += minutes;

        // Check for badges
        if (user.totalFocusTime >= 60 && !user.badges.find(b => b.name === 'First Hour')) {
            user.badges.push({ name: 'First Hour', icon: '⏰' });
        }
        if (user.totalFocusTime >= 600 && !user.badges.find(b => b.name === '10 Hour Club')) {
            user.badges.push({ name: '10 Hour Club', icon: '🔥' });
        }
        if (user.streak >= 7 && !user.badges.find(b => b.name === 'Week Warrior')) {
            user.badges.push({ name: 'Week Warrior', icon: '⚔️' });
        }
        if (user.streak >= 30 && !user.badges.find(b => b.name === 'Monthly Master')) {
            user.badges.push({ name: 'Monthly Master', icon: '👑' });
        }

        await user.save();
        res.status(201).json({ session, user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET /api/focus/stats - Get user's focus stats
router.get('/stats', auth, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const last7Days = new Date(today);
        last7Days.setDate(last7Days.getDate() - 7);

        const dailySessions = await FocusSession.aggregate([
            { $match: { user: req.user._id, date: { $gte: last7Days } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                    totalDuration: { $sum: '$duration' },
                    sessions: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const todaySessions = await FocusSession.aggregate([
            { $match: { user: req.user._id, date: { $gte: today } } },
            { $group: { _id: null, totalDuration: { $sum: '$duration' }, sessions: { $sum: 1 } } }
        ]);

        const user = await User.findById(req.user._id).select('focusScore totalFocusTime streak badges');

        res.json({
            daily: dailySessions,
            today: todaySessions[0] || { totalDuration: 0, sessions: 0 },
            user
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/focus/leaderboard
router.get('/leaderboard', auth, async (req, res) => {
    try {
        const users = await User.find()
            .select('username avatar focusScore totalFocusTime streak badges')
            .sort('-focusScore')
            .limit(20);
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
