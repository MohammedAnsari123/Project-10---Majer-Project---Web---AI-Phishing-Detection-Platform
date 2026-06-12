const supabase = require('../config/supabase');

// GET /api/admin/dashboard
const getAdminDashboard = async (req, res) => {
  try {
    // 1. Get exact counts
    const { count: totalUsers, error: usersErr } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: totalUrlScans, error: urlScansErr } = await supabase
      .from('scan_history')
      .select('*', { count: 'exact', head: true });

    const { count: totalEmailScans, error: emailScansErr } = await supabase
      .from('email_scans')
      .select('*', { count: 'exact', head: true });

    const { count: highRiskUrls, error: highRiskUrlsErr } = await supabase
      .from('scan_history')
      .select('*', { count: 'exact', head: true })
      .eq('risk_level', 'HIGH');

    const { count: highRiskEmails, error: highRiskEmailsErr } = await supabase
      .from('email_scans')
      .select('*', { count: 'exact', head: true })
      .eq('risk_level', 'HIGH');

    if (usersErr || urlScansErr || emailScansErr || highRiskUrlsErr || highRiskEmailsErr) {
      console.error('Error fetching admin dashboard counts:', {
        usersErr, urlScansErr, emailScansErr, highRiskUrlsErr, highRiskEmailsErr
      });
    }

    const totalScans = (totalUrlScans || 0) + (totalEmailScans || 0);
    const highRiskScans = (highRiskUrls || 0) + (highRiskEmails || 0);
    const detectionRate = totalScans > 0 ? ((highRiskScans / totalScans) * 100).toFixed(1) + '%' : '0%';

    // 2. Get recent activity lists
    const { data: recentUsers } = await supabase
      .from('users')
      .select('id, name, email, role, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    const { data: recentUrlScans } = await supabase
      .from('scan_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    const { data: recentEmailScans } = await supabase
      .from('email_scans')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    const { data: recentReports } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers: totalUsers || 0,
          totalScans,
          highRiskScans,
          emailScans: totalEmailScans || 0,
          urlScans: totalUrlScans || 0,
          detectionRate
        },
        recentActivity: {
          users: recentUsers || [],
          urlScans: recentUrlScans || [],
          emailScans: recentEmailScans || [],
          reports: recentReports || []
        }
      }
    });

  } catch (error) {
    console.error('Admin dashboard controller error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role, status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all users for admin:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve users'
      });
    }

    return res.status(200).json({
      success: true,
      data: users || []
    });
  } catch (error) {
    console.error('Admin get users controller error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// PUT /api/admin/users/:id/status
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['ACTIVE', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user status'
      });
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({ status })
      .eq('id', id)
      .select('id, name, email, role, status')
      .single();

    if (error) {
      console.error('Error updating user status:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to update user status'
      });
    }

    // Capture Audit Log
    const { error: logErr } = await supabase
      .from('admin_audit_logs')
      .insert([
        {
          admin_id: req.user.id,
          admin_email: req.user.email,
          action: `USER_${status}`,
          target_user_id: id,
          details: {
            target_email: user.email,
            new_status: status
          }
        }
      ]);

    if (logErr) {
      console.error('Failed to log admin audit action:', logErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `User account is now ${status}`,
      data: user
    });
  } catch (error) {
    console.error('Admin update user status controller error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// GET /api/admin/audit-logs
const getAuditLogs = async (req, res) => {
  try {
    const { data: logs, error } = await supabase
      .from('admin_audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin audit logs:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve audit logs'
      });
    }

    return res.status(200).json({
      success: true,
      data: logs || []
    });
  } catch (error) {
    console.error('Admin get audit logs error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// GET /api/admin/logs
const getDetectionLogs = async (req, res) => {
  try {
    // Retrieve URL scan history
    const { data: urlScans, error: urlErr } = await supabase
      .from('scan_history')
      .select('*')
      .order('created_at', { ascending: false });

    // Retrieve Email scans
    const { data: emailScans, error: emailErr } = await supabase
      .from('email_scans')
      .select('*')
      .order('created_at', { ascending: false });

    if (urlErr || emailErr) {
      console.error('Error pulling logs from Supabase:', { urlErr, emailErr });
    }

    // Merge and format logs
    const urlLogs = (urlScans || []).map(item => ({
      id: item.id,
      user_email: item.user_email,
      scan_type: 'URL',
      content: item.content || item.url,
      risk_score: item.risk_score,
      risk_level: item.risk_level,
      result: item.result || item.status,
      country_code: item.country_code || 'US',
      country_name: item.country_name || 'United States',
      created_at: item.created_at
    }));

    const emailLogs = (emailScans || []).map(item => ({
      id: item.id,
      user_email: item.user_email,
      scan_type: 'EMAIL',
      content: item.content,
      risk_score: item.risk_score,
      risk_level: item.risk_level,
      result: item.result?.recommendation || 'Scanned',
      country_code: '',
      country_name: '',
      created_at: item.created_at
    }));

    // Sort by created_at descending
    const combinedLogs = [...urlLogs, ...emailLogs].sort((a, b) => {
      return new Date(b.created_at) - new Date(a.created_at);
    });

    return res.status(200).json({
      success: true,
      data: combinedLogs
    });

  } catch (error) {
    console.error('Admin get detection logs controller error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// Local in-memory databases to fall back if database tables are not migrated yet
let localKeywords = [
  { id: 'kw-1', keyword: 'verify your bank account', severity: 'HIGH', category: 'banking', created_at: new Date() },
  { id: 'kw-2', keyword: 'urgent password update', severity: 'HIGH', category: 'credentials', created_at: new Date() },
  { id: 'kw-3', keyword: 'hacked webcam video', severity: 'HIGH', category: 'extortion', created_at: new Date() },
  { id: 'kw-4', keyword: 'claims free rewards', severity: 'MEDIUM', category: 'scam', created_at: new Date() },
  { id: 'kw-5', keyword: 'metamask seed recovery', severity: 'HIGH', category: 'crypto', created_at: new Date() }
];

let localBlacklist = [
  { id: 'bl-1', domain_or_ip: 'scam-paypal-update.net', reason: 'Mimics official PayPal portal', created_at: new Date() },
  { id: 'bl-2', domain_or_ip: '104.21.34.115', reason: 'Known phishing hosting server', created_at: new Date() }
];

let localWhitelist = [
  { id: 'wl-1', domain_or_ip: 'google.com', reason: 'Search engine portal', created_at: new Date() },
  { id: 'wl-2', domain_or_ip: 'github.com', reason: 'Development workspace repository', created_at: new Date() }
];

// Keywords CRUD
const getKeywords = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('phishing_keywords')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    console.warn('Supabase phishing_keywords table missing. Falling back to local store.');
    res.json({ success: true, data: localKeywords });
  }
};

const addKeyword = async (req, res) => {
  const { keyword, severity, category } = req.body;
  if (!keyword) {
    return res.status(400).json({ success: false, message: 'Keyword is required' });
  }
  try {
    const { data, error } = await supabase
      .from('phishing_keywords')
      .insert([{ keyword, severity: severity || 'MEDIUM', category: category || 'general' }])
      .select()
      .single();
    if (error) throw error;

    await supabase.from('admin_audit_logs').insert([{
      admin_id: req.user.id,
      admin_email: req.user.email,
      action: 'ADD_KEYWORD',
      details: { keyword }
    }]);

    res.json({ success: true, data });
  } catch (err) {
    console.warn('Supabase keywords insert failed. Saving to local store.');
    const entry = {
      id: 'kw-' + Math.random().toString(36).substr(2, 9),
      keyword,
      severity: severity || 'MEDIUM',
      category: category || 'general',
      created_at: new Date()
    };
    localKeywords.unshift(entry);
    res.json({ success: true, data: entry });
  }
};

const deleteKeyword = async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('phishing_keywords')
      .delete()
      .eq('id', id);
    if (error) throw error;

    await supabase.from('admin_audit_logs').insert([{
      admin_id: req.user.id,
      admin_email: req.user.email,
      action: 'DELETE_KEYWORD',
      details: { id }
    }]);

    res.json({ success: true, message: 'Keyword deleted successfully' });
  } catch (err) {
    console.warn('Supabase delete failed. Removing from local store.');
    localKeywords = localKeywords.filter(kw => kw.id !== id);
    res.json({ success: true, message: 'Keyword deleted successfully (local fallback)' });
  }
};

// Blacklist/Whitelist CRUD
const getBlacklist = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('blacklist')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    console.warn('Supabase blacklist table missing. Using local store.');
    res.json({ success: true, data: localBlacklist });
  }
};

const addBlacklist = async (req, res) => {
  const { domain_or_ip, reason } = req.body;
  if (!domain_or_ip) {
    return res.status(400).json({ success: false, message: 'Domain or IP is required' });
  }
  try {
    const { data, error } = await supabase
      .from('blacklist')
      .insert([{ domain_or_ip, reason }])
      .select()
      .single();
    if (error) throw error;

    await supabase.from('admin_audit_logs').insert([{
      admin_id: req.user.id,
      admin_email: req.user.email,
      action: 'ADD_BLACKLIST',
      details: { domain_or_ip }
    }]);

    res.json({ success: true, data });
  } catch (err) {
    console.warn('Supabase blacklist insert failed. Saving to local store.');
    const entry = {
      id: 'bl-' + Math.random().toString(36).substr(2, 9),
      domain_or_ip,
      reason: reason || '',
      created_at: new Date()
    };
    localBlacklist.unshift(entry);
    res.json({ success: true, data: entry });
  }
};

const deleteBlacklist = async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('blacklist')
      .delete()
      .eq('id', id);
    if (error) throw error;

    await supabase.from('admin_audit_logs').insert([{
      admin_id: req.user.id,
      admin_email: req.user.email,
      action: 'DELETE_BLACKLIST',
      details: { id }
    }]);

    res.json({ success: true, message: 'Blacklist entry removed successfully' });
  } catch (err) {
    console.warn('Supabase blacklist delete failed. Removing from local store.');
    localBlacklist = localBlacklist.filter(bl => bl.id !== id);
    res.json({ success: true, message: 'Blacklist entry removed successfully (local fallback)' });
  }
};

const getWhitelist = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('whitelist')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    console.warn('Supabase whitelist table missing. Using local store.');
    res.json({ success: true, data: localWhitelist });
  }
};

const addWhitelist = async (req, res) => {
  const { domain_or_ip, reason } = req.body;
  if (!domain_or_ip) {
    return res.status(400).json({ success: false, message: 'Domain or IP is required' });
  }
  try {
    const { data, error } = await supabase
      .from('whitelist')
      .insert([{ domain_or_ip, reason }])
      .select()
      .single();
    if (error) throw error;

    await supabase.from('admin_audit_logs').insert([{
      admin_id: req.user.id,
      admin_email: req.user.email,
      action: 'ADD_WHITELIST',
      details: { domain_or_ip }
    }]);

    res.json({ success: true, data });
  } catch (err) {
    console.warn('Supabase whitelist insert failed. Saving to local store.');
    const entry = {
      id: 'wl-' + Math.random().toString(36).substr(2, 9),
      domain_or_ip,
      reason: reason || '',
      created_at: new Date()
    };
    localWhitelist.unshift(entry);
    res.json({ success: true, data: entry });
  }
};

const deleteWhitelist = async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('whitelist')
      .delete()
      .eq('id', id);
    if (error) throw error;

    await supabase.from('admin_audit_logs').insert([{
      admin_id: req.user.id,
      admin_email: req.user.email,
      action: 'DELETE_WHITELIST',
      details: { id }
    }]);

    res.json({ success: true, message: 'Whitelist entry removed successfully' });
  } catch (err) {
    console.warn('Supabase whitelist delete failed. Removing from local store.');
    localWhitelist = localWhitelist.filter(wl => wl.id !== id);
    res.json({ success: true, message: 'Whitelist entry removed successfully (local fallback)' });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    if (error) throw error;

    await supabase.from('admin_audit_logs').insert([{
      admin_id: req.user.id,
      admin_email: req.user.email,
      action: 'DELETE_USER',
      target_user_id: id
    }]);

    res.json({ success: true, message: 'User account deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAdminDashboard,
  getAllUsers,
  updateUserStatus,
  getDetectionLogs,
  getAuditLogs,
  getKeywords,
  addKeyword,
  deleteKeyword,
  getBlacklist,
  addBlacklist,
  deleteBlacklist,
  getWhitelist,
  addWhitelist,
  deleteWhitelist,
  deleteUser
};
