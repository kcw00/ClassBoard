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

# Tags
variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Project   = "ClassBoard"
    ManagedBy = "Terraform"
  }
}