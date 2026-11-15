/**
 * Handles requests to routes that do not exist.
 */
const notFound = (req, res, next) => {
    const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};

/**
 * Centralized application error handler.
 */
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || err.status || 500;

    console.error(`[${statusCode}] ${req.method} ${req.originalUrl}:`, err);

    res.status(statusCode).json({
        success: false,
        message: statusCode >= 500
            ? 'Internal server error'
            : err.message,
    });
};

module.exports = { notFound, errorHandler };