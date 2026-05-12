// src/middlewares/validate.middleware.js

const { validationResult } = require('express-validator');

/**
 * Middleware to handle validation results
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: errors.array(),
    });
  }

  next();
};

module.exports = validate;