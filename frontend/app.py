import html
import json
import os
import re
from pathlib import Path

import requests
import streamlit as st
from dotenv import load_dotenv


load_dotenv(Path(__file__).resolve().parent.parent / ".env")


BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8001").rstrip("/")
SCHEMES_PATH = Path(__file__).resolve().parent.parent / "schemes.json"

GENDER_ALIASES = {
    "male": "Male",
    "man": "Male",
    "boy": "Male",
    "female": "Female",
    "woman": "Female",
    "girl": "Female",
    "other": "Other",
    "nonbinary": "Other",
    "non-binary": "Other",
}

CATEGORY_ALIASES = {
    "general": "General",
    "obc": "OBC",
    "sc": "SC",
    "st": "ST",
    "minority": "Minority",
    "ebc": "EBC",
    "dnt": "DNT",
}

STATE_ALIASES = {
    "andaman and nicobar islands": "Andaman and Nicobar Islands",
    "andhra pradesh": "Andhra Pradesh",
    "arunachal pradesh": "Arunachal Pradesh",
    "assam": "Assam",
    "bihar": "Bihar",
    "chandigarh": "Chandigarh",
    "chhattisgarh": "Chhattisgarh",
    "dadra and nagar haveli and daman and diu": (
        "Dadra and Nagar Haveli and Daman and Diu"
    ),
    "delhi": "Delhi",
    "goa": "Goa",
    "gujarat": "Gujarat",
    "haryana": "Haryana",
    "himachal pradesh": "Himachal Pradesh",
    "jammu and kashmir": "Jammu and Kashmir",
    "jharkhand": "Jharkhand",
    "karnataka": "Karnataka",
    "kerala": "Kerala",
    "ladakh": "Ladakh",
    "lakshadweep": "Lakshadweep",
    "madhya pradesh": "Madhya Pradesh",
    "maharashtra": "Maharashtra",
    "manipur": "Manipur",
    "meghalaya": "Meghalaya",
    "mizoram": "Mizoram",
    "nagaland": "Nagaland",
    "odisha": "Odisha",
    "puducherry": "Puducherry",
    "punjab": "Punjab",
    "rajasthan": "Rajasthan",
    "sikkim": "Sikkim",
    "tamil nadu": "Tamil Nadu",
    "telangana": "Telangana",
    "tripura": "Tripura",
    "uttar pradesh": "Uttar Pradesh",
    "uttarakhand": "Uttarakhand",
    "west bengal": "West Bengal",
    "mp": "Madhya Pradesh",
    "m.p.": "Madhya Pradesh",
    "wb": "West Bengal",
    "w.b.": "West Bengal",
}

INDIAN_STATES_AND_UTS = [
    "Andaman and Nicobar Islands",
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chandigarh",
    "Chhattisgarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jammu and Kashmir",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Ladakh",
    "Lakshadweep",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Puducherry",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
]

DEFAULT_CATEGORY_OPTIONS = [
    "General",
    "OBC",
    "SC",
    "ST",
    "Minority",
    "EBC",
    "DNT",
]


def load_category_options():
    if not SCHEMES_PATH.exists():
        return DEFAULT_CATEGORY_OPTIONS

    with SCHEMES_PATH.open("r", encoding="utf-8") as handle:
        schemes = json.load(handle)

    discovered = []
    for scheme in schemes:
        for category in scheme.get("category", []):
            if category not in discovered:
                discovered.append(category)

    ordered = [value for value in DEFAULT_CATEGORY_OPTIONS if value in discovered]
    extras = sorted(value for value in discovered if value not in ordered)
    return ordered + extras


CATEGORY_OPTIONS = load_category_options()


def inject_styles():
    st.markdown(
        """
        <style>
        .stApp {
            background:
                radial-gradient(circle at top left, rgba(230, 245, 236, 0.95), transparent 30%),
                linear-gradient(180deg, #f7fbf8 0%, #eef5f2 50%, #f6f4ee 100%);
            color: #153128;
        }

        [data-testid="stSidebar"] {
            background: linear-gradient(180deg, #eef6f0 0%, #e9f2ec 100%);
        }

        .block-container {
            max-width: 900px;
            padding-top: 2rem;
            padding-bottom: 3rem;
        }

        .summary-panel {
            margin: 0.35rem 0 1rem 0;
            padding: 1.1rem 1.2rem;
            border-radius: 18px;
            background: linear-gradient(135deg, #14532d 0%, #0f766e 100%);
            color: #f6fff8;
            box-shadow: 0 14px 36px rgba(15, 118, 110, 0.14);
        }

        .summary-kicker {
            margin: 0;
            font-size: 0.78rem;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            opacity: 0.82;
        }

        .summary-title {
            margin: 0.3rem 0 0.8rem 0;
            font-size: 1.35rem;
            font-weight: 700;
            line-height: 1.3;
        }

        .chip-row {
            display: flex;
            flex-wrap: wrap;
            gap: 0.45rem;
            margin-top: 0.35rem;
        }

        .chip {
            display: inline-flex;
            align-items: center;
            border-radius: 999px;
            padding: 0.28rem 0.72rem;
            font-size: 0.84rem;
            font-weight: 600;
            white-space: nowrap;
        }

        .chip-light {
            background: rgba(255, 255, 255, 0.14);
            border: 1px solid rgba(255, 255, 255, 0.18);
            color: #f6fff8;
        }

        .chip-soft {
            background: #edf7f0;
            border: 1px solid #cfe6d4;
            color: #1b4d36;
        }

        .chip-strong {
            background: #fff3df;
            border: 1px solid #f1d4a1;
            color: #8a4b00;
        }

        .section-label {
            margin: 1rem 0 0.45rem 0;
            font-size: 0.82rem;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #486357;
        }

        .selector-panel {
            margin-top: 0.8rem;
            padding: 1rem 1rem 0.2rem 1rem;
            border: 1px solid #d6e4da;
            border-radius: 18px;
            background: rgba(255, 255, 255, 0.82);
            box-shadow: 0 12px 30px rgba(21, 49, 40, 0.05);
        }

        .selector-title {
            margin: 0 0 0.2rem 0;
            font-size: 1rem;
            font-weight: 700;
            color: #153128;
        }

        .selector-copy {
            margin: 0 0 0.8rem 0;
            color: #587164;
            font-size: 0.92rem;
        }

        .scheme-name {
            margin: 0 0 0.35rem 0;
            font-size: 1.12rem;
            font-weight: 700;
            color: #173227;
        }

        .scheme-copy {
            margin: 0.55rem 0 0 0;
            color: #456257;
            font-size: 0.95rem;
        }

        .metric-note {
            margin: 0.2rem 0 0 0;
            color: #5c7768;
            font-size: 0.9rem;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )


def parse_amount(text):
    cleaned = text.lower().replace(",", "").replace("rs.", "").replace("rs", "")
    cleaned = cleaned.replace("inr", "").replace("rupees", "").strip()

    if cleaned in {"0", "zero", "none", "no income"}:
        return 0, None

    match = re.search(r"\d+(?:\.\d+)?", cleaned)
    if not match:
        return None, "Please enter a number."

    value = float(match.group())
    if "crore" in cleaned:
        value *= 10000000
    elif "lakh" in cleaned or "lac" in cleaned:
        value *= 100000

    return int(value), None


def parse_age(text):
    value, error = parse_amount(text)
    if error:
        return None, "Please enter your age as a number."
    if value < 0 or value > 100:
        return None, "Please enter an age between 0 and 100."
    return value, None


def parse_gender(text):
    cleaned = re.sub(r"\s+", " ", text.strip().lower())
    value = GENDER_ALIASES.get(cleaned)
    if not value:
        return None, "Please reply with Male, Female, or Other."
    return value, None


def parse_state(text):
    cleaned = re.sub(r"\s+", " ", text.strip())
    if not cleaned:
        return None, "Please choose your state."

    return STATE_ALIASES.get(cleaned.lower(), cleaned.title()), None


def parse_category(text):
    cleaned = re.sub(r"[^a-z]", "", text.lower())
    value = CATEGORY_ALIASES.get(cleaned)
    if not value:
        return None, "Please choose a supported category."
    return value, None


def parse_income(text):
    value, error = parse_amount(text)
    if error:
        return None, "Please enter annual income as a number, for example 180000."
    if value < 0:
        return None, "Please enter annual income as zero or more."
    return value, None


PROFILE_STEPS = [
    {
        "key": "age",
        "question": "What is your age?",
        "parser": parse_age,
        "input_kind": "chat",
    },
    {
        "key": "gender",
        "question": "Which gender should I use? Male, Female, or Other.",
        "parser": parse_gender,
        "input_kind": "chat",
    },
    {
        "key": "state",
        "question": "Which state do you live in? Choose from the list below.",
        "parser": parse_state,
        "input_kind": "select",
        "options": INDIAN_STATES_AND_UTS,
        "selector_title": "Select your state",
    },
    {
        "key": "category",
        "question": "Which category should I use? Choose from the list below.",
        "parser": parse_category,
        "input_kind": "select",
        "options": CATEGORY_OPTIONS,
        "selector_title": "Select your category",
    },
    {
        "key": "income",
        "question": "What is your annual household income in INR?",
        "parser": parse_income,
        "input_kind": "chat",
    },
]


def format_currency(amount):
    return f"Rs {amount:,}"


def format_age_range(min_age, max_age):
    if min_age == max_age:
        return f"Age {min_age}"
    return f"Ages {min_age}-{max_age}"


def escape_text(value):
    return html.escape(str(value))


def build_chips(values, style):
    chips = []
    for value in values:
        if value:
            chips.append(
                f"<span class='chip {style}'>{escape_text(value)}</span>"
            )
    return "".join(chips)


def current_step():
    if st.session_state.completed:
        return None
    return PROFILE_STEPS[st.session_state.step_index]


def reset_chat():
    st.session_state.profile = {}
    st.session_state.step_index = 0
    st.session_state.completed = False
    st.session_state.messages = [
        {
            "role": "assistant",
            "content": "Namaste. I can help find eligible welfare schemes. What is your age?",
        }
    ]

    for step in PROFILE_STEPS:
        st.session_state.pop(f"selector_{step['key']}", None)


def ensure_chat_state():
    if "messages" not in st.session_state:
        reset_chat()


def request_recommendations(profile):
    try:
        response = requests.post(
            f"{BACKEND_URL}/recommend",
            json=profile,
            timeout=30,
        )
    except requests.RequestException as exc:
        return None, f"Could not reach the backend API.\n\n{exc}"

    if response.status_code != 200:
        return None, f"Backend Error: {response.status_code}\n\n{response.text}"

    try:
        return response.json(), None
    except ValueError:
        return None, "The backend returned a response that was not valid JSON."


def extract_ai_text(ai_summary):
    if isinstance(ai_summary, dict):
        choices = ai_summary.get("choices")
        if choices:
            message = choices[0].get("message", {})
            content = message.get("content")
            if content:
                return content

        message = ai_summary.get("message")
        if message:
            return message

    return ai_summary


def add_recommendation_message(data):
    schemes = data.get("schemes", [])
    count = len(schemes)

    if count == 1:
        content = "I found 1 eligible scheme for this profile."
    elif count:
        content = f"I found {count} eligible schemes for this profile."
    else:
        content = "I could not find a matching scheme for this profile."

    st.session_state.messages.append(
        {
            "role": "assistant",
            "content": content,
            "ai_summary": data.get("ai_summary"),
            "schemes": schemes,
            "profile": dict(st.session_state.profile),
        }
    )


def handle_user_message(user_text):
    st.session_state.messages.append({"role": "user", "content": user_text})

    if st.session_state.completed:
        st.session_state.messages.append(
            {
                "role": "assistant",
                "content": "Use the Refresh button in the sidebar to start again.",
            }
        )
        return

    step = PROFILE_STEPS[st.session_state.step_index]
    value, error = step["parser"](user_text)

    if error:
        st.session_state.messages.append(
            {
                "role": "assistant",
                "content": f"{error} {step['question']}",
            }
        )
        return

    st.session_state.profile[step["key"]] = value

    if st.session_state.step_index < len(PROFILE_STEPS) - 1:
        st.session_state.step_index += 1
        next_step = PROFILE_STEPS[st.session_state.step_index]
        st.session_state.messages.append(
            {"role": "assistant", "content": next_step["question"]}
        )
        return

    st.session_state.messages.append(
        {
            "role": "assistant",
            "content": "Thanks. I am checking eligible schemes now.",
        }
    )

    data, error = request_recommendations(st.session_state.profile)
    st.session_state.completed = True

    if error:
        st.session_state.messages.append({"role": "assistant", "content": error})
        return

    add_recommendation_message(data)


def render_profile_summary(message):
    profile = message.get("profile", {})
    schemes = message.get("schemes", [])

    chips = build_chips(
        [
            f"Age {profile.get('age', '-')}",
            profile.get("gender"),
            profile.get("state"),
            profile.get("category"),
            format_currency(profile["income"]) if "income" in profile else None,
        ],
        "chip-light",
    )

    count = len(schemes)
    title = "No matching schemes yet."
    if count == 1:
        title = "1 scheme looks like a fit."
    elif count > 1:
        title = f"{count} schemes look like a fit."

    st.markdown(
        f"""
        <div class="summary-panel">
            <p class="summary-kicker">Recommendation Summary</p>
            <p class="summary-title">{escape_text(title)}</p>
            <div class="chip-row">{chips}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_scheme_card(scheme, message_index, scheme_index):
    detail_chips = build_chips(
        [
            scheme.get("state"),
            scheme.get("gender"),
            format_age_range(scheme["age_min"], scheme["age_max"]),
            f"Income up to {format_currency(scheme['income_limit_inr'])}",
        ],
        "chip-soft",
    )

    category_chips = build_chips(scheme.get("category", []), "chip-strong")

    with st.container(border=True):
        st.markdown(
            f"""
            <p class="scheme-name">{escape_text(scheme['name'])}</p>
            <div class="chip-row">{detail_chips}</div>
            <p class="scheme-copy">{escape_text(scheme['description'])}</p>
            <div class="chip-row">{category_chips}</div>
            """,
            unsafe_allow_html=True,
        )
        st.link_button(
            "Open official application",
            scheme["apply_url"],
            key=f"apply_{message_index}_{scheme_index}_{scheme['id']}",
            use_container_width=True,
        )


def render_result(message, message_index):
    ai_text = extract_ai_text(message.get("ai_summary"))
    schemes = message.get("schemes", [])

    render_profile_summary(message)

    st.markdown(
        "<p class='section-label'>AI Summary</p>",
        unsafe_allow_html=True,
    )
    with st.container(border=True):
        if isinstance(ai_text, str) and ai_text:
            st.markdown(ai_text)
        elif ai_text:
            st.write(ai_text)
        else:
            st.write("No AI summary is available for this result.")

    st.markdown(
        "<p class='section-label'>Eligible Schemes</p>",
        unsafe_allow_html=True,
    )

    if not schemes:
        with st.container(border=True):
            st.markdown("No eligible schemes matched the submitted profile.")
            st.markdown(
                "<p class='metric-note'>Try a different category, state, or income using Refresh.</p>",
                unsafe_allow_html=True,
            )
        return

    for scheme_index, scheme in enumerate(schemes):
        render_scheme_card(scheme, message_index, scheme_index)


def render_messages():
    for index, message in enumerate(st.session_state.messages):
        with st.chat_message(message["role"]):
            st.markdown(message["content"])
            if "schemes" in message:
                render_result(message, index)


def render_active_selector():
    step = current_step()
    if not step or step["input_kind"] != "select":
        return

    selection_key = f"selector_{step['key']}"

    with st.container(border=True):
        st.markdown(
            f"<p class='selector-title'>{escape_text(step['selector_title'])}</p>",
            unsafe_allow_html=True,
        )
        st.markdown(
            "<p class='selector-copy'>Choose an option to continue the chat.</p>",
            unsafe_allow_html=True,
        )

        selector_col, button_col = st.columns([3.5, 1.2])
        with selector_col:
            selection = st.selectbox(
                step["selector_title"],
                step["options"],
                index=None,
                placeholder="Choose one",
                label_visibility="collapsed",
                key=selection_key,
            )
        with button_col:
            submitted = st.button(
                "Continue",
                use_container_width=True,
                key=f"continue_{step['key']}",
                disabled=selection is None,
            )

    if submitted and selection:
        handle_user_message(selection)
        st.rerun()


st.set_page_config(page_title="Semicolon-Sarathi", layout="wide")

ensure_chat_state()
inject_styles()

with st.sidebar:
    st.caption("Restart the conversation at any time.")
    if st.button("Refresh", use_container_width=True):
        reset_chat()
        st.rerun()

st.title("Semicolon-Sarathi")
st.caption("Chat through your profile and get scheme recommendations with official links.")

render_messages()
render_active_selector()

active_step = current_step()
prompt_disabled = st.session_state.completed or (
    active_step is not None and active_step["input_kind"] != "chat"
)

prompt = st.chat_input(
    "Type your reply",
    disabled=prompt_disabled,
)

if prompt:
    handle_user_message(prompt)
    st.rerun()
