# P2P Secure Chat 🔒

[![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)](https://github.com/crusherpg/p2p-secure-chat)
[![Node.js](https://img.shields.io/badge/node.js-%3E%3D18.0.0-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A modern, secure, self-hosted chat application with end-to-end encryption, two-factor authentication, and rich media support. Built with the latest 2025 coding standards and best practices.

## 🎉 **NEW in v1.1.0 - Enhanced Features**

✨ **Latest Updates:**
- ✅ **Complete logout functionality** with secure session cleanup
- ✅ **Rich media support** - Emojis, GIFs, Images, and Voice messages  
- ✅ **Speech-to-text integration** with real-time transcription
- ✅ **Mobile-responsive design** with touch-optimized interfaces
- ✅ **Enhanced read receipts** with clear status indicators
- ✅ **2025 coding standards** with ES modules and modern Node.js features

## 🚀 **Quick Start**

### Prerequisites
- **Node.js** 18+ and npm 8+
- **MongoDB** 6.0+ (local or cloud)
- **Git**

### 1. Clone Repository
```bash
git clone https://github.com/crusherpg/p2p-secure-chat.git
cd p2p-secure-chat
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
nano .env  # or your preferred editor
```

**Required Environment Variables:**
```env
# CRITICAL: Generate a strong JWT secret (32+ characters)
JWT_SECRET=your-super-secure-jwt-secret-key-change-this-in-production-minimum-32-chars

# Database connection
MONGO_URI=mongodb://localhost:27017/p2p_chat

# Server configuration
PORT=3000
FRONTEND_URL=http://localhost:5173
```

### 3. Install Dependencies
```bash
# Install all dependencies (client + server)
npm run install:all

# Or install individually:
# cd server && npm install
# cd ../client && npm install
```

### 4. Start Development
```bash
# Start both client and server in development mode
npm run dev

# Or start individually:
# Terminal 1: cd server && npm run dev
# Terminal 2: cd client && npm run dev
```

### 5. Access Application
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Health Check:** http://localhost:3000/health

## 🎯 **Features**

### 🔐 **Security First**
- **End-to-End Encryption**: AES-256-GCM encryption for all messages
- **Two-Factor Authentication**: TOTP support with Google Authenticator
- **Argon2 Password Hashing**: Industry standard 2025 password security
- **JWT Authentication**: Secure token-based authentication
- **Session Management**: Comprehensive session tracking and cleanup
- **Rate Limiting**: DDoS protection and abuse prevention
- **Input Validation**: Comprehensive sanitization and validation

### 📨 **Rich Messaging**
- **Text Messages**: Real-time encrypted messaging
- **Emoji Support**: Comprehensive emoji picker with categories
- **GIF Integration**: Search and send GIFs from Tenor
- **Image Sharing**: Drag-and-drop image uploads with preview
- **Voice Messages**: Record and send audio messages with waveform
- **File Attachments**: Secure file sharing (up to 25MB)
- **Read Receipts**: Clear delivery and read status indicators
- **Typing Indicators**: Real-time typing status

### 🎤 **Advanced Features**
- **Speech-to-Text**: Convert voice to text using Web Speech API
- **Real-time Communication**: WebSocket-based instant messaging
- **Mobile Responsive**: Touch-optimized interface for all devices
- **Dark/Light Theme**: Beautiful themes with system preference detection
- **Online Status**: Real-time user presence indicators
- **Message History**: Encrypted message storage and retrieval

### 📱 **Mobile Optimized**
- **Touch Controls**: Optimized for mobile interactions
- **Responsive Design**: Adapts to all screen sizes
- **Bottom Sheet UI**: Mobile-friendly media pickers
- **Gesture Support**: Intuitive touch gestures
- **PWA Ready**: Progressive Web App capabilities

## 🔧 **Technology Stack**

### **Frontend (Client)**
- **React 18** - Modern React with hooks and concurrent features
- **Vite** - Lightning fast build tool and dev server
- **TailwindCSS** - Utility-first CSS framework with dark mode
- **Socket.io Client** - Real-time communication
- **Framer Motion** - Smooth animations and transitions
- **Web Speech API** - Native browser speech recognition
- **Modern Dependencies** (2025 standards):
  - `emoji-picker-react` - Emoji selection
  - `react-dropzone` - File upload handling
  - `react-hot-toast` - Beautiful notifications
  - `lucide-react` - Modern icon library

### **Backend (Server)**
- **Node.js 18+** - Modern JavaScript runtime with ES modules
- **Express.js** - Fast, unopinionated web framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **Socket.io** - Real-time bidirectional communication
- **Security Stack** (2025 standards):
  - `argon2` - Password hashing
  - `helmet` - Security headers
  - `express-rate-limit` - Rate limiting
  - `express-validator` - Input validation
  - `cors` - Cross-origin resource sharing
  - `winston` - Advanced logging

## 🛠️ **API Documentation**

### **Authentication Endpoints**
```
POST /api/auth/register     # Register new user
POST /api/auth/login        # User login
POST /api/auth/logout       # Secure logout
GET  /api/auth/profile      # Get user profile
POST /api/auth/totp/setup   # Setup 2FA
POST /api/auth/totp/verify  # Verify 2FA code
```

### **User Management**
```
GET  /api/users             # Get user list
GET  /api/users/online      # Get online users
PUT  /api/users/profile     # Update profile
PUT  /api/users/status      # Update online status
```

### **Messaging**
```
GET  /api/messages/conversations    # Get conversations
GET  /api/messages/conversation/:id # Get messages
POST /api/messages/send            # Send message
PUT  /api/messages/:id/status      # Update message status
```

## 📱 **Mobile Setup**

The application is fully responsive and mobile-optimized:

### **Features on Mobile**
- Touch-optimized controls
- Bottom sheet interfaces
- Voice recording with haptic feedback
- Mobile keyboard optimization
- Gesture-friendly interactions
- PWA installation support

### **Testing on Mobile**
1. Start the development server
2. Access via your mobile device: `http://YOUR_IP:5173`
3. Add to home screen for PWA experience

## 🔒 **Security Configuration**

### **Environment Security Checklist**
- ✅ Generate strong JWT_SECRET (32+ characters)
- ✅ Use strong MongoDB credentials
- ✅ Enable MongoDB authentication
- ✅ Configure proper CORS origins
- ✅ Set up rate limiting
- ✅ Use HTTPS in production

### **JWT Secret Generation**
```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use online generator (for development only)
# For production, always generate locally
```

## 🚀 **Production Deployment**

### **Environment Setup**
```env
NODE_ENV=production
JWT_SECRET=your-production-jwt-secret-32-plus-characters
MONGO_URI=mongodb://username:password@host:port/database
FRONTEND_URL=https://your-domain.com
PORT=3000
```

### **Build and Deploy**
```bash
# Build client for production
cd client && npm run build

# Start production server
cd ../server && npm start
```

### **Docker Deployment**
```bash
# Build Docker image
docker build -t p2p-secure-chat .

# Run container
docker run -d -p 3000:3000 --env-file .env p2p-secure-chat
```

## 🔍 **Troubleshooting**

### **Common Issues**

#### ❌ **"secretOrPrivateKey must have a value"**
```bash
# This error occurs when JWT_SECRET is not set or too short
# Solution: Set a strong JWT_SECRET in your .env file
JWT_SECRET=your-super-secure-jwt-secret-key-minimum-32-characters-long
```

#### ❌ **MongoDB Connection Failed**
```bash
# Check MongoDB is running
mongodb --version
sudo systemctl status mongod  # Linux
brew services list | grep mongodb  # macOS

# Verify connection string in .env
MONGO_URI=mongodb://localhost:27017/p2p_chat
```

#### ❌ **CORS Errors**
```bash
# Ensure FRONTEND_URL matches your client URL
FRONTEND_URL=http://localhost:5173
```

#### ❌ **Port Already in Use**
```bash
# Find process using port
lsof -i :3000
# Kill process
kill -9 <PID>
# Or change port in .env
PORT=3001
```

### **Development Tips**
- Enable detailed logging: `ENABLE_LOGGING=true`
- Check health endpoint: `curl http://localhost:3000/health`
- Monitor logs in `server/logs/` directory
- Use browser dev tools for client-side debugging

## 🤝 **Contributing**

### **Development Setup**
```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/p2p-secure-chat.git

# Create feature branch
git checkout -b feature/amazing-feature

# Install dependencies and start development
npm run install:all
npm run dev
```

### **Code Standards**
- **ES2025 Modules**: Use import/export syntax
- **Async/Await**: Modern async patterns
- **JSDoc Comments**: Comprehensive documentation
- **Input Validation**: Validate all user inputs
- **Error Handling**: Comprehensive error handling
- **Security First**: Follow security best practices

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **Signal Protocol** - Inspiration for encryption implementation
- **Web Speech API** - Native browser speech recognition
- **Socket.io** - Real-time communication framework
- **OWASP** - Security guidelines and best practices
- **Node.js Security** - Modern security patterns

## 📞 **Support**

### **Get Help**
- 🐛 **Issues**: [GitHub Issues](https://github.com/crusherpg/p2p-secure-chat/issues)
- 📈 **Discussions**: [GitHub Discussions](https://github.com/crusherpg/p2p-secure-chat/discussions)
- 📧 **Security**: Report security issues privately

### **Quick Links**
- 📚 [API Documentation](docs/api.md)
- 🔒 [Security Guide](docs/security.md)
- 🚀 [Deployment Guide](docs/deployment.md)
- 📱 [Mobile Guide](docs/mobile.md)

---

**🔐 Privacy First**: Your messages, your data, your control. P2P Secure Chat puts privacy and security at the forefront of digital communication while providing modern, media-rich messaging capabilities with 2025 coding standards.

**Built with ❤️ using modern web technologies and security best practices.**