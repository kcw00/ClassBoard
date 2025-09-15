#!/bin/bash

# Simple AWS Deployment - Essential Components Only
# Avoids IAM permission issues by focusing on core infrastructure

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
}

print_header "ClassBoard Simple AWS Deployment"
print_status "Deploying only essential components: VPC, RDS, S3, Security Groups"
print_status "Estimated time: 45-75 minutes"
print_status "Estimated cost: $15-25/month"

# Check prerequisites
print_status "Checking prerequisites..."

if ! command -v terraform &> /dev/null; then
    print_error "Terraform not found. Please install Terraform first."
    exit 1
fi

if ! command -v aws &> /dev/null; then
    print_error "AWS CLI not found. Please install AWS CLI first."
    exit 1
fi

if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

print_status "✓ Prerequisites check passed"

# Set environment variables
export TF_VAR_db_password="${TF_VAR_db_password:-ClassBoard2024!Simple}"
export TF_VAR_cors_origin="${TF_VAR_cors_origin:-http://localhost:3000}"

print_status "Environment variables:"
print_status "  Database password: [HIDDEN]"
print_status "  CORS origin: $TF_VAR_cors_origin"

# Navigate to simple terraform directory
cd backend/aws/simple-terraform

print_status "Initializing Terraform..."
terraform init

print_status "Validating Terraform configuration..."
terraform validate -json > /dev/null
if [ $? -eq 0 ]; then
    print_status "✓ Terraform configuration is valid"
else
    print_error "Terraform configuration validation failed"
    exit 1
fi

print_status "Planning deployment..."
terraform plan \
    -var-file="environments.tfvars" \
    -var="db_password=$TF_VAR_db_password" \
    -var="cors_origin=$TF_VAR_cors_origin" \
    -out="simple.tfplan"

print_header "Deployment Plan Summary"
print_status "The following resources will be created:"
echo "  ✓ VPC with public/private subnets (2-3 minutes)"
echo "  ✓ Security groups for database access (1-2 minutes)"
echo "  ✓ S3 bucket for file storage (1-2 minutes)"
echo "  ✓ RDS PostgreSQL database (20-25 minutes) ⏰"
echo ""
print_status "Total estimated time: 25-35 minutes"
print_status "Monthly cost: ~$15-25 (db.t3.micro + S3 storage)"

echo ""
read -p "Do you want to proceed with the deployment? (y/N): " -r
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_status "Deployment cancelled"
    exit 0
fi

print_header "Starting Deployment..."
terraform apply simple.tfplan

if [ $? -eq 0 ]; then
    print_header "Deployment Successful! 🎉"
    
    print_status "Getting infrastructure outputs..."
    terraform output
    
    print_status "Generating environment file..."
    cat > ../simple-env-vars.sh << EOF
#!/bin/bash
# Generated environment variables for simple AWS deployment

# Database connection
export DATABASE_URL="\$(terraform output -raw database_url)"
export DB_HOST="\$(terraform output -raw rds_endpoint | cut -d: -f1)"
export DB_PORT="\$(terraform output -raw rds_port)"
export DB_NAME="\$(terraform output -raw rds_database_name)"
export DB_USER="classboard_admin"
export DB_PASSWORD="$TF_VAR_db_password"

# S3 Configuration
export S3_BUCKET="\$(terraform output -raw s3_bucket_name)"
export AWS_REGION="us-east-1"

# Application
export NODE_ENV="development"
export JWT_SECRET="simple-deployment-jwt-secret-change-in-production"
export CORS_ORIGIN="$TF_VAR_cors_origin"

echo "Environment variables loaded for simple AWS deployment"
EOF
    
    chmod +x ../simple-env-vars.sh
    
    print_header "Next Steps:"
    echo "1. Load environment variables:"
    echo "   cd backend/aws && source simple-env-vars.sh"
    echo ""
    echo "2. Run database migrations:"
    echo "   cd backend && npm run db:migrate"
    echo ""
    echo "3. Start your application:"
    echo "   cd backend && npm run dev"
    echo ""
    echo "4. Your infrastructure is ready at:"
    echo "   Database: $(terraform output -raw rds_endpoint 2>/dev/null || echo 'Check terraform output')"
    echo "   S3 Bucket: $(terraform output -raw s3_bucket_name 2>/dev/null || echo 'Check terraform output')"
    
else
    print_error "Deployment failed. Check the error messages above."
    exit 1
fi