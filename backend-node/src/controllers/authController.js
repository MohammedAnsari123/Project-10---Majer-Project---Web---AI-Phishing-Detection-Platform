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

    const { data: newUser, error } = await supabase
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

    if (error) {
      throw error;
    }

    res.status(201).json({
      success: true,
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
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

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  setupTfa,
  verifyTfa,
  loginVerifyTfa
};
