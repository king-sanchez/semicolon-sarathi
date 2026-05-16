import requests
import os

# ---------------------------------------------------
# Environment Variables
# ---------------------------------------------------

AI_GATEWAY_URL = os.getenv("AI_GATEWAY_URL")

AI_API_KEY = os.getenv("AI_API_KEY")

AI_MODEL_NAME = os.getenv("AI_MODEL_NAME")

# ---------------------------------------------------
# AI Request Function
# ---------------------------------------------------

def ask_ai(profile, schemes):

    # Prompt Construction
    prompt = f"""
You are an AI assistant helping Indian citizens understand
government welfare schemes.

User Profile:
{profile}

Eligible Schemes:
{schemes}

Explain:
1. Why these schemes are relevant
2. Benefits in simple Indian English
3. Important eligibility notes
4. Which scheme should be prioritized first

Keep the explanation concise and easy to understand.
"""

    # Request Payload
    payload = {
        "model": AI_MODEL_NAME,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a helpful Indian government "
                    "scheme assistant."
                )
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.4,
        "max_tokens": 500
    }

    # Headers
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

        # Debug Logs
        print("AI STATUS:", response.status_code)
        print("AI RESPONSE:", response.text)

        # Non-200 response handling
        if response.status_code != 200:

            return {
                "message": "AI gateway returned an error.",
                "status_code": response.status_code,
                "response": response.text
            }

        # Parse JSON safely
        try:

            result = response.json()

        except Exception:

            return {
                "message": (
                    "AI gateway returned invalid JSON."
                ),
                "raw_response": response.text
            }

        # OpenAI-style extraction
        try:

            ai_text = (
                result["choices"][0]
                ["message"]["content"]
            )

            return {
                "summary": ai_text
            }

        except Exception:

            # Return full response if structure differs
            return result

    except requests.exceptions.Timeout:

        return {
            "message": "AI request timed out."
        }

    except requests.exceptions.ConnectionError:

        return {
            "message": (
                "Could not connect to AI gateway."
            )
        }

    except Exception as e:

        return {
            "message": "Unexpected AI error occurred.",
            "error": str(e)
        }
