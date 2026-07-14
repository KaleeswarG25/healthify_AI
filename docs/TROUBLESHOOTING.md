# Troubleshooting Guide

## Common Issues

### Pods Pending

**Symptom**: Pod stays in `Pending` state

**Causes & Solutions**:

1. **Insufficient Resources**
   ```bash
   kubectl describe pod <pod-name>
   # Look for "Insufficient cpu/memory"
   
   # Check node capacity
   kubectl top nodes
   
   # Solution: Add more nodes or reduce resource requests
   ```

2. **Image Pull Issues**
   ```bash
   # Check if image is accessible
   docker pull <registry>/<image>:tag
   
   # Verify registry credentials
   kubectl get secret regcred
   ```

3. **PVC Not Bound**
   ```bash
   kubectl get pvc
   # Solution: Check storage class or create PV
   ```

### ImagePullBackOff

**Symptom**: Pod fails to pull Docker image

**Solutions**:

```bash
# Check image existence
aws ecr describe-images --repository-name aihealth-auth-service

# Verify credentials
kubectl get secret regcred -o yaml

# Check image pull events
kubectl describe pod <pod-name>

# Recreate secret if needed
kubectl create secret docker-registry regcred \
  --docker-server=<registry> \
  --docker-username=<user> \
  --docker-password=<password> \
  --dry-run=client -o yaml | kubectl apply -f -
```

### CrashLoopBackOff

**Symptom**: Pod crashes immediately after start

**Solutions**:

```bash
# View pod logs
kubectl logs <pod-name>
kubectl logs <pod-name> --previous

# Check events
kubectl describe pod <pod-name>

# Common causes:
# 1. Database connection failed
# 2. Missing environment variables
# 3. Port already in use

# Check environment variables
kubectl exec -it <pod-name> -- env | grep DATABASE_URL

# Verify database connectivity
kubectl run -it debug --image=postgres:15 --restart=Never -- \
  psql -h <db-host> -U postgres
```

## Database Issues

### PostgreSQL Connection Failed

**Error**: `could not connect to server: Connection refused`

**Solutions**:

```bash
# 1. Check RDS instance status
aws rds describe-db-instances --query 'DBInstances[*].[DBInstanceIdentifier,DBInstanceStatus]'

# 2. Verify security group rules
aws ec2 describe-security-groups --query 'SecurityGroups[*].[GroupName,IpPermissions]'

# 3. Test connectivity from pod
kubectl run -it debug --image=busybox --restart=Never -- \
  nc -zv <rds-endpoint> 5432

# 4. Check connection string format
# Should be: postgresql://user:password@host:5432/dbname
```

### Database Migration Failed

```bash
# Run migration manually
kubectl exec -it auth-service-<pod> -- \
  python -m alembic upgrade head

# Check migration status
kubectl logs auth-service-<pod> | grep -i migration
```

### Slow Queries

```bash
# Enable query logging
kubectl exec -it <postgres-pod> -- \
  psql -c "ALTER SYSTEM SET log_min_duration_statement = 1000;"

# View slow query logs
kubectl logs <postgres-pod> | grep "duration:"
```

## S3 Access Issues

### Permission Denied

**Error**: `An error occurred (AccessDenied) when calling the PutObject operation`

**Solutions**:

```bash
# 1. Check IAM role permissions
aws iam get-role-policy --role-name <role> --policy-name <policy>

# 2. Verify IRSA (IAM Roles for Service Accounts)
kubectl get serviceaccount -n <ns> -o yaml

# 3. Test S3 access from pod
kubectl run -it debug --image=amazon/aws-cli --restart=Never -- \
  s3 ls s3://aihealth-reports

# 4. Check bucket policy
aws s3api get-bucket-policy --bucket aihealth-reports
```

### S3 Bucket Not Found

```bash
# List available buckets
aws s3 ls

# Verify bucket name in environment
kubectl get configmap -n <ns> -o yaml | grep -i bucket
```

## Ingress Issues

### Ingress Not Getting IP/DNS

**Solution**:

```bash
# Check ingress status
kubectl get ingress

# Describe ingress
kubectl describe ingress aihealth-ingress

# For AWS ALB:
# May take 2-3 minutes for DNS to propagate

# View AWS load balancers
aws elbv2 describe-load-balancers
```

### Service Not Accessible via Ingress

```bash
# 1. Verify ingress rules
kubectl get ingress -o yaml

# 2. Check service endpoints
kubectl get endpoints

# 3. Test pod connectivity
kubectl port-forward svc/auth-service 8000:8000
curl http://localhost:8000/health

# 4. Check security groups
aws ec2 describe-security-groups --filters Name=group-name,Values=*aihealth*
```

### Certificate Issues (HTTPS)

```bash
# Check certificate
kubectl get certificate

# View certificate details
kubectl describe certificate aihealth-cert

# Renew certificate
kubectl delete certificate aihealth-cert
# It will auto-renew if cert-manager is running
```

## Network Issues

### Pod Cannot Reach Service

```bash
# 1. Test DNS resolution
kubectl run -it debug --image=busybox --restart=Never -- \
  nslookup auth-service

# 2. Test connectivity
kubectl run -it debug --image=curlimages/curl --restart=Never -- \
  curl http://auth-service:8000/health

# 3. Check network policy
kubectl get networkpolicies

# 4. Check service endpoints
kubectl get endpoints auth-service
```

### Communication Between Pods Blocked

```bash
# Check network policies
kubectl describe networkpolicy <policy-name>

# Temporarily disable network policies to test
kubectl delete networkpolicies --all

# View traffic logs (if using Calico)
kubectl logs -n calico-system <pod> | grep denied
```

## Resource Issues

### Out of Memory (OOM)

```bash
# Check pod memory usage
kubectl top pods

# Increase memory limit in values.yaml
resources:
  limits:
    memory: "1Gi"

# Redeploy
helm upgrade aihealth . -f values.yaml
```

### CPU Throttling

```bash
# Check CPU requests/limits
kubectl get pods -o json | jq '.items[].spec.containers[].resources'

# Increase CPU request
resources:
  requests:
    cpu: "500m"
```

## ArgoCD Issues

### Application Won't Sync

```bash
# Check application status
argocd app get aihealth

# View sync errors
argocd app get aihealth --refresh

# Manual sync
argocd app sync aihealth

# Force sync
argocd app sync aihealth --force
```

### Repository Connection Failed

```bash
# Test repository access
argocd repo list

# Re-add repository with new credentials
argocd repo remove https://github.com/<org>/healthify_AI
argocd repo add https://github.com/<org>/healthify_AI \
  --username <user> \
  --password <token>
```

### Webhook Not Triggering Sync

```bash
# Configure GitHub webhook manually
# GitHub → Settings → Webhooks
# Payload URL: https://<argocd-server>/api/webhook

# Test webhook
curl -X POST https://<argocd-server>/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"action":"push"}'
```

## Logging & Monitoring

### View Logs

```bash
# Stream logs from multiple pods
kubectl logs -l app=auth-service --tail=100 -f

# View logs from specific timeframe
kubectl logs <pod> --since=1h

# Export logs for analysis
kubectl logs <pod> > pod.log
```

### Check Metrics

```bash
# Pod resource usage
kubectl top pods

# Node resource usage
kubectl top nodes

# View metrics over time (requires metrics-server)
kubectl get pods -o custom-columns=NAME:.metadata.name,CPU:.usage.cpu,MEMORY:.usage.memory
```

## Getting Help

1. **Check Logs**: Always start with `kubectl logs`
2. **Describe Resources**: Use `kubectl describe pod/service/ingress`
3. **Check Events**: `kubectl get events`
4. **Review YAML**: `kubectl get <resource> -o yaml`
5. **Test Connectivity**: Use debug pods to isolate issues

## Emergency Recovery

### Rollback Deployment

```bash
# View revision history
kubectl rollout history deployment/auth-service

# Rollback to previous revision
kubectl rollout undo deployment/auth-service

# Rollback to specific revision
kubectl rollout undo deployment/auth-service --to-revision=2
```

### Restart Pod

```bash
# Delete pod to trigger restart
kubectl delete pod <pod-name>

# Or restart entire deployment
kubectl rollout restart deployment/auth-service
```

### Drain Node

```bash
# Safely drain a node
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data

# Rejoin node to cluster
kubectl uncordon <node-name>
```
