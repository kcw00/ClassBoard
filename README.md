
# ClassBoard - Classroom Management Application

A comprehensive full-stack classroom management application built with React/TypeScript frontend and Node.js/Express backend, deployed on AWS infrastructure. Originally based on the [Figma design](https://www.figma.com/design/2LicEPH3fnTDNFsZFo2Lwj/Classroom-Management-App), this application has evolved into a production-ready system for managing classes, students, assessments, attendance, and more.

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** with **shadcn/ui** components
- **React Router** for navigation
- **React Hook Form** for form management
- **Recharts** for data visualization

### Backend
- **Node.js** with **Express.js** and TypeScript
- **Prisma ORM** with PostgreSQL database
- **AWS Cognito** for authentication
- **AWS S3** for file storage with CloudFront CDN
- **AWS Lambda** for background processing
- **JWT** tokens with refresh token rotation

### Infrastructure
- **AWS RDS PostgreSQL** for primary database
- **AWS S3** for file storage
- **AWS CloudFront** for global content delivery
- **AWS Cognito** for user authentication
- **AWS Lambda** for serverless functions
- **Terraform** for infrastructure as code

## 🚀 Features

### Core Functionality
- **Class Management**: Create, update, and manage classes with enrollment tracking
- **Student Management**: Comprehensive student profiles with enrollment history
- **Schedule Management**: Flexible scheduling with exception handling
- **Assessment System**: Tests, quizzes, and homework with automated grading
- **Attendance Tracking**: Daily attendance with multiple status options
- **Meeting Management**: Parent-teacher conferences and virtual meetings
- **File Management**: Secure file uploads with S3 integration

### Advanced Features
- **Real-time Updates**: Optimistic UI updates with error handling
- **Performance Optimization**: Caching, pagination, and lazy loading
- **Security**: Input validation, rate limiting, and secure file handling
- **Monitoring**: Comprehensive logging and performance monitoring
- **Background Processing**: Automated grade calculations and notifications
- **Data Migration**: Tools for migrating from mock data to production database

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 12+ (for local development)
- **AWS Account** (for production deployment)
- **Terraform** (for infrastructure deployment)

## 🛠️ Installation & Setup

### Frontend Setup

```bash
# Install frontend dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install backend dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database and AWS credentials

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed

# Start development server
npm run dev

# Run comprehensive tests
npm run test:comprehensive
```

### Environment Variables

#### Frontend (.env.local)
```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_AWS_REGION=us-east-1
```

#### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/classboard_dev"

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Cognito
COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx

# S3
S3_BUCKET_NAME=classboard-files
CLOUDFRONT_DOMAIN=xxxxxxxxxx.cloudfront.net

# Application
JWT_SECRET=your_jwt_secret
NODE_ENV=development
PORT=3001
```

## 🗄️ Database Schema

The application uses PostgreSQL with Prisma ORM. Key entities include:

- **Users**: Authentication and user management
- **Students**: Student profiles and enrollment data
- **Classes**: Class definitions with capacity and scheduling
- **ClassEnrollments**: Many-to-many relationship between students and classes
- **Schedules**: Regular class schedules with day/time information
- **Tests/TestResults**: Assessment system with scoring
- **HomeworkAssignments/Submissions**: Homework management
- **AttendanceRecords/Entries**: Daily attendance tracking
- **Meetings**: Parent-teacher conferences and meetings
- **Files**: Secure file storage metadata

### Database Commands

```bash
# Generate Prisma client after schema changes
npm run db:generate

# Create and apply new migration
npm run db:migrate

# Reset database (destructive)
npm run db:reset

# Seed with sample data
npm run db:seed

# Migrate mock data to database
npm run db:migrate-data
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login with Cognito
- `POST /api/auth/logout` - User logout
- `POST /api/auth/signup` - User registration
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/me` - Get current user info

### Classes
- `GET /api/classes` - List classes (paginated)
- `POST /api/classes` - Create new class
- `GET /api/classes/:id` - Get class details
- `PUT /api/classes/:id` - Update class
- `DELETE /api/classes/:id` - Delete class
- `POST /api/classes/:id/enroll` - Enroll student
- `DELETE /api/classes/:id/students/:studentId` - Unenroll student

### Students
- `GET /api/students` - List students (paginated, searchable)
- `POST /api/students` - Create new student
- `GET /api/students/:id` - Get student details
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Assessments
- `GET /api/classes/:classId/tests` - List tests for class
- `POST /api/classes/:classId/tests` - Create new test
- `GET /api/tests/:id/results` - Get test results
- `POST /api/tests/:id/results` - Submit test result

### Files
- `POST /api/files/upload` - Upload file to S3
- `GET /api/files/:id` - Get file metadata
- `DELETE /api/files/:id` - Delete file

## 🧪 Testing

### Frontend Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Backend Testing
```bash
cd backend

# Run all tests
npm test

# Run specific test suites
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests
npm run test:e2e          # End-to-end tests
npm run test:performance  # Performance tests

# Run with coverage
npm run test:coverage

# Run comprehensive test suite
npm run test:comprehensive

# Load testing
npm run test:load
```

## 🚀 Deployment

### AWS Infrastructure Setup

```bash
cd backend/aws/terraform

# Initialize Terraform
terraform init

# Plan deployment
terraform plan -var-file="environments/production.tfvars"

# Apply infrastructure
terraform apply -var-file="environments/production.tfvars"
```

### Production Deployment

```bash
cd backend/aws

# Deploy to production
./deploy-production.sh

# Set environment variables
./set-env-vars.sh production
source export-env-vars-production.sh

# Validate deployment
node validate-integration.js production
```

## 📊 Monitoring & Performance

### Health Checks
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed system status

### Performance Features
- **Caching**: Redis-compatible LRU cache for API responses
- **Pagination**: Efficient pagination for large datasets
- **Query Optimization**: Database query optimization and indexing
- **CDN**: CloudFront for global content delivery
- **Connection Pooling**: Database connection optimization

### Monitoring
- **Request Logging**: Morgan middleware for HTTP request logging
- **Error Tracking**: Comprehensive error handling and logging
- **Performance Metrics**: Response time and throughput monitoring
- **AWS CloudWatch**: Infrastructure monitoring and alerting

## 🔒 Security

### Authentication & Authorization
- **AWS Cognito**: Secure user authentication
- **JWT Tokens**: Short-lived access tokens with refresh rotation
- **Role-based Access**: Teacher and admin role permissions
- **MFA Support**: Multi-factor authentication available

### Data Protection
- **Input Validation**: Joi schema validation for all inputs
- **SQL Injection Prevention**: Parameterized queries with Prisma
- **XSS Protection**: Input sanitization and CSP headers
- **Rate Limiting**: API rate limiting and request throttling
- **File Security**: Virus scanning and file type validation

### Infrastructure Security
- **HTTPS Enforcement**: SSL/TLS encryption for all communications
- **CORS Configuration**: Secure cross-origin resource sharing
- **Security Headers**: Helmet.js for security headers
- **Secrets Management**: AWS Secrets Manager for sensitive data

## 📁 Project Structure

```
classboard/
├── src/                          # Frontend React application
│   ├── components/              # Reusable UI components
│   ├── screens/                 # Page components
│   ├── services/               # API service layer
│   ├── hooks/                  # Custom React hooks
│   ├── context/                # React context providers
│   └── types/                  # TypeScript type definitions
├── backend/                     # Backend Node.js application
│   ├── src/
│   │   ├── routes/             # Express route handlers
│   │   ├── services/           # Business logic services
│   │   ├── middleware/         # Express middleware
│   │   ├── validators/         # Input validation schemas
│   │   ├── utils/              # Utility functions
│   │   └── __tests__/          # Test files
│   ├── prisma/                 # Database schema and migrations
│   ├── aws/                    # AWS infrastructure configuration
│   └── lambda/                 # AWS Lambda functions
└── .kiro/                      # Project specifications and documentation
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Use conventional commit messages
- Update documentation for API changes

## 📚 Documentation

- [Backend Migration Specification](.kiro/specs/backend-migration/)
- [Database Setup Guide](backend/DATABASE.md)
- [AWS Deployment Guide](backend/aws/README.md)
- [Testing Guide](backend/TESTING.md)
- [Security Implementation](backend/SECURITY_IMPLEMENTATION.md)
- [API Documentation](backend/API.md)

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify PostgreSQL is running
   - Check DATABASE_URL in .env file
   - Ensure database exists and user has permissions

2. **AWS Authentication Issues**
   - Verify AWS credentials are configured
   - Check IAM permissions for S3, Cognito, and RDS
   - Ensure region consistency across services

3. **Build Issues**
   - Clear node_modules and reinstall dependencies
   - Check Node.js version compatibility
   - Verify environment variables are set

### Getting Help

- Check the [Issues](https://github.com/your-repo/classboard/issues) page
- Review the documentation in the `.kiro/specs/` directory
- Run the comprehensive test suite to identify issues

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 🙏 Acknowledgments

- Original design from [Figma Community](https://www.figma.com/design/2LicEPH3fnTDNFsZFo2Lwj/Classroom-Management-App)
- Built with [shadcn/ui](https://ui.shadcn.com/) components
- Powered by [AWS](https://aws.amazon.com/) cloud services