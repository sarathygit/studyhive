const mongoose = require('mongoose');

const focusSessionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room'
    },
    duration: {
        type: Number,
        required: true,
        min: 1
    },
    date: {
        type: Date,
        default: Date.now
    },
    completed: {
        type: Boolean,
        default: true
    }
});

focusSessionSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('FocusSession', focusSessionSchema);
