import streamlit as st
import json
import time

# --- 1. FILTER LOGIC ---
def filter_schemes(user_data):
    try:
        with open('schemes.json', 'r', encoding='utf-8') as f:
            schemes = json.load(f)
        
        results = []
        for s in schemes:
            # Check Gender (Bot matches 'Male' or 'Female' to 'All' or specific)
            gender_match = (s['gender'] == "All" or s['gender'].lower() == user_data['gender'].lower())
            
            # Check State
            state_match = (s['state'] == "All" or s['state'].lower() == user_data['state'].lower())
            
            # Check Age (Convert user input to int)
            user_age = int(user_data['age'])
            age_match = (s['age_min'] <= user_age <= s['age_max'])
            
            # Check Category
            cat_match = (user_data['category'].lower() in [c.lower() for c in s['category']])
            
            # Check Income
            user_income = int(user_data['income'])
            income_match = (user_income <= s['income_limit_inr'])

            if gender_match and state_match and age_match and cat_match and income_match:
                results.append(s)
        return results
    except Exception as e:
        return []

# --- 2. PAGE CONFIG ---
st.set_page_config(page_title="Semicolon-Sarathi", page_icon="🇮🇳", layout="centered")

# --- 3. SESSION INITIALIZATION ---
if 'logged_in' not in st.session_state:
    st.session_state.logged_in = False
if "messages" not in st.session_state:
    st.session_state.messages = [{"role": "assistant", "content": "Namaste! I am Sarathi. Let's find some schemes for you. What is your age?"}]
if "step" not in st.session_state:
    st.session_state.step = 0
    st.session_state.user_info = {}
    st.session_state.questions = [
        "What is your age?",
        "What is your gender? (Male/Female/Other)",
        "Which state do you live in? (e.g., West Bengal, Rajasthan, All)",
        "What is your category? (General/OBC/SC/ST/Minority)",
        "What is your annual family income? (Numbers only)"
    ]
    st.session_state.info_keys = ["age", "gender", "state", "category", "income"]

# --- 4. SIDEBAR ---
with st.sidebar:
    st.title("👤 Sarathi Profile")
    
    # 1. The Restored Login Logic
    if not st.session_state.logged_in:
        name = st.text_input("Enter Name")
        if st.button("Login"):
            st.session_state.logged_in = True
            st.rerun()
    else:
        st.success("Welcome back!")
        if st.button("Logout"):
            # Clears everything on logout
            for key in list(st.session_state.keys()):
                del st.session_state[key]
            st.rerun()
    
    # 2. The Global Reset Logic
    if st.session_state.logged_in:
        st.divider()
        if st.button("🔄 Global Reset", help="Clear everything and start over"):
            st.session_state.step = 0
            st.session_state.user_info = {}
            st.session_state.messages = [{"role": "assistant", "content": "Namaste! I am Sarathi. Let's find some schemes for you. What is your age?"}]
            st.rerun()

# --- 5. MAIN UI ---
st.title("Semicolon-Sarathi 🇮🇳")

# Add a Progress Bar
progress_val = (st.session_state.step) / len(st.session_state.questions)
st.progress(progress_val, text=f"Profile Completion: {int(progress_val*100)}%")

# Display Chat History
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# --- 6. CHAT INPUT ---
if prompt := st.chat_input("Type your answer..."):
    if not st.session_state.logged_in:
        st.warning("Please login from the sidebar to continue.")
    elif st.session_state.step < len(st.session_state.questions):
        # 1. Record User Answer
        st.session_state.messages.append({"role": "user", "content": prompt})
        
        # 2. Save data to our dictionary
        current_key = st.session_state.info_keys[st.session_state.step]
        st.session_state.user_info[current_key] = prompt
        
        # 3. Move to next step
        st.session_state.step += 1
        
        # 4. Generate Bot's Next Question
        if st.session_state.step < len(st.session_state.questions):
            next_q = st.session_state.questions[st.session_state.step]
            st.session_state.messages.append({"role": "assistant", "content": next_q})
        else:
            # Final Result Logic
            st.session_state.messages.append({"role": "assistant", "content": "Searching for schemes... Done!"})
        
        st.rerun()

# --- 7. RESULTS DISPLAY ---
if st.session_state.step >= len(st.session_state.questions):
    st.divider()
    
    # Header and Reset Button at the TOP of results for easy access
    col_head, col_res = st.columns([2, 1])
    with col_head:
        st.subheader("🎯 Recommended Schemes")
    with col_res:
        if st.button("🔄 New Search", use_container_width=True):
            st.session_state.step = 0
            st.session_state.user_info = {}
            st.session_state.messages = [{"role": "assistant", "content": "Namaste! I am Sarathi. Let's find some schemes for you. What is your age?"}]
            st.rerun()
    
    with st.status("Analyzing your profile...", expanded=True) as status:
        time.sleep(1) 
        matches = filter_schemes(st.session_state.user_info)
        status.update(label="Analysis Complete!", state="complete", expanded=False)

    if matches:
        for s in matches:
            with st.container(border=True):
                # Using a color header for better visibility
                st.markdown(f"### :blue[{s['name']}]")
                st.write(s['description'])
                
                col1, col2 = st.columns(2)
                
                # State formatting
                col1.info(f"📍 **State:** {s['state']}")
                
                # Income formatting logic
                income_val = s['income_limit_inr']
                if income_val >= 9999999:
                    display_income = "No Income Limit"
                else:
                    # Formats 200000 into 2,00,000
                    display_income = f"₹{income_val:,}"
                
                col2.success(f"💰 **Income Cap:** {display_income}")
                
                st.link_button("Apply on Official Portal", s['apply_url'], use_container_width=True)
    else:
        st.info("No specific matches found. Try adjusting your details or checking back later!")