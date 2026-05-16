# Deployment Guide

## Platform-Specific Guides

- **Linux Servers**: See [LINUX_DEPLOYMENT.md](./LINUX_DEPLOYMENT.md) for comprehensive Linux deployment
- **macOS/Windows**: Follow the Quick Start below

## Prerequisites
- Docker and Docker Compose installed
- Gemini API key from Google AI Studio

## Quick Start

1. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your `GEMINI_API_KEY`

2. **Build and start services**
   ```bash
   docker-compose up --build
   ```

3. **Run database migrations** (in a new terminal)
   ```bash
   docker-compose exec api npm run migrate:deploy
   ```

4. **Seed sample data** (optional)
   ```bash
   docker-compose exec api npm run seed:sample
   ```

5. **Access the API**
   - API: http://localhost:8000
   - Health check: http://localhost:8000/health

## Troubleshooting

### Build fails with npm integrity errors
If you encounter npm integrity checksum errors:
```bash
docker-compose build --no-cache
```

### Database connection issues
Ensure PostgreSQL is healthy:
```bash
docker-compose ps
docker-compose logs db
```

### Reset everything
```bash
docker-compose down -v
docker-compose up --build
```

## Production Deployment

### Environment Variables
Set these in your production environment:
- `DATABASE_URL`: PostgreSQL connection string
- `GEMINI_API_KEY`: Your Gemini API key
- `REDIS_HOST`: Redis host (default: redis)
- `PORT`: API port (default: 8000)
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins

### Cloud Deployment Options

#### Docker Hub / Container Registry
```bash
# Build and tag
docker build -t your-registry/gov-scheme-backend:latest .

# Push to registry
docker push your-registry/gov-scheme-backend:latest
```

#### Railway / Render / Fly.io
These platforms support Docker deployments. Simply:
1. Connect your repository
2. Set environment variables
3. Deploy

#### AWS ECS / Google Cloud Run / Azure Container Instances
Use the provided Dockerfile and docker-compose.yml as reference for container configuration.

## Monitoring

Check service health:
```bash
curl http://localhost:8000/health
```

View logs:
```bash
docker-compose logs -f api