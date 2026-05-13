# 🚀 AIHealth - Complete Production Deployment Guide

## 🎯 Project Status: PRODUCTION READY

Your AIHealth microservices application is now **fully implemented** with enterprise-grade DevOps practices. This guide will take you from code to production with a public IP endpoint.

---

## 📋 What You've Built

### ✅ Complete Microservices Architecture
- **Frontend**: React 18 with authentication, file upload, and responsive UI
- **Auth Service**: FastAPI with JWT authentication and PostgreSQL
- **Report Service**: FastAPI with PDF processing and S3 storage
- **AI Service**: FastAPI with medical report analysis
- **Gateway**: Nginx reverse proxy with load balancing

### ✅ Enterprise DevOps Pipeline
- **CI/CD**: GitHub Actions with 8-stage pipeline (test, security, quality, build, deploy)
- **Infrastructure**: Terraform AWS (VPC, RDS Aurora, S3, ALB, EKS)
- **Orchestration**: Kubernetes with Helm charts and HPA
- **GitOps**: ArgoCD for automated deployments
- **Monitoring**: Prometheus, Grafana, AlertManager
- **Security**: Trivy scanning, secret management, network policies

### ✅ Production Features
- Horizontal Pod Autoscaling (3-20 replicas)
- High Availability with multi-AZ RDS Aurora
- Automated backups and monitoring
- Health checks and smoke tests
- Multi-environment support (dev/staging/prod)

---

## 🚀 Quick Deploy to AWS (3 Steps)

### Step 1: Prerequisites

```bash
# Install required tools
# AWS CLI
aws --version || curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && unzip awscliv2.zip && sudo ./aws/install

# Terraform
terraform --version || wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg && echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com jammy main" | sudo tee /etc/apt/sources.list.d/hashicorp.list && sudo apt update && sudo apt install terraform

# kubectl
kubectl version --client || curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && chmod +x kubectl && sudo mv kubectl /usr/local/bin/

# Helm
helm version || curl https://get.helm.sh/helm-v3.12.0-linux-amd64.tar.gz -o helm.tar.gz && tar -zxvf helm.tar.gz && sudo mv linux-amd64/helm /usr/local/bin/

# ArgoCD CLI (optional)
argocd version || curl -sSL -o argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64 && chmod +x argocd && sudo mv argocd /usr/local/bin/
```

### Step 2: Configure AWS

```bash
# Configure AWS CLI
aws configure

# Verify configuration
aws sts get-caller-identity

# Create S3 bucket for Terraform state (optional but recommended)
aws s3 mb s3://your-terraform-state-bucket --region us-east-1

# Update infrastructure/terraform/providers.tf with your bucket name
```

### Step 3: Deploy Everything

```bash
# Clone the repository
git clone https://github.com/KaleeswarG25/healthify_AI.git
cd healthify_AI

# Deploy AWS Infrastructure
cd infrastructure/terraform

# Create terraform.tfvars file
cat > terraform.tfvars << EOF
project_name = "aihealth"
environment = "prod"
s3_bucket_name = "your-unique-s3-bucket-name"
create_bastion = false
EOF

# Initialize and deploy
terraform init
terraform plan
terraform apply

# Get EKS cluster name and configure kubectl
aws eks update-kubeconfig --region us-east-1 --name aihealth-prod-cluster

# Deploy application with Helm
cd ../kubernetes/helm
helm install aihealth-prod . -f values-prod.yaml -n aihealth --create-namespace

# Wait for deployment
kubectl wait --for=condition=available --timeout=600s deployment/auth-service -n aihealth
kubectl wait --for=condition=available --timeout=600s deployment/report-service -n aihealth
kubectl wait --for=condition=available --timeout=600s deployment/ai-service -n aihealth
kubectl wait --for=condition=available --timeout=600s deployment/gateway -n aihealth
kubectl wait --for=condition=available --timeout=600s deployment/frontend -n aihealth

# Get your PUBLIC IP
kubectl get svc gateway -n aihealth -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

---

## 🌐 Access Your Application

After deployment, your application will be available at:
```
http://[LOAD_BALANCER_DNS_NAME]
```

Example:
```
http://aihealth-prod-gateway-123456789.us-east-1.elb.amazonaws.com
```

### Default Credentials
- **Frontend**: Access the main application
- **Grafana**: `admin` / `admin` (monitoring dashboards)
- **ArgoCD**: Generate password with `argocd admin initial-password -n argocd`

---

## 🔧 Post-Deployment Configuration

### 1. Update Secrets
```bash
# Create Kubernetes secrets for production
kubectl create secret generic aihealth-secrets -n aihealth \
  --from-literal=jwt-secret="$(openssl rand -hex 32)" \
  --from-literal=db-password="$(openssl rand -hex 16)" \
  --from-literal=aws-access-key-id="YOUR_AWS_ACCESS_KEY" \
  --from-literal=aws-secret-access-key="YOUR_AWS_SECRET_KEY"
```

### 2. Configure Domain (Optional)
```bash
# Update gateway service for HTTPS
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: aihealth-ingress
  namespace: aihealth
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
spec:
  rules:
  - host: yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: gateway
            port:
              number: 80
EOF
```

### 3. Set up Monitoring
```bash
# Access Grafana
kubectl port-forward -n monitoring svc/grafana 3000:3000

# Access Prometheus
kubectl port-forward -n monitoring svc/prometheus 9090:9090
```

---

## 🧪 Testing Your Deployment

### Run Health Checks
```bash
# Run production health checks
chmod +x scripts/health-checks.sh
./scripts/health-checks.sh

# Run smoke tests
chmod +x scripts/smoke-tests.sh
./scripts/smoke-tests.sh --url http://YOUR_LOAD_BALANCER_DNS
```

### Manual Testing
1. Open your browser to the LoadBalancer URL
2. Register a new user account
3. Login with your credentials
4. Upload a PDF medical report
5. View AI analysis results

---

## 📊 Monitoring & Maintenance

### View Logs
```bash
# Application logs
kubectl logs -n aihealth deployment/auth-service -f

# Infrastructure logs
kubectl logs -n monitoring deployment/prometheus -f
```

### Scale the Application
```bash
# Manual scaling
kubectl scale deployment auth-service -n aihealth --replicas=5

# Check autoscaling
kubectl get hpa -n aihealth
```

### Backup Database
```bash
# RDS automated backups are enabled
# View backups in AWS Console or CLI
aws rds describe-db-cluster-snapshots --db-cluster-identifier aihealth-cluster
```

---

## 🚨 Troubleshooting

### Common Issues

1. **LoadBalancer not provisioned**
   ```bash
   kubectl get svc gateway -n aihealth
   # Wait 5-10 minutes for AWS to provision ELB
   ```

2. **Pods not starting**
   ```bash
   kubectl describe pod -n aihealth
   kubectl logs -n aihealth deployment/auth-service
   ```

3. **Database connection failed**
   ```bash
   # Check RDS security groups and subnet configuration
   aws rds describe-db-clusters --db-cluster-identifier aihealth-cluster
   ```

4. **S3 access denied**
   ```bash
   # Verify IAM permissions and bucket policy
   aws s3 ls s3://your-bucket-name/
   ```

### Get Help
- Check the [infrastructure README](infrastructure/README.md) for detailed troubleshooting
- Review [deployment logs](https://github.com/KaleeswarG25/healthify_AI/actions) in GitHub Actions
- Monitor application health in Grafana dashboards

---

## 🎉 Congratulations!

You now have a **production-ready AIHealth application** running on AWS with:

- ✅ **Public IP access** via AWS LoadBalancer
- ✅ **Auto-scaling microservices** (3-20 replicas)
- ✅ **High availability** PostgreSQL Aurora database
- ✅ **Secure file storage** with S3
- ✅ **Complete monitoring** and alerting
- ✅ **GitOps deployment** with ArgoCD
- ✅ **CI/CD pipeline** with GitHub Actions

### Next Steps
1. **Configure a custom domain** for production use
2. **Set up HTTPS certificates** with AWS Certificate Manager
3. **Configure backup retention** policies
4. **Set up alerting** for critical metrics
5. **Implement log aggregation** with ELK stack

Your application is now ready to handle production traffic! 🚀

---

## 📞 Support

- **GitHub Issues**: [Report bugs](https://github.com/KaleeswarG25/healthify_AI/issues)
- **Documentation**: Check the [complete DevOps guide](COMPLETE_DEVOPS_GUIDE.md)
- **Monitoring**: Access Grafana at `http://your-domain/grafana`

**Project URL**: https://github.com/KaleeswarG25/healthify_AI
**Public Access**: http://[YOUR_LOAD_BALANCER_DNS]