console.log('threatClassifier.js loaded');
function detectThreatType(emailText) {
  const text = emailText.toLowerCase();

  const threatCategories = {

  banking_phishing: [
    'bank',
    'banking',
    'account',
    'checking account',
    'savings account',
    'transaction',
    'credit card',
    'debit card',
    'balance',
    'payment',
    'fund transfer',
    'wire transfer',
    'online banking',
    'financial institution',
    'verify account',
    'secure banking',
    'bank alert',
    'bank security',
    'account verification',
    'bank statement',
    'account activity',
    'unauthorized transaction'
  ],

  credential_theft: [
    'password',
    'login',
    'log in',
    'signin',
    'sign in',
    'username',
    'credential',
    'credentials',
    'verify password',
    'confirm password',
    'reset password',
    'change password',
    'security code',
    'verification code',
    'authentication',
    'otp',
    'one time password',
    '2fa',
    'mfa',
    'two factor authentication',
    'security question',
    'recover account',
    'identity verification'
  ],

  account_suspension: [
    'suspended',
    'blocked',
    'locked',
    'disabled',
    'deactivated',
    'restricted',
    'temporarily unavailable',
    'account frozen',
    'access denied',
    'security hold',
    'termination',
    'account closure',
    'service interruption',
    'account disabled'
  ],

  urgency_pressure: [
    'urgent',
    'immediately',
    'act now',
    'take action now',
    'within 24 hours',
    'within 48 hours',
    'deadline',
    'expires today',
    'final notice',
    'last warning',
    'response required',
    'limited time',
    'important notice',
    'critical alert',
    'instant action',
    'do not ignore',
    'failure to comply'
  ],

  business_email_compromise: [
    'invoice',
    'purchase order',
    'payment request',
    'vendor payment',
    'remittance',
    'outstanding balance',
    'ceo request',
    'executive request',
    'finance department',
    'accounts payable',
    'bank transfer',
    'wire instructions',
    'supplier payment',
    'urgent payment',
    'pay immediately'
  ],

  tech_support_scam: [
    'microsoft',
    'windows',
    'virus detected',
    'trojan detected',
    'technical support',
    'customer service',
    'help desk',
    'security alert',
    'your computer',
    'device infected',
    'malware detected',
    'system compromised',
    'call support',
    'call immediately',
    'technical issue'
  ],

  crypto_scam: [
    'bitcoin',
    'btc',
    'ethereum',
    'eth',
    'crypto',
    'cryptocurrency',
    'wallet',
    'blockchain',
    'token',
    'nft',
    'defi',
    'private key',
    'seed phrase',
    'recovery phrase',
    'coinbase',
    'binance',
    'metamask',
    'trust wallet'
  ],

  lottery_scam: [
    'winner',
    'won',
    'lottery',
    'jackpot',
    'cash prize',
    'claim prize',
    'claim reward',
    'award notification',
    'selected winner',
    'sweepstakes',
    'lucky draw',
    'congratulations',
    'grand prize'
  ],

  gift_reward_scam: [
    'free gift',
    'gift card',
    'reward',
    'bonus',
    'promotion',
    'special offer',
    'exclusive offer',
    'free iphone',
    'free smartphone',
    'free laptop',
    'claim reward now',
    'claim your reward'
  ],

  delivery_scam: [
    'package',
    'parcel',
    'shipment',
    'delivery',
    'tracking number',
    'courier',
    'failed delivery',
    'delivery attempt',
    'shipping update',
    'dhl',
    'fedex',
    'ups',
    'usps',
    'courier service'
  ],

  tax_scam: [
    'tax refund',
    'refund pending',
    'income tax',
    'tax department',
    'tax return',
    'irs',
    'revenue service',
    'refund available',
    'tax payment'
  ],

  government_impersonation: [
    'government',
    'police',
    'court notice',
    'legal action',
    'arrest warrant',
    'immigration',
    'passport office',
    'social security',
    'identity verification',
    'law enforcement',
    'official notice'
  ],

  investment_scam: [
    'investment opportunity',
    'guaranteed profit',
    'double your money',
    'passive income',
    'high returns',
    'risk free investment',
    'financial freedom',
    'forex opportunity',
    'trading signal',
    'investment plan',
    'wealth creation'
  ],

  romance_scam: [
    'dear beloved',
    'love',
    'relationship',
    'romantic',
    'widow',
    'widower',
    'military officer',
    'need your help',
    'trust fund',
    'my dear',
    'soulmate'
  ],

  charity_scam: [
    'donation',
    'charity',
    'humanitarian',
    'fundraising campaign',
    'support victims',
    'emergency fund',
    'disaster relief',
    'help children',
    'medical emergency'
  ],

  social_media_phishing: [
    'facebook',
    'instagram',
    'twitter',
    'x account',
    'tiktok',
    'youtube',
    'social media violation',
    'account appeal',
    'copyright strike',
    'community guidelines',
    'page disabled'
  ],

  employment_scam: [
    'job offer',
    'work from home',
    'remote job',
    'easy income',
    'earn money',
    'hiring immediately',
    'interview selected',
    'recruitment',
    'employment opportunity',
    'part time work'
  ],

  extortion_scam: [
    'i have hacked',
    'i know your password',
    'bitcoin payment',
    'send money',
    'private video',
    'webcam footage',
    'pay within 24 hours',
    'blackmail',
    'extortion'
  ]
};

  const scores = {};

  for (const [category, keywords] of Object.entries(threatCategories)) {
    scores[category] = 0;

    keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        scores[category]++;
      }
    });
  }

  let highestCategory = 'safe';
  let highestScore = 0;

  for (const [category, score] of Object.entries(scores)) {
    if (score > highestScore) {
      highestScore = score;
      highestCategory = category;
    }
  }

  const categoryNames = {
  banking_phishing: 'Banking Phishing',
  credential_theft: 'Credential Theft',
  account_suspension: 'Account Suspension Scam',
  urgency_pressure: 'Urgency-Based Phishing',
  business_email_compromise: 'Business Email Compromise (BEC)',
  tech_support_scam: 'Tech Support Scam',
  crypto_scam: 'Cryptocurrency Scam',
  lottery_scam: 'Lottery Scam',
  gift_reward_scam: 'Gift / Reward Scam',
  delivery_scam: 'Delivery Scam',
  tax_scam: 'Tax Scam',
  government_impersonation: 'Government Impersonation Scam',
  investment_scam: 'Investment Scam',
  romance_scam: 'Romance Scam',
  charity_scam: 'Charity Scam',
  social_media_phishing: 'Social Media Phishing',
  employment_scam: 'Employment Scam',
  extortion_scam: 'Extortion Scam'
};

console.log('Email Text:', text);
console.log('Scores:', scores);
console.log('Highest Category:', highestCategory);
console.log('Highest Score:', highestScore);

  return {
    threatType:
      highestScore > 0
        ? categoryNames[highestCategory]
        : 'No Known Threat Detected',

    score: highestScore,
    categoryScores: scores
  };
}

module.exports = detectThreatType;