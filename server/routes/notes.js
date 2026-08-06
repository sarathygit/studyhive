const express = require('express');
const multer = require('multer');
const path = require('path');
const Note = require('../models/Note');
const auth = require('../middleware/auth');
const roomMember = require('../middleware/roomAccess');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowed = ['.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed'));
        }
    }
});

// POST /api/notes - Upload a note
router.post('/', auth, upload.single('file'), roomMember(req => req.body.roomId), async (req, res) => {
    try {
        const { title, content, roomId } = req.body;
        const noteData = {
            room: roomId,
            user: req.user._id,
            title,
            content: content || ''
        };

        if (req.file) {
            noteData.fileUrl = `/uploads/${req.file.filename}`;
            noteData.fileName = req.file.originalname;
            noteData.fileType = req.file.mimetype;
        }

        const note = new Note(noteData);
        await note.save();
        await note.populate('user', 'username avatar');
        res.status(201).json(note);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET /api/notes/:roomId
router.get('/:roomId', auth, roomMember(req => req.params.roomId), async (req, res) => {
    try {
        const notes = await Note.find({ room: req.params.roomId })
            .populate('user', 'username avatar')
            .sort('-createdAt');
        res.json(notes);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/notes/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);
        if (!note) return res.status(404).json({ message: 'Note not found' });
        if (note.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        await Note.findByIdAndDelete(req.params.id);
        res.json({ message: 'Note deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
