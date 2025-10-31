const User = require('../models/User');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const { validationResult } = require('express-validator');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '24h',
    issuer: 'P2P-Chat',
    audience: 'P2P-Client'
  });
};

// Generate backup codes
const generateBackupCodes = () => {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    codes.push({
      code: crypto.randomBytes(4).toString('hex').toUpperCase(),
      used: false
    });
  }
  return codes;
};

// Register new user
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, username, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({
      email,
      username,
      password
    });

    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    console.log(`🎉 New user registered: ${username} (${email})`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        totpEnabled: user.totpEnabled
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, totpCode } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check TOTP if enabled
    if (user.totpEnabled) {
      if (!totpCode) {
        return res.status(200).json({
          success: false,
          requiresTOTP: true,
          message: 'TOTP code required'
        });
      }

      const verified = speakeasy.totp.verify({
        secret: user.totpSecret,
        encoding: 'base32',
        token: totpCode,
        window: 2
      });

      if (!verified) {
        return res.status(401).json({ message: 'Invalid TOTP code' });
      }
    }

    // Update user status
    user.status = 'online';
    user.lastSeen = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    // Store session information
    const sessionInfo = {
      token: token.substring(0, 20) + '...',
      device: req.headers['user-agent'] || 'Unknown',
      ipAddress: req.ip,
      lastActive: new Date()
    };
    
    user.sessions.push(sessionInfo);
    await user.cleanExpiredSessions();

    console.log(`🔐 User logged in: ${user.username}`);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        status: user.status,
        totpEnabled: user.totpEnabled,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Setup TOTP
exports.setupTOTP = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (user.totpEnabled) {
      return res.status(400).json({ message: 'TOTP already enabled' });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `P2P Secure Chat (${user.email})`,
      issuer: 'P2P Secure Chat'
    });

    // Temporarily store the secret
    user.totpSecret = secret.base32;
    await user.save();

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    console.log(`🔑 TOTP setup initiated for: ${user.username}`);

    res.json({
      success: true,
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntry: secret.base32
    });
  } catch (error) {
    console.error('❌ TOTP setup error:', error);
    res.status(500).json({ message: 'Server error during TOTP setup' });
  }
};

// Verify and enable TOTP
exports.verifyTOTP = async (req, res) => {
  try {
    const { totpCode } = req.body;
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user.totpSecret) {
      return res.status(400).json({ message: 'TOTP not set up' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: 'base32',
      token: totpCode,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid TOTP code' });
    }

    // Enable TOTP and generate backup codes
    user.totpEnabled = true;
    user.backupCodes = generateBackupCodes();
    await user.save();

    console.log(`✅ TOTP enabled for: ${user.username}`);

    res.json({
      success: true,
      message: 'TOTP enabled successfully',
      backupCodes: user.backupCodes.map(bc => bc.code)
    });
  } catch (error) {
    console.error('❌ TOTP verification error:', error);
    res.status(500).json({ message: 'Server error during TOTP verification' });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    // Update user status
    user.status = 'offline';
    user.lastSeen = new Date();
    
    // Remove current session
    const authToken = req.headers.authorization?.split(' ')[1];
    if (authToken) {
      const tokenPrefix = authToken.substring(0, 20) + '...';
      user.sessions = user.sessions.filter(session => session.token !== tokenPrefix);
    }

    await user.save();

    console.log(`👋 User logged out: ${user.username}`);

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('-password -totpSecret -sessions');

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({ message: 'Server error getting profile' });
  }
};