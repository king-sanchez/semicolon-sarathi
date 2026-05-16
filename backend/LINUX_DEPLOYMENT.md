# Linux Deployment Guide

Complete guide for deploying the Government Scheme Backend API on Linux servers.

## Prerequisites

### System Requirements
- Ubuntu 20.04+ / Debian 11+ / CentOS 8+ / RHEL 8+
- Minimum 2GB RAM, 2 CPU cores
- 20GB disk space
- Root or sudo access

### Install Docker & Docker Compose

#### Ubuntu/Debian
```bash
# Update package index
sudo apt-get update

# Install dependencies
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add your user to docker group (optional, to run without sudo)
sudo usermod -aG docker $USER
newgrp docker
```

#### CentOS/RHEL
```bash
# Install required packages
sudo yum install -y yum-utils

# Add Docker repository
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Install Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

## Deployment Steps

### 1. Clone Repository
```bash
# Clone your repository
git clone https://github.com/your-username/gov-scheme-backend.git
cd gov-scheme-backend
```

### 2. Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit environment file
nano .env
# or
vi .env
```

Add your configuration:
```env
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=postgresql://postgres:postgres@db:5432/govassist
PORT=8000
REDIS_HOST=redis
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 3. Build and Start Services
```bash
# Build images (this may take 5-10 minutes)
docker compose build --no-cache

# Start all services in detached mode
docker compose up -d

# Check if services are running
docker compose ps
```

### 4. Run Database Migrations
```bash
# Wait for database to be ready (about 10-15 seconds)
sleep 15

# Run migrations
docker compose exec api npm run migrate:deploy

# Verify migration
docker compose exec api npx prisma migrate status
```

### 5. Seed Sample Data (Optional)
```bash
docker compose exec api npm run seed:sample
```

### 6. Verify Deployment
```bash
# Check API health
curl http://localhost:8000/health

# View logs
docker compose logs -f api

# Test chat endpoint
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me farmer schemes"}'
```

## Production Configuration

### 1. Set Up Firewall
```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 8000/tcp
sudo ufw allow 22/tcp
sudo ufw enable

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --reload
```

### 2. Configure Nginx Reverse Proxy (Recommended)

Install Nginx:
```bash
# Ubuntu/Debian
sudo apt-get install -y nginx

# CentOS/RHEL
sudo yum install -y nginx
```

Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/gov-scheme-api
```

Add configuration:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and restart:
```bash
# Ubuntu/Debian
sudo ln -s /etc/nginx/sites-available/gov-scheme-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# CentOS/RHEL
sudo cp /etc/nginx/sites-available/gov-scheme-api /etc/nginx/conf.d/
sudo nginx -t
sudo systemctl restart nginx
```

### 3. Set Up SSL with Let's Encrypt
```bash
# Install certbot
sudo apt-get install -y certbot python3-certbot-nginx  # Ubuntu/Debian
# or
sudo yum install -y certbot python3-certbot-nginx      # CentOS/RHEL

# Obtain certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal is configured automatically
# Test renewal
sudo certbot renew --dry-run
```

### 4. Configure Auto-Start on Boot
```bash
# Docker services will auto-start if configured with restart policy
# Verify in docker-compose.yml that services have:
# restart: unless-stopped

# Enable Docker service
sudo systemctl enable docker
```

### 5. Set Up Log Rotation
```bash
# Create log rotation config
sudo nano /etc/logrotate.d/docker-compose
```

Add:
```
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size=10M
    missingok
    delaycompress
    copytruncate
}
```

## Monitoring & Maintenance

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f api
docker compose logs -f db
docker compose logs -f redis

# Last 100 lines
docker compose logs --tail=100 api
```

### Check Service Status
```bash
# List running containers
docker compose ps

# Check resource usage
docker stats

# Check disk usage
docker system df
```

### Backup Database
```bash
# Create backup directory
mkdir -p ~/backups

# Backup database
docker compose exec -T db pg_dump -U postgres govassist > ~/backups/govassist_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
docker compose exec -T db psql -U postgres govassist < ~/backups/govassist_20240101_120000.sql
```

### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker compose down
docker compose build --no-cache
docker compose up -d

# Run migrations if needed
docker compose exec api npm run migrate:deploy
```

### Clean Up Docker Resources
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune

# Clean everything
docker system prune -a --volumes
```

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker compose logs api

# Check if port is already in use
sudo netstat -tulpn | grep 8000
sudo lsof -i :8000

# Restart services
docker compose restart
```

### Database Connection Issues
```bash
# Check database status
docker compose exec db pg_isready -U postgres

# Check database logs
docker compose logs db

# Restart database
docker compose restart db
```

### Out of Memory
```bash
# Check memory usage
free -h
docker stats

# Increase swap space
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Build Fails with npm Errors
```bash
# Clear Docker build cache
docker builder prune -a

# Rebuild without cache
docker compose build --no-cache --pull
```

### Permission Denied Errors
```bash
# Fix Docker socket permissions
sudo chmod 666 /var/run/docker.sock

# Or add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

## Security Best Practices

1. **Change default passwords** in `.env`
2. **Use strong passwords** for database
3. **Keep system updated**:
   ```bash
   sudo apt-get update && sudo apt-get upgrade -y  # Ubuntu/Debian
   sudo yum update -y                               # CentOS/RHEL
   ```
4. **Enable firewall** and only open necessary ports
5. **Use SSL/TLS** for production
6. **Regular backups** of database
7. **Monitor logs** for suspicious activity
8. **Keep Docker updated**:
   ```bash
   sudo apt-get update && sudo apt-get upgrade docker-ce docker-ce-cli containerd.io
   ```

## Performance Optimization

### Increase Docker Resources
Edit `/etc/docker/daemon.json`:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
```

Restart Docker:
```bash
sudo systemctl restart docker
```

### Database Optimization
```bash
# Connect to database
docker compose exec db psql -U postgres govassist

# Run vacuum
VACUUM ANALYZE;

# Check indexes
\di
```

## Support

For issues or questions:
- Check logs: `docker compose logs -f`
- Review [DEPLOYMENT.md](./DEPLOYMENT.md)
- Check GitHub issues
- Contact support team