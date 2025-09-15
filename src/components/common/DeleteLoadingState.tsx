import React from 'react'
import { LoadingSpinner } from './LoadingSpinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Info, X } from 'lucide-react'

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
  showProgress = true
}: DeleteLoadingStateProps) {
  if (!isLoading) return null

  const operationText = operation === 'deleting' ? 'Deleting' : 'Calculating deletion impact for'
  const progressText = isRetrying 
    ? `${operationText} ${itemType} "${itemName}"... (attempt ${retryCount}/${maxRetries})`
    : `${operationText} ${itemType} "${itemName}"...`

  return (
    <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
      <div className="flex items-center gap-3">
        <LoadingSpinner size="sm" />
        <div className="flex-1">
          <AlertDescription className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-blue-800 dark:text-blue-200">
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
            
            {showProgress && isRetrying && (
              <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-300">
                <Info className="h-3 w-3" />
                <span>
                  {operation === 'deleting' 
                    ? 'Retrying due to network or server issues...'
                    : 'Retrying impact calculation...'
                  }
                </span>
              </div>
            )}
            
            {showProgress && retryCount > 0 && (
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-1.5">
                <div 
                  className="bg-blue-600 dark:bg-blue-400 h-1.5 rounded-full transition-all duration-300"
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