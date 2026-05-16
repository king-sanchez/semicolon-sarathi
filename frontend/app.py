import streamlit as st
import requests
import os

# Backend URL from environment variable
BACKEND_URL = os.getenv(
    "BACKEND_URL",
    "http://backend:8001"
)

# Page Config
st.set_page_config(
    page_title="Semicolon-Sarathi",
    page_icon="🇮🇳",
    layout="centered"
)

# Title
st.title("🇮🇳 Semicolon-Sarathi")
st.subheader("AI-Powered Government Scheme Recommendation Portal")

st.divider()

# User Inputs
age = st.number_input(
    "Enter Your Age",
    min_value=0,
    max_value=120,
    step=1
)

gender = st.selectbox(
    "Select Gender",
    ["Male", "Female", "Other"]
)

state = st.text_input(
    "Enter State"
)

category = st.selectbox(
    "Select Category",
    ["General", "OBC", "SC", "ST", "Minority"]
)

income = st.number_input(
    "Annual Family Income (INR)",
    min_value=0,
    step=1000
)

# Submit Button
if st.button("Find Eligible Schemes"):

    payload = {
        "age": age,
        "gender": gender,
        "state": state,
        "category": category,
        "income": income
    }

    try:

        with st.spinner("Analyzing your profile..."):

            response = requests.post(
                f"{BACKEND_URL}/recommend",
                json=payload,
                timeout=60
            )

        # Backend status check
        if response.status_code != 200:
            st.error(f"Backend Error: {response.status_code}")
            st.text(response.text)
            st.stop()

        # JSON parsing safety
        try:
            data = response.json()

        except Exception:
            st.error("Backend returned invalid JSON")
            st.text(response.text)
            st.stop()

        # AI Summary Section
        st.divider()
        st.subheader("🧠 AI Explanation")

        ai_summary = data.get("ai_summary", {})

        if isinstance(ai_summary, dict):

            if "message" in ai_summary:
                st.info(ai_summary["message"])

            else:
                st.json(ai_summary)

        else:
            st.write(ai_summary)

        # Schemes Section
        st.divider()
        st.subheader("🎯 Eligible Schemes")

        schemes = data.get("schemes", [])

        if not schemes:
            st.warning("No matching schemes found.")
        else:

            for s in schemes:

                with st.container(border=True):

                    st.markdown(f"### {s['name']}")

                    st.write(s['description'])

                    col1, col2 = st.columns(2)

                    with col1:
                        st.info(f"📍 State: {s['state']}")

                    with col2:

                        income_limit = s["income_limit_inr"]

                        if income_limit >= 9999999:
                            display_income = "No Income Limit"
                        else:
                            display_income = f"₹{income_limit:,}"

                        st.success(
                            f"💰 Income Cap: {display_income}"
                        )

                    st.link_button(
                        "Apply on Official Portal",
                        s["apply_url"],
                        use_container_width=True
                    )

    except requests.exceptions.ConnectionError:

        st.error(
            "Cannot connect to backend service."
        )

        st.info(
            f"Expected backend URL: {BACKEND_URL}"
        )

    except requests.exceptions.Timeout:

        st.error(
            "Backend request timed out."
        )

    except Exception as e:

        st.error(
            f"Unexpected Error: {str(e)}"
        )
