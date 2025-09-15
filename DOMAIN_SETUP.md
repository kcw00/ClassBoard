# Custom Domain Setup for ClassBoard

This guide covers setting up custom domains for your ClassBoard application, supporting both simple Vercel deployment and full AWS infrastructure approaches.

## 🎯 Domain Strategy Options

### Option 1: Hybrid Approach (Recommended)
- **Frontend**: Vercel with custom domain
- **Backend**: AWS infrastructure (RDS, S3, Lambda)
- **Benefits**: Simple frontend deployment, robust backend infrastructure

### Option 2: Full AWS Approach
- **Frontend**: S3 + CloudFront
- **Backend**: Full AWS stack
- **Benefits**: Single cloud provider, complete control

### Option 3: Development/Testing
- **Frontend**: Local development or staging
- **Backend**: AWS infrastructure
- **Benefits**: Cost-effective for testing

## 🌐 Domain Suggestions

### Professional Domains
1. **classboard.app** - Modern and professional
2. **classboard.edu** - Educational focus (if eligible)
3. **classboard.io** - Tech-focused
4. **classboard.ca** - Regional focus

### Subdomain Structure
```
classboard.app           → Main application
www.classboard.app       → Redirect to main
api.classboard.app       → Backend API
admin.classboard.app     → Admin interface (future)
docs.classboard.app      → Documentation (future)
cdn.classboard.app       → CDN/static assets
```

## 🚀 Option 1: Hybrid Setup (Vercel + AWS)

### Step 1: Purchase Domain

**Recommended Registrars:**
- **Cloudflare** - Best pricing, excellent DNS management
- **Namecheap** - Good balance of price and features
- **Google Domains** - Simple interface, Google integration
- **AWS Route53** - If using full AWS stack

### Step 2: Deploy Frontend to Vercel

```bash
# Deploy using the deployment script
./deploy-frontend.sh

# Or manual deployment
npm run build
npx vercel --prod
```

### Step 3: Configure Domain in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your ClassBoard project
3. Navigate to Settings → Domains
4. Add your custom domain (e.g., `classboard.app`)
5. Add www redirect: `www.classboard.app` → `classboard.app`

### Step 4: DNS Configuration

**For Cloudflare DNS:**
```dns
Type    Name    Content                     TTL
A       @       76.76.19.19                 Auto
A       www     76.76.19.19                 Auto
CNAME   api     your-aws-alb-domain.com     Auto
```

**For other DNS providers:**
```dns
Type    Name    Content                     TTL
A       @       [Vercel IP]                 300
CNAME   www     classboard.app              300
CNAME   api     your-aws-backend.com        300
```

### Step 5: Update Environment Variables

**Frontend (.env.local):**
```env
VITE_APP_DOMAIN=classboard.app
VITE_APP_URL=https://classboard.app
VITE_API_BASE_URL=https://api.classboard.app/api
VITE_AWS_REGION=us-east-1
VITE_CLOUDFRONT_DOMAIN=your-cloudfront-domain.cloudfront.net
```

**Backend (.env):**
```env
# CORS Configuration
FRONTEND_URL=https://classboard.app
ALLOWED_ORIGINS=https://classboard.app,https://www.classboard.app

# Domain Configuration
API_DOMAIN=api.classboard.app
CDN_DOMAIN=cdn.classboard.app
```

### Step 6: Update Backend CORS

The backend is already configured to handle multiple domains. Update `backend/src/middleware/cors.ts` if needed:

```typescript
const allowedOrigins = [
  'https://classboard.app',
  'https://www.classboard.app',
  'https://app.classboard.app',
  process.env.FRONTEND_URL
].filter(Boolean);
```

## 🏗️ Option 2: Full AWS Setup

### Step 1: AWS Infrastructure

```bash
cd backend/aws/terraform

# Deploy with custom domain
terraform plan -var="domain_name=classboard.app" -var-file="environments/production.tfvars"
terraform apply -var="domain_name=classboard.app" -var-file="environments/production.tfvars"
```

### Step 2: Route53 Hosted Zone

```bash
# Create hosted zone
aws route53 create-hosted-zone --name classboard.app --caller-reference $(date +%s)

# Note the nameservers and update your domain registrar
aws route53 get-hosted-zone --id /hostedzone/YOUR_ZONE_ID
```

### Step 3: ACM Certificate

```bash
# Request certificate
aws acm request-certificate \
  --domain-name classboard.app \
  --subject-alternative-names "*.classboard.app" \
  --validation-method DNS \
  --region us-east-1
```

### Step 4: CloudFront Distribution

The Terraform configuration will create:
- S3 bucket for frontend hosting
- CloudFront distribution with custom domain
- Route53 records for domain routing

### Step 5: Deploy Frontend to S3

```bash
# Build and deploy frontend
npm run build
aws s3 sync dist/ s3://classboard-app-frontend --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## 🔧 SSL/TLS Configuration

### Automatic SSL (Vercel)
Vercel automatically provisions and renews SSL certificates for custom domains.

### Manual SSL (AWS)
```bash
# Verify ACM certificate
aws acm describe-certificate --certificate-arn YOUR_CERT_ARN

# Ensure CloudFront uses the certificate
# This is handled by Terraform configuration
```

## 🔍 DNS Verification

### Test DNS Resolution
```bash
# Check domain resolution
dig classboard.app
dig www.classboard.app
dig api.classboard.app

# Check SSL certificate
openssl s_client -connect classboard.app:443 -servername classboard.app
```

### Test Application
```bash
# Test frontend
curl -I https://classboard.app

# Test API
curl -I https://api.classboard.app/api/health

# Test CORS
curl -H "Origin: https://classboard.app" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS https://api.classboard.app/api/classes
```

## 📊 Performance Optimization

### CDN Configuration
```javascript
// Vercel configuration (vercel.json)
{
  "headers": [
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### CloudFront Optimization
```hcl
# Terraform CloudFront configuration
resource "aws_cloudfront_distribution" "frontend" {
  # ... other configuration

  default_cache_behavior {
    compress = true
    viewer_protocol_policy = "redirect-to-https"
    
    cache_policy_id = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # Managed-CachingOptimized
  }
}
```

## 🔒 Security Considerations

### HTTPS Enforcement
```nginx
# Ensure all traffic uses HTTPS
server {
    listen 80;
    server_name classboard.app www.classboard.app;
    return 301 https://$server_name$request_uri;
}
```

### Security Headers
```typescript
// Backend security headers
app.use(helmet({
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://your-cloudfront-domain.cloudfront.net"]
    }
  }
}));
```

## 🧪 Testing Domain Setup

### Automated Testing
```bash
# Test script for domain verification
#!/bin/bash
DOMAIN="classboard.app"

echo "Testing $DOMAIN setup..."

# Test DNS resolution
echo "DNS Resolution:"
dig +short $DOMAIN
dig +short www.$DOMAIN
dig +short api.$DOMAIN

# Test SSL certificates
echo "SSL Certificate:"
echo | openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | openssl x509 -noout -dates

# Test application endpoints
echo "Application Tests:"
curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN
curl -s -o /dev/null -w "%{http_code}" https://api.$DOMAIN/api/health

echo "Domain setup verification complete!"
```

## 🚨 Troubleshooting

### Common Issues

**DNS Propagation Delays**
```bash
# Check DNS propagation globally
dig @8.8.8.8 classboard.app
dig @1.1.1.1 classboard.app

# Wait up to 48 hours for full propagation
```

**SSL Certificate Issues**
```bash
# Verify certificate chain
openssl s_client -connect classboard.app:443 -showcerts

# Check certificate expiration
echo | openssl s_client -connect classboard.app:443 2>/dev/null | openssl x509 -noout -dates
```

**CORS Issues**
```bash
# Test CORS headers
curl -H "Origin: https://classboard.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS https://api.classboard.app/api/classes
```

### Monitoring

**Domain Health Checks**
```bash
# Set up monitoring for domain availability
curl -f https://classboard.app/health || echo "Frontend down"
curl -f https://api.classboard.app/api/health || echo "Backend down"
```

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Domain purchased and DNS configured
- [ ] SSL certificates provisioned
- [ ] Environment variables updated
- [ ] CORS configuration updated
- [ ] Security headers configured

### Post-Deployment
- [ ] DNS resolution verified
- [ ] SSL certificates working
- [ ] Application loads correctly
- [ ] API endpoints accessible
- [ ] CORS working for cross-origin requests
- [ ] Performance monitoring enabled

### Ongoing Maintenance
- [ ] SSL certificate auto-renewal configured
- [ ] DNS monitoring enabled
- [ ] Performance monitoring active
- [ ] Security scanning scheduled
- [ ] Backup and recovery tested

## 💰 Cost Considerations

### Vercel + AWS Hybrid
- **Vercel**: Free tier available, Pro at $20/month
- **AWS**: RDS (~$15/month), S3 (~$5/month), Lambda (pay-per-use)
- **Domain**: $10-15/year
- **Total**: ~$25-45/month

### Full AWS
- **Route53**: $0.50/month per hosted zone
- **CloudFront**: $0.085/GB + requests
- **ACM**: Free for AWS resources
- **Additional S3**: ~$5/month
- **Total**: ~$30-50/month

## 🎉 Success!

Once configured, your ClassBoard application will be accessible at:
- **Main App**: https://classboard.app
- **API**: https://api.classboard.app
- **Health Check**: https://api.classboard.app/api/health

Your domain setup is complete and ready for production use!