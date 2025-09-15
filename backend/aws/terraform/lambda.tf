# Lambda Functions for Background Processing

# IAM Role for Lambda functions
resource "aws_iam_role" "lambda_execution_role" {
  name = "${var.project_name}-${var.environment}-lambda-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-${var.environment}-lambda-execution-role"
    Environment = var.environment
  })
}

# IAM Policy for Lambda functions
resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.project_name}-${var.environment}-lambda-policy"
  role = aws_iam_role.lambda_execution_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBInstances",
          "rds:Connect"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.files.arn,
          "${aws_s3_bucket.files.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.db_password.arn,
          aws_secretsmanager_secret.app_config.arn
        ]
      }
    ]
  })
}

# Attach basic execution role
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Grade Calculator Lambda Function
resource "aws_lambda_function" "grade_calculator" {
  filename         = "../lambda/grade-calculator/grade-calculator.zip"
  function_name    = "${var.project_name}-${var.environment}-grade-calculator"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "dist/index.handler"
  runtime         = "nodejs18.x"
  timeout         = 300
  memory_size     = 512

  environment {
    variables = {
      DATABASE_URL = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.main.endpoint}/${aws_db_instance.main.db_name}"
      AWS_REGION   = var.aws_region
      ENVIRONMENT  = var.environment
    }
  }

  depends_on = [aws_db_instance.main]

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-${var.environment}-grade-calculator"
    Environment = var.environment
    Purpose     = "BackgroundProcessing"
  })
}

# Report Generator Lambda Function
resource "aws_lambda_function" "report_generator" {
  filename         = "../lambda/report-generator/report-generator.zip"
  function_name    = "${var.project_name}-${var.environment}-report-generator"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "dist/index.handler"
  runtime         = "nodejs18.x"
  timeout         = 600
  memory_size     = 1024

  environment {
    variables = {
      DATABASE_URL    = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.main.endpoint}/${aws_db_instance.main.db_name}"
      S3_BUCKET_NAME  = aws_s3_bucket.files.bucket
      AWS_REGION      = var.aws_region
      ENVIRONMENT     = var.environment
    }
  }

  depends_on = [aws_db_instance.main, aws_s3_bucket.files]

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-${var.environment}-report-generator"
    Environment = var.environment
    Purpose     = "BackgroundProcessing"
  })
}

# Email Notifications Lambda Function
resource "aws_lambda_function" "email_notifications" {
  filename         = "../lambda/email-notifications/email-notifications.zip"
  function_name    = "${var.project_name}-${var.environment}-email-notifications"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "dist/index.handler"
  runtime         = "nodejs18.x"
  timeout         = 300
  memory_size     = 512

  environment {
    variables = {
      DATABASE_URL = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.main.endpoint}/${aws_db_instance.main.db_name}"
      FROM_EMAIL   = var.from_email
      AWS_REGION   = var.aws_region
      ENVIRONMENT  = var.environment
    }
  }

  depends_on = [aws_db_instance.main]

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-${var.environment}-email-notifications"
    Environment = var.environment
    Purpose     = "BackgroundProcessing"
  })
}

# Data Cleanup Lambda Function
resource "aws_lambda_function" "data_cleanup" {
  filename         = "../lambda/data-cleanup/data-cleanup.zip"
  function_name    = "${var.project_name}-${var.environment}-data-cleanup"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "dist/index.handler"
  runtime         = "nodejs18.x"
  timeout         = 900
  memory_size     = 1024

  environment {
    variables = {
      DATABASE_URL    = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.main.endpoint}/${aws_db_instance.main.db_name}"
      S3_BUCKET_NAME  = aws_s3_bucket.files.bucket
      AWS_REGION      = var.aws_region
      ENVIRONMENT     = var.environment
    }
  }

  depends_on = [aws_db_instance.main, aws_s3_bucket.files]

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-${var.environment}-data-cleanup"
    Environment = var.environment
    Purpose     = "BackgroundProcessing"
  })
}

# CloudWatch Event Rules for Scheduling

# Grade Calculator - Run every hour
resource "aws_cloudwatch_event_rule" "grade_calculator_schedule" {
  name                = "${var.project_name}-${var.environment}-grade-calculator-schedule"
  description         = "Trigger grade calculator Lambda function"
  schedule_expression = "rate(1 hour)"

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-${var.environment}-grade-calculator-schedule"
    Environment = var.environment
  })
}

resource "aws_cloudwatch_event_target" "grade_calculator_target" {
  rule      = aws_cloudwatch_event_rule.grade_calculator_schedule.name
  target_id = "GradeCalculatorTarget"
  arn       = aws_lambda_function.grade_calculator.arn
}

resource "aws_lambda_permission" "allow_cloudwatch_grade_calculator" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.grade_calculator.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.grade_calculator_schedule.arn
}

# Report Generator - Run daily at 2 AM
resource "aws_cloudwatch_event_rule" "report_generator_schedule" {
  name                = "${var.project_name}-${var.environment}-report-generator-schedule"
  description         = "Trigger report generator Lambda function"
  schedule_expression = "cron(0 2 * * ? *)"

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-${var.environment}-report-generator-schedule"
    Environment = var.environment
  })
}

resource "aws_cloudwatch_event_target" "report_generator_target" {
  rule      = aws_cloudwatch_event_rule.report_generator_schedule.name
  target_id = "ReportGeneratorTarget"
  arn       = aws_lambda_function.report_generator.arn
}

resource "aws_lambda_permission" "allow_cloudwatch_report_generator" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.report_generator.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.report_generator_schedule.arn
}

# Email Notifications - Run every 6 hours
resource "aws_cloudwatch_event_rule" "email_notifications_schedule" {
  name                = "${var.project_name}-${var.environment}-email-notifications-schedule"
  description         = "Trigger email notifications Lambda function"
  schedule_expression = "rate(6 hours)"

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-${var.environment}-email-notifications-schedule"
    Environment = var.environment
  })
}

resource "aws_cloudwatch_event_target" "email_notifications_target" {
  rule      = aws_cloudwatch_event_rule.email_notifications_schedule.name
  target_id = "EmailNotificationsTarget"
  arn       = aws_lambda_function.email_notifications.arn
}

resource "aws_lambda_permission" "allow_cloudwatch_email_notifications" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.email_notifications.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.email_notifications_schedule.arn
}

# Data Cleanup - Run weekly on Sunday at 3 AM
resource "aws_cloudwatch_event_rule" "data_cleanup_schedule" {
  name                = "${var.project_name}-${var.environment}-data-cleanup-schedule"
  description         = "Trigger data cleanup Lambda function"
  schedule_expression = "cron(0 3 ? * SUN *)"

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-${var.environment}-data-cleanup-schedule"
    Environment = var.environment
  })
}

resource "aws_cloudwatch_event_target" "data_cleanup_target" {
  rule      = aws_cloudwatch_event_rule.data_cleanup_schedule.name
  target_id = "DataCleanupTarget"
  arn       = aws_lambda_function.data_cleanup.arn
}

resource "aws_lambda_permission" "allow_cloudwatch_data_cleanup" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.data_cleanup.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.data_cleanup_schedule.arn
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "grade_calculator_logs" {
  name              = "/aws/lambda/${aws_lambda_function.grade_calculator.function_name}"
  retention_in_days = var.environment == "production" ? 30 : 14

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-${var.environment}-grade-calculator-logs"
    Environment = var.environment
  })
}

resource "aws_cloudwatch_log_group" "report_generator_logs" {
  name              = "/aws/lambda/${aws_lambda_function.report_generator.function_name}"
  retention_in_days = var.environment == "production" ? 30 : 14

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-${var.environment}-report-generator-logs"
    Environment = var.environment
  })
}

resource "aws_cloudwatch_log_group" "email_notifications_logs" {
  name              = "/aws/lambda/${aws_lambda_function.email_notifications.function_name}"
  retention_in_days = var.environment == "production" ? 30 : 14

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-${var.environment}-email-notifications-logs"
    Environment = var.environment
  })
}

resource "aws_cloudwatch_log_group" "data_cleanup_logs" {
  name              = "/aws/lambda/${aws_lambda_function.data_cleanup.function_name}"
  retention_in_days = var.environment == "production" ? 30 : 14

  tags = merge(var.common_tags, {
    Name        = "${var.project_name}-${var.environment}-data-cleanup-logs"
    Environment = var.environment
  })
}

# Outputs
output "lambda_function_names" {
  description = "Names of all Lambda functions"
  value = {
    grade_calculator     = aws_lambda_function.grade_calculator.function_name
    report_generator     = aws_lambda_function.report_generator.function_name
    email_notifications  = aws_lambda_function.email_notifications.function_name
    data_cleanup        = aws_lambda_function.data_cleanup.function_name
  }
}

output "lambda_execution_role_arn" {
  description = "ARN of the Lambda execution role"
  value       = aws_iam_role.lambda_execution_role.arn
}