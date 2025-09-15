# API Service Migration Guide

This guide explains how to migrate from the mock data `AppDataContext` to the new API-based `AppDataService`.

## Overview

The new API service layer provides:
- Real backend API integration
- Automatic error handling and retry logic
- Caching for improved performance
- Loading states and optimistic updates
- Toast notifications for user feedback
- Type-safe API calls

## Migration Steps

### 1. Environment Setup

Add the API base URL to your environment variables:

```bash
# .env.local
VITE_API_BASE_URL=http://localhost:3001/api
VITE_USE_API_SERVICE=true
```

### 2. Provider Setup

Replace the old `AppDataProvider` with the new providers:

```tsx
// Before
import { AppDataProvider } from '@/context/AppDataContext'

function App() {
  return (
    <AppDataProvider>
      <YourApp />
    </AppDataProvider>
  )
}

// After
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

### 3. Hook Usage

The API is mostly compatible, but actions are now async:

```tsx
// Before
import { useAppData } from '@/context/AppDataContext'

function MyComponent() {
  const { data, actions } = useAppData()
  
  const handleAddClass = () => {
    const newClass = actions.addClass(classData) // Synchronous
    console.log('Added:', newClass)
  }
}

// After - Option 1: Basic API service
import { useAppDataService } from '@/hooks/useAppDataService'

function MyComponent() {
  const { data, actions, loading, errors } = useAppDataService()
  
  const handleAddClass = async () => {
    try {
      const newClass = await actions.addClass(classData) // Async
      console.log('Added:', newClass)
    } catch (error) {
      console.error('Failed to add class:', error)
    }
  }
}

// After - Option 2: With toast notifications
import { useAppDataWithToasts } from '@/hooks/useAppDataWithToasts'

function MyComponent() {
  const { data, actions, loading, errors } = useAppDataWithToasts()
  
  const handleAddClass = async () => {
    try {
      const newClass = await actions.addClass(classData) // Async with toasts
      // Success toast shown automatically
    } catch (error) {
      // Error toast shown automatically
    }
  }
}
```

### 4. Loading States

Handle loading states in your UI:

```tsx
function MyComponent() {
  const { data, loading, isInitialLoading } = useAppDataService()
  
  if (isInitialLoading) {
    return <div>Loading initial data...</div>
  }
  
  return (
    <div>
      <Button 
        onClick={handleAddClass} 
        disabled={loading.classes}
      >
        {loading.classes && <Spinner />}
        Add Class
      </Button>
      
      {data.classes.map(class => (
        <ClassCard key={class.id} class={class} />
      ))}
    </div>
  )
}
```

### 5. Error Handling

Handle errors gracefully:

```tsx
function MyComponent() {
  const { data, errors } = useAppDataService()
  
  return (
    <div>
      {errors.classes && (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load classes: {errors.classes}
          </AlertDescription>
        </Alert>
      )}
      
      {data.classes.map(class => (
        <ClassCard key={class.id} class={class} />
      ))}
    </div>
  )
}
```

## Key Differences

### Synchronous vs Asynchronous

| Old (Mock Data) | New (API Service) |
|----------------|-------------------|
| `const result = actions.addClass(data)` | `const result = await actions.addClass(data)` |
| Immediate updates | Optimistic updates with API confirmation |
| No loading states | Loading states available |
| No error handling | Comprehensive error handling |

### New Features

1. **Caching**: GET requests are cached for better performance
2. **Retry Logic**: Failed requests are automatically retried
3. **Optimistic Updates**: UI updates immediately, reverts on error
4. **Loading States**: Track loading state for each operation
5. **Error Recovery**: Automatic error handling with user feedback

### Backward Compatibility

The `AppDataServiceContext` provides a compatibility layer that maintains the same interface as the original `AppDataContext`. This allows for gradual migration:

```tsx
// This still works during migration
import { useAppData } from '@/context/AppDataServiceContext'

function MyComponent() {
  const { data, actions } = useAppData()
  
  // Actions are fire-and-forget (like before)
  // but they use the API service under the hood
  const newClass = actions.addClass(classData)
}
```

## Best Practices

### 1. Use Error Boundaries

Wrap your app in error boundaries to catch and handle unexpected errors:

```tsx
import { ErrorBoundary } from '@/components/common/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <YourApp />
    </ErrorBoundary>
  )
}
```

### 2. Handle Loading States

Always provide feedback for loading operations:

```tsx
const { loading } = useAppDataService()

<Button disabled={loading.classes}>
  {loading.classes ? 'Adding...' : 'Add Class'}
</Button>
```

### 3. Use Toast Notifications

Use the toast-enabled hook for better user experience:

```tsx
import { useAppDataWithToasts } from '@/hooks/useAppDataWithToasts'

// Automatic success/error toasts
const { actions } = useAppDataWithToasts()
```

### 4. Cache Management

Clear cache when needed:

```tsx
const { actions } = useAppDataService()

// Clear all cache
actions.clearCache()

// Refresh all data
await actions.refreshData()
```

## Troubleshooting

### Common Issues

1. **Network Errors**: Check API server is running and accessible
2. **CORS Issues**: Ensure backend CORS is configured for your frontend URL
3. **Authentication**: Verify JWT tokens are being sent correctly
4. **Cache Issues**: Clear cache if seeing stale data

### Debug Mode

Enable debug logging in development:

```tsx
// In development, errors are logged to console
if (process.env.NODE_ENV === 'development') {
  console.log('API Service Debug Info:', { data, loading, errors })
}
```

## Performance Considerations

1. **Caching**: GET requests are cached for 5 minutes by default
2. **Optimistic Updates**: UI updates immediately for better perceived performance
3. **Retry Logic**: Failed requests are retried up to 3 times
4. **Loading States**: Prevent duplicate requests while operations are in progress

## Testing

The service layer is fully testable:

```tsx
import { AppDataService } from '@/services/AppDataService'

// Mock fetch for testing
global.fetch = jest.fn()

const service = new AppDataService()
// Test your API calls
```

## Migration Checklist

- [ ] Set up environment variables
- [ ] Replace providers in App.tsx
- [ ] Update components to handle async actions
- [ ] Add loading state handling
- [ ] Add error handling
- [ ] Test all CRUD operations
- [ ] Verify caching behavior
- [ ] Test error scenarios
- [ ] Update tests
- [ ] Remove old mock data dependencies