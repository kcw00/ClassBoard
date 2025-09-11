# RDS Instance
resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-${var.environment}-db"

  # Engine configuration
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = coalesce(
    var.db_instance_class,
    var.environment == "production" ? "db.r5.large" : (var.environment == "staging" ? "db.t3.small" : "db.t3.micro")
  )

  # Storage configuration
  allocated_storage = coalesce(
    var.db_allocated_storage,
    var.environment == "production" ? 100 : (var.environment == "staging" ? 50 : 20)
  )
  max_allocated_storage = coalesce(
    var.db_max_allocated_storage,
    var.environment == "production" ? 1000 : (var.environment == "staging" ? 500 : 100)
  )
  storage_type      = "gp2"
  storage_encrypted = true

  # Database configuration
  db_name  = "classboard_${var.environment}"
  username = var.db_username
  password = var.db_password

  # Network configuration
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  publicly_accessible    = false

  # Backup configuration
  backup_retention_period = coalesce(
    var.db_backup_retention_period,
    var.environment == "production" ? 30 : (var.environment == "staging" ? 14 : 7)
  )
  backup_window      = "03:00-04:00"
  maintenance_window = "sun:04:00-sun:05:00"

  # High availability
  multi_az = coalesce(
    var.db_multi_az,
    var.environment == "production" ? true : false
  )

  # Monitoring
  performance_insights_enabled = true
  performance_insights_retention_period = coalesce(
    var.db_performance_insights_retention,
    var.environment == "production" ? 31 : 7
  )
  monitoring_interval                 = 60
  monitoring_role_arn                 = aws_iam_role.rds_enhanced_monitoring.arn
  enabled_cloudwatch_logs_exports     = ["postgresql"]

  # Maintenance
  auto_minor_version_upgrade = var.environment == "production" ? false : true
  deletion_protection        = var.environment == "production" ? true : false

  # Skip final snapshot for non-production environments
  skip_final_snapshot       = var.environment != "production"
  final_snapshot_identifier = var.environment == "production" ? "${var.project_name}-${var.environment}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null

  tags = {
    Name        = "${var.project_name}-${var.environment}-db"
    Environment = var.environment
    Project     = var.project_name
  }
}

# IAM Role for RDS Enhanced Monitoring
resource "aws_iam_role" "rds_enhanced_monitoring" {
  name = "${var.project_name}-${var.environment}-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-${var.environment}-rds-monitoring-role"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  role       = aws_iam_role.rds_enhanced_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# Variables for RDS
variable "db_username" {
  description = "Database username"
  type        = string
  default     = "classboard_admin"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "Database instance class"
  type        = string
  default     = null
}

variable "db_allocated_storage" {
  description = "Database allocated storage in GB"
  type        = number
  default     = null
}

variable "db_max_allocated_storage" {
  description = "Database maximum allocated storage in GB"
  type        = number
  default     = null
}

variable "db_multi_az" {
  description = "Enable Multi-AZ deployment"
  type        = bool
  default     = null
}

variable "db_backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = null
}

variable "db_performance_insights_retention" {
  description = "Performance Insights retention period in days"
  type        = number
  default     = null
}

variable "enable_read_replica" {
  description = "Enable read replica"
  type        = bool
  default     = false
}

variable "read_replica_instance_class" {
  description = "Read replica instance class"
  type        = string
  default     = "db.t3.micro"
}

# Outputs
output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "rds_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

# Read Replica (optional, for cost-effective HA)
resource "aws_db_instance" "read_replica" {
  count = var.enable_read_replica ? 1 : 0

  identifier             = "${var.project_name}-${var.environment}-db-replica"
  replicate_source_db    = aws_db_instance.main.identifier
  instance_class         = var.read_replica_instance_class
  publicly_accessible    = false
  auto_minor_version_upgrade = true
  
  # Read replica inherits most settings from source
  # But can have different instance class for cost optimization
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-db-replica"
    Environment = var.environment
    Project     = var.project_name
    Type        = "read-replica"
  }
}

output "rds_database_name" {
  description = "RDS database name"
  value       = aws_db_instance.main.db_name
}

output "rds_read_replica_endpoint" {
  description = "RDS read replica endpoint"
  value       = var.enable_read_replica ? aws_db_instance.read_replica[0].endpoint : null
}