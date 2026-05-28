from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import datetime

from app.schemas.url import URLRequest
from app.services.safe_browsing import scan_url_with_safe_browsing
from app.services.db_query import fetch_table_data

app = FastAPI(title="SentinelScan Python ML & Reputation Engine")

# Add CORS Middleware to ensure smooth communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.get("/")
def home():
    return {"message": "Phishing Detection Python Backend Running"}

@app.post("/scan-url")
def scan_url(data: URLRequest):
    return scan_url_with_safe_browsing(data.url)

# DAY 19 - Analytics computations
@app.get("/api/analytics")
def get_analytics(
    user_email: str = Query(..., description="Authenticated user email"),
    role: str = Query("USER", description="User role (USER or ADMIN)")
):
    try:
        # Fetch data from Supabase
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
        
        # 1. Threat distribution (Pie Chart)
        threat_distribution = [
            {"name": "Safe (Low)", "value": safe_urls + safe_emails},
            {"name": "Suspicious (Medium)", "value": len([s for s in scan_history if s.get("risk_level") == "MEDIUM"]) + len([s for s in email_scans if s.get("risk_level") == "MEDIUM"])},
            {"name": "Dangerous (High)", "value": high_risk_count}
        ]
        
        # 2. Daily scan activity (Bar/Line Chart)
        daily_data = {}
        # Get data from last 14 days to compute growth
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
                
        # Sort chronologically
        chart_data = sorted(list(daily_data.values()), key=lambda x: x["date"])
        
        # 3. Admin dashboard counts (if role == ADMIN, fetch registrations count)
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
                "totalScans": totalScans,
                "safeUrls": safe_urls,
                "dangerousUrls": dangerous_urls,
                "emailScans": total_email_scans,
                "highRiskCount": high_risk_count,
                "totalUsers": total_users,
                "totalReports": total_reports,
                "chartData": chart_data,
                "threatDistribution": threat_distribution
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

# DAY 20 - Search and filters for history
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
        
        # Combine
        combined = []
        
        # Map URL scans
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
            
        # Map Email scans
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
            
        # Apply filters
        # 1. Type
        if type and type.upper() != "ALL":
            combined = [item for item in combined if item["type"] == type.upper()]
            
        # 2. Risk
        if risk and risk.upper() != "ALL":
            combined = [item for item in combined if item["risk_level"] == risk.upper()]
            
        # 3. Date
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
            
        # 4. Search
        if search:
            search_lower = search.lower()
            combined = [
                item for item in combined 
                if search_lower in (item["content"] or "").lower() or search_lower in (item["url"] or "").lower()
            ]
            
        # Sort combined list by created_at desc
        combined = sorted(combined, key=lambda x: x["created_at"] or "", reverse=True)
        
        return {
            "success": True,
            "data": combined
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

# DAY 20 - Search and filters for Reports
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
        
        # Apply filters
        # 1. Type
        if type and type.upper() != "ALL":
            reports = [item for item in reports if item.get("report_type") == type.upper()]
            
        # 2. Risk
        if risk and risk.upper() != "ALL":
            reports = [
                item for item in reports 
                if (item.get("details", {}).get("risk_level") if isinstance(item.get("details"), dict) else "").upper() == risk.upper()
            ]
            
        # 3. Date
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
            
        # 4. Search
        if search:
            search_lower = search.lower()
            filtered_by_search = []
            for item in reports:
                details = item.get("details", {})
                if not isinstance(details, dict):
                    details = {}
                # Match against various detail fields
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
            
        return {
            "success": True,
            "data": reports
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
