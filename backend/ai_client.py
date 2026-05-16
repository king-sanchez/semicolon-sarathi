import os
from pathlib import Path

import requests
from dotenv import load_dotenv


load_dotenv(Path(__file__).resolve().parent.parent / ".env")

AI_GATEWAY_URL = os.getenv("AI_GATEWAY_URL")
AI_API_KEY = os.getenv("AI_API_KEY")
AI_MODEL_NAME = os.getenv("AI_MODEL_NAME")

PLACEHOLDER_VALUES = {
    "paste_your_openai_api_key_here",
    "your_openai_api_key_here",
    "your_api_key_here",
    "your_model_name_here",
    "https://your-gateway-url.example/v1/chat/completions",
}


def is_configured(value):
    return bool(value) and value.strip() not in PLACEHOLDER_VALUES


def ask_ai(profile, schemes):
    if (
        not is_configured(AI_GATEWAY_URL)
        or not is_configured(AI_API_KEY)
        or not is_configured(AI_MODEL_NAME)
    ):
        return {
            "message": (
                "AI explanation is unavailable because AI_GATEWAY_URL, "
                "AI_API_KEY, or AI_MODEL_NAME is not configured."
            )
        }

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

    try:

        response = requests.post(
            AI_GATEWAY_URL,
            json=payload,
            headers=headers,
            timeout=60
        )

        print("STATUS:", response.status_code)
        print("TEXT:", response.text)

        if response.status_code != 200:
            return {
                "message": "AI gateway error",
                "status_code": response.status_code,
                "response": response.text
            }

        return response.json()

    except Exception as e:

        return {
            "message": "AI request failed",
            "error": str(e)
        }
