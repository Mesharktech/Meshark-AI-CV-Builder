import urllib.request
import urllib.error
import time

url = 'https://meshark-ai-cv-builder.onrender.com/api/admin/seed_templates'
print(f"Pinging {url} to wake up server and seed templates...")

attempts = 3
for attempt in range(attempts):
    try:
        req = urllib.request.Request(url, method='POST')
        # 60s timeout for cold start
        response = urllib.request.urlopen(req, timeout=60)
        print("SUCCESS")
        print(response.read().decode('utf-8'))
        break
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}")
        print(e.read().decode('utf-8'))
        break
    except Exception as e:
        print(f"Attempt {attempt+1} failed: {e}")
        time.sleep(5)
