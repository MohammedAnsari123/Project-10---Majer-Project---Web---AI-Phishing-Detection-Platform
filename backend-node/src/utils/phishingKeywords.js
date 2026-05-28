const phishingKeywords = {
  urgency: [
    "urgent",
    "immediately",
    "verify now",
    "act now",
    "warning",
    "suspended",
    "act immediately"
  ],
  banking: [
    "bank",
    "account",
    "payment",
    "credit card",
    "debit card",
    "wire transfer",
    "transaction"
  ],
  credentials: [
    "password",
    "otp",
    "username",
    "login",
    "verification code",
    "credentials",
    "reset password"
  ],
  scam: [
    "reward",
    "prize",
    "free",
    "winner",
    "claim now",
    "bonus",
    "cash prize",
    "lottery",
    "gift card"
  ]
};

module.exports = phishingKeywords;
