const express = require('express');
const router = express.Router();
const analyzeUrl = require('../utils/urlAnalyzer');
const scanWithVirusTotal = require('../services/virusTotalService');
const { protect } = require('../middleware/authMiddleware');
const supabase = require('../config/supabase');
const axios = require('axios');

router.post(['/scan-url', '/scan/url'], protect, async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL is required'
      });
    }

    const lowerUrl = url.toLowerCase();

    // Step 1: Heuristic analysis
    const heuristicResult = analyzeUrl(url);

    // Step 2: VirusTotal analysis (Day 11 Node.js backend)
    const vtResult = await scanWithVirusTotal(url);

    // Step 3: Google Safe Browsing check (Day 12 Python backend)
    let googleSafeBrowsing = { flagged: false, status: 'Safe', threatType: null };
    const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';
    try {
      const pythonRes = await axios.post(`${PYTHON_BACKEND_URL}/scan-url`, { url });
      if (pythonRes.data) {
        const isSafe = pythonRes.data.safe;
        const details = pythonRes.data.details || {};
        const matches = details.matches || [];
        googleSafeBrowsing = {
          flagged: !isSafe,
          status: isSafe ? 'Safe' : 'Unsafe',
          threatType: matches.length > 0 ? matches[0].threatType : null
        };
      }
    } catch (pythonErr) {
      console.error('Python Google Safe Browsing Service Error:', pythonErr.message);
      // Fallback to local mock if Python server is not running or fails
      const isSuspicious = lowerUrl.includes('paypal') || 
                           lowerUrl.includes('verify') || 
                           lowerUrl.includes('login') || 
                           lowerUrl.includes('secure-') ||
                           lowerUrl.includes('signin') ||
                           lowerUrl.includes('password');
      googleSafeBrowsing = {
        flagged: isSuspicious,
        status: isSuspicious ? 'Unsafe' : 'Safe',
        threatType: isSuspicious ? 'SOCIAL_ENGINEERING' : null,
        error: 'Python Service Offline (used local mock fallback)'
      };
    }

    // Step 4: Combined Risk Score calculation
    let riskScore = 0;
    let reasons = [];

    // - HTTPS missing: +15
    const hasHttps = lowerUrl.startsWith('https://');
    if (!hasHttps) {
      riskScore += 15;
      reasons.push('URL does not use HTTPS');
    }

    // - Suspicious keywords: +20
    const keywords = [
      'login', 'verify', 'secure', 'account', 'update', 'banking', 
      'paypal', 'confirm', 'free', 'bonus', 'gift', 'wallet', 'signin', 'password'
    ];
    const matchedKeywords = keywords.filter(kw => lowerUrl.includes(kw));
    if (matchedKeywords.length > 0) {
      riskScore += 20;
      reasons.push(`Suspicious keyword(s) detected: ${matchedKeywords.join(', ')}`);
    }

    // - VirusTotal malicious: +40
    const vtMaliciousCount = vtResult ? vtResult.malicious : 0;
    const vtFlagged = vtMaliciousCount >= 1;
    if (vtFlagged) {
      riskScore += 40;
      reasons.push(`VirusTotal flagged as malicious (detected by ${vtMaliciousCount} vendors)`);
    }

    // - Google flagged URL: +50
    if (googleSafeBrowsing.flagged) {
      riskScore += 50;
      reasons.push(`Google Safe Browsing flagged as unsafe (${googleSafeBrowsing.threatType || 'Social Engineering'})`);
    }

    // Additional structural rules from local analyzer
    if ((lowerUrl.match(/-/g) || []).length >= 3) {
      riskScore += 10;
      reasons.push('Too many hyphens in URL');
    }
    if (lowerUrl.length > 60) {
      riskScore += 5;
      reasons.push('URL length is unusually long');
    }
    const ipRegex = /(\d{1,3}\.){3}\d{1,3}/;
    if (ipRegex.test(lowerUrl)) {
      riskScore += 15;
      reasons.push('URL contains IP address');
    }

    // Cap score at 100
    if (riskScore > 100) riskScore = 100;

    // Determine combined threat level, status, and recommendations
    let riskLevel = 'LOW';
    let status = 'Safe Website';
    let recommendation = 'Safe to Continue';

    if (riskScore >= 70) {
      riskLevel = 'HIGH';
      status = 'Potential Phishing Website';
      recommendation = 'Avoid Visiting';
    } else if (riskScore >= 40) {
      riskLevel = 'MEDIUM';
      status = 'Suspicious Website';
      recommendation = 'Proceed Carefully';
    }

    // Step 5: Save scan results to Supabase (using existing columns to match your database schema)
    const { error: dbError } = await supabase
      .from('scan_history')
      .insert([
        {
          user_email: req.user ? req.user.email : 'guest',
          scan_type: 'URL',
          content: url,
          result: status,
          risk_level: riskLevel,
          risk_score: riskScore
        }
      ]);

    if (dbError) {
      console.error('Supabase scan_history Insertion Error:', dbError.message);
    }

    // Step 6: Return clean structured response payload
    return res.status(200).json({
      success: true,
      data: {
        url,
        riskScore,
        riskLevel,
        status,
        checks: {
          https: hasHttps,
          keywords: matchedKeywords.length > 0,
          virusTotal: vtFlagged,
          googleSafeBrowsing: googleSafeBrowsing.flagged
        },
        recommendation,
        reasons,
        virusTotalStats: vtResult || { malicious: 0, suspicious: 0 },
        googleSafeBrowsingStats: googleSafeBrowsing
      }
    });

  } catch (error) {
    console.error('URL Scanning Route Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
});

module.exports = router;
