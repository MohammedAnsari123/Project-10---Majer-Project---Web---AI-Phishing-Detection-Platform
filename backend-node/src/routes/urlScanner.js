const express = require('express');
const router = express.Router();
const analyzeUrl = require('../utils/urlAnalyzer');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

router.post(['/scan-url', '/scan/url'], async (req, res) => {
  try {
    const { url, userEmail } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
         message: 'URL is required'
      });
    }

    // Analyze URL
    const analysis = analyzeUrl(url);

    // Save to database
    const { error } = await supabase
      .from('scan_history')
      .insert([
        {
          user_email: userEmail || 'guest',
          scan_type: 'URL',
          content: url,
          result: analysis.result,
          risk_level: analysis.riskLevel,
          risk_score: analysis.riskScore
        }
         ]);

    if (error) {
      console.log('Supabase Error:', error);
    }

    return res.status(200).json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
  });

module.exports = router;
