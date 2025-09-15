# ClassBoard Components Documentation

This document provides comprehensive documentation for all React components in the ClassBoard application, including their props, usage examples, and integration patterns.

## 🏗️ Component Architecture

ClassBoard follows a layered component architecture:

```
src/components/
├── common/              # Shared components across the app
├── ui/                  # Base UI components (shadcn/ui)
└── layout/              # Layout and navigation components

src/screens/
├── auth/                # Authentication screens
├── dashboard/           # Dashboard and overview screens
├── details/             # Detail view screens
└── management/          # CRUD management screens
```

## 🔧 Common Components

### DeleteConfirmationDialog

A comprehensive confirmation dialog for delete operations with impact analysis.

**Props:**
```typescript
interface DeleteConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  itemName: string
  isLoading?: boolean
  impactInfo?: DeletionImpact
}
```

**Usage:**
```tsx
import { DeleteConfirmationDialog } from '@/components/common/DeleteConfirmationDialog'

function ClassManagement() {
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    classId: '',
    className: '',
    impactInfo: null
  })

  const handleDeleteClass = async (classId: string, className: string) => {
    // Calculate deletion impact
    const impact = await calculateClassDeletionImpact(classId)
    
    setDeleteDialog({
      isOpen: true,
      classId,
      className,
      impactInfo: impact
    })
  }

  const confirmDelete = async () => {
    try {
      await appDataService.deleteClass(deleteDialog.classId)
      handleDeleteSuccess('class', deleteDialog.className)
    } catch (error) {
      handleDeleteError(error, 'class', deleteDialog.className)
    } finally {
      setDeleteDialog({ isOpen: false, classId: '', className: '', impactInfo: null })
    }
  }

  return (
    <DeleteConfirmationDialog
      isOpen={deleteDialog.isOpen}
      onClose={() => setDeleteDialog({ ...deleteDialog, isOpen: false })}
      onConfirm={confirmDelete}
      title="Delete Class"
      description="Are you sure you want to delete this class?"
      itemName={deleteDialog.className}
      impactInfo={deleteDialog.impactInfo}
    />
  )
}
```

**Features:**
- Impact analysis display with affected items count
- Loading states during deletion
- Accessibility support with proper ARIA labels
- Responsive design for mobile and desktop
- Integration with error handling utilities

### DeleteErrorBoundary

Error boundary specifically designed for delete operations with retry functionality.

**Props:**
```typescript
interface DeleteErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  onRetry?: () => void
}
```

**Usage:**
```tsx
import { DeleteErrorBoundary } from '@/components/common/DeleteErrorBoundary'

function StudentManagement() {
  const handleRetryDelete = () => {
    // Retry the failed delete operation
    window.location.reload() // Simple retry strategy
  }

  return (
    <DeleteErrorBoundary onRetry={handleRetryDelete}>
      <StudentList />
      <DeleteOperations />
    </DeleteErrorBoundary>
  )
}
```

**Features:**
- Catches and handles delete operation errors
- Provides retry functionality
- Shows user-friendly error messages
- Development mode error details
- Toast notifications for errors

### DeleteLoadingState

Loading indicators for delete operations with progress information.

**Props:**
```typescript
interface DeleteLoadingStateProps {
  isLoading: boolean
  operation: 'deleting' | 'calculating'
  itemType: 'class' | 'student'
  itemName: string
  isRetrying?: boolean
  retryCount?: number
  maxRetries?: number
  networkStatus?: 'online' | 'offline' | 'slow'
  estimatedTime?: number
  onCancel?: () => void
}
```

**Usage:**
```tsx
import { DeleteLoadingState } from '@/components/common/DeleteLoadingState'

function ClassCard({ classItem }) {
  const [deleteState, setDeleteState] = useState({
    isLoading: false,
    operation: 'deleting',
    retryCount: 0
  })

  return (
    <div>
      <DeleteLoadingState
        isLoading={deleteState.isLoading}
        operation={deleteState.operation}
        itemType="class"
        itemName={classItem.name}
        isRetrying={deleteState.retryCount > 0}
        retryCount={deleteState.retryCount}
        maxRetries={3}
        onCancel={() => setDeleteState({ ...deleteState, isLoading: false })}
      />
      {/* Class card content */}
    </div>
  )
}
```

**Features:**
- Multiple loading states (deleting, calculating impact)
- Retry progress indication
- Network status awareness
- Estimated time display
- Cancellation support

### DeleteSuccessToast

Success notification for completed delete operations.

**Props:**
```typescript
interface DeleteSuccessToastProps {
  itemType: 'class' | 'student'
  itemName: string
  onUndo?: () => void
  onDismiss: () => void
  showUndo?: boolean
}
```

**Usage:**
```tsx
import { DeleteSuccessToast } from '@/components/common/DeleteSuccessToast'

function useDeleteNotifications() {
  const [successToast, setSuccessToast] = useState(null)

  const showDeleteSuccess = (itemType, itemName, undoCallback) => {
    setSuccessToast({
      itemType,
      itemName,
      onUndo: undoCallback,
      showUndo: !!undoCallback
    })

    // Auto-dismiss after 5 seconds
    setTimeout(() => setSuccessToast(null), 5000)
  }

  return {
    successToast: successToast && (
      <DeleteSuccessToast
        {...successToast}
        onDismiss={() => setSuccessToast(null)}
      />
    ),
    showDeleteSuccess
  }
}
```

**Features:**
- Success animation and styling
- Optional undo functionality
- Auto-dismiss with manual dismiss option
- Consistent styling with app theme

## 📱 Screen Components

### Management Screens

#### ClassManagement

Comprehensive class management with CRUD operations and delete functionality.

**Key Features:**
- Class listing with search and filtering
- Create/edit class forms with validation
- Delete operations with impact analysis
- Bulk operations support
- Performance optimization with pagination

**Delete Integration:**
```tsx
// Integrated delete workflow
const handleDeleteClass = async (classId: string, className: string) => {
  try {
    setDeleteState({ isLoading: true, operation: 'calculating' })
    
    // Calculate impact
    const impact = await calculateClassDeletionImpact(classId)
    
    setDeleteState({ isLoading: false })
    
    // Show confirmation dialog
    setDeleteDialog({
      isOpen: true,
      classId,
      className,
      impactInfo: impact
    })
  } catch (error) {
    handleImpactCalculationError(error, 'class', className, () => handleDeleteClass(classId, className))
  }
}
```

#### StudentManagement

Student management with enrollment tracking and delete operations.

**Key Features:**
- Student profiles with contact information
- Enrollment history and class associations
- Delete operations with enrollment impact
- Search and filtering capabilities
- Export functionality

#### TestManagement

Assessment management with comprehensive testing features.

**Key Features:**
- Test creation with multiple question types
- Grade management and analytics
- File attachments for tests and submissions
- Performance tracking and reporting
- Delete operations with result preservation options

### Detail Screens

#### ClassDetails

Detailed class view with comprehensive information and management options.

**Key Features:**
- Class information display
- Enrolled students management
- Schedule and meeting integration
- Assessment and homework tracking
- Delete operations with full impact analysis

#### StudentDetails

Individual student profile with academic history and performance tracking.

**Key Features:**
- Student profile information
- Academic performance analytics
- Attendance history
- Assessment results
- Parent/guardian contact management

## 🎨 UI Components (shadcn/ui)

### Form Components

**Button**
```tsx
import { Button } from '@/components/ui/button'

// Variants: default, destructive, outline, secondary, ghost, link
<Button variant="destructive" size="sm" onClick={handleDelete}>
  Delete Class
</Button>
```

**Input**
```tsx
import { Input } from '@/components/ui/input'

<Input
  type="text"
  placeholder="Search classes..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>
```

**Select**
```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

<Select value={filterClass} onValueChange={setFilterClass}>
  <SelectTrigger>
    <SelectValue placeholder="All Classes" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All Classes</SelectItem>
    {classes.map(cls => (
      <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

### Layout Components

**Card**
```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Class Statistics</CardTitle>
    <CardDescription>Overview of your classes</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Card content */}
  </CardContent>
</Card>
```

**Dialog**
```tsx
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create New Class</DialogTitle>
      <DialogDescription>Add a new class to your curriculum</DialogDescription>
    </DialogHeader>
    {/* Dialog content */}
  </DialogContent>
</Dialog>
```

### Data Display Components

**Table**
```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Subject</TableHead>
      <TableHead>Students</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {classes.map(cls => (
      <TableRow key={cls.id}>
        <TableCell>{cls.name}</TableCell>
        <TableCell>{cls.subject}</TableCell>
        <TableCell>{cls.enrolledStudents.length}</TableCell>
        <TableCell>
          <Button variant="ghost" size="sm" onClick={() => handleEdit(cls.id)}>
            Edit
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

## 🔗 Integration Patterns

### Error Handling Integration

```tsx
import { useDeleteErrorHandling } from '@/hooks/useDeleteErrorHandling'
import { handleDeleteError, handleDeleteSuccess } from '@/utils/errorHandling'

function ComponentWithDelete() {
  const { error, resetError, captureError } = useDeleteErrorHandling()

  const handleDelete = async (id: string, name: string) => {
    try {
      resetError()
      await appDataService.deleteItem(id)
      handleDeleteSuccess('item', name)
    } catch (error) {
      captureError(error)
      handleDeleteError(error, 'item', name, () => handleDelete(id, name))
    }
  }

  return (
    <DeleteErrorBoundary>
      {/* Component content */}
    </DeleteErrorBoundary>
  )
}
```

### Network Status Integration

```tsx
import { useNetworkStatus } from '@/hooks/useNetworkStatus'

function NetworkAwareComponent() {
  const { status, isOnline, isOffline, isSlow } = useNetworkStatus()

  return (
    <div>
      {isOffline && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You're offline. Some features may not work properly.
          </AlertDescription>
        </Alert>
      )}
      
      {isSlow && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Slow connection detected. Operations may take longer.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Component content */}
    </div>
  )
}
```

### Service Integration

```tsx
import { useAppDataService } from '@/hooks/useAppDataService'

function ServiceIntegratedComponent() {
  const {
    classes,
    students,
    loading,
    error,
    createClass,
    updateClass,
    deleteClass
  } = useAppDataService()

  const handleCreateClass = async (classData) => {
    try {
      await createClass(classData)
      // Success handling
    } catch (error) {
      // Error handling
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorDisplay error={error} />

  return (
    <div>
      {/* Component content using classes and students */}
    </div>
  )
}
```

## 🧪 Testing Components

### Component Testing

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DeleteConfirmationDialog } from '../DeleteConfirmationDialog'

describe('DeleteConfirmationDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    title: 'Delete Item',
    description: 'Are you sure?',
    itemName: 'Test Item'
  }

  it('renders with basic props', () => {
    render(<DeleteConfirmationDialog {...defaultProps} />)
    
    expect(screen.getByText('Delete Item')).toBeInTheDocument()
    expect(screen.getByText('Test Item')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('calls onConfirm when delete button is clicked', () => {
    render(<DeleteConfirmationDialog {...defaultProps} />)
    
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    
    expect(defaultProps.onConfirm).toHaveBeenCalled()
  })

  it('displays impact information when provided', () => {
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
  })
})
```

### Integration Testing

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AppDataProvider } from '@/context/AppDataContext'
import ClassManagement from '../ClassManagement'

describe('ClassManagement Integration', () => {
  const renderWithContext = (component) => {
    return render(
      <AppDataProvider>
        {component}
      </AppDataProvider>
    )
  }

  it('handles complete delete workflow', async () => {
    renderWithContext(<ClassManagement />)

    // Find and click delete button
    const deleteButton = screen.getByRole('button', { name: /delete/i })
    fireEvent.click(deleteButton)

    // Confirm deletion
    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
    })

    const confirmButton = screen.getByRole('button', { name: /delete/i })
    fireEvent.click(confirmButton)

    // Verify success message
    await waitFor(() => {
      expect(screen.getByText(/deleted successfully/i)).toBeInTheDocument()
    })
  })
})
```

## 📚 Best Practices

### Component Design
1. **Single Responsibility**: Each component should have one clear purpose
2. **Prop Validation**: Use TypeScript interfaces for all props
3. **Error Boundaries**: Wrap components that might fail
4. **Loading States**: Always provide loading feedback
5. **Accessibility**: Include proper ARIA labels and keyboard navigation

### Performance
1. **Memoization**: Use React.memo for expensive components
2. **Lazy Loading**: Load components only when needed
3. **Virtualization**: Use virtual scrolling for large lists
4. **Debouncing**: Debounce search and filter inputs
5. **Caching**: Cache API responses where appropriate

### Testing
1. **Unit Tests**: Test component logic and rendering
2. **Integration Tests**: Test component interactions
3. **Accessibility Tests**: Ensure components are accessible
4. **Visual Tests**: Test component appearance
5. **Performance Tests**: Test component performance

This documentation provides a comprehensive guide to all components in the ClassBoard application, including usage examples, integration patterns, and testing strategies.