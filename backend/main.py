from fastapi import FastAPI
from pydantic import BaseModel
import json
from ai_client import ask_ai

app = FastAPI()

class UserProfile(BaseModel):
    age: int
    gender: str
    state: str
    category: str
    income: int


def filter_schemes(user_data):
    with open('schemes.json', 'r', encoding='utf-8') as f:
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

    ai_response = ask_ai(profile, schemes)

    return {
        "schemes": schemes,
        "ai_summary": ai_response
    }
