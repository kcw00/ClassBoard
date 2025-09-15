# ClassBoard Lambda Functions

This directory contains AWS Lambda functions for background processing tasks in the ClassBoard application.

## Functions

### 1. Grade Calculator (`grade-calculator/`)
**Purpose**: Automatically calculates letter grades for test results that have scores but no grades assigned.

**Schedule**: Runs every hour
**Trigger**: CloudWatch Events (EventBridge)
**Environment Variables**:
- `DATABASE_URL`: PostgreSQL connection string
- `AWS_REGION`: AWS region

**Functionality**:
- Finds test results with scores but no calculated grades
- Calculates percentage and letter grade based on score/max_score
- Updates test results with calculated grades
- Generates class statistics

### 2. Report Generator (`report-generator/`)
**Purpose**: Generates monthly attendance and performance reports and stores them in S3.

**Schedule**: Runs daily at 2 AM UTC
**Trigger**: CloudWatch Events (EventBridge)
**Environment Variables**:
- `DATABASE_URL`: PostgreSQL connection string
- `S3_BUCKET_NAME`: S3 bucket for storing reports
- `AWS_REGION`: AWS region

**Functionality**:
- Generates attendance reports with student attendance rates
- Generates performance reports with grade statistics
- Uploads reports to S3 in JSON format
- Organizes reports by date in S3 structure

### 3. Email Notifications (`email-notifications/`)
**Purpose**: Sends automated email notifications for assignments, grades, and attendance alerts.

**Schedule**: Runs every 6 hours
**Trigger**: CloudWatch Events (EventBridge)
**Environment Variables**:
- `DATABASE_URL`: PostgreSQL connection string
- `FROM_EMAIL`: Email address for sending notifications
- `AWS_REGION`: AWS region

**Functionality**:
- Assignment due date reminders (24 hours before due)
- Grade update notifications (when grades are posted)
- Attendance alerts (for students with < 80% attendance)
- HTML email templates with personalized content

### 4. Data Cleanup (`data-cleanup/`)
**Purpose**: Performs maintenance tasks including data archival and cleanup.

**Schedule**: Runs weekly on Sunday at 3 AM UTC
**Trigger**: CloudWatch Events (EventBridge)
**Environment Variables**:
- `DATABASE_URL`: PostgreSQL connection string
- `S3_BUCKET_NAME`: S3 bucket for file cleanup
- `AWS_REGION`: AWS region

**Functionality**:
- Cleans up expired sessions and tokens (> 30 days)
- Removes old application logs (> 90 days)
- Deletes orphaned files in S3 (> 7 days old, not referenced in DB)
- Archives old attendance records (> 2 years) and test results (> 3 years)
- Optimizes database with ANALYZE and VACUUM

## Development

### Prerequisites
- Node.js 18+
- TypeScript
- AWS CLI configured
- Access to PostgreSQL database
- AWS permissions for Lambda, S3, SES, and CloudWatch

### Setup
```bash
# Install dependencies for all functions
npm install

# Install dependencies for individual functions
cd grade-calculator && npm install
cd ../report-generator && npm install
cd ../email-notifications && npm install
cd ../data-cleanup && npm install
```

### Testing
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Test individual functions
cd grade-calculator && npm test
```

### Building
```bash
# Build all functions
npm run build

# Build individual functions
npm run build:grade-calculator
npm run build:report-generator
npm run build:email-notifications
npm run build:data-cleanup
```

### Deployment

#### Manual Deployment
```bash
# Deploy all functions
npm run deploy

# Or deploy individually
cd grade-calculator && npm run package
aws lambda update-function-code --function-name classboard-grade-calculator --zip-file fileb://grade-calculator.zip
```

#### Terraform Deployment
The Lambda functions are deployed using Terraform configuration in `../aws/terraform/lambda.tf`.

```bash
cd ../aws/terraform
terraform plan
terraform apply
```

## Architecture

### Dependencies
- **@prisma/client**: Database ORM for PostgreSQL access
- **@aws-sdk/client-s3**: S3 operations for file management and report storage
- **@aws-sdk/client-ses**: Email sending via Amazon SES
- **aws-lambda**: Lambda runtime types and utilities

### Error Handling
- All functions include comprehensive error handling
- Database connections are properly closed in finally blocks
- Failed operations are logged with detailed error messages
- Functions continue processing other items if individual items fail

### Security
- Environment variables for sensitive configuration
- IAM roles with minimal required permissions
- Input validation and sanitization
- Secure database connections with connection pooling

### Monitoring
- CloudWatch logs for all function executions
- Structured logging with JSON format
- Performance metrics and error tracking
- Configurable log retention (14 days default)

## Configuration

### Environment Variables
Each function requires specific environment variables. See individual function directories for detailed requirements.

### IAM Permissions
The Lambda execution role requires permissions for:
- CloudWatch Logs (create log groups, streams, put events)
- RDS (describe instances, connect)
- S3 (get, put, delete objects, list bucket)
- SES (send email, send raw email)

### Scheduling
Functions are scheduled using CloudWatch Events (EventBridge) rules:
- Grade Calculator: `rate(1 hour)`
- Report Generator: `cron(0 2 * * ? *)`
- Email Notifications: `rate(6 hours)`
- Data Cleanup: `cron(0 3 ? * SUN *)`

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify DATABASE_URL environment variable
   - Check VPC configuration if Lambda is in VPC
   - Ensure RDS security groups allow Lambda access

2. **S3 Access Errors**
   - Verify S3_BUCKET_NAME environment variable
   - Check IAM permissions for S3 operations
   - Ensure bucket exists and is in correct region

3. **Email Sending Errors**
   - Verify SES configuration and verified email addresses
   - Check FROM_EMAIL environment variable
   - Ensure SES is enabled in the correct region

4. **Memory/Timeout Issues**
   - Increase memory allocation for data-intensive functions
   - Adjust timeout values for long-running operations
   - Consider pagination for large datasets

### Logs and Monitoring
- Check CloudWatch Logs for detailed execution logs
- Monitor CloudWatch metrics for function performance
- Set up CloudWatch alarms for error rates and duration

## Contributing

1. Follow TypeScript best practices
2. Write comprehensive tests for new functionality
3. Update documentation for any changes
4. Test locally before deploying
5. Use proper error handling and logging