const mongoose = require('mongoose');

const RETRY_DELAY_MS = 5000;
const SERVER_SELECTION_TIMEOUT_MS = 10000;

// Connect in the background and keep retrying. The server must never exit on a
// database failure: MongoDB Atlas free clusters are paused after ~60 days of
// inactivity, and a paused cluster's DNS records disappear. If we exited here,
// the port would never bind and the whole service would be unreachable instead
// of just the data-backed routes.
const connectDB = async () => {
    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI is not set — data routes will return 503 until it is configured.');
        return;
    }

    // Skip if already connected (1) or a connection attempt is in flight (2).
    if (mongoose.connection.readyState !== 0) return;

    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB connection error: ${error.message}`);
        console.error(
            `Server stays up; data routes return 503. Retrying in ${RETRY_DELAY_MS / 1000}s. ` +
            `If this is an Atlas free cluster, check whether it has been paused.`
        );
        setTimeout(connectDB, RETRY_DELAY_MS);
    }
};

// Once the initial connection succeeds, mongoose handles reconnection itself.
let hasEverConnected = false;
mongoose.connection.on('connected', () => { hasEverConnected = true; });

mongoose.connection.on('disconnected', () => {
    // Failed connect attempts also emit 'disconnected'; only report a real drop,
    // otherwise the retry loop spams the log every few seconds.
    if (!hasEverConnected) return;
    console.warn('MongoDB disconnected — data routes will return 503 until it recovers.');
});

mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected.');
});

const isDBConnected = () => mongoose.connection.readyState === 1;

module.exports = connectDB;
module.exports.connectDB = connectDB;
module.exports.isDBConnected = isDBConnected;
