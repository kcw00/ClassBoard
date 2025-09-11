# AWS Infrastructure Configuration

This directory contains the AWS infrastructure configuration for the ClassBoard application backend migration. The infrastructure is managed using Terraform and includes RDS PostgreSQL, S3 file storage, CloudFront CDN, and Cognito authentication.

## Directory Structure

```
aws/
├── README.md                           # This file
├── deploy.sh                          # Deployment script
├── rds-config.json                    # RDS configuration by environment
├── s3-config.json                     # S3 configuration by environment
├── cloudfront-config.json             # CloudFront configuration by environment
├── cognito-config.json                # Cognito configuration by environment
├── environments/                      # Environment-specific configurations
│   ├── development.json
│   ├── staging.json
│   └── production.json
└── terraform/                         # Terraform infrastructure code
    ├── main.tf                        # Main Terraform configuration
    ├── variables.tf                   # Variable definitions
    ├── rds.tf                         # RDS PostgreSQL configuration
    ├── s3.tf                          # S3 bucket configuration
    ├── cloudfront.tf                  # CloudFront distribution
    ├── cognito.tf                     # Cognito user pool configuration
    ├── terraform.tfvars.example       # Example variables file
    └── environments/                  # Environment-specific tfvars
        ├── development.tfvars
        ├── staging.tfvars
        └── production.tfvars
```

## Prerequisites

1. **AWS CLI**: Install and configure with appropriate credentials
   ```bash
   aws configure
   ```

2. **Terraform**: Install Terraform >= 1.0
   ```bash
   # macOS
   brew install terraform
   
   # Or download from https://www.terraform.io/downloads.html
   ```

3. **Environment Variables**: Set required environment variables
   ```bash
   export TF_VAR_db_password="your-secure-database-password"
   export AWS_REGION="us-east-1"
   ```

## Quick Start

1. **Initialize Terraform** (first time only):
   ```bash
   ./deploy.sh development init
   ```

2. **Plan the deployment**:
   ```bash
   ./deploy.sh development plan
   ```

3. **Apply the infrastructure**:
   ```bash
   ./deploy.sh development apply
   ```

## Environment Configuration

### Development Environment
- **RDS**: db.t3.micro, 20GB storage, single AZ
- **S3**: Basic lifecycle rules, development CORS settings
- **CloudFront**: PriceClass_100, no logging
- **Cognito**: Relaxed password policy, AUDIT security mode

### Staging Environment
- **RDS**: db.t3.small, 50GB storage, single AZ, 14-day backups
- **S3**: Enhanced lifecycle rules, staging CORS settings
- **CloudFront**: PriceClass_100, logging enabled
- **Cognito**: Standard password policy, ENFORCED security mode

### Production Environment
- **RDS**: db.r5.large, 100GB storage, Multi-AZ, 30-day backups
- **S3**: Full lifecycle rules with Glacier transition
- **CloudFront**: PriceClass_All, logging and monitoring
- **Cognito**: Strict password policy, MFA required, ENFORCED security mode

## Deployment Commands

### Initialize Infrastructure
```bash
# Initialize Terraform (run once per environment)
./deploy.sh <environment> init
```

### Plan Changes
```bash
# See what changes will be made
./deploy.sh development plan
./deploy.sh staging plan
./deploy.sh production plan
```

### Apply Changes
```bash
# Apply the planned changes
./deploy.sh development apply
./deploy.sh staging apply
./deploy.sh production apply
```

### View Outputs
```bash
# View important infrastructure outputs
./deploy.sh <environment> output
```

### Destroy Infrastructure
```bash
# Destroy all infrastructure (use with caution!)
./deploy.sh <environment> destroy
```

## Important Outputs

After deployment, the following outputs will be available:

- **RDS Endpoint**: Database connection endpoint
- **S3 Bucket Name**: File storage bucket name
- **CloudFront Domain**: CDN domain for file delivery
- **Cognito User Pool ID**: Authentication user pool ID
- **Cognito Client ID**: Web application client ID

## Security Considerations

### Database Security
- RDS instances are deployed in private subnets
- Security groups restrict access to VPC only
- Encryption at rest enabled
- Automated backups with retention policies

### File Storage Security
- S3 buckets block all public access
- CloudFront Origin Access Identity for secure access
- CORS configured for specific domains only
- Lifecycle policies for cost optimization

### Authentication Security
- Cognito advanced security features enabled
- MFA required for production environment
- Strong password policies enforced
- JWT token expiration configured appropriately

## Environment Variables

Set these environment variables before deployment:

```bash
# Required
export TF_VAR_db_password="your-secure-password"

# Optional (defaults provided)
export TF_VAR_aws_region="us-east-1"
export TF_VAR_project_name="classboard"
export TF_VAR_db_username="classboard_admin"
```

## Monitoring and Logging

### Development
- Basic CloudWatch metrics
- No enhanced monitoring
- Minimal logging

### Staging
- Enhanced RDS monitoring
- CloudFront access logs
- CloudWatch log retention: 14 days

### Production
- Full monitoring and alerting
- Enhanced RDS monitoring with Performance Insights
- CloudFront access logs
- CloudWatch log retention: 30 days
- Custom alerts for error rates and response times

## Cost Optimization

### Development
- Minimal instance sizes
- Basic storage options
- No Multi-AZ deployment
- Short backup retention

### Staging
- Moderate instance sizes
- Standard storage with lifecycle rules
- Extended backup retention for testing

### Production
- Optimized for performance and availability
- Full lifecycle management
- Long-term backup retention
- Reserved instances recommended for cost savings

## Troubleshooting

### Common Issues

1. **AWS Credentials**: Ensure AWS CLI is configured with appropriate permissions
2. **Terraform State**: Use Terraform workspaces to manage multiple environments
3. **Database Password**: Set TF_VAR_db_password environment variable
4. **Region Consistency**: Ensure all resources are deployed in the same region

### Useful Commands

```bash
# Check AWS credentials
aws sts get-caller-identity

# List Terraform workspaces
cd terraform && terraform workspace list

# View Terraform state
cd terraform && terraform show

# Import existing resources (if needed)
cd terraform && terraform import aws_s3_bucket.files bucket-name
```

## Environment Variable Integration

After infrastructure deployment, you need to set up environment variables for your backend application:

### Automatic Setup (Recommended)
```bash
# Generate environment variables from Terraform outputs
./set-env-vars.sh development

# Source the generated export script
source export-env-vars-development.sh
```

### Manual Setup
Set these environment variables in your deployment environment:
```bash
export RDS_HOST="<terraform output rds_endpoint>"
export RDS_USERNAME="classboard_admin"
export RDS_PASSWORD="your-secure-password"
export COGNITO_USER_POOL_ID="<terraform output cognito_user_pool_id>"
export COGNITO_CLIENT_ID="<terraform output cognito_client_id>"
export CLOUDFRONT_DOMAIN="<terraform output cloudfront_domain_name>"
```

### Validation
```bash
# Test integration between Terraform outputs and backend config
./validate-integration.js development
```

## Next Steps

After infrastructure deployment:

1. **Set Environment Variables**: Run `./set-env-vars.sh <environment>` 
2. **Validate Integration**: Run `./validate-integration.js <environment>`
3. **Database Migration**: Run Prisma migrations against the new RDS instance
4. **Application Deployment**: Deploy the Node.js backend to connect to AWS services
5. **DNS Configuration**: Set up custom domains for CloudFront distributions
6. **Monitoring Setup**: Configure additional monitoring and alerting as needed

## Support

For issues with AWS infrastructure:
1. Check AWS CloudFormation events for detailed error messages
2. Review Terraform plan output for resource conflicts
3. Verify IAM permissions for Terraform execution
4. Check AWS service limits and quotas