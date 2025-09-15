# ClassBoard Frontend Deployment Guide

## Vercel Deployment (Recommended)

### Prerequisites
1. [Vercel Account](https://vercel.com) (free tier available)
2. Your backend deployed and accessible via HTTPS
3. Frontend code pushed to GitHub/GitLab

### Step 1: Deploy Backend First
Make sure your Node.js backend is deployed on a service like:
- **Railway** (recommended for PostgreSQL + Node.js)
- **Render**
- **Heroku**
- **DigitalOcean App Platform**
- **AWS** (your current setup)

### Step 2: Configure Environment Variables

#### Option A: Via Vercel Dashboard
1. Go to your project settings in Vercel
2. Navigate to "Environment Variables"
3. Add these variables:

```
VITE_API_URL=https://your-backend-url.com
VITE_APP_DOMAIN=your-app-name.vercel.app
VITE_APP_URL=https://your-app-name.vercel.app
VITE_NODE_ENV=production
```

#### Option B: Via Vercel CLI
```bash
vercel env add VITE_API_URL production
# Enter: https://your-backend-url.com

vercel env add VITE_NODE_ENV production
# Enter: production
```

### Step 3: Deploy to Vercel

#### Option A: Via Dashboard (Easiest)
1. Connect your GitHub repo to Vercel
2. Vercel will auto-detect Vite and deploy
3. Check the build logs for any issues

#### Option B: Via CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project root
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No (first time)
# - Project name: classboard-frontend
# - In which directory? ./
# - Override settings? No
```

### Step 4: Verify Deployment
1. Visit your Vercel URL
2. Test authentication (make sure backend is accessible)
3. Test CRUD operations
4. Check browser console for any API errors

## Backend Deployment Options

### Railway (Recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy backend
railway login
railway init
railway up
```

### Render
1. Connect GitHub repo
2. Choose "Web Service"
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Add environment variables in dashboard

## Environment Variables Reference

### Frontend (.env.production)
```env
VITE_API_URL=https://your-backend-url.com
VITE_APP_DOMAIN=your-app-name.vercel.app
VITE_APP_URL=https://your-app-name.vercel.app
VITE_NODE_ENV=production
VITE_AWS_S3_BUCKET=your-s3-bucket-name
VITE_AWS_REGION=us-east-1
```

### Backend
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=your-postgresql-url
JWT_SECRET=your-jwt-secret
FRONTEND_URL=https://your-app-name.vercel.app
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=your-s3-bucket-name
AWS_REGION=us-east-1
```

## Troubleshooting

### Build Failures
- Check Vercel build logs
- Ensure all dependencies in package.json
- Verify TypeScript compilation: `npm run build`

### API Connection Issues
- Verify CORS settings in backend
- Check VITE_API_URL is correct
- Ensure backend is accessible via HTTPS

### Authentication Issues
- Check JWT token handling
- Verify login endpoint response format
- Test auth flow in browser dev tools

## Performance Optimization

Vercel automatically provides:
- ✅ Global CDN
- ✅ Automatic HTTPS
- ✅ Compression
- ✅ Edge caching
- ✅ Zero-config deployment

## Monitoring

- **Vercel Analytics**: Built-in performance monitoring
- **Vercel Speed Insights**: Core Web Vitals tracking
- **Error Tracking**: Check Vercel function logs

Your ClassBoard frontend is now production-ready! 🚀