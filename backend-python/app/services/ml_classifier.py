import numpy as np
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

# ----------------------------------------------------
# SEED TRAINING DATASETS
# ----------------------------------------------------
url_seed_data = [
    ("https://www.google.com", 0),
    ("https://www.github.com", 0),
    ("https://www.microsoft.com", 0),
    ("https://www.amazon.com", 0),
    ("https://www.netflix.com", 0),
    ("https://www.wikipedia.org", 0),
    ("https://www.nytimes.com", 0),
    ("https://www.paypal.com", 0),
    ("https://www.apple.com", 0),
    ("https://www.facebook.com", 0),
    ("https://www.google.com/search?q=cybersecurity", 0),
    ("https://github.com/trending", 0),
    ("https://www.youtube.com/watch?v=dQw4w9WgXcQ", 0),
    ("http://login-paypal-security-update.com/signin", 1),
    ("http://verify-bank-account-details-update.xyz/login", 1),
    ("http://192.168.1.105/paypal/signin.html", 1),
    ("http://secure-signin-netflix-account.tk/verify", 1),
    ("http://amazon-giftcard-free-reward.xyz/claim", 1),
    ("http://wallet-metamask-seedphrase-recovery.ga/reset", 1),
    ("http://jobs-work-from-home-earn-money.cc/apply", 1),
    ("http://irs-tax-refund-pending-notice.gq/login", 1),
    ("http://fedex-package-tracking-failed-delivery.ml/update", 1),
    ("http://technical-support-device-infected.net/clean", 1)
]

email_seed_data = [
    ("Hi Team, please find attached the meeting minutes and project status document.", 0),
    ("Hey! Are we still on for lunch today at 1 PM? Let me know.", 0),
    ("Your weekly digest of updates is ready. Read the newsletter here.", 0),
    ("Thank you for your purchase. Here is your invoice and delivery confirmation.", 0),
    ("Can you review the design specs and pull request when you get a chance?", 0),
    ("Hi Mom, I will call you tonight after work. Love you.", 0),
    ("URGENT: Your account has been suspended. Log in immediately to verify your credentials.", 1),
    ("Congratulations! You won a free iPhone. Claim your cash reward and prize now.", 1),
    ("Warning: An unauthorized transaction of $500 was detected. Click here to secure your bank account.", 1),
    ("Job Offer: Work from home and earn $5000 weekly. Sign up now with your resume.", 1),
    ("I have hacked your device and recorded a private webcam video. Send bitcoin payment to prevent disclosure.", 1),
    ("IRS Notice: You have a pending tax refund of $1500. Verify your identity code to receive the fund.", 1),
    ("Dear customer, your parcel delivery failed. Please click below to update address details.", 1)
]

# ----------------------------------------------------
# MODEL INITIALIZATION & TRAINING ON STARTUP
# ----------------------------------------------------
url_vectorizer = TfidfVectorizer(analyzer='char_wb', ngram_range=(3, 5))
url_model = LogisticRegression(C=1.0)

email_vectorizer = TfidfVectorizer(max_features=500, stop_words='english')
email_model = LogisticRegression(C=1.0)

def init_models():
    # 1. Train URL classifier
    urls, url_labels = zip(*url_seed_data)
    X_url = url_vectorizer.fit_transform(urls)
    url_model.fit(X_url, url_labels)

    # 2. Train Email classifier
    emails, email_labels = zip(*email_seed_data)
    X_email = email_vectorizer.fit_transform(emails)
    email_model.fit(X_email, email_labels)
    
    print("SentinelScan AI models trained and loaded successfully.")

# Run training
init_models()

# ----------------------------------------------------
# PREDICTION SERVICES
# ----------------------------------------------------
def predict_url_safety(url: str):
    """
    Predicts URL safety using the trained character n-gram model.
    Also extracts lexical features for auxiliary validation.
    """
    lower_url = url.lower()
    
    # Extract lexical features
    features = {
        "length": len(url),
        "hyphen_count": lower_url.count("-"),
        "dot_count": lower_url.count("."),
        "has_ip": 1 if re.search(r"(\d{1,3}\.){3}\d{1,3}", lower_url) else 0,
        "has_at": 1 if "@" in lower_url else 0,
        "suspicious_kw_count": sum(1 for kw in ["login", "verify", "secure", "account", "banking", "paypal", "signin", "password", "wallet", "free"] if kw in lower_url)
    }

    # Model prediction probability
    X = url_vectorizer.transform([url])
    prob_phishing = float(url_model.predict_proba(X)[0][1])
    
    # Combine ML probability with lexical overrides
    ml_score = int(prob_phishing * 100)
    
    # Lexical overrides to boost scoring (e.g. plain IP address presence)
    if features["has_ip"]:
        ml_score = max(ml_score, 80)
    if features["suspicious_kw_count"] >= 3:
        ml_score = max(ml_score, 75)

    risk_level = "LOW"
    recommendation = "Safe to Continue"
    
    if ml_score >= 70:
        risk_level = "HIGH"
        recommendation = "Avoid Visiting"
    elif ml_score >= 40:
        risk_level = "MEDIUM"
        recommendation = "Proceed Carefully"

    return {
        "risk_score": ml_score,
        "risk_level": risk_level,
        "recommendation": recommendation,
        "ml_probability": round(prob_phishing, 4),
        "lexical_features": features
    }

def predict_email_threat(content: str):
    """
    Analyzes email body content using trained NLP vocabulary models.
    """
    if not content.strip():
        return {
            "risk_score": 0,
            "risk_level": "LOW",
            "threat_type": "No Known Threat",
            "ml_probability": 0.0
        }

    # Model prediction
    X = email_vectorizer.transform([content])
    prob_phishing = float(email_model.predict_proba(X)[0][1])
    ml_score = int(prob_phishing * 100)

    # Classify Threat Type based on keyword density overrides
    lower_content = content.lower()
    threat_type = "Suspicious Email"
    
    if any(kw in lower_content for kw in ["hacked", "webcam", "video", "bitcoin", "pay within"]):
        threat_type = "Extortion Scam"
        ml_score = max(ml_score, 85)
    elif any(kw in lower_content for kw in ["password", "otp", "login", "credentials", "verify now"]):
        threat_type = "Credential Theft Attempt"
        ml_score = max(ml_score, 75)
    elif any(kw in lower_content for kw in ["bank", "payment", "card", "wire", "invoice"]):
        threat_type = "Banking Phishing"
        ml_score = max(ml_score, 70)
    elif any(kw in lower_content for kw in ["prize", "winner", "reward", "jackpot"]):
        threat_type = "General Scam"
        ml_score = max(ml_score, 60)
    elif ml_score < 40:
        threat_type = "No Known Threat Detected"

    risk_level = "LOW"
    if ml_score >= 70:
        risk_level = "HIGH"
    elif ml_score >= 40:
        risk_level = "MEDIUM"

    return {
        "risk_score": ml_score,
        "risk_level": risk_level,
        "threat_type": threat_type,
        "ml_probability": round(prob_phishing, 4)
    }
