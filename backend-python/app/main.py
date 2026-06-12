from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import datetime
import socket
import ssl
from concurrent.futures import ThreadPoolExecutor

from app.schemas.url import URLRequest
from app.services.safe_browsing import scan_url_with_safe_browsing
from app.services.db_query import fetch_table_data
from app.services.ml_classifier import predict_url_safety, predict_email_threat, predict_message_threat
from app.services.geoip import resolve_geoip

app = FastAPI(title="SentinelScan Python ML & Reputation Engine")

# Thread pool for running blocking tasks concurrently
executor = ThreadPoolExecutor(max_workers=15)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Models
class EmailRequest(BaseModel):
    content: str

class MessageRequest(BaseModel):
    content: str

class UnifiedPredictRequest(BaseModel):
    type: str # 'URL' | 'EMAIL' | 'MESSAGE'
    content: str

def parse_date(dt_str: str) -> Optional[datetime.datetime]:
    if not dt_str:
        return None
    try:
        if dt_str.endswith("Z"):
            dt_str = dt_str[:-1]
        if "+" in dt_str:
            dt_str = dt_str.split("+")[0]
        return datetime.datetime.strptime(dt_str[:19], "%Y-%m-%dT%H:%M:%S")
    except Exception as e:
        print(f"Error parsing date {dt_str}: {e}")
        return None

def extract_hostname(url: str) -> str:
    host = url
    if "://" in host:
        host = host.split("://")[1]
    if "/" in host:
        host = host.split("/")[0]
    if ":" in host:
        host = host.split(":")[0]
    return host

def run_ssl_check(hostname: str) -> Dict[str, Any]:
    try:
        context = ssl.create_default_context()
        context.check_hostname = True
        context.verify_mode = ssl.CERT_REQUIRED
        with socket.create_connection((hostname, 443), timeout=3) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()
                issuer = dict(x[0] for x in cert.get('issuer', [])).get('commonName', 'Unknown')
                subject = dict(x[0] for x in cert.get('subject', [])).get('commonName', 'Unknown')
                return {
                    "valid": True,
                    "issuer": issuer,
                    "subject": subject,
                    "expiry": cert.get('notAfter', 'Unavailable')
                }
    except Exception as e:
        return {
            "valid": False,
            "error": str(e)
        }

@app.get("/")
def home():
    return {"message": "Phishing Detection Python Backend Running"}

# Backward compatible route
@app.post("/scan-url")
def scan_url(data: URLRequest):
    future_sb = executor.submit(scan_url_with_safe_browsing, data.url)
    future_ml = executor.submit(predict_url_safety, data.url)
    future_geo = executor.submit(resolve_geoip, data.url)
    
    sb_result = future_sb.result()
    ml_result = future_ml.result()
    geo_result = future_geo.result()

    return {
        "url": data.url,
        "safe": sb_result.get("safe", True) and (ml_result.get("risk_level") != "HIGH"),
        "google_safe_browsing": sb_result,
        "machine_learning": ml_result,
        "geolocation": geo_result
    }

# ==========================================
# 🛡️ NEW STANDALONE INTEL ROUTING
# ==========================================

@app.post("/python/url/whois")
def python_url_whois(data: URLRequest):
    # Relies on geoip host extraction for simple lookup or mock
    host = extract_hostname(data.url)
    try:
        ip = socket.gethostbyname(host)
        return {"hostname": host, "ip": ip, "status": "resolved"}
    except Exception as e:
        return {"hostname": host, "error": str(e), "status": "failed"}

@app.post("/python/url/dns")
def python_url_dns(data: URLRequest):
    host = extract_hostname(data.url)
    try:
        addrs = socket.getaddrinfo(host, None)
        ips = list(set([addr[4][0] for addr in addrs]))
        return {"hostname": host, "ips": ips, "status": "resolved"}
    except Exception as e:
        return {"hostname": host, "error": str(e), "status": "failed"}

@app.post("/python/url/ssl")
def python_url_ssl(data: URLRequest):
    host = extract_hostname(data.url)
    ssl_data = run_ssl_check(host)
    return {"hostname": host, "ssl": ssl_data}

@app.post("/python/url/reputation")
def python_url_reputation(data: URLRequest):
    reput = scan_url_with_safe_browsing(data.url)
    return {"url": data.url, "reputation": reput}

@app.post("/python/url/analyze")
def python_url_analyze(data: URLRequest):
    host = extract_hostname(data.url)
    future_sb = executor.submit(scan_url_with_safe_browsing, data.url)
    future_ml = executor.submit(predict_url_safety, data.url)
    future_geo = executor.submit(resolve_geoip, data.url)
    future_ssl = executor.submit(run_ssl_check, host)
    
    return {
        "url": data.url,
        "safe_browsing": future_sb.result(),
        "ml": future_ml.result(),
        "geo": future_geo.result(),
        "ssl": future_ssl.result()
    }

# ==========================================
# 📧 EMAIL INTEL ROUTING
# ==========================================

@app.post("/python/email/analyze")
def python_email_analyze(data: EmailRequest):
    threat = predict_email_threat(data.content)
    return {"content": data.content, "analysis": threat}

@app.post("/python/email/nlp")
def python_email_nlp(data: EmailRequest):
    # Extracts basic indicator entities (Banking, Extortion, Urgency, etc)
    lower = data.content.lower()
    indicators = []
    if "urgent" in lower or "verify" in lower:
        indicators.append("URGENCY_PROMPT")
    if "bitcoin" in lower or "wallet" in lower:
        indicators.append("FINANCIAL_SCAM_INDICATOR")
    if "hacked" in lower or "webcam" in lower:
        indicators.append("EXTORTION_THREAT")
    return {"content": data.content, "nlp_entities": indicators}

@app.post("/python/email/risk")
def python_email_risk(data: EmailRequest):
    threat = predict_email_threat(data.content)
    return {"risk_score": threat["risk_score"], "risk_level": threat["risk_level"]}

# ==========================================
# 💬 MESSAGE INTEL ROUTING
# ==========================================

@app.post("/python/message/analyze")
def python_message_analyze(data: MessageRequest):
    threat = predict_message_threat(data.content)
    return {"content": data.content, "analysis": threat}

@app.post("/python/message/risk")
def python_message_risk(data: MessageRequest):
    threat = predict_message_threat(data.content)
    return {"risk_score": threat["risk_score"], "risk_level": threat["risk_level"]}

# ==========================================
# 🧠 AI ENGINE ROUTING
# ==========================================

@app.post("/python/ai/predict")
def python_ai_predict(data: UnifiedPredictRequest):
    if data.type.upper() == "URL":
        res = predict_url_safety(data.content)
    elif data.type.upper() == "EMAIL":
        res = predict_email_threat(data.content)
    elif data.type.upper() == "MESSAGE":
        res = predict_message_threat(data.content)
    else:
        raise HTTPException(status_code=400, detail="Invalid prediction type. Use URL, EMAIL, or MESSAGE.")
    return res

@app.post("/python/ai/classify")
def python_ai_classify(data: UnifiedPredictRequest):
    if data.type.upper() == "URL":
        res = predict_url_safety(data.content)
        threat_type = "Suspicious URL" if res["risk_level"] != "LOW" else "Safe URL"
    elif data.type.upper() == "EMAIL":
        res = predict_email_threat(data.content)
        threat_type = res["threat_type"]
    elif data.type.upper() == "MESSAGE":
        res = predict_message_threat(data.content)
        threat_type = res["threat_type"]
    else:
        raise HTTPException(status_code=400, detail="Invalid classification type.")
    return {"content": data.content, "threat_type": threat_type}

@app.post("/python/ai/threat-score")
def python_ai_threat_score(data: UnifiedPredictRequest):
    if data.type.upper() == "URL":
        res = predict_url_safety(data.content)
    elif data.type.upper() == "EMAIL":
        res = predict_email_threat(data.content)
    elif data.type.upper() == "MESSAGE":
        res = predict_message_threat(data.content)
    else:
        raise HTTPException(status_code=400, detail="Invalid request type.")
    return {"threat_score": res["risk_score"], "risk_level": res["risk_level"]}

# ==========================================
# 📊 ANALYTICS & FILTERS
# ==========================================

@app.get("/api/analytics")
def get_analytics(
    user_email: str = Query(..., description="Authenticated user email"),
    role: str = Query("USER", description="User role (USER or ADMIN)")
):
    try:
        scan_history = fetch_table_data("scan_history", user_email, role)
        email_scans = fetch_table_data("email_scans", user_email, role)
        
        total_url_scans = len(scan_history)
        total_email_scans = len(email_scans)
        total_scans = total_url_scans + total_email_scans
        
        safe_urls = len([s for s in scan_history if s.get("risk_level") == "LOW"])
        dangerous_urls = len([s for s in scan_history if s.get("risk_level") in ["HIGH", "MEDIUM"]])
        
        safe_emails = len([s for s in email_scans if s.get("risk_level") == "LOW"])
        dangerous_emails = len([s for s in email_scans if s.get("risk_level") in ["HIGH", "MEDIUM"]])
        
        high_risk_count = (
            len([s for s in scan_history if s.get("risk_level") == "HIGH"]) +
            len([s for s in email_scans if s.get("risk_level") == "HIGH"])
        )
        
        threat_distribution = [
            {"name": "Safe (Low)", "value": safe_urls + safe_emails},
            {"name": "Suspicious (Medium)", "value": len([s for s in scan_history if s.get("risk_level") == "MEDIUM"]) + len([s for s in email_scans if s.get("risk_level") == "MEDIUM"])},
            {"name": "Dangerous (High)", "value": high_risk_count}
        ]
        
        daily_data = {}
        now = datetime.datetime.utcnow()
        for i in range(14, -1, -1):
            day = (now - datetime.timedelta(days=i)).strftime("%Y-%m-%d")
            daily_data[day] = {"date": day, "urls": 0, "emails": 0, "scans": 0}
            
        for s in scan_history:
            d = s.get("created_at", "")[:10]
            if d in daily_data:
                daily_data[d]["urls"] += 1
                daily_data[d]["scans"] += 1
                
        for s in email_scans:
            d = s.get("created_at", "")[:10]
            if d in daily_data:
                daily_data[d]["emails"] += 1
                daily_data[d]["scans"] += 1
                
        chart_data = sorted(list(daily_data.values()), key=lambda x: x["date"])
        
        country_counts = {}
        for s in scan_history:
            code = s.get("country_code")
            name = s.get("country_name")
            if code and name:
                if code not in country_counts:
                    country_counts[code] = {"country_code": code, "country_name": name, "count": 0}
                country_counts[code]["count"] += 1
        
        recent_geolocations = sorted(list(country_counts.values()), key=lambda x: x["count"], reverse=True)

        total_users = 0
        total_reports = 0
        if role == "ADMIN":
            users = fetch_table_data("users", role="ADMIN")
            total_users = len(users)
            reports = fetch_table_data("reports", role="ADMIN")
            total_reports = len(reports)
            
        return {
            "success": True,
            "data": {
                "totalScans": total_scans,
                "safeUrls": safe_urls,
                "dangerousUrls": dangerous_urls,
                "emailScans": total_email_scans,
                "highRiskCount": high_risk_count,
                "totalUsers": total_users,
                "totalReports": total_reports,
                "chartData": chart_data,
                "threatDistribution": threat_distribution,
                "recentGeolocations": recent_geolocations
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.get("/api/history")
def get_history(
    user_email: str = Query(..., description="Authenticated user email"),
    role: str = Query("USER", description="User role"),
    risk: Optional[str] = Query(None, description="Risk level filter: ALL, LOW, MEDIUM, HIGH"),
    type: Optional[str] = Query(None, description="Scan type filter: ALL, URL, EMAIL"),
    date: Optional[str] = Query(None, description="Date filter: TODAY, 7DAYS, 30DAYS"),
    search: Optional[str] = Query(None, description="Keyword search text")
):
    try:
        scan_history = fetch_table_data("scan_history", user_email, role)
        email_scans = fetch_table_data("email_scans", user_email, role)
        
        combined = []
        for item in scan_history:
            recommendation = "Avoid Visiting" if item.get("risk_level") == "HIGH" else "Proceed Carefully" if item.get("risk_level") == "MEDIUM" else "Safe to Continue"
            combined.append({
                "id": item.get("id"),
                "type": "URL",
                "url": item.get("content") or item.get("url"),
                "content": item.get("content") or item.get("url"),
                "risk_score": item.get("risk_score", 0),
                "risk_level": item.get("risk_level", "LOW"),
                "status": item.get("result") or item.get("status") or "Scanned",
                "recommendation": recommendation,
                "created_at": item.get("created_at")
            })
            
        for item in email_scans:
            result_details = item.get("result", {})
            if not isinstance(result_details, dict):
                result_details = {}
            rec = result_details.get("recommendation", "Scanned")
            combined.append({
                "id": item.get("id"),
                "type": "EMAIL",
                "url": "",
                "content": item.get("content", ""),
                "risk_score": item.get("risk_score", 0),
                "risk_level": item.get("risk_level", "LOW"),
                "status": rec,
                "recommendation": rec,
                "created_at": item.get("created_at")
            })
            
        if type and type.upper() != "ALL":
            combined = [item for item in combined if item["type"] == type.upper()]
            
        if risk and risk.upper() != "ALL":
            combined = [item for item in combined if item["risk_level"] == risk.upper()]
            
        if date and date.upper() != "ALL":
            now = datetime.datetime.utcnow()
            filtered_by_date = []
            for item in combined:
                item_date = parse_date(item["created_at"])
                if not item_date:
                    filtered_by_date.append(item)
                    continue
                diff = now - item_date
                if date.upper() == "TODAY" and diff.days == 0:
                    filtered_by_date.append(item)
                elif date.upper() == "7DAYS" and diff.days <= 7:
                    filtered_by_date.append(item)
                elif date.upper() == "30DAYS" and diff.days <= 30:
                    filtered_by_date.append(item)
            combined = filtered_by_date
            
        if search:
            search_lower = search.lower()
            combined = [
                item for item in combined 
                if search_lower in (item["content"] or "").lower() or search_lower in (item["url"] or "").lower()
            ]
            
        combined = sorted(combined, key=lambda x: x["created_at"] or "", reverse=True)
        return {"success": True, "data": combined}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.get("/api/reports")
def get_reports(
    user_email: str = Query(..., description="Authenticated user email"),
    role: str = Query("USER", description="User role"),
    risk: Optional[str] = Query(None, description="Risk level filter: ALL, LOW, MEDIUM, HIGH"),
    type: Optional[str] = Query(None, description="Report type filter: ALL, URL, EMAIL"),
    date: Optional[str] = Query(None, description="Date filter: TODAY, 7DAYS, 30DAYS"),
    search: Optional[str] = Query(None, description="Keyword search text")
):
    try:
        reports = fetch_table_data("reports", user_email, role)
        
        if type and type.upper() != "ALL":
            reports = [item for item in reports if item.get("report_type") == type.upper()]
            
        if risk and risk.upper() != "ALL":
            reports = [
                item for item in reports 
                if (item.get("details", {}).get("risk_level") if isinstance(item.get("details"), dict) else "").upper() == risk.upper()
            ]
            
        if date and date.upper() != "ALL":
            now = datetime.datetime.utcnow()
            filtered_by_date = []
            for item in reports:
                item_date = parse_date(item.get("created_at"))
                if not item_date:
                    filtered_by_date.append(item)
                    continue
                diff = now - item_date
                if date.upper() == "TODAY" and diff.days == 0:
                    filtered_by_date.append(item)
                elif date.upper() == "7DAYS" and diff.days <= 7:
                    filtered_by_date.append(item)
                elif date.upper() == "30DAYS" and diff.days <= 30:
                    filtered_by_date.append(item)
            reports = filtered_by_date
            
        if search:
            search_lower = search.lower()
            filtered_by_search = []
            for item in reports:
                details = item.get("details", {})
                if not isinstance(details, dict):
                    details = {}
                reasons = str(details.get("reasons", ""))
                detected = str(details.get("detected_keywords", ""))
                status = str(details.get("status", ""))
                preview = str(details.get("preview", ""))
                rec = str(details.get("recommendation", ""))
                
                if (
                    search_lower in reasons.lower() or 
                    search_lower in detected.lower() or 
                    search_lower in status.lower() or 
                    search_lower in preview.lower() or 
                    search_lower in rec.lower() or
                    search_lower in (item.get("report_type", "")).lower()
                ):
                    filtered_by_search.append(item)
            reports = filtered_by_search
            
        return {"success": True, "data": reports}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
