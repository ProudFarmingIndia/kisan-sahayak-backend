// src/utils/generateTokens.js

// Import jsonwebtoken package
const jwt = require('jsonwebtoken');

/*
|--------------------------------------------------------------------------
| Generate Access Token
|--------------------------------------------------------------------------
| Short-lived token used to access protected APIs.
*/
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES || '15m',
  });
};

/*
|--------------------------------------------------------------------------
| Generate Refresh Token
|--------------------------------------------------------------------------
| Long-lived token used to obtain a new access token.
*/
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES || '7d',
  });
};

/*
|--------------------------------------------------------------------------
| Generate Both Tokens
|--------------------------------------------------------------------------
| Convenience function used after signup/login.
*/
const generateTokens = (user) => {
  // Keep payload minimal
  const payload = {
    userId: user._id,
    role: user.role,
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

/*
|--------------------------------------------------------------------------
| Export Functions
|--------------------------------------------------------------------------
*/
module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
};