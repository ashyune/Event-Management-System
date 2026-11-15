const express = require('express');
const request = require('supertest');

const { notFound, errorHandler } = require('../middleware/errorMiddleware');

const app = express();

app.get('/test-500', (req, res, next) => {
    next(new Error('Database password or internal details'));
});

app.get('/test-error', (req, res, next) => {
    const error = new Error('Test error');
    error.statusCode = 400;
    next(error);
});

app.use(notFound);
app.use(errorHandler);

describe('Global Error Handling Middleware', () => {
    test('returns 404 for an unknown route', async () => {
        const response = await request(app).get('/unknown');

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            success: false,
            message: 'Route not found: GET /unknown'
        });
    });

    test('handles forwarded application errors', async () => {
        const response = await request(app).get('/test-error');

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            success: false,
            message: 'Test error'
        });
    });

    test('does not expose internal server error details', async () => {
        const response = await request(app).get('/test-500');

        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Internal server error');
        expect(response.body.message).not.toContain('Database password');
    });
});