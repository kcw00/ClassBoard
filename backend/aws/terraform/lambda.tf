# Lambda Functions for Background Processing

# IAM Role for Lambda functions
resource "aws_iam_role" "lambda_execution_role" {
  name = "${var.project_name}-lambda-execution-role"

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
}

# IAM Policy for Lambda functions
resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.project_name}-lambda-policy"
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
          aws_s3_bucket.file_storage.arn,
          "${aws_s3_bucket.file_storage.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
      }
    ]
  })
}

# Grade Calculator Lambda Function
resource "aws_lambda_function" "grade_calculator" {
  filename         = "../lambda/grade-calculator/grade-calculator.zip"
  function_name    = "${var.project_name}-grade-calculator"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "dist/index.handler"
  runtime         = "nodejs18.x"
  timeout         = 300
  memory_size     = 512

  environment {
    variables = {
      DATABASE_URL = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.postgres.endpoint}/${var.db_name}"
      AWS_REGION   = var.aws_region
    }
  }

  depends_on = [aws_db_instance.postgres]
}

# Report Generator Lambda Function
resource "aws_lambda_function" "report_generator" {
  filename         = "../lambda/report-generator/report-generator.zip"
  function_name    = "${var.project_name}-report-generator"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "dist/index.handler"
  runtime         = "nodejs18.x"
  timeout         = 600
  memory_size     = 1024

  environment {
    variables = {
      DATABASE_URL    = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.postgres.endpoint}/${var.db_name}"
      S3_BUCKET_NAME  = aws_s3_bucket.file_storage.bucket
      AWS_REGION      = var.aws_region
    }
  }

  depends_on = [aws_db_instance.postgres, aws_s3_bucket.file_storage]
}

# Email Notifications Lambda Function
resource "aws_lambda_function" "email_notifications" {
  filename         = "../lambda/email-notifications/email-notifications.zip"
  function_name    = "${var.project_name}-email-notifications"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "dist/index.handler"
  runtime         = "nodejs18.x"
  timeout         = 300
  memory_size     = 512

  environment {
    variables = {
      DATABASE_URL = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.postgres.endpoint}/${var.db_name}"
      FROM_EMAIL   = var.from_email
      AWS_REGION   = var.aws_region
    }
  }

  depends_on = [aws_db_instance.postgres]
}

# Data Cleanup Lambda Function
resource "aws_lambda_function" "data_cleanup" {
  filename         = "../lambda/data-cleanup/data-cleanup.zip"
  function_name    = "${var.project_name}-data-cleanup"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "dist/index.handler"
  runtime         = "nodejs18.x"
  timeout         = 900
  memory_size     = 1024

  environment {
    variables = {
      DATABASE_URL    = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.postgres.endpoint}/${var.db_name}"
      S3_BUCKET_NAME  = aws_s3_bucket.file_storage.bucket
      AWS_REGION      = var.aws_region
    }
  }

  depends_on = [aws_db_instance.postgres, aws_s3_bucket.file_storage]
}

# CloudWatch Event Rules for Scheduling

# Grade Calculator - Run every hour
resource "aws_cloudwatch_event_rule" "grade_calculator_schedule" {
  name                = "${var.project_name}-grade-calculator-schedule"
  description         = "Trigger grade calculator Lambda function"
  schedule_expression = "rate(1 hour)"
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
  name                = "${var.project_name}-report-generator-schedule"
  description         = "Trigger report generator Lambda function"
  schedule_expression = "cron(0 2 * * ? *)"
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
  name                = "${var.project_name}-email-notifications-schedule"
  description         = "Trigger email notifications Lambda function"
  schedule_expression = "rate(6 hours)"
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
  name                = "${var.project_name}-data-cleanup-schedule"
  description         = "Trigger data cleanup Lambda function"
  schedule_expression = "cron(0 3 ? * SUN *)"
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
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "report_generator_logs" {
  name              = "/aws/lambda/${aws_lambda_function.report_generator.function_name}"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "email_notifications_logs" {
  name              = "/aws/lambda/${aws_lambda_function.email_notifications.function_name}"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "data_cleanup_logs" {
  name              = "/aws/lambda/${aws_lambda_function.data_cleanup.function_name}"
  retention_in_days = 14
}