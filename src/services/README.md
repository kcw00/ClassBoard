# API Service Layer

A comprehensive API service layer that replaces the mock data context with real backend integration.

## Features

- 🚀 **Full API Integration**: Complete REST API client for all data operations
- 🔄 **Automatic Retry Logic**: Failed requests are automatically retried with exponential backoff
- 💾 **Smart Caching**: GET requests are cached for improved performance
- ⚡ **Optimistic Updates**: UI updates immediately with automatic rollback on errors
- 🎯 **Loading States**: Track loading state for each operation
- 🛡️ **Error Handling**: Comprehensive error handling with user-friendly messages
- 🔔 **Toast Notifications**: Automatic success/error notifications
- 🎭 **Type Safety**: Full TypeScript support with type-safe API calls
- 🧪 **Testable**: Fully unit tested with comprehensive test coverage

## Architecture

```
┌─────────────────────┐
│   React Components  │
└─────────┬───────────┘
          │
┌─────────▼───────────┐
│  useAppDataService  │  ← Hook with loading states & optimistic updates
└─────────┬───────────┘
          │
┌─────────▼───────────┐
│   AppDataService    │  ← Core service with caching & retry logic
└─────────┬───────────┘
          │
┌─────────▼───────────┐
│   Backend API       │  ← Express.js REST API
└─────────────────────┘
```

## Quick Start

### 1. Basic Usage

```tsx
import { useAppDataService } from '@/hooks/useAppDataService'

function MyComponent() {
  const { data, actions, loading, errors } = useAppDataService()
  
  const handleAddClass = async () => {
    try {
      const newClass = await actions.addClass({
        name: 'Math 101',
        subject: 'Mathematics',
        description: 'Basic mathematics course',
        room: 'Room 101',
        capacity: 25,
        color: '#3b82f6'
      })
      console.log('Class created:', newClass)
    } catch (error) {
      console.error('Failed to create class:', error)
    }
  }
  
  return (
    <div>
      <button 
        onClick={handleAddClass}
        disabled={loading.classes}
      >
        {loading.classes ? 'Creating...' : 'Add Class'}
      </button>
      
      {errors.classes && (
        <div className="error">Error: {errors.classes}</div>
      )}
      
      {data.classes.map(cls => (
        <div key={cls.id}>{cls.name}</div>
      ))}
    </div>
  )
}
```

### 2. With Toast Notifications

```tsx
import { useAppDataWithToasts } from '@/hooks/useAppDataWithToasts'

function MyComponent() {
  const { data, actions } = useAppDataWithToasts()
  
  const handleAddClass = async () => {
    try {
      await actions.addClass(classData)
      // Success toast shown automatically
    } catch (error) {
      // Error toast shown automatically
    }
  }
}
```

### 3. Provider Setup

```tsx
import { AppDataServiceProvider } from '@/context/AppDataServiceContext'
import { ToastProvider } from '@/components/common/Toast'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppDataServiceProvider>
          <YourApp />
        </AppDataServiceProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}
```

## API Reference

### AppDataService

The core service class that handles all API communication.

#### Methods

##### Classes
- `getClasses(): Promise<Class[]>` - Get all classes
- `getClass(id: string): Promise<Class>` - Get single class
- `addClass(data): Promise<Class>` - Create new class
- `updateClass(id, updates): Promise<Class>` - Update class
- `deleteClass(id): Promise<void>` - Delete class
- `enrollStudent(classId, studentId): Promise<void>` - Enroll student
- `unenrollStudent(classId, studentId): Promise<void>` - Unenroll student

##### Students
- `getStudents(): Promise<Student[]>` - Get all students
- `getStudent(id: string): Promise<Student>` - Get single student
- `addStudent(data): Promise<Student>` - Create new student
- `updateStudent(id, updates): Promise<Student>` - Update student
- `deleteStudent(id): Promise<void>` - Delete student

##### Schedules
- `getSchedules(): Promise<Schedule[]>` - Get all schedules
- `getSchedulesByClass(classId): Promise<Schedule[]>` - Get schedules for class
- `addSchedule(data): Promise<Schedule>` - Create schedule
- `updateSchedule(id, updates): Promise<Schedule>` - Update schedule
- `deleteSchedule(id): Promise<void>` - Delete schedule

##### Tests & Assessments
- `getTests(): Promise<Test[]>` - Get all tests
- `getTestsByClass(classId): Promise<Test[]>` - Get tests for class
- `addTest(data): Promise<Test>` - Create test
- `updateTest(id, updates): Promise<Test>` - Update test
- `deleteTest(id): Promise<void>` - Delete test
- `getTestResults(): Promise<TestResult[]>` - Get all test results
- `addTestResult(data): Promise<TestResult>` - Create test result
- `updateTestResult(id, updates): Promise<TestResult>` - Update test result

##### Utility
- `clearCache(): void` - Clear all cached data
- `invalidateCache(pattern: string): void` - Clear specific cache entries
- `isLoading(operation: string): boolean` - Check if operation is loading
- `subscribeToLoadingStates(callback): () => void` - Subscribe to loading changes

### useAppDataService Hook

React hook that provides data, actions, and state management.

#### Returns

```tsx
{
  data: {
    classes: Class[]
    students: Student[]
    schedules: Schedule[]
    // ... other data arrays
  },
  actions: {
    addClass: (data) => Promise<Class>
    addStudent: (data) => Promise<Student>
    // ... other action methods
  },
  loading: {
    classes: boolean
    students: boolean
    // ... loading states for each resource
  },
  errors: {
    classes?: string
    students?: string
    // ... error messages for each resource
  },
  isInitialLoading: boolean
}
```

### useAppDataWithToasts Hook

Enhanced version with automatic toast notifications.

Same interface as `useAppDataService` but shows success/error toasts automatically.

## Configuration

### Environment Variables

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:3001/api
VITE_USE_API_SERVICE=true

# Cache Configuration (optional)
VITE_CACHE_TTL=300000  # 5 minutes in milliseconds
```

### Service Configuration

```tsx
// Customize service behavior
const service = new AppDataService()

// Configure timeouts
const API_TIMEOUT = 10000 // 10 seconds

// Configure retry behavior
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second
```

## Error Handling

### Error Types

- **ApiError**: Server-side errors (4xx, 5xx responses)
- **NetworkError**: Network connectivity issues
- **TimeoutError**: Request timeout

### Error Recovery

```tsx
try {
  await actions.addClass(data)
} catch (error) {
  if (error instanceof ApiError) {
    // Handle API errors
    console.log('API Error:', error.message, error.status)
  } else if (error instanceof NetworkError) {
    // Handle network errors
    console.log('Network Error:', error.message)
  }
}
```

## Caching

### Cache Behavior

- **GET requests**: Cached for 5 minutes by default
- **Mutations**: Automatically invalidate related cache entries
- **Manual control**: Clear cache when needed

### Cache Management

```tsx
const { actions } = useAppDataService()

// Clear all cache
actions.clearCache()

// Refresh all data (bypasses cache)
await actions.refreshData()
```

## Testing

### Unit Tests

```tsx
import { AppDataService } from '@/services/AppDataService'

// Mock fetch
global.fetch = jest.fn()

describe('AppDataService', () => {
  let service: AppDataService
  
  beforeEach(() => {
    service = new AppDataService()
    fetch.mockClear()
  })
  
  it('should get classes', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] })
    })
    
    const classes = await service.getClasses()
    expect(classes).toEqual([])
  })
})
```

### Integration Tests

```tsx
import { renderHook } from '@testing-library/react'
import { useAppDataService } from '@/hooks/useAppDataService'

test('should load initial data', async () => {
  const { result, waitFor } = renderHook(() => useAppDataService())
  
  await waitFor(() => {
    expect(result.current.isInitialLoading).toBe(false)
  })
  
  expect(result.current.data.classes).toBeDefined()
})
```

## Performance

### Optimizations

- **Request Deduplication**: Identical requests are deduplicated
- **Optimistic Updates**: UI updates immediately
- **Smart Caching**: Reduces unnecessary API calls
- **Connection Pooling**: Reuses HTTP connections

### Monitoring

```tsx
// Monitor loading states
const { loading } = useAppDataService()

useEffect(() => {
  console.log('Loading states:', loading)
}, [loading])

// Monitor cache hits/misses
service.subscribeToLoadingStates((states) => {
  console.log('Cache performance:', states)
})
```

## Migration from Mock Data

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed migration instructions.

## Contributing

1. Add new API methods to `AppDataService`
2. Update the hook to use new methods
3. Add comprehensive tests
4. Update TypeScript types
5. Document new features