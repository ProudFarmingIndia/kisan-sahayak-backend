// src/routes/auth.routes.js

const express = require("express");
const router = express.Router();

// Controllers
const {
  signup,
  login,
  getMe,
  refreshAccessToken,
  logout,
  changePassword,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
} = require("../controllers/auth.controller");
const validate = require("../middlewares/validate.middleware");

const {
  signupValidation,
  loginValidation,
  forgotPasswordValidation,
  verifyOtpValidation,
  resetPasswordValidation,
  changePasswordValidation,
} = require("../validators/auth.validator");

// Middleware
const { protect } = require("../middlewares/auth.middleware");

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
router.post("/signup", signupValidation, validate, signup);

router.post("/login", loginValidation, validate, login);

router.post(
  "/forgot-password",
  forgotPasswordValidation,
  validate,
  forgotPassword,
);

router.post("/verify-reset-otp", verifyOtpValidation, validate, verifyResetOtp);

router.post(
  "/reset-password",
  resetPasswordValidation,
  validate,
  resetPassword,
);

router.post("/refresh-token", refreshAccessToken);

/*
|--------------------------------------------------------------------------
| Protected Routes
|--------------------------------------------------------------------------
*/
router.get("/me", protect, getMe);
// Logout current user
router.post("/logout", protect, logout);
// Change password
router.post(
  "/change-password",
  protect,
  changePasswordValidation,
  validate,
  changePassword,
);

// Export router
module.exports = router;
