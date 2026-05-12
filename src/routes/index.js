// src/routes/index.js

const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');

// Mount routes
router.use('/auth', authRoutes);

module.exports = router;