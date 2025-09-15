# ClassBoard API Documentation

This document provides comprehensive documentation for the ClassBoard backend API endpoints.

## Base URL

- **Development**: `http://localhost:3001/api`
- **Production**: `https://api.classboard.app/api`

## Authentication

All API endpoints (except authentication endpoints) require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Token Refresh

Tokens expire after 60 minutes. Use the refresh endpoint to get a new token:

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

## Response Format

All API responses follow this standard format:

```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation completed successfully",
  "pagination": { /* pagination info for list endpoints */ }
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { /* additional error details */ }
  },
  "timestamp": "2024-12-15T10:30:00Z",
  "path": "/api/endpoint"
}
```

## Authentication Endpoints

### POST /api/auth/login

Authenticate user with email and password.

**Request:**
```json
{
  "email": "teacher@example.com",
  "password": "SecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "idToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "user-uuid",
      "email": "teacher@example.com",
      "name": "John Doe",
      "role": "teacher",
      "emailVerified": true
    }
  },
  "message": "Login successful"
}
```

### POST /api/auth/signup

Register a new user account.

**Request:**
```json
{
  "email": "newteacher@example.com",
  "password": "SecurePassword123",
  "name": "Jane Smith",
  "role": "teacher"
}
```

### POST /api/auth/logout

Sign out the current user (requires authentication).

### GET /api/auth/me

Get current user information (requires authentication).

## Class Management Endpoints

### GET /api/classes

List all classes with pagination and filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `subject` (string): Filter by subject
- `search` (string): Search in name, subject, description, or room

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "class-uuid",
      "name": "Algebra II",
      "subject": "Mathematics",
      "description": "Advanced algebra concepts",
      "room": "Math 101",
      "capacity": 25,
      "color": "#3b82f6",
      "createdDate": "2024-08-01",
      "enrolledStudents": ["student-uuid-1", "student-uuid-2"],
      "enrollmentCount": 2
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### POST /api/classes

Create a new class.

**Request:**
```json
{
  "name": "Chemistry Fundamentals",
  "subject": "Science",
  "description": "Introduction to chemical principles",
  "room": "Science 205",
  "capacity": 20,
  "color": "#10b981"
}
```

### GET /api/classes/:id

Get detailed information about a specific class.

### PUT /api/classes/:id

Update an existing class.

### DELETE /api/classes/:id

Delete a class (also removes all related data).

### POST /api/classes/:id/enroll

Enroll a student in a class.

**Request:**
```json
{
  "studentId": "student-uuid"
}
```

### DELETE /api/classes/:id/students/:studentId

Unenroll a student from a class.

## Student Management Endpoints

### GET /api/students

List all students with pagination, filtering, and search.

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `grade` (string): Filter by grade
- `search` (string): Search in name, email, phone, grade, or parent contact

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "student-uuid",
      "name": "Alice Johnson",
      "email": "alice.johnson@email.com",
      "phone": "(555) 123-4567",
      "grade": "10th Grade",
      "parentContact": "(555) 123-4568",
      "enrollmentDate": "2024-08-15",
      "enrollments": [
        {
          "classId": "class-uuid",
          "class": {
            "name": "Algebra II",
            "subject": "Mathematics"
          }
        }
      ],
      "enrollmentCount": 1
    }
  ]
}
```

### POST /api/students

Create a new student.

**Request:**
```json
{
  "name": "Bob Smith",
  "email": "bob.smith@email.com",
  "phone": "(555) 234-5678",
  "grade": "11th Grade",
  "parentContact": "(555) 234-5679"
}
```

### GET /api/students/:id

Get detailed student information including enrollment history.

### PUT /api/students/:id

Update student information.

### DELETE /api/students/:id

Delete a student (removes from all classes and related records).

## Assessment Endpoints

### GET /api/classes/:classId/tests

List all tests for a specific class.

### POST /api/classes/:classId/tests

Create a new test for a class.

**Request:**
```json
{
  "title": "Quadratic Equations Test",
  "description": "Comprehensive test covering quadratic equations",
  "testDate": "2024-12-10",
  "totalPoints": 100,
  "testType": "exam",
  "fileName": "algebra_test.pdf"
}
```

### GET /api/tests/:id

Get test details.

### PUT /api/tests/:id

Update test information.

### DELETE /api/tests/:id

Delete a test and all associated results.

### GET /api/tests/:id/results

Get all results for a specific test.

### POST /api/tests/:id/results

Submit or update a test result.

**Request:**
```json
{
  "studentId": "student-uuid",
  "score": 88,
  "maxScore": 100,
  "grade": "B+",
  "feedback": "Good understanding of concepts",
  "submittedDate": "2024-12-10",
  "gradedDate": "2024-12-11"
}
```

## Schedule Management Endpoints

### GET /api/classes/:classId/schedules

Get all schedules for a class.

### POST /api/classes/:classId/schedules

Create a new schedule for a class.

**Request:**
```json
{
  "dayOfWeek": 1,
  "startTime": "09:00",
  "endTime": "10:30"
}
```

### PUT /api/schedules/:id

Update a schedule.

### DELETE /api/schedules/:id

Delete a schedule.

### GET /api/schedules/:id/exceptions

Get schedule exceptions.

### POST /api/schedules/:id/exceptions

Create a schedule exception.

## Attendance Endpoints

### GET /api/classes/:classId/attendance

Get attendance records for a class.

**Query Parameters:**
- `date` (string): Filter by specific date (YYYY-MM-DD)
- `startDate` (string): Filter from date
- `endDate` (string): Filter to date

### POST /api/classes/:classId/attendance

Create an attendance record.

**Request:**
```json
{
  "date": "2024-12-02",
  "attendanceData": [
    {
      "studentId": "student-uuid-1",
      "status": "present"
    },
    {
      "studentId": "student-uuid-2",
      "status": "late",
      "notes": "Arrived 10 minutes late"
    }
  ]
}
```

### PUT /api/attendance/:id

Update an attendance record.

## Meeting Management Endpoints

### GET /api/meetings

List all meetings.

**Query Parameters:**
- `date` (string): Filter by date
- `status` (string): Filter by status (scheduled, completed, cancelled)
- `participantType` (string): Filter by participant type

### POST /api/meetings

Create a new meeting.

**Request:**
```json
{
  "title": "Parent-Teacher Conference - Alice Johnson",
  "description": "Discuss Alice's progress in mathematics",
  "date": "2024-12-10",
  "startTime": "14:00",
  "endTime": "14:30",
  "participants": ["student-uuid"],
  "participantType": "parents",
  "location": "Classroom Math 101",
  "meetingType": "in-person",
  "status": "scheduled",
  "notes": "Focus on algebra concepts"
}
```

### GET /api/meetings/:id

Get meeting details.

### PUT /api/meetings/:id

Update meeting information.

### DELETE /api/meetings/:id

Delete a meeting.

## File Management Endpoints

### POST /api/files/upload

Upload a file to S3.

**Request:** Multipart form data
- `file`: The file to upload
- `entityType`: Type of entity (test, homework_submission, student_profile, etc.)
- `entityId`: ID of the related entity
- `isPublic`: Whether the file should be publicly accessible

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "file-uuid",
    "originalName": "test_document.pdf",
    "fileName": "uploads/2024/12/15/uuid-test_document.pdf",
    "mimeType": "application/pdf",
    "size": 1024000,
    "cloudFrontUrl": "https://cdn.classboard.app/uploads/2024/12/15/uuid-test_document.pdf",
    "entityType": "test",
    "entityId": "test-uuid"
  }
}
```

### GET /api/files/:id

Get file metadata and signed download URL.

### DELETE /api/files/:id

Delete a file from S3 and database.

## Health Check Endpoints

### GET /api/health

Basic health check.

**Response:**
```json
{
  "success": true,
  "message": "ClassBoard API is running",
  "version": "1.0.0",
  "timestamp": "2024-12-15T10:30:00Z"
}
```

### GET /api/health/detailed

Detailed system health check including database and AWS services.

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `AUTHENTICATION_REQUIRED` | Valid authentication token required |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions |
| `RESOURCE_NOT_FOUND` | Requested resource does not exist |
| `RESOURCE_CONFLICT` | Resource already exists or conflict |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `DATABASE_ERROR` | Database operation failed |
| `AWS_SERVICE_ERROR` | AWS service operation failed |
| `FILE_UPLOAD_ERROR` | File upload operation failed |
| `INTERNAL_SERVER_ERROR` | Unexpected server error |

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **Authentication endpoints**: 5 requests per minute per IP
- **General API endpoints**: 100 requests per minute per user
- **File upload endpoints**: 10 requests per minute per user

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time (Unix timestamp)

## Pagination

List endpoints support pagination with the following parameters:

- `page`: Page number (starts at 1)
- `limit`: Items per page (max 100)

Pagination information is included in the response:

```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

## Filtering and Search

Many endpoints support filtering and search:

- **Filtering**: Use query parameters to filter results (e.g., `?grade=10th Grade`)
- **Search**: Use the `search` parameter for full-text search across relevant fields
- **Date ranges**: Use `startDate` and `endDate` for date-based filtering

## WebSocket Events (Future Enhancement)

Real-time updates will be available via WebSocket connections:

- `attendance_updated`: When attendance is recorded
- `grade_posted`: When test results are published
- `meeting_scheduled`: When new meetings are created
- `assignment_due`: Assignment due date reminders

## SDK and Client Libraries

Official client libraries are available for:

- **JavaScript/TypeScript**: `@classboard/api-client`
- **React Hooks**: `@classboard/react-hooks`

Example usage:

```typescript
import { ClassBoardAPI } from '@classboard/api-client';

const api = new ClassBoardAPI({
  baseURL: 'https://api.classboard.app/api',
  token: 'your-jwt-token'
});

const classes = await api.classes.list({ page: 1, limit: 10 });
```