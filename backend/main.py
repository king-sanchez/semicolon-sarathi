from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
from pathlib import Path
from ai_client import ask_ai

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health Check
@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "Semicolon-Sarathi Backend"
    }

class UserProfile(BaseModel):
    age: int
    gender: str
    state: str
    category: str
    income: int


def get_schemes_path():
    configured_path = os.getenv("SCHEMES_FILE")
    if configured_path:
        return Path(configured_path)

    app_dir = Path(__file__).resolve().parent
    candidates = [
        app_dir / "schemes.json",
        app_dir.parent / "schemes.json",
    ]

    for candidate in candidates:
        if candidate.exists():
            return candidate

    return candidates[0]


def filter_schemes(user_data):

    with get_schemes_path().open('r', encoding='utf-8') as f:
        schemes = json.load(f)

    results = []

    for s in schemes:

        gender_match = (
            s['gender'] == "All"
            or s['gender'].lower() == user_data.gender.lower()
        )

        state_match = (
            s['state'] == "All"
            or s['state'].lower() == user_data.state.lower()
        )

        age_match = (
            s['age_min'] <= user_data.age <= s['age_max']
        )

        cat_match = (
            user_data.category.lower()
            in [c.lower() for c in s['category']]
        )

        income_match = (
            user_data.income <= s['income_limit_inr']
        )

        if (
            gender_match
            and state_match
            and age_match
            and cat_match
            and income_match
        ):
            results.append(s)

    return results


@app.post("/recommend")
async def recommend(profile: UserProfile):

    schemes = filter_schemes(profile)

    try:
        ai_response = ask_ai(profile, schemes)

    except Exception:
        ai_response = {
            "message": (
                "Matching schemes found successfully, "
                "but AI explanation is currently unavailable."
            )
        }

    return {
        "schemes": schemes,
        "ai_summary": ai_response
    }
