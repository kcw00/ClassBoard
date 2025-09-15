# AWS Cost Optimization Recommendations

## Current Production Cost Drivers

### 1. RDS Database (~$300-400/month)
**Current**: `db.r5.large` with Multi-AZ, 100GB storage
**Monthly Cost**: ~$300-400

#### Optimization Options:
- **Option A (Conservative)**: Switch to `db.t3.medium` (~$60/month)
  - Still provides burst performance
  - Reduces cost by ~80%
  - Suitable for most web applications

- **Option B (Aggressive)**: Switch to `db.t3.small` (~$30/month)
  - Good for lower traffic applications
  - Monitor CPU credits carefully
  - Can scale up if needed

- **Multi-AZ Consideration**: 
  - Adds 100% to RDS costs
  - Consider disabling for cost savings if RPO allows
  - Alternative: Use read replicas for redundancy

### 2. NAT Gateway (~$45/month)
**Current**: Single NAT Gateway
**Monthly Cost**: ~$45 + data processing

#### Optimization Options:
- **Option A**: NAT Instance instead of NAT Gateway (~$10/month)
  - Requires management overhead
  - Single point of failure
  - Good for development/staging

- **Option B**: VPC Endpoints for AWS services
  - Eliminates NAT Gateway traffic for S3, DynamoDB
  - ~$7.50/month per endpoint
  - Worth it for high S3 usage

### 3. Storage Costs
**Current**: 100GB RDS storage, S3 buckets

#### Optimization Options:
- **RDS Storage**: Start with 50GB, enable auto-scaling
- **S3 Lifecycle**: Implement intelligent tiering
  - Standard → IA after 30 days
  - IA → Glacier after 90 days
  - Delete incomplete multipart uploads after 7 days

### 4. Performance Insights (~$20/month)
**Current**: 31-day retention
**Alternative**: 7-day free tier

## Recommended Production Configuration

### Tier 1: Conservative (~$150/month total)
```hcl
# RDS Configuration
instance_class = "db.t3.medium"
multi_az = false
allocated_storage = 50
performance_insights_retention_period = 7

# Enable read replica for HA instead of Multi-AZ
enable_read_replica = true
read_replica_instance_class = "db.t3.small"
```

### Tier 2: Budget-Conscious (~$80/month total)
```hcl
# RDS Configuration
instance_class = "db.t3.small"
multi_az = false
allocated_storage = 30
performance_insights_retention_period = 7

# No read replica initially
enable_read_replica = false
```

## Reserved Instances Savings
- **1-Year Term**: 38% savings
- **3-Year Term**: 60% savings
- Consider for stable workloads

## Monitoring & Alerting for Cost Control

### CloudWatch Billing Alerts
```json
{
  "alertThreshold": 200,
  "period": "monthly",
  "actions": ["email", "slack"]
}
```

### Resource Right-Sizing
- Enable AWS Compute Optimizer
- Review CloudWatch metrics monthly
- Set up Lambda to stop non-production resources after hours

## Implementation Plan

### Phase 1: Immediate (No Downtime)
1. Reduce Performance Insights retention to 7 days
2. Implement S3 lifecycle policies
3. Set up billing alerts

### Phase 2: Planned Maintenance Window
1. Downgrade RDS instance class
2. Disable Multi-AZ (if acceptable)
3. Reduce storage allocation

### Phase 3: Advanced Optimization
1. Consider NAT Instance vs NAT Gateway
2. Implement VPC endpoints for frequently used services
3. Purchase Reserved Instances for stable resources

## Cost Monitoring Tools
- AWS Cost Explorer
- AWS Budgets
- Third-party tools: CloudHealth, Cloudability

## Expected Monthly Savings
- **Current Estimated Cost**: ~$450/month
- **Tier 1 Optimized**: ~$150/month (67% savings)
- **Tier 2 Optimized**: ~$80/month (82% savings)

---

*Note: Costs are estimates and may vary based on actual usage, region, and AWS pricing changes.*