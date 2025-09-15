#!/bin/bash

# Production Deployment Script for ClassBoard Backend
# This script handles the complete production deployment process
# Usage: ./deploy-production.sh [action]
# Actions: plan, apply, destroy, status

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Configuration
ENVIRONMENT="production"
ACTION=${1:-plan}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/terraform"
BACKEND_DIR="$SCRIPT_DIR/.."

# Validate action
if [[ ! "$ACTION" =~ ^(plan|apply|destroy|status|init)$ ]]; then
    print_error "Invalid action: $ACTION"
    echo "Valid actions: plan, apply, destroy, status, init"
    exit 1
fi

print_header "ClassBoard Production Deployment"
print_status "Environment: $ENVIRONMENT"
print_status "Action: $ACTION"
print_status "Working directory: $TERRAFORM_DIR"

# Pre-deployment checks
print_header "Running Pre-deployment Checks"

# Check if required tools are installed
check_tool() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 is not installed or not in PATH"
        exit 1
    fi
    print_status "✓ $1 is available"
}

check_tool "terraform"
check_tool "aws"
check_tool "node"
check_tool "npm"

# Verify AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured or invalid"
    exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=$(aws configure get region || echo "us-east-1")
print_status "✓ AWS credentials valid (Account: $AWS_ACCOUNT_ID, Region: $AWS_REGION)"

# Check required environment variables
check_env_var() {
    if [ -z "${!1}" ]; then
        print_error "Environment variable $1 is not set"
        return 1
    fi
    print_status "✓ $1 is set"
}

print_status "Checking required environment variables..."
MISSING_VARS=()

if ! check_env_var "TF_VAR_db_password"; then
    MISSING_VARS+=("TF_VAR_db_password")
fi

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    print_error "Missing required environment variables: ${MISSING_VARS[*]}"
    print_error "Please set the following variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  export $var=\"your-value\""
    done
    exit 1
fi

# Optional environment variables with defaults
export TF_VAR_alert_email=${TF_VAR_alert_email:-"admin@classboard.app"}
export TF_VAR_cors_origin=${TF_VAR_cors_origin:-"https://classboard.app"}

print_status "✓ All required environment variables are set"

# Change to Terraform directory
cd "$TERRAFORM_DIR"

# Initialize Terraform if needed
if [ "$ACTION" = "init" ] || [ ! -d ".terraform" ]; then
    print_header "Initializing Terraform"
    terraform init
fi

# Set Terraform workspace
print_status "Setting Terraform workspace to: $ENVIRONMENT"
terraform workspace select "$ENVIRONMENT" 2>/dev/null || terraform workspace new "$ENVIRONMENT"

# Validate Terraform configuration
print_status "Validating Terraform configuration..."
terraform validate
print_status "✓ Terraform configuration is valid"

# Check if tfvars file exists
TFVARS_FILE="environments/${ENVIRONMENT}.tfvars"
if [ ! -f "$TFVARS_FILE" ]; then
    print_error "Terraform variables file not found: $TFVARS_FILE"
    exit 1
fi
print_status "✓ Using variables file: $TFVARS_FILE"

# Production safety checks
if [ "$ACTION" = "apply" ] || [ "$ACTION" = "destroy" ]; then
    print_header "Production Safety Checks"
    
    # Confirm production deployment
    print_warning "You are about to $ACTION infrastructure in PRODUCTION environment"
    print_warning "This will affect live systems and real data"
    
    if [ "$ACTION" = "destroy" ]; then
        print_error "DANGER: This will DESTROY all production infrastructure!"
        print_error "This action is IRREVERSIBLE and will result in DATA LOSS!"
    fi
    
    read -p "Are you absolutely sure you want to proceed? Type 'YES' to continue: " -r
    if [[ $REPLY != "YES" ]]; then
        print_status "Operation cancelled by user"
        exit 0
    fi
    
    # Additional confirmation for destroy
    if [ "$ACTION" = "destroy" ]; then
        read -p "Type the environment name '$ENVIRONMENT' to confirm destruction: " -r
        if [[ $REPLY != "$ENVIRONMENT" ]]; then
            print_error "Environment name mismatch. Operation cancelled."
            exit 1
        fi
    fi
fi

# Execute Terraform command
case $ACTION in
    plan)
        print_header "Planning Terraform Deployment"
        terraform plan -var-file="$TFVARS_FILE" -out="$ENVIRONMENT.tfplan"
        
        print_status "Plan completed successfully!"
        print_status "Review the plan above and run './deploy-production.sh apply' to proceed"
        ;;
        
    apply)
        print_header "Applying Terraform Deployment"
        
        # Check if plan file exists
        if [ -f "$ENVIRONMENT.tfplan" ]; then
            print_status "Using existing plan file: $ENVIRONMENT.tfplan"
            terraform apply "$ENVIRONMENT.tfplan"
        else
            print_warning "No plan file found. Running plan and apply..."
            terraform plan -var-file="$TFVARS_FILE" -out="$ENVIRONMENT.tfplan"
            terraform apply "$ENVIRONMENT.tfplan"
        fi
        
        print_header "Deployment Completed Successfully!"
        
        # Output important values
        print_status "Infrastructure outputs:"
        terraform output
        
        # Generate environment variables
        print_status "Generating environment variables..."
        cd "$SCRIPT_DIR"
        ./set-env-vars.sh "$ENVIRONMENT"
        
        # Post-deployment tasks
        print_header "Running Post-deployment Tasks"
        
        # Run database migrations
        print_status "Running database migrations..."
        cd "$BACKEND_DIR"
        source "$SCRIPT_DIR/export-env-vars-$ENVIRONMENT.sh"
        npm run db:migrate
        
        # Validate deployment
        print_status "Validating deployment..."
        cd "$SCRIPT_DIR"
        ./validate-integration.js "$ENVIRONMENT"
        
        print_header "Production Deployment Complete!"
        print_status "✓ Infrastructure deployed successfully"
        print_status "✓ Environment variables configured"
        print_status "✓ Database migrations completed"
        print_status "✓ Integration validation passed"
        
        print_status "Next steps:"
        echo "1. Deploy application code to production servers"
        echo "2. Update DNS records if needed"
        echo "3. Run smoke tests against production endpoints"
        echo "4. Monitor CloudWatch dashboards for any issues"
        ;;
        
    destroy)
        print_header "Destroying Terraform Infrastructure"
        print_error "Destroying production infrastructure..."
        
        terraform destroy -var-file="$TFVARS_FILE"
        
        print_status "Infrastructure destroyed"
        ;;
        
    status)
        print_header "Infrastructure Status"
        
        # Show current state
        print_status "Current Terraform workspace: $(terraform workspace show)"
        print_status "Terraform state:"
        terraform show -json | jq -r '.values.root_module.resources[] | select(.type != "random_password") | "\(.type).\(.name): \(.values.id // "N/A")"' 2>/dev/null || terraform show
        
        # Show outputs
        print_status "Current outputs:"
        terraform output 2>/dev/null || echo "No outputs available"
        ;;
esac

print_status "Operation completed successfully!"