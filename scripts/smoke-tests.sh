#!/bin/bash

# AIHealth Smoke Tests
# This script performs basic smoke tests for the deployed application

set -e

# Configuration
BASE_URL="${BASE_URL:-http://localhost:9000}"
TIMEOUT=30

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

# Check if curl is available
check_dependencies() {
    if ! command -v curl &> /dev/null; then
        log_error "curl is not installed or not in PATH"
        exit 1
    fi
}

# Make HTTP request and check response
test_endpoint() {
    local url=$1
    local expected_status=${2:-200}
    local description=$3

    log_info "Testing $description: $url"

    local response
    local status_code

    if response=$(curl -s -w "HTTPSTATUS:%{http_code}" -m "$TIMEOUT" "$url" 2>/dev/null); then
        status_code=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

        if [ "$status_code" = "$expected_status" ]; then
            log_info "$description: PASSED (HTTP $status_code)"
            return 0
        else
            log_error "$description: FAILED (Expected HTTP $expected_status, got $status_code)"
            return 1
        fi
    else
        log_error "$description: FAILED (Connection error)"
        return 1
    fi
}

# Test authentication flow
test_auth_flow() {
    log_info "Testing authentication flow..."

    # Test registration endpoint
    if ! test_endpoint "$BASE_URL/auth/register" 405 "Auth registration endpoint"; then
        return 1
    fi

    # Test login endpoint
    if ! test_endpoint "$BASE_URL/auth/login" 405 "Auth login endpoint"; then
        return 1
    fi

    # Test health endpoint
    if ! test_endpoint "$BASE_URL/auth/health" 200 "Auth health endpoint"; then
        return 1
    fi

    log_info "Authentication flow tests: PASSED"
    return 0
}

# Test report service
test_report_service() {
    log_info "Testing report service..."

    # Test health endpoint
    if ! test_endpoint "$BASE_URL/reports/health" 200 "Report service health"; then
        return 1
    fi

    # Test reports endpoint (may require auth)
    if ! test_endpoint "$BASE_URL/reports/" 401 "Report service endpoint"; then
        return 1
    fi

    log_info "Report service tests: PASSED"
    return 0
}

# Test AI service
test_ai_service() {
    log_info "Testing AI service..."

    # Test health endpoint
    if ! test_endpoint "$BASE_URL/ai/health" 200 "AI service health"; then
        return 1
    fi

    # Test AI endpoint (may require auth)
    if ! test_endpoint "$BASE_URL/ai/analyze" 405 "AI service endpoint"; then
        return 1
    fi

    log_info "AI service tests: PASSED"
    return 0
}

# Test frontend
test_frontend() {
    log_info "Testing frontend..."

    # Test main page
    if ! test_endpoint "$BASE_URL/" 200 "Frontend main page"; then
        return 1
    fi

    # Test static assets
    if ! test_endpoint "$BASE_URL/static/js/main.js" 200 "Frontend JavaScript"; then
        return 1
    fi

    log_info "Frontend tests: PASSED"
    return 0
}

# Test gateway/nginx
test_gateway() {
    log_info "Testing gateway..."

    # Test root endpoint
    if ! test_endpoint "$BASE_URL/" 200 "Gateway root"; then
        return 1
    fi

    # Test health endpoint
    if ! test_endpoint "$BASE_URL/health" 200 "Gateway health"; then
        return 1
    fi

    log_info "Gateway tests: PASSED"
    return 0
}

# Test response time
test_performance() {
    log_info "Testing response times..."

    local url=$1
    local max_time=${2:-5}
    local description=$3

    log_info "Testing $description response time (max ${max_time}s)"

    local response_time
    response_time=$(curl -s -w "%{time_total}" -m "$TIMEOUT" "$url" -o /dev/null 2>/dev/null || echo "999")

    if (( $(echo "$response_time < $max_time" | bc -l 2>/dev/null || echo "0") )); then
        log_info "$description: PASSED (${response_time}s)"
        return 0
    else
        log_error "$description: FAILED (Response time: ${response_time}s, max: ${max_time}s)"
        return 1
    fi
}

# Main smoke test function
main() {
    log_info "Starting AIHealth smoke tests..."
    log_info "Base URL: $BASE_URL"

    check_dependencies

    local failed_tests=0

    # Basic connectivity tests
    if ! test_gateway; then
        ((failed_tests++))
    fi

    # Service tests
    if ! test_auth_flow; then
        ((failed_tests++))
    fi

    if ! test_report_service; then
        ((failed_tests++))
    fi

    if ! test_ai_service; then
        ((failed_tests++))
    fi

    if ! test_frontend; then
        ((failed_tests++))
    fi

    # Performance tests
    if ! test_performance "$BASE_URL/health" 2 "Health endpoint"; then
        ((failed_tests++))
    fi

    if ! test_performance "$BASE_URL/" 3 "Main page"; then
        ((failed_tests++))
    fi

    # Summary
    echo
    if [ $failed_tests -eq 0 ]; then
        log_info "All smoke tests passed! ✅"
        log_info "Application is ready for production use."
        exit 0
    else
        log_error "$failed_tests smoke test(s) failed! ❌"
        log_error "Please check the application deployment and configuration."
        exit 1
    fi
}

# Show usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "AIHealth Smoke Tests"
    echo
    echo "Options:"
    echo "  -u, --url URL       Base URL for testing (default: http://localhost:9000)"
    echo "  -h, --help          Show this help message"
    echo
    echo "Examples:"
    echo "  $0"
    echo "  $0 --url https://staging.aihealth.com"
    echo "  $0 -u http://localhost:9000"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -u|--url)
            BASE_URL="$2"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Run main function
main "$@"