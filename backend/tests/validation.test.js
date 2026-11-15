
const express = require('express');
const request = require('supertest');

const {
    registerValidation,
    createEventValidation,
    registrationInputValidation,
    eventIdValidation,
    userIdValidation
} = require('../middleware/validationMiddleware');

const app = express();
app.use(express.json());

app.post('/register', registerValidation, (req, res) => res.sendStatus(201));
app.post('/events', createEventValidation, (req, res) => res.sendStatus(201));
app.post('/registrations', registrationInputValidation, (req, res) => res.sendStatus(201));
app.get('/events/:eventId', eventIdValidation, (req, res) => res.sendStatus(200));
app.delete('/users/:userId', userIdValidation, (req, res) => res.sendStatus(200));

describe('Input validation middleware', () => {
    test('rejects missing registration fields', async () => {
        const response = await request(app).post('/register').send({});
        expect(response.status).toBe(400);
    });

    test('rejects invalid email and short password', async () => {
        const response = await request(app).post('/register').send({
            name: 'Test User',
            email: 'invalid-email',
            password: '123'
        });
        expect(response.status).toBe(400);
    });

    test('trims name and normalizes email', async () => {
        const response = await request(app).post('/register').send({
            name: '  Test User  ',
            email: '  TEST@EXAMPLE.COM  ',
            password: 'password123'
        });

        expect(response.status).toBe(201);
    });

    test('rejects impossible event dates', async () => {
        const response = await request(app).post('/events').send({
            title: 'Test Event',
            date: '2026-02-30',
            time: '10:30',
            venue: 'Test Venue',
            capacity: 50
        });
        expect(response.status).toBe(400);
    });

    test('rejects invalid event times', async () => {
        const response = await request(app).post('/events').send({
            title: 'Test Event',
            date: '2026-12-01',
            time: '25:99',
            venue: 'Test Venue',
            capacity: 50
        });
        expect(response.status).toBe(400);
    });

    test('rejects zero event capacity', async () => {
        const response = await request(app).post('/events').send({
            title: 'Test Event',
            date: '2026-12-01',
            time: '10:30',
            venue: 'Test Venue',
            capacity: 0
        });
        expect(response.status).toBe(400);
    });

    test('rejects non-numeric registration event IDs', async () => {
        const response = await request(app).post('/registrations').send({
            eventId: 'abc'
        });
        expect(response.status).toBe(400);
    });

    test('rejects invalid event route IDs', async () => {
        const response = await request(app).get('/events/abc');
        expect(response.status).toBe(400);
    });

    test('rejects invalid user route IDs', async () => {
        const response = await request(app).delete('/users/abc');
        expect(response.status).toBe(400);
    });
});
