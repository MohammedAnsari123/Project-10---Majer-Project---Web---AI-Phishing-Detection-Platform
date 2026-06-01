const phishingKeywords = require('../utils/phishingKeywords');

const analyzeEmailContent = (content) => {
  if (!content) {
    return {
      riskScore: 0,
      riskLevel: 'LOW',
      detectedKeywords: [],
      recommendation: 'No email content provided.',
      threatType: 'No Known Threat Detected',
      threatScore: 0,
      categories: {},
      categoryScores: {}
    };
  }

  const lowerContent = content.toLowerCase();

  let riskScore = 0;

  const detectedKeywords = [];

  // Dynamic category tracking
  const categories = {};

  for (const category of Object.keys(phishingKeywords)) {
    categories[category] = 0;
  }

  /* -----------------------------
     SCAN ALL PHISHING CATEGORIES
  ------------------------------ */

  for (const [category, keywords] of Object.entries(phishingKeywords)) {
    keywords.forEach(word => {
      if (lowerContent.includes(word.toLowerCase())) {

        if (!detectedKeywords.includes(word)) {
          detectedKeywords.push(word);
        }

        categories[category]++;

        switch (category) {

          case 'credentials':
            riskScore += 20;
            break;

          case 'banking':
          case 'government':
          case 'tax':
          case 'techSupport':
          case 'crypto':
            riskScore += 15;
            break;

          case 'extortion':
            riskScore += 25;
            break;

          default:
            riskScore += 10;
        }
      }
    });
  }

  /* -----------------------------
     CAP SCORE
  ------------------------------ */

  if (riskScore > 100) {
    riskScore = 100;
  }

  /* -----------------------------
     RISK LEVEL
  ------------------------------ */

  let riskLevel = 'LOW';

  let recommendation =
    'Email appears safe. Still, be cautious with unsolicited messages.';

  if (riskScore >= 70) {
    riskLevel = 'HIGH';

    recommendation =
      'Warning: Do not click any links, open attachments, or reply to this sender. Delete this email immediately.';
  }
  else if (riskScore >= 40) {
    riskLevel = 'MEDIUM';

    recommendation =
      'Warning: Proceed with caution. Verify the sender through official channels before responding.';
  }

  /* -----------------------------
     THREAT CLASSIFICATION
  ------------------------------ */

  let threatType = 'No Known Threat Detected';
  let threatScore = 0;

  const threatMap = {
    urgency: 'Urgency-Based Social Engineering',
    banking: 'Banking Phishing',
    credentials: 'Credential Theft Attempt',
    scam: 'General Scam',
    crypto: 'Cryptocurrency Scam',
    delivery: 'Delivery Scam',
    government: 'Government Impersonation Scam',
    tax: 'Tax Scam',
    employment: 'Employment Scam',
    techSupport: 'Tech Support Scam',
    extortion: 'Extortion Scam'
  };

  // Priority order for tie-breaking
  const categoryPriority = [
    'extortion',
    'credentials',
    'banking',
    'government',
    'tax',
    'crypto',
    'techSupport',
    'employment',
    'delivery',
    'urgency',
    'scam'
  ];

  const highestCategory = Object.entries(categories)
    .sort((a, b) => {

      if (b[1] !== a[1]) {
        return b[1] - a[1];
      }

      return (
        categoryPriority.indexOf(a[0]) -
        categoryPriority.indexOf(b[0])
      );
    })[0];

  if (highestCategory && highestCategory[1] > 0) {

    threatScore = highestCategory[1];

    threatType =
      threatMap[highestCategory[0]] ||
      'Suspicious Email';
  }

  return {
    riskScore,
    riskLevel,
    detectedKeywords,
    recommendation,

    categories,

    threatType,
    threatScore,

    categoryScores: categories
  };
};

module.exports = {
  analyzeEmailContent
};