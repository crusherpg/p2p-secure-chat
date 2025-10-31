# P2P Secure Chat 🔒

A self-hosted, end-to-end encrypted chat application built with the MERN stack, providing Signal-grade security while being completely owned and controlled by you.

![P2P Chat Banner](https://img.shields.io/badge/P2P-Secure%20Chat-blue?style=for-the-badge)
![Security](https://img.shields.io/badge/Security-E2E%20Encrypted-green?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-MERN-orange?style=for-the-badge)

## 🌟 Features

### 🔐 Security First
- **End-to-End Encryption** with AES-256-GCM
- **Two-Factor Authentication** (TOTP/Google Authenticator)
- **Argon2id Password Hashing**
- **Forward Secrecy** with key rotation
- **Zero Knowledge Architecture**

### 💬 Modern Chat Experience
- **Real-time Messaging** with WebSocket
- **File Sharing** with encryption
- **Typing Indicators** and read receipts
- **Mobile Responsive** design
- **Dark/Light Mode** support

### 🏠 Self-Hosted
- **Complete Data Ownership**
- **No Third-Party Dependencies**
- **AWS EC2 Deployment Ready**
- **Docker Support** (coming soon)
- **Horizontal Scaling** capable

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB 6.0+
- Git

### 1. Clone Repository
```bash
git clone https://github.com/crusherpg/p2p-secure-chat.git
cd p2p-secure-chat
```

### 2. Install Dependencies
```bash
npm run install:all
```

### 3. Environment Setup
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. Start Development
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## 📁 Project Structure

```
p2p-secure-chat/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Main application pages
│   │   ├── context/       # React context providers
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API and WebSocket services
│   │   └── utils/         # Crypto and utility functions
│   └── package.json
├── server/                # Node.js backend
│   ├── config/           # Database and environment config
│   ├── controllers/      # Route controllers
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── middleware/      # Authentication & security middleware
│   ├── sockets/         # Socket.io handlers
│   ├── utils/           # Server utilities
│   └── server.js        # Main server file
├── nginx/               # Nginx configuration
├── scripts/             # Deployment scripts
└── docs/               # Documentation
```

## 🔧 Technology Stack

### Frontend
- **React 18** with Vite
- **TailwindCSS** for styling
- **Socket.io Client** for real-time communication
- **Web Crypto API** for encryption

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **Socket.io** for WebSocket communication
- **JWT** for authentication
- **Argon2** for password hashing
- **Speakeasy** for TOTP 2FA

### Security
- **AES-256-GCM** encryption
- **ECDH** key exchange
- **Argon2id** password hashing
- **Rate limiting** and DDoS protection
- **HTTPS** with HSTS headers

## 🌐 Deployment

### AWS EC2 (Ubuntu 24.04 LTS)

1. **Launch EC2 Instance**
   ```bash
   # t3.micro (free tier eligible)
   # Allow ports: 22, 80, 443
   ```

2. **Install Dependencies**
   ```bash
   sudo apt update && sudo apt install -y nodejs npm mongodb nginx certbot python3-certbot-nginx
   ```

3. **Clone and Build**
   ```bash
   git clone https://github.com/crusherpg/p2p-secure-chat.git
   cd p2p-secure-chat
   npm run install:all
   npm run build
   ```

4. **Configure Nginx**
   ```bash
   sudo cp nginx/p2p.conf /etc/nginx/sites-available/
   sudo ln -s /etc/nginx/sites-available/p2p.conf /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl restart nginx
   ```

5. **SSL with Let's Encrypt**
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

6. **Start with PM2**
   ```bash
   npm install -g pm2
   pm2 start ecosystem.config.js --env production
   pm2 startup && pm2 save
   ```

See [deployment guide](docs/deployment-guide.md) for detailed instructions.

## 🔒 Security Features

### Encryption
- **Client-side encryption** - Messages encrypted before leaving your device
- **AES-256-GCM** - Industry standard encryption algorithm
- **Unique keys** - Each conversation has its own encryption keys
- **Forward secrecy** - Past messages remain secure even if keys are compromised

### Authentication
- **Multi-factor authentication** - Email + Password + TOTP
- **Secure session management** - JWT tokens with proper configuration
- **Account security** - Rate limiting, account lockout, secure password reset

### Infrastructure
- **Self-hosted** - Complete control over your data
- **Database security** - MongoDB with authentication and localhost binding
- **Network security** - HTTPS only, security headers, rate limiting
- **File security** - Encrypted file storage and transmission

## 📚 Documentation

- [Deployment Guide](docs/deployment-guide.md)
- [Security Implementation](docs/security-implementation.md)
- [API Documentation](docs/api-documentation.md)
- [Security Testing](docs/security-testing.md)

## 🧪 Testing

### Run Tests
```bash
# Server tests
cd server && npm test

# Security audit
npm run security:audit

# Load testing
npm run test:load
```

### Security Checklist
- [ ] Password complexity requirements
- [ ] 2FA setup and verification
- [ ] Message encryption/decryption
- [ ] File upload security
- [ ] Rate limiting effectiveness
- [ ] SSL/TLS configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow security best practices
- Write comprehensive tests
- Update documentation
- Maintain backwards compatibility

## 🛡️ Security

### Reporting Vulnerabilities
Please report security vulnerabilities privately via:
- Email: security@your-domain.com
- GitHub Security Advisories

### Security Audit
This application undergoes regular security audits. Latest audit: [View Report](docs/security-audit.md)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Signal Protocol** - Inspiration for encryption implementation
- **OWASP** - Security guidelines and best practices
- **MongoDB** - Database security recommendations
- **Let's Encrypt** - Free SSL certificates

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/crusherpg/p2p-secure-chat/issues)
- **Discussions**: [GitHub Discussions](https://github.com/crusherpg/p2p-secure-chat/discussions)

---

**⚠️ Security Notice**: This application implements strong security measures, but no system is 100% secure. Regular security updates, monitoring, and following best practices are essential for production deployment.

**🔐 Privacy First**: Your messages, your data, your control. P2P Secure Chat puts privacy and security at the forefront of digital communication.