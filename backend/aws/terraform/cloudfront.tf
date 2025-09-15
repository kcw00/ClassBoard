# CloudFront Distribution
resource "aws_cloudfront_distribution" "files" {
  origin {
    domain_name = aws_s3_bucket.files.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.files.bucket}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.files.cloudfront_access_identity_path
    }
  }

  enabled = true
  comment = "${var.project_name} ${var.environment} CDN Distribution"

  # Price class based on environment
  price_class = var.environment == "production" ? "PriceClass_All" : "PriceClass_100"

  # Default cache behavior
  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.files.bucket}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    # Use AWS managed cache policies
    cache_policy_id          = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # Managed-CachingOptimized
    origin_request_policy_id = "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf" # Managed-CORS-S3Origin
  }

  # Cache behavior for profile pictures
  ordered_cache_behavior {
    path_pattern           = "/profile-pictures/*"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.files.bucket}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    # Use caching optimized for images
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6" # Managed-CachingOptimizedForUncompressedObjects

    min_ttl     = 0
    default_ttl = 86400   # 1 day
    max_ttl     = 31536000 # 1 year
  }

  # Cache behavior for documents
  ordered_cache_behavior {
    path_pattern           = "/documents/*"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.files.bucket}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    cache_policy_id = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # Managed-CachingOptimized
  }

  # Geographic restrictions (none for now)
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # SSL certificate
  viewer_certificate {
    cloudfront_default_certificate = true
  }

  # Custom error responses
  custom_error_response {
    error_code         = 403
    response_code      = 404
    response_page_path = "/404.html"
    error_caching_min_ttl = 300
  }

  # Logging configuration (staging and production only)
  dynamic "logging_config" {
    for_each = var.environment != "development" ? [1] : []
    content {
      include_cookies = false
      bucket          = aws_s3_bucket.logs[0].bucket_domain_name
      prefix          = "cloudfront-logs/"
    }
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-cdn"
    Environment = var.environment
    Project     = var.project_name
    Purpose     = "CDN"
  }
}

# Outputs
output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.files.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.files.domain_name
}

output "cloudfront_hosted_zone_id" {
  description = "CloudFront distribution hosted zone ID"
  value       = aws_cloudfront_distribution.files.hosted_zone_id
}