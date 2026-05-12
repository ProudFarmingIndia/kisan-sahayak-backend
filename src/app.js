// src/app.js

const express = require('express');
const cors = require('cors');

const app = express();

// Import all routes
const routes = require('./routes');

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Kisan Sahayak Backend API is running successfully 🚀',
  });
});

// API Routes
app.use('/api', routes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

module.exports = app;