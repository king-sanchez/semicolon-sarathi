import os

import requests
import streamlit as st


BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8001").rstrip("/")


st.title("Semicolon-Sarathi")

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

    try:
        response = requests.post(
            f"{BACKEND_URL}/recommend",
            json=payload,
            timeout=30
        )
    except requests.RequestException as exc:
        st.error("Could not reach the backend API.")
        st.text(str(exc))
        st.stop()

    if response.status_code != 200:
        st.error(f"Backend Error: {response.status_code}")
        st.text(response.text)
        st.stop()

    data = response.json()

    st.subheader("AI Summary")
    st.write(data["ai_summary"])

    st.subheader("Eligible Schemes")

    for scheme in data["schemes"]:
        st.write(f"### {scheme['name']}")
        st.write(scheme["description"])
        st.link_button("Apply", scheme["apply_url"])
