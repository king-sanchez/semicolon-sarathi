# Semicolon-Sarathi

Semicolon-Sarathi is a small welfare scheme discovery app for Indian citizens.
Users enter basic profile details, the backend filters eligible schemes from
`schemes.json`, and the frontend displays matching benefits with official apply
links.

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
| AI summary | Optional gateway-compatible chat completion API |
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
`-- README.md
```

## Environment Variables

The app can run without AI credentials. In that case, scheme filtering still
works and the backend returns a message that the AI summary is unavailable.

To enable AI summaries, copy `.env.example` to `.env` and fill in:

```env
AI_GATEWAY_URL=https://your-gateway-url.example/v1/chat/completions
AI_API_KEY=your_api_key_here
AI_MODEL_NAME=your_model_name_here
```

For local frontend runs, `BACKEND_URL` is optional and defaults to
`http://localhost:8001`.

## Run With Docker Compose

Make sure Docker Desktop is running, then run from the project root:

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

Install dependencies in a virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt -r frontend\requirements.txt
```

Start the backend in one terminal:

```powershell
cd backend
uvicorn main:app --host 0.0.0.0 --port 8001
```

Start the frontend in another terminal from the project root:

```powershell
streamlit run frontend\app.py --server.port=8000
```

Open the frontend at:

```text
http://localhost:8000
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

- `schemes.json` lives at the project root and is copied into the backend Docker
  image during build.
- In Docker Compose, the frontend uses `http://backend:8001` internally.
- In local development, the frontend defaults to `http://localhost:8001`.
- `.env` is ignored by Git and should not be committed.
