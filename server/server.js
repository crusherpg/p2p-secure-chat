/**
 * P2P Secure Chat Server
 * Updated to 2025 coding standards with ES modules and modern Node.js features
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Import configuration and utilities
import { initializeDatabase, getDatabaseStatus } from './config/database.js';
import logger from './utils/logger.js';

// Import routes and middleware
import authRoutes from './routes/auth.js';
import messageRoutes from './routes/messages.js';
import userRoutes from './routes/users.js';
import { authenticateToken } from './middleware/auth.js';
import handleSocketConnection from './sockets/socketHandler.js';

// ES module dirname setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

/**
 * Validate environment configuration
 */
const validateEnvironment = () => {
  logger.info('🔍 Validating environment configuration...');
  
  const requiredEnvVars = {
    'JWT_SECRET': {
      required: true,
      minLength: 32,
      description: 'JWT secret key for token signing'
    },
    'MONGO_URI': {
      required: true,
      pattern: /^mongodb/,
      description: 'MongoDB connection string'
    },
    'NODE_ENV': {
      required: false,
      default: 'development',
      description: 'Application environment'
    },
    'PORT': {
      required: false,
      default: '3000',
      description: 'Server port number'
    },
    'FRONTEND_URL': {
      required: false,
      default: 'http://localhost:5173',
      description: 'Frontend application URL'
    }
  };

  const missingVars = [];
  const warnings = [];

  Object.entries(requiredEnvVars).forEach(([varName, config]) => {
    const value = process.env[varName];
    
    if (config.required && !value) {
      missingVars.push(`${varName}: ${config.description}`);
    } else if (!value && config.default) {
      process.env[varName] = config.default;
      warnings.push(`${varName} not set, using default: ${config.default}`);
    }
    
    if (value && config.minLength && value.length < config.minLength) {
      missingVars.push(`${varName}: Must be at least ${config.minLength} characters long`);
    }
    
    if (value && config.pattern && !config.pattern.test(value)) {
      missingVars.push(`${varName}: Invalid format`);
    }
  });

  if (warnings.length > 0) {
    warnings.forEach(warning => logger.warn(`⚠️  ${warning}`));
  }

  if (missingVars.length > 0) {
    logger.error('❌ Missing or invalid environment variables:');
    missingVars.forEach(error => logger.error(`   • ${error}`));
    logger.error('\n📄 Please check your .env file. Copy from .env.example if needed:');
    logger.error('   cp .env.example .env');
    logger.error('   nano .env  # Edit the configuration');
    process.exit(1);
  }

  logger.info('✅ Environment validation passed');
};

/**
 * Initialize Express app with middleware
 */
const initializeApp = () => {
  const app = express();
  const server = createServer(app);
  
  // Initialize Socket.IO
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
      methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true // Backward compatibility
  });

  // Security middleware (2025 best practices)
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "ws:", "wss:"],
        mediaSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false
  }));

  // CORS configuration
  app.use(cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://localhost:5174' // Backup port
      ];
      
      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked request from: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 auth requests per windowMs
    message: {
      success: false,
      message: 'Too many authentication attempts, please try again later.'
    }
  });

  // Apply middleware
  app.use('/api/', limiter);
  app.use('/api/auth/', authLimiter);
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(mongoSanitize());
  app.use(hpp());

  // Request logging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (process.env.ENABLE_LOGGING === 'true') {
        logger.http(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms - ${req.ip}`);
      }
    });
    next();
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    const dbStatus = getDatabaseStatus();
    
    res.json({
      success: true,
      message: 'P2P Secure Chat Server is running',
      version: '1.1.0',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      database: dbStatus,
      features: {
        authentication: true,
        twoFactorAuth: true,
        endToEndEncryption: true,
        realTimeMessaging: true,
        fileSharing: true,
        speechToText: true,
        richMedia: true
      }
    });
  });

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/messages', authenticateToken, messageRoutes);
  app.use('/api/users', authenticateToken, userRoutes);

  // Socket.IO connection handling
  handleSocketConnection(io);

  // Global error handling
  app.use((err, req, res, next) => {
    logger.error('Unhandled error:', err);
    
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
      ...(isDevelopment && {
        error: err.message,
        stack: err.stack
      })
    });
  });

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: `Route ${req.originalUrl} not found`
    });
  });

  return { app, server, io };
};

/**
 * Start the server
 */
const startServer = async () => {
  try {
    logger.info('🚀 Starting P2P Secure Chat Server...');
    
    // 1. Validate environment
    validateEnvironment();
    
    // 2. Initialize database
    await initializeDatabase();
    
    // 3. Initialize Express app
    const { app, server, io } = initializeApp();
    
    // 4. Start HTTP server
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      logger.info(`✅ Server running on port ${PORT}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      logger.info(`📊 Health Check: http://localhost:${PORT}/health`);
      logger.info(`👥 Server ready for connections!`);
      
      // Log startup summary
      logger.info('\n🎉 P2P Secure Chat Server Started Successfully!');
      logger.info('Features enabled:');
      logger.info('  ✅ End-to-End Encryption');
      logger.info('  ✅ Two-Factor Authentication');
      logger.info('  ✅ Real-time Messaging');
      logger.info('  ✅ Rich Media Support');
      logger.info('  ✅ Speech-to-Text');
      logger.info('  ✅ Mobile Responsive');
    });
    
    return { app, server, io };
    
  } catch (error) {
    logger.error(`❌ Failed to start server: ${error.message}`);
    logger.error('Stack trace:', error.stack);
    process.exit(1);
  }
};

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  // Close server
  if (global.httpServer) {
    global.httpServer.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
  
  // Force exit after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after 30 seconds');
    process.exit(1);
  }, 30000);
};

// Handle process signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start server if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer()
    .then(({ server }) => {
      global.httpServer = server;
    })
    .catch((error) => {
      logger.error('Startup failed:', error);
      process.exit(1);
    });
}

export default startServer;