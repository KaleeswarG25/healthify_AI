# AWS Deployment Guide

## Prerequisites

- AWS Account with appropriate IAM permissions
- AWS CLI configured with credentials
- Terraform >= 1.0
- kubectl
- Helm 3.x

## Architecture Overview

```
AWS Infrastructure
├── VPC
│   ├── Public Subnets (ALB)
│   └── Private Subnets (EKS, RDS)
├── EKS Cluster
├── RDS Aurora PostgreSQL
├── S3 Bucket (Medical Reports)
├── ECR Repository (Docker Images)
└── Application Load Balancer
```

## 1. Infrastructure Provisioning with Terraform

### Initialize Terraform

```bash
cd infrastructure/terraform

# Initialize
terraform init

# Validate configuration
terraform validate

# Review plan
terraform plan
```

### Configure Variables

Create `terraform.tfvars`:

```hcl
project_name          = "aihealth"
environment           = "prod"
aws_region            = "us-east-1"
vpc_cidr              = "10.0.0.0/16"
availability_zones    = ["us-east-1a", "us-east-1b", "us-east-1c"]
s3_bucket_name        = "aihealth-reports-prod"
```

### Deploy Infrastructure

```bash
terraform apply

# Save outputs
terraform output > outputs.json
```

Terraform creates:
- VPC with public/private subnets
- EKS cluster (1.27+)
- RDS Aurora PostgreSQL
- S3 bucket for reports
- Application Load Balancer
- Security groups and IAM roles

## 2. Build and Push Docker Images

### Create ECR Repository

```bash
aws ecr create-repository \
  --repository-name aihealth-auth-service \
  --region us-east-1

aws ecr create-repository \
  --repository-name aihealth-report-service \
  --region us-east-1

aws ecr create-repository \
  --repository-name aihealth-ai-service \
  --region us-east-1

aws ecr create-repository \
  --repository-name aihealth-gateway \
  --region us-east-1
```

### Build and Push Images

```bash
# Get ECR login token
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# Build and tag images
docker build -t aihealth-auth-service ./services/auth-service
docker tag aihealth-auth-service:latest \
  <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/aihealth-auth-service:latest

docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/aihealth-auth-service:latest

# Repeat for other services
```

## 3. Configure kubectl

```bash
# Get EKS cluster name from terraform output
CLUSTER_NAME=$(terraform output -raw eks_cluster_name)

# Configure kubectl
aws eks update-kubeconfig \
  --region us-east-1 \
  --name $CLUSTER_NAME

# Verify connection
kubectl cluster-info
```

## 4. Deploy Application with Helm

Update `infrastructure/kubernetes/helm/values-prod.yaml`:

```yaml
global:
  image:
    registry: <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
    tag: latest

services:
  authService:
    replicas: 3
  reportService:
    replicas: 3
  aiService:
    replicas: 2
  
postgresql:
  auth:
    password: <STRONG_PASSWORD>
    
aws:
  region: us-east-1
  s3Bucket: aihealth-reports-prod
```

Deploy:

```bash
cd infrastructure/kubernetes/helm

helm install aihealth . \
  -f values-prod.yaml \
  --namespace production \
  --create-namespace
```

## 5. Configure RDS

Update database URL in Kubernetes secrets:

```bash
# Get RDS endpoint from terraform output
RDS_ENDPOINT=$(terraform output -raw rds_endpoint)

# Create secret
kubectl create secret generic db-credentials \
  --from-literal=DATABASE_URL="postgresql://admin:password@${RDS_ENDPOINT}/healthai" \
  -n production
```

## 6. Setup S3 Access

Kubernetes pods use IAM roles for S3 access. Verify in Terraform output:

```bash
terraform output s3_bucket_name
terraform output s3_bucket_arn
```

Update service IAM role to include S3 permissions.

## 7. Application Load Balancer

Get the ALB DNS:

```bash
aws elbv2 describe-load-balancers \
  --region us-east-1 \
  --query 'LoadBalancers[0].DNSName'
```

Access application:
```
http://<ALB_DNS>
```

## Monitoring & Logging

### CloudWatch

Logs are automatically sent to CloudWatch. View logs:

```bash
aws logs tail /aws/eks/aihealth-prod --follow
```

### Metrics

Enable Container Insights:

```bash
aws eks update-cluster-config \
  --name aihealth-prod \
  --logging '{"clusterLogging":[{"enabled":true,"types":["api","audit","authenticator","controllerManager","scheduler"],"logGroupName":"/aws/eks/aihealth-prod/logs"}]}'
```

## Cost Optimization

- Enable Spot Instances: Edit `values-prod.yaml`
- Auto-scaling: Set appropriate HPA limits
- Reserved Instances: For long-term deployments

## Cleanup

```bash
# Delete Helm release
helm uninstall aihealth -n production

# Destroy AWS infrastructure
terraform destroy
```

## Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common AWS deployment issues.
