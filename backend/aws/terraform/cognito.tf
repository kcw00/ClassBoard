# Cognito User Pool
resource "aws_cognito_user_pool" "main" {
  name = "${var.project_name}-${var.environment}-UserPool"

  # Password policy
  password_policy {
    minimum_length                   = var.environment == "production" ? 12 : 8
    require_uppercase                = true
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = var.environment == "production" ? true : false
    temporary_password_validity_days = var.environment == "production" ? 1 : 7
  }

  # User attributes
  auto_verified_attributes = ["email"]
  username_attributes      = ["email"]

  # Email configuration
  dynamic "email_configuration" {
    for_each = var.environment == "production" ? [1] : []
    content {
      email_sending_account = "DEVELOPER"
      source_arn           = "arn:aws:ses:${var.aws_region}:${data.aws_caller_identity.current.account_id}:identity/noreply@classboard.app"
    }
  }

  dynamic "email_configuration" {
    for_each = var.environment != "production" ? [1] : []
    content {
      email_sending_account = "COGNITO_DEFAULT"
    }
  }

  # Verification message template
  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "ClassBoard - Verify your email"
    email_message        = "Your verification code is {####}"
  }

  # MFA configuration
  mfa_configuration = var.environment == "production" ? "ON" : "OPTIONAL"
  software_token_mfa_configuration {
    enabled = true
  }

  # Account recovery
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # Advanced security
  user_pool_add_ons {
    advanced_security_mode = var.environment == "development" ? "AUDIT" : "ENFORCED"
  }

  # Custom attributes
  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true
  }

  schema {
    name                = "name"
    attribute_data_type = "String"
    required            = true
    mutable             = true
  }

  schema {
    name                = "role"
    attribute_data_type = "String"
    required            = false
    mutable             = true
    string_attribute_constraints {
      min_length = 1
      max_length = 20
    }
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-UserPool"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Cognito User Pool Client
resource "aws_cognito_user_pool_client" "web" {
  name         = "${var.project_name}-${var.environment}-WebClient"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret = false

  # Token validity
  refresh_token_validity = 30
  access_token_validity  = var.environment == "production" ? 15 : 60
  id_token_validity      = var.environment == "production" ? 15 : 60

  token_validity_units {
    refresh_token = "days"
    access_token  = "minutes"
    id_token      = "minutes"
  }

  # Attributes
  read_attributes  = ["email", "name", "custom:role"]
  write_attributes = ["name", "custom:role"]

  # Auth flows
  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]

  # Security
  prevent_user_existence_errors = "ENABLED"

  # OAuth configuration
  supported_identity_providers = ["COGNITO"]
  
  callback_urls = var.environment == "production" ? [
    "https://classboard.app/auth/callback"
  ] : (var.environment == "staging" ? [
    "https://staging.classboard.app/auth/callback"
  ] : [
    "http://localhost:5173/auth/callback"
  ])

  logout_urls = var.environment == "production" ? [
    "https://classboard.app/auth/logout"
  ] : (var.environment == "staging" ? [
    "https://staging.classboard.app/auth/logout"
  ] : [
    "http://localhost:5173/auth/logout"
  ])

  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]
  allowed_oauth_flows_user_pool_client = true
}

# Cognito User Pool Domain (for hosted UI)
resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${var.project_name}-${var.environment}-auth"
  user_pool_id = aws_cognito_user_pool.main.id
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}

# Outputs
output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_user_pool_arn" {
  description = "Cognito User Pool ARN"
  value       = aws_cognito_user_pool.main.arn
}

output "cognito_client_id" {
  description = "Cognito User Pool Client ID"
  value       = aws_cognito_user_pool_client.web.id
}

output "cognito_domain" {
  description = "Cognito User Pool Domain"
  value       = aws_cognito_user_pool_domain.main.domain
}