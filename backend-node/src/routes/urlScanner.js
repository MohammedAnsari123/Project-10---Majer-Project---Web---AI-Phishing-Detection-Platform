const express = require('express');
const router = express.Router();
const analyzeUrl = require('../utils/urlAnalyzer');
const scanWithVirusTotal = require('../services/virusTotalService');
const { protect } = require('../middleware/authMiddleware');
const supabase = require('../config/supabase');
const axios = require('axios');
const dns = require('dns').promises;
const whois = require('whois-json');

// ===============================
// WHOIS NORMALIZER (IMPROVED)
// ===============================
function normalizeWhois(data) {
  if (!data) return {};

  const getFirst = (...keys) => {
    for (const k of keys) {
      if (data?.[k]) return data[k];
    }
    return null;
  };

  return {
    registrar:
      getFirst(
        'registrar',
        'registrarName',
        'Registrar',
        'registrar_name'
      ) || 'Unknown',

    creationDate:
      getFirst(
        'creationDate',
        'created',
        'Creation Date',
        'creation_date',
        'registered',
        'domainCreationDate'
      ) || 'Unavailable'
  };
}
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

    // ===============================
    // SAFE URL PARSING (FIXED)
    // ===============================
    let parsedUrl = url;

    if (
      !parsedUrl.startsWith('http://') &&
      !parsedUrl.startsWith('https://')
    ) {
      parsedUrl = 'https://' + parsedUrl;
    }

    const hostname = new URL(parsedUrl).hostname;

    /* --------------------------------------------------
       DOMAIN EXISTENCE CHECK
    -------------------------------------------------- */

    let domainExists = true;

    try {
      await dns.lookup(hostname);
    } catch (err) {
      domainExists = false;
    }

    /* --------------------------------------------------
       WHOIS ANALYSIS (FIXED + SAFE)
    -------------------------------------------------- */

    let whoisData = {
      registrar: 'Unknown',
      creationDate: 'Unavailable'
    };

    let domainAgeWarning = false;

    try {
      const rawWhois = await whois(hostname);

      // DEBUG (safe for dev)
      console.log('WHOIS RAW:', rawWhois);

      whoisData = normalizeWhois(rawWhois);

      const creationDate = whoisData.creationDate;

      if (creationDate && creationDate !== 'Unavailable') {
        const domainAge = new Date() - new Date(creationDate);
        const days = domainAge / (1000 * 60 * 60 * 24);

        if (days < 30) {
          domainAgeWarning = true;
        }
      }
    } catch (err) {
      console.log('WHOIS lookup failed:', err.message);
    }

    /* --------------------------------------------------
       STEP 1 - HEURISTIC ANALYSIS
    -------------------------------------------------- */

    const heuristicResult = analyzeUrl(url);

    /* --------------------------------------------------
       STEP 2 - VIRUSTOTAL
    -------------------------------------------------- */

    const vtResult = await scanWithVirusTotal(url);

    /* --------------------------------------------------
       STEP 3 - GOOGLE SAFE BROWSING
    -------------------------------------------------- */

    let googleSafeBrowsing = {
      flagged: false,
      status: 'Safe',
      threatType: null
    };

    const PYTHON_BACKEND_URL =
      process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

    try {
      const pythonRes = await axios.post(
        `${PYTHON_BACKEND_URL}/scan-url`,
        { url }
      );

      if (pythonRes.data) {
        const isSafe = pythonRes.data.safe;
        const details = pythonRes.data.details || {};
        const matches = details.matches || [];

        googleSafeBrowsing = {
          flagged: !isSafe,
          status: isSafe ? 'Safe' : 'Unsafe',
          threatType:
            matches.length > 0
              ? matches[0].threatType
              : null
        };
      }
    } catch (pythonErr) {
      console.error(
        'Python Google Safe Browsing Service Error:',
        pythonErr.message
      );

      const isSuspicious =
        lowerUrl.includes('paypal') ||
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

    /* --------------------------------------------------
       STEP 4 - RISK SCORE CALCULATION
    -------------------------------------------------- */

    let riskScore = 0;
    let reasons = [];

    if (domainAgeWarning) {
      riskScore += 20;
      reasons.push(
        'Very new domain (less than 30 days old) - high phishing risk'
      );
    }

    if (domainExists) {
      reasons.push('Domain exists and DNS lookup succeeded');
    } else {
      riskScore += 30;
      reasons.push('Domain does not exist or DNS lookup failed');
    }

    const hasHttps = lowerUrl.startsWith('https://');

    if (!hasHttps) {
      riskScore += 15;
      reasons.push('URL does not use HTTPS');
    }

    const keywords = [
      'login','verify','secure','account','update','banking',
      'paypal','confirm','free','bonus','gift','wallet','signin','password'
    ];

    const matchedKeywords = keywords.filter(kw => lowerUrl.includes(kw));

    if (matchedKeywords.length > 0) {
      riskScore += 20;
      reasons.push(
        `Suspicious keyword(s) detected: ${matchedKeywords.join(', ')}`
      );
    }

    const vtMaliciousCount = vtResult ? vtResult.malicious : 0;
    const vtFlagged = vtMaliciousCount >= 1;

    if (vtFlagged) {
      riskScore += 40;
      reasons.push(
        `VirusTotal flagged as malicious (detected by ${vtMaliciousCount} vendors)`
      );
    }

    if (googleSafeBrowsing.flagged) {
      riskScore += 50;
      reasons.push(
        `Google Safe Browsing flagged as unsafe (${googleSafeBrowsing.threatType || 'Social Engineering'})`
      );
    }

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

    // Brand checks (FIXED hostname usage)
    try {
      const brands = [
        { name: 'vercel', official: 'vercel.com' },
        { name: 'paypal', official: 'paypal.com' },
        { name: 'netflix', official: 'netflix.com' },
        { name: 'amazon', official: 'amazon.com' },
        { name: 'google', official: 'google.com' },
        { name: 'microsoft', official: 'microsoft.com' },
        { name: 'apple', official: 'apple.com' },
        { name: 'github', official: 'github.com' },
        { name: 'facebook', official: 'facebook.com' },
        { name: 'instagram', official: 'instagram.com' }
      ];

      brands.forEach(brand => {
        if (
          hostname.includes(brand.name) &&
          !hostname.endsWith(brand.official) &&
          !hostname.endsWith('.' + brand.official)
        ) {
          riskScore += 35;
          reasons.push(
            `Brand imitation detected: URL mimics "${brand.name}" but is not official`
          );
        }
      });

      const suspiciousTLDs = [
        '.in','.cc','.ru','.cn','.xyz','.top','.tk',
        '.ml','.ga','.cf','.gq','.work','.click','.link'
      ];

      suspiciousTLDs.forEach(tld => {
        if (hostname.endsWith(tld)) {
          riskScore += 15;
          reasons.push(`Suspicious TLD detected: "${tld}"`);
        }
      });

      const parts = hostname.split('.');
      if (parts.length > 3) {
        riskScore += 15;
        reasons.push('Excessive subdomain levels detected');
      }

    } catch (err) {
      console.log('Heuristic error:', err.message);
    }

    if (riskScore > 100) riskScore = 100;

    /* --------------------------------------------------
       FINAL CLASSIFICATION
    -------------------------------------------------- */

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

    /* --------------------------------------------------
       RESPONSE
    -------------------------------------------------- */

    return res.status(200).json({
      success: true,
      data: {
        url,
        domainExists,
        riskScore,
        riskLevel,
        status,
        domainAgeWarning,

        whoisData,

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