const axios = require('axios');
const supabase = require('../config/supabase');

const getReports = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const userRole = req.user.role;
    const queryParams = req.query;

    const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

    try {
      // Forward request to Python backend for search/filters
      const pythonRes = await axios.get(`${PYTHON_BACKEND_URL}/api/reports`, {
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
      console.error('Python Search Engine offline or errored. Falling back to direct database retrieval:', pythonErr.message);

      // Fallback query directly to Supabase if Python is offline
      let query = supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      // If user is not admin, only show their reports
      if (userRole !== 'ADMIN') {
        query = query.eq('user_email', userEmail);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase direct reports query error:', error.message);
        return res.status(500).json({ success: false, message: 'Database retrieval failed' });
      }

      return res.status(200).json({
        success: true,
        data: data || []
      });
    }

  } catch (error) {
    console.error('Error fetching reports:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

module.exports = {
  getReports
};
