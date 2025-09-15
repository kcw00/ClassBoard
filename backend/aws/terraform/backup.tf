# AWS Backup Configuration for Disaster Recovery

# IAM Role for AWS Backup
resource "aws_iam_role" "backup_role" {
  name = "${var.project_name}-${var.environment}-backup-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-${var.environment}-backup-role"
    Environment = var.environment
  })
}

# Attach AWS managed backup policy
resource "aws_iam_role_policy_attachment" "backup_policy" {
  role       = aws_iam_role.backup_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

# Backup vault
resource "aws_backup_vault" "main" {
  name        = "${var.project_name}-${var.environment}-backup-vault"
  kms_key_arn = aws_kms_key.backup.arn

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-${var.environment}-backup-vault"
    Environment = var.environment
  })
}

# KMS key for backup encryption
resource "aws_kms_key" "backup" {
  description             = "KMS key for ${var.project_name} ${var.environment} backups"
  deletion_window_in_days = var.environment == "production" ? 30 : 7

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-${var.environment}-backup-key"
    Environment = var.environment
  })
}

resource "aws_kms_alias" "backup" {
  name          = "alias/${var.project_name}-${var.environment}-backup"
  target_key_id = aws_kms_key.backup.key_id
}

# Backup plan
resource "aws_backup_plan" "main" {
  name = "${var.project_name}-${var.environment}-backup-plan"

  # Daily backups
  rule {
    rule_name         = "daily_backups"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 5 ? * * *)"  # 5 AM UTC daily

    lifecycle {
      cold_storage_after = var.environment == "production" ? 30 : null
      delete_after       = var.environment == "production" ? 365 : 90
    }

    recovery_point_tags = merge(var.common_tags, {
      BackupType = "Daily"
    })
  }

  # Weekly backups (production only)
  dynamic "rule" {
    for_each = var.environment == "production" ? [1] : []
    content {
      rule_name         = "weekly_backups"
      target_vault_name = aws_backup_vault.main.name
      schedule          = "cron(0 3 ? * SUN *)"  # 3 AM UTC every Sunday

      lifecycle {
        cold_storage_after = 90
        delete_after       = 2555  # 7 years
      }

      recovery_point_tags = merge(var.common_tags, {
        BackupType = "Weekly"
      })
    }
  }

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-${var.environment}-backup-plan"
    Environment = var.environment
  })
}

# Backup selection for RDS
resource "aws_backup_selection" "rds" {
  iam_role_arn = aws_iam_role.backup_role.arn
  name         = "${var.project_name}-${var.environment}-rds-backup"
  plan_id      = aws_backup_plan.main.id

  resources = [
    aws_db_instance.main.arn
  ]

  condition {
    string_equals {
      key   = "aws:ResourceTag/Environment"
      value = var.environment
    }
  }
}

# S3 Cross-Region Replication (Production only)
resource "aws_s3_bucket" "backup" {
  count  = var.environment == "production" ? 1 : 0
  bucket = "${var.project_name}-${var.environment}-backup-${var.backup_region}"

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-${var.environment}-backup"
    Environment = var.environment
    Purpose     = "Backup"
  })

  provider = aws.backup_region
}

resource "aws_s3_bucket_versioning" "backup" {
  count  = var.environment == "production" ? 1 : 0
  bucket = aws_s3_bucket.backup[0].id
  versioning_configuration {
    status = "Enabled"
  }

  provider = aws.backup_region
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backup" {
  count  = var.environment == "production" ? 1 : 0
  bucket = aws_s3_bucket.backup[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }

  provider = aws.backup_region
}

# IAM role for S3 replication
resource "aws_iam_role" "replication" {
  count = var.environment == "production" ? 1 : 0
  name  = "${var.project_name}-${var.environment}-s3-replication-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-${var.environment}-s3-replication-role"
    Environment = var.environment
  })
}

resource "aws_iam_policy" "replication" {
  count = var.environment == "production" ? 1 : 0
  name  = "${var.project_name}-${var.environment}-s3-replication-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl"
        ]
        Effect = "Allow"
        Resource = "${aws_s3_bucket.files.arn}/*"
      },
      {
        Action = [
          "s3:ListBucket"
        ]
        Effect = "Allow"
        Resource = aws_s3_bucket.files.arn
      },
      {
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete"
        ]
        Effect = "Allow"
        Resource = "${aws_s3_bucket.backup[0].arn}/*"
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-${var.environment}-s3-replication-policy"
    Environment = var.environment
  })
}

resource "aws_iam_role_policy_attachment" "replication" {
  count      = var.environment == "production" ? 1 : 0
  role       = aws_iam_role.replication[0].name
  policy_arn = aws_iam_policy.replication[0].arn
}

# S3 bucket replication configuration
resource "aws_s3_bucket_replication_configuration" "replication" {
  count  = var.environment == "production" ? 1 : 0
  role   = aws_iam_role.replication[0].arn
  bucket = aws_s3_bucket.files.id

  rule {
    id     = "replicate_all"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.backup[0].arn
      storage_class = "STANDARD_IA"
    }
  }

  depends_on = [aws_s3_bucket_versioning.files]
}

# Variables are centralized in variables.tf

# Provider for backup region
provider "aws" {
  alias  = "backup_region"
  region = var.backup_region
}

# Outputs
output "backup_vault_arn" {
  description = "Backup vault ARN"
  value       = aws_backup_vault.main.arn
}

output "backup_plan_arn" {
  description = "Backup plan ARN"
  value       = aws_backup_plan.main.arn
}

output "backup_kms_key_arn" {
  description = "Backup KMS key ARN"
  value       = aws_kms_key.backup.arn
}