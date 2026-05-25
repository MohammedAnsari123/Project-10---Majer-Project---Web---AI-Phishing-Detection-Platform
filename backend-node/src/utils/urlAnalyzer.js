const suspiciousKeywords = [
  'login',
  'verify',
  'secure',
  'account',
  'update',
  'banking',
  'paypal',
  'confirm',
  'free',
  'bonus',
  'gift',
  'wallet',
  'signin',
  'password'
];
function analyzeUrl(url) {
  let riskScore = 0;
  let reasons = [];

  const lowerUrl = url.toLowerCase();

  // Check HTTPS
  if (!lowerUrl.startsWith('https://')) {
    riskScore += 25;
    reasons.push('URL does not use HTTPS');
  }

  // Check suspicious keywords
  suspiciousKeywords.forEach(keyword => {
    if (lowerUrl.includes(keyword)) {
      riskScore += 10;
      reasons.push(`Suspicious keyword detected: ${keyword}`);
    }
  });
   // Too many hyphens
  const hyphenCount = (lowerUrl.match(/-/g) || []).length;

  if (hyphenCount >= 3) {
    riskScore += 20;
    reasons.push('Too many hyphens in URL');
  }

  // Very long URL
  if (lowerUrl.length > 60) {
    riskScore += 15;
    reasons.push('URL length is unusually long');
  }

  // IP Address based URL
  const ipRegex = /(\d{1,3}\.){3}\d{1,3}/;

  if (ipRegex.test(lowerUrl)) {
    riskScore += 30;
    reasons.push('URL contains IP address');
  }
   // Final Risk Level
  let riskLevel = 'LOW';
  let result = 'Safe Website';

  if (riskScore >= 60) {
    riskLevel = 'HIGH';
    result = 'Potential Phishing Website';
  } else if (riskScore >= 30) {
    riskLevel = 'MEDIUM';
    result = 'Suspicious Website';
  }

  return {
    url,
    riskScore,
    riskLevel,
    result,
    reasons
  };
}
module.exports = analyzeUrl;