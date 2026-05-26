from fastapi import FastAPI
from app.schemas.url import URLRequest
from app.services.safe_browsing import scan_url_with_safe_browsing

app = FastAPI(title="SentinelScan Python ML & Reputation Engine")

@app.get("/")
def home():
    return {"message": "Phishing Detection Python Backend Running"}

@app.post("/scan-url")
def scan_url(data: URLRequest):
    return scan_url_with_safe_browsing(data.url)
