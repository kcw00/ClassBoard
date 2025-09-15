# ClassBoard API Documentation

## Overview

The ClassBoard API provides a comprehensive backend service for managing educational data including students, classes, schedules, tests, homework, attendance, and meetings.

**Base URL:** `http://localhost:3001/api` (development)
**Version:** 1.0.0
**Environment:** Development

## Authentication

All API endpoints require authentication via JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow a consistent format:

```json
{
  "success": true|false,
  "data": <response_data>,
  "error": <error_details>,
  "message": <optional_message>,
  "pagination": <pagination_info> // for paginated endpoints
}
```

## Core Endpoints

### Health Check

#### GET /api/health
Check API server status and health.

**Response:**
```json
{
  "success": true,
  "message": "ClassBoard API is running",
  "timestamp": "2025-09-15T08:30:44.900Z",
  "version": "1.0.0",
  "environment": "development",
  "uptime": 107.21518275
}
```

### Authentication

#### POST /api/auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt-token-here",
    "refreshToken": "refresh-token-here",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "User Name",
      "role": "teacher"
    }
  }
}
```

#### POST /api/auth/refresh
Refresh JWT token using refresh token.

#### POST /api/auth/logout
Logout user and invalidate tokens.

### Students

#### GET /api/students
Get all students with pagination and filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `search` (string): Search by name or email
- `grade` (string): Filter by grade
- `sortBy` (string): Sort field
- `sortOrder` (string): 'asc' or 'desc'

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "Alice Johnson",
      "email": "alice.johnson@email.com",
      "phone": "(555) 123-4567",
      "grade": "10th Grade",
      "parentContact": "(555) 123-4568",
      "enrollmentDate": "2024-08-15",
      "enrolledClasses": ["1"],
      "enrollmentCount": 1,
      "classes": [...]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

#### GET /api/students/:id
Get specific student by ID.

#### POST /api/students
Create new student.

**Request Body:**
```json
{
  "name": "Student Name",
  "email": "student@email.com",
  "phone": "(555) 123-4567",
  "grade": "10th Grade",
  "parentContact": "(555) 123-4568"
}
```

#### PUT /api/students/:id
Update student information.

#### DELETE /api/students/:id
Delete student.

### Classes

#### GET /api/classes
Get all classes with pagination and filtering.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "Algebra II",
      "subject": "Mathematics",
      "description": "Advanced algebra concepts",
      "room": "Math 101",
      "capacity": 25,
      "color": "#3b82f6",
      "createdDate": "2024-08-01",
      "enrolledStudents": ["1", "3"],
      "enrollmentCount": 2
    }
  ],
  "pagination": {...}
}
```

#### GET /api/classes/:id
Get specific class by ID.

#### POST /api/classes
Create new class.

#### PUT /api/classes/:id
Update class information.

#### DELETE /api/classes/:id
Delete class.

#### POST /api/classes/:id/enroll
Enroll student in class.

**Request Body:**
```json
{
  "studentId": "student-id"
}
```

#### DELETE /api/classes/:classId/students/:studentId
Unenroll student from class.

### Schedules

#### GET /api/schedules
Get all schedules.

#### GET /api/schedules?classId=:classId
Get schedules for specific class.

#### POST /api/schedules
Create new schedule.

**Request Body:**
```json
{
  "classId": "class-id",
  "dayOfWeek": 1,
  "startTime": "09:00",
  "endTime": "10:30"
}
```

#### PUT /api/schedules/:id
Update schedule.

#### DELETE /api/schedules/:id
Delete schedule.

### Schedule Exceptions

#### GET /api/schedule-exceptions
Get all schedule exceptions.

#### POST /api/schedule-exceptions
Create schedule exception.

#### PUT /api/schedule-exceptions/:id
Update schedule exception.

#### DELETE /api/schedule-exceptions/:id
Delete schedule exception.

### Tests

#### GET /api/tests
Get all tests.

#### GET /api/tests?classId=:classId
Get tests for specific class.

#### POST /api/tests
Create new test.

**Request Body:**
```json
{
  "classId": "class-id",
  "title": "Test Title",
  "description": "Test description",
  "testDate": "2024-12-10",
  "totalPoints": 100,
  "testType": "exam"
}
```

#### PUT /api/tests/:id
Update test.

#### DELETE /api/tests/:id
Delete test.

### Test Results

#### GET /api/test-results
Get all test results.

#### GET /api/test-results?testId=:testId
Get results for specific test.

#### POST /api/test-results
Create test result.

#### PUT /api/test-results/:id
Update test result.

#### DELETE /api/test-results/:id
Delete test result.

### Homework Assignments

#### GET /api/homework-assignments
Get all homework assignments.

#### GET /api/homework-assignments?classId=:classId
Get assignments for specific class.

#### POST /api/homework-assignments
Create homework assignment.

#### PUT /api/homework-assignments/:id
Update homework assignment.

#### DELETE /api/homework-assignments/:id
Delete homework assignment.

### Homework Submissions

#### GET /api/homework-submissions
Get all homework submissions.

#### GET /api/homework-submissions?assignmentId=:assignmentId
Get submissions for specific assignment.

#### POST /api/homework-submissions
Create homework submission.

#### PUT /api/homework-submissions/:id
Update homework submission.

#### DELETE /api/homework-submissions/:id
Delete homework submission.

### Attendance

#### GET /api/attendance
Get all attendance records.

#### GET /api/attendance?classId=:classId
Get attendance for specific class.

#### POST /api/attendance
Create attendance record.

**Request Body:**
```json
{
  "classId": "class-id",
  "date": "2024-12-02",
  "attendanceData": [
    {
      "studentId": "student-id",
      "status": "present",
      "notes": "Optional notes"
    }
  ]
}
```

#### PUT /api/attendance/:id
Update attendance record.

### Meetings

#### GET /api/meetings
Get all meetings.

#### POST /api/meetings
Create new meeting.

**Request Body:**
```json
{
  "title": "Meeting Title",
  "description": "Meeting description",
  "date": "2024-12-10",
  "startTime": "14:00",
  "endTime": "14:30",
  "participants": ["participant-id"],
  "participantType": "parents",
  "location": "Room 101",
  "meetingType": "in_person",
  "status": "scheduled"
}
```

#### PUT /api/meetings/:id
Update meeting.

#### DELETE /api/meetings/:id
Delete meeting.

### Class Notes

#### GET /api/class-notes
Get all class notes.

#### GET /api/class-notes?classId=:classId
Get notes for specific class.

#### POST /api/class-notes
Create class note.

#### PUT /api/class-notes/:id
Update class note.

#### DELETE /api/class-notes/:id
Delete class note.

### Files

#### POST /api/files/upload
Upload single file.

#### POST /api/files/upload-multiple
Upload multiple files.

#### GET /api/files/entity/:entityType/:entityId
Get files for specific entity.

#### DELETE /api/files/:fileId
Delete file.

### App Data Dashboard

#### GET /api/app-data/overview
Get application overview statistics.

#### GET /api/app-data/recent-activity
Get recent activity feed.

#### GET /api/app-data/upcoming-events
Get upcoming events.

#### GET /api/app-data/class-performance
Get class performance metrics.

#### GET /api/app-data/student-performance
Get student performance metrics.

#### GET /api/app-data/system-health
Get system health status.

#### GET /api/app-data/stats
Get aggregated statistics.

#### GET /api/app-data/dashboard-summary
Get complete dashboard summary.

## Error Codes

- `400` - Bad Request: Invalid request data
- `401` - Unauthorized: Missing or invalid authentication
- `403` - Forbidden: Insufficient permissions
- `404` - Not Found: Resource not found
- `409` - Conflict: Resource already exists
- `422` - Unprocessable Entity: Validation errors
- `429` - Too Many Requests: Rate limit exceeded
- `500` - Internal Server Error: Server error

## Rate Limiting

API requests are rate-limited to prevent abuse:
- **Window:** 15 minutes
- **Max Requests:** 100 per window per IP
- **Headers:** Rate limit info included in response headers

## Data Validation

All input data is validated using Joi schemas. Validation errors return detailed information about invalid fields.

## Caching

GET requests are cached for improved performance:
- **Default TTL:** 5 minutes
- **Cache Invalidation:** Automatic on data mutations
- **Cache Headers:** Included in responses

## Security Features

- JWT-based authentication
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CORS configuration
- Rate limiting
- Security headers (Helmet.js)
- File upload security scanning

## Performance Monitoring

The API includes comprehensive performance monitoring:
- Request/response time tracking
- Slow query detection
- Memory usage monitoring
- Error rate tracking
- Custom metrics collection

## Database Schema

The API uses PostgreSQL with Prisma ORM. Key entities:
- Users
- Students
- Classes
- Schedules
- Tests & Results
- Homework & Submissions
- Attendance
- Meetings
- Files

## Environment Variables

Required environment variables for deployment:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `AWS_*` - AWS configuration for file storage
- `COGNITO_*` - AWS Cognito configuration
- `FRONTEND_URL` - CORS configuration

## Development Setup

1. Install dependencies: `npm install`
2. Set up environment: Copy `.env.example` to `.env`
3. Run migrations: `npm run db:migrate`
4. Seed database: `npm run db:seed`
5. Start server: `npm run dev`

## Testing

- Unit tests: `npm run test:unit`
- Integration tests: `npm run test:integration`
- E2E tests: `npm run test:e2e`
- Performance tests: `npm run test:performance`
- Comprehensive tests: `npm run test:comprehensive`

## Deployment

See `PRODUCTION_DEPLOYMENT.md` for detailed deployment instructions.