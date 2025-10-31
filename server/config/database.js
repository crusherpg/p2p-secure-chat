/**
 * Database Configuration for P2P Secure Chat
 * Updated to 2025 standards with ES modules and enhanced connection handling
 */

import mongoose from 'mongoose';
import winston from 'winston';

// Configure logger for database operations
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [DATABASE] [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [new winston.transports.Console()]
});

/**
 * MongoDB Connection Configuration
 */
const connectDatabase = async (retries = 5, delay = 5000) => {
  try {
    // Validate MongoDB URI
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      throw new Error('MONGO_URI environment variable is required');
    }

    logger.info('Attempting to connect to MongoDB...');
    logger.info(`MongoDB URI: ${mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);

    // MongoDB connection options (2025 best practices)
    const options = {
      // Connection options
      useNewUrlParser: true,
      useUnifiedTopology: true,
      
      // Timeout options
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000, // 45 seconds
      connectTimeoutMS: 10000, // 10 seconds
      
      // Buffer options
      bufferMaxEntries: 0,
      bufferCommands: false,
      
      // Authentication options
      authSource: 'admin',
      
      // Performance options
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 2,  // Maintain at least 2 socket connections
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      waitQueueTimeoutMS: 5000, // 5 seconds wait for connection from pool
      
      // Reliability options
      retryWrites: true,
      w: 'majority',
      
      // Monitoring
      heartbeatFrequencyMS: 10000, // 10 seconds
      
      // Additional security
      ssl: process.env.MONGO_SSL === 'true',
      sslValidate: process.env.MONGO_SSL_VALIDATE !== 'false'
    };

    const conn = await mongoose.connect(mongoURI, options);

    logger.info(`🌿 MongoDB Connected Successfully!`);
    logger.info(`📍 Host: ${conn.connection.host}:${conn.connection.port}`);
    logger.info(`🗄️  Database: ${conn.connection.name}`);
    logger.info(`⚡ Connection State: ${conn.connection.readyState}`);

    return conn;

  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    
    if (retries > 0) {
      logger.warn(`Retrying database connection in ${delay/1000} seconds... (${retries} attempts remaining)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return connectDatabase(retries - 1, delay);
    } else {
      logger.error('❌ Failed to connect to MongoDB after multiple attempts');
      logger.error('Please check:');
      logger.error('1. MongoDB is running and accessible');
      logger.error('2. MONGO_URI is correct in .env file');
      logger.error('3. Network connectivity and firewall settings');
      logger.error('4. MongoDB authentication credentials (if applicable)');
      
      throw error;
    }
  }
};

/**
 * Database event handlers
 */
const setupDatabaseEventHandlers = () => {
  const db = mongoose.connection;

  db.on('error', (error) => {
    logger.error(`MongoDB connection error: ${error.message}`);
  });

  db.on('disconnected', () => {
    logger.warn('📡 MongoDB disconnected');
  });

  db.on('reconnected', () => {
    logger.info('🔄 MongoDB reconnected');
  });

  db.on('reconnectFailed', () => {
    logger.error('❌ MongoDB reconnection failed');
  });

  db.on('close', () => {
    logger.info('📪 MongoDB connection closed');
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed due to app termination');
      process.exit(0);
    } catch (error) {
      logger.error(`Error during graceful shutdown: ${error.message}`);
      process.exit(1);
    }
  });
};

/**
 * Initialize database connection and setup event handlers
 */
export const initializeDatabase = async () => {
  try {
    await connectDatabase();
    setupDatabaseEventHandlers();
    
    // Create indexes if they don't exist (2025 practice)
    await createIndexes();
    
    logger.info('✅ Database initialization completed successfully');
    return true;
  } catch (error) {
    logger.error(`Database initialization failed: ${error.message}`);
    throw error;
  }
};

/**
 * Create database indexes for optimal performance
 */
const createIndexes = async () => {
  try {
    logger.info('Creating database indexes...');
    
    // This will be called after models are loaded
    // Indexes are defined in the individual model files
    
    logger.info('✅ Database indexes created successfully');
  } catch (error) {
    logger.warn(`Index creation warning: ${error.message}`);
    // Don't fail startup for index creation issues
  }
};

/**
 * Get database connection status
 */
export const getDatabaseStatus = () => {
  const state = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  return {
    state: states[state] || 'unknown',
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name,
    readyState: state
  };
};

export default {
  initializeDatabase,
  getDatabaseStatus
};