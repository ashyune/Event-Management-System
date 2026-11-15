const { body, param, validationResult } = require('express-validator');
/**
 * Checks the results of the validation chains.
 * Returns all validation errors in a consistent response.
 */
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array().map((error) => ({
                field: error.path,
                message: error.msg
            }))
        });
    }

    next();
};

/**
 * Registration input validation.
 */
const registerValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Enter a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),

    validateRequest
];

/**
 * Login input validation.
 */
const loginValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Enter a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required'),

    validateRequest
];

/**
 * Validates event creation input.
 */
const createEventValidation = [
    body('title')
        .trim()
        .notEmpty().withMessage('Event title is required')
        .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),

    body('date')
        .trim()
        .notEmpty().withMessage('Event date is required')
        .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format')
        .bail()
        .isDate({ format: 'YYYY-MM-DD', strictMode: true })
        .withMessage('Enter a valid date'),

    body('time')
        .trim()
        .notEmpty().withMessage('Event time is required')
        .matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
        .withMessage('Time must be in HH:MM or HH:MM:SS format'),

    body('venue')
        .trim()
        .notEmpty().withMessage('Event venue is required')
        .isLength({ max: 255 }).withMessage('Venue cannot exceed 255 characters'),

    body('capacity')
        .notEmpty().withMessage('Event capacity is required')
        .isInt({ min: 1 }).withMessage('Capacity must be a positive integer')
        .toInt(),

    body('description')
        .optional()
        .isString().withMessage('Description must be a string')
        .trim(),

    validateRequest
];

/**
 * Validates event updates.
 * All editable fields are optional; the controller handles empty updates.
 */
const updateEventValidation = [
    param('eventId')
        .isInt({ min: 1 }).withMessage('Event ID must be a positive integer')
        .toInt(),

    body('title')
        .optional()
        .trim()
        .notEmpty().withMessage('Title cannot be empty')
        .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),

    body('date')
        .optional()
        .trim()
        .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format')
        .bail()
        .isDate({ format: 'YYYY-MM-DD', strictMode: true })
        .withMessage('Enter a valid date'),

    body('time')
        .optional()
        .trim()
        .matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
        .withMessage('Time must be in HH:MM or HH:MM:SS format'),

    body('venue')
        .optional()
        .trim()
        .notEmpty().withMessage('Venue cannot be empty')
        .isLength({ max: 255 }).withMessage('Venue cannot exceed 255 characters'),

    body('capacity')
        .optional()
        .isInt({ min: 1 }).withMessage('Capacity must be a positive integer')
        .toInt(),

    body('description')
        .optional()
        .isString().withMessage('Description must be a string')
        .trim(),

    validateRequest
];

/**
 * Validates event IDs in route parameters.
 */
const eventIdValidation = [
    param('eventId')
        .isInt({ min: 1 }).withMessage('Event ID must be a positive integer')
        .toInt(),

    validateRequest
];

/**
 * Validates event registration requests.
 */
const registrationInputValidation = [
    body('eventId')
        .notEmpty().withMessage('Event ID is required')
        .isInt({ min: 1 }).withMessage('Event ID must be a positive integer')
        .toInt(),

    validateRequest
];

/**
 * Validates registration IDs in route parameters.
 */
const registrationIdValidation = [
    param('registrationId')
        .isInt({ min: 1 }).withMessage('Registration ID must be a positive integer')
        .toInt(),

    validateRequest
];

/**
 * Validates event IDs in registration status routes.
 */
const registrationEventIdValidation = [
    param('eventId')
        .isInt({ min: 1 }).withMessage('Event ID must be a positive integer')
        .toInt(),

    validateRequest
];

module.exports = {
    validateRequest,
    registerValidation,
    loginValidation,
    createEventValidation,
    updateEventValidation,
    eventIdValidation,
    registrationInputValidation,
    registrationIdValidation,
    registrationEventIdValidation
};