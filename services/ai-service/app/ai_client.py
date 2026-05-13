import requests

AI_SERVICE_URL = "http://localhost:8002/analyze-report"

def analyze_report(user_id, report_text):

    response = requests.post(
        AI_SERVICE_URL,
        json={
            "user_id": user_id,
            "report_text": report_text
        }
    )

    return response.json()