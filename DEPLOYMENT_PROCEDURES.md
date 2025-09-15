# ClassBoard Deployment Procedures

## Overview

This document provides comprehensive deployment procedures for the ClassBoard application, covering both frontend and backend deployment to production environments.

## Prerequisites

### System Requirements
- Node.js 18+ 
- PostgreSQL 14+
- AWS Account (for production deployment)
- Docker (optional, for containerized deployment)

### Required Tools
- AWS CLI configured with appropriate permissions
- Terraform (for infrastructure as code)
- Git for version control
- npm/yarn for package management

## Environment Setup

### Development Environment
1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd classboard
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run db:migrate
   npm run db:seed
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd ../
   npm install
   cp .env.example .env.local
   # Edit .env.local with your configuration
   npm run dev
   ```

### Production Environment Variables

#### Backend (.env)
```bash
# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration
DATABASE_URL="postgresql://username:password@host:5432/classboard_prod"

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key

# AWS S3 Configuration
S3_BUCKET_NAME=classboard-files-prod
S3_REGION=us-east-1

# AWS Cognito Configuration
COGNITO_USER_POOL_ID=your-cognito-user-pool-id
COGNITO_CLIENT_ID=your-cognito-client-id
COGNITO_REGION=us-east-1

# AWS RDS Configuration
RDS_HOST=your-rds-endpoint.region.rds.amazonaws.com
RDS_USERNAME=your-db-username
RDS_PASSWORD=your-db-password

# CORS Configuration
FRONTEND_URL=https://your-frontend-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Performance Monitoring
ENABLE_PERFORMANCE_MONITORING=true
PERFORMANCE_LOG_SLOW_QUERIES=true
SLOW_QUERY_THRESHOLD_MS=500
```

#### Frontend (.env.local)
```bash
VITE_API_BASE_URL=https://your-api-domain.com/api
```

## Deployment Methods

### Method 1: AWS Infrastructure (Recommended)

#### 1. Infrastructure Setup with Terraform

```bash
cd backend/aws/terraform

# Initialize Terraform
terraform init

# Plan deployment
terraform plan -var-file="environments/production.tfvars"

# Apply infrastructure
terraform apply -var-file="environments/production.tfvars"
```

#### 2. Database Setup

```bash
# Connect to RDS instance
psql -h your-rds-endpoint.region.rds.amazonaws.com -U username -d classboard_prod

# Run migrations
cd backend
npm run db:migrate
npm run db:migrate-data  # Migrate existing data if needed
```

#### 3. Backend Deployment

**Option A: AWS Lambda (Serverless)**
```bash
cd backend/lambda
./deploy.sh production
```

**Option B: AWS ECS (Containerized)**
```bash
# Build Docker image
docker build -t classboard-backend .

# Tag for ECR
docker tag classboard-backend:latest your-account.dkr.ecr.region.amazonaws.com/classboard-backend:latest

# Push to ECR
docker push your-account.dkr.ecr.region.amazonaws.com/classboard-backend:latest

# Deploy to ECS
aws ecs update-service --cluster classboard-cluster --service classboard-backend --force-new-deployment
```

#### 4. Frontend Deployment

**AWS S3 + CloudFront**
```bash
# Build frontend
npm run build

# Deploy to S3
aws s3 sync dist/ s3://your-frontend-bucket --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

### Method 2: Traditional Server Deployment

#### 1. Server Setup

```bash
# Install Node.js and PostgreSQL on your server
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql postgresql-contrib

# Create database
sudo -u postgres createdb classboard_prod
sudo -u postgres createuser classboard_user
sudo -u postgres psql -c "ALTER USER classboard_user PASSWORD 'secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE classboard_prod TO classboard_user;"
```

#### 2. Application Deployment

```bash
# Clone and setup application
git clone <repository-url> /var/www/classboard
cd /var/www/classboard

# Backend setup
cd backend
npm ci --production
npm run build
npm run db:migrate

# Frontend setup
cd ../
npm ci
npm run build

# Setup process manager (PM2)
npm install -g pm2
pm2 start backend/dist/server.js --name "classboard-api"
pm2 startup
pm2 save
```

#### 3. Reverse Proxy Setup (Nginx)

```nginx
# /etc/nginx/sites-available/classboard
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/classboard/dist;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Method 3: Docker Deployment

#### 1. Docker Compose Setup

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: classboard_prod
      POSTGRES_USER: classboard_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://classboard_user:secure_password@postgres:5432/classboard_prod
    ports:
      - "3001:3001"
    depends_on:
      - postgres

  frontend:
    build: .
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

#### 2. Deploy with Docker

```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker-compose exec backend npm run db:migrate
```

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing (`npm run test:comprehensive`)
- [ ] Code linting passed (`npm run lint`)
- [ ] Security audit passed (`npm audit`)
- [ ] Performance tests passed
- [ ] Code review completed

### Configuration
- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] AWS services configured
- [ ] SSL certificates installed
- [ ] Domain DNS configured

### Security
- [ ] JWT secrets are secure and unique
- [ ] Database credentials are secure
- [ ] AWS IAM roles have minimal permissions
- [ ] CORS settings are restrictive
- [ ] Rate limiting configured
- [ ] Security headers configured

### Performance
- [ ] Database indexes optimized
- [ ] Caching configured
- [ ] CDN configured for static assets
- [ ] Image optimization completed
- [ ] Bundle size optimized

## Post-Deployment Verification

### Health Checks
```bash
# API Health Check
curl https://your-api-domain.com/api/health

# Frontend Check
curl https://your-frontend-domain.com

# Database Connection Check
curl https://your-api-domain.com/api/students
```

### Monitoring Setup
1. **Application Monitoring**
   - Set up CloudWatch alarms
   - Configure error tracking
   - Monitor response times
   - Track database performance

2. **Log Monitoring**
   - Centralized logging setup
   - Error log alerts
   - Performance log analysis

3. **Security Monitoring**
   - Failed authentication alerts
   - Unusual traffic patterns
   - Security scan results

## Rollback Procedures

### Database Rollback
```bash
# Create backup before deployment
npm run db:backup

# Rollback if needed
npm run db:rollback -- backup-id
```

### Application Rollback
```bash
# AWS Lambda
aws lambda update-function-code --function-name classboard-api --s3-bucket your-bucket --s3-key previous-version.zip

# ECS
aws ecs update-service --cluster classboard-cluster --service classboard-backend --task-definition previous-task-definition

# Traditional Server
pm2 stop classboard-api
git checkout previous-commit
npm run build
pm2 start classboard-api
```

### Frontend Rollback
```bash
# S3 + CloudFront
aws s3 sync previous-build/ s3://your-frontend-bucket --delete
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## Maintenance Procedures

### Regular Maintenance
- **Daily**: Monitor logs and performance metrics
- **Weekly**: Review security alerts and update dependencies
- **Monthly**: Database maintenance and optimization
- **Quarterly**: Security audit and penetration testing

### Database Maintenance
```bash
# Backup database
npm run db:backup

# Optimize database
npm run db:optimize

# Update statistics
npm run db:analyze
```

### Security Updates
```bash
# Update dependencies
npm audit fix
npm update

# Security scan
npm run security:scan

# Update Docker images
docker pull postgres:14
docker-compose up -d postgres
```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Check connection string
   - Verify network connectivity
   - Check database credentials
   - Review firewall settings

2. **Authentication Issues**
   - Verify JWT secret configuration
   - Check token expiration settings
   - Review CORS configuration

3. **Performance Issues**
   - Check database query performance
   - Review caching configuration
   - Monitor memory usage
   - Analyze slow requests

4. **File Upload Issues**
   - Verify S3 bucket permissions
   - Check file size limits
   - Review security scanning configuration

### Emergency Contacts
- **DevOps Team**: devops@company.com
- **Database Admin**: dba@company.com
- **Security Team**: security@company.com

## Documentation Links
- [API Documentation](backend/API_DOCUMENTATION.md)
- [AWS Infrastructure Guide](backend/aws/README.md)
- [Database Schema](backend/DATABASE.md)
- [Security Implementation](backend/SECURITY_IMPLEMENTATION.md)
- [Testing Guide](backend/TESTING.md)

## Version History
- **v1.0.0**: Initial production deployment
- **v1.1.0**: Added performance monitoring
- **v1.2.0**: Enhanced security features
- **v1.3.0**: Migration to production database completed