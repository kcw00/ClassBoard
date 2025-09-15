import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAppDataWithToasts } from '@/hooks/useAppDataWithToasts'
import { LoadingSpinner } from './LoadingSpinner'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export function ApiServiceTest() {
  const [testResults, setTestResults] = useState<{
    status: 'idle' | 'testing' | 'success' | 'error'
    message: string
    details?: any
  }>({ status: 'idle', message: '' })

  const testApiService = async () => {
    setTestResults({ status: 'testing', message: 'Testing API service connection...' })
    
    try {
      // Try to use the API service with toasts
      const { data, actions, loading, errors, isInitialLoading } = useAppDataWithToasts()
      
      // Test basic functionality
      const testData = {
        hasData: !!data,
        hasActions: !!actions,
        hasLoadingStates: !!loading,
        hasErrorHandling: !!errors,
        isInitialLoading: !!isInitialLoading
      }
      
      setTestResults({
        status: 'success',
        message: 'API service integration test completed successfully!',
        details: testData
      })
    } catch (error) {
      setTestResults({
        status: 'error',
        message: 'API service integration test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  const getStatusIcon = () => {
    switch (testResults.status) {
      case 'testing':
        return <LoadingSpinner size="sm" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-blue-600" />
    }
  }

  const getStatusBadge = () => {
    switch (testResults.status) {
      case 'testing':
        return <Badge variant="secondary">Testing...</Badge>
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Success</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="outline">Ready</Badge>
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          API Service Integration Test
        </CardTitle>
        <CardDescription>
          Test the integration between frontend components and the new API service
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          {getStatusBadge()}
        </div>
        
        <Button 
          onClick={testApiService} 
          disabled={testResults.status === 'testing'}
          className="w-full"
        >
          {testResults.status === 'testing' ? 'Testing...' : 'Run Integration Test'}
        </Button>
        
        {testResults.message && (
          <Alert variant={testResults.status === 'error' ? 'destructive' : 'default'}>
            <AlertDescription>
              {testResults.message}
              {testResults.details && (
                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                  {typeof testResults.details === 'string' 
                    ? testResults.details 
                    : JSON.stringify(testResults.details, null, 2)
                  }
                </pre>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}