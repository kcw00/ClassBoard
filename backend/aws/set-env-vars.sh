#!/bin/bash

# Environment Variable Setup Script for ClassBoard Backend
# This script extracts Terraform outputs and sets environment variables
# for the backend configuration to consume

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if environment is provided
if [ -z "$1" ]; then
    print_error "Environment is required"
    echo "Usage: $0 <environment>"
    echo "Environments: development, staging, production"
    exit 1
fi

ENVIRONMENT=$1
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/terraform"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    print_error "Invalid environment: $ENVIRONMENT"
    echo "Valid environments: development, staging, production"
    exit 1
fi

cd "$TERRAFORM_DIR"

print_status "Setting up environment variables for: $ENVIRONMENT"

# Set Terraform workspace
terraform workspace select "$ENVIRONMENT" 2>/dev/null || {
    print_error "Terraform workspace '$ENVIRONMENT' not found. Run deployment first."
    exit 1
}

# Check if infrastructure is deployed
if ! terraform show &>/dev/null; then
    print_error "No Terraform state found. Deploy infrastructure first."
    exit 1
fi

print_status "Extracting Terraform outputs..."

# Extract outputs
RDS_ENDPOINT=$(terraform output -raw rds_endpoint 2>/dev/null || echo "")
RDS_PORT=$(terraform output -raw rds_port 2>/dev/null || echo "5432")
RDS_DATABASE_NAME=$(terraform output -raw rds_database_name 2>/dev/null || echo "")
COGNITO_USER_POOL_ID=$(terraform output -raw cognito_user_pool_id 2>/dev/null || echo "")
COGNITO_CLIENT_ID=$(terraform output -raw cognito_client_id 2>/dev/null || echo "")
CLOUDFRONT_DOMAIN=$(terraform output -raw cloudfront_domain_name 2>/dev/null || echo "")
S3_BUCKET_NAME=$(terraform output -raw s3_bucket_name 2>/dev/null || echo "")

# Validate required outputs
MISSING_OUTPUTS=()

if [ -z "$RDS_ENDPOINT" ]; then
    MISSING_OUTPUTS+=("rds_endpoint")
fi

if [ -z "$COGNITO_USER_POOL_ID" ]; then
    MISSING_OUTPUTS+=("cognito_user_pool_id")
fi

if [ -z "$COGNITO_CLIENT_ID" ]; then
    MISSING_OUTPUTS+=("cognito_client_id")
fi

if [ -z "$CLOUDFRONT_DOMAIN" ]; then
    MISSING_OUTPUTS+=("cloudfront_domain_name")
fi

if [ ${#MISSING_OUTPUTS[@]} -gt 0 ]; then
    print_error "Missing required Terraform outputs: ${MISSING_OUTPUTS[*]}"
    print_error "Ensure all infrastructure components are deployed"
    exit 1
fi

# Generate environment variables
ENV_FILE="$SCRIPT_DIR/.env.$ENVIRONMENT"

print_status "Generating environment variables file: $ENV_FILE"

cat > "$ENV_FILE" << EOF
# ClassBoard Backend Environment Variables
# Generated automatically from Terraform outputs
# Environment: $ENVIRONMENT
# Generated: $(date)

# Database Configuration
RDS_HOST=$RDS_ENDPOINT
RDS_PORT=$RDS_PORT
RDS_DATABASE=$RDS_DATABASE_NAME
RDS_USERNAME=\${TF_VAR_db_username:-classboard_admin}
RDS_PASSWORD=\${TF_VAR_db_password}

# Authentication
COGNITO_USER_POOL_ID=$COGNITO_USER_POOL_ID
COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID

# File Storage & CDN
S3_BUCKET_NAME=$S3_BUCKET_NAME
CLOUDFRONT_DOMAIN=$CLOUDFRONT_DOMAIN

# AWS Configuration
AWS_REGION=us-east-1
NODE_ENV=$ENVIRONMENT

# Security
JWT_SECRET=\${JWT_SECRET}
CORS_ORIGIN=\${CORS_ORIGIN}

EOF

print_status "Environment variables written to: $ENV_FILE"

# Generate export commands
EXPORT_FILE="$SCRIPT_DIR/export-env-vars-$ENVIRONMENT.sh"

cat > "$EXPORT_FILE" << EOF
#!/bin/bash
# Export environment variables for $ENVIRONMENT
# Usage: source $EXPORT_FILE

export RDS_HOST="$RDS_ENDPOINT"
export RDS_PORT="$RDS_PORT"
export RDS_DATABASE="$RDS_DATABASE_NAME"
export RDS_USERNAME="\${TF_VAR_db_username:-classboard_admin}"
export RDS_PASSWORD="\${TF_VAR_db_password}"

export COGNITO_USER_POOL_ID="$COGNITO_USER_POOL_ID"
export COGNITO_CLIENT_ID="$COGNITO_CLIENT_ID"

export S3_BUCKET_NAME="$S3_BUCKET_NAME"
export CLOUDFRONT_DOMAIN="$CLOUDFRONT_DOMAIN"

export AWS_REGION="us-east-1"
export NODE_ENV="$ENVIRONMENT"

echo "Environment variables set for $ENVIRONMENT"
EOF

chmod +x "$EXPORT_FILE"

print_status "Export script created: $EXPORT_FILE"

# Validation summary
print_status "Environment Variable Mapping Validation:"
echo "✅ RDS_HOST: $RDS_ENDPOINT"
echo "✅ COGNITO_USER_POOL_ID: $COGNITO_USER_POOL_ID"
echo "✅ COGNITO_CLIENT_ID: $COGNITO_CLIENT_ID"
echo "✅ CLOUDFRONT_DOMAIN: $CLOUDFRONT_DOMAIN"
echo "✅ S3_BUCKET_NAME: $S3_BUCKET_NAME"

print_warning "Manual setup still required:"
echo "- Set TF_VAR_db_username and TF_VAR_db_password"
echo "- Set JWT_SECRET for token signing"
echo "- Configure CORS_ORIGIN for your frontend domain"

print_status "Next steps:"
echo "1. Source the export script: source $EXPORT_FILE"
echo "2. Verify backend configuration loads correctly"
echo "3. Test database connectivity"
echo "4. Validate Cognito authentication flow"

print_status "Setup completed successfully!"