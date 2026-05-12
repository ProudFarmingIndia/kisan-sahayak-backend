// src/controllers/auth.controller.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateTokens } = require('../utils/generateTokens');
const generateOtp = require('../utils/generateOTP');

const { sendOtpEmail } = require('../services/email.service');
const { sendOtpSms } = require('../services/sms.service');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/signup
 * @access  Public
 */
const signup = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    // Basic validation
    if (!name || !email || !mobile || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, mobile and password are required',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { mobile }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email or mobile number',
      });
    }

    // Create user (password will be hashed automatically)
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      mobile,
      password,
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          isMobileVerified: user.isMobileVerified,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Signup Error:', error);

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { emailOrMobile, password } = req.body;

    // Validate input
    if (!emailOrMobile || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email/mobile and password are required',
      });
    }

    // Find user and explicitly include hidden fields
    const user = await User.findOne({
      $or: [
        { email: emailOrMobile.toLowerCase() },
        { mobile: emailOrMobile },
      ],
    }).select('+password +refreshToken');

    // User not found
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check password
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check account status
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated',
      });
    }

    // Generate fresh tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Success response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          isMobileVerified: user.isMobileVerified,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get current logged-in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    // req.user is set by protect middleware
    const user = req.user;

    res.status(200).json({
      success: true,
      message: 'User profile fetched successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          isMobileVerified: user.isMobileVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('GetMe Error:', error);

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};
/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh-token
 * @access  Public
 */
const refreshAccessToken = async (req, res) => {
  try {
    // Get refresh token from request body
    const { refreshToken } = req.body;

    // Check if token exists
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    // Find user and include refreshToken field
    const user = await User.findById(decoded.userId).select(
      '+refreshToken'
    );

    // User not found
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // Compare refresh token with stored token
    if (user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    // Save new refresh token
    user.refreshToken = tokens.refreshToken;

    await user.save();

    // Send response
    res.status(200).json({
      success: true,
      message: 'Access token refreshed successfully',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error) {
    console.error('Refresh Token Error:', error);

    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
      error: error.message,
    });
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res) => {
  try {
    // req.user is populated by protect middleware
    const user = await User.findById(req.user._id).select('+refreshToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Remove refresh token from database
    user.refreshToken = null;
    await user.save();

    // Success response
    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout Error:', error);

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};
/**
 * @desc    Change user password
 * @route   POST /api/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res) => {
  try {
        const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body;

    // Validate input
    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Current password, new password and confirm password are required',
      });
    }

    // Check new password and confirm password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          'New password and confirm password do not match',
      });
    }

    // Optional password strength check
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    // Load user with password field
    const user = await User.findById(req.user._id).select(
      '+password +refreshToken'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify current password
    const isPasswordCorrect = await user.comparePassword(currentPassword);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Prevent reusing the same password
    const isSamePassword = await user.comparePassword(newPassword);

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from the current password',
      });
    }

    // Update password (will be hashed automatically by pre-save middleware)
    user.password = newPassword;

    // Invalidate refresh token so user must log in again
    user.refreshToken = null;

    await user.save();

    // Success response
    res.status(200).json({
      success: true,
      message:
        'Password changed successfully. Please log in again.',
    });
  } catch (error) {
    console.error('Change Password Error:', error);

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};
/**
 * @desc    Forgot password - generate and send OTP
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */


const forgotPassword = async (req, res) => {
  try {
    const { emailOrMobile } = req.body;

    // Validate input
    if (!emailOrMobile) {
      return res.status(400).json({
        success: false,
        message: 'Email or mobile is required',
      });
    }

    // Find user by email or mobile
    const user = await User.findOne({
      $or: [
        { email: emailOrMobile.toLowerCase() },
        { mobile: emailOrMobile },
      ],
    }).select(
      '+passwordResetOtp +passwordResetOtpExpires'
    );

    // Do not reveal whether the account exists (security best practice)
    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          'If an account exists, an OTP has been sent to your registered email and mobile.',
      });
    }

    // Generate 6-digit OTP
    const otp = generateOtp();

    // Set OTP and expiry (10 minutes)
    user.passwordResetOtp = otp;
    user.passwordResetOtpExpires =
      new Date(Date.now() + 10 * 60 * 1000);
    user.isPasswordResetOtpVerified = false;

    // Save to database
    await user.save();

    // Send OTP to email
    await sendOtpEmail(user.email, otp);

    // Send OTP to mobile
    await sendOtpSms(user.mobile, otp);

    // For development only: log OTP to terminal
    console.log('====================================');
    console.log('FORGOT PASSWORD OTP:', otp);
    console.log('Email:', user.email);
    console.log('Mobile:', user.mobile);
    console.log('Expires:', user.passwordResetOtpExpires);
    console.log('====================================');

    // Success response
    res.status(200).json({
      success: true,
      message:
        'If an account exists, an OTP has been sent to your registered email and mobile.',
    });
  } catch (error) {
    console.error('Forgot Password Error:', error);

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Verify forgot password OTP
 * @route   POST /api/auth/verify-reset-otp
 * @access  Public
 */
const verifyResetOtp = async (req, res) => {
  try {
    const { emailOrMobile, otp } = req.body;

    // Validate input
    if (!emailOrMobile || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email/mobile and OTP are required',
      });
    }

    // Find user and include hidden OTP fields
    const user = await User.findOne({
      $or: [
        { email: emailOrMobile.toLowerCase() },
        { mobile: emailOrMobile },
      ],
    }).select(
      '+passwordResetOtp +passwordResetOtpExpires'
    );

    // User not found
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Invalid OTP or user not found',
      });
    }

    // Check OTP exists
    if (!user.passwordResetOtp) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new OTP.',
      });
    }

    // Verify OTP
    if (user.passwordResetOtp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
      });
    }

    // Check OTP expiry
    if (user.passwordResetOtpExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired',
      });
    }

    // Mark OTP as verified
    user.isPasswordResetOtpVerified = true;

    await user.save();

    // Success response
    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
    });
  } catch (error) {
    console.error('Verify Reset OTP Error:', error);

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};
/**
 * @desc    Reset password after OTP verification
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res) => {
  try {
    const {
      emailOrMobile,
      newPassword,
      confirmPassword,
    } = req.body;

    // Validate input
    if (
      !emailOrMobile ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Email/mobile, new password and confirm password are required',
      });
    }

    // Check password confirmation
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          'New password and confirm password do not match',
      });
    }

    // Password strength validation
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          'New password must be at least 6 characters long',
      });
    }

    // Find user with required hidden fields
    const user = await User.findOne({
      $or: [
        { email: emailOrMobile.toLowerCase() },
        { mobile: emailOrMobile },
      ],
    }).select(
      '+password +refreshToken +passwordResetOtp +passwordResetOtpExpires'
    );

    // User not found
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Ensure OTP was verified first
    if (!user.isPasswordResetOtpVerified) {
      return res.status(400).json({
        success: false,
        message:
          'OTP verification required before resetting password',
      });
    }

    // Update password
    // Will be hashed automatically by pre-save middleware
    user.password = newPassword;

    // Clear all reset-related fields
    user.passwordResetOtp = null;
    user.passwordResetOtpExpires = null;
    user.isPasswordResetOtpVerified = false;

    // Invalidate existing refresh token
    user.refreshToken = null;

    // Save changes
    await user.save();

    // Success response
    res.status(200).json({
      success: true,
      message:
        'Password reset successfully. Please log in again.',
    });
  } catch (error) {
    console.error('Reset Password Error:', error);

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Update exports
module.exports = {
  signup,
  login,
  getMe,
  refreshAccessToken,
  logout,
  changePassword,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
};