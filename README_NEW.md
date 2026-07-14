# AI Health

Medical report analysis platform powered by AI. Process, analyze, and understand medical documents with LLM-driven insights.

## Features

- **Secure Authentication**: JWT-based user management with role-based access control
- **Report Management**: Upload and manage PDF medical reports with metadata tracking
- **AI-Powered Analysis**: Automated medical report analysis using Ollama LLM
- **Interactive Chat**: Ask questions about analyzed reports with contextual understanding
- **Production-Ready**: Full DevOps pipeline with Docker, Kubernetes, and AWS infrastructure
- **Multi-Environment**: Support for development, staging, and production deployments

## Tech Stack

**Frontend**
- React 18
- Axios HTTP client
- React Router
- React Icons

**Backend Services**
- FastAPI (Python 3.11)
- SQLAlchemy ORM
- Pydantic validation
- PyJWT authentication
- PyPDF2 text extraction

**Infrastructure**
- Docker & Docker Compose
- Kubernetes (EKS)
- Helm charts
- Terraform (AWS)
- ArgoCD (GitOps)
- Nginx (Gateway)

**Database & Storage**
- PostgreSQL (RDS Aurora)
- AWS S3
- Ollama (Local LLM)

## Architecture

```
Developer
    ↓
GitHub Push
    ↓
GitHub Actions
    ↓
Docker Build → ECR Registry
    ↓
ArgoCD Sync
    ↓
Amazon EKS Cluster
    ↓
AI Health Platform
```

### System Components

```
┌─────────────────────────────┐
│   React Frontend (Port 3000) │
└─────────────────────────────┘
           ↓
┌─────────────────────────────┐
│  Nginx Gateway (Port 9000)   │
└─────────────────────────────┘
    ↓          ↓          ↓
┌──────┐  ┌─────────┐  ┌────────┐
│Auth  │  │ Report  │  │   AI   │
│8000  │  │ 8001    │  │ 8002   │
└──────┘  └─────────┘  └────────┘
    ↓          ↓          ↓
    └─────────────────────┘
          PostgreSQL
       (RDS Aurora)
```

## Project Structure

```
healthify_AI/
├── README.md
├── LICENSE
├── docker-compose.yml
├── .env.example
│
├── docs/
│   ├── LOCAL_SETUP.md           # Local development guide
│   ├── AWS_DEPLOYMENT.md        # AWS infrastructure setup
│   ├── KUBERNETES.md            # Kubernetes deployment
│   ├── ARGOCD.md                # GitOps workflow
│   ├── TROUBLESHOOTING.md       # Common issues & solutions
│   └── ARCHITECTURE.md          # Detailed architecture
│
├── frontend/
│   └── health-ai-frontend/      # React application
│       ├── src/
│       │   ├── components/      # React components
│       │   ├── services/        # API clients
│       │   ├── contexts/        # Auth context
│       │   └── styles/
│       └── package.json
│
├── services/
│   ├── auth-service/            # User authentication
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── models.py
│   │   │   ├── schemas.py
│   │   │   ├── routers/
│   │   │   └── utils/
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   ├── report-service/          # PDF management & S3
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── models.py
│   │   │   ├── s3.py
│   │   │   ├── routers/
│   │   │   └── schemas.py
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   └── ai-service/              # Medical analysis
│       ├── app/
│       │   ├── main.py
│       │   ├── ai_engine.py
│       │   ├── pdf_parser.py
│       │   ├── routers/
│       │   └── schemas.py
│       ├── Dockerfile
│       └── requirements.txt
│
├── gateway/
│   ├── Dockerfile
│   └── nginx.conf
│
├── infrastructure/
│   ├── terraform/                # AWS provisioning
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── providers.tf
│   ├── kubernetes/
│   │   ├── ingress.yaml         # AWS ALB ingress
│   │   └── helm/                # Helm charts
│   │       ├── Chart.yaml
│   │       ├── values.yaml
│   │       ├── values-staging.yaml
│   │       └── values-prod.yaml
│   ├── monitoring/              # Prometheus config
│   └── argocd/                  # ArgoCD setup
│
└── scripts/
    ├── health-checks.sh
    └── smoke-tests.sh
```

## Quick Start

### 1. Local Development

```bash
git clone <repository-url>
cd healthify_AI
docker-compose up
```

Access at http://localhost:3000

See [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md) for detailed instructions.

### 2. With Kubernetes

```bash
helm install aihealth infrastructure/kubernetes/helm
```

See [docs/KUBERNETES.md](docs/KUBERNETES.md) for full deployment.

### 3. AWS Production

```bash
cd infrastructure/terraform
terraform apply
```

See [docs/AWS_DEPLOYMENT.md](docs/AWS_DEPLOYMENT.md) for setup.

## Environment Setup

Copy example files:

```bash
cp .env.example .env
cp services/auth-service/.env.example services/auth-service/.env
cp services/report-service/.env.example services/report-service/.env
cp services/ai-service/.env.example services/ai-service/.env
cp frontend/health-ai-frontend/.env.example frontend/health-ai-frontend/.env
```

Update values as needed for your environment.

## Docker Deployment

Start services:

```bash
docker-compose up -d
```

Check health:

```bash
docker-compose ps
curl http://localhost:8000/health  # Auth
curl http://localhost:8001/health  # Report
curl http://localhost:8002/health  # AI
```

API Documentation:
- http://localhost:8000/docs
- http://localhost:8001/docs
- http://localhost:8002/docs

## Kubernetes Deployment

Deploy to cluster:

```bash
kubectl create namespace aihealth
helm install aihealth infrastructure/kubernetes/helm \
  -f infrastructure/kubernetes/helm/values-prod.yaml \
  -n aihealth
```

Verify deployment:

```bash
kubectl get pods -n aihealth
kubectl get svc -n aihealth
```

See [docs/KUBERNETES.md](docs/KUBERNETES.md) for details.

## GitOps with ArgoCD

Application deployments are managed by ArgoCD:

```
Git Commit → ArgoCD → Kubernetes → Live System
```

Setup:

```bash
kubectl create namespace argocd
kubectl apply -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml -n argocd
```

See [docs/ARGOCD.md](docs/ARGOCD.md) for complete setup.

## API Endpoints

| Endpoint | Service | Purpose |
|----------|---------|---------|
| `/api/auth/register` | Auth | User registration |
| `/api/auth/login` | Auth | User login |
| `/api/reports/upload` | Report | Upload medical report |
| `/api/ai/analyze-text` | AI | Analyze text report |
| `/api/ai/analyze-pdf` | AI | Analyze PDF report |
| `/api/ai/chat` | AI | Chat about analysis |

## Documentation

- [Local Development](docs/LOCAL_SETUP.md)
- [AWS Deployment](docs/AWS_DEPLOYMENT.md)
- [Kubernetes Setup](docs/KUBERNETES.md)
- [GitOps with ArgoCD](docs/ARGOCD.md)
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
- [System Architecture](docs/ARCHITECTURE.md)

## Troubleshooting

Common issues and solutions are documented in [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md).

For quick help:

```bash
# Check service health
curl http://localhost:8000/health

# View logs
docker-compose logs <service-name>

# Debug pod
kubectl describe pod <pod-name>
```

## Development Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and test locally
3. Push to GitHub: `git push origin feature/your-feature`
4. GitHub Actions runs tests and builds Docker image
5. Create Pull Request
6. ArgoCD automatically syncs approved changes

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Repository Status**: Production Ready

For more information, see the documentation folder or create an issue on GitHub.
