import streamlit as st
import requests

BACKEND_URL = "http://backend:8001"

st.title("Semicolon-Sarathi 🇮🇳")

age = st.number_input("Age", 0, 100)
gender = st.selectbox("Gender", ["Male", "Female", "Other"])
state = st.text_input("State")
category = st.selectbox(
    "Category",
    ["General", "OBC", "SC", "ST", "Minority"]
)
income = st.number_input("Income", 0)

if st.button("Find Schemes"):

    payload = {
        "age": age,
        "gender": gender,
        "state": state,
        "category": category,
        "income": income
    }

    response = requests.post(
        f"{BACKEND_URL}/recommend",
        json=payload
    )

    data = response.json()

    st.subheader("AI Summary")
    st.write(data["ai_summary"])

    st.subheader("Eligible Schemes")

    for s in data["schemes"]:
        st.write(f"### {s['name']}")
        st.write(s['description'])
