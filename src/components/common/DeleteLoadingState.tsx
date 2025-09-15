import React from 'react'
import { LoadingSpinner } from './LoadingSpinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Info, X, Wifi, WifiOff, AlertTriangle } from 'lucide-react'

interface DeleteLoadingStateProps {
  isLoading: boolean
  isRetrying?: boolean
  retryCount?: number
  maxRetries?: number
  operation: 'deleting' | 'calculating'
  itemType: 'class' | 'student'
  itemName: string
  onCancel?: () => void
  showProgress?: boolean
  networkStatus?: 'online' | 'offline' | 'slow'
  estimatedTime?: number
}

export function DeleteLoadingState({
  isLoading,
  isRetrying = false,
  retryCount = 0,
  maxRetries = 3,
  operation,
  itemType,
  itemName,
  onCancel,
  showProgress = true,
  networkStatus = 'online',
  estimatedTime
}: DeleteLoadingStateProps) {
  if (!isLoading) return null

  const operationText = operation === 'deleting' ? 'Deleting' : 'Calculating deletion impact for'
  const progressText = isRetrying 
    ? `${operationText} ${itemType} "${itemName}"... (attempt ${retryCount}/${maxRetries})`
    : `${operationText} ${itemType} "${itemName}"...`

  // Determine alert styling based on network status and operation
  const getAlertStyling = () => {
    if (networkStatus === 'offline') {
      return "border-red-200 bg-red-50 dark:bg-red-950/20"
    }
    if (networkStatus === 'slow' || isRetrying) {
      return "border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20"
    }
    return "border-blue-200 bg-blue-50 dark:bg-blue-950/20"
  }

  const getTextColor = () => {
    if (networkStatus === 'offline') {
      return "text-red-800 dark:text-red-200"
    }
    if (networkStatus === 'slow' || isRetrying) {
      return "text-yellow-800 dark:text-yellow-200"
    }
    return "text-blue-800 dark:text-blue-200"
  }

  const getProgressColor = () => {
    if (networkStatus === 'offline') {
      return "bg-red-600 dark:bg-red-400"
    }
    if (networkStatus === 'slow' || isRetrying) {
      return "bg-yellow-600 dark:bg-yellow-400"
    }
    return "bg-blue-600 dark:bg-blue-400"
  }

  return (
    <Alert className={getAlertStyling()}>
      <div className="flex items-center gap-3">
        <LoadingSpinner size="sm" />
        <div className="flex-1">
          <AlertDescription className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className={`font-medium ${getTextColor()}`}>
                {progressText}
              </span>
              {onCancel && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                  className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Network status indicator */}
            {networkStatus !== 'online' && (
              <div className="flex items-center gap-2 text-sm">
                {networkStatus === 'offline' ? (
                  <>
                    <WifiOff className="h-3 w-3 text-red-600 dark:text-red-400" />
                    <span className="text-red-600 dark:text-red-300">
                      No internet connection - operation will retry when connection is restored
                    </span>
                  </>
                ) : (
                  <>
                    <Wifi className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-yellow-600 dark:text-yellow-300">
                      Slow connection detected - this may take longer than usual
                    </span>
                  </>
                )}
              </div>
            )}
            
            {/* Retry information */}
            {showProgress && isRetrying && (
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                <span className="text-yellow-600 dark:text-yellow-300">
                  {operation === 'deleting' 
                    ? 'Retrying due to network or server issues...'
                    : 'Retrying impact calculation...'
                  }
                </span>
              </div>
            )}

            {/* Estimated time */}
            {estimatedTime && !isRetrying && (
              <div className="flex items-center gap-2 text-sm">
                <Info className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                <span className="text-blue-600 dark:text-blue-300">
                  Estimated time: {estimatedTime} seconds
                </span>
              </div>
            )}
            
            {/* Progress bar */}
            {showProgress && retryCount > 0 && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div 
                  className={`${getProgressColor()} h-1.5 rounded-full transition-all duration-300`}
                  style={{ width: `${(retryCount / maxRetries) * 100}%` }}
                />
              </div>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  )
}

// Simplified version for inline use
export function InlineDeleteLoading({
  isLoading,
  operation,
  itemName,
  className = ""
}: {
  isLoading: boolean
  operation: 'deleting' | 'calculating'
  itemName: string
  className?: string
}) {
  if (!isLoading) return null

  const text = operation === 'deleting' 
    ? `Deleting "${itemName}"...`
    : `Calculating impact for "${itemName}"...`

  return (
    <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
      <LoadingSpinner size="sm" />
      <span>{text}</span>
    </div>
  )
}