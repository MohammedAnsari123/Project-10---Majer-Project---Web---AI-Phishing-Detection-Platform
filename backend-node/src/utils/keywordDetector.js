const phishingKeywords = [
  "verify your account",
  "bank account",
  "login immediately",
  "click here",
  "urgent",
  "suspended",
  "password",
  "otp",
  "credit card",
  "debit card",
  "confirm identity",
  "security alert",
  "limited time",
  "update account",
  "win prize",
  "free money",
  "claim reward",
  "unauthorized access",
  "reset password",
  "paypal",
  "crypto",
  "lottery",
  "bitcoin",
  "gift card",
  "social security",
  "tax refund",
  "account locked"
];

const analyzeText = (text) => {

  const lowerText = text.toLowerCase();

  let matchedKeywords = [];

  phishingKeywords.forEach((keyword) => {
    if (lowerText.includes(keyword)) {
      matchedKeywords.push(keyword);
    }
  });

  const keywordCount = matchedKeywords.length;

  let riskLevel = "LOW";
  let riskScore = 20;

  if (keywordCount >= 3) {
    riskLevel = "HIGH";
    riskScore = 90;
  } else if (keywordCount >= 1) {
    riskLevel = "MEDIUM";
    riskScore = 60;
  }

  return {
    success: true,
    riskLevel,
    riskScore,
    matchedKeywords,
    message:
      riskLevel === "HIGH"
        ? "Possible phishing content detected"
        : riskLevel === "MEDIUM"
        ? "Suspicious content detected"
        : "Content appears safe"
  };
};

module.exports = {
  analyzeText
};