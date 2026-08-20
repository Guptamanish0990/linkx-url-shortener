// ============================================================
// ERROR HANDLER MIDDLEWARE
// ============================================================

const errorHandler = (err, req, res, next) => {
    console.error('❌ Error:', err);

    // Duplicate key error (MongoDB)
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(400).json({
            error: `The ${field} already exists. Please use a different value.`
        });
    }

    // Validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({ error: errors.join(', ') });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid authentication token' });
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired. Please login again.' });
    }

    // Default error
    const status = err.status || 500;
    const message = err.message || 'Internal server error';

    res.status(status).json({ error: message });
};

// ============================================================
// NOT FOUND HANDLER
// ============================================================
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.status = 404;
    next(error);
};

module.exports = {
    errorHandler,
    notFound,
};