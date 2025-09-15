# Testing Documentation

This document provides comprehensive information about the testing strategy and implementation for the ClassBoard backend API.

## Overview

The backend testing suite includes multiple types of tests to ensure code quality, functionality, and performance:

- **Unit Tests**: Test individual functions and methods in isolation
- **Integration Tests**: Test API endpoints with database interactions
- **End-to-End Tests**: Test complete user workflows
- **Performance Tests**: Validate response times and system performance
- **Security Tests**: Verify security measures and vulnerability protection
- **Load Tests**: Test system behavior under high load

## Test Structure

```
backend/src/__tests__/
├── setup.ts                    # Global test configuration
├── utils/
│   └── test-helpers.ts         # Test utilities and helpers
├── integration/                # API endpoint integration tests
│   ├── auth.integration.test.ts
│   ├── classes.integration.test.ts
│   ├── students.integration.test.ts
│   ├── assessments.integration.test.ts
│   ├── files.integration.test.ts
│   ├── meetings.integration.test.ts
│   └── schedules.integration.test.ts
├── e2e/                        # End-to-end workflow tests
│   └── user-workflows.e2e.test.ts
├── performance/                # Performance and load tests
│   └── api-performance.test.ts
└── [service-name].test.ts      # Unit tests for services
```

## Running Tests

### Individual Test Types

```bash
# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e

# Run performance tests
npm run test:performance

# Run all tests with coverage
npm run test:coverage

# Run tests for CI/CD
npm run test:ci
```

### Comprehensive Test Suite

```bash
# Run all test types in sequence with detailed reporting
npm run test:comprehensive

# Run load tests with Artillery
npm run test:load
```

### Watch Mode

```bash
# Run tests in watch mode during development
npm run test:watch
```

## Test Configuration

### Environment Variables

Create a `.env.test` file for test-specific configuration:

```env
NODE_ENV=test
DATABASE_URL=postgresql://user:password@localhost:5432/classboard_test
TEST_DATABASE_URL=postgresql://user:password@localhost:5432/classboard_test
JWT_SECRET=test-jwt-secret-key
CLEAN_DB_BEFORE_EACH=true
CLEAN_DB_AFTER_EACH=true
```

### Jest Configuration

The Jest configuration supports multiple test types with different timeouts and settings:

- **Unit Tests**: 10 second timeout
- **Integration Tests**: 20 second timeout
- **E2E Tests**: 30 second timeout
- **Performance Tests**: 60 second timeout

## Test Utilities

### Test Helpers

The `test-helpers.ts` file provides utilities for:

- Creating test contexts with authentication
- Generating mock data
- Managing test database cleanup
- Validating API responses
- Performance measurement utilities

### Example Usage

```typescript
import { createTestContext, createTestData, cleanupTestData } from '../utils/test-helpers';

describe('My Test Suite', () => {
  let context: TestContext;
  let cleanup: TestDataCleanup;

  beforeAll(async () => {
    context = createTestContext('test-user', 'test@example.com', 'teacher');
    cleanup = await createTestData(context);
  });

  afterAll(async () => {
    await cleanupTestData(context, cleanup);
  });

  // Your tests here...
});
```

## Unit Tests

Unit tests focus on testing individual service methods and utilities in isolation. They use mocked dependencies and don't require database connections.

### Example Unit Test

```typescript
import { ClassService } from '../services/classService';

describe('ClassService', () => {
  let classService: ClassService;

  beforeEach(() => {
    classService = new ClassService();
  });

  it('should validate class data correctly', () => {
    const validClass = {
      name: 'Test Class',
      subject: 'Mathematics',
      // ... other properties
    };

    expect(classService.validateClassData(validClass)).toBe(true);
  });
});
```

## Integration Tests

Integration tests verify that API endpoints work correctly with the database and external services.

### Example Integration Test

```typescript
import request from 'supertest';
import app from '../../app';
import { generateTestToken } from '../setup';

describe('Classes API Integration', () => {
  let authToken: string;

  beforeAll(() => {
    authToken = generateTestToken();
  });

  it('should create a new class', async () => {
    const response = await request(app)
      .post('/api/classes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Class',
        subject: 'Mathematics',
        // ... other properties
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('Test Class');
  });
});
```

## End-to-End Tests

E2E tests verify complete user workflows from start to finish, testing the integration of multiple components.

### Example E2E Test

```typescript
describe('Complete Class Management Workflow', () => {
  it('should handle full class lifecycle', async () => {
    // 1. Create class
    // 2. Add students
    // 3. Create assessments
    // 4. Record attendance
    // 5. Generate reports
    // 6. Cleanup
  });
});
```

## Performance Tests

Performance tests ensure the API meets response time requirements and can handle expected load.

### Performance Thresholds

- **Class List**: < 500ms average response time
- **Class Details**: < 300ms average response time
- **Class Creation**: < 800ms average response time
- **Student Search**: < 600ms average response time
- **Concurrent Requests**: Handle 10+ concurrent requests efficiently

### Example Performance Test

```typescript
import { runPerformanceTest } from '../setup';

describe('API Performance', () => {
  it('should handle class listing with acceptable performance', async () => {
    const testFn = async () => {
      return await request(app)
        .get('/api/classes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    };

    const results = await runPerformanceTest(testFn, 50, 500);
    expect(results.passed).toBe(true);
    expect(results.averageTime).toBeLessThan(500);
  });
});
```

## Load Testing

Load testing uses Artillery to simulate realistic user traffic patterns.

### Load Test Configuration

The `performance/load-test.yml` file defines:

- **Warm-up Phase**: 5 requests/second for 60 seconds
- **Ramp-up Phase**: 5-25 requests/second over 120 seconds
- **Sustained Load**: 25 requests/second for 300 seconds
- **Peak Load**: 25-50 requests/second over 120 seconds
- **Cool-down**: 50-5 requests/second over 60 seconds

### Running Load Tests

```bash
# Run load tests against local server
npm run test:load

# Run load tests against staging
artillery run performance/load-test.yml --target https://staging-api.classboard.com
```

## Coverage Requirements

The test suite maintains high code coverage standards:

- **Overall Coverage**: 80% minimum
- **Functions**: 80% minimum
- **Lines**: 80% minimum
- **Branches**: 80% minimum

### Viewing Coverage Reports

```bash
# Generate and view coverage report
npm run test:coverage
open coverage/lcov-report/index.html
```

## Continuous Integration

The CI/CD pipeline runs all test types automatically:

1. **Unit Tests**: Fast feedback on code changes
2. **Integration Tests**: Verify API functionality
3. **E2E Tests**: Validate user workflows
4. **Performance Tests**: Ensure performance standards
5. **Security Tests**: Check for vulnerabilities
6. **Load Tests**: Validate under load (staging only)

### CI Configuration

See `.github/workflows/ci.yml` for the complete CI configuration.

## Best Practices

### Writing Tests

1. **Arrange, Act, Assert**: Structure tests clearly
2. **Descriptive Names**: Use clear, descriptive test names
3. **Single Responsibility**: Each test should verify one thing
4. **Independent Tests**: Tests should not depend on each other
5. **Clean Up**: Always clean up test data

### Test Data Management

1. **Use Factories**: Create test data with factory functions
2. **Isolate Data**: Each test should use its own data
3. **Clean Up**: Remove test data after tests complete
4. **Realistic Data**: Use realistic test data when possible

### Performance Testing

1. **Set Baselines**: Establish performance baselines
2. **Monitor Trends**: Track performance over time
3. **Test Realistic Scenarios**: Use realistic user patterns
4. **Consider Resources**: Account for memory and CPU usage

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Ensure test database is running
   - Check DATABASE_URL configuration
   - Verify database permissions

2. **Test Timeouts**
   - Increase timeout for slow operations
   - Check for infinite loops or hanging promises
   - Optimize database queries

3. **Memory Leaks**
   - Ensure proper cleanup in afterEach/afterAll
   - Close database connections
   - Clear mocks and timers

4. **Flaky Tests**
   - Add proper wait conditions
   - Use deterministic test data
   - Avoid time-dependent assertions

### Debugging Tests

```bash
# Run tests with debug output
DEBUG=* npm test

# Run specific test file
npm test -- --testPathPattern=classService.test.ts

# Run tests with verbose output
npm test -- --verbose

# Run tests and keep process alive for debugging
npm test -- --runInBand --detectOpenHandles
```

## Monitoring and Reporting

### Test Reports

The comprehensive test runner generates detailed reports including:

- Test execution times
- Coverage percentages
- Performance metrics
- Error details
- Recommendations

### Performance Monitoring

Performance tests generate metrics for:

- Response times (average, min, max)
- Throughput (requests per second)
- Error rates
- Memory usage
- Concurrent request handling

### Alerts and Notifications

The CI pipeline can be configured to send notifications on:

- Test failures
- Performance degradation
- Coverage drops
- Security vulnerabilities

## Contributing

When adding new features:

1. **Write Tests First**: Follow TDD principles
2. **Maintain Coverage**: Ensure new code is well-tested
3. **Update Documentation**: Keep this document current
4. **Performance Impact**: Consider performance implications
5. **Security Considerations**: Add security tests when needed

### Test Review Checklist

- [ ] Unit tests cover all new functions/methods
- [ ] Integration tests cover new API endpoints
- [ ] E2E tests cover new user workflows
- [ ] Performance tests validate response times
- [ ] Security tests check for vulnerabilities
- [ ] Coverage meets minimum requirements
- [ ] Tests are independent and reliable
- [ ] Test data is properly cleaned up
- [ ] Documentation is updated