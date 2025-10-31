/**
 * Logout user and clean session
 * @route POST /api/auth/logout
 */
export const logout = async (req, res) => {
  try {
    const userId = req?.user?.id;

    // If middleware didn't populate req.user, still return success for idempotency
    if (!userId) {
      return res.json({ success: true, message: 'Logged out successfully' });
    }

    const user = await User.findById(userId).select('+sessions');

    if (user) {
      // Update user status
      user.status = 'offline';
      user.lastSeen = new Date();
      
      // Remove current session safely
      const authHeader = req.headers?.authorization || '';
      const authToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

      if (authToken && Array.isArray(user.sessions)) {
        const tokenPrefix = `${authToken.substring(0, 20)}...`;
        user.sessions = user.sessions.filter((session) => session?.token !== tokenPrefix);
      }

      await user.save();
      console.log(`👋 User logged out: ${user.username}`);
    }

    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('❌ Logout error:', error);
    // Always return success for logout to ensure client-side cleanup
    return res.json({ success: true, message: 'Logged out successfully' });
  }
};
