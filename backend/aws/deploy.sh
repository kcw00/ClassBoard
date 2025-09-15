#!/bin/bash

# AWS Infrastructure Deployment Script for ClassBoard
# Usage: ./deploy.sh <environment> [action]
# Example: ./deploy.sh development plan
# Example: ./deploy.sh production apply

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check if environment is provided
if [ -z "$1" ]; then
    print_error "Environment is required"
    echo "Usage: $0 <environment> [action]"
    echo "Environments: development, staging, production"
    echo "Actions: plan, apply, destroy, init"
    exit 1
fi

ENVIRONMENT=$1
ACTION=${2:-plan}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    print_error "Invalid environment: $ENVIRONMENT"
    echo "Valid environments: development, staging, production"
    exit 1
fi

# Validate action
if [[ ! "$ACTION" =~ ^(plan|apply|destroy|init|output)$ ]]; then
    print_error "Invalid action: $ACTION"
    echo "Valid actions: plan, apply, destroy, init, output"
    exit 1
fi

# Set working directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/terraform"

cd "$TERRAFORM_DIR"

print_status "Working directory: $TERRAFORM_DIR"
print_status "Environment: $ENVIRONMENT"
print_status "Action: $ACTION"

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    print_error "Terraform is not installed or not in PATH"
    exit 1
fi

# Check if AWS CLI is installed and configured
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed or not in PATH"
    exit 1
fi

# Verify AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured or invalid"
    exit 1
fi

# Set Terraform workspace
print_status "Setting Terraform workspace to: $ENVIRONMENT"
terraform workspace select "$ENVIRONMENT" 2>/dev/null || terraform workspace new "$ENVIRONMENT"

# Check if tfvars file exists
TFVARS_FILE="environments/${ENVIRONMENT}.tfvars"
if [ ! -f "$TFVARS_FILE" ]; then
    print_error "Terraform variables file not found: $TFVARS_FILE"
    exit 1
fi

# Check for required environment variables
if [ -z "$TF_VAR_db_password" ]; then
    print_warning "TF_VAR_db_password environment variable not set"
    print_warning "You will be prompted for the database password"
fi

# Execute Terraform command
case $ACTION in
    init)
        print_status "Initializing Terraform..."
        terraform init
        ;;
    plan)
        print_status "Planning Terraform deployment..."
        terraform plan -var-file="$TFVARS_FILE" -out="$ENVIRONMENT.tfplan"
        ;;
    apply)
        print_status "Applying Terraform deployment..."
        if [ -f "$ENVIRONMENT.tfplan" ]; then
            terraform apply "$ENVIRONMENT.tfplan"
        else
            print_warning "No plan file found. Running plan and apply..."
            terraform plan -var-file="$TFVARS_FILE" -out="$ENVIRONMENT.tfplan"
            terraform apply "$ENVIRONMENT.tfplan"
        fi
        
        # Output important values
        print_status "Deployment completed. Important outputs:"
        terraform output
        ;;
    destroy)
        print_warning "This will destroy all infrastructure for environment: $ENVIRONMENT"
        read -p "Are you sure? Type 'yes' to continue: " -r
        if [[ $REPLY == "yes" ]]; then
            print_status "Destroying Terraform infrastructure..."
            terraform destroy -var-file="$TFVARS_FILE"
        else
            print_status "Destroy cancelled"
        fi
        ;;
    output)
        print_status "Terraform outputs for environment: $ENVIRONMENT"
        terraform output
        ;;
esac

print_status "Operation completed successfully!"