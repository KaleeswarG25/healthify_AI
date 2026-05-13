#!/bin/bash

# AIHealth Production Health Checks
# This script performs comprehensive health checks for all services

set -e

# Configuration
NAMESPACE="${NAMESPACE:-aihealth}"
TIMEOUT=30
HEALTH_ENDPOINT="/health"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if kubectl is available
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed or not in PATH"
        exit 1
    fi

    if ! kubectl cluster-info &> /dev/null; then
        log_error "Unable to connect to Kubernetes cluster"
        exit 1
    fi
}

# Check if namespace exists
check_namespace() {
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_error "Namespace '$NAMESPACE' does not exist"
        exit 1
    fi
}

# Check pod status
check_pod_status() {
    local service=$1
    local expected_replicas=$2

    log_info "Checking pod status for $service..."

    # Get pod status
    local pods
    pods=$(kubectl get pods -n "$NAMESPACE" -l "app=$service" --no-headers 2>/dev/null || echo "")

    if [ -z "$pods" ]; then
        log_error "No pods found for service $service"
        return 1
    fi

    # Count ready pods
    local ready_count
    ready_count=$(echo "$pods" | grep -c "Running" || echo "0")

    if [ "$ready_count" -lt "$expected_replicas" ]; then
        log_error "Service $service has $ready_count/$expected_replicas pods running"
        return 1
    fi

    log_info "Service $service: $ready_count/$expected_replicas pods running"
    return 0
}

# Check service health endpoint
check_service_health() {
    local service=$1
    local port=$2

    log_info "Checking health endpoint for $service..."

    # Get service URL
    local service_url
    service_url=$(kubectl get svc -n "$NAMESPACE" "$service" -o jsonpath='{.spec.clusterIP}' 2>/dev/null || echo "")

    if [ -z "$service_url" ]; then
        log_error "Could not get cluster IP for service $service"
        return 1
    fi

    # Use a pod to test internal connectivity
    local test_pod
    test_pod=$(kubectl get pods -n "$NAMESPACE" -l "app=$service" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

    if [ -z "$test_pod" ]; then
        log_error "No test pod available for service $service"
        return 1
    fi

    # Execute health check from within the cluster
    if kubectl exec -n "$NAMESPACE" "$test_pod" -- curl -f -m "$TIMEOUT" "http://$service:$port$HEALTH_ENDPOINT" &> /dev/null; then
        log_info "Service $service health check passed"
        return 0
    else
        log_error "Service $service health check failed"
        return 1
    fi
}

# Check database connectivity
check_database() {
    log_info "Checking database connectivity..."

    # Get PostgreSQL pod
    local db_pod
    db_pod=$(kubectl get pods -n "$NAMESPACE" -l "app.kubernetes.io/name=postgresql" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

    if [ -z "$db_pod" ]; then
        log_error "PostgreSQL pod not found"
        return 1
    fi

    # Test database connection
    if kubectl exec -n "$NAMESPACE" "$db_pod" -- pg_isready -U postgres -d aihealth &> /dev/null; then
        log_info "Database connectivity check passed"
        return 0
    else
        log_error "Database connectivity check failed"
        return 1
    fi
}

# Check Redis connectivity
check_redis() {
    log_info "Checking Redis connectivity..."

    # Get Redis pod
    local redis_pod
    redis_pod=$(kubectl get pods -n "$NAMESPACE" -l "app.kubernetes.io/name=redis" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

    if [ -z "$redis_pod" ]; then
        log_error "Redis pod not found"
        return 1
    fi

    # Test Redis connection
    if kubectl exec -n "$NAMESPACE" "$redis_pod" -- redis-cli ping | grep -q "PONG"; then
        log_info "Redis connectivity check passed"
        return 0
    else
        log_error "Redis connectivity check failed"
        return 1
    fi
}

# Check S3 connectivity (if applicable)
check_s3() {
    log_info "Checking S3 connectivity..."

    # Get report service pod
    local report_pod
    report_pod=$(kubectl get pods -n "$NAMESPACE" -l "app=report-service" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

    if [ -z "$report_pod" ]; then
        log_warn "Report service pod not found, skipping S3 check"
        return 0
    fi

    # Test S3 access (this would require AWS credentials to be properly configured)
    log_info "S3 connectivity check skipped (requires AWS credentials)"
    return 0
}

# Main health check function
main() {
    log_info "Starting AIHealth health checks..."
    log_info "Namespace: $NAMESPACE"

    local failed_checks=0

    # Basic checks
    check_kubectl
    check_namespace

    # Service checks
    services=(
        "auth-service:8000:3"
        "report-service:8001:3"
        "ai-service:8002:2"
        "gateway:80:3"
        "frontend:80:3"
    )

    for service_info in "${services[@]}"; do
        IFS=':' read -r service port expected_replicas <<< "$service_info"

        if ! check_pod_status "$service" "$expected_replicas"; then
            ((failed_checks++))
        fi

        if ! check_service_health "$service" "$port"; then
            ((failed_checks++))
        fi
    done

    # Infrastructure checks
    if ! check_database; then
        ((failed_checks++))
    fi

    if ! check_redis; then
        ((failed_checks++))
    fi

    check_s3

    # Summary
    echo
    if [ $failed_checks -eq 0 ]; then
        log_info "All health checks passed! ✅"
        exit 0
    else
        log_error "$failed_checks health check(s) failed! ❌"
        exit 1
    fi
}

# Run main function
main "$@"