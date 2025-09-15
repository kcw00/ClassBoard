environment  = "production"
aws_region   = "us-east-1"
project_name = "classboard"

# Database configuration for production
db_username = "classboard_admin"
db_instance_class = "db.r5.large"
db_allocated_storage = 100
db_max_allocated_storage = 1000
db_multi_az = true
db_backup_retention_period = 30
db_performance_insights_retention = 31
enable_read_replica = true
read_replica_instance_class = "db.r5.large"

# Email configuration
from_email = "noreply@classboard.app"

# Common tags
common_tags = {
  Project     = "ClassBoard"
  ManagedBy   = "Terraform"
  Environment = "production"
  Owner       = "Platform Team"
  CostCenter  = "Engineering"
}