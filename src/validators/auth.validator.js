// src/validators/auth.validator.js

const { body } = require('express-validator');

/*
|--------------------------------------------------------------------------
| Signup Validation
|--------------------------------------------------------------------------
*/
const signupValidation = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),

  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format'),

  body('mobile')
    .notEmpty()
    .withMessage('Mobile is required')
    .isLength({ min: 10, max: 10 })
    .withMessage('Mobile must be 10 digits'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

/*
|--------------------------------------------------------------------------
| Login Validation
|--------------------------------------------------------------------------
*/
const loginValidation = [
  body('emailOrMobile')
    .notEmpty()
    .withMessage('Email or mobile is required'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

/*
|--------------------------------------------------------------------------
| Forgot Password Validation
|--------------------------------------------------------------------------
*/
const forgotPasswordValidation = [
  body('emailOrMobile')
    .notEmpty()
    .withMessage('Email or mobile is required'),
];

/*
|--------------------------------------------------------------------------
| Verify OTP Validation
|--------------------------------------------------------------------------
*/
const verifyOtpValidation = [
  body('emailOrMobile')
    .notEmpty()
    .withMessage('Email or mobile is required'),

  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits'),
];

/*
|--------------------------------------------------------------------------
| Reset Password Validation
|--------------------------------------------------------------------------
*/
const resetPasswordValidation = [
  body('emailOrMobile')
    .notEmpty()
    .withMessage('Email or mobile is required'),

  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),

  body('confirmPassword')
    .notEmpty()
    .withMessage('Confirm password is required'),
];

/*
|--------------------------------------------------------------------------
| Change Password Validation
|--------------------------------------------------------------------------
*/
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),

  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),

  body('confirmPassword')
    .notEmpty()
    .withMessage('Confirm password is required'),
];

module.exports = {
  signupValidation,
  loginValidation,
  forgotPasswordValidation,
  verifyOtpValidation,
  resetPasswordValidation,
  changePasswordValidation,
};