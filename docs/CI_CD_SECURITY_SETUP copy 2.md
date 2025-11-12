# CI/CD & Security Setup Guide

## Overview

This document provides setup instructions for the Continuous Integration/Continuous Deployment (CI/CD) pipeline and automated penetration testing workflows.

## Table of Contents

1. [CI/CD Pipeline](#cicd-pipeline)
2. [Security & Penetration Testing](#security--penetration-testing)
3. [GitHub Secrets Configuration](#github-secrets-configuration)
4. [Local Testing](#local-testing)
5. [Deployment Strategies](#deployment-strategies)

## CI/CD Pipeline

### Workflow: `.github/workflows/ci-cd.yml`

#### Pipeline Stages

1. **Test Microservices** (Parallel)
   - Runs for each service: auth, user, product, inventory, order, gateway
   - Linting, testing, and building
   - Uses pnpm for fast package management

2. **Test Client**
   - Next.js linting and building
   - Ensures client builds successfully

3. **Security Scan**
   - Trivy filesystem vulnerability scan
   - npm audit for all services
   - Uploads results to GitHub Security tab

4. **Build Docker Images** (Parallel)
   - Builds images for all services
   - Pushes to Docker Hub (on master/main branch)
   - Uses Docker layer caching for speed

5. **Integration Tests**
   - Starts all services with docker-compose
   - Health checks for critical services
   - API integration tests

6. **Deploy to Staging** (develop branch only)
   - Automated deployment to staging environment

7. **Deploy to Production** (master/main branch only)
   - Manual approval required (GitHub Environments)
   - Automated deployment to production
   - Rollback capabilities

### Trigger Conditions

```yaml
# Runs on:
- Push to master, main, or develop branches
- Pull requests to master, main, or develop branches
```

### Pipeline Features

- ✅ Parallel job execution for speed
- ✅ Docker layer caching
- ✅ Fail-fast on errors
- ✅ Artifact uploads for reports
- ✅ Security scanning integration
- ✅ Environment-based deployments

## Security & Penetration Testing

### Workflow: `.github/workflows/penetration-testing.yml`

#### Testing Jobs

1. **OWASP ZAP Scan**
   - Baseline scan (quick passive scan)
   - Full scan (active vulnerability testing)
   - API scan (OpenAPI/Swagger based)
   - Generates HTML, JSON, and Markdown reports

2. **SQL Injection Testing**
   - Uses sqlmap for automated SQL injection detection
   - Tests all input endpoints
   - Generates detailed vulnerability reports

3. **XSS Vulnerability Scan**
   - Uses XSStrike for XSS detection
   - Tests reflected, stored, and DOM-based XSS
   - Crawls application for vulnerabilities

4. **Dependency Vulnerability Scan**
   - Snyk security scanning
   - Checks all dependencies
   - Severity threshold: HIGH

5. **Container Security Scan**
   - Trivy container image scanning
   - Scans all Docker images
   - Uploads to GitHub Security (SARIF format)

6. **API Security Testing**
   - Newman/Postman collection runner
   - Tests CORS, rate limiting, authentication
   - SQL injection and authentication bypass tests

7. **Authentication Penetration Test**
   - JWT token security testing
   - Session management testing
   - Password policy validation

8. **Security Report Generation**
   - Consolidates all test results
   - Generates comprehensive security report
   - Posts summary on pull requests

### Trigger Conditions

```yaml
# Runs on:
- Weekly schedule (Sundays at 2 AM UTC)
- Manual workflow dispatch
```

### OWASP ZAP Configuration

Custom rules file: `.zap/rules.tsv`

```tsv
# Thresholds: OFF, INFO, LOW, MEDIUM, HIGH
# Example:
10015	OFF	  # Re-examine Cache-control Directives
10021	INFO	# X-Content-Type-Options Header Missing
40018	PASS	# SQL Injection
```

## GitHub Secrets Configuration

### Required Secrets

Navigate to: `Settings > Secrets and variables > Actions`

Add the following secrets:

#### Docker Hub Credentials

```
DOCKER_USERNAME=your_dockerhub_username
DOCKER_PASSWORD=your_dockerhub_password_or_token
```

**How to get Docker Hub token:**
```bash
# 1. Login to hub.docker.com
# 2. Go to Account Settings > Security
# 3. Create New Access Token
# 4. Copy token to DOCKER_PASSWORD secret
```

#### Snyk Token (Optional but recommended)

```
SNYK_TOKEN=your_snyk_api_token
```

**How to get Snyk token:**
```bash
# 1. Sign up at snyk.io
# 2. Go to Account Settings
# 3. Copy API token
```

#### Deployment Secrets (If deploying to cloud)

For AWS:
```
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
```

For Kubernetes:
```
KUBE_CONFIG=your_base64_encoded_kubeconfig
```

### GitHub Environments

Create environments for staged deployments:

#### Staging Environment

```bash
# Settings > Environments > New environment
Name: staging
Protection rules:
  - Wait timer: 0 minutes
  - Required reviewers: (optional)
Environment secrets:
  - STAGING_URL=https://staging.yourdomain.com
```

#### Production Environment

```bash
# Settings > Environments > New environment
Name: production
Protection rules:
  - Required reviewers: 1+ (RECOMMENDED)
  - Wait timer: 15 minutes (optional)
Environment secrets:
  - PRODUCTION_URL=https://yourdomain.com
```

## Local Testing

### Test CI/CD Pipeline Locally

Use [act](https://github.com/nektos/act) to test GitHub Actions locally:

```bash
# Install act
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Run workflow
act -j test                    # Run test job
act -j build                   # Run build job
act -j integration-test        # Run integration tests

# With secrets
act -j build --secret-file .secrets
```

### Test Security Scans Locally

#### OWASP ZAP

```bash
# Pull ZAP Docker image
docker pull owasp/zap2docker-stable

# Run baseline scan
docker run -t owasp/zap2docker-stable \
  zap-baseline.py -t http://host.docker.internal:3000

# Run full scan
docker run -t owasp/zap2docker-stable \
  zap-full-scan.py -t http://host.docker.internal:3000
```

#### Trivy Scan

```bash
# Install Trivy
sudo apt-get install trivy

# Scan filesystem
trivy fs .

# Scan Docker image
trivy image ecom-auth-service:latest
trivy image ecom-client:latest
```

#### npm Audit

```bash
# Audit all services
cd services/auth && pnpm audit
cd services/product && pnpm audit
cd services/order && pnpm audit
cd client && pnpm audit

# Fix vulnerabilities
pnpm audit fix
```

#### Snyk

```bash
# Install Snyk CLI
npm install -g snyk

# Authenticate
snyk auth

# Test project
snyk test

# Test all projects
snyk test --all-projects

# Monitor for new vulnerabilities
snyk monitor
```

## Deployment Strategies

### Strategy 1: Docker Compose (Development/Staging)

```bash
# Build and deploy
docker-compose build
docker-compose up -d

# Health check
curl http://localhost:3008/health
```

### Strategy 2: Kubernetes (Production)

```bash
# Create Kubernetes manifests
kubectl create namespace ecommerce

# Deploy services
kubectl apply -f k8s/

# Check deployments
kubectl get pods -n ecommerce
kubectl get services -n ecommerce

# Rollout updates
kubectl rollout restart deployment/auth-service -n ecommerce
kubectl rollout status deployment/auth-service -n ecommerce

# Rollback if needed
kubectl rollout undo deployment/auth-service -n ecommerce
```

### Strategy 3: Cloud Platforms

#### AWS ECS

```bash
# Build and push images
docker build -t your-registry/ecom-auth:latest ./services/auth
docker push your-registry/ecom-auth:latest

# Update ECS service
aws ecs update-service \
  --cluster ecommerce-cluster \
  --service auth-service \
  --force-new-deployment
```

#### Google Cloud Run

```bash
# Deploy service
gcloud run deploy auth-service \
  --image gcr.io/your-project/ecom-auth:latest \
  --platform managed \
  --region us-central1
```

## Monitoring & Alerts

### GitHub Actions Notifications

#### Slack Integration

```yaml
# Add to workflow
- name: Slack Notification
  uses: rtCamp/action-slack-notify@v2
  env:
    SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK }}
    SLACK_MESSAGE: 'Deployment completed!'
```

#### Discord Integration

```yaml
- name: Discord Notification
  uses: sarisia/actions-status-discord@v1
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
```

### Security Alerts

Enable GitHub Security features:

1. **Dependabot Alerts**
   - Settings > Security & analysis
   - Enable Dependabot alerts
   - Enable Dependabot security updates

2. **Code Scanning**
   - Security > Code scanning
   - Set up CodeQL analysis
   - Review alerts regularly

3. **Secret Scanning**
   - Automatically enabled for public repos
   - Enable for private repos in Settings

## Best Practices

### CI/CD

1. **Keep builds fast**
   - Use caching effectively
   - Parallelize jobs
   - Optimize Docker layers

2. **Fail fast**
   - Run quick tests first
   - Use fail-fast strategy
   - Cancel redundant workflows

3. **Security first**
   - Scan on every PR
   - Block merges on vulnerabilities
   - Regular security updates

4. **Environment parity**
   - Use same images for staging/production
   - Match environment variables
   - Test in staging first

### Security Testing

1. **Regular scans**
   - Weekly automated scans
   - Before each release
   - After dependency updates

2. **Prioritize fixes**
   - Critical/High: Immediate fix
   - Medium: Fix within sprint
   - Low: Fix when convenient

3. **Monitor continuously**
   - Set up runtime monitoring
   - Log security events
   - Review logs regularly

4. **Stay updated**
   - Update dependencies weekly
   - Subscribe to security advisories
   - Follow OWASP guidelines

## Troubleshooting

### Common Issues

#### 1. Workflow fails on test job

```bash
# Check logs
gh run view --log-failed

# Test locally
cd services/auth
pnpm install
pnpm run test
```

#### 2. Docker build fails

```bash
# Check Dockerfile
docker build -t test ./services/auth --no-cache

# Check build logs
docker-compose build auth-service
```

#### 3. Security scan false positives

```bash
# Update ZAP rules
# Edit .zap/rules.tsv
# Set specific rule to OFF or INFO

# Ignore specific vulnerabilities
# Create .snyk file with ignores
```

#### 4. Deployment fails

```bash
# Check environment variables
env | grep API

# Check service health
docker-compose ps
docker-compose logs auth-service

# Rollback
git revert HEAD
git push origin master
```

## Support

For issues with CI/CD or security setup:

- **CI/CD Issues**: Open issue with `cicd` label
- **Security Issues**: Email security@yourdomain.com
- **General Questions**: Create discussion in GitHub

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [OWASP ZAP Documentation](https://www.zaproxy.org/docs/)
- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)
- [Kubernetes Security](https://kubernetes.io/docs/concepts/security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**Last Updated:** 2025-11-12
**Version:** 1.0.0
