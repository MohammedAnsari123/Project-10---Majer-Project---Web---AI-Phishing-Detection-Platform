import requests
from app.config import settings

def scan_url_with_safe_browsing(url: str):
    api_key = settings.GOOGLE_SAFE_BROWSING_API_KEY

    # Mock mode fallback if API key is not provided or is placeholder
    if not api_key or api_key == "placeholder" or "YOUR_" in api_key or api_key == "":
        is_suspicious = any(kw in url.lower() for kw in ["paypal", "verify", "login", "secure-", "signin", "password"])
        if is_suspicious:
            return {
                "safe": False,
                "message": "Warning! Unsafe or phishing website detected.",
                "details": {
                    "matches": [{
                        "threatType": "SOCIAL_ENGINEERING",
                        "platformType": "ANY_PLATFORM",
                        "threatEntryType": "URL",
                        "threat": {"url": url}
                    }]
                }
            }
        return {
            "safe": True,
            "message": "Website is safe."
        }

    api_url = f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={api_key}"

    payload = {
        "client": {
            "clientId": "phishing-detector",
            "clientVersion": "1.0"
        },
        "threatInfo": {
            "threatTypes": [
                "MALWARE",
                "SOCIAL_ENGINEERING",
                "UNWANTED_SOFTWARE"
            ],
            "platformTypes": ["ANY_PLATFORM"],
            "threatEntryTypes": ["URL"],
            "threatEntries": [
                {"url": url}
            ]
        }
    }

    try:
        response = requests.post(api_url, json=payload, timeout=3)
        result = response.json()

        if "matches" in result:
            return {
                "safe": False,
                "message": "Warning! Unsafe or phishing website detected.",
                "details": result
            }
    except Exception as e:
        print(f"Google Safe Browsing Request Exception: {e}")
        # Fallback to local mock on exception
        is_suspicious = any(kw in url.lower() for kw in ["paypal", "verify", "login", "secure-", "signin", "password"])
        if is_suspicious:
            return {
                "safe": False,
                "message": "Warning! Unsafe or phishing website detected (fallback).",
                "details": {
                    "matches": [{
                        "threatType": "SOCIAL_ENGINEERING",
                        "platformType": "ANY_PLATFORM",
                        "threatEntryType": "URL",
                        "threat": {"url": url}
                    }]
                }
            }

    return {
        "safe": True,
        "message": "Website is safe."
    }
