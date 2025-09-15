# Core variables
variable "environment" {
  description = "Environment name (development, staging, production)"
  type        = string
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be one of: development, staging, production."
  }
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "classboard"
}

# Database variables
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

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "classboard"
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

# Email and notification variables
variable "from_email" {
  description = "From email address for notifications"
  type        = string
  default     = "noreply@classboard.app"
}

variable "alert_email" {
  description = "Email address for alerts"
  type        = string
  default     = null
}

# Security variables
variable "jwt_secret" {
  description = "JWT secret for token signing (optional, will be generated if not provided)"
  type        = string
  default     = null
  sensitive   = true
}

variable "cors_origin" {
  description = "CORS origin for the frontend application"
  type        = string
  default     = null
}

# Backup variables
variable "backup_region" {
  description = "AWS region for backup storage"
  type        = string
  default     = "us-west-2"
}

# Tags
variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Project   = "ClassBoard"
    ManagedBy = "Terraform"
  }
}