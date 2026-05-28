import requests
from app.config import settings

def fetch_table_data(table: str, user_email: str = None, role: str = "USER") -> list:
  """
  Fetches data from a Supabase table. 
  If user is not an ADMIN, filters records specifically by user_email to enforce security.
  """
  url = f"{settings.SUPABASE_URL}/rest/v1/{table}"
  headers = {
    "apikey": settings.SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {settings.SUPABASE_ANON_KEY}",
    "Content-Type": "application/json"
  }
  
  params = {
    "order": "created_at.desc"
  }
  
  if role != "ADMIN" and user_email:
    params["user_email"] = f"eq.{user_email}"

  try:
    response = requests.get(url, headers=headers, params=params, timeout=10)
    if response.status_code in [200, 201]:
      return response.json()
    else:
      print(f"Supabase REST API Error for {table}: {response.status_code} - {response.text}")
      return []
  except Exception as e:
    print(f"Exception querying Supabase table {table}: {str(e)}")
    return []
