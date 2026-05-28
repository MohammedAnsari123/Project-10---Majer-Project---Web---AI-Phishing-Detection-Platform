const { analyzeEmailContent } = require('../services/emailAnalysisService');

const analyzeText = (text) => {
  const result = analyzeEmailContent(text);
  
  return {
    success: true,
    riskLevel: result.riskLevel,
    riskScore: result.riskScore,
    matchedKeywords: result.detectedKeywords,
    message: result.riskLevel === 'HIGH'
      ? 'Possible phishing content detected'
      : result.riskLevel === 'MEDIUM'
      ? 'Suspicious content detected'
      : 'Content appears safe',
    recommendation: result.recommendation
  };
};

module.exports = {
  analyzeText
};
