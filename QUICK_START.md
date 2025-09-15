# ClassBoard - Quick Start Guide

Get the ClassBoard application running locally in under 10 minutes.

## 🚀 Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 12+ (or Docker)
- **Git**

## ⚡ Quick Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd classboard

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Database Setup

**Option A: Local PostgreSQL**
```bash
# Create database
createdb classboard_dev

# Or using psql
psql -c "CREATE DATABASE classboard_dev;"
```

**Option B: Docker**
```bash
# Run PostgreSQL in Docker
docker run --name classboard-postgres \
  -e POSTGRES_DB=classboard_dev \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 -d postgres:14
```

### 3. Environment Configuration

```bash
# Frontend environment
cp .env.example .env.local

# Backend environment
cd backend
cp .env.example .env
```

**Edit `backend/.env`:**
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/classboard_dev"
JWT_SECRET="your-secret-key-here"
NODE_ENV="development"
PORT=3001
```

### 4. Database Migration

```bash
cd backend

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed with sample data
npm run db:seed
```

### 5. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### 6. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api
- **API Health Check**: http://localhost:3001/api/health

## 🧪 Verify Installation

### Test Backend API
```bash
# Health check
curl http://localhost:3001/api/health

# Get classes (should return sample data)
curl http://localhost:3001/api/classes
```

### Test Frontend
1. Open http://localhost:5173
2. Navigate through the application
3. Check browser console for errors

## 🔧 Common Issues & Solutions

### Database Connection Issues

**Error**: `Can't reach database server`
```bash
# Check PostgreSQL is running
pg_isready

# Or for Docker
docker ps | grep postgres
```

**Error**: `Database does not exist`
```bash
# Create the database
createdb classboard_dev
```

### Port Already in Use

**Error**: `Port 3001 already in use`
```bash
# Find and kill the process
lsof -ti:3001 | xargs kill -9

# Or change port in backend/.env
PORT=3002
```

### Prisma Issues

**Error**: `Prisma Client not generated`
```bash
cd backend
npm run db:generate
```

**Error**: `Migration failed`
```bash
# Reset database (WARNING: destroys data)
npm run db:reset
```

## 📊 Sample Data

The seed script creates:
- **3 Classes**: Algebra II, Chemistry, World History
- **6 Students**: With realistic profiles and enrollments
- **Multiple Schedules**: Regular class schedules
- **Sample Tests**: With grades and feedback
- **Attendance Records**: Recent attendance data

## 🧪 Running Tests

### Frontend Tests
```bash
npm test
```

### Backend Tests
```bash
cd backend

# All tests
npm test

# Specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e
```

## 🔍 Development Tools

### Database Management
```bash
# Prisma Studio (Database GUI)
cd backend
npx prisma studio
# Opens at http://localhost:5555
```

### API Testing
- **Postman Collection**: Import from `backend/docs/postman_collection.json`
- **REST Client**: Use VS Code REST Client extension with `backend/docs/api.http`

### Debugging
- **Backend**: VS Code debugger configured in `.vscode/launch.json`
- **Frontend**: React DevTools browser extension
- **Database**: Prisma Studio or pgAdmin

## 📝 Next Steps

### Development Workflow
1. **Create Feature Branch**: `git checkout -b feature/new-feature`
2. **Make Changes**: Update code and tests
3. **Run Tests**: Ensure all tests pass
4. **Commit Changes**: Use conventional commit messages
5. **Create Pull Request**: Include description and test results

### Key Files to Know
- **Frontend Entry**: `src/main.tsx`
- **Backend Entry**: `backend/src/server.ts`
- **Database Schema**: `backend/prisma/schema.prisma`
- **API Routes**: `backend/src/routes/`
- **React Components**: `src/components/` and `src/screens/`

### Useful Commands
```bash
# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm test             # Run tests

# Backend
npm run dev          # Start development server
npm run build        # Build TypeScript
npm run test         # Run all tests
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database
npm run db:reset     # Reset database

# Database
npx prisma studio    # Open database GUI
npx prisma generate  # Generate Prisma client
npx prisma migrate dev # Create and apply migration
```

## 🆘 Getting Help

### Documentation
- **Full Documentation**: [README.md](README.md)
- **API Documentation**: [backend/API.md](backend/API.md)
- **Database Guide**: [backend/DATABASE.md](backend/DATABASE.md)
- **Deployment Guide**: [backend/aws/README.md](backend/aws/README.md)

### Troubleshooting
1. **Check Logs**: Backend logs in terminal, frontend in browser console
2. **Verify Environment**: Ensure all environment variables are set
3. **Database State**: Use Prisma Studio to inspect database
4. **API Status**: Check health endpoint and network requests
5. **Dependencies**: Try `rm -rf node_modules && npm install`

### Support
- **Issues**: Create GitHub issue with error details
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check existing documentation first

## 🎉 You're Ready!

You now have ClassBoard running locally with:
- ✅ Frontend React application
- ✅ Backend API server
- ✅ PostgreSQL database with sample data
- ✅ Development tools configured

Start exploring the codebase and building new features!