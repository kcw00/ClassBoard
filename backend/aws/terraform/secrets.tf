# AWS Secrets Manager for sensitive configuration

# Database password secret
resource "aws_secretsmanager_secret" "db_password" {
  name                    = "${var.project_name}-${var.environment}-db-password"
  description             = "Database password for ${var.project_name} ${var.environment}"
  recovery_window_in_days = var.environment == "production" ? 30 : 0

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-${var.environment}-db-password"
    Environment = var.environment
    Purpose     = "Database"
  })
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = var.db_password
}

# JWT secret for application
resource "aws_secretsmanager_secret" "jwt_secret" {
  name                    = "${var.project_name}-${var.environment}-jwt-secret"
  description             = "JWT secret for ${var.project_name} ${var.environment}"
  recovery_window_in_days = var.environment == "production" ? 30 : 0

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-${var.environment}-jwt-secret"
    Environment = var.environment
    Purpose     = "Authentication"
  })
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id = aws_secretsmanager_secret.jwt_secret.id
  secret_string = jsonencode({
    jwt_secret = var.jwt_secret != null ? var.jwt_secret : random_password.jwt_secret.result
  })
}

# Generate random JWT secret if not provided
resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}

# Application configuration secret
resource "aws_secretsmanager_secret" "app_config" {
  name                    = "${var.project_name}-${var.environment}-app-config"
  description             = "Application configuration for ${var.project_name} ${var.environment}"
  recovery_window_in_days = var.environment == "production" ? 30 : 0

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-${var.environment}-app-config"
    Environment = var.environment
    Purpose     = "Configuration"
  })
}

resource "aws_secretsmanager_secret_version" "app_config" {
  secret_id = aws_secretsmanager_secret.app_config.id
  secret_string = jsonencode({
    database_url         = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.main.endpoint}/${aws_db_instance.main.db_name}"
    cognito_user_pool_id = aws_cognito_user_pool.main.id
    cognito_client_id    = aws_cognito_user_pool_client.web.id
    s3_bucket_name       = aws_s3_bucket.files.bucket
    cloudfront_domain    = aws_cloudfront_distribution.files.domain_name
    aws_region          = var.aws_region
    from_email          = var.from_email
    cors_origin         = var.cors_origin
  })
}

# IAM policy for accessing secrets
resource "aws_iam_policy" "secrets_access" {
  name        = "${var.project_name}-${var.environment}-secrets-access"
  description = "Policy for accessing application secrets"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          aws_secretsmanager_secret.db_password.arn,
          aws_secretsmanager_secret.jwt_secret.arn,
          aws_secretsmanager_secret.app_config.arn
        ]
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-${var.environment}-secrets-access"
    Environment = var.environment
  })
}

# Variables are centralized in variables.tf

# Outputs
output "db_password_secret_arn" {
  description = "ARN of the database password secret"
  value       = aws_secretsmanager_secret.db_password.arn
}

output "jwt_secret_arn" {
  description = "ARN of the JWT secret"
  value       = aws_secretsmanager_secret.jwt_secret.arn
}

output "app_config_secret_arn" {
  description = "ARN of the application configuration secret"
  value       = aws_secretsmanager_secret.app_config.arn
}

output "secrets_access_policy_arn" {
  description = "ARN of the secrets access policy"
  value       = aws_iam_policy.secrets_access.arn
}