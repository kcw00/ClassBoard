# S3 Bucket for file storage
resource "aws_s3_bucket" "files" {
  bucket = "${var.project_name}-${var.environment}-files"

  tags = {
    Name        = "${var.project_name}-${var.environment}-files"
    Environment = var.environment
    Project     = var.project_name
    Purpose     = "FileStorage"
  }
}

# S3 Bucket versioning
resource "aws_s3_bucket_versioning" "files" {
  bucket = aws_s3_bucket.files.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "files" {
  bucket = aws_s3_bucket.files.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# S3 Bucket public access block
resource "aws_s3_bucket_public_access_block" "files" {
  bucket = aws_s3_bucket.files.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket lifecycle configuration
resource "aws_s3_bucket_lifecycle_configuration" "files" {
  bucket = aws_s3_bucket.files.id

  rule {
    id     = "delete_incomplete_multipart_uploads"
    status = "Enabled"

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }

  rule {
    id     = "transition_to_ia"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    dynamic "transition" {
      for_each = var.environment == "production" ? [1] : []
      content {
        days          = 90
        storage_class = "GLACIER"
      }
    }
  }
}

# S3 Bucket CORS configuration
resource "aws_s3_bucket_cors_configuration" "files" {
  bucket = aws_s3_bucket.files.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = var.environment == "production" ? ["https://classboard.app"] : (var.environment == "staging" ? ["https://staging.classboard.app"] : ["http://localhost:5173", "http://localhost:3000"])
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "files" {
  comment = "${var.project_name} ${var.environment} OAI for S3"
}

# S3 Bucket policy for CloudFront
resource "aws_s3_bucket_policy" "files" {
  bucket = aws_s3_bucket.files.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontAccess"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.files.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.files.arn}/*"
      }
    ]
  })
}

# S3 Bucket for logs (staging and production only)
resource "aws_s3_bucket" "logs" {
  count  = var.environment != "development" ? 1 : 0
  bucket = "${var.project_name}-${var.environment}-logs"

  tags = {
    Name        = "${var.project_name}-${var.environment}-logs"
    Environment = var.environment
    Project     = var.project_name
    Purpose     = "Logging"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  count  = var.environment != "development" ? 1 : 0
  bucket = aws_s3_bucket.logs[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  count  = var.environment != "development" ? 1 : 0
  bucket = aws_s3_bucket.logs[0].id

  rule {
    id     = "delete_old_logs"
    status = "Enabled"

    expiration {
      days = var.environment == "production" ? 90 : 30
    }
  }
}

# Outputs
output "s3_bucket_name" {
  description = "S3 bucket name for files"
  value       = aws_s3_bucket.files.bucket
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN for files"
  value       = aws_s3_bucket.files.arn
}

output "cloudfront_oai_iam_arn" {
  description = "CloudFront Origin Access Identity IAM ARN"
  value       = aws_cloudfront_origin_access_identity.files.iam_arn
}