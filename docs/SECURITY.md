# Security Policy & Penetration Testing Guide

## Overview

This document outlines the security measures, penetration testing procedures, and vulnerability management for the E-commerce Microservices Application.

## Table of Contents

1. [Security Architecture](#security-architecture)
2. [Automated Security Testing](#automated-security-testing)
3. [Manual Penetration Testing](#manual-penetration-testing)
4. [Vulnerability Reporting](#vulnerability-reporting)
5. [Security Best Practices](#security-best-practices)

## Security Architecture

### 1. Authentication & Authorization
- **JWT-based authentication** with HTTP-only cookies
- **Session management** with Redis for distributed session storage
- **Role-based access control (RBAC)** for admin and user roles
- **Password hashing** using bcrypt with salt rounds
- **Session expiration**: 24 hours

### 2. API Security
- **API Gateway** as single entry point
- **Rate limiting** on all endpoints
- **CORS configuration** to prevent cross-origin attacks
- **Input validation** using class-validator
- **Request sanitization** to prevent injection attacks

### 3. Data Protection
- **MongoDB** with authentication enabled
- **Redis** with password protection
- **Environment variables** for sensitive configuration
- **No sensitive data** in logs or error messages

### 4. Infrastructure Security
- **Docker containers** with non-root users
- **Network isolation** using Docker networks
- **Health checks** for all services
- **Graceful shutdown** handling

## Automated Security Testing

### CI/CD Security Pipeline

Our GitHub Actions workflows include:

#### 1. **Continuous Testing** (`.github/workflows/ci-cd.yml`)
- Linting and code quality checks
- Unit and integration tests
- Dependency vulnerability scanning
- Docker image security scanning

#### 2. **Penetration Testing** (`.github/workflows/penetration-testing.yml`)
- **OWASP ZAP** scanning (baseline, full, and API scans)
- **SQL Injection** testing with sqlmap
- **XSS vulnerability** scanning with XSStrike
- **Dependency scanning** with Snyk
- **Container scanning** with Trivy
- **API security** testing with Newman/Postman
- **Authentication** penetration testing

### Running Automated Tests

```bash
# Trigger penetration testing workflow manually
gh workflow run penetration-testing.yml

# Or wait for scheduled weekly run (Sundays at 2 AM UTC)
```

## Manual Penetration Testing

### Prerequisites

```bash
# Install required tools
sudo apt-get update
sudo apt-get install -y nmap nikto sqlmap zaproxy

# Install Node.js tools
npm install -g newman
```

### 1. Information Gathering

```bash
# Scan open ports
nmap -sV -sC localhost -p 3000-5003

# Check service headers
curl -I http://localhost:3008/health

# Check for common vulnerabilities
nikto -h http://localhost:3000
```

### 2. Authentication Testing

#### Test Cases:
- [ ] Weak password acceptance
- [ ] SQL injection in login form
- [ ] Session fixation
- [ ] Brute force protection
- [ ] JWT token manipulation
- [ ] Session timeout

```bash
# Test SQL injection in login
curl -X POST http://localhost:3008/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin'\'' OR '\''1'\''='\''1","password":"anything"}'

# Test XSS in product search
curl "http://localhost:3008/product/products?search=<script>alert('XSS')</script>"

# Test JWT manipulation
# 1. Login and get JWT token
TOKEN=$(curl -X POST http://localhost:3008/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' \
  -c cookies.txt | jq -r '.token')

# 2. Try to access protected resources
curl http://localhost:3008/order/orders \
  -H "Authorization: Bearer $TOKEN"
```

### 3. API Security Testing

```bash
# Test CORS
curl -X OPTIONS http://localhost:3008/auth/login \
  -H "Origin: https://malicious-site.com" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Test rate limiting
for i in {1..100}; do
  curl -X POST http://localhost:3008/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' &
done

# Test input validation
curl -X POST http://localhost:3008/product/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"<script>alert(1)</script>","price":"not_a_number"}'
```

### 4. SQL Injection Testing

```bash
# Automated SQL injection testing
sqlmap -u "http://localhost:3008/product/products?search=laptop" \
  --batch --level=5 --risk=3 \
  --dbms=mongodb \
  --technique=BEUSTQ

# Test NoSQL injection (MongoDB)
curl "http://localhost:3008/product/products?category[\$ne]=null"
curl -X POST http://localhost:3008/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":{"$ne":null},"password":{"$ne":null}}'
```

### 5. XSS Testing

```bash
# Reflected XSS
curl "http://localhost:3008/product/products?search=<img src=x onerror=alert(1)>"

# DOM-based XSS
curl "http://localhost:3000/#<img src=x onerror=alert(1)>"

# Stored XSS (if product description allows)
curl -X POST http://localhost:3008/product/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name":"Test","price":100,"description":"<script>alert(1)</script>"}'
```

### 6. CSRF Testing

```bash
# Check for CSRF tokens
curl http://localhost:3000 | grep -i csrf

# Test state-changing operations without CSRF token
curl -X POST http://localhost:3008/order/orders \
  -H "Content-Type: application/json" \
  -H "Origin: https://attacker.com" \
  -d '{"items":[{"sku":"SKU-001","quantity":1}]}'
```

### 7. Business Logic Testing

Test Cases:
- [ ] Negative prices in products
- [ ] Negative quantities in orders
- [ ] Price manipulation in checkout
- [ ] Inventory bypass
- [ ] Order status manipulation

```bash
# Test negative quantities
curl -X POST http://localhost:3008/order/orders \
  -H "Content-Type: application/json" \
  -H "Cookie: session_id=$SESSION" \
  -d '{"items":[{"sku":"SKU-001","quantity":-1,"unitPrice":100}]}'

# Test price manipulation
curl -X POST http://localhost:3008/order/orders \
  -H "Content-Type: application/json" \
  -H "Cookie: session_id=$SESSION" \
  -d '{"items":[{"sku":"SKU-001","quantity":1,"unitPrice":0.01}]}'
```

### 8. Container Security Testing

```bash
# Scan Docker images for vulnerabilities
trivy image ecom-auth-service:latest
trivy image ecom-product-service:latest
trivy image ecom-order-service:latest
trivy image ecom-client:latest

# Check for root user in containers
docker inspect ecom-auth-service | jq '.[0].Config.User'

# Check exposed ports
docker inspect ecom-mongo | jq '.[0].NetworkSettings.Ports'
```

## Vulnerability Reporting

### Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

### Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: **security@yourdomain.com**

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

**Expected Response Time:**
- Initial response: 48 hours
- Status update: 7 days
- Fix timeline: 30 days (for high/critical)

## Security Best Practices

### For Developers

1. **Never commit secrets**
   - Use `.env` files (gitignored)
   - Use environment variables
   - Use secret management tools (Vault, AWS Secrets Manager)

2. **Input Validation**
   - Always validate and sanitize user input
   - Use DTOs with class-validator
   - Implement whitelist validation

3. **Authentication**
   - Never store passwords in plain text
   - Use strong password policies
   - Implement rate limiting on auth endpoints
   - Use secure session management

4. **API Security**
   - Implement proper CORS policies
   - Use HTTPS in production
   - Validate content-type headers
   - Implement request size limits

5. **Error Handling**
   - Never expose stack traces to users
   - Log errors securely
   - Use generic error messages

6. **Dependencies**
   - Regularly update dependencies
   - Run `npm audit` before releases
   - Use tools like Snyk or Dependabot

### For DevOps

1. **Container Security**
   - Use official base images
   - Run containers as non-root
   - Scan images regularly
   - Keep images updated

2. **Network Security**
   - Use private networks for services
   - Expose only necessary ports
   - Implement firewall rules
   - Use TLS for inter-service communication

3. **Monitoring**
   - Implement security logging
   - Set up intrusion detection
   - Monitor for unusual patterns
   - Set up alerts for security events

4. **Backup & Recovery**
   - Regular database backups
   - Test recovery procedures
   - Encrypt backups
   - Store backups securely

## Security Checklist

### Before Production Deployment

- [ ] All dependencies updated and audited
- [ ] Environment variables secured
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] SQL/NoSQL injection protection verified
- [ ] XSS protection verified
- [ ] CSRF protection implemented
- [ ] Authentication flows tested
- [ ] Authorization checks verified
- [ ] Error handling doesn't leak information
- [ ] Logging doesn't contain sensitive data
- [ ] Containers run as non-root users
- [ ] Security headers configured
- [ ] Penetration testing completed
- [ ] Vulnerability scan passed
- [ ] Backup and recovery tested

## Tools & Resources

### Security Testing Tools
- **OWASP ZAP**: Web application security scanner
- **Burp Suite**: Web vulnerability scanner
- **sqlmap**: SQL injection testing
- **XSStrike**: XSS detection suite
- **Trivy**: Container vulnerability scanner
- **Snyk**: Dependency vulnerability scanner
- **Newman**: API security testing

### Security Resources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

## Contact

For security concerns, contact:
- Email: security@yourdomain.com
- Security Team: security-team@yourdomain.com

---

**Last Updated:** 2025-11-12
**Version:** 1.0.0
