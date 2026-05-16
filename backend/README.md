# Government Scheme Backend API

A Node.js backend API for discovering and managing Indian government schemes with AI-powered recommendations.

## Features

- 🤖 AI-powered scheme recommendations using Google Gemini
- 🔍 Hybrid search (vector + keyword) for schemes
- 📧 Email notifications for eligible schemes
- 🕷️ Automated web scraping for scheme data
- 🗄️ PostgreSQL with pgvector for semantic search
- 🚀 Redis-backed job queue for background tasks

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Setup

#### Option 1: Automated Deployment (Linux)
```bash
# Clone repository
git clone <your-repo-url>
cd gov-scheme-backend

# Run deployment script
chmod +x deploy.sh
./deploy.sh
```

The script will:
- Check prerequisites
- Create `.env` file if needed
- Build Docker images
- Start all services
- Run migrations
- Optionally seed sample data

#### Option 2: Manual Setup
1. **Clone and configure**
   ```bash
   git clone <your-repo-url>
   cd gov-scheme-backend
   cp .env.example .env
   ```

2. **Add your Gemini API key to `.env`**
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

3. **Start services**
   ```bash
   docker-compose up --build
   ```

4. **Run migrations** (in a new terminal)
   ```bash
   docker-compose exec api npm run migrate:deploy
   ```

5. **Seed sample data** (optional)
   ```bash
   docker-compose exec api npm run seed:sample
   ```

6. **Access the API**
   - API: http://localhost:8000
   - Health: http://localhost:8000/health

## API Endpoints

### Health Check
```
GET /health
```

### Chat with AI
```
POST /api/chat
Content-Type: application/json

{
  "message": "I am a farmer looking for government schemes"
}
```

### User Management
```
POST /api/users/register
POST /api/users/login
GET /api/users/profile
PUT /api/users/profile
```

## Development

### Available Scripts

```bash
# Database
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run migrations
npm run db:seed        # Seed database
npm run db:studio      # Open Prisma Studio

# Embeddings
npm run embeddings:generate  # Generate embeddings
npm run embeddings:force     # Force regenerate all
npm run embeddings:batch     # Batch processing

# Scraping
npm run scrape:myscheme      # Scrape MyScheme portal
npm run scrape:all           # Scrape all sources
npm run scrape:no-embeddings # Scrape without embeddings

# Knowledge Base
npm run knowledge:expand     # Scrape + generate embeddings
npm run knowledge:stats      # Show coverage stats
```

### Project Structure

```
├── config/              # Configuration files
├── controllers/         # Request handlers
├── db/                  # Database connection
├── eligibility/         # Eligibility engine
├── notifications/       # Email service
├── prisma/             # Database schema & migrations
├── routes/             # API routes
├── scrapers/           # Web scrapers
├── scripts/            # Utility scripts
├── services/           # Business logic
└── workers/            # Background jobs
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy

**Docker Hub:**
```bash
docker build -t your-username/gov-scheme-backend .
docker push your-username/gov-scheme-backend
```

**Cloud Platforms:**
- Railway: Connect repo → Set env vars → Deploy
- Render: Connect repo → Set env vars → Deploy
- Fly.io: `fly launch` → Configure → Deploy

### Environment Variables

Required:
- `GEMINI_API_KEY` - Google Gemini API key
- `DATABASE_URL` - PostgreSQL connection string

Optional:
- `PORT` - API port (default: 8000)
- `REDIS_HOST` - Redis host (default: redis)
- `ALLOWED_ORIGINS` - CORS origins (default: http://localhost:3000)

## Troubleshooting

### Build Issues
```bash
# Clear Docker cache
docker-compose build --no-cache

# Reset everything
docker-compose down -v
docker-compose up --build
```

### Database Issues
```bash
# Check database health
docker-compose ps
docker-compose logs db

# Reset database
docker-compose down -v
docker-compose up -d db
docker-compose exec api npm run migrate:deploy
```

### View Logs
```bash
docker-compose logs -f api
```

## License

MIT
