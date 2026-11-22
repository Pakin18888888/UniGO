
'use strict';

// Import Express
const express = require('express');

// Import Health Check Routes
const healthRoutes = require('./routes/health.routes');

// Import Auth Routes
const authRoutes = require('./routes/auth.routes');

// Create Express Application
const app = express();

// Middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// API Routes
app.use('/api/health', healthRoutes);

// Root Route
app.get('/', (req, res) => {
    return res.status(200).json({
        status: 'ok',
        message: 'Welcome to UniGO! Backend API',
        version: '1.0.0'
    });
});

// Auth Routes
app.use('/api/auth', authRoutes);

// 404 - Route Not Found
app.use((req, res) => {
    return res.status(404).json({
        status: 'error',
        message: 'API route not found'
    });
});

// Export Express Application
module.exports = app;
