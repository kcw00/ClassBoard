# ClassBoard Testing Documentation

This document provides comprehensive information about testing strategies, test suites, and testing best practices for the ClassBoard application.

## 🧪 Testing Overview

ClassBoard implements a comprehensive testing strategy covering all layers of the application:

- **Frontend Testing**: React components, hooks, utilities, and integration tests
- **Backend Testing**: API endpoints, services, database operations, and performance tests
- **End-to-End Testing**: Complete user workflows and system integration
- **Performance Testing**: Load testing, stress testing, and performance monitoring
- **Security Testing**: Authentication, authorization, and vulnerability testing

## 📊 Test Coverage

### Current Coverage Metrics
- **Frontend**: 90%+ test coverage
- **Backend**: 95%+ test coverage
- **Integration Tests**: 85%+ coverage of critical paths
- **E2E Tests**: 80%+ coverage of user workflows

### Coverage Goals
- **Unit Tests**: 95% line coverage
- **Integration Tests**: 90% API endpoint coverage
- **E2E Tests**: 85% user workflow coverage
- **Performance Tests**: 100% critical endpoint coverage

## 🏗️ Testing Architecture

### Frontend Testing Stack
```
Jest + React Testing Library + MSW
├── Unit Tests (Components, Hooks, Utils)
├── Integration Tests (Component Interactions)
├── API Integration Tests (Service Layer)
└── Visual Regression Tests (Storybook)
```

### Backend Testing Stack
```
Jest + Supertest + Test Database
├── Unit Tests (Services, Utils, Validators)
├── Integration Tests (API Endpoints)
├── Database Tests (Prisma Operations)
├── Performance Tests (Artillery)
└── Security Tests (Custom Scripts)
```

### E2E Testing Stack
```
Cypress + Custom Commands
├── User Workflow Tests
├── Cross-browser Testing
├── Mobile Responsive Tests
└── Accessibility Tests
```

## 🎯 Frontend Testing

### Component Testing

**Example: DeleteConfirmationDialog Test**
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DeleteConfirmationDialog } from '../DeleteConfirmationDialog'

describe('DeleteConfirmationDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    title: 'Delete Class',
    description: 'Are you sure?',
    itemName: 'Math 101'
  }

  it('renders with impact information', () => {
    const impactInfo = {
      hasAssociatedData: true,
      affectedItems: [
        { type: 'students', count: 5, description: '5 enrolled students' }
      ]
    }

    render(
      <DeleteConfirmationDialog 
        {...defaultProps} 
        impactInfo={impactInfo}
      />
    )

    expect(screen.getByText('5 enrolled students')).toBeInTheDocument()
    expect(screen.getByText('5 items')).toBeInTheDocument()
  })

  it('calls onConfirm when delete button is clicked', async () => {
    render(<DeleteConfirmationDialog {...defaultProps} />)
    
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    
    await waitFor(() => {
      expect(defaultProps.onConfirm).toHaveBeenCalled()
    })
  })
})
```

### Hook Testing

**Example: useNetworkStatus Test**
```typescript
import { renderHook, act } from '@testing-library/react'
import { useNetworkStatus } from '../useNetworkStatus'

describe('useNetworkStatus', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'onLine', { value: true })
  })

  it('returns online status when connection is good', () => {
    const { result } = renderHook(() => useNetworkStatus())

    expect(result.current.status).toBe('online')
    expect(result.current.isOnline).toBe(true)
    expect(result.current.isOffline).toBe(false)
  })

  it('detects offline status', () => {
    Object.defineProperty(navigator, 'onLine', { value: false })
    
    const { result } = renderHook(() => useNetworkStatus())

    expect(result.current.status).toBe('offline')
    expect(result.current.isOffline).toBe(true)
  })
})
```

### Integration Testing

**Example: Delete Workflow Integration Test**
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AppDataProvider } from '@/context/AppDataContext'
import ClassManagement from '../ClassManagement'

describe('ClassManagement Delete Integration', () => {
  const renderWithContext = (component) => {
    return render(
      <AppDataProvider>
        {component}
      </AppDataProvider>
    )
  }

  it('handles complete delete workflow with impact analysis', async () => {
    renderWithContext(<ClassManagement />)

    // Find class to delete
    const classCard = screen.getByTestId('class-card-math-101')
    const deleteButton = within(classCard).getByRole('button', { name: /delete/i })
    
    // Click delete button
    fireEvent.click(deleteButton)

    // Wait for impact calculation
    await waitFor(() => {
      expect(screen.getByText(/calculating deletion impact/i)).toBeInTheDocument()
    })

    // Verify confirmation dialog appears
    await waitFor(() => {
      expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument()
    })

    // Check impact information is displayed
    expect(screen.getByText(/5 enrolled students will be unenrolled/i)).toBeInTheDocument()

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /delete/i })
    fireEvent.click(confirmButton)

    // Verify success message
    await waitFor(() => {
      expect(screen.getByText(/class deleted successfully/i)).toBeInTheDocument()
    })

    // Verify class is removed from list
    expect(screen.queryByTestId('class-card-math-101')).not.toBeInTheDocument()
  })
})
```

### Running Frontend Tests

```bash
# Run all frontend tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test DeleteConfirmationDialog.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="delete"
```

## 🔧 Backend Testing

### Unit Testing

**Example: Service Unit Test**
```typescript
import { noteService } from '../services/noteService'
import { NotFoundError } from '../utils/errors'

// Mock Prisma Client
const mockPrisma = {
  classNote: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  class: {
    findUnique: jest.fn()
  }
}

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma)
}))

describe('NoteService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createNote', () => {
    it('creates note successfully', async () => {
      const mockClass = { id: 'class-123', name: 'Math 101' }
      const mockNote = {
        id: 'note-123',
        classId: 'class-123',
        content: 'Test note',
        date: '2024-01-15'
      }

      mockPrisma.class.findUnique.mockResolvedValue(mockClass)
      mockPrisma.classNote.create.mockResolvedValue(mockNote)

      const result = await noteService.createNote({
        classId: 'class-123',
        content: 'Test note',
        date: '2024-01-15'
      })

      expect(result).toEqual(mockNote)
      expect(mockPrisma.class.findUnique).toHaveBeenCalledWith({
        where: { id: 'class-123' }
      })
    })

    it('throws error if class not found', async () => {
      mockPrisma.class.findUnique.mockResolvedValue(null)

      await expect(noteService.createNote({
        classId: 'nonexistent',
        content: 'Test note',
        date: '2024-01-15'
      })).rejects.toThrow(new NotFoundError('Class not found'))
    })
  })
})
```

### Integration Testing

**Example: API Integration Test**
```typescript
import request from 'supertest'
import { PrismaClient } from '@prisma/client'
import app from '../../app'
import { generateTestToken } from '../setup'

const prisma = new PrismaClient()

describe('Classes API Integration', () => {
  let authToken: string
  let testClassId: string

  beforeAll(async () => {
    authToken = generateTestToken()
  })

  afterAll(async () => {
    await prisma.class.deleteMany()
    await prisma.$disconnect()
  })

  describe('POST /api/classes', () => {
    it('creates a new class successfully', async () => {
      const classData = {
        name: 'Test Math Class',
        subject: 'Mathematics',
        description: 'Test class for integration tests',
        room: 'Room 101',
        capacity: 30,
        color: '#FF5733'
      }

      const response = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(classData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toMatchObject(classData)
      expect(response.body.data.id).toBeDefined()

      testClassId = response.body.data.id
    })

    it('returns validation error for invalid data', async () => {
      const invalidData = {
        name: '', // Empty name should fail validation
        subject: 'Mathematics'
      }

      const response = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.errors).toBeDefined()
    })
  })

  describe('DELETE /api/classes/:id', () => {
    it('deletes class with impact analysis', async () => {
      const response = await request(app)
        .delete(`/api/classes/${testClassId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Class deleted successfully')
      expect(response.body.data.impactSummary).toBeDefined()
    })
  })
})
```

### Performance Testing

**Example: Load Test Configuration**
```yaml
# backend/performance/load-test.yml
config:
  target: 'http://localhost:3001'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Load test"
    - duration: 60
      arrivalRate: 100
      name: "Stress test"
  processor: "./test-processor.js"

scenarios:
  - name: "API Load Test"
    weight: 100
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "test@example.com"
            password: "password123"
          capture:
            - json: "$.data.tokens.accessToken"
              as: "token"
      
      - get:
          url: "/api/classes"
          headers:
            Authorization: "Bearer {{ token }}"
          expect:
            - statusCode: 200
      
      - get:
          url: "/api/students"
          headers:
            Authorization: "Bearer {{ token }}"
          expect:
            - statusCode: 200
            - contentType: json
```

### Running Backend Tests

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

# Security testing
npm run test:security
```

## 🌐 End-to-End Testing

### Cypress Configuration

**Example: E2E Test**
```typescript
// cypress/e2e/class-management.cy.ts
describe('Class Management E2E', () => {
  beforeEach(() => {
    cy.login('teacher@example.com', 'password123')
    cy.visit('/classes')
  })

  it('creates, edits, and deletes a class', () => {
    // Create class
    cy.get('[data-testid="create-class-button"]').click()
    cy.get('[data-testid="class-name-input"]').type('Test Class')
    cy.get('[data-testid="class-subject-select"]').select('Mathematics')
    cy.get('[data-testid="class-description-textarea"]').type('Test description')
    cy.get('[data-testid="class-room-input"]').type('Room 101')
    cy.get('[data-testid="class-capacity-input"]').type('30')
    cy.get('[data-testid="submit-button"]').click()

    // Verify class appears in list
    cy.contains('Test Class').should('be.visible')
    cy.contains('Mathematics').should('be.visible')

    // Edit class
    cy.get('[data-testid="class-card-test-class"]').within(() => {
      cy.get('[data-testid="edit-button"]').click()
    })
    cy.get('[data-testid="class-name-input"]').clear().type('Updated Test Class')
    cy.get('[data-testid="submit-button"]').click()

    // Verify update
    cy.contains('Updated Test Class').should('be.visible')

    // Delete class
    cy.get('[data-testid="class-card-updated-test-class"]').within(() => {
      cy.get('[data-testid="delete-button"]').click()
    })

    // Handle deletion confirmation
    cy.get('[data-testid="delete-confirmation-dialog"]').should('be.visible')
    cy.get('[data-testid="confirm-delete-button"]').click()

    // Verify deletion
    cy.contains('Updated Test Class').should('not.exist')
    cy.contains('Class deleted successfully').should('be.visible')
  })

  it('handles delete with impact analysis', () => {
    // Create class with enrolled students
    cy.createClassWithStudents('Math 101', ['Alice Johnson', 'Bob Smith'])

    // Attempt to delete
    cy.get('[data-testid="class-card-math-101"]').within(() => {
      cy.get('[data-testid="delete-button"]').click()
    })

    // Verify impact analysis is shown
    cy.get('[data-testid="deletion-impact-info"]').should('be.visible')
    cy.contains('2 enrolled students will be unenrolled').should('be.visible')
    cy.contains('This action will also affect:').should('be.visible')

    // Confirm deletion
    cy.get('[data-testid="confirm-delete-button"]').click()

    // Verify success
    cy.contains('Class deleted successfully').should('be.visible')
  })
})
```

### Custom Cypress Commands

```typescript
// cypress/support/commands.ts
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      createClassWithStudents(className: string, studentNames: string[]): Chainable<void>
      waitForApiResponse(alias: string): Chainable<void>
    }
  }
}

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.request({
    method: 'POST',
    url: '/api/auth/login',
    body: { email, password }
  }).then((response) => {
    window.localStorage.setItem('authToken', response.body.data.tokens.accessToken)
  })
})

Cypress.Commands.add('createClassWithStudents', (className: string, studentNames: string[]) => {
  // Create class
  cy.request({
    method: 'POST',
    url: '/api/classes',
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('authToken')}`
    },
    body: {
      name: className,
      subject: 'Mathematics',
      description: 'Test class',
      room: 'Room 101',
      capacity: 30,
      color: '#3b82f6'
    }
  }).then((classResponse) => {
    const classId = classResponse.body.data.id

    // Create and enroll students
    studentNames.forEach((studentName) => {
      cy.request({
        method: 'POST',
        url: '/api/students',
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem('authToken')}`
        },
        body: {
          name: studentName,
          email: `${studentName.toLowerCase().replace(' ', '.')}@example.com`,
          phone: '(555) 123-4567',
          grade: '10th Grade',
          parentContact: '(555) 123-4568'
        }
      }).then((studentResponse) => {
        const studentId = studentResponse.body.data.id

        // Enroll student in class
        cy.request({
          method: 'POST',
          url: `/api/classes/${classId}/enroll`,
          headers: {
            Authorization: `Bearer ${window.localStorage.getItem('authToken')}`
          },
          body: { studentId }
        })
      })
    })
  })
})
```

### Running E2E Tests

```bash
# Open Cypress Test Runner
npx cypress open

# Run tests headlessly
npx cypress run

# Run specific test file
npx cypress run --spec "cypress/e2e/class-management.cy.ts"

# Run tests in specific browser
npx cypress run --browser chrome

# Run tests with video recording
npx cypress run --record --key <record-key>
```

## 📈 Performance Testing

### Load Testing with Artillery

```bash
# Run load tests
cd backend
npm run test:load

# Run specific load test
npx artillery run performance/load-test.yml

# Generate HTML report
npx artillery run --output report.json performance/load-test.yml
npx artillery report report.json
```

### Performance Benchmarks

**API Response Time Targets:**
- Authentication endpoints: < 200ms
- CRUD operations: < 150ms
- Complex queries: < 300ms
- File uploads: < 2s (depending on size)

**Load Testing Results:**
- **Concurrent Users**: 100
- **Requests per Second**: 500+
- **Average Response Time**: < 100ms
- **95th Percentile**: < 200ms
- **Error Rate**: < 0.1%

## 🔒 Security Testing

### Authentication Testing

```typescript
describe('Authentication Security', () => {
  it('prevents access without valid token', async () => {
    const response = await request(app)
      .get('/api/classes')
      .expect(401)

    expect(response.body.error.code).toBe('AUTHENTICATION_ERROR')
  })

  it('prevents access with expired token', async () => {
    const expiredToken = generateExpiredToken()
    
    const response = await request(app)
      .get('/api/classes')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401)
  })

  it('prevents SQL injection in login', async () => {
    const maliciousPayload = {
      email: "admin@example.com'; DROP TABLE users; --",
      password: "password"
    }

    const response = await request(app)
      .post('/api/auth/login')
      .send(maliciousPayload)
      .expect(400)

    expect(response.body.error.code).toBe('VALIDATION_ERROR')
  })
})
```

### Input Validation Testing

```typescript
describe('Input Validation Security', () => {
  it('sanitizes XSS attempts in class creation', async () => {
    const xssPayload = {
      name: '<script>alert("XSS")</script>',
      subject: 'Mathematics',
      description: '<img src="x" onerror="alert(1)">',
      room: 'Room 101',
      capacity: 30,
      color: '#3b82f6'
    }

    const response = await request(app)
      .post('/api/classes')
      .set('Authorization', `Bearer ${validToken}`)
      .send(xssPayload)
      .expect(400)

    expect(response.body.error.code).toBe('VALIDATION_ERROR')
  })
})
```

## 🎯 Test Data Management

### Test Database Setup

```typescript
// backend/src/__tests__/setup.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL
    }
  }
})

beforeAll(async () => {
  // Clean database
  await prisma.$executeRaw`TRUNCATE TABLE "users", "students", "classes" CASCADE`
  
  // Seed test data
  await seedTestData()
})

afterAll(async () => {
  await prisma.$disconnect()
})

async function seedTestData() {
  // Create test user
  await prisma.user.create({
    data: {
      id: 'test-user-1',
      email: 'test@example.com',
      name: 'Test Teacher',
      role: 'TEACHER'
    }
  })

  // Create test students
  await prisma.student.createMany({
    data: [
      {
        id: 'test-student-1',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        phone: '(555) 123-4567',
        grade: '10th Grade',
        parentContact: '(555) 123-4568',
        enrollmentDate: '2024-08-15'
      }
    ]
  })
}
```

### Test Factories

```typescript
// backend/src/__tests__/factories/classFactory.ts
export const createTestClass = (overrides = {}) => ({
  name: 'Test Math Class',
  subject: 'Mathematics',
  description: 'Test class for unit tests',
  room: 'Room 101',
  capacity: 30,
  color: '#3b82f6',
  createdDate: '2024-01-15',
  ...overrides
})

export const createTestStudent = (overrides = {}) => ({
  name: 'Test Student',
  email: 'student@example.com',
  phone: '(555) 123-4567',
  grade: '10th Grade',
  parentContact: '(555) 123-4568',
  enrollmentDate: '2024-08-15',
  ...overrides
})
```

## 📊 Test Reporting

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

### Test Results Dashboard

The project includes comprehensive test reporting:

- **Jest HTML Reporter**: Detailed test results with timing
- **Coverage Reports**: Line, branch, and function coverage
- **Performance Reports**: Load test results with charts
- **E2E Reports**: Cypress dashboard with screenshots and videos

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3

  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd backend && npm ci
      - run: cd backend && npm run test:comprehensive
      - run: cd backend && npm run test:load

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: cypress-io/github-action@v5
        with:
          build: npm run build
          start: npm run dev
          wait-on: 'http://localhost:5173'
```

## 🚀 Best Practices

### Test Organization
1. **Arrange-Act-Assert**: Structure tests clearly
2. **Descriptive Names**: Use clear, descriptive test names
3. **Single Responsibility**: One assertion per test when possible
4. **Test Independence**: Tests should not depend on each other
5. **Mock External Dependencies**: Mock APIs, databases, and external services

### Performance Testing
1. **Baseline Metrics**: Establish performance baselines
2. **Regular Testing**: Run performance tests on every release
3. **Realistic Data**: Use production-like data volumes
4. **Monitor Trends**: Track performance over time
5. **Bottleneck Identification**: Profile and identify bottlenecks

### Security Testing
1. **Input Validation**: Test all input validation rules
2. **Authentication**: Test all authentication scenarios
3. **Authorization**: Verify role-based access controls
4. **Data Sanitization**: Test XSS and injection prevention
5. **Rate Limiting**: Verify rate limiting works correctly

### Maintenance
1. **Regular Updates**: Keep testing dependencies updated
2. **Test Review**: Review and refactor tests regularly
3. **Documentation**: Document complex test scenarios
4. **Training**: Ensure team understands testing practices
5. **Continuous Improvement**: Regularly improve test coverage and quality

This comprehensive testing documentation ensures that ClassBoard maintains high quality, performance, and security standards through rigorous testing practices.