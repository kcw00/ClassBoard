# ClassBoard Backend API

Backend API server for the ClassBoard application built with Node.js, Express, and TypeScript.

## Features

- **Express.js** server with TypeScript
- **CORS** configuration for frontend integration
- **Rate limiting** for API protection
- **Error handling** middleware
- **Environment configuration** management
- **Security** headers with Helmet
- **Compression** for better performance
- **Logging** with Morgan

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update the `.env` file with your configuration values.

### Development

Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3001` by default.

### Building for Production

Build the TypeScript code:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

### Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## API Endpoints

### Health Check
- `GET /api/health` - Server health check

### Available Routes (to be implemented)
- `POST /api/auth/login` - User authentication
- `GET /api/classes` - List classes
- `GET /api/students` - List students
- `GET /api/tests` - List tests

## Environment Variables

See `.env.example` for all available configuration options.

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration management
│   ├── middleware/      # Express middleware
│   ├── routes/          # API route handlers
│   ├── __tests__/       # Test files
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── dist/                # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## Security Features

- CORS protection
- Rate limiting
- Security headers (Helmet)
- Input validation (to be implemented)
- JWT authentication (to be implemented)

## Next Steps

This is the initial backend infrastructure. The following will be implemented in subsequent tasks:

1. Database schema and ORM setup
2. AWS infrastructure configuration
3. Authentication system
4. API endpoints for classes, students, tests, etc.
5. File management with S3 integration