# GitOps with ArgoCD

## Architecture

```
Developer → GitHub Push → GitHub Webhook
                             ↓
                          ArgoCD
                             ↓
                      Sync with Git
                             ↓
                       Kubernetes
```

## Prerequisites

- Kubernetes cluster (EKS, GKE, etc.)
- kubectl configured
- Helm 3.x
- git access to repository

## Installation

### Install ArgoCD

```bash
# Create namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f \
  https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for deployment
kubectl wait --for=condition=available \
  --timeout=300s \
  deployment/argocd-server \
  -n argocd
```

### Access ArgoCD UI

Get initial password:

```bash
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d; echo
```

Port-forward to UI:

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Access at: https://localhost:8080

Username: `admin`
Password: [from above]

## Setup Repository Connection

### Create Git Repository Secret

```bash
kubectl create secret generic github-creds \
  --from-literal=username=<github-username> \
  --from-literal=password=<personal-access-token> \
  -n argocd
```

## Create Application

### Application Definition

Create `infrastructure/argocd/applications.yaml`:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: aihealth
  namespace: argocd
spec:
  destination:
    name: in-cluster
    namespace: default
  source:
    repoURL: https://github.com/<org>/healthify_AI
    targetRevision: main
    path: infrastructure/kubernetes/helm
  syncPolicy:
    syncOptions:
      - CreateNamespace=true
    automated:
      prune: true
      selfHeal: true
      allow:
        empty: false
```

### Apply Application

```bash
kubectl apply -f infrastructure/argocd/applications.yaml
```

### Verify Sync

```bash
# View application status
argocd app get aihealth

# Wait for sync
argocd app wait aihealth --sync

# View deployment
kubectl get all -n default
```

## Workflow

### 1. Developer Updates Code

```bash
git add .
git commit -m "Update service"
git push origin main
```

### 2. ArgoCD Detects Change

Automatically polls repository (or via webhook):

```bash
# Manual sync if needed
argocd app sync aihealth
```

### 3. Application Deployed

ArgoCD applies Helm chart to cluster:

```bash
# Watch deployment
kubectl rollout status deployment/auth-service
```

## Advanced Configuration

### Automated Sync

Enable auto-sync in Application:

```yaml
syncPolicy:
  automated:
    prune: true      # Delete removed resources
    selfHeal: true   # Sync when cluster deviates
```

### Multi-Environment

Create separate applications per environment:

```bash
# Staging
argocd app create aihealth-staging \
  --repo https://github.com/<org>/healthify_AI \
  --path infrastructure/kubernetes/helm \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace staging

# Production
argocd app create aihealth-prod \
  --repo https://github.com/<org>/healthify_AI \
  --path infrastructure/kubernetes/helm \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace production
```

### Notifications

Setup Slack notifications:

```bash
kubectl edit configmap argocd-notifications-cm -n argocd
```

Add Slack webhook URL and configure trigger.

## Sync Modes

### Manual Sync

```bash
argocd app sync aihealth
```

### Automatic Sync

Enabled in Application spec:

```yaml
syncPolicy:
  automated:
    prune: true
    selfHeal: true
```

### Selective Sync

```bash
# Sync only specific resource
argocd app sync aihealth --resource 'Deployment:auth-service'

# Sync specific namespace
argocd app sync aihealth --namespace production
```

## Rollback

### Automatic Rollback

On sync failure:

```bash
argocd app rollback aihealth <revision>
```

### Manual Rollback

```bash
# List revisions
argocd app history aihealth

# Rollback to specific revision
argocd app rollback aihealth 0
```

## Monitoring

### Application Status

```bash
# Detailed status
argocd app get aihealth

# Watch status
argocd app wait aihealth --sync

# Health status
argocd app get aihealth --refresh
```

### Resource Status

```bash
# View resources
kubectl get all -n argocd

# ArgoCD controller logs
kubectl logs -f deployment/argocd-application-controller \
  -n argocd
```

## Troubleshooting

### Sync Failures

```bash
# View sync status
argocd app get aihealth

# Check events
kubectl get events -n argocd

# View detailed logs
kubectl logs -f argocd-application-controller-<pod> -n argocd
```

### Repository Connection Issues

```bash
# Test repository access
kubectl exec -it argocd-server-<pod> -n argocd -- \
  argocd repo list

# Update credentials if needed
argocd repo add <url> --username <user> --password <pass>
```

## Best Practices

1. **Separate Configuration**: Use different Helm values per environment
2. **Automated Sync**: Enable for production environments
3. **Self-Healing**: Automatic reconciliation on cluster drift
4. **Notifications**: Setup alerts for sync failures
5. **RBAC**: Restrict ArgoCD permissions by team
6. **Audit Logging**: Enable for compliance

## Cleanup

```bash
# Delete application
argocd app delete aihealth

# Uninstall ArgoCD
kubectl delete -n argocd -f \
  https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Delete namespace
kubectl delete namespace argocd
```

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common ArgoCD issues.
