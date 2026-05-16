import requests
import os

AI_GATEWAY_URL = os.getenv("AI_GATEWAY_URL")
AI_API_KEY = os.getenv("AI_API_KEY")
AI_MODEL_NAME = os.getenv("AI_MODEL_NAME")


def ask_ai(profile, schemes):

    prompt = f"""
    User Profile:
    {profile}

    Eligible schemes:
    {schemes}

    Explain these schemes in simple Indian English.
    """

    payload = {
        "model": AI_MODEL_NAME,
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ]
    }

    headers = {
        "Authorization": f"Bearer {AI_API_KEY}",
        "Content-Type": "application/json"
    }

    response = requests.post(
        AI_GATEWAY_URL,
        json=payload,
        headers=headers,
        timeout=60
    )

    return response.json()
