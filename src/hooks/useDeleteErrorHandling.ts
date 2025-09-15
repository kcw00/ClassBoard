import { useState, useCallback } from 'react'
import { 
  handleDeleteError, 
  handleDeleteSuccess, 
  handleImpactCalculationError,
  retryOperation,
  DEFAULT_RETRY_CONFIG,
  type RetryConfig
} from '@/utils/errorHandling'

interface UseDeleteErrorHandlingOptions {
  retryConfig?: RetryConfig
  onSuccess?: (itemType: 'class' | 'student', itemName: string) => void
  onError?: (error: unknown, itemType: 'class' | 'student', itemName: string) => void
}

export function useDeleteErrorHandling(options: UseDeleteErrorHandlingOptions = {}) {
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  
  const { 
    retryConfig = DEFAULT_RETRY_CONFIG,
    onSuccess,
    onError
  } = options

  // Enhanced delete operation with retry and error handling
  const executeDelete = useCallback(async (
    deleteOperation: () => Promise<void>,
    itemType: 'class' | 'student',
    itemName: string
  ): Promise<boolean> => {
    setIsRetrying(false)
    setRetryCount(0)
    
    try {
      await retryOperation(
        deleteOperation,
        retryConfig,
        (attempt, error) => {
          setIsRetrying(true)
          setRetryCount(attempt)
          console.log(`Delete attempt ${attempt} failed:`, error)
        }
      )
      
      // Success handling
      handleDeleteSuccess(itemType, itemName)
      onSuccess?.(itemType, itemName)
      
      return true
      
    } catch (error) {
      // Error handling with retry option
      const retryOperation = () => executeDelete(deleteOperation, itemType, itemName)
      handleDeleteError(error, itemType, itemName, retryOperation)
      onError?.(error, itemType, itemName)
      
      return false
      
    } finally {
      setIsRetrying(false)
      setRetryCount(0)
    }
  }, [retryConfig, onSuccess, onError])

  // Enhanced impact calculation with retry and error handling
  const calculateImpact = useCallback(async <T>(
    impactCalculation: () => Promise<T>,
    itemType: 'class' | 'student',
    itemName: string
  ): Promise<T | null> => {
    setIsRetrying(false)
    setRetryCount(0)
    
    try {
      const result = await retryOperation(
        impactCalculation,
        retryConfig,
        (attempt, error) => {
          setIsRetrying(true)
          setRetryCount(attempt)
          console.log(`Impact calculation attempt ${attempt} failed:`, error)
        }
      )
      
      return result
      
    } catch (error) {
      // Error handling with retry option
      const retryOperation = () => calculateImpact(impactCalculation, itemType, itemName)
      handleImpactCalculationError(error, itemType, itemName, retryOperation)
      
      return null
      
    } finally {
      setIsRetrying(false)
      setRetryCount(0)
    }
  }, [retryConfig])

  return {
    executeDelete,
    calculateImpact,
    isRetrying,
    retryCount
  }
}