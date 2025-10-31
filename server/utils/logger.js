/**
 * Centralized Logging Configuration for P2P Secure Chat
 * Updated to 2025 standards with structured logging
 */

import winston from 'winston';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// ES module dirname setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure logs directory exists
const logsDir = join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Custom log format for better readability
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, service, ...meta }) => {
    const serviceName = service ? `[${service.toUpperCase()}]` : '[SERVER]';
    const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `${timestamp} ${serviceName} [${level.toUpperCase()}]: ${stack || message}${metaString}`;
  })
);

/**
 * Production log format (JSON for log aggregation)
 */
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Create logger instance based on environment
 */
const createLogger = (service = 'server') => {
  const isProduction = process.env.NODE_ENV === 'production';
  const logLevel = process.env.LOG_LEVEL || (isProduction ? 'warn' : 'info');

  const transports = [
    // Console transport
    new winston.transports.Console({
      format: isProduction 
        ? winston.format.combine(
            winston.format.colorize(),
            productionFormat
          )
        : winston.format.combine(
            winston.format.colorize(),
            logFormat
          )
    })
  ];

  // File transports (only in production or if explicitly enabled)
  if (isProduction || process.env.ENABLE_FILE_LOGGING === 'true') {
    // Error log
    transports.push(
      new winston.transports.File({
        filename: join(logsDir, 'error.log'),
        level: 'error',
        format: productionFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        tailable: true
      })
    );

    // Combined log
    transports.push(
      new winston.transports.File({
        filename: join(logsDir, 'combined.log'),
        format: productionFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 10,
        tailable: true
      })
    );

    // Access log for HTTP requests
    transports.push(
      new winston.transports.File({
        filename: join(logsDir, 'access.log'),
        level: 'http',
        format: productionFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        tailable: true
      })
    );
  }

  return winston.createLogger({
    level: logLevel,
    format: logFormat,
    defaultMeta: { service },
    transports,
    // Handle uncaught exceptions
    exceptionHandlers: [
      new winston.transports.Console(),
      ...(isProduction ? [
        new winston.transports.File({ filename: join(logsDir, 'exceptions.log') })
      ] : [])
    ],
    // Handle unhandled promise rejections
    rejectionHandlers: [
      new winston.transports.Console(),
      ...(isProduction ? [
        new winston.transports.File({ filename: join(logsDir, 'rejections.log') })
      ] : [])
    ],
    exitOnError: false
  });
};

// Create default logger
const logger = createLogger();

/**
 * HTTP request logging middleware
 */
export const httpLogger = winston.createLogger({
  level: 'http',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, message }) => {
      return `${timestamp} [HTTP]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console({ level: 'http' }),
    ...(process.env.NODE_ENV === 'production' ? [
      new winston.transports.File({ 
        filename: join(logsDir, 'access.log'),
        level: 'http'
      })
    ] : [])
  ]
});

/**
 * Log levels explanation:
 * error: 0 - Error messages
 * warn: 1 - Warning messages
 * info: 2 - General information
 * http: 3 - HTTP request logs
 * verbose: 4 - Verbose information
 * debug: 5 - Debug information
 * silly: 6 - Everything
 */

export { createLogger };
export default logger;