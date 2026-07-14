# Local Development Setup

## Prerequisites

- Docker & Docker Compose
- Node.js 16+
- Python 3.11+
- Git

## Quick Start

### 1. Clone Repository

```bash
git clone <repository-url>
cd healthify_AI
```

### 2. Setup Environment Files

```bash
cp .env.example .env
cp services/auth-service/.env.example services/auth-service/.env
cp services/report-service/.env.example services/report-service/.env
cp services/ai-service/.env.example services/ai-service/.env
cp frontend/health-ai-frontend/.env.example frontend/health-ai-frontend/.env
```

### 3. Update Configuration

Edit the `.env` files with your local configuration:

```bash
# For local development, defaults typically work
# Update only if you need custom ports or database locations
```

### 4. Start Services with Docker Compose

```bash
docker-compose up -d
```

Wait for all services to be healthy:

```bash
docker-compose ps
```

Expected output:
```
NAME                  STATUS
auth-service          Up (healthy)
report-service        Up (healthy)
ai-service            Up (healthy)
gateway               Up (healthy)
```

### 5. Access Application

- **Frontend**: http://localhost:3000
- **Auth API**: http://localhost:8000/docs
- **Report API**: http://localhost:8001/docs
- **AI API**: http://localhost:8002/docs
- **Gateway**: http://localhost:9000

### 6. Stop Services

```bash
docker-compose down
```

Remove volumes:

```bash
docker-compose down -v
```

## Frontend Development

For live development without Docker:

```bash
cd frontend/health-ai-frontend
npm install
npm start
```

The app opens at http://localhost:3000

## Backend Service Development

For individual service development:

```bash
# Terminal 1: Auth Service
cd services/auth-service
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000

# Terminal 2: Report Service
cd services/report-service
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8001

# Terminal 3: AI Service
cd services/ai-service
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8002
```

## Database

Default PostgreSQL credentials (development only):
- Host: localhost
- User: postgres
- Password: Your password (from .env)
- Database: healthai

## Troubleshooting

### Port Already in Use

Change ports in `docker-compose.yml` or stop conflicting services:

```bash
# Find process using port 8000
lsof -i :8000
kill -9 <PID>
```

### Docker Image Build Fails

Rebuild without cache:

```bash
docker-compose build --no-cache
```

### Services Won't Start

Check logs:

```bash
docker-compose logs <service-name>
```

## Next Steps

- See [KUBERNETES.md](KUBERNETES.md) for K8s deployment
- See [AWS_DEPLOYMENT.md](AWS_DEPLOYMENT.md) for AWS setup
- See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues
