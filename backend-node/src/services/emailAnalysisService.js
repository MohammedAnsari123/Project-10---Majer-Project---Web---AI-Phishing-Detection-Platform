const phishingKeywords = require('../utils/phishingKeywords');

const analyzeEmailContent = (content) => {
  if (!content) {
    return {
      riskScore: 0,
      riskLevel: 'LOW',
      detectedKeywords: [],
      recommendation: 'No email content provided.'
    };
  }

  const lowerContent = content.toLowerCase();
  let riskScore = 0;
  const detectedKeywords = [];
  const categories = {
    urgency: 0,
    banking: 0,
    credentials: 0,
    scam: 0
  };

  // Check urgency keywords (+10)
  phishingKeywords.urgency.forEach(word => {
    if (lowerContent.includes(word)) {
      riskScore += 10;
      detectedKeywords.push(word);
      categories.urgency++;
    }
  });

  // Check banking keywords (+15)
  phishingKeywords.banking.forEach(word => {
    if (lowerContent.includes(word)) {
      riskScore += 15;
      detectedKeywords.push(word);
      categories.banking++;
    }
  });

  // Check credentials keywords (+20)
  phishingKeywords.credentials.forEach(word => {
    if (lowerContent.includes(word)) {
      riskScore += 20;
      detectedKeywords.push(word);
      categories.credentials++;
    }
  });

  // Check scam keywords (+10)
  phishingKeywords.scam.forEach(word => {
    if (lowerContent.includes(word)) {
      riskScore += 10;
      detectedKeywords.push(word);
      categories.scam++;
    }
  });

  // Cap risk score at 100
  if (riskScore > 100) {
    riskScore = 100;
  }

  // Determine risk level
  let riskLevel = 'LOW';
  let recommendation = 'Email appears safe. Still, be cautious with unsolicited messages.';

  if (riskScore >= 70) {
    riskLevel = 'HIGH';
    recommendation = 'Warning: Do not click any links, open attachments, or reply to this sender. Delete this email immediately.';
  } else if (riskScore >= 40) {
    riskLevel = 'MEDIUM';
    recommendation = 'Warning: Proceed with caution. Verify the sender\'s identity through official channels before responding.';
  }

  return {
    riskScore,
    riskLevel,
    detectedKeywords,
    recommendation,
    categories
  };
};

module.exports = {
  analyzeEmailContent
};
