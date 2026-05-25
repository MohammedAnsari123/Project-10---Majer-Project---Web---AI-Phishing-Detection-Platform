const axios = require('axios');

const VT_API_KEY = process.env.VIRUSTOTAL_API_KEY;
const VT_BASE_URL = 'https://www.virustotal.com/api/v3';

async function scanWithVirusTotal(url) {
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
      }
    );

    // Step 2: Get analysis ID from response
    const analysisId = submitRes.data.data.id;

    // Step 3: Fetch the analysis result
    const resultRes = await axios.get(
      `${VT_BASE_URL}/analyses/${analysisId}`,
      {
        headers: { 'x-apikey': VT_API_KEY },
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