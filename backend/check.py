import urllib.request
import urllib.error

req = urllib.request.Request('https://meshark-ai-cv-builder-backend.onrender.com/', method='GET')
try:
    response = urllib.request.urlopen(req)
    print("SUCCESS")
    print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"HTTP Error {e.code}")
    print(e.read().decode('utf-8'))
except Exception as e:
    print(f"Error: {e}")
