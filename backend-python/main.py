from fastapi import FastAPI
from pydantic import BaseModel
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

GOOGLE_SAFE_BROWSING_API_KEY = os.getenv("GOOGLE_SAFE_BROWSING_API_KEY")

class URLRequest(BaseModel):
    url: str

@app.get("/")
def home():
    return {"message": "Phishing Detection Backend Running"}

@app.post("/scan-url")
def scan_url(data: URLRequest):

    api_url = f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={GOOGLE_SAFE_BROWSING_API_KEY}"

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
                {"url": data.url}
            ]
        }
    }

    response = requests.post(api_url, json=payload)

    result = response.json()

    if "matches" in result:
        return {
            "safe": False,
            "message": "Warning! Unsafe or phishing website detected.",
            "details": result
        }

    return {
        "safe": True,
        "message": "Website is safe."
    }