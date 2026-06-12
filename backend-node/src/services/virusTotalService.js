const axios = require('axios');

const VT_API_KEY = process.env.VIRUSTOTAL_API_KEY;
const VT_BASE_URL = 'https://www.virustotal.com/api/v3';

async function scanWithVirusTotal(url) {
  // Mock fallback if API key is missing or is placeholder
  if (!VT_API_KEY || VT_API_KEY === 'placeholder' || VT_API_KEY.includes('YOUR_') || VT_API_KEY === '') {
    console.log('VirusTotal: Using Mock Mode (No valid API key provided)');
    const isSuspicious = url.toLowerCase().includes('paypal') || 
                         url.toLowerCase().includes('verify') || 
                         url.toLowerCase().includes('login') || 
                         url.toLowerCase().includes('secure-') ||
                         url.toLowerCase().includes('signin') ||
                         url.toLowerCase().includes('password');
    const maliciousCount = isSuspicious ? 14 : 0;
    const suspiciousCount = isSuspicious ? 2 : 0;
    let vtRiskLevel = 'LOW';
    if (maliciousCount >= 3) {
      vtRiskLevel = 'HIGH';
    } else if (maliciousCount >= 1 || suspiciousCount >= 2) {
      vtRiskLevel = 'MEDIUM';
    }
    return {
      malicious: maliciousCount,
      suspicious: suspiciousCount,
      harmless: isSuspicious ? 60 : 76,
      undetected: 0,
      vtRiskLevel,
    };
  }

  try {
    // Step 1: Submit URL to VirusTotal
    const submitRes = await axios.post(
      `${VT_BASE_URL}/urls`,
      new URLSearchParams({ url }),
      {
        headers: {
          'x-apikey': VT_API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 3000
      }
    );

    // Step 2: Get analysis ID from response
    const analysisId = submitRes.data.data.id;

    // Step 3: Fetch the analysis result
    const resultRes = await axios.get(
      `${VT_BASE_URL}/analyses/${analysisId}`,
      {
        headers: { 'x-apikey': VT_API_KEY },
        timeout: 3000
      }
    );

    const stats = resultRes.data.data.attributes.stats;

    // Step 4: Calculate VT risk level
    let vtRiskLevel = 'LOW';
    if (stats.malicious >= 3) {
      vtRiskLevel = 'HIGH';
    } else if (stats.malicious >= 1 || stats.suspicious >= 2) {
      vtRiskLevel = 'MEDIUM';
    }

    return {
      malicious: stats.malicious || 0,
      suspicious: stats.suspicious || 0,
      harmless: stats.harmless || 0,
      undetected: stats.undetected || 0,
      vtRiskLevel,
    };

  } catch (error) {
    console.error('VirusTotal API Error:', error.message);
    return null;
  }
}

module.exports = scanWithVirusTotal;