const express = require('express');
const router = express.Router();
const analyzeUrl = require('../utils/urlAnalyzer');
const scanWithVirusTotal = require('../services/virusTotalService');
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

    // Step 1: Heuristic analysis (existing)
    const heuristicResult = analyzeUrl(url);

    // Step 2: VirusTotal analysis (new - Day 11)
    const vtResult = await scanWithVirusTotal(url);

    // Step 3: Merge both results
    let finalRiskLevel = heuristicResult.riskLevel;

    if (vtResult) {
      if (vtResult.vtRiskLevel === 'HIGH') {
        finalRiskLevel = 'HIGH';
      } else if (vtResult.vtRiskLevel === 'MEDIUM' && finalRiskLevel === 'LOW') {
        finalRiskLevel = 'MEDIUM';
      }
    }

    // Step 4: Save to database
    const { error } = await supabase
      .from('scan_history')
      .insert([
        {
          user_email: userEmail || 'guest',
          scan_type: 'URL',
          content: url,
          result: heuristicResult.result,
          risk_level: finalRiskLevel,
          risk_score: heuristicResult.riskScore
        }
      ]);

    if (error) {
      console.log('Supabase Error:', error);
    }

    // Step 5: Return combined result
    return res.status(200).json({
      success: true,
      data: {
        url,
        finalRiskLevel,
        heuristic: heuristicResult,
        virusTotal: vtResult || { error: 'VirusTotal scan unavailable' }
      }
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
