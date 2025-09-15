#!/bin/bash

# Lambda deployment script
set -e

echo "Starting Lambda function deployment..."

# Function to deploy a single Lambda function
deploy_function() {
    local function_name=$1
    local function_dir=$2
    
    echo "Deploying $function_name..."
    
    cd "$function_dir"
    
    # Install dependencies
    npm install
    
    # Build TypeScript
    npx tsc
    
    # Create deployment package
    zip -r "${function_name}.zip" dist/ node_modules/ package.json
    
    # Deploy to AWS Lambda (requires AWS CLI to be configured)
    aws lambda update-function-code \
        --function-name "$function_name" \
        --zip-file "fileb://${function_name}.zip" \
        --region "${AWS_REGION:-us-east-1}"
    
    echo "Successfully deployed $function_name"
    
    cd ..
}

# Deploy all Lambda functions
deploy_function "grade-calculator" "grade-calculator"
deploy_function "report-generator" "report-generator"
deploy_function "email-notifications" "email-notifications"
deploy_function "data-cleanup" "data-cleanup"

echo "All Lambda functions deployed successfully!"