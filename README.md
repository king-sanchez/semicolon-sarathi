# 🇮🇳 Semicolon-Sarathi (AdhikarSaarthi)

**Semicolon-Sarathi** is a centralized digital platform built to connect Indian citizens with government welfare schemes. By collecting basic user profiles (Age, Income, Category, State, etc.) through a simple conversational interface, it automatically filters and matches users to central and state government schemes they are eligible for.

Built during a 24-hour hackathon to reduce dependency on intermediaries and simplify scheme discovery.

## 🚀 Tech Stack
*   **Frontend & UI:** Streamlit (Python)
*   **Database:** JSON (`schemes.json`)
*   **AI Integration:** Prepared for Google Gemini API

---

## 💻 How to Run This Locally

### 1. Prerequisites (Don't skip this!)
Before you pull this code, make sure you have:
*   **Python 3.10+**: Download from python.org. **CRITICAL:** During installation, you MUST check the box that says **"Add python.exe to PATH"** at the bottom of the screen.
*   **Git:** Download Git for Windows (if on PC) so you can clone the repo.

### 2. Installation Steps
Open your terminal (VS Code recommended) and run these commands:

**Step 1: Clone the repository**
~~~bash
git clone https://github.com/YOUR-USERNAME/semicolon-sarathi.git
cd semicolon-sarathi
~~~

**Step 2: Create a Virtual Environment**
This keeps the project libraries separate from your main computer.
~~~bash
python -m venv venv
~~~

**Step 3: Activate the Virtual Environment**
*   **Windows:** `venv\Scripts\activate`
*   **Mac/Linux:** `source venv/bin/activate`

**Step 4: Install Dependencies**
~~~bash
pip install streamlit google-generativeai
~~~

**Step 5: Run the App!**
~~~bash
streamlit run app.py
~~~
*The app will automatically pop open in your default web browser.*

---

## 🛠️ Troubleshooting (The "Windows" Traps)

We hit a few classic Windows environment errors while building this. If you run into issues, here are the exact fixes:

### ❌ Error 1: "Python was not found; run without arguments to install from the Microsoft Store..."
*   **Why it happens:** Windows doesn't know where Python is installed.
*   **The Fix:** You forgot to check "Add Python to PATH" during installation. Re-run the Python installer, select "Modify", and check that box!

### ❌ Error 2: "Activate.ps1 cannot be loaded because running scripts is disabled on this system."
*   **Why it happens:** Windows PowerShell blocks unauthorized scripts by default.
*   **The Fix:** Run this command to temporarily bypass the security block for your current terminal session, then activate the environment:
~~~powershell
(Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned) ; (& .\venv\Scripts\Activate.ps1)
~~~

### ❌ Error 3: The Rupee Symbol (₹) looks like garbled text (`â‚¹`) in the app.
*   **Why it happens:** Windows sometimes reads files in local encoding instead of standard UTF-8. 
*   **The Fix:** We already fixed this in the code by using `open('schemes.json', 'r', encoding='utf-8')`. If you add new schemes to the JSON file, make sure your text editor saves the file in UTF-8 format!

### ❌ Error 4: "git is not recognized as an internal or external command"
*   **Why it happens:** You don't have Git installed on your computer. 
*   **The Fix:** Go to git-scm.com and install it. Restart your VS Code entirely after installing.
