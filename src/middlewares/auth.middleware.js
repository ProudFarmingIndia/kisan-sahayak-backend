// src/middlewares/auth.middleware.js

// Import jsonwebtoken
const jwt = require('jsonwebtoken');

// Import User model
const User = require('../models/User');

/**
 * Authentication Middleware
 *
 * This middleware:
 * 1. Reads the Authorization header
 * 2. Extracts the Bearer token
 * 3. Verifies the JWT using JWT_ACCESS_SECRET
 * 4. Finds the user in MongoDB
 * 5. Attaches user to req.user
 * 6. Calls next() if authenticated
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Example header:
    // Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
    const authHeader = req.headers.authorization;

    // Check if header exists and starts with "Bearer "
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // No token provided
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Find user by ID from token payload
    const user = await User.findById(decoded.userId);

    // User not found
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // User account is disabled
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated',
      });
    }

    // Attach authenticated user to request object
    req.user = user;

    // Continue to the next middleware/controller
    next();
  } catch (error) {
    // Token invalid or expired
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired access token',
      error: error.message,
    });
  }
};

// Export middleware
module.exports = {
  protect,
};