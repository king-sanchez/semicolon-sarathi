# Quick Reference Guide

## Deployment Commands

### Initial Setup
```bash
# Clone repository
git clone <your-repo-url>
cd gov-scheme-backend

# Configure environment
cp .env.example .env
nano .env  # Add GEMINI_API_KEY

# Deploy (automated)
chmod +x deploy.sh
./deploy.sh

# OR Deploy (manual)
docker compose build --no-cache
docker compose up -d
docker compose exec api npm run migrate:deploy
```

### Daily Operations

#### Start/Stop Services
```bash
docker compose up -d          # Start all services
docker compose down           # Stop all services
docker compose restart        # Restart all services
docker compose restart api    # Restart specific service
```

#### View Logs
```bash
docker compose logs -f        # All services (follow)
docker compose logs -f api    # API only
docker compose logs --tail=100 api  # Last 100 lines
```

#### Check Status
```bash
docker compose ps             # List containers
docker stats                  # Resource usage
curl http://localhost:8000/health  # API health
```

### Database Operations

#### Migrations
```bash
docker compose exec api npm run db:migrate    # Run new migrations
docker compose exec api npm run migrate:deploy  # Deploy migrations
docker compose exec api npx prisma migrate status  # Check status
```

#### Backup & Restore
```bash
# Backup
docker compose exec -T db pg_dump -U postgres govassist > backup.sql

# Restore
docker compose exec -T db psql -U postgres govassist < backup.sql
```

#### Prisma Studio
```bash
docker compose exec api npm run db:studio
# Access at http://localhost:5555
```

### Data Management

#### Seeding
```bash
docker compose exec api npm run seed:sample      # Sample schemes
docker compose exec api npm run db:seed          # Full seed
```

#### Scraping
```bash
docker compose exec api npm run scrape:myscheme  # MyScheme portal
docker compose exec api npm run scrape:all       # All sources
```

#### Embeddings
```bash
docker compose exec api npm run embeddings:generate  # Generate
docker compose exec api npm run embeddings:force     # Force regenerate
docker compose exec api npm run knowledge:stats      # Check coverage
```

### Troubleshooting

#### Rebuild Everything
```bash
docker compose down -v
docker compose build --no-cache
docker compose up -d
docker compose exec api npm run migrate:deploy
```

#### Clear Docker Cache
```bash
docker builder prune -a       # Clear build cache
docker system prune -a        # Clear everything
docker volume prune           # Clear volumes
```

#### Check Logs for Errors
```bash
docker compose logs api | grep -i error
docker compose logs db | grep -i error
```

#### Database Connection Issues
```bash
docker compose exec db pg_isready -U postgres
docker compose restart db
docker compose logs db
```

### Monitoring

#### Resource Usage
```bash
docker stats                  # Real-time stats
docker system df              # Disk usage
free -h                       # System memory
df -h                         # Disk space
```

#### Application Metrics
```bash
# Check scheme count
docker compose exec api npm run knowledge:stats

# Test API
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me schemes"}'
```

### Updates

#### Pull Latest Changes
```bash
git pull origin main
docker compose down
docker compose build --no-cache
docker compose up -d
docker compose exec api npm run migrate:deploy
```

#### Update Dependencies
```bash
docker compose down
docker compose build --pull --no-cache
docker compose up -d
```

### Security

#### Change Database Password
```bash
# 1. Update .env file
nano .env  # Change DATABASE_URL password

# 2. Update docker-compose.yml
nano docker-compose.yml  # Change POSTGRES_PASSWORD

# 3. Restart
docker compose down -v
docker compose up -d
```

#### View Environment Variables
```bash
docker compose exec api printenv | grep -v PASSWORD
```

### Backup Strategy

#### Daily Backup Script
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker compose exec -T db pg_dump -U postgres govassist > ~/backups/db_$DATE.sql
find ~/backups -name "db_*.sql" -mtime +7 -delete  # Keep 7 days
```

### Performance

#### Check Database Size
```bash
docker compose exec db psql -U postgres -d govassist -c "
SELECT pg_size_pretty(pg_database_size('govassist'));"
```

#### Optimize Database
```bash
docker compose exec db psql -U postgres -d govassist -c "VACUUM ANALYZE;"
```

### Common Issues

#### Port Already in Use
```bash
sudo lsof -i :8000        # Find process
sudo kill -9 <PID>        # Kill process
# OR change port in docker-compose.yml
```

#### Out of Disk Space
```bash
docker system prune -a --volumes  # Clean everything
df -h                             # Check space
```

#### Container Won't Start
```bash
docker compose logs <service>     # Check logs
docker compose restart <service>  # Restart
docker compose up --force-recreate <service>  # Recreate
```

## Environment Variables

### Required
- `GEMINI_API_KEY` - Google Gemini API key
- `DATABASE_URL` - PostgreSQL connection string

### Optional
- `PORT` - API port (default: 8000)
- `REDIS_HOST` - Redis host (default: redis)
- `ALLOWED_ORIGINS` - CORS origins (comma-separated)

## Useful Links

- [Full Deployment Guide](./DEPLOYMENT.md)
- [Linux Deployment Guide](./LINUX_DEPLOYMENT.md)
- [Main README](./README.md)