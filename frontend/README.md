# Government Scheme AI Assistant - Frontend

Frontend application for the Government Scheme AI Assistant.

## Quick Start

### Local Development
```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with backend URL

# Start development server
npm run dev
```

### Docker Deployment
```bash
# Create .env file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env

# Start service
docker-compose up -d

# Check logs
docker-compose logs -f web
```

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL (required)

## Documentation

See [SEPARATE_DEPLOYMENT_GUIDE.md](../docs/SEPARATE_DEPLOYMENT_GUIDE.md) for detailed deployment instructions.
