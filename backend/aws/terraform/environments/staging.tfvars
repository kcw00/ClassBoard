environment  = "staging"
aws_region   = "us-east-1"
project_name = "classboard"

# Database configuration
db_username = "classboard_admin"
# db_password should be set via environment variable or AWS Secrets Manager

# Common tags
common_tags = {
  Project     = "ClassBoard"
  ManagedBy   = "Terraform"
  Environment = "staging"
  Owner       = "DevOps Team"
}