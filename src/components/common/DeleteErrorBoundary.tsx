import React, { Component, ReactNode } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface DeleteErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  onRetry?: () => void
}

interface DeleteErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class DeleteErrorBoundary extends Component<
  DeleteErrorBoundaryProps,
  DeleteErrorBoundaryState
> {
  constructor(props: DeleteErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<DeleteErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log error for debugging
    console.error('Delete operation error boundary caught:', error, errorInfo)
    
    // Show toast notification
    toast.error('An unexpected error occurred during the delete operation', {
      description: 'Please try again or contact support if the problem persists',
      duration: 6000
    })

    // Call optional error handler
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
    
    this.props.onRetry?.()
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <Alert variant="destructive" className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-3">
            <div>
              <p className="font-medium">Delete Operation Failed</p>
              <p className="text-sm text-muted-foreground mt-1">
                An unexpected error occurred while processing the delete operation.
              </p>
            </div>
            
            {/* Error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-xs bg-muted p-2 rounded">
                <summary className="cursor-pointer font-medium">Error Details</summary>
                <pre className="mt-2 whitespace-pre-wrap">
                  {this.state.error.message}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleRetry}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-3 w-3" />
                Try Again
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="text-muted-foreground"
              >
                Refresh Page
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )
    }

    return this.props.children
  }
}

// Hook version for functional components
export function useDeleteErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error) => {
    setError(error)
    console.error('Delete operation error:', error)
    toast.error('An error occurred during the delete operation', {
      description: error.message,
      duration: 6000
    })
  }, [])

  return {
    error,
    resetError,
    captureError,
    hasError: error !== null
  }
}