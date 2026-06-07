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

module.exports = {
  getAdminDashboard,
  getAllUsers,
  updateUserStatus,
  getDetectionLogs,
  getAuditLogs
};
