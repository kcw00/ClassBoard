import { renderHook, act } from '@testing-library/react'
import { useDeleteErrorHandling } from '../useDeleteErrorHandling'
import { ApiError, NetworkError } from '@/services/AppDataService'
import { toast } from 'sonner'

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    loading: jest.fn()
  }
}))

// Mock error handling utilities
jest.mock('@/utils/errorHandling', () => ({
  ...jest.requireActual('@/utils/errorHandling'),
  handleDeleteError: jest.fn(),
  handleDeleteSuccess: jest.fn(),
  handleImpactCalculationError: jest.fn(),
  retryOperation: jest.fn()
}))

import { 
  handleDeleteError, 
  handleDeleteSuccess, 
  handleImpactCalculationError,
  retryOperation
} from '@/utils/errorHandling'

describe('useDeleteErrorHandling', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('executeDelete', () => {
    it('should execute delete operation successfully', async () => {
      const mockDeleteOperation = jest.fn().mockResolvedValue(undefined)
      const mockOnSuccess = jest.fn()
      
      // Mock successful retry operation
      ;(retryOperation as jest.Mock).mockResolvedValue(undefined)
      
      const { result } = renderHook(() => 
        useDeleteErrorHandling({ onSuccess: mockOnSuccess })
      )

      let deleteResult: boolean | undefined
      await act(async () => {
        deleteResult = await result.current.executeDelete(
          mockDeleteOperation,
          'class',
          'Math 101'
        )
      })

      expect(deleteResult).toBe(true)
      expect(retryOperation).toHaveBeenCalledWith(
        mockDeleteOperation,
        expect.any(Object),
        expect.any(Function)
      )
      expect(handleDeleteSuccess).toHaveBeenCalledWith('class', 'Math 101')
      expect(mockOnSuccess).toHaveBeenCalledWith('class', 'Math 101')
    })

    it('should handle delete operation failure', async () => {
      const mockDeleteOperation = jest.fn().mockRejectedValue(new NetworkError('Network failed'))
      const mockOnError = jest.fn()
      
      // Mock failed retry operation
      ;(retryOperation as jest.Mock).mockRejectedValue(new NetworkError('Network failed'))
      
      const { result } = renderHook(() => 
        useDeleteErrorHandling({ onError: mockOnError })
      )

      let deleteResult: boolean | undefined
      await act(async () => {
        deleteResult = await result.current.executeDelete(
          mockDeleteOperation,
          'student',
          'John Doe'
        )
      })

      expect(deleteResult).toBe(false)
      expect(handleDeleteError).toHaveBeenCalledWith(
        expect.any(NetworkError),
        'student',
        'John Doe',
        expect.any(Function)
      )
      expect(mockOnError).toHaveBeenCalledWith(
        expect.any(NetworkError),
        'student',
        'John Doe'
      )
    })

    it('should track retry state during operation', async () => {
      const mockDeleteOperation = jest.fn().mockResolvedValue(undefined)
      
      // Mock retry operation with retry callback
      ;(retryOperation as jest.Mock).mockImplementation(async (operation, config, onRetry) => {
        // Simulate retry
        onRetry(1, new NetworkError('Network failed'))
        onRetry(2, new NetworkError('Network failed'))
        return await operation()
      })
      
      const { result } = renderHook(() => useDeleteErrorHandling())

      expect(result.current.isRetrying).toBe(false)
      expect(result.current.retryCount).toBe(0)

      await act(async () => {
        await result.current.executeDelete(
          mockDeleteOperation,
          'class',
          'Math 101'
        )
      })

      // After operation completes, retry state should be reset
      expect(result.current.isRetrying).toBe(false)
      expect(result.current.retryCount).toBe(0)
    })
  })

  describe('calculateImpact', () => {
    it('should calculate impact successfully', async () => {
      const mockImpactCalculation = jest.fn().mockResolvedValue({ hasAssociatedData: false })
      
      // Mock successful retry operation
      ;(retryOperation as jest.Mock).mockResolvedValue({ hasAssociatedData: false })
      
      const { result } = renderHook(() => useDeleteErrorHandling())

      let impactResult: any
      await act(async () => {
        impactResult = await result.current.calculateImpact(
          mockImpactCalculation,
          'class',
          'Math 101'
        )
      })

      expect(impactResult).toEqual({ hasAssociatedData: false })
      expect(retryOperation).toHaveBeenCalledWith(
        mockImpactCalculation,
        expect.any(Object),
        expect.any(Function)
      )
    })

    it('should handle impact calculation failure', async () => {
      const mockImpactCalculation = jest.fn().mockRejectedValue(new ApiError('Server error', 500))
      
      // Mock failed retry operation
      ;(retryOperation as jest.Mock).mockRejectedValue(new ApiError('Server error', 500))
      
      const { result } = renderHook(() => useDeleteErrorHandling())

      let impactResult: any
      await act(async () => {
        impactResult = await result.current.calculateImpact(
          mockImpactCalculation,
          'student',
          'John Doe'
        )
      })

      expect(impactResult).toBeNull()
      expect(handleImpactCalculationError).toHaveBeenCalledWith(
        expect.any(ApiError),
        'student',
        'John Doe',
        expect.any(Function)
      )
    })

    it('should track retry state during impact calculation', async () => {
      const mockImpactCalculation = jest.fn().mockResolvedValue({ hasAssociatedData: true })
      
      // Mock retry operation with retry callback
      ;(retryOperation as jest.Mock).mockImplementation(async (operation, config, onRetry) => {
        // Simulate retry
        onRetry(1, new NetworkError('Network failed'))
        return await operation()
      })
      
      const { result } = renderHook(() => useDeleteErrorHandling())

      expect(result.current.isRetrying).toBe(false)
      expect(result.current.retryCount).toBe(0)

      await act(async () => {
        await result.current.calculateImpact(
          mockImpactCalculation,
          'class',
          'Math 101'
        )
      })

      // After operation completes, retry state should be reset
      expect(result.current.isRetrying).toBe(false)
      expect(result.current.retryCount).toBe(0)
    })
  })

  describe('custom retry configuration', () => {
    it('should use custom retry configuration', async () => {
      const customConfig = {
        maxAttempts: 5,
        baseDelay: 2000,
        maxDelay: 20000,
        backoffFactor: 3
      }
      
      const mockDeleteOperation = jest.fn().mockResolvedValue(undefined)
      ;(retryOperation as jest.Mock).mockResolvedValue(undefined)
      
      const { result } = renderHook(() => 
        useDeleteErrorHandling({ retryConfig: customConfig })
      )

      await act(async () => {
        await result.current.executeDelete(
          mockDeleteOperation,
          'class',
          'Math 101'
        )
      })

      expect(retryOperation).toHaveBeenCalledWith(
        mockDeleteOperation,
        customConfig,
        expect.any(Function)
      )
    })
  })
})