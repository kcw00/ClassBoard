# ClassBoard Deployment Guide

This comprehensive guide covers deploying ClassBoard to various environments, from local development to production AWS infrastructure.

## 🎯 Deployment Overview

ClassBoard supports multiple deployment strategies:

1. **Local Development**: Full stack running locally
2. **Staging Environment**: AWS infrastructure for testing
3. **Production Environment**: Full AWS production setup
4. **Hybrid Deployment**: Frontend on Vercel, Backend on AWS

## 🏗️ Architecture Overview

### Production Architecture
```
Internet → CloudFront → S3 (Frontend)
         → ALB → ECS/Lambda (Backend)
         → RDS PostgreSQL (Database)
         → S3 (File Storage)
         → Cognito (Authentication)
```

### Infrastructure Components
- **Frontend**: React app served via CloudFront + S3 or Vercel
- **Backend**: Node.js API on AWS Lambda or ECS
- **Database**: RDS PostgreSQL with Multi-AZ
- **File Storage**: S3 with CloudFront CDN
- **Authentication**: AWS Cognito User Pools
- **Monitoring**: CloudWatch with custom dashboards
- **Infrastructure**: Terraform for IaC

## 🚀 Quick Deployment Options

### Option 1: Simple AWS Deployment

```bash
# Deploy with simple AWS setup
./deploy-simple-aws.sh

# This script:
# 1. Deploys Terraform infrastructure
# 2. Builds and deploys backend
# 3. Builds and deploys frontend to S3
# 4. Configures CloudFront distribution
```

### Option 2: Hybrid Deployment (Recommended)

```bash
# Deploy backend to AWS
cd backend/aws
./deploy-production.sh

# Deploy frontend to Vercel
./deploy-frontend.sh
```

### Option 3: Full AWS Deployment

```bash
# Deploy complete infrastructure
cd backend/aws/terraform
terraform apply -var-file="environments/production.tfvars"

# Deploy applications
cd ../
./deploy-production.sh
```

## 🔧 Prerequisites

### Required Tools
- **Node.js** 18+
- **AWS CLI** configured with appropriate permissions
- **Terraform** 1.0+
- **Docker** (for containerized deployments)
- **Git** for version control

### AWS Permissions
Your AWS user/role needs permissions for:
- EC2, VPC, Security Groups
- RDS (PostgreSQL)
- S3, CloudFront
- Cognito
- Lambda, API Gateway
- IAM (for service roles)
- CloudWatch (for monitoring)

### Environment Variables
```bash
# AWS Configuration
export AWS_REGION=us-east-1
export AWS_PROFILE=classboard-deploy

# Application Configuration
export DOMAIN_NAME=classboard.app
export ENVIRONMENT=production
export DB_PASSWORD=your-secure-password
```

## 🌍 Environment Setup

### Development Environment

```bash
# Clone repository
git clone <repository-url>
cd classboard

# Install dependencies
npm install
cd backend && npm install && cd ..

# Set up environment variables
cp .env.example .env.local
cp backend/.env.example backend/.env

# Set up database
cd backend
npm run db:migrate
npm run db:seed

# Start development servers
npm run dev          # Frontend (port 5173)
cd backend && npm run dev  # Backend (port 3001)
```

### Staging Environment

```bash
# Deploy staging infrastructure
cd backend/aws/terraform
terraform workspace select staging
terraform apply -var-file="environments/staging.tfvars"

# Deploy applications
cd ../
./deploy.sh staging

# Verify deployment
curl https://api-staging.classboard.app/api/health
```

### Production Environment

```bash
# Deploy production infrastructure
cd backend/aws/terraform
terraform workspace select production
terraform apply -var-file="environments/production.tfvars"

# Deploy applications
cd ../
./deploy-production.sh

# Verify deployment
curl https://api.classboard.app/api/health
```

## 🏗️ Infrastructure Deployment

### Terraform Infrastructure

**Initialize Terraform:**
```bash
cd backend/aws/terraform
terraform init
```

**Plan Deployment:**
```bash
# Development
terraform plan -var-file="environments/development.tfvars"

# Staging
terraform plan -var-file="environments/staging.tfvars"

# Production
terraform plan -var-file="environments/production.tfvars"
```

**Apply Infrastructure:**
```bash
# Apply with confirmation
terraform apply -var-file="environments/production.tfvars"

# Apply without confirmation (CI/CD)
terraform apply -var-file="environments/production.tfvars" -auto-approve
```

### Infrastructure Components

**VPC and Networking:**
```hcl
# VPC with public and private subnets
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
}

# Public subnets for ALB
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 10}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
}

# Private subnets for RDS
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
}
```

**RDS Database:**
```hcl
resource "aws_db_instance" "main" {
  identifier     = "${var.project_name}-${var.environment}-db"
  engine         = "postgres"
  engine_version = "14.9"
  instance_class = var.db_instance_class
  
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_encrypted     = true
  
  db_name  = "classboard"
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = var.db_backup_retention_period
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  multi_az               = var.db_multi_az
  publicly_accessible    = false
  
  performance_insights_enabled          = true
  performance_insights_retention_period = var.db_performance_insights_retention
  
  skip_final_snapshot = var.environment != "production"
  
  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment}-db"
  })
}
```

**S3 and CloudFront:**
```hcl
# S3 bucket for file storage
resource "aws_s3_bucket" "files" {
  bucket = "${var.project_name}-${var.environment}-files"
  
  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment}-files"
  })
}

# CloudFront distribution
resource "aws_cloudfront_distribution" "files" {
  origin {
    domain_name = aws_s3_bucket.files.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.files.bucket}"
    
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.files.cloudfront_access_identity_path
    }
  }
  
  enabled = true
  
  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.files.bucket}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
    
    cache_policy_id = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # Managed-CachingOptimized
  }
  
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  viewer_certificate {
    cloudfront_default_certificate = true
  }
  
  tags = var.common_tags
}
```

## 🚀 Application Deployment

### Backend Deployment

**Lambda Deployment:**
```bash
cd backend

# Build application
npm run build

# Package for Lambda
zip -r classboard-api.zip dist/ node_modules/ package.json

# Deploy to Lambda
aws lambda update-function-code \
  --function-name classboard-api-production \
  --zip-file fileb://classboard-api.zip

# Update environment variables
aws lambda update-function-configuration \
  --function-name classboard-api-production \
  --environment Variables="{
    DATABASE_URL=$DATABASE_URL,
    JWT_SECRET=$JWT_SECRET,
    AWS_REGION=$AWS_REGION
  }"
```

**Container Deployment (ECS):**
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY dist/ ./dist/
COPY prisma/ ./prisma/

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3001

CMD ["node", "dist/server.js"]
```

```bash
# Build and push Docker image
docker build -t classboard-api:latest .
docker tag classboard-api:latest $ECR_REPOSITORY:latest
docker push $ECR_REPOSITORY:latest

# Update ECS service
aws ecs update-service \
  --cluster classboard-production \
  --service classboard-api \
  --force-new-deployment
```

### Frontend Deployment

**S3 + CloudFront Deployment:**
```bash
# Build frontend
npm run build

# Deploy to S3
aws s3 sync dist/ s3://classboard-production-frontend --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
  --paths "/*"
```

**Vercel Deployment:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod

# Configure environment variables
vercel env add VITE_API_BASE_URL production
vercel env add VITE_AWS_REGION production
```

### Database Migration

```bash
cd backend

# Run migrations
npm run db:migrate

# Seed production data (if needed)
npm run db:seed:production

# Verify database
npm run db:status
```

## 🔧 Configuration Management

### Environment Variables

**Backend (.env):**
```env
# Database
DATABASE_URL=postgresql://username:password@host:5432/classboard

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# S3 Configuration
S3_BUCKET_NAME=classboard-production-files
CLOUDFRONT_DOMAIN=d123456789.cloudfront.net

# Cognito Configuration
COGNITO_USER_POOL_ID=us-east-1_abcdefghi
COGNITO_CLIENT_ID=1234567890abcdefghijklmnop

# Application
JWT_SECRET=your-jwt-secret
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://classboard.app
```

**Frontend (.env.production):**
```env
VITE_API_BASE_URL=https://api.classboard.app/api
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=us-east-1_abcdefghi
VITE_COGNITO_CLIENT_ID=1234567890abcdefghijklmnop
VITE_CLOUDFRONT_DOMAIN=d123456789.cloudfront.net
```

### Secrets Management

**AWS Secrets Manager:**
```bash
# Store database password
aws secretsmanager create-secret \
  --name "classboard/production/db-password" \
  --description "Database password for ClassBoard production" \
  --secret-string "your-secure-password"

# Store JWT secret
aws secretsmanager create-secret \
  --name "classboard/production/jwt-secret" \
  --description "JWT secret for ClassBoard production" \
  --secret-string "your-jwt-secret"
```

**Retrieve secrets in application:**
```typescript
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager"

const client = new SecretsManagerClient({ region: process.env.AWS_REGION })

export async function getSecret(secretName: string): Promise<string> {
  try {
    const command = new GetSecretValueCommand({ SecretId: secretName })
    const response = await client.send(command)
    return response.SecretString || ''
  } catch (error) {
    console.error(`Error retrieving secret ${secretName}:`, error)
    throw error
  }
}
```

## 📊 Monitoring and Logging

### CloudWatch Setup

**Custom Metrics:**
```typescript
import { CloudWatchClient, PutMetricDataCommand } from "@aws-sdk/client-cloudwatch"

const cloudwatch = new CloudWatchClient({ region: process.env.AWS_REGION })

export async function putMetric(metricName: string, value: number, unit: string = 'Count') {
  const params = {
    Namespace: 'ClassBoard/API',
    MetricData: [
      {
        MetricName: metricName,
        Value: value,
        Unit: unit,
        Timestamp: new Date()
      }
    ]
  }

  try {
    await cloudwatch.send(new PutMetricDataCommand(params))
  } catch (error) {
    console.error('Error putting metric:', error)
  }
}
```

**Log Groups:**
```bash
# Create log groups
aws logs create-log-group --log-group-name /aws/lambda/classboard-api-production
aws logs create-log-group --log-group-name /aws/ecs/classboard-api-production

# Set retention policy
aws logs put-retention-policy \
  --log-group-name /aws/lambda/classboard-api-production \
  --retention-in-days 30
```

### Health Checks

**Application Health Check:**
```typescript
// backend/src/routes/health.ts
export const healthCheck = async (req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV,
    services: {
      database: await checkDatabase(),
      s3: await checkS3(),
      cognito: await checkCognito()
    }
  }

  const isHealthy = Object.values(health.services).every(service => service.status === 'healthy')
  
  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    data: health
  })
}
```

**Load Balancer Health Check:**
```bash
# Configure ALB health check
aws elbv2 modify-target-group \
  --target-group-arn $TARGET_GROUP_ARN \
  --health-check-path /api/health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3
```

## 🔒 Security Configuration

### SSL/TLS Certificates

**ACM Certificate:**
```bash
# Request certificate
aws acm request-certificate \
  --domain-name classboard.app \
  --subject-alternative-names "*.classboard.app" \
  --validation-method DNS \
  --region us-east-1

# Validate certificate (add DNS records)
aws acm describe-certificate --certificate-arn $CERT_ARN
```

### Security Groups

**RDS Security Group:**
```hcl
resource "aws_security_group" "rds" {
  name_prefix = "${var.project_name}-${var.environment}-rds-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

**Application Security Group:**
```hcl
resource "aws_security_group" "app" {
  name_prefix = "${var.project_name}-${var.environment}-app-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      # Frontend tests
      - run: npm ci
      - run: npm run test:coverage
      
      # Backend tests
      - run: cd backend && npm ci
      - run: cd backend && npm run test:comprehensive

  deploy-infrastructure:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: 1.5.0
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Deploy infrastructure
        run: |
          cd backend/aws/terraform
          terraform init
          terraform plan -var-file="environments/production.tfvars"
          terraform apply -var-file="environments/production.tfvars" -auto-approve

  deploy-backend:
    needs: deploy-infrastructure
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Build backend
        run: |
          cd backend
          npm ci
          npm run build
      
      - name: Deploy to Lambda
        run: |
          cd backend
          zip -r classboard-api.zip dist/ node_modules/ package.json prisma/
          aws lambda update-function-code \
            --function-name classboard-api-production \
            --zip-file fileb://classboard-api.zip

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Build frontend
        run: |
          npm ci
          npm run build
        env:
          VITE_API_BASE_URL: https://api.classboard.app/api
          VITE_AWS_REGION: us-east-1
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## 🧪 Deployment Verification

### Automated Testing

```bash
# Health check
curl -f https://api.classboard.app/api/health || exit 1

# Authentication test
curl -X POST https://api.classboard.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  | jq '.success' | grep -q true || exit 1

# Database connectivity
curl -H "Authorization: Bearer $TOKEN" \
  https://api.classboard.app/api/classes \
  | jq '.success' | grep -q true || exit 1
```

### Smoke Tests

```typescript
// scripts/smoke-tests.ts
import axios from 'axios'

const API_BASE = process.env.API_BASE_URL || 'https://api.classboard.app/api'

async function runSmokeTests() {
  console.log('Running smoke tests...')

  // Health check
  const health = await axios.get(`${API_BASE}/health`)
  console.assert(health.data.success === true, 'Health check failed')

  // Authentication
  const auth = await axios.post(`${API_BASE}/auth/login`, {
    email: 'test@example.com',
    password: 'password123'
  })
  console.assert(auth.data.success === true, 'Authentication failed')

  const token = auth.data.data.tokens.accessToken

  // API endpoints
  const classes = await axios.get(`${API_BASE}/classes`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  console.assert(classes.data.success === true, 'Classes API failed')

  console.log('✅ All smoke tests passed')
}

runSmokeTests().catch(error => {
  console.error('❌ Smoke tests failed:', error.message)
  process.exit(1)
})
```

## 🔧 Troubleshooting

### Common Issues

**Database Connection Issues:**
```bash
# Check RDS status
aws rds describe-db-instances --db-instance-identifier classboard-production-db

# Test connection
psql -h $RDS_ENDPOINT -U $DB_USERNAME -d classboard -c "SELECT 1;"

# Check security groups
aws ec2 describe-security-groups --group-ids $RDS_SECURITY_GROUP_ID
```

**Lambda Function Issues:**
```bash
# Check function status
aws lambda get-function --function-name classboard-api-production

# View logs
aws logs tail /aws/lambda/classboard-api-production --follow

# Test function
aws lambda invoke \
  --function-name classboard-api-production \
  --payload '{"httpMethod":"GET","path":"/api/health"}' \
  response.json
```

**S3/CloudFront Issues:**
```bash
# Check S3 bucket
aws s3 ls s3://classboard-production-files

# Check CloudFront distribution
aws cloudfront get-distribution --id $DISTRIBUTION_ID

# Invalidate cache
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"
```

### Rollback Procedures

**Application Rollback:**
```bash
# Rollback Lambda function
aws lambda update-function-code \
  --function-name classboard-api-production \
  --s3-bucket deployment-artifacts \
  --s3-key classboard-api-previous.zip

# Rollback frontend (Vercel)
vercel rollback https://classboard.app
```

**Infrastructure Rollback:**
```bash
# Rollback Terraform changes
cd backend/aws/terraform
terraform plan -var-file="environments/production.tfvars" -destroy
terraform apply -var-file="environments/production.tfvars" -auto-approve
```

## 📈 Performance Optimization

### Database Optimization

```sql
-- Create indexes for performance
CREATE INDEX CONCURRENTLY idx_students_email ON students(email);
CREATE INDEX CONCURRENTLY idx_classes_subject ON classes(subject);
CREATE INDEX CONCURRENTLY idx_test_results_student_id ON test_results(student_id);
CREATE INDEX CONCURRENTLY idx_attendance_class_date ON attendance_records(class_id, date);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM classes WHERE subject = 'Mathematics';
```

### CDN Configuration

```hcl
# CloudFront cache behaviors
cache_behavior {
  path_pattern     = "/api/*"
  target_origin_id = "API-Gateway"
  
  cache_policy_id = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # CachingDisabled
  
  allowed_methods = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
  cached_methods  = ["GET", "HEAD"]
  
  compress               = true
  viewer_protocol_policy = "redirect-to-https"
}

cache_behavior {
  path_pattern     = "/static/*"
  target_origin_id = "S3-Frontend"
  
  cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6" # CachingOptimized
  
  allowed_methods = ["GET", "HEAD"]
  cached_methods  = ["GET", "HEAD"]
  
  compress               = true
  viewer_protocol_policy = "redirect-to-https"
}
```

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing (unit, integration, E2E)
- [ ] Security scan completed
- [ ] Performance benchmarks met
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] SSL certificates valid
- [ ] Backup procedures tested

### Deployment
- [ ] Infrastructure deployed successfully
- [ ] Database migrations applied
- [ ] Backend application deployed
- [ ] Frontend application deployed
- [ ] Health checks passing
- [ ] Smoke tests completed
- [ ] Performance tests passed

### Post-Deployment
- [ ] Monitoring dashboards updated
- [ ] Alerts configured
- [ ] Documentation updated
- [ ] Team notified
- [ ] Rollback plan confirmed
- [ ] Performance metrics baseline established

## 🆘 Support and Maintenance

### Monitoring Dashboards
- **Application Performance**: Response times, error rates, throughput
- **Infrastructure Health**: CPU, memory, disk usage
- **Database Performance**: Query times, connection counts
- **User Activity**: Active users, feature usage

### Maintenance Windows
- **Database Maintenance**: Sundays 2:00-4:00 AM UTC
- **Application Updates**: Rolling deployments (no downtime)
- **Infrastructure Updates**: Scheduled during low-traffic periods

### Emergency Procedures
1. **Incident Response**: Follow incident response playbook
2. **Escalation**: Contact on-call engineer
3. **Communication**: Update status page and notify users
4. **Resolution**: Apply fixes and verify resolution
5. **Post-Mortem**: Conduct post-incident review

This comprehensive deployment guide ensures reliable, secure, and scalable deployment of ClassBoard across all environments.