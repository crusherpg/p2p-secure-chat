#!/usr/bin/env node
/**
 * P2P Secure Chat - Setup Validation Script
 * Validates environment configuration and dependencies
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

class SetupValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.success = [];
  }

  log(type, message) {
    const colors = {
      error: '\x1b[31m❌',
      warning: '\x1b[33m⚠️',
      success: '\x1b[32m✅',
      info: '\x1b[36mℹ️'
    };
    const reset = '\x1b[0m';
    
    console.log(`${colors[type] || colors.info} ${message}${reset}`);
    
    if (type === 'error') this.errors.push(message);
    if (type === 'warning') this.warnings.push(message);
    if (type === 'success') this.success.push(message);
  }

  validateEnvironment() {
    this.log('info', 'Validating environment configuration...');
    
    // Check if .env exists
    const envPath = path.resolve('.env');
    if (!fs.existsSync(envPath)) {
      this.log('error', '.env file not found. Copy .env.example to .env');
      return;
    }
    
    // Validate required variables
    const requiredVars = {
      JWT_SECRET: { minLength: 32, description: 'JWT secret key' },
      MONGO_URI: { pattern: /^mongodb/, description: 'MongoDB connection string' }
    };
    
    Object.entries(requiredVars).forEach(([varName, config]) => {
      const value = process.env[varName];
      
      if (!value) {
        this.log('error', `${varName} is not set in .env file`);
      } else if (config.minLength && value.length < config.minLength) {
        this.log('error', `${varName} must be at least ${config.minLength} characters`);
      } else if (config.pattern && !config.pattern.test(value)) {
        this.log('error', `${varName} format is invalid`);
      } else {
        this.log('success', `${varName} is properly configured`);
      }
    });
    
    // Check optional variables
    const optionalVars = {
      PORT: { default: '3000' },
      FRONTEND_URL: { default: 'http://localhost:5173' },
      NODE_ENV: { default: 'development' }
    };
    
    Object.entries(optionalVars).forEach(([varName, config]) => {
      const value = process.env[varName];
      if (!value) {
        this.log('warning', `${varName} not set, will use default: ${config.default}`);
      } else {
        this.log('success', `${varName} = ${value}`);
      }
    });
  }

  validateFiles() {
    this.log('info', 'Validating project structure...');
    
    const requiredFiles = {
      // Server files
      'server/server.js': 'Main server file',
      'server/package.json': 'Server dependencies',
      'server/models/User.js': 'User model',
      'server/models/Message.js': 'Message model',
      'server/models/Conversation.js': 'Conversation model',
      'server/controllers/authController.js': 'Authentication controller',
      'server/routes/auth.js': 'Authentication routes',
      'server/routes/messages.js': 'Message routes',
      'server/routes/users.js': 'User routes',
      'server/middleware/auth.js': 'Authentication middleware',
      'server/sockets/socketHandler.js': 'Socket handler',
      'server/config/database.js': 'Database configuration',
      'server/utils/logger.js': 'Logging utilities',
      
      // Client files
      'client/src/main.jsx': 'Client entry point',
      'client/src/App.jsx': 'Root component',
      'client/src/index.css': 'Global styles',
      'client/package.json': 'Client dependencies',
      'client/vite.config.js': 'Vite configuration',
      'client/tailwind.config.js': 'Tailwind configuration'
    };
    
    Object.entries(requiredFiles).forEach(([filePath, description]) => {
      if (fs.existsSync(path.resolve(filePath))) {
        this.log('success', `${description}: ${filePath}`);
      } else {
        this.log('error', `Missing ${description}: ${filePath}`);
      }
    });
  }

  validateDependencies() {
    this.log('info', 'Validating dependencies...');
    
    // Check server package.json
    const serverPkgPath = path.resolve('server/package.json');
    if (fs.existsSync(serverPkgPath)) {
      try {
        const serverPkg = JSON.parse(fs.readFileSync(serverPkgPath, 'utf8'));
        if (serverPkg.type === 'module') {
          this.log('success', 'Server configured for ES modules');
        } else {
          this.log('error', 'Server package.json missing "type": "module"');
        }
        
        const requiredServerDeps = [
          'express', 'mongoose', 'jsonwebtoken', 'argon2', 'socket.io', 'cors', 'helmet'
        ];
        
        requiredServerDeps.forEach(dep => {
          if (serverPkg.dependencies && serverPkg.dependencies[dep]) {
            this.log('success', `Server dependency: ${dep}`);
          } else {
            this.log('error', `Missing server dependency: ${dep}`);
          }
        });
      } catch (error) {
        this.log('error', 'Cannot parse server/package.json');
      }
    }
    
    // Check client package.json
    const clientPkgPath = path.resolve('client/package.json');
    if (fs.existsSync(clientPkgPath)) {
      try {
        const clientPkg = JSON.parse(fs.readFileSync(clientPkgPath, 'utf8'));
        const requiredClientDeps = [
          'react', 'react-dom', 'vite', 'tailwindcss', 'socket.io-client', 'axios'
        ];
        
        requiredClientDeps.forEach(dep => {
          if ((clientPkg.dependencies && clientPkg.dependencies[dep]) ||
              (clientPkg.devDependencies && clientPkg.devDependencies[dep])) {
            this.log('success', `Client dependency: ${dep}`);
          } else {
            this.log('error', `Missing client dependency: ${dep}`);
          }
        });
      } catch (error) {
        this.log('error', 'Cannot parse client/package.json');
      }
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(70));
    console.log('📋 P2P SECURE CHAT - SETUP VALIDATION REPORT');
    console.log('='.repeat(70));
    
    if (this.errors.length === 0) {
      console.log('\n🎉 \x1b[32mSUCCESS: Setup validation passed!\x1b[0m');
      console.log('🚀 Your P2P Secure Chat is ready to run.');
      console.log('\n🛠️  Quick Start:');
      console.log('   1. Start server: cd server && npm run dev');
      console.log('   2. Start client: cd client && npm run dev');
      console.log('   3. Open: http://localhost:5173');
    } else {
      console.log(`\n❌ \x1b[31mERRORS FOUND: ${this.errors.length}\x1b[0m`);
      this.errors.forEach(error => console.log(`   • ${error}`));
      
      console.log('\n🔧 \x1b[33mQuick Fix:\x1b[0m');
      console.log('   1. cp .env.example .env');
      console.log('   2. Edit .env with your configuration');
      console.log('   3. Run: npm run install:all');
      console.log('   4. Run this validator again');
    }
    
    if (this.warnings.length > 0) {
      console.log(`\n⚠️  \x1b[33mWARNINGS: ${this.warnings.length}\x1b[0m`);
      this.warnings.forEach(warning => console.log(`   • ${warning}`));
    }
    
    console.log(`\n✅ \x1b[32mSUCCESS COUNT: ${this.success.length}\x1b[0m`);
    console.log('\n' + '='.repeat(70));
    
    return this.errors.length === 0;
  }

  run() {
    console.log('\x1b[36m🔍 Starting P2P Secure Chat setup validation...\x1b[0m\n');
    
    this.validateEnvironment();
    this.validateFiles();
    this.validateDependencies();
    
    return this.generateReport();
  }
}

// Run validation
const validator = new SetupValidator();
const success = validator.run();
process.exit(success ? 0 : 1);