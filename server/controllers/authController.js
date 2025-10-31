/**
 * Authenticate user login with 2FA support
 * @route POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    // Validate input
    const validationError = validateInput(req, res);
    if (validationError) return;

    const { email, password, totpCode } = req.body;

    // Find user with case-insensitive email
    const user = await User.findOne({ 
      email: email.toLowerCase().trim() 
    }).select('+password +totpSecret +backupCodes +sessions');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Verify password with Argon2
    const isPasswordValid = await argon2.verify(user.password, password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check TOTP if enabled
    if (user.totpEnabled) {
      if (!totpCode) {
        return res.status(200).json({ success: false, requiresTOTP: true, message: '2FA verification required' });
      }

      const verified = speakeasy.totp.verify({ secret: user.totpSecret, encoding: 'base32', token: String(totpCode).replace(/\s/g, ''), window: 2 });
      if (!verified) {
        return res.status(401).json({ success: false, message: 'Invalid 2FA code' });
      }
    }

    // Initialize sessions
    if (!Array.isArray(user.sessions)) user.sessions = [];

    // Compute a safe IP string (avoid failing validation on proxies/IPv6 forms)
    const rawIp = (req.headers['x-forwarded-for']?.split(',')[0] || req.ip || req.connection?.remoteAddress || '').toString();
    // Normalize common IPv6 localhost to 127.0.0.1; fallback to empty string if still invalid
    const ipAddress = (rawIp === '::1' || rawIp === '::ffff:127.0.0.1') ? '127.0.0.1' : rawIp;

    // Update user status and add session
    const newToken = generateToken(user._id.toString());
    user.status = 'online';
    user.lastSeen = new Date();
    user.sessions.push({
      token: newToken.substring(0, 20) + '...',
      device: req.headers['user-agent'] || 'Unknown Device',
      // Do NOT block login on IP validation — store only if it matches our regex, else omit
      ipAddress: ipAddress,
      lastActive: new Date()
    });

    try {
      await user.save();
    } catch (err) {
      // If IP format triggers validation error, retry save without the IP
      if (err?.message?.includes('Invalid IP address format')) {
        user.sessions[user.sessions.length - 1].ipAddress = '';
        await user.save();
      } else {
        throw err;
      }
    }

    if (typeof user.cleanExpiredSessions === 'function') {
      await user.cleanExpiredSessions();
    }

    console.log(`🔐 User logged in: ${user.username}`, { ip: ipAddress });

    return res.json({
      success: true,
      message: `Welcome back, ${user.username}!`,
      token: newToken,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        status: 'online',
        totpEnabled: user.totpEnabled,
        preferences: user.preferences,
        lastSeen: user.lastSeen
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    return res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};
