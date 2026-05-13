# AIHealth Infrastructure

This directory contains all the infrastructure-as-code for deploying the AIHealth application across multiple environments.

## Directory Structure

```
infrastructure/
├── terraform/           # AWS infrastructure provisioning
│   ├── main.tf         # Main Terraform configuration
│   ├── variables.tf    # Variable definitions
│   ├── outputs.tf      # Output definitions
│   └── providers.tf    # Provider configuration
├── kubernetes/         # Kubernetes manifests and Helm charts
│   └── helm/          # Helm chart for application deployment
│       ├── Chart.yaml
│       ├── values.yaml
│       ├── values-prod.yaml
│       └── values-staging.yaml
├── monitoring/         # Monitoring stack configurations
│   └── prometheus-deployment.yaml
└── argocd/            # GitOps configurations
    └── applications.yaml
```

## Quick Start

### Prerequisites

- AWS CLI configured with appropriate permissions
- Terraform >= 1.0
- kubectl configured for your cluster
- Helm 3.x
- ArgoCD CLI (optional)

### 1. Deploy AWS Infrastructure

```bash
cd infrastructure/terraform

# Initialize Terraform
terraform init

# Review the plan
terraform plan -var-file="terraform.tfvars"

# Apply the infrastructure
terraform apply -var-file="terraform.tfvars"
```

### 2. Configure Kubernetes Cluster

Ensure your kubectl is configured to access your EKS cluster:

```bash
aws eks update-kubeconfig --region us-east-1 --name aihealth-cluster
```

### 3. Deploy Application with Helm

```bash
cd infrastructure/kubernetes/helm

# For development
helm install aihealth . -f values.yaml

# For staging
helm install aihealth-staging . -f values-staging.yaml --namespace staging

# For production
helm install aihealth-prod . -f values-prod.yaml --namespace production
```

### 4. Set up ArgoCD (GitOps)

```bash
# Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Apply application definitions
kubectl apply -f infrastructure/argocd/applications.yaml
```

### 5. Access the Application

Get the LoadBalancer DNS name:

```bash
kubectl get svc -n aihealth gateway
```

## Environments

### Development
- Single replica services
- Basic resource limits
- ClusterIP services
- Minimal monitoring

### Staging
- 2-10 replica autoscaling
- Moderate resource allocation
- Internal LoadBalancer
- Full monitoring stack

### Production
- 3-20 replica autoscaling
- High resource allocation
- Internet-facing LoadBalancer
- Enhanced monitoring and alerting
- Pod disruption budgets

## Monitoring

Access monitoring services:

```bash
# Prometheus
kubectl port-forward -n monitoring svc/prometheus 9090:9090

# Grafana (admin/admin)
kubectl port-forward -n monitoring svc/grafana 3000:3000

# AlertManager
kubectl port-forward -n monitoring svc/alertmanager 9093:9093
```

## Security Considerations

- All secrets should be managed through Kubernetes secrets or external secret managers
- Database passwords are placeholder values - update before deployment
- AWS credentials should use IAM roles instead of access keys
- Enable network policies for production deployments
- Configure proper RBAC for ArgoCD access

## Scaling

The application is configured with Horizontal Pod Autoscaling based on CPU and memory utilization:

- Development: 1-5 replicas
- Staging: 2-10 replicas
- Production: 3-20 replicas

## Backup and Recovery

- Database backups are handled by AWS RDS automated backups
- S3 bucket versioning is enabled for file storage
- Persistent volumes should be backed up regularly
- Consider implementing Velero for cluster backup

## Troubleshooting

### Common Issues

1. **PVC Pending**: Check storage class availability
2. **Pod CrashLoopBackOff**: Check logs and resource limits
3. **Service Unavailable**: Verify LoadBalancer provisioning
4. **ArgoCD Sync Issues**: Check repository access and credentials

### Logs

```bash
# Application logs
kubectl logs -n aihealth deployment/auth-service

# Infrastructure logs
kubectl logs -n monitoring deployment/prometheus
```

## Cost Optimization

- Use spot instances for non-critical workloads
- Configure appropriate resource limits
- Enable cluster autoscaling
- Monitor and optimize database instance sizes
- Use lifecycle policies for S3 objects