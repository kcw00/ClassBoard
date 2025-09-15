import { 
  classifyDeleteError, 
  getDeleteErrorMessage, 
  isRetryableError, 
  retryOperation,
  handleDeleteError,
  handleDeleteSuccess,
  handleImpactCalculationError,
  DeleteErrorType,
  DEFAULT_RETRY_CONFIG
} from '../errorHandling'
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

describe('errorHandling utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('classifyDeleteError', () => {
    it('should classify NetworkError correctly', () => {
      const error = new NetworkError('Network failed')
      expect(classifyDeleteError(error)).toBe(DeleteErrorType.NETWORK_ERROR)
    })

    it('should classify ApiError with 401 status as authorization error', () => {
      const error = new ApiError('Unauthorized', 401)
      expect(classifyDeleteError(error)).toBe(DeleteErrorType.AUTHORIZATION_ERROR)
    })

    it('should classify ApiError with 403 status as authorization error', () => {
      const error = new ApiError('Forbidden', 403)
      expect(classifyDeleteError(error)).toBe(DeleteErrorType.AUTHORIZATION_ERROR)
    })

    it('should classify ApiError with 404 status as not found error', () => {
      const error = new ApiError('Not found', 404)
      expect(classifyDeleteError(error)).toBe(DeleteErrorType.NOT_FOUND_ERROR)
    })

    it('should classify ApiError with 409 status as constraint violation', () => {
      const error = new ApiError('Conflict', 409)
      expect(classifyDeleteError(error)).toBe(DeleteErrorType.CONSTRAINT_VIOLATION)
    })

    it('should classify ApiError with 412 status as concurrent modification', () => {
      const error = new ApiError('Precondition failed', 412)
      expect(classifyDeleteError(error)).toBe(DeleteErrorType.CONCURRENT_MODIFICATION)
    })

    it('should classify ApiError with 500 status as server error', () => {
      const error = new ApiError('Internal server error', 500)
      expect(classifyDeleteError(error)).toBe(DeleteErrorType.SERVER_ERROR)
    })

    it('should classify unknown errors as unknown error', () => {
      const error = new Error('Unknown error')
      expect(classifyDeleteError(error)).toBe(DeleteErrorType.UNKNOWN_ERROR)
    })
  })

  describe('getDeleteErrorMessage', () => {
    it('should return correct message for network error', () => {
      const message = getDeleteErrorMessage(DeleteErrorType.NETWORK_ERROR, 'class', 'Math 101')
      expect(message).toContain('Unable to delete class "Math 101"')
      expect(message).toContain('check your internet connection')
    })

    it('should return correct message for authorization error', () => {
      const message = getDeleteErrorMessage(DeleteErrorType.AUTHORIZATION_ERROR, 'student', 'John Doe')
      expect(message).toContain("You don't have permission to delete this student")
    })

    it('should return correct message for not found error', () => {
      const message = getDeleteErrorMessage(DeleteErrorType.NOT_FOUND_ERROR, 'class', 'Math 101')
      expect(message).toContain('This class has already been deleted or no longer exists')
    })

    it('should return correct message for constraint violation', () => {
      const message = getDeleteErrorMessage(DeleteErrorType.CONSTRAINT_VIOLATION, 'student', 'John Doe')
      expect(message).toContain('Cannot delete student "John Doe" because it has associated data')
    })
  })

  describe('isRetryableError', () => {
    it('should return true for retryable errors', () => {
      expect(isRetryableError(DeleteErrorType.NETWORK_ERROR)).toBe(true)
      expect(isRetryableError(DeleteErrorType.SERVER_ERROR)).toBe(true)
      expect(isRetryableError(DeleteErrorType.CONCURRENT_MODIFICATION)).toBe(true)
    })

    it('should return false for non-retryable errors', () => {
      expect(isRetryableError(DeleteErrorType.AUTHORIZATION_ERROR)).toBe(false)
      expect(isRetryableError(DeleteErrorType.NOT_FOUND_ERROR)).toBe(false)
      expect(isRetryableError(DeleteErrorType.CONSTRAINT_VIOLATION)).toBe(false)
      expect(isRetryableError(DeleteErrorType.UNKNOWN_ERROR)).toBe(false)
    })
  })

  describe('retryOperation', () => {
    it('should succeed on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success')
      const result = await retryOperation(operation)
      
      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure and eventually succeed', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new NetworkError('Network failed'))
        .mockResolvedValue('success')
      
      const onRetry = jest.fn()
      const result = await retryOperation(operation, DEFAULT_RETRY_CONFIG, onRetry)
      
      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(2)
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(NetworkError))
    })

    it('should not retry non-retryable errors', async () => {
      const operation = jest.fn().mockRejectedValue(new ApiError('Unauthorized', 401))
      
      await expect(retryOperation(operation)).rejects.toThrow('Unauthorized')
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should exhaust all retries and throw last error', async () => {
      const error = new NetworkError('Network failed')
      const operation = jest.fn().mockRejectedValue(error)
      
      await expect(retryOperation(operation, { ...DEFAULT_RETRY_CONFIG, maxAttempts: 2 }))
        .rejects.toThrow('Network failed')
      expect(operation).toHaveBeenCalledTimes(2)
    })
  })

  describe('handleDeleteError', () => {
    it('should show error toast with retry option for retryable errors', () => {
      const onRetry = jest.fn()
      const error = new NetworkError('Network failed')
      
      handleDeleteError(error, 'class', 'Math 101', onRetry)
      
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Unable to delete class "Math 101"'),
        expect.objectContaining({
          action: expect.objectContaining({
            label: 'Retry',
            onClick: onRetry
          }),
          duration: 8000
        })
      )
    })

    it('should show error toast without retry option for non-retryable errors', () => {
      const error = new ApiError('Unauthorized', 401)
      
      handleDeleteError(error, 'student', 'John Doe')
      
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("You don't have permission to delete this student"),
        expect.objectContaining({
          duration: 6000
        })
      )
    })
  })

  describe('handleDeleteSuccess', () => {
    it('should show success toast for class deletion', () => {
      handleDeleteSuccess('class', 'Math 101')
      
      expect(toast.success).toHaveBeenCalledWith(
        'Class "Math 101" deleted successfully!',
        expect.objectContaining({
          duration: 4000
        })
      )
    })

    it('should show success toast for student deletion', () => {
      handleDeleteSuccess('student', 'John Doe')
      
      expect(toast.success).toHaveBeenCalledWith(
        'Student "John Doe" deleted successfully!',
        expect.objectContaining({
          duration: 4000
        })
      )
    })
  })

  describe('handleImpactCalculationError', () => {
    it('should show appropriate error message for network errors', () => {
      const error = new NetworkError('Network failed')
      const onRetry = jest.fn()
      
      handleImpactCalculationError(error, 'class', 'Math 101', onRetry)
      
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Unable to calculate deletion impact for class "Math 101"'),
        expect.objectContaining({
          action: expect.objectContaining({
            label: 'Retry',
            onClick: onRetry
          })
        })
      )
    })

    it('should show appropriate error message for authorization errors', () => {
      const error = new ApiError('Unauthorized', 401)
      
      handleImpactCalculationError(error, 'student', 'John Doe')
      
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("You don't have permission to view deletion impact for this student"),
        expect.objectContaining({
          duration: 6000
        })
      )
    })
  })
})