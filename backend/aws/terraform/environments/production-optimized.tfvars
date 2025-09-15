environment  = "production"
aws_region   = "us-east-1"
project_name = "classboard"

# Database configuration - Cost Optimized
db_username = "classboard_admin"
# Use db.t3.medium instead of db.r5.large for ~80% cost savings
# Still provides good performance with burst capability
db_instance_class = "db.t3.medium"
db_allocated_storage = 50  # Start smaller, auto-scaling enabled
db_max_allocated_storage = 200
db_multi_az = false  # Single AZ to reduce costs
db_backup_retention_period = 14  # Reduced from 30 days
db_performance_insights_retention = 7  # Use free tier

# Enable read replica for HA instead of expensive Multi-AZ
enable_read_replica = true
read_replica_instance_class = "db.t3.small"

# Common tags
common_tags = {
  Project     = "ClassBoard"
  ManagedBy   = "Terraform"
  Environment = "production-optimized"
  Owner       = "Platform Team"
  CostCenter  = "Engineering"
  CostTier    = "optimized"
}