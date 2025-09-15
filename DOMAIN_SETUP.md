# Custom Domain Setup for ClassBoard

## Recommended Approach: Vercel + Custom Domain

For the simplest setup with your essential AWS infrastructure (RDS + S3 + VPC), we recommend using Vercel for frontend hosting with a custom domain.

### Domain Suggestions

1. **classboard.ca** - Clean and professional
2. **app.classboard.ca** - Separate app from marketing site
3. **my.classboard.ca** - Personal touch for users

### Setup Steps

#### 1. Deploy Frontend to Vercel

```bash
# Run the deployment script
./deploy-frontend.sh
```

#### 2. Purchase Domain

- Buy your chosen domain (e.g., classboard.ca) from:
  - Namecheap
  - GoDaddy
  - Google Domains
  - Cloudflare

#### 3. Configure Domain in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your ClassBoard project
3. Go to Settings → Domains
4. Add your custom domain
5. Follow Vercel's DNS configuration instructions

#### 4. Update Backend CORS

Your Terraform configuration is already updated to allow:
- `https://classboard.ca`
- `https://app.classboard.ca`
- `https://my.classboard.ca`

#### 5. Update Environment Variables

Copy `.env.example` to `.env` and update:

```bash
cp .env.example .env
```

Edit `.env` with your actual domain:
```
VITE_APP_DOMAIN=classboard.ca
VITE_APP_URL=https://classboard.ca
```

### Benefits of This Approach

✅ **Simple**: No CloudFront or Route53 complexity
✅ **Fast**: Vercel's global CDN
✅ **Secure**: Automatic SSL certificates
✅ **Cost-effective**: Free tier available
✅ **Developer-friendly**: Git-based deployments

### Alternative: AWS-Only Setup

If you prefer to keep everything in AWS, you would need:
- CloudFront distribution
- Route53 hosted zone
- ACM certificate
- Additional S3 bucket for frontend

This adds complexity and cost but keeps everything in one provider.

## DNS Configuration

Once you have your domain, you'll need to:

1. **For Vercel**: Point your domain's nameservers to Vercel or add A/CNAME records
2. **For AWS backend**: Ensure your API subdomain (api.classboard.ca) points to your backend

Example DNS setup:
```
classboard.ca        → Vercel (frontend)
www.classboard.ca    → Vercel (frontend)
api.classboard.ca    → AWS ALB/API Gateway (backend)
```