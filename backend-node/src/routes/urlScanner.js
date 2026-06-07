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
const { getCache, setCache } = require('../services/redisService');
const { broadcastThreat } = require('../services/socketService');
const { captureScreenshotAndScanDOM } = require('../services/puppeteerService');

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

    // 1. Check Redis Cache
    const cacheKey = `scan:url:${url}`;
    const cachedResult = await getCache(cacheKey);
    if (cachedResult) {
      console.log('Serving URL scan result from Redis Cache:', url);
      // Broadcast threat if not Low risk
      if (cachedResult.riskLevel !== 'LOW') {
        broadcastThreat('newThreat', {
          type: 'URL',
          url,
          risk_score: cachedResult.riskScore,
          risk_level: cachedResult.riskLevel,
          status: cachedResult.status,
          country_code: cachedResult.geolocation?.country_code || 'US',
          country_name: cachedResult.geolocation?.country_name || 'United States',
          created_at: new Date()
        });
      }
      return res.status(200).json({
        success: true,
        data: cachedResult
      });
    }

    // ===============================
    // SAFE URL PARSING
    // ===============================
    let parsedUrl = url;
    if (!parsedUrl.startsWith('http://') && !parsedUrl.startsWith('https://')) {
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
       WHOIS ANALYSIS
    -------------------------------------------------- */
    let whoisData = {
      registrar: 'Unknown',
      creationDate: 'Unavailable'
    };
    let domainAgeWarning = false;

    try {
      const rawWhois = await whois(hostname);
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
       STEP 1 - PUPPETEER SCREENSHOT & DOM AUDIT
    -------------------------------------------------- */
    const puppeteerResult = await captureScreenshotAndScanDOM(parsedUrl);

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
       STEP 4 - GEOLOCATION RESOLUTION
    -------------------------------------------------- */
    let geoResult = { country_code: 'US', country_name: 'United States' };
    try {
      const geoRes = await axios.get(`${PYTHON_BACKEND_URL}/api/geoip`, { params: { url } });
      if (geoRes.data) {
        geoResult = geoRes.data;
      }
    } catch (geoErr) {
      console.error('Python GeoIP Service Error:', geoErr.message);
    }

    /* --------------------------------------------------
       STEP 5 - RISK SCORE CALCULATION
    -------------------------------------------------- */
    let riskScore = 0;
    let reasons = [];

    if (domainAgeWarning) {
      riskScore += 20;
      reasons.push('Very new domain (less than 30 days old) - high phishing risk');
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
      'login', 'verify', 'secure', 'account', 'update', 'banking',
      'paypal', 'confirm', 'free', 'bonus', 'gift', 'wallet', 'signin', 'password'
    ];

    const matchedKeywords = keywords.filter(kw => lowerUrl.includes(kw));
    if (matchedKeywords.length > 0) {
      riskScore += 20;
      reasons.push(`Suspicious keyword(s) detected: ${matchedKeywords.join(', ')}`);
    }

    const vtMaliciousCount = vtResult ? vtResult.malicious : 0;
    const vtFlagged = vtMaliciousCount >= 1;

    if (vtFlagged) {
      riskScore += 40;
      reasons.push(`VirusTotal flagged as malicious (detected by ${vtMaliciousCount} vendors)`);
    }

    if (googleSafeBrowsing.flagged) {
      riskScore += 50;
      reasons.push(`Google Safe Browsing flagged as unsafe (${googleSafeBrowsing.threatType || 'Social Engineering'})`);
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

    // Brand checks
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
          reasons.push(`Brand imitation detected: URL mimics "${brand.name}" but is not official`);
        }
      });

      const suspiciousTLDs = [
        '.in', '.cc', '.ru', '.cn', '.xyz', '.top', '.tk',
        '.ml', '.ga', '.cf', '.gq', '.work', '.click', '.link'
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

    // Puppeteer DOM Threat analysis integration
    let domPhishingFlagged = false;
    if (puppeteerResult.success && puppeteerResult.domAudit) {
      const audit = puppeteerResult.domAudit;
      // If we found a password field on a non-official brand domain
      if (audit.hasPasswordInput && riskScore >= 30) {
        riskScore += 30;
        domPhishingFlagged = true;
        reasons.push('Deceptive form audit: Password inputs detected on suspicious domain');
      }
      if (audit.hasCardInput && riskScore >= 35) {
        riskScore += 40;
        domPhishingFlagged = true;
        reasons.push('Deceptive form audit: Credit card details prompted on unsafe URL');
      }
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

    const finalResult = {
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
        googleSafeBrowsing: googleSafeBrowsing.flagged,
        domPhishing: domPhishingFlagged
      },
      recommendation,
      reasons,
      screenshot: puppeteerResult.screenshotUrl,
      virusTotalStats: vtResult || { malicious: 0, suspicious: 0 },
      googleSafeBrowsingStats: googleSafeBrowsing,
      geolocation: geoResult
    };

    // 2. Cache Results
    await setCache(cacheKey, finalResult, 86400);

    // 3. Save to scan_history table in Supabase
    const { data: scanData, error: scanError } = await supabase
      .from('scan_history')
      .insert([
        {
          user_id: req.user ? req.user.id : null,
          user_email: req.user ? req.user.email : 'guest',
          url: url,
          risk_score: riskScore,
          risk_level: riskLevel,
          status: status,
          recommendation: recommendation,
          country_code: geoResult.country_code,
          country_name: geoResult.country_name
        }
      ])
      .select();

    if (scanError) {
      console.error('Supabase scan_history log insert error:', scanError.message);
    }

    const scanId = scanData && scanData[0] ? scanData[0].id : null;

    // 4. Save detailed Report
    const { error: reportError } = await supabase
      .from('reports')
      .insert([
        {
          user_id: req.user ? req.user.id : null,
          user_email: req.user ? req.user.email : 'guest',
          report_type: 'URL',
          details: {
            ...finalResult,
            scan_id: scanId
          }
        }
      ]);

    if (reportError) {
      console.error('Supabase reports insert error:', reportError.message);
    }

    // 5. Broadcast to WebSockets Connected clients
    broadcastThreat('newThreat', {
      type: 'URL',
      url,
      risk_score: riskScore,
      risk_level: riskLevel,
      status,
      country_code: geoResult.country_code,
      country_name: geoResult.country_name,
      created_at: new Date()
    });

    return res.status(200).json({
      success: true,
      data: finalResult
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
