# Database Setup and Migration Guide

This document explains how to set up the PostgreSQL database and migrate data from the existing mock data to the new database schema.

## Prerequisites

- PostgreSQL 12+ installed and running
- Node.js and npm installed
- Backend dependencies installed (`npm install`)

## Database Schema

The database schema is defined in `prisma/schema.prisma` and includes the following main entities:

### Core Entities
- **Users**: Authentication and user management
- **Students**: Student information and enrollment data
- **Classes**: Class definitions and metadata
- **ClassEnrollments**: Junction table for student-class relationships

### Educational Content
- **Tests**: Test/exam definitions
- **TestResults**: Individual student test scores and feedback
- **HomeworkAssignments**: Homework assignment definitions
- **HomeworkSubmissions**: Student homework submissions and grades

### Scheduling
- **Schedules**: Regular class schedules
- **ScheduleExceptions**: One-time schedule changes or cancellations
- **Meetings**: Parent-teacher conferences and other meetings

### Attendance & Notes
- **AttendanceRecords**: Daily attendance tracking
- **AttendanceEntries**: Individual student attendance entries
- **ClassNotes**: Daily class notes and objectives

## Setup Instructions

### 1. Database Configuration

1. Create a PostgreSQL database:
   ```sql
   CREATE DATABASE classboard_dev;
   CREATE USER classboard_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE classboard_dev TO classboard_user;
   ```

2. Update the `.env` file with your database credentials:
   ```env
   DATABASE_URL="postgresql://classboard_user:your_password@localhost:5432/classboard_dev"
   ```

### 2. Run Database Migrations

1. Generate Prisma client:
   ```bash
   npm run db:generate
   ```

2. Run database migrations:
   ```bash
   npm run db:migrate
   ```

3. (Optional) Seed with sample data:
   ```bash
   npm run db:seed
   ```

### 3. Data Migration from Mock Data

To migrate existing mock data from the frontend to the database:

1. Run the data migration script:
   ```bash
   npm run db:migrate-data
   ```

This script will:
- Clear existing data from all tables
- Create a default teacher user
- Migrate all students, classes, and enrollments
- Migrate schedules, tests, homework, and attendance data
- Validate the migration was successful

## Available Scripts

- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:reset` - Reset database (drops all data)
- `npm run db:migrate-data` - Migrate mock data to database

## Database Schema Details

### Key Design Decisions

1. **UUID Primary Keys**: All entities use UUID primary keys for better scalability and security
2. **Soft Relationships**: Foreign key relationships with CASCADE delete for data integrity
3. **Flexible Date Handling**: Dates stored as strings to match existing frontend format
4. **Normalized Attendance**: Attendance data split into records and individual entries
5. **Enum Types**: Used for status fields to ensure data consistency

### Relationships

- Students can be enrolled in multiple classes (many-to-many via ClassEnrollments)
- Classes can have multiple schedules (one-to-many)
- Tests belong to classes and have multiple results (one-to-many)
- Homework assignments belong to classes and have multiple submissions (one-to-many)
- Attendance records belong to classes and contain multiple student entries

### Indexes and Constraints

- Unique constraints on email fields
- Composite unique constraints for enrollment and submission relationships
- Foreign key constraints with CASCADE delete for data integrity

## Migration Service

The `DataMigrationService` class provides methods to:

- Migrate individual entity types
- Handle data transformation between mock and database formats
- Validate migration integrity
- Clear and reset data for testing

### Usage Example

```typescript
import { DataMigrationService } from './src/services/dataMigrationService'

const migrationService = new DataMigrationService()
await migrationService.migrateAllData(mockData)
const isValid = await migrationService.validateMigration()
```

## Troubleshooting

### Common Issues

1. **Connection Errors**: Verify PostgreSQL is running and credentials are correct
2. **Migration Failures**: Check for data integrity issues or missing dependencies
3. **Permission Errors**: Ensure database user has proper privileges

### Debugging

Enable Prisma query logging by setting in the database config:
```typescript
log: ['query', 'error', 'warn']
```

### Data Validation

The migration service includes validation to ensure:
- All core entities have been migrated
- Relationships are properly established
- Data counts match expectations

## Production Considerations

1. **Backup Strategy**: Implement regular database backups
2. **Connection Pooling**: Use connection pooling for better performance
3. **Monitoring**: Set up database monitoring and alerting
4. **Security**: Use environment variables for sensitive configuration
5. **Migrations**: Test migrations in staging before production deployment