const { isDBConnected } = require('../config/db');

// Guards routes that need the database. Returns a clear, actionable 503 instead
// of letting the request hang or fail with an opaque mongoose timeout.
module.exports = (req, res, next) => {
    if (isDBConnected()) return next();

    res.status(503).json({
        code: 'DB_UNAVAILABLE',
        message: "Can't reach the database right now. It may be waking up — please try again in a moment."
    });
};
