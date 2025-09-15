environment  = "staging"
aws_region   = "us-east-1"
project_name = "classboard"

# Database configuration for staging
db_username = "classboard_admin"
db_instance_class = "db.t3.small"
db_allocated_storage = 50
db_max_allocated_storage = 500
db_multi_az = false
db_backup_retention_period = 14
db_performance_insights_retention = 7

# Email configuration
from_email = "noreply-staging@classboard.app"

# Common tags
common_tags = {
  Project     = "ClassBoard"
  ManagedBy   = "Terraform"
  Environment = "staging"
  Owner       = "Platform Team"
  CostCenter  = "Engineering"
}