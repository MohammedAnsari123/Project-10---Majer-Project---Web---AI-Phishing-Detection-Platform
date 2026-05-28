const axios = require('axios');
const supabase = require('../config/supabase');

const getUserHistory = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const userRole = req.user.role;
    const queryParams = req.query;

    const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

    try {
      // Forward request to Python backend for search/filters
      const pythonRes = await axios.get(`${PYTHON_BACKEND_URL}/api/history`, {
        params: {
          ...queryParams,
          user_email: userEmail,
          role: userRole
        }
      });

      if (pythonRes.data) {
        return res.status(200).json(pythonRes.data);
      }
    } catch (pythonErr) {
      console.error('Python history search offline or errored. Falling back to direct database:', pythonErr.message);

      // Fallback: direct Supabase query
      const { data, error } = await supabase
        .from('scan_history')
        .select('*')
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database query error:', error.message);
        return res.status(500).json({ success: false, message: 'Database query failed' });
      }

      // Map existing table columns (content, result) to format expected by frontend
      const mappedData = data.map(item => {
        let recommendation = 'Safe to Continue';
        if (item.risk_level === 'HIGH') {
          recommendation = 'Avoid Visiting';
        } else if (item.risk_level === 'MEDIUM') {
          recommendation = 'Proceed Carefully';
        }
        return {
          id: item.id,
          url: item.content, // Map content -> url
          risk_score: item.risk_score,
          risk_level: item.risk_level,
          status: item.result, // Map result -> status
          recommendation,
          created_at: item.created_at
        };
      });

      return res.status(200).json({
        success: true,
        data: mappedData
      });
    }
  } catch (error) {
    console.error('Error fetching user history:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

module.exports = { getUserHistory };
