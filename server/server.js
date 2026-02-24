require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const setupSocket = require('./socket');

const app = express();
const server = http.createServer(app);

// Allowed origins
const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'https://studyhive-five.vercel.app'
].filter(Boolean);

// Socket.io setup
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, true); // Allow all in dev; tighten for production
        }
    },
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/focus', require('./routes/focus'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/sessions', require('./routes/sessions'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io handlers
setupSocket(io);

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`🐝 StudyHive server running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
});
