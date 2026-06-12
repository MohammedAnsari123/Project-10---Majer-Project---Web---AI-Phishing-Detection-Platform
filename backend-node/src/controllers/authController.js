const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwtkeyforphishguard123!', {
    expiresIn: '30d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please fill in all fields' });
  }

  try {
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userRole = role === 'ADMIN' ? 'ADMIN' : 'USER';

    const verificationToken = require('crypto').randomBytes(20).toString('hex');

    let newUser;
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            name,
            email,
            password: hashedPassword,
            role: userRole,
            status: 'ACTIVE',
            verification_token: verificationToken,
            is_verified: false
          }
        ])
        .select('id, name, email, role, status, is_verified, verification_token')
        .single();

      if (error) throw error;
      newUser = data;
    } catch (dbErr) {
      console.warn('Extended columns missing, falling back to basic registration:', dbErr.message);
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            name,
            email,
            password: hashedPassword,
            role: userRole,
            status: 'ACTIVE'
          }
        ])
        .select('id, name, email, role, status')
        .single();

      if (error) throw error;
      newUser = {
        ...data,
        is_verified: false,
        verification_token: verificationToken
      };
    }

    res.status(201).json({
      success: true,
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        is_verified: newUser.is_verified,
        verification_token: newUser.verification_token,
        token: signToken(newUser.id)
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Login user / admin
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // 2FA check
    if (user.tfa_enabled) {
      const tempToken = jwt.sign(
        { id: user.id, tfa_temp: true },
        process.env.JWT_SECRET || 'supersecretjwtkeyforphishguard123!',
        { expiresIn: '5m' }
      );
      return res.json({
        success: true,
        tfaRequired: true,
        tempToken
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        token: signToken(user.id)
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  res.json({
    success: true,
    data: req.user
  });
};

// @desc    Setup 2FA QR code
// @route   POST /api/auth/tfa/setup
// @access  Private
const setupTfa = async (req, res) => {
  try {
    const userId = req.user.id;
    const secret = speakeasy.generateSecret({
      name: `SentinelScan AI (${req.user.email})`
    });

    const { error } = await supabase
      .from('users')
      .update({ tfa_secret: secret.base32 })
      .eq('id', userId);

    if (error) throw error;

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      success: true,
      secret: secret.base32,
      qrCode: qrCodeUrl
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Verify 2FA token to enable permanently
// @route   POST /api/auth/tfa/verify
// @access  Private
const verifyTfa = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Verification code is required' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('tfa_secret')
      .eq('id', userId)
      .single();

    if (error || !user || !user.tfa_secret) {
      return res.status(400).json({ success: false, message: '2FA Setup not initialized' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.tfa_secret,
      encoding: 'base32',
      token: code,
      window: 1
    });

    if (!verified) {
      return res.status(400).json({ success: false, message: 'Invalid 2FA token code' });
    }

    await supabase
      .from('users')
      .update({ tfa_enabled: true })
      .eq('id', userId);

    res.json({ success: true, message: 'Two-Factor Authentication activated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Verify 2FA token during login flow
// @route   POST /api/auth/tfa/login-verify
// @access  Public
const loginVerifyTfa = async (req, res) => {
  try {
    const { tempToken, code } = req.body;

    if (!tempToken || !code) {
      return res.status(400).json({ success: false, message: 'tempToken and code are required' });
    }

    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'supersecretjwtkeyforphishguard123!');
    if (!decoded.tfa_temp) {
      return res.status(401).json({ success: false, message: 'Invalid temp token session' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'User verification failed' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.tfa_secret,
      encoding: 'base32',
      token: code,
      window: 1
    });

    if (!verified) {
      return res.status(400).json({ success: false, message: 'Invalid 2FA token code' });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        token: signToken(user.id)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Verification failed: ' + err.message });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }
  try {
    const token = require('crypto').randomBytes(20).toString('hex');
    const expires = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    const { data, error } = await supabase
      .from('users')
      .update({ reset_password_token: token, reset_password_expires: expires })
      .eq('email', email)
      .select();

    if (error || !data || data.length === 0) {
      return res.status(400).json({ success: false, message: 'User not found or database update failed' });
    }

    // Capture activity log
    await supabase.from('activity_logs').insert([{ user_id: data[0].id, user_email: email, activity: 'Password Reset Request' }]);

    res.json({
      success: true,
      message: 'Password reset link simulated successfully',
      token // return token for easy testing/prototyping
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ success: false, message: 'Token and new password are required' });
  }
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('reset_password_token', token);

    if (error || !users || users.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    const user = users[0];
    if (new Date() > new Date(user.reset_password_expires)) {
      return res.status(400).json({ success: false, message: 'Password reset token expired' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await supabase
      .from('users')
      .update({
        password: hashedPassword,
        reset_password_token: null,
        reset_password_expires: null
      })
      .eq('id', user.id);

    // Capture activity log
    await supabase.from('activity_logs').insert([{ user_id: user.id, user_email: user.email, activity: 'Password Reset Successful' }]);

    res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const verifyEmail = async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, message: 'Token is required' });
  }
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ is_verified: true, verification_token: null })
      .eq('verification_token', token)
      .select();

    if (error || !data || data.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid verification token' });
    }

    // Capture activity log
    await supabase.from('activity_logs').insert([{ user_id: data[0].id, user_email: data[0].email, activity: 'Email Verified' }]);

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateProfile = async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ name })
      .eq('id', req.user.id)
      .select('id, name, email, role, status')
      .single();

    if (error) throw error;

    // Capture activity log
    await supabase.from('activity_logs').insert([{ user_id: req.user.id, user_email: req.user.email, activity: 'Profile Update' }]);

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Old and new passwords are required' });
  }
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect old password' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', req.user.id);

    // Capture activity log
    await supabase.from('activity_logs').insert([{ user_id: req.user.id, user_email: req.user.email, activity: 'Change Password' }]);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  setupTfa,
  verifyTfa,
  loginVerifyTfa,
  forgotPassword,
  resetPassword,
  verifyEmail,
  updateProfile,
  changePassword
};
