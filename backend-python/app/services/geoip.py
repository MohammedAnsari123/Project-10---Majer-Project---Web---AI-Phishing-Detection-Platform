import socket
import requests

def resolve_geoip(url_or_host: str):
    """
    Resolves domain hostname to IP address and fetches geolocation metadata.
    """
    clean_host = url_or_host
    if "://" in clean_host:
        clean_host = clean_host.split("://")[1]
    if "/" in clean_host:
        clean_host = clean_host.split("/")[0]
    if ":" in clean_host:
        clean_host = clean_host.split(":")[0]

    try:
        # 1. Resolve host to IP
        ip_address = socket.gethostbyname(clean_host)
        
        # Check if local/private IP
        if ip_address.startswith(("127.", "10.", "192.168.", "172.16.")):
            return {
                "ip": ip_address,
                "country_code": "US",
                "country_name": "Local Host / Private Network",
                "lat": 37.751,
                "lon": -97.822
            }

        # 2. Call public lookup API (ip-api.com is free and requires no key)
        res = requests.get(f"http://ip-api.com/json/{ip_address}", timeout=2)
        if res.status_code == 200:
            data = res.json()
            if data.get("status") == "success":
                return {
                    "ip": ip_address,
                    "country_code": data.get("countryCode", "US"),
                    "country_name": data.get("country", "United States"),
                    "lat": data.get("lat", 37.751),
                    "lon": data.get("lon", -97.822)
                }
    except Exception as e:
        print(f"GeoIP resolution failed for {clean_host}: {e}")

    # Fallback default (safe US geolocation)
    return {
        "ip": "0.0.0.0",
        "country_code": "US",
        "country_name": "Unknown Hosting Location",
        "lat": 37.751,
        "lon": -97.822
    }
