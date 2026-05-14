# Government Scheme Eligibility AI Assistant

An AI-powered application that helps Indian citizens discover eligible government schemes from both Central and State governments based on their profile.

## Features

- 🤖 **AI-Powered Search**: Uses Google Gemini AI to search and recommend government schemes
- 🎯 **Personalized Results**: Schemes tailored to user's age, income, occupation, state, and category
- 📋 **Comprehensive Information**: Provides eligibility criteria, benefits, required documents, and application process
- 🔔 **Email Notifications**: Get notified when new eligible schemes are available
- 🌐 **Central & State Schemes**: Covers schemes from both central and state governments

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Backend**: Node.js, Express
- **Database**: PostgreSQL with Prisma ORM
- **AI**: Google Gemini 1.5 Flash
- **Containerization**: Docker & Docker Compose

## Prerequisites

- Docker and Docker Compose installed
- Google Gemini API key (get it from [Google AI Studio](https://makersuite.google.com/app/apikey))

## Quick Start

### 1. Clone the repository

```bash
git clone <repository-url>
cd gov-scheme-ai-assistant
```

### 2. Set up environment variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=postgresql://postgres:postgres@db:5432/govassist
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
REDIS_HOST=redis
REDIS_PORT=6379
```

### 3. Start the application

```bash
# Stop any existing containers
docker compose down -v

# Start all services
docker compose up --build
```

This will:
- Start PostgreSQL database with health checks
- Start Redis
- Build and start the API server on port 8000 (with automatic Prisma setup)
- Build and start the Next.js frontend on port 3000

The API service will automatically:
- Generate Prisma Client
- Run database migrations
- Start the server

### 4. Access the application

Open your browser and navigate to:
- **Frontend**: http://localhost:3000
- **API Health Check**: http://localhost:8000/health

## Usage

1. Fill in your profile information:
   - Name (required)
   - Email (optional - for notifications)
   - Age (required)
   - Gender (required)
   - State (required)
   - Occupation (required)
   - Annual Income (required)
   - Category (required): General/SC/ST/OBC/EWS
   - Family Size (optional)

2. Click "Find Eligible Schemes"

3. The AI will search and display:
   - Relevant government schemes
   - Eligibility criteria
   - Benefits
   - Required documents
   - Application process with official links

## API Endpoints

### User Management

- `POST /api/users` - Create a new user profile
- `GET /api/users/:id/schemes` - Get eligible schemes for a user

### AI Chat

- `POST /api/chat` - Chat with AI about government schemes

### Health Check

- `GET /health` - Check API server status

## Development

### Running without Docker

#### Backend (API)

```bash
cd apps/api
npm install
npx prisma generate
npx prisma migrate dev
npm start
```

#### Frontend (Web)

```bash
cd apps/web
npm install
npm run dev
```

### Database Management

```bash
# Generate Prisma Client
docker compose exec api npx prisma generate

# Create a migration
docker compose exec api npx prisma migrate dev --name migration_name

# Open Prisma Studio (Database GUI)
docker compose exec api npx prisma studio
```

## Project Structure

```
gov-scheme-ai-assistant/
├── apps/
│   ├── api/                    # Express API server
│   │   ├── controllers/        # Request handlers
│   │   ├── db/                 # Database connection
│   │   ├── eligibility/        # Eligibility logic
│   │   ├── notifications/      # Email service
│   │   ├── prisma/            # Database schema & migrations
│   │   ├── routes/            # API routes
│   │   ├── scrapers/          # Web scrapers (future use)
│   │   ├── services/          # AI service
│   │   ├── workers/           # Background jobs
│   │   └── server.js          # Main server file
│   └── web/                   # Next.js frontend
│       ├── app/               # App router pages
│       └── components/        # React components
├── docs/                      # Documentation
├── docker-compose.yml         # Docker services configuration
└── README.md                  # This file
```

## How It Works

1. **User Profile Creation**: User submits their profile information through the web interface
2. **AI Search**: The system uses Google Gemini AI to search for relevant government schemes based on the user's profile
3. **Scheme Matching**: AI analyzes user eligibility for various schemes considering:
   - Age criteria
   - Income limits
   - State/region
   - Occupation
   - Category (SC/ST/OBC/EWS/General)
   - Gender
4. **Results Display**: Comprehensive information about eligible schemes is displayed with:
   - Scheme details
   - Eligibility requirements
   - Benefits
   - Required documents
   - Application links

## Troubleshooting

### Database Connection Issues

```bash
# Reset the database
docker compose down -v
docker compose up -d db
docker compose exec api npx prisma migrate dev --name init
```

### API Not Responding

```bash
# Check API logs
docker compose logs api

# Restart API service
docker compose restart api
```

### Frontend Build Issues

```bash
# Rebuild frontend
docker compose up --build web
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License

## Support

For issues and questions, please open an issue on GitHub.

## Acknowledgments

- Government of India for providing scheme information
- Google Gemini AI for powering the intelligent search
- MyScheme.gov.in for scheme data reference
