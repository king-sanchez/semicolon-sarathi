# 🇮🇳 Semicolon-Sarathi (AdhikarSaarthi)

**Semicolon-Sarathi** is an AI-powered centralized welfare discovery platform built to help Indian citizens find government schemes they are eligible for.

The platform collects simple profile information such as:
- Age
- Gender
- State
- Category
- Income

It then:
1. Filters matching government schemes
2. Uses AI to explain benefits in simple language
3. Redirects users to official portals

Built during a 24-hour hackathon to reduce dependency on intermediaries and simplify public welfare access.

---

# 🚀 Architecture

```text
Frontend (Streamlit)
        ↓
Backend API (FastAPI)
        ↓
AI Gateway / LLM
        ↓
Scheme Recommendation Engine
```

---

# 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Streamlit |
| Backend | FastAPI |
| AI Integration | Gateway-based LLM APIs |
| Database | JSON |
| Containerization | Docker + Docker Compose |

---

# 📂 Project Structure

```text
semicolon-sarathi/
│
├── frontend/
│   ├── app.py
│   ├── Dockerfile
│   └── requirements.txt
│
├── backend/
│   ├── main.py
│   ├── ai_client.py
│   ├── schemes.json
│   ├── Dockerfile
│   └── requirements.txt
│
├── docker-compose.yml
├── .env
├── .env.example
└── README.md
```

---

# 🔐 Environment Variables

Create a `.env` file in the project root.

## Example

```env
AI_GATEWAY_URL=https://your-gateway-url.com/v1/chat/completions
AI_API_KEY=your_api_key_here
AI_MODEL_NAME=gpt-4o-mini
```

---

# ⚡ Quick Start Using Docker (Recommended)

---

# 🐧 Linux / macOS Setup

## 1. Install Docker

### Ubuntu

```bash
sudo apt update
sudo apt install docker.io docker-compose -y
```

Start Docker:

```bash
sudo systemctl enable docker
sudo systemctl start docker
```

(Optional) Run Docker without sudo:

```bash
sudo usermod -aG docker $USER
newgrp docker
```

---

## 2. Clone Repository

```bash
git clone https://github.com/YOUR-USERNAME/semicolon-sarathi.git

cd semicolon-sarathi
```

---

## 3. Create Environment File

```bash
cp .env.example .env
```

Open `.env` and insert:

```env
AI_GATEWAY_URL=YOUR_GATEWAY_URL
AI_API_KEY=YOUR_API_KEY
AI_MODEL_NAME=YOUR_MODEL_NAME
```

---

## 4. Build and Run

```bash
docker compose up --build
```

---

## 5. Access Services

| Service | URL |
|---|---|
| Frontend | http://localhost:8000 |
| Backend API | http://localhost:8001 |
| Swagger Docs | http://localhost:8001/docs |
| Health Check | http://localhost:8001/health |

---

# 🪟 Windows Setup

---

# 1. Install Required Software

## Install Docker Desktop

Download:
- https://www.docker.com/products/docker-desktop/

During installation:
- Enable WSL2 integration if prompted
- Restart PC if required

---

## Install Git

Download:
- https://git-scm.com/download/win

Restart VS Code after installation.

---

# 2. Clone Repository

Open PowerShell or VS Code Terminal:

```powershell
git clone https://github.com/YOUR-USERNAME/semicolon-sarathi.git

cd semicolon-sarathi
```

---

# 3. Create `.env`

Create a file named:

```text
.env
```

Add:

```env
AI_GATEWAY_URL=YOUR_GATEWAY_URL
AI_API_KEY=YOUR_API_KEY
AI_MODEL_NAME=YOUR_MODEL_NAME
```

---

# 4. Start Docker Desktop

IMPORTANT:
- Docker Desktop MUST be running before executing Docker commands.

---

# 5. Build and Run

```powershell
docker compose up --build
```

---

# 6. Access Services

| Service | URL |
|---|---|
| Frontend | http://localhost:8000 |
| Backend API | http://localhost:8001 |
| Swagger Docs | http://localhost:8001/docs |
| Health Check | http://localhost:8001/health |

---

# 🧠 Backend API Endpoints

---

## Health Check

```http
GET /health
```

### Example Response

```json
{
  "status": "ok",
  "service": "Semicolon-Sarathi Backend"
}
```

---

## Scheme Recommendation

```http
POST /recommend
```

### Example Request

```json
{
  "age": 21,
  "gender": "Female",
  "state": "West Bengal",
  "category": "OBC",
  "income": 180000
}
```

---

# 🐳 Docker Services

| Container | Port |
|---|---|
| Frontend | 8000 |
| Backend | 8001 |

---

# 🧩 Features

- AI-powered scheme explanations
- Government scheme filtering
- State-aware recommendations
- Dockerized deployment
- Secure environment variable handling
- FastAPI backend APIs
- Streamlit conversational UI
- Health monitoring endpoint
- CORS-enabled backend

---

# 🔐 Security Notes

NEVER commit:
- `.env`
- API keys
- credentials

Add this to `.gitignore`:

```gitignore
.env
__pycache__/
venv/
```

---

# 🧪 Useful Commands

## Stop Containers

```bash
docker compose down
```

---

## Rebuild Containers

```bash
docker compose up --build
```

---

## View Running Containers

```bash
docker ps
```

---

## View Logs

```bash
docker compose logs
```

---

# 🚀 Future Improvements

- Aadhaar-based verification
- Voice assistant integration
- Multilingual support
- OCR document uploads
- RAG-powered scheme retrieval
- Real-time government API integration
- WhatsApp chatbot support

---

# 👨‍💻 Contributors

Built during a hackathon by Team Semicolon 🚀🇮🇳

---

# 📜 License

This project is open-source and intended for educational and social welfare innovation purposes.
