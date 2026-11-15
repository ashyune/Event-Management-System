const { body, validationResult } = require('express-validator');

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

module.exports = {
    validateRequest,
    registerValidation,
    loginValidation
};
