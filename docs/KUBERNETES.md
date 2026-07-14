# Kubernetes Deployment Guide

## Prerequisites

- Kubernetes cluster (EKS, GKE, or local kind/minikube)
- kubectl configured
- Helm 3.x
- Docker images pushed to registry

## Cluster Setup

### Create Namespace

```bash
kubectl create namespace aihealth
kubectl config set-context --current --namespace=aihealth
```

### Create Image Pull Secret (if using private registry)

```bash
kubectl create secret docker-registry regcred \
  --docker-server=<registry> \
  --docker-username=<username> \
  --docker-password=<password> \
  -n aihealth
```

## Deployment with Helm

### Install Release

```bash
cd infrastructure/kubernetes/helm

# Development
helm install aihealth . -f values.yaml

# Staging
helm install aihealth-staging . -f values-staging.yaml -n staging --create-namespace

# Production
helm install aihealth-prod . -f values-prod.yaml -n production --create-namespace
```

### Verify Deployment

```bash
# Check pods
kubectl get pods -n aihealth

# Check services
kubectl get svc -n aihealth

# Check ingress
kubectl get ingress -n aihealth

# View pod logs
kubectl logs -f deployment/auth-service -n aihealth
```

## Deployment Manifest Structure

The Helm chart includes:

```
infrastructure/kubernetes/helm/
├── Chart.yaml              # Chart metadata
├── values.yaml             # Default values
├── values-staging.yaml     # Staging overrides
├── values-prod.yaml        # Production overrides
├── templates/
│   ├── deployment.yaml     # Service deployments
│   ├── service.yaml        # Service definitions
│   ├── hpa.yaml            # Horizontal Pod Autoscaler
│   ├── ingress.yaml        # Ingress configuration
│   ├── configmap.yaml      # Configuration
│   └── secret.yaml         # Secrets management
└── charts/
    └── postgresql/         # PostgreSQL subchart
```

## Horizontal Pod Autoscaling

HPA automatically scales services based on CPU:

```bash
# View HPA status
kubectl get hpa -n aihealth

# Check metrics
kubectl top pods -n aihealth
```

Configuration in `values.yaml`:
```yaml
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPU: 80
```

## Ingress Configuration

Access the application through ingress:

```bash
# Get ingress address
kubectl get ingress -n aihealth

# Access application
curl http://<ingress-ip>
```

For AWS ALB:
```bash
kubectl get ingress aihealth-ingress -n aihealth -o wide
```

The ALB DNS will be displayed in the ADDRESS column.

## Persistent Storage

### PostgreSQL Data

Data is persisted using PVC (Persistent Volume Claim). On AWS EBS:

```bash
# View PVCs
kubectl get pvc -n aihealth

# Check volume usage
kubectl exec -it <pod-name> -n aihealth -- df -h
```

### S3 Storage

Application reports are stored in S3. Pods access via IAM roles:

```bash
# Verify S3 access
kubectl exec -it <report-service-pod> -n aihealth -- \
  aws s3 ls s3://aihealth-reports
```

## Health Checks

Services include health check endpoints:

```bash
# Port-forward to service
kubectl port-forward svc/auth-service 8000:8000 -n aihealth

# Test health endpoint
curl http://localhost:8000/health
```

## Rolling Updates

Update application without downtime:

```bash
# Update image
kubectl set image deployment/auth-service \
  auth-service=<registry>/auth-service:new-tag \
  -n aihealth

# Check rollout status
kubectl rollout status deployment/auth-service -n aihealth

# Rollback if needed
kubectl rollout undo deployment/auth-service -n aihealth
```

## Monitoring & Logging

### View Logs

```bash
# Single pod
kubectl logs <pod-name> -n aihealth

# All pods in deployment
kubectl logs -l app=auth-service -n aihealth --tail=100

# Stream logs
kubectl logs -f deployment/auth-service -n aihealth
```

### Resource Usage

```bash
# Pod resources
kubectl top pods -n aihealth

# Node resources
kubectl top nodes
```

## Scaling

### Manual Scaling

```bash
# Scale deployment
kubectl scale deployment auth-service --replicas=5 -n aihealth
```

### Automatic Scaling

HPA scales automatically. View settings:

```bash
kubectl describe hpa auth-service -n aihealth
```

## Network Policies

Restrict traffic between pods:

```bash
# View network policies
kubectl get networkpolicies -n aihealth

# Apply custom policy
kubectl apply -f infrastructure/kubernetes/network-policy.yaml
```

## Debugging

### Pod Issues

```bash
# Describe pod
kubectl describe pod <pod-name> -n aihealth

# Get events
kubectl get events -n aihealth --sort-by='.lastTimestamp'

# Execute command in pod
kubectl exec -it <pod-name> -n aihealth -- bash
```

### Service Discovery

```bash
# Test DNS resolution
kubectl run -it debug --image=busybox --restart=Never -n aihealth -- \
  nslookup auth-service

# Test service connectivity
kubectl run -it debug --image=curlimages/curl --restart=Never -n aihealth -- \
  curl http://auth-service:8000/health
```

## Cleanup

```bash
# Delete release
helm uninstall aihealth -n aihealth

# Delete namespace
kubectl delete namespace aihealth
```

## Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common Kubernetes issues.
