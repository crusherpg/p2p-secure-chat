/**
 * User Controller for settings updates
 */
import User from '../models/User.js';
import { validationResult } from 'express-validator';

export const updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success:false, message: 'Invalid input', errors: errors.array() });
  }
  try {
    const userId = req.user.id;
    const { username, preferences } = req.body;

    const update = {};
    if (username) update.username = username.trim();
    if (preferences) {
      update['preferences.theme'] = preferences.theme ?? undefined;
      update['preferences.notifications'] = preferences.notifications ?? undefined;
    }

    const cleaned = Object.fromEntries(Object.entries(update).filter(([_,v]) => v !== undefined));

    const user = await User.findByIdAndUpdate(userId, { $set: cleaned }, { new: true }).select('-password -totpSecret -backupCodes -sessions');
    return res.json({ success:true, message:'Profile updated', user });
  } catch (e) {
    return res.status(500).json({ success:false, message:'Failed to update profile' });
  }
};

export const updatePrivacy = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success:false, message: 'Invalid input', errors: errors.array() });
  }
  try {
    const userId = req.user.id;
    const { preferences, totpEnabled } = req.body;

    const update = {};
    if (preferences) {
      update['preferences.readReceipts'] = preferences.readReceipts ?? undefined;
      update['preferences.typingIndicators'] = preferences.typingIndicators ?? undefined;
    }

    // We don't fully enable/disable TOTP here without verification flow; we just reflect desired state for UI.
    if (typeof totpEnabled === 'boolean') {
      update['totpEnabled'] = totpEnabled;
    }

    const cleaned = Object.fromEntries(Object.entries(update).filter(([_,v]) => v !== undefined));

    const user = await User.findByIdAndUpdate(userId, { $set: cleaned }, { new: true }).select('-password -totpSecret -backupCodes -sessions');
    return res.json({ success:true, message:'Privacy settings updated', user });
  } catch (e) {
    return res.status(500).json({ success:false, message:'Failed to update privacy settings' });
  }
};

export default { updateProfile, updatePrivacy };