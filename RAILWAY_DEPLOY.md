# 🚂 Railway Deployment Guide for ClassBoard Backend

## Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Connect your GitHub account

## Step 2: Deploy Backend to Railway

### Option A: Deploy from GitHub (Recommended)
1. **Push your code to GitHub** (if not already done):
   ```bash
   cd /Users/kimchaewon/ClassBoard
   git add .
   git commit -m "Prepare backend for Railway deployment"
   git push origin main
   ```

2. **Create New Project** in Railway:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your ClassBoard repository
   - Select the **backend** directory as root
   - Railway will auto-detect Node.js and deploy

### Option B: Railway CLI (Alternative)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy from backend directory
cd backend/
railway init
railway up
```

## Step 3: Add PostgreSQL Database
1. In your Railway project dashboard
2. Click "Add Service" → "Database" → "PostgreSQL"
3. Railway will automatically set `DATABASE_URL` environment variable

## Step 4: Configure Environment Variables
In Railway dashboard, add these environment variables:

### Required Variables:
```env
NODE_ENV=production
JWT_SECRET=your-super-secure-jwt-secret-here
FRONTEND_URL=https://your-app-name.vercel.app
```

### AWS Variables (Optional - can use placeholders):
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=placeholder
AWS_SECRET_ACCESS_KEY=placeholder
S3_BUCKET_NAME=classboard-production-files
```

### Rate Limiting:
```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Step 5: Deploy and Get URL
1. Railway will build and deploy automatically
2. You'll get a URL like: `https://your-app-name.railway.app`
3. Test the health endpoint: `https://your-app-name.railway.app/api/health`

## Step 6: Update Frontend Configuration
Update `/Users/kimchaewon/ClassBoard/.env.production`:
```env
VITE_API_URL=https://your-app-name.railway.app
```

## Step 7: Database Migration
Railway will automatically run Prisma migrations on deploy due to the build process.

## Troubleshooting

### Build Issues
If build fails due to TypeScript errors:
1. Go to Railway project settings
2. Change "Build Command" to: `npm install && npx prisma generate && npm run build || npm run start`
3. Or set "Start Command" to: `npm run dev` (for development mode)

### Database Connection
If database connection fails:
- Check that PostgreSQL service is running in Railway
- Verify `DATABASE_URL` environment variable is set

### CORS Issues
Make sure `FRONTEND_URL` environment variable matches your Vercel URL exactly.

## Expected Result
✅ Backend running at: `https://your-app-name.railway.app`
✅ Health check: `https://your-app-name.railway.app/api/health`
✅ PostgreSQL database connected
✅ Ready for frontend deployment to Vercel

## Cost
- Railway: Free tier with $5/month credit
- PostgreSQL: Included in free tier
- Perfect for development and small production apps

---

**Next**: Once backend is deployed, update frontend `.env.production` and deploy to Vercel!