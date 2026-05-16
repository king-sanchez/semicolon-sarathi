# Semicolon-Sarathi

Semicolon-Sarathi is a small welfare scheme discovery app for Indian citizens.
It uses a Streamlit chat interface to collect a user's profile, sends that
profile to a FastAPI backend, filters matching schemes from `schemes.json`, and
returns a polished recommendation view with official application links.

## Features

- Chat-style onboarding for age, gender, state, category, and income
- Dropdown selection for Indian states and supported categories
- Recommendation summary with profile chips and scheme cards
- Optional AI summary through a gateway-compatible chat completions API
- Sidebar refresh button to restart the conversation at any time

## Architecture

```text
Streamlit frontend
        |
FastAPI backend
        |
schemes.json + optional AI gateway summary
```

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Streamlit |
| Backend | FastAPI |
| Scheme data | JSON |
| AI summary | Optional OpenAI-compatible chat completions API |
| Env loading | python-dotenv |
| Containerization | Docker Compose |

## Project Structure

```text
semicolon-sarathi/
|-- backend/
|   |-- ai_client.py
|   |-- Dockerfile
|   |-- main.py
|   `-- requirements.txt
|-- frontend/
|   |-- app.py
|   |-- Dockerfile
|   `-- requirements.txt
|-- schemes.json
|-- docker-compose.yml
|-- .dockerignore
|-- .env.example
|-- .gitignore
`-- README.md
```

## Environment Variables

The app works even without AI credentials. In that case, scheme filtering still
works and the backend returns a message explaining that the AI summary is not
configured.

Copy `.env.example` to `.env` and fill in the values you want to use:

```env
AI_GATEWAY_URL=https://api.openai.com/v1/chat/completions
AI_API_KEY=your_openai_api_key_here
AI_MODEL_NAME=gpt-5.4-mini
BACKEND_URL=http://localhost:8001
```

Notes:

- `AI_GATEWAY_URL`, `AI_API_KEY`, and `AI_MODEL_NAME` are optional
- `BACKEND_URL` is used by the frontend and defaults to `http://localhost:8001`
- Both frontend and backend load `.env` automatically from the project root
- `.env` is ignored by Git and should not be committed

## Run With Docker Compose

Make sure Docker Desktop is running, then start the stack from the project
root:

```powershell
docker compose up --build
```

Services:

| Service | URL |
| --- | --- |
| Frontend | http://localhost:8000 |
| Backend API | http://localhost:8001 |
| Swagger Docs | http://localhost:8001/docs |
| Health Check | http://localhost:8001/health |

Stop the stack:

```powershell
docker compose down
```

## Run Locally Without Docker

Create a virtual environment and install dependencies:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt -r frontend\requirements.txt
```

Start the backend in one terminal:

```powershell
cd C:\Users\soham_munshi\Documents\semicolon-sarathi
.\.venv\Scripts\Activate.ps1
cd backend
uvicorn main:app --host 0.0.0.0 --port 8001
```

Start the frontend in another terminal:

```powershell
cd C:\Users\soham_munshi\Documents\semicolon-sarathi
.\.venv\Scripts\Activate.ps1
streamlit run frontend\app.py --server.port=8000
```

Open the app at:

```text
http://localhost:8000
```

## Using The App

1. Enter age and gender through the chat input.
2. Choose state and category from the dropdown selectors.
3. Enter annual household income in INR.
4. Review the recommendation summary, AI summary, and eligible schemes.
5. Use the `Refresh` button in the sidebar to restart the flow.

Example profile:

```text
Age: 21
Gender: Female
State: West Bengal
Category: OBC
Income: 180000
```

## API

### Health Check

```http
GET /health
```

Example response:

```json
{
  "status": "ok",
  "service": "Semicolon-Sarathi Backend"
}
```

### Scheme Recommendation

```http
POST /recommend
```

Example request:

```json
{
  "age": 21,
  "gender": "Female",
  "state": "West Bengal",
  "category": "OBC",
  "income": 180000
}
```

## Notes

- `schemes.json` lives at the project root and is copied into the backend image
  during Docker builds
- In Docker Compose, the frontend uses `http://backend:8001` internally
- In local development, the frontend defaults to `http://localhost:8001`
- Placeholder AI values are treated as unconfigured, so the app can still be
  tested safely without a real API key
