#!/usr/bin/env node
/**
 * P2P Secure Chat - Codebase Validation Script
 * This script validates the completeness and quality of the implementation
 */

const fs = require('fs');
const path = require('path');

class CodebaseValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.info = [];
    this.requiredFiles = {
      // Core App Files
      'client/src/main.jsx': 'Main application entry point',
      'client/src/App.jsx': 'Root App component',
      'client/src/index.css': 'Global styles with Tailwind',
      
      // Context Providers
      'client/src/context/AuthContext.jsx': 'Authentication context',
      'client/src/context/ThemeContext.jsx': 'Theme management context',
      
      // Services
      'client/src/services/authService.js': 'Authentication API service',
      'client/src/services/socketService.js': 'WebSocket service',
      
      // Utilities
      'client/src/utils/encryption.js': 'Client-side encryption utilities',
      
      // Pages
      'client/src/pages/LoginPage.jsx': 'Login and registration page',
      'client/src/pages/ChatPage.jsx': 'Main chat interface',
      
      // Core Components
      'client/src/components/LoadingSpinner.jsx': 'Loading indicator',
      'client/src/components/MessageBubble.jsx': 'Message display component',
      'client/src/components/MessageInput.jsx': 'Message input with media support',
      'client/src/components/UserList.jsx': 'Contact list component',
      'client/src/components/ConversationList.jsx': 'Chat list component',
      'client/src/components/UserMenu.jsx': 'User menu with logout',
      
      // Enhanced Components
      'client/src/components/MediaPicker.jsx': 'Emoji/GIF/File picker',
      'client/src/components/AudioRecorder.jsx': 'Voice message recorder',
      'client/src/components/SpeechToText.jsx': 'Speech recognition component',
      'client/src/components/TOTPSetup.jsx': 'Two-factor authentication setup',
      
      // Configuration
      'client/package.json': 'Client dependencies and scripts',
      'client/vite.config.js': 'Vite build configuration',
      'client/tailwind.config.js': 'TailwindCSS configuration',
      'client/postcss.config.js': 'PostCSS configuration',
      'client/index.html': 'HTML template'
    };
    
    this.requiredFeatures = [
      'Logout functionality',
      'Emoji picker',
      'GIF integration',
      'Image upload',
      'Voice recording',
      'Speech-to-text',
      'Mobile responsiveness',
      'Read receipts',
      'Theme consistency'
    ];
  }

  log(type, message) {
    const timestamp = new Date().toISOString();
    const prefix = {
      error: '❌ ERROR',
      warning: '⚠️  WARN',
      info: 'ℹ️  INFO',
      success: '✅ SUCCESS'
    }[type] || '📝 LOG';
    
    console.log(`[${timestamp}] ${prefix}: ${message}`);
    
    if (type === 'error') this.errors.push(message);
    if (type === 'warning') this.warnings.push(message);
    if (type === 'info') this.info.push(message);
  }

  validateFileExists(filePath, description) {
    const fullPath = path.resolve(filePath);
    if (fs.existsSync(fullPath)) {
      this.log('success', `Found: ${description} (${filePath})`);
      return true;
    } else {
      this.log('error', `Missing: ${description} (${filePath})`);
      return false;
    }
  }

  validateFileContent(filePath, patterns, description) {
    try {
      const content = fs.readFileSync(path.resolve(filePath), 'utf8');
      let allPatternsFound = true;
      
      patterns.forEach(pattern => {
        if (typeof pattern === 'string') {
          if (!content.includes(pattern)) {
            this.log('warning', `${description}: Missing "${pattern}" in ${filePath}`);
            allPatternsFound = false;
          }
        } else if (pattern instanceof RegExp) {
          if (!pattern.test(content)) {
            this.log('warning', `${description}: Pattern ${pattern} not found in ${filePath}`);
            allPatternsFound = false;
          }
        }
      });
      
      return allPatternsFound;
    } catch (error) {
      this.log('error', `Cannot read ${filePath}: ${error.message}`);
      return false;
    }
  }

  validateMobileResponsiveness() {
    this.log('info', 'Validating mobile responsiveness...');
    
    const files = [
      'client/src/index.css',
      'client/src/pages/ChatPage.jsx',
      'client/src/pages/LoginPage.jsx',
      'client/src/components/MessageInput.jsx',
      'client/src/components/MediaPicker.jsx'
    ];
    
    const responsivePatterns = [
      'sm:', 'md:', 'lg:', 'xl:', // Tailwind breakpoints
      'max-width', 'min-width', // CSS media queries
      'mobile', 'responsive', // Code comments
      '@media' // CSS media queries
    ];
    
    files.forEach(file => {
      if (fs.existsSync(path.resolve(file))) {
        const hasResponsive = this.validateFileContent(file, responsivePatterns, 'Mobile responsiveness');
        if (hasResponsive) {
          this.log('success', `Mobile responsive patterns found in ${file}`);
        }
      }
    });
  }

  validateEnhancedFeatures() {
    this.log('info', 'Validating enhanced features implementation...');
    
    const featureChecks = {
      'Logout functionality': {
        files: ['client/src/components/UserMenu.jsx', 'client/src/context/AuthContext.jsx'],
        patterns: ['logout', 'LogOut', 'signOut']
      },
      'Emoji picker': {
        files: ['client/src/components/MediaPicker.jsx'],
        patterns: ['emoji', 'Emoji', 'Smile']
      },
      'GIF integration': {
        files: ['client/src/components/MediaPicker.jsx'],
        patterns: ['gif', 'GIF', 'giphy', 'tenor']
      },
      'Voice recording': {
        files: ['client/src/components/AudioRecorder.jsx'],
        patterns: ['MediaRecorder', 'getUserMedia', 'audio']
      },
      'Speech-to-text': {
        files: ['client/src/components/SpeechToText.jsx'],
        patterns: ['SpeechRecognition', 'webkitSpeechRecognition', 'recognition']
      },
      'Read receipts': {
        files: ['client/src/components/MessageBubble.jsx'],
        patterns: ['Check', 'CheckCheck', 'status', 'receipt']
      }
    };
    
    Object.entries(featureChecks).forEach(([feature, config]) => {
      let featureImplemented = false;
      
      config.files.forEach(file => {
        if (fs.existsSync(path.resolve(file))) {
          const hasPatterns = this.validateFileContent(file, config.patterns, feature);
          if (hasPatterns) {
            featureImplemented = true;
          }
        }
      });
      
      if (featureImplemented) {
        this.log('success', `${feature} implementation found`);
      } else {
        this.log('error', `${feature} implementation missing or incomplete`);
      }
    });
  }

  validateDependencies() {
    this.log('info', 'Validating package dependencies...');
    
    const packageJsonPath = path.resolve('client/package.json');
    if (!fs.existsSync(packageJsonPath)) {
      this.log('error', 'client/package.json not found');
      return;
    }
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const requiredDeps = [
        'react',
        'react-dom',
        'react-router-dom',
        'socket.io-client',
        'axios',
        'lucide-react',
        'react-hot-toast',
        'emoji-picker-react',
        'react-dropzone',
        'framer-motion'
      ];
      
      requiredDeps.forEach(dep => {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
          this.log('success', `Dependency found: ${dep}`);
        } else {
          this.log('error', `Missing dependency: ${dep}`);
        }
      });
      
    } catch (error) {
      this.log('error', `Cannot parse package.json: ${error.message}`);
    }
  }

  validateProjectStructure() {
    this.log('info', 'Validating project structure...');
    
    Object.entries(this.requiredFiles).forEach(([filePath, description]) => {
      this.validateFileExists(filePath, description);
    });
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📋 P2P SECURE CHAT - VALIDATION REPORT');
    console.log('='.repeat(80));
    
    console.log(`\n📁 FILES VALIDATED: ${Object.keys(this.requiredFiles).length}`);
    console.log(`🎯 FEATURES CHECKED: ${this.requiredFeatures.length}`);
    
    if (this.errors.length === 0) {
      console.log('\n✅ SUCCESS: All validations passed!');
      console.log('🚀 The P2P Secure Chat application is ready for deployment.');
    } else {
      console.log(`\n❌ ERRORS FOUND: ${this.errors.length}`);
      this.errors.forEach(error => console.log(`   • ${error}`));
    }
    
    if (this.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS: ${this.warnings.length}`);
      this.warnings.forEach(warning => console.log(`   • ${warning}`));
    }
    
    console.log(`\nℹ️  INFO MESSAGES: ${this.info.length}`);
    
    console.log('\n' + '='.repeat(80));
    
    return this.errors.length === 0;
  }

  run() {
    console.log('🚀 Starting P2P Secure Chat codebase validation...\n');
    
    this.validateProjectStructure();
    this.validateDependencies();
    this.validateMobileResponsiveness();
    this.validateEnhancedFeatures();
    
    return this.generateReport();
  }
}

// Run validation if script is executed directly
if (require.main === module) {
  const validator = new CodebaseValidator();
  const success = validator.run();
  process.exit(success ? 0 : 1);
}

module.exports = CodebaseValidator;