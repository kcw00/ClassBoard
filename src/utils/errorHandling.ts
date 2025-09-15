import { toast } from "sonner"
import { ApiError, NetworkError } from "@/services/AppDataService"

// Error types for delete operations
export enum DeleteErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  CONCURRENT_MODIFICATION = 'CONCURRENT_MODIFICATION',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Error classification function
export function classifyDeleteError(error: unknown): DeleteErrorType {
  if (error instanceof NetworkError) {
    return DeleteErrorType.NETWORK_ERROR
  }
  
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
      case 403:
        return DeleteErrorType.AUTHORIZATION_ERROR
      case 404:
        return DeleteErrorType.NOT_FOUND_ERROR
      case 409:
        return DeleteErrorType.CONSTRAINT_VIOLATION
      case 412:
        return DeleteErrorType.CONCURRENT_MODIFICATION
      case 500:
      case 502:
      case 503:
      case 504:
        return DeleteErrorType.SERVER_ERROR
      default:
        return DeleteErrorType.UNKNOWN_ERROR
    }
  }
  
  return DeleteErrorType.UNKNOWN_ERROR
}

// Error message generation
export function getDeleteErrorMessage(
  errorType: DeleteErrorType, 
  itemType: 'class' | 'student',
  itemName: string
): string {
  const capitalizedType = itemType.charAt(0).toUpperCase() + itemType.slice(1)
  
  switch (errorType) {
    case DeleteErrorType.NETWORK_ERROR:
      return `Unable to delete ${itemType} "${itemName}". Please check your internet connection and try again.`
    
    case DeleteErrorType.AUTHORIZATION_ERROR:
      return `You don't have permission to delete this ${itemType}. Please contact your administrator.`
    
    case DeleteErrorType.NOT_FOUND_ERROR:
      return `This ${itemType} has already been deleted or no longer exists.`
    
    case DeleteErrorType.CONSTRAINT_VIOLATION:
      return `Cannot delete ${itemType} "${itemName}" because it has associated data. Please remove related records first or contact support.`
    
    case DeleteErrorType.CONCURRENT_MODIFICATION:
      return `This ${itemType} was modified by another user. Please refresh the page and try again.`
    
    case DeleteErrorType.SERVER_ERROR:
      return `Server error occurred while deleting ${itemType} "${itemName}". Please try again in a few moments.`
    
    case DeleteErrorType.UNKNOWN_ERROR:
    default:
      return `An unexpected error occurred while deleting ${itemType} "${itemName}". Please try again.`
  }
}

// Retry configuration
export interface RetryConfig {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2
}

// Check if error is retryable
export function isRetryableError(errorType: DeleteErrorType): boolean {
  return [
    DeleteErrorType.NETWORK_ERROR,
    DeleteErrorType.SERVER_ERROR,
    DeleteErrorType.CONCURRENT_MODIFICATION
  ].includes(errorType)
}

// Retry mechanism with exponential backoff
export async function retryOperation<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  onRetry?: (attempt: number, error: unknown) => void
): Promise<T> {
  let lastError: unknown
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      // Don't retry on the last attempt
      if (attempt === config.maxAttempts) {
        break
      }
      
      // Check if error is retryable
      const errorType = classifyDeleteError(error)
      if (!isRetryableError(errorType)) {
        break
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffFactor, attempt - 1),
        config.maxDelay
      )
      
      // Notify about retry
      if (onRetry) {
        onRetry(attempt, error)
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}

// Enhanced delete error handler with toast notifications
export function handleDeleteError(
  error: unknown,
  itemType: 'class' | 'student',
  itemName: string,
  onRetry?: () => void
): void {
  const errorType = classifyDeleteError(error)
  const message = getDeleteErrorMessage(errorType, itemType, itemName)
  
  // Show appropriate toast based on error type
  if (isRetryableError(errorType) && onRetry) {
    toast.error(message, {
      action: {
        label: 'Retry',
        onClick: onRetry
      },
      duration: 8000 // Longer duration for retry actions
    })
  } else {
    toast.error(message, {
      duration: 6000
    })
  }
  
  // Log error for debugging
  console.error(`Delete ${itemType} error:`, {
    errorType,
    itemName,
    originalError: error
  })
}

// Success message handler
export function handleDeleteSuccess(
  itemType: 'class' | 'student',
  itemName: string
): void {
  const capitalizedType = itemType.charAt(0).toUpperCase() + itemType.slice(1)
  toast.success(`${capitalizedType} "${itemName}" deleted successfully!`, {
    duration: 4000
  })
}

// Impact calculation error handler
export function handleImpactCalculationError(
  error: unknown,
  itemType: 'class' | 'student',
  itemName: string,
  onRetry?: () => void
): void {
  const errorType = classifyDeleteError(error)
  
  let message: string
  if (errorType === DeleteErrorType.NETWORK_ERROR) {
    message = `Unable to calculate deletion impact for ${itemType} "${itemName}". Please check your connection.`
  } else if (errorType === DeleteErrorType.AUTHORIZATION_ERROR) {
    message = `You don't have permission to view deletion impact for this ${itemType}.`
  } else {
    message = `Failed to calculate deletion impact for ${itemType} "${itemName}". Please try again.`
  }
  
  if (isRetryableError(errorType) && onRetry) {
    toast.error(message, {
      action: {
        label: 'Retry',
        onClick: onRetry
      },
      duration: 8000
    })
  } else {
    toast.error(message, {
      duration: 6000
    })
  }
  
  console.error(`Impact calculation error for ${itemType}:`, {
    errorType,
    itemName,
    originalError: error
  })
}