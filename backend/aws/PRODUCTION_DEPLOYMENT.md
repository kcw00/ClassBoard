# Production Deployment Guide

This guide covers the complete production deployment process for the ClassBoard backend infrastructure and application.

## Prerequisites

### Required Tools
- **AWS CLI** (v2.x) - configured with appropriate credentials
- **Terraform** (v1.0+) - for infrastructure management
- **Node.js** (v18+) - for application deployment
- **Git** - for source code management

### Required Permissions
Your AWS user/role must have permissions for:
- RDS (create, modify, delete instances)
- S3 (create buckets, manage objects)
- CloudFront (create distributions)
- Cognito (manage user pools)
- Lambda (create, update functions)
- IAM (create roles, policies)
- Secrets Manager (create, read secrets)
- CloudWatch (create alarms, dashboards)
- AWS Backup (create vaults, plans)

### Required Environment Variables
```bash
# Database credentials
export TF_VAR_db_password="your-secure-production-password"

# Optional configurations
export TF_VAR_alert_email="admin@classboard.app"
export TF_VAR_cors_origin="https://classboard.app"
export TF_VAR_jwt_secret="your-jwt-secret-key"
```

## Deployment Process

### Step 1: Pre-Deployment Validation

1. **Verify AWS credentials:**
   ```bash
   aws sts get-caller-identity
   ```

2. **Check environment variables:**
   ```bash
   echo $TF_VAR_db_password  # Should not be empty
   ```

3. **Validate Terraform configuration:**
   ```bash
   cd backend/aws/terraform
   terraform validate
   ```

### Step 2: Infrastructure Deployment

#### Option A: Using the Deployment Script (Recommended)

```bash
# Navigate to AWS directory
cd backend/aws

# Plan the deployment
./deploy-production.sh plan

# Review the plan output carefully
# Apply the deployment
./deploy-production.sh apply
```

#### Option B: Manual Terraform Commands

```bash
cd backend/aws/terraform

# Initialize Terraform
terraform init

# Select production workspace
terraform workspace select production || terraform workspace new production

# Plan deployment
terraform plan -var-file="environments/production.tfvars" -out=production.tfplan

# Apply deployment
terraform apply production.tfplan
```

### Step 3: Post-Deployment Configuration

1. **Generate environment variables:**
   ```bash
   cd backend/aws
   ./set-env-vars.sh production
   ```

2. **Source the environment variables:**
   ```bash
   source export-env-vars-production.sh
   ```

3. **Run database migrations:**
   ```bash
   cd backend
   npm run db:migrate
   ```

4. **Validate integration:**
   ```bash
   cd backend/aws
   ./validate-integration.js production
   ```

### Step 4: Application Deployment

The application deployment method depends on your hosting choice:

#### Option A: AWS Lambda (Serverless)
```bash
cd backend
npm run build
zip -r backend.zip dist/ node_modules/ package.json
aws lambda update-function-code --function-name classboard-production-api --zip-file fileb://backend.zip
```

#### Option B: AWS ECS (Containerized)
```bash
# Build Docker image
docker build -t classboard-backend .
docker tag classboard-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/classboard-backend:latest

# Push to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/classboard-backend:latest

# Update ECS service
aws ecs update-service --cluster classboard-production --service classboard-backend --force-new-deployment
```

#### Option C: EC2 Instances
```bash
# Deploy via SSH/CodeDeploy
# Copy built application to EC2 instances
# Restart application services
```

## Infrastructure Components

### Database (RDS PostgreSQL)
- **Instance Class:** db.r5.large
- **Storage:** 100GB (auto-scaling to 1TB)
- **Multi-AZ:** Enabled for high availability
- **Backups:** 30-day retention
- **Monitoring:** Performance Insights enabled

### File Storage (S3 + CloudFront)
- **S3 Bucket:** Encrypted, versioned, lifecycle policies
- **CloudFront:** Global CDN with origin access identity
- **CORS:** Configured for production domain

### Authentication (Cognito)
- **User Pool:** Production-grade password policies
- **MFA:** Required for enhanced security
- **Advanced Security:** Enabled with risk detection

### Background Processing (Lambda)
- **Grade Calculator:** Runs hourly
- **Report Generator:** Runs daily at 2 AM
- **Email Notifications:** Runs every 6 hours
- **Data Cleanup:** Runs weekly on Sundays

### Monitoring & Alerting
- **CloudWatch Dashboard:** Real-time metrics
- **Alarms:** CPU, memory, storage, error rates
- **SNS Notifications:** Email alerts for critical issues

### Backup & Disaster Recovery
- **AWS Backup:** Daily and weekly backups
- **Cross-Region Replication:** S3 data replicated to us-west-2
- **Point-in-Time Recovery:** RDS automated backups

## Security Considerations

### Network Security
- **VPC:** Isolated network environment
- **Private Subnets:** Database in private subnets only
- **Security Groups:** Restrictive access rules
- **NAT Gateway:** Secure outbound internet access

### Data Security
- **Encryption at Rest:** All storage encrypted
- **Encryption in Transit:** HTTPS/TLS everywhere
- **Secrets Management:** AWS Secrets Manager
- **IAM Roles:** Least privilege access

### Application Security
- **JWT Tokens:** Short expiration times
- **Input Validation:** All API endpoints
- **Rate Limiting:** Protection against abuse
- **CORS:** Restricted to production domain

## Monitoring & Maintenance

### Daily Monitoring
- Check CloudWatch dashboard
- Review error logs
- Monitor performance metrics
- Verify backup completion

### Weekly Tasks
- Review security alerts
- Check cost optimization opportunities
- Update dependencies if needed
- Review access logs

### Monthly Tasks
- Security audit
- Performance optimization review
- Backup restoration testing
- Disaster recovery plan validation

## Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check RDS instance status
aws rds describe-db-instances --db-instance-identifier classboard-production-db

# Test connectivity from application
psql -h $RDS_HOST -U $RDS_USERNAME -d $RDS_DATABASE
```

#### S3 Access Issues
```bash
# Check bucket policy
aws s3api get-bucket-policy --bucket classboard-production-files

# Test file upload
aws s3 cp test-file.txt s3://classboard-production-files/
```

#### Cognito Authentication Issues
```bash
# Check user pool configuration
aws cognito-idp describe-user-pool --user-pool-id $COGNITO_USER_POOL_ID

# Test user creation
aws cognito-idp admin-create-user --user-pool-id $COGNITO_USER_POOL_ID --username testuser
```

#### Lambda Function Errors
```bash
# Check function logs
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/classboard"

# View recent logs
aws logs filter-log-events --log-group-name "/aws/lambda/classboard-grade-calculator"
```

### Emergency Procedures

#### Database Failover (Multi-AZ)
RDS automatically handles failover in Multi-AZ setup. Monitor the process:
```bash
aws rds describe-events --source-identifier classboard-production-db
```

#### Application Rollback
```bash
# Revert to previous Lambda version
aws lambda update-function-code --function-name classboard-production-api --s3-bucket backup-bucket --s3-key previous-version.zip

# Or rollback ECS service
aws ecs update-service --cluster classboard-production --service classboard-backend --task-definition previous-task-definition
```

#### Data Recovery
```bash
# Restore from backup
aws backup start-restore-job --recovery-point-arn "arn:aws:backup:..." --metadata file://restore-metadata.json
```

## Cost Optimization

### Production Costs (Estimated Monthly)
- **RDS:** ~$200-300 (db.r5.large Multi-AZ)
- **S3:** ~$20-50 (depending on storage)
- **CloudFront:** ~$10-30 (depending on traffic)
- **Lambda:** ~$5-15 (depending on executions)
- **Other Services:** ~$20-40

### Cost Optimization Tips
1. **Reserved Instances:** Purchase RDS reserved instances for 1-3 years
2. **S3 Lifecycle:** Automatically transition old files to cheaper storage
3. **CloudFront:** Use appropriate price class for your user base
4. **Lambda:** Optimize memory allocation and execution time
5. **Monitoring:** Set up billing alerts and cost budgets

## Compliance & Governance

### Data Retention
- **Database Backups:** 30 days
- **Application Logs:** 30 days
- **Access Logs:** 90 days
- **S3 Objects:** Lifecycle policies based on usage

### Audit Trail
- **CloudTrail:** All API calls logged
- **VPC Flow Logs:** Network traffic monitoring
- **Application Logs:** Structured logging with correlation IDs

### Compliance Features
- **Encryption:** FIPS 140-2 Level 2 validated encryption
- **Access Control:** Role-based access with MFA
- **Data Residency:** All data stored in specified AWS region
- **Audit Logging:** Comprehensive audit trail

## Support & Escalation

### Support Contacts
- **Infrastructure Issues:** Platform Team
- **Application Issues:** Development Team
- **Security Issues:** Security Team

### Escalation Procedures
1. **P1 (Critical):** Immediate notification via PagerDuty
2. **P2 (High):** Slack notification within 1 hour
3. **P3 (Medium):** Email notification within 4 hours
4. **P4 (Low):** Ticket creation for next business day

### Documentation
- **Runbooks:** Detailed procedures for common operations
- **Architecture Diagrams:** Current system architecture
- **Change Log:** All infrastructure changes tracked
- **Incident Reports:** Post-mortem analysis for major incidents