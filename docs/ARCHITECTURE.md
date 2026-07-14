# System Architecture

## Deployment Flow

```
Developer Push → GitHub Repository
                      ↓
                GitHub Actions
                      ↓
         Unit Tests / Security Scan
                      ↓
              Docker Image Build
                      ↓
           Push to AWS ECR Registry
                      ↓
                   ArgoCD
                      ↓
          Amazon EKS Cluster
                      ↓
            AI Health Application
```

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Internet / Users                      │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│         AWS Application Load Balancer (ALB)              │
│  ✓ SSL/TLS Termination  ✓ Path-based Routing           │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              Kubernetes (Amazon EKS)                     │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Auth Service │  │Report Service│  │ AI Service   │  │
│  │  (3 replicas)│  │ (3 replicas) │  │ (2 replicas) │  │
│  │ Port: 8000   │  │ Port: 8001   │  │ Port: 8002   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         ↓                 ↓                  ↓           │
│  ┌──────────────────────────────────────────────────┐  │
│  │      Nginx Gateway (Reverse Proxy)               │  │
│  │      Port: 9000 (maps to 80/443)                 │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
         ↓              ↓               ↓
    ┌─────────┐   ┌──────────────┐  ┌────────┐
    │  RDS    │   │  S3 Bucket   │  │ Ollama │
    │ Aurora  │   │  (Reports)   │  │(Local) │
    │PostgreSQL│   │              │  │        │
    └─────────┘   └──────────────┘  └────────┘
```

## Microservices

### Auth Service
- **Port**: 8000
- **Framework**: FastAPI
- **Database**: PostgreSQL (RDS Aurora)
- **Features**:
  - JWT token generation
  - User registration/login
  - Role-based access control
  - Password hashing with bcrypt

### Report Service
- **Port**: 8001
- **Framework**: FastAPI
- **Database**: PostgreSQL (RDS Aurora)
- **Storage**: AWS S3
- **Features**:
  - PDF upload handling
  - Pre-signed URL generation
  - Metadata storage
  - File versioning

### AI Service
- **Port**: 8002
- **Framework**: FastAPI
- **LLM**: Ollama (local deployment)
- **Features**:
  - Medical report analysis
  - PDF text extraction
  - In-memory analysis caching
  - Chat interface with context

### Gateway
- **Port**: 9000
- **Technology**: Nginx
- **Functions**:
  - Request routing
  - Load balancing
  - CORS handling
  - SSL/TLS termination

## Frontend

### React Application
- **Port**: 3000
- **Framework**: React 18
- **Features**:
  - Single Page Application
  - JWT-based authentication
  - File drag-and-drop upload
  - Real-time analysis display
  - Chat interface
  - Analysis history

## Data Flow

### 1. User Registration

```
User Input
    ↓
Frontend
    ↓
Auth Service (JWT Token)
    ↓
PostgreSQL (Store User)
```

### 2. Report Upload & Analysis

```
User Selects PDF
    ↓
Frontend
    ↓
Report Service (Pre-signed S3 URL)
    ↓
Frontend (Upload to S3)
    ↓
AI Service (Extract & Analyze)
    ↓
Ollama LLM
    ↓
Response to Frontend
    ↓
Store Metadata in PostgreSQL
```

### 3. Chat with Analysis

```
User Question
    ↓
Frontend
    ↓
AI Service (Context + Question)
    ↓
Ollama LLM
    ↓
Response
    ↓
Frontend Display
```

## Infrastructure Components

### Networking
- **VPC**: Isolated network environment
- **Public Subnets**: ALB and NAT
- **Private Subnets**: EKS nodes and RDS
- **Security Groups**: Whitelist required ports only

### Compute
- **EKS Cluster**: Managed Kubernetes service
- **Auto Scaling**: 2-10 nodes based on load
- **Node Groups**: 3 availability zones for HA

### Database
- **RDS Aurora PostgreSQL**: Multi-AZ deployment
- **Automated Backups**: Daily snapshots
- **Encryption**: At-rest and in-transit

### Storage
- **S3 Bucket**: Medical report storage
- **Versioning**: Enabled for data protection
- **Encryption**: Server-side encryption

## High Availability

```
              Load Balancer
              /    |    \
        Zone A  Zone B  Zone C
         /        |        \
      Pod1      Pod2      Pod3
        \        |        /
         RDS Aurora (Multi-AZ)
```

- 3 service replicas across availability zones
- RDS Aurora with automated failover
- Horizontal Pod Autoscaling (HPA)
- Load balancing across pods

## Security

- **Network**: VPC isolation, security groups
- **Authentication**: JWT tokens, bcrypt hashing
- **Authorization**: Role-based access control
- **Encryption**: TLS for data in transit, encrypted storage
- **Secrets**: Kubernetes secrets for sensitive data
- **IAM**: Least privilege principle for AWS access

## Monitoring

- **CloudWatch**: Application and infrastructure logs
- **Metrics**: CPU, memory, network usage
- **Alerts**: Automated alerts for anomalies
- **Dashboards**: Custom CloudWatch dashboards

## Scaling

- **Horizontal**: Add more pods via HPA
- **Vertical**: Increase pod resource requests
- **Database**: RDS Aurora auto-scaling
- **Storage**: S3 unlimited scaling

## Disaster Recovery

- **RDS Snapshots**: Automated daily backups
- **S3 Versioning**: All report versions retained
- **Multi-AZ**: Automatic failover in case of failure
- **GitOps**: Infrastructure defined in Git for easy recreation

## Cost Optimization

- **Spot Instances**: Significant savings (70% discount)
- **Reserved Capacity**: For predictable workloads
- **S3 Lifecycle**: Archive old reports
- **CloudWatch**: Log retention policies
