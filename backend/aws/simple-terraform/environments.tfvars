environment  = "development"
aws_region   = "us-east-1"
project_name = "classboard"

# Database configuration (cost-optimized)
db_username = "classboard_admin"
db_instance_class = "db.t3.micro"
db_allocated_storage = 20
db_max_allocated_storage = 100
db_multi_az = false
db_backup_retention_period = 7

# CORS origin for development
cors_origin = "http://localhost:3000"

# Common tags
common_tags = {
  Project     = "ClassBoard"
  ManagedBy   = "Terraform"
  Environment = "development"
  Owner       = "Development Team"
  Purpose     = "SimplifiedDeployment"
}