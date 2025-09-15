# Production Deployment Checklist

Use this checklist to ensure all steps are completed for a successful production deployment.

## Pre-Deployment Preparation

### ✅ Environment Setup
- [ ] AWS CLI installed and configured with production credentials
- [ ] Terraform v1.0+ installed
- [ ] Node.js v18+ installed
- [ ] Required environment variables set:
  - [ ] `TF_VAR_db_password` (secure production password)
  - [ ] `TF_VAR_alert_email` (admin email for alerts)
  - [ ] `TF_VAR_cors_origin` (production frontend domain)

### ✅ Security Review
- [ ] Database password meets security requirements (12+ chars, mixed case, numbers, symbols)
- [ ] JWT secret is cryptographically secure (64+ random characters)
- [ ] CORS origin is set to production domain only
- [ ] Alert email is monitored 24/7
- [ ] AWS credentials have minimal required permissions

### ✅ Code Preparation
- [ ] All tests passing in CI/CD pipeline
- [ ] Security audit completed with no high-severity issues
- [ ] Performance tests meet requirements
- [ ] Lambda functions built and packaged
- [ ] Database migrations tested and ready

## Infrastructure Deployment

### ✅ Terraform Validation
- [ ] Configuration validated: `terraform validate`
- [ ] Plan reviewed and approved: `./deploy-production.sh plan`
- [ ] No unexpected resource changes in plan
- [ ] Estimated costs reviewed and approved

### ✅ Infrastructure Deployment
- [ ] Production infrastructure deployed: `./deploy-production.sh apply`
- [ ] All resources created successfully
- [ ] No errors in Terraform output
- [ ] Environment variables generated: `./set-env-vars.sh production`

### ✅ Post-Infrastructure Validation
- [ ] RDS instance accessible and healthy
- [ ] S3 bucket created with proper permissions
- [ ] CloudFront distribution deployed and accessible
- [ ] Cognito user pool configured correctly
- [ ] Lambda functions deployed and scheduled
- [ ] Secrets Manager secrets created
- [ ] Monitoring and alerting configured

## Application Deployment

### ✅ Database Setup
- [ ] Database migrations executed successfully
- [ ] Database seeded with initial data (if required)
- [ ] Database connectivity tested from application
- [ ] Performance Insights enabled and monitoring

### ✅ Application Deployment
- [ ] Application code deployed to production servers
- [ ] Environment variables loaded correctly
- [ ] Application starts without errors
- [ ] Health check endpoints responding
- [ ] API endpoints accessible and functional

### ✅ File Storage Configuration
- [ ] S3 file uploads working correctly
- [ ] CloudFront serving files with proper caching
- [ ] File permissions and security working
- [ ] CORS configuration allowing frontend access

### ✅ Authentication Setup
- [ ] Cognito user pool accessible
- [ ] User registration working
- [ ] User login/logout working
- [ ] JWT token generation and validation working
- [ ] MFA configuration tested (if enabled)

## Testing and Validation

### ✅ Smoke Tests
- [ ] Health check endpoints responding
- [ ] Database connectivity confirmed
- [ ] File upload/download working
- [ ] User authentication flow working
- [ ] Critical API endpoints responding

### ✅ Integration Tests
- [ ] Frontend can connect to backend APIs
- [ ] File uploads work from frontend
- [ ] User authentication works end-to-end
- [ ] Data persistence working correctly
- [ ] Email notifications working (if applicable)

### ✅ Performance Tests
- [ ] API response times within acceptable limits
- [ ] Database query performance acceptable
- [ ] File download speeds acceptable via CloudFront
- [ ] Concurrent user load testing passed
- [ ] Memory and CPU usage within normal ranges

### ✅ Security Tests
- [ ] HTTPS enforced on all endpoints
- [ ] CORS properly configured
- [ ] Input validation working
- [ ] Authentication required for protected endpoints
- [ ] File upload security working (virus scanning, type validation)

## Monitoring and Alerting

### ✅ CloudWatch Setup
- [ ] Dashboard accessible and showing metrics
- [ ] All alarms configured and active
- [ ] Log groups created and receiving logs
- [ ] SNS topic configured for alerts
- [ ] Email notifications working

### ✅ Backup and Recovery
- [ ] AWS Backup plan active and running
- [ ] Database backups completing successfully
- [ ] S3 cross-region replication working (production only)
- [ ] Recovery procedures documented and tested

## Go-Live Checklist

### ✅ DNS and Domain Setup
- [ ] Production domain pointing to correct endpoints
- [ ] SSL certificates valid and properly configured
- [ ] CDN domain configured for file serving
- [ ] All subdomains properly configured

### ✅ Final Validation
- [ ] End-to-end user workflows tested
- [ ] All critical features working
- [ ] Performance acceptable under load
- [ ] Monitoring showing healthy status
- [ ] Team notified of go-live

### ✅ Documentation
- [ ] Deployment documentation updated
- [ ] Runbooks created for common operations
- [ ] Emergency procedures documented
- [ ] Team trained on production operations

## Post-Deployment

### ✅ Immediate Monitoring (First 24 hours)
- [ ] Monitor CloudWatch dashboard continuously
- [ ] Check error logs every 2 hours
- [ ] Verify backup completion
- [ ] Monitor performance metrics
- [ ] Respond to any alerts immediately

### ✅ First Week Tasks
- [ ] Daily monitoring of key metrics
- [ ] Review and optimize performance
- [ ] Address any user feedback
- [ ] Fine-tune monitoring thresholds
- [ ] Document any issues and resolutions

### ✅ Ongoing Operations
- [ ] Weekly security reviews
- [ ] Monthly cost optimization reviews
- [ ] Quarterly disaster recovery testing
- [ ] Regular dependency updates
- [ ] Continuous monitoring and improvement

## Rollback Plan

### ✅ Rollback Preparation
- [ ] Previous version artifacts available
- [ ] Database rollback scripts prepared
- [ ] DNS rollback procedure documented
- [ ] Team trained on rollback procedures

### ✅ Rollback Triggers
- [ ] Critical functionality broken
- [ ] Security vulnerability discovered
- [ ] Performance degradation > 50%
- [ ] Data corruption detected
- [ ] Unrecoverable errors

### ✅ Rollback Execution
- [ ] Immediate: Stop new deployments
- [ ] Revert application to previous version
- [ ] Rollback database migrations (if safe)
- [ ] Update DNS if necessary
- [ ] Notify stakeholders
- [ ] Investigate and document issues

## Sign-off

### ✅ Team Approvals
- [ ] **Technical Lead**: Infrastructure and code deployment approved
- [ ] **Security Team**: Security review completed and approved
- [ ] **Operations Team**: Monitoring and alerting verified
- [ ] **Product Owner**: Functionality testing completed and approved
- [ ] **Project Manager**: Go-live approved

### ✅ Final Confirmation
- [ ] **Deployment Date**: _______________
- [ ] **Deployment Time**: _______________
- [ ] **Deployed By**: _______________
- [ ] **Verified By**: _______________

---

**Notes:**
- Complete each section in order
- Do not proceed to next section until all items in current section are checked
- Document any issues or deviations in the notes section
- Keep this checklist for audit and future reference

**Emergency Contacts:**
- Technical Lead: _______________
- Operations Team: _______________
- Security Team: _______________
- AWS Support: _______________