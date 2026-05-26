const supabase = require('../config/supabase');

const getUserHistory = async (req, res) => {
  try {
    const userEmail = req.user.email;

    const { data, error } = await supabase
      .from('scan_history')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database query error:', error.message);
      return res.status(500).json({ success: false, message: 'Database query failed' });
    }

    // Map existing table columns (content, result) to format expected by frontend (url, status, recommendation)
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
  } catch (error) {
    console.error('Error fetching user history:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

module.exports = { getUserHistory };
