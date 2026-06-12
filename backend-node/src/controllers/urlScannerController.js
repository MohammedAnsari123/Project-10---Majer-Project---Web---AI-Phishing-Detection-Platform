const analyzeUrl = require('../utils/urlAnalyzer');
const scanWithVirusTotal = require('../services/virusTotalService');
const supabase = require('../config/supabase');
const axios = require('axios');
const dns = require('dns').promises;
const whois = require('whois-json');
const { getCache, setCache } = require('../services/redisService');
const { broadcastThreat } = require('../services/socketService');
const { captureScreenshotAndScanDOM } = require('../services/puppeteerService');

// Levenshtein helper
function getLevenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// Redirect chain and short URL tracker
async function traceUrlRedirects(initialUrl) {
  let currentUrl = initialUrl;
  const chain = [initialUrl];
  let hops = 0;
  const maxHops = 5;
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';

  while (hops < maxHops) {
    try {
      // Use GET with User-Agent and Range headers for fast redirect checking
      const response = await axios.get(currentUrl, {
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400,
        timeout: 1200,
        headers: {
          'User-Agent': userAgent,
          'Range': 'bytes=0-0'
        }
      });

      if (response.status >= 300 && response.status < 400 && response.headers.location) {
        let redirectUrl = response.headers.location;
        if (!redirectUrl.startsWith('http')) {
          const parsed = new URL(currentUrl);
          redirectUrl = parsed.protocol + '//' + parsed.host + redirectUrl;
        }
        chain.push(redirectUrl);
        currentUrl = redirectUrl;
        hops++;
      } else {
        break;
      }
    } catch (err) {
      // Fallback: If Range header causes 400, 405, 416, try a standard GET with small timeout and maxContentLength: 0
      if (err.response && [400, 405, 416].includes(err.response.status)) {
        try {
          const fallbackResponse = await axios.get(currentUrl, {
            maxRedirects: 0,
            validateStatus: (status) => status >= 200 && status < 400,
            timeout: 1200,
            maxContentLength: 0,
            headers: {
              'User-Agent': userAgent
            }
          });
          if (fallbackResponse.status >= 300 && fallbackResponse.status < 400 && fallbackResponse.headers.location) {
            let redirectUrl = fallbackResponse.headers.location;
            if (!redirectUrl.startsWith('http')) {
              const parsed = new URL(currentUrl);
              redirectUrl = parsed.protocol + '//' + parsed.host + redirectUrl;
            }
            chain.push(redirectUrl);
            currentUrl = redirectUrl;
            hops++;
            continue;
          }
        } catch (fallbackErr) {}
      }
      break;
    }
  }
  return { finalUrl: currentUrl, chain, redirected: hops > 0 };
}

function normalizeWhois(data) {
  if (!data) return {};

  const getFirst = (...keys) => {
    for (const k of keys) {
      if (data?.[k]) return data[k];
    }
    return null;
  };

  return {
    registrar: getFirst('registrar', 'registrarName', 'Registrar', 'registrar_name') || 'Unknown',
    creationDate: getFirst('creationDate', 'created', 'Creation Date', 'creation_date', 'registered', 'domainCreationDate') || 'Unavailable'
  };
}

const scanUrl = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL is required'
      });
    }

    const lowerUrl = url.toLowerCase();

    // 1. Check Cache
    const cacheKey = `scan:url:${url}`;
    const cachedResult = await getCache(cacheKey);
    if (cachedResult) {
      console.log('Serving URL scan result from Cache:', url);
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

    // 2. Safe URL Parsing
    let parsedUrl = url;
    if (!parsedUrl.startsWith('http://') && !parsedUrl.startsWith('https://')) {
      parsedUrl = 'https://' + parsedUrl;
    }

    const hostname = new URL(parsedUrl).hostname;

    // 3. Whitelist & Blacklist check
    const { data: whitelistData } = await supabase
      .from('whitelist')
      .select('*')
      .eq('domain_or_ip', hostname);

    if (whitelistData && whitelistData.length > 0) {
      const finalResult = {
        url,
        domainExists: true,
        riskScore: 0,
        riskLevel: 'LOW',
        status: 'Safe Website (Whitelisted)',
        domainAgeWarning: false,
        whoisData: { registrar: 'Whitelisted', creationDate: 'Whitelisted' },
        checks: { https: true, keywords: false, virusTotal: false, googleSafeBrowsing: false, domPhishing: false },
        recommendation: 'Safe to Continue',
        reasons: ['Domain is whitelisted by system administrator.'],
        screenshot: null,
        virusTotalStats: { malicious: 0, suspicious: 0 },
        googleSafeBrowsingStats: { safe: true, message: 'Whitelisted' },
        geolocation: { country_code: 'US', country_name: 'United States' }
      };
      
      // Save to logs
      await supabase.from('scan_history').insert([{
        user_id: req.user ? req.user.id : null,
        url, risk_score: 0, risk_level: 'LOW', status: 'Safe', recommendation: 'Safe to Continue',
        country_code: 'US', country_name: 'United States'
      }]);

      return res.status(200).json({ success: true, data: finalResult });
    }

    const { data: blacklistData } = await supabase
      .from('blacklist')
      .select('*')
      .eq('domain_or_ip', hostname);

    if (blacklistData && blacklistData.length > 0) {
      const finalResult = {
        url,
        domainExists: true,
        riskScore: 100,
        riskLevel: 'HIGH',
        status: 'Blocked Website (Blacklisted)',
        domainAgeWarning: false,
        whoisData: { registrar: 'Blacklisted', creationDate: 'Blacklisted' },
        checks: { https: false, keywords: true, virusTotal: true, googleSafeBrowsing: true, domPhishing: true },
        recommendation: 'Avoid Visiting immediately',
        reasons: ['Domain is blacklisted by system administrator: ' + (blacklistData[0].reason || 'Malicious')],
        screenshot: null,
        virusTotalStats: { malicious: 10, suspicious: 2 },
        googleSafeBrowsingStats: { safe: false, message: 'Blacklisted' },
        geolocation: { country_code: 'US', country_name: 'United States' }
      };
      
      // Save to logs
      await supabase.from('scan_history').insert([{
        user_id: req.user ? req.user.id : null,
        url, risk_score: 100, risk_level: 'HIGH', status: 'Blocked', recommendation: 'Avoid Visiting immediately',
        country_code: 'US', country_name: 'United States'
      }]);

      broadcastThreat('newThreat', {
        type: 'URL', url, risk_score: 100, risk_level: 'HIGH', status: 'Blocked Website (Blacklisted)',
        country_code: 'US', country_name: 'United States', created_at: new Date()
      });

      return res.status(200).json({ success: true, data: finalResult });
    }

    const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

    // 4. Trace redirects and short URL
    const trace = await traceUrlRedirects(parsedUrl);
    const finalUrl = trace.finalUrl;
    const finalHostname = new URL(finalUrl).hostname;
    const redirectChain = trace.chain;
    const wasRedirected = trace.redirected;

    // Execute check integrations concurrently
    const [
      dnsSucceeded,
      whoisResult,
      puppeteerResult,
      vtResult,
      pythonResult
    ] = await Promise.all([
      // DNS check
      (async () => {
        const fetchDns = dns.lookup(finalHostname).then(() => true).catch(() => false);
        const timeout = new Promise((resolve) => setTimeout(() => resolve(false), 2000));
        return Promise.race([fetchDns, timeout]);
      })(),

      // WHOIS check
      (async () => {
        const whoisCacheKey = `whois:${finalHostname}`;
        const cached = await getCache(whoisCacheKey);
        if (cached) return cached;
        try {
          const whoisPromise = whois(finalHostname);
          const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('WHOIS timeout')), 2000));
          const rawWhois = await Promise.race([whoisPromise, timeout]);
          const normalized = normalizeWhois(rawWhois);
          let warning = false;
          if (normalized.creationDate && normalized.creationDate !== 'Unavailable') {
            const domainAge = new Date() - new Date(normalized.creationDate);
            const days = domainAge / (1000 * 60 * 60 * 24);
            if (days < 30) warning = true;
          }
          const res = { data: normalized, warning };
          await setCache(whoisCacheKey, res, 86400);
          return res;
        } catch (err) {
          console.warn(`WHOIS lookup failed or timed out for ${finalHostname}:`, err.message);
          return { data: { registrar: 'Unknown', creationDate: 'Unavailable' }, warning: false };
        }
      })(),

      // Puppeteer screenshots
      captureScreenshotAndScanDOM(finalUrl).catch(err => {
        return { success: false, screenshotUrl: null, domAudit: { hasPasswordInput: false, hasCardInput: false, matchedKeywords: [] } };
      }),

      // VirusTotal check
      (async () => {
        const vtCacheKey = `vt:${finalUrl}`;
        const cached = await getCache(vtCacheKey);
        if (cached) return cached;
        try {
          const res = await scanWithVirusTotal(finalUrl);
          if (res) {
            await setCache(vtCacheKey, res, 43200);
            return res;
          }
        } catch (err) {}
        return { malicious: 0, suspicious: 0 };
      })(),

      // Python predictions
      (async () => {
        const pythonCacheKey = `python:${finalUrl}`;
        const cached = await getCache(pythonCacheKey);
        if (cached) return cached;
        try {
          const res = await axios.post(`${PYTHON_BACKEND_URL}/python/url/analyze`, { url: finalUrl }, { timeout: 4000 });
          if (res.data) {
            await setCache(pythonCacheKey, res.data, 43200);
            return res.data;
          }
        } catch (err) {
          console.error('Python ML Engine analyze failed:', err.message);
        }
        return null;
      })()
    ]);

    const domainExists = dnsSucceeded;
    const whoisData = whoisResult.data;
    const domainAgeWarning = whoisResult.warning;

    let googleSafeBrowsing = { flagged: false, status: 'Safe', threatType: null };
    let geoResult = { country_code: 'US', country_name: 'United States' };
    let sslResult = { valid: false, error: 'SSL Audit offline' };

    if (pythonResult) {
      const sb = pythonResult.safe_browsing || {};
      const isSafe = sb.safe !== false;
      const details = sb.details || {};
      const matches = details.matches || [];
      googleSafeBrowsing = {
        flagged: !isSafe,
        status: isSafe ? 'Safe' : 'Unsafe',
        threatType: matches.length > 0 ? matches[0].threatType : null
      };
      if (pythonResult.geo) geoResult = pythonResult.geo;
      if (pythonResult.ssl) sslResult = pythonResult.ssl;
    }

    // Risk Calculations
    let riskScore = 0;
    let reasons = [];

    if (wasRedirected) {
      reasons.push(`URL redirected to: ${finalUrl}`);
      if (redirectChain.length >= 4) {
        riskScore += 20;
        reasons.push('Excessive redirects chain detected (potential masking)');
      }
    }

    // Shortener check
    const shorteners = ['bit.ly', 'tinyurl.com', 't.co', 'goog.gl', 'is.gd', 'buff.ly', 'adf.ly'];
    const isShortUrl = shorteners.some(sh => hostname.toLowerCase().includes(sh));
    if (isShortUrl) {
      riskScore += 15;
      reasons.push('Shortened link wrapper detected');
    }

    // Typosquatting check
    const popularBrands = ['google.com', 'paypal.com', 'netflix.com', 'amazon.com', 'microsoft.com', 'apple.com', 'github.com', 'facebook.com', 'instagram.com', 'vercel.com'];
    for (const brand of popularBrands) {
      const dist = getLevenshteinDistance(finalHostname.toLowerCase(), brand);
      if (dist > 0 && dist <= 2) {
        riskScore += 35;
        reasons.push(`Typosquatting alert: closely mimics official portal "${brand}"`);
        break;
      }
    }

    if (domainAgeWarning) {
      riskScore += 20;
      reasons.push('New domain registration (less than 30 days old)');
    }

    if (!domainExists) {
      riskScore += 30;
      reasons.push('Domain DNS resolution failed');
    }

    const hasHttps = finalUrl.toLowerCase().startsWith('https://');
    if (!hasHttps) {
      riskScore += 15;
      reasons.push('Insecure connection protocol (HTTP)');
    } else if (sslResult && !sslResult.valid) {
      riskScore += 10;
      reasons.push(`SSL Certificate audit warning: ${sslResult.error || 'Invalid Cert'}`);
    }

    const keywords = ['login', 'verify', 'secure', 'account', 'update', 'banking', 'paypal', 'signin', 'password'];
    const matchedKeywords = keywords.filter(kw => finalUrl.toLowerCase().includes(kw));
    if (matchedKeywords.length > 0) {
      riskScore += 15;
      reasons.push(`Phishing indicators found in URL path: ${matchedKeywords.join(', ')}`);
    }

    const vtMaliciousCount = vtResult ? vtResult.malicious : 0;
    if (vtMaliciousCount >= 1) {
      riskScore += 40;
      reasons.push(`VirusTotal flagged domain (detected by ${vtMaliciousCount} security providers)`);
    }

    if (googleSafeBrowsing.flagged) {
      riskScore += 50;
      reasons.push(`Google Safe Browsing labeled host as UNSAFE (${googleSafeBrowsing.threatType || 'Social Engineering'})`);
    }

    let domPhishingFlagged = false;
    if (puppeteerResult.success && puppeteerResult.domAudit) {
      const audit = puppeteerResult.domAudit;
      if (audit.hasPasswordInput && riskScore >= 25) {
        riskScore += 25;
        domPhishingFlagged = true;
        reasons.push('Dynamic DOM scan: password prompts detected on unverified domain');
      }
      if (audit.hasCardInput && riskScore >= 30) {
        riskScore += 35;
        domPhishingFlagged = true;
        reasons.push('Dynamic DOM scan: payment credential fields detected on unsafe host');
      }
    }

    if (riskScore > 100) riskScore = 100;

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
        virusTotal: vtMaliciousCount >= 1,
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

    // Cache results
    await setCache(cacheKey, finalResult, 86400);

    // Save to Postgres
    const { data: scanData } = await supabase
      .from('scan_history')
      .insert([{
        user_id: req.user ? req.user.id : null,
        url, risk_score: riskScore, risk_level: riskLevel,
        status, recommendation, country_code: geoResult.country_code, country_name: geoResult.country_name
      }])
      .select();

    const scanId = scanData && scanData[0] ? scanData[0].id : null;

    // Log to URL scans detail table
    await supabase.from('url_scans').insert([{
      user_id: req.user ? req.user.id : null,
      user_email: req.user ? req.user.email : 'guest',
      url, risk_score: riskScore, risk_level: riskLevel,
      virustotal_result: vtResult || {},
      safe_browsing_result: googleSafeBrowsing,
      whois_data: whoisData,
      dns_data: { domainExists, finalUrl, redirectChain }
    }]);

    // Save detailed report
    await supabase.from('reports').insert([{
      user_id: req.user ? req.user.id : null,
      user_email: req.user ? req.user.email : 'guest',
      report_type: 'URL',
      details: { ...finalResult, scan_id: scanId }
    }]);

    // Emit live Socket telemetry
    broadcastThreat('newThreat', {
      type: 'URL', url, risk_score: riskScore, risk_level: riskLevel,
      status, country_code: geoResult.country_code, country_name: geoResult.country_name, created_at: new Date()
    });

    return res.status(200).json({
      success: true,
      data: finalResult
    });

  } catch (error) {
    console.error('URL Scan Controller Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

module.exports = { scanUrl };
