# Example Terraform Variables File
# Copy this file to terraform.tfvars and fill in your values

# Core Configuration
environment  = "development"  # development, staging, production
aws_region   = "us-east-1"
project_name = "classboard"

# Database Configuration
db_username = "classboard_admin"
# db_password should be set via environment variable TF_VAR_db_password
# export TF_VAR_db_password="your-secure-password"

# Optional Database Configuration (defaults will be used if not specified)
# db_instance_class = "db.t3.micro"
# db_allocated_storage = 20
# db_max_allocated_storage = 100
# db_multi_az = false
# db_backup_retention_period = 7
# db_performance_insights_retention = 7

# Email Configuration
from_email = "noreply@classboard.app"

# Common Tags
common_tags = {
  Project     = "ClassBoard"
  ManagedBy   = "Terraform"
  Environment = "development"
  Owner       = "Development Team"
  CostCenter  = "Engineering"
}