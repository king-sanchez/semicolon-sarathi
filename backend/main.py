from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ai_client import ask_ai

import json
import os

# ---------------------------------------------------
# FastAPI App
# ---------------------------------------------------

app = FastAPI()

# ---------------------------------------------------
# CORS
# ---------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------
# File Paths
# ---------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

SCHEMES_PATH = os.path.join(
    BASE_DIR,
    "schemes.json"
)

# ---------------------------------------------------
# Health Endpoint
# ---------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "Semicolon-Sarathi Backend Running"
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "Semicolon-Sarathi Backend"
    }

# ---------------------------------------------------
# Request Model
# ---------------------------------------------------

class UserProfile(BaseModel):
    age: int
    gender: str
    state: str
    category: str
    income: int

# ---------------------------------------------------
# Scheme Filtering Logic
# ---------------------------------------------------

def filter_schemes(user_data):

    with open(
        SCHEMES_PATH,
        'r',
        encoding='utf-8'
    ) as f:

        schemes = json.load(f)

    results = []

    for s in schemes:

        # Gender Match
        gender_match = (
            s['gender'] == "All"
            or s['gender'].lower()
            == user_data.gender.lower()
        )

        # State Match
        state_match = (
            s['state'] == "All"
            or s['state'].lower()
            == user_data.state.lower()
        )

        # Age Match
        age_match = (
            s['age_min']
            <= user_data.age
            <= s['age_max']
        )

        # Category Match
        cat_match = (
            user_data.category.lower()
            in [c.lower() for c in s['category']]
        )

        # Income Match
        income_match = (
            user_data.income
            <= s['income_limit_inr']
        )

        # Final Eligibility
        if (
            gender_match
            and state_match
            and age_match
            and cat_match
            and income_match
        ):
            results.append(s)

    return results

# ---------------------------------------------------
# Recommendation Endpoint
# ---------------------------------------------------

@app.post("/recommend")
async def recommend(profile: UserProfile):

    schemes = filter_schemes(profile)

    # AI Summary
    try:

        ai_response = ask_ai(
            profile,
            schemes
        )

    except Exception as e:

        ai_response = {
            "message": (
                "Matching schemes found successfully, "
                "but AI explanation is currently unavailable."
            ),
            "error": str(e)
        }

    return {
        "schemes": schemes,
        "ai_summary": ai_response
    }
