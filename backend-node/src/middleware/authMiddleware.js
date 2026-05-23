const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeyforphishguard123!');

      const { data: user, error } = await supabase
        .from('users')
        .select('id, name, email, role, status')
        .eq('id', decoded.id)
        .single();

      if (error || !user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }

      if (user.status === 'SUSPENDED') {
        return res.status(403).json({ success: false, message: 'Your account has been suspended' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Access denied, admin role required' });
  }
};

module.exports = { protect, adminOnly };
