import React from 'react'
import { AppDataServiceProvider } from '@/context/AppDataServiceContext'
import { ToastProvider } from '@/components/common/Toast'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { useAppDataWithToasts } from '@/hooks/useAppDataWithToasts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

// Example component showing how to use the API service
function ClassListExample() {
  const { data, actions, loading, errors, isInitialLoading } = useAppDataWithToasts()

  const handleAddClass = async () => {
    try {
      await actions.addClass({
        name: 'Example Class',
        subject: 'Mathematics',
        description: 'An example class created via API',
        room: 'Room 101',
        capacity: 25,
        color: '#3b82f6'
      })
    } catch (error) {
      // Error is already handled by the toast system
      console.error('Failed to add class:', error)
    }
  }

  const handleRefreshData = async () => {
    try {
      await actions.refreshData()
    } catch (error) {
      console.error('Failed to refresh data:', error)
    }
  }

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button onClick={handleAddClass} disabled={loading.classes}>
          {loading.classes && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Add Example Class
        </Button>
        <Button onClick={handleRefreshData} variant="outline">
          Refresh Data
        </Button>
        <Button onClick={actions.clearCache} variant="ghost">
          Clear Cache
        </Button>
      </div>

      {errors.classes && (
        <div className="text-red-600 text-sm">
          Error loading classes: {errors.classes}
        </div>
      )}

      <div className="grid gap-4">
        {data.classes.map((classItem) => (
          <Card key={classItem.id}>
            <CardHeader>
              <CardTitle>{classItem.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p><strong>Subject:</strong> {classItem.subject}</p>
              <p><strong>Room:</strong> {classItem.room}</p>
              <p><strong>Capacity:</strong> {classItem.capacity}</p>
              <p><strong>Enrolled:</strong> {classItem.enrolledStudents.length}</p>
              <p><strong>Created:</strong> {classItem.createdDate}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {data.classes.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No classes found. Add one to get started!
        </div>
      )}
    </div>
  )
}

// Example of how to set up the providers
export function ApiServiceExample() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppDataServiceProvider>
          <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">API Service Example</h1>
            <ClassListExample />
          </div>
        </AppDataServiceProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default ApiServiceExample