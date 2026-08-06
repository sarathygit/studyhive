require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { isDBConnected } = require('./config/db');
const dbReady = require('./middleware/dbReady');
const setupSocket = require('./socket');

const app = express();
const server = http.createServer(app);

// Allowed origins. CLIENT_URL may be a comma-separated list.
const allowedOrigins = [
    ...(process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(o => o.trim()),
    'http://localhost:5173',
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
        // No origin: same-origin requests, curl, health checks.
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        console.warn(`CORS: blocked origin ${origin}`);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check — deliberately registered before the database guard so it keeps
// answering (and the platform health check keeps passing) while MongoDB is down.
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        database: isDBConnected() ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// Every route below this line needs the database.
app.use('/api', dbReady);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/focus', require('./routes/focus'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/sessions', require('./routes/sessions'));

// Error handler. Placed after the routes so it also catches the CORS rejection
// thrown upstream, which would otherwise surface as an opaque 500.
app.use((err, req, res, next) => {
    if (err?.message === 'Not allowed by CORS') {
        return res.status(403).json({ message: 'Origin not allowed' });
    }
    console.error('Unhandled error:', err);
    res.status(500).json({ message: 'Server error' });
});

// Socket.io handlers
setupSocket(io);

// Bind the port FIRST, then connect to MongoDB in the background.
// Binding must not depend on the database — otherwise a paused or unreachable
// cluster stops the process from ever listening, and the platform router has no
// origin to forward to, so requests hang with no response at all.
const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🐝 StudyHive server running on port ${PORT}`);
    connectDB();
});
