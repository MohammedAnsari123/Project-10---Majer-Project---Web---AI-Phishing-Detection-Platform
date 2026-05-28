const axios = require('axios');
const supabase = require('../config/supabase');

const getAnalytics = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const userRole = req.user.role;

    const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

    try {
      // Forward request to Python backend for Day 19 Analytics computations
      const pythonRes = await axios.get(`${PYTHON_BACKEND_URL}/api/analytics`, {
        params: {
          user_email: userEmail,
          role: userRole
        }
      });

      if (pythonRes.data) {
        return res.status(200).json(pythonRes.data);
      }
    } catch (pythonErr) {
      console.error('Python Analytics Engine offline or errored. Falling back to direct database count computations:', pythonErr.message);

      // Fallback: direct Supabase query to compile counts
      const { data: scans, error: scansErr } = await supabase
        .from('scan_history')
        .select('*')
        .eq('user_email', userEmail);

      const { data: emails, error: emailsErr } = await supabase
        .from('email_scans')
        .select('*')
        .eq('user_email', userEmail);

      if (scansErr || emailsErr) {
        console.error('Error in database query fallback for analytics:', { scansErr, emailsErr });
      }

      const totalUrlScans = scans ? scans.length : 0;
      const totalEmailScans = emails ? emails.length : 0;
      const totalScans = totalUrlScans + totalEmailScans;

      const safeUrls = scans ? scans.filter(s => s.risk_level === 'LOW').length : 0;
      const dangerousUrls = scans ? scans.filter(s => s.risk_level === 'HIGH' || s.risk_level === 'MEDIUM').length : 0;

      return res.status(200).json({
        success: true,
        data: {
          totalScans,
          safeUrls,
          dangerousUrls,
          emailScans: totalEmailScans,
          // Fallback mock structures for Recharts to prevent client crashes
          chartData: [
            { name: 'URL Scans', count: totalUrlScans },
            { name: 'Email Scans', count: totalEmailScans }
          ],
          threatDistribution: [
            { name: 'Safe', value: safeUrls },
            { name: 'Suspicious/Dangerous', value: dangerousUrls }
          ]
        }
      });
    }

  } catch (error) {
    console.error('Analytics controller error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

module.exports = {
  getAnalytics
};
