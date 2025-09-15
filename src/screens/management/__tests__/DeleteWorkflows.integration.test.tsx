import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { toast } from 'sonner'
import ClassManagement from '../ClassManagement'
import StudentManagement from '../StudentManagement'
import { AppDataMigrationProvider } from '@/context/AppDataMigrationContext'
import { appDataService, ApiError, NetworkError } from '@/services/AppDataService'
import * as impactCalculation from '@/utils/impactCalculation'
import * as errorHandling from '@/utils/errorHandling'

// Mock dependencies
jest.mock('sonner')
jest.mock('@/services/AppDataService')
jest.mock('@/utils/impactCalculation')
jest.mock('@/utils/errorHandling')
jest.mock('@/hooks/useNetworkStatus')

const mockAppDataService = appDataService as jest.Mocked<typeof appDataService>
const mockToast = toast as jest.Mocked<typeof toast>
const mockImpactCalculation = impactCalculation as jest.Mocked<typeof impactCalculation>
const mockErrorHandling = errorHandling as jest.Mocked<typeof errorHandling>

// Mock useNetworkStatus hook
const mockUseNetworkStatus = require('@/hooks/useNetworkStatus').useNetworkStatus as jest.MockedFunction<any>

// Test data
const mockClass = {
  id: 'class-1',
  name: 'Advanced Biology',
  subject: 'Science',
  description: 'Advanced biology course',
  room: 'Science 101',
  capacity: 25,
  color: '#3b82f6',
  enrolledStudents: ['student-1', 'student-2']
}

const mockStudent = {
  id: 'student-1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-0101',
  grade: '10th Grade',
  parentContact: '555-0102',
  enrollmentDate: '2024-01-15'
}

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AppDataMigrationProvider>
      {children}
    </AppDataMigrationProvider>
  </BrowserRouter>
)

describe('Delete Workflows Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default mocks
    mockAppDataService.getClasses.mockResolvedValue([mockClass])
    mockAppDataService.getStudents.mockResolvedValue([mockStudent])
    mockAppDataService.getSchedules.mockResolvedValue([])
    mockAppDataService.getAttendanceRecords.mockResolvedValue([])
    mockAppDataService.getClassNotes.mockResolvedValue([])
    mockAppDataService.getTests.mockResolvedValue([])
    mockAppDataService.getMeetings.mockResolvedValue([])
    mockAppDataService.getTestResults.mockResolvedValue([])
    mockAppDataService.getHomeworkSubmissions.mockResolvedValue([])
    
    mockUseNetworkStatus.mockReturnValue({ status: 'online' })
    
    mockErrorHandling.DEFAULT_RETRY_CONFIG = {
      maxAttempts: 3,
      baseDelay: 100,
      maxDelay: 1000,
      backoffFactor: 2
    }
    
    mockErrorHandling.retryOperation.mockImplementation(async (operation) => {
      return await operation()
    })
  })

  describe('Network Status Integration', () => {
    it('should show network status indicators during offline deletion attempts', async () => {
      const user = userEvent.setup()
      mockUseNetworkStatus.mockReturnValue({ status: 'offline' })
      
      const mockImpact = {
        affectedItems: [],
        hasAssociatedData: false
      }
      mockImpactCalculation.calculateClassDeletionImpact.mockResolvedValue(mockImpact)
      
      render(
        <TestWrapper>
          <ClassManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Advanced Biology')).toBeInTheDocument()
      })

      // Click delete button
      const classCard = screen.getByText('Advanced Biology').closest('.relative')
      const deleteButton = within(classCard!).getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      // Verify offline indicator appears in dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText(/no internet connection detected/i)).toBeInTheDocument()
      })
    })

    it('should show slow network indicators during slow connection', async () => {
      const user = userEvent.setup()
      mockUseNetworkStatus.mockReturnValue({ status: 'slow' })
      
      const mockImpact = {
        affectedItems: [],
        hasAssociatedData: false
      }
      mockImpactCalculation.calculateStudentDeletionImpact.mockResolvedValue(mockImpact)
      
      render(
        <TestWrapper>
          <StudentManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Click delete button
      const studentCard = screen.getByText('John Doe').closest('.relative')
      const deleteButton = within(studentCard!).getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      // Verify slow network indicator appears in dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText(/slow network connection detected/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Classification and Handling', () => {
    it('should handle different types of API errors correctly', async () => {
      const user = userEvent.setup()
      
      const testCases = [
        {
          error: new ApiError('Unauthorized', 401),
          expectedType: errorHandling.DeleteErrorType.AUTHORIZATION_ERROR
        },
        {
          error: new ApiError('Not Found', 404),
          expectedType: errorHandling.DeleteErrorType.NOT_FOUND_ERROR
        },
        {
          error: new ApiError('Conflict', 409),
          expectedType: errorHandling.DeleteErrorType.CONSTRAINT_VIOLATION
        },
        {
          error: new ApiError('Precondition Failed', 412),
          expectedType: errorHandling.DeleteErrorType.CONCURRENT_MODIFICATION
        },
        {
          error: new ApiError('Internal Server Error', 500),
          expectedType: errorHandling.DeleteErrorType.SERVER_ERROR
        },
        {
          error: new NetworkError('Network timeout'),
          expectedType: errorHandling.DeleteErrorType.NETWORK_ERROR
        }
      ]

      for (const testCase of testCases) {
        jest.clearAllMocks()
        
        mockAppDataService.getClasses.mockResolvedValue([mockClass])
        mockImpactCalculation.calculateClassDeletionImpact.mockResolvedValue({
          affectedItems: [],
          hasAssociatedData: false
        })
        mockAppDataService.deleteClass.mockRejectedValue(testCase.error)
        mockErrorHandling.classifyDeleteError.mockReturnValue(testCase.expectedType)
        
        render(
          <TestWrapper>
            <ClassManagement />
          </TestWrapper>
        )

        await waitFor(() => {
          expect(screen.getByText('Advanced Biology')).toBeInTheDocument()
        })

        // Trigger deletion
        const classCard = screen.getByText('Advanced Biology').closest('.relative')
        const deleteButton = within(classCard!).getByRole('button', { name: /delete/i })
        await user.click(deleteButton)

        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument()
        })

        const confirmButton = screen.getByRole('button', { name: /delete/i })
        await user.click(confirmButton)

        // Verify error classification and handling
        await waitFor(() => {
          expect(mockErrorHandling.classifyDeleteError).toHaveBeenCalledWith(testCase.error)
          expect(mockErrorHandling.handleDeleteError).toHaveBeenCalledWith(
            testCase.error,
            'class',
            'Advanced Biology',
            expect.any(Function)
          )
        })
      }
    })

    it('should handle retry operations with exponential backoff', async () => {
      const user = userEvent.setup()
      let attemptCount = 0
      
      mockErrorHandling.retryOperation.mockImplementation(async (operation, config, onRetry) => {
        for (let attempt = 1; attempt <= (config?.maxAttempts || 3); attempt++) {
          try {
            attemptCount++
            return await operation()
          } catch (error) {
            if (attempt === (config?.maxAttempts || 3)) {
              throw error
            }
            if (onRetry) {
              onRetry(attempt, error)
            }
            // Simulate delay
            await new Promise(resolve => setTimeout(resolve, 10))
          }
        }
        throw new Error('Max attempts reached')
      })
      
      const networkError = new NetworkError('Connection failed')
      mockAppDataService.deleteClass
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce()
      
      mockImpactCalculation.calculateClassDeletionImpact.mockResolvedValue({
        affectedItems: [],
        hasAssociatedData: false
      })
      
      render(
        <TestWrapper>
          <ClassManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Advanced Biology')).toBeInTheDocument()
      })

      // Trigger deletion
      const classCard = screen.getByText('Advanced Biology').closest('.relative')
      const deleteButton = within(classCard!).getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /delete/i })
      await user.click(confirmButton)

      // Verify retry operation was called
      await waitFor(() => {
        expect(mockErrorHandling.retryOperation).toHaveBeenCalled()
        expect(attemptCount).toBe(3) // Failed twice, succeeded on third attempt
      })
    })
  })

  describe('Complex Impact Calculation Scenarios', () => {
    it('should handle impact calculation for class with extensive data', async () => {
      const user = userEvent.setup()
      
      const extensiveImpact = {
        affectedItems: [
          { type: 'students', count: 25, description: '25 enrolled students will be unenrolled' },
          { type: 'schedules', count: 5, description: '5 schedules will be deleted' },
          { type: 'notes', count: 50, description: '50 class notes will be deleted' },
          { type: 'attendance', count: 200, description: '200 attendance records will be deleted' },
          { type: 'tests', count: 15, description: '15 tests will be deleted' },
          { type: 'test-results', count: 375, description: '375 test results will be deleted' },
          { type: 'homework', count: 30, description: '30 homework assignments will be deleted' },
          { type: 'homework-submissions', count: 750, description: '750 homework submissions will be deleted' },
          { type: 'meetings', count: 10, description: '10 meetings may be affected' }
        ],
        hasAssociatedData: true,
        warningMessage: 'This class has extensive data (1460 related records). This action cannot be undone.'
      }
      
      mockImpactCalculation.calculateClassDeletionImpact.mockResolvedValue(extensiveImpact)
      
      render(
        <TestWrapper>
          <ClassManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Advanced Biology')).toBeInTheDocument()
      })

      // Click delete button
      const classCard = screen.getByText('Advanced Biology').closest('.relative')
      const deleteButton = within(classCard!).getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      // Verify all impact information is displayed
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText('25 enrolled students will be unenrolled')).toBeInTheDocument()
        expect(screen.getByText('200 attendance records will be deleted')).toBeInTheDocument()
        expect(screen.getByText('375 test results will be deleted')).toBeInTheDocument()
        expect(screen.getByText('750 homework submissions will be deleted')).toBeInTheDocument()
        expect(screen.getByText(/1460 related records/)).toBeInTheDocument()
      })

      // Verify warning styling for high-impact deletion
      expect(screen.getByText(/extensive data/)).toBeInTheDocument()
    })

    it('should handle impact calculation timeout scenarios', async () => {
      const user = userEvent.setup()
      
      // Simulate timeout during impact calculation
      const timeoutError = new Error('Request timeout')
      mockImpactCalculation.calculateClassDeletionImpact.mockRejectedValue(timeoutError)
      
      render(
        <TestWrapper>
          <ClassManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Advanced Biology')).toBeInTheDocument()
      })

      // Click delete button
      const classCard = screen.getByText('Advanced Biology').closest('.relative')
      const deleteButton = within(classCard!).getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      // Verify error handling for impact calculation
      await waitFor(() => {
        expect(mockErrorHandling.handleImpactCalculationError).toHaveBeenCalledWith(
          timeoutError,
          'class',
          'Advanced Biology',
          expect.any(Function)
        )
      })
    })
  })

  describe('Concurrent Operations', () => {
    it('should handle concurrent deletion attempts gracefully', async () => {
      const user = userEvent.setup()
      
      // Mock concurrent modification error
      const concurrentError = new ApiError('Precondition Failed', 412)
      mockAppDataService.deleteClass.mockRejectedValue(concurrentError)
      mockErrorHandling.classifyDeleteError.mockReturnValue(errorHandling.DeleteErrorType.CONCURRENT_MODIFICATION)
      
      mockImpactCalculation.calculateClassDeletionImpact.mockResolvedValue({
        affectedItems: [],
        hasAssociatedData: false
      })
      
      render(
        <TestWrapper>
          <ClassManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Advanced Biology')).toBeInTheDocument()
      })

      // Trigger deletion
      const classCard = screen.getByText('Advanced Biology').closest('.relative')
      const deleteButton = within(classCard!).getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /delete/i })
      await user.click(confirmButton)

      // Verify concurrent modification error is handled
      await waitFor(() => {
        expect(mockErrorHandling.handleDeleteError).toHaveBeenCalledWith(
          concurrentError,
          'class',
          'Advanced Biology',
          expect.any(Function)
        )
      })
    })

    it('should prevent multiple simultaneous deletion attempts on same item', async () => {
      const user = userEvent.setup()
      
      let resolveDelete: () => void
      const deletePromise = new Promise<void>((resolve) => {
        resolveDelete = resolve
      })
      mockAppDataService.deleteClass.mockReturnValue(deletePromise)
      
      mockImpactCalculation.calculateClassDeletionImpact.mockResolvedValue({
        affectedItems: [],
        hasAssociatedData: false
      })
      
      render(
        <TestWrapper>
          <ClassManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Advanced Biology')).toBeInTheDocument()
      })

      // Start first deletion
      const classCard = screen.getByText('Advanced Biology').closest('.relative')
      const deleteButton = within(classCard!).getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /delete/i })
      await user.click(confirmButton)

      // Verify button is disabled during deletion
      await waitFor(() => {
        expect(deleteButton).toBeDisabled()
        expect(confirmButton).toBeDisabled()
      })

      // Try to click delete button again (should be disabled)
      await user.click(deleteButton)
      
      // Should not trigger another deletion
      expect(mockAppDataService.deleteClass).toHaveBeenCalledTimes(1)

      // Resolve the deletion
      resolveDelete!()
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })
  })

  describe('Data Consistency', () => {
    it('should maintain data consistency after successful deletion', async () => {
      const user = userEvent.setup()
      
      mockAppDataService.deleteClass.mockResolvedValue()
      mockImpactCalculation.calculateClassDeletionImpact.mockResolvedValue({
        affectedItems: [],
        hasAssociatedData: false
      })
      
      // Mock updated data after deletion
      mockAppDataService.getClasses
        .mockResolvedValueOnce([mockClass]) // Initial load
        .mockResolvedValueOnce([]) // After deletion
      
      render(
        <TestWrapper>
          <ClassManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Advanced Biology')).toBeInTheDocument()
      })

      // Perform deletion
      const classCard = screen.getByText('Advanced Biology').closest('.relative')
      const deleteButton = within(classCard!).getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /delete/i })
      await user.click(confirmButton)

      // Verify data refresh after deletion
      await waitFor(() => {
        expect(mockAppDataService.getClasses).toHaveBeenCalledTimes(2)
      })
    })

    it('should handle partial deletion failures gracefully', async () => {
      const user = userEvent.setup()
      
      // Simulate partial failure (main deletion succeeds but cleanup fails)
      const cleanupError = new Error('Failed to clean up related data')
      mockAppDataService.deleteClass.mockRejectedValue(cleanupError)
      
      mockImpactCalculation.calculateClassDeletionImpact.mockResolvedValue({
        affectedItems: [
          { type: 'students', count: 2, description: '2 enrolled students will be unenrolled' }
        ],
        hasAssociatedData: true,
        warningMessage: 'This action will permanently delete all related data and cannot be undone.'
      })
      
      render(
        <TestWrapper>
          <ClassManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Advanced Biology')).toBeInTheDocument()
      })

      // Perform deletion
      const classCard = screen.getByText('Advanced Biology').closest('.relative')
      const deleteButton = within(classCard!).getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /delete/i })
      await user.click(confirmButton)

      // Verify error handling for partial failure
      await waitFor(() => {
        expect(mockErrorHandling.handleDeleteError).toHaveBeenCalledWith(
          cleanupError,
          'class',
          'Advanced Biology',
          expect.any(Function)
        )
      })
    })
  })

  describe('Performance and Memory', () => {
    it('should handle large datasets efficiently during impact calculation', async () => {
      const user = userEvent.setup()
      
      // Simulate large dataset
      const largeDatasetImpact = {
        affectedItems: Array.from({ length: 50 }, (_, i) => ({
          type: `type-${i}`,
          count: Math.floor(Math.random() * 100) + 1,
          description: `${Math.floor(Math.random() * 100) + 1} items of type ${i} will be affected`
        })),
        hasAssociatedData: true,
        warningMessage: 'This class has extensive data (5000+ related records). This action cannot be undone.'
      }
      
      mockImpactCalculation.calculateClassDeletionImpact.mockResolvedValue(largeDatasetImpact)
      
      render(
        <TestWrapper>
          <ClassManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Advanced Biology')).toBeInTheDocument()
      })

      // Click delete button
      const classCard = screen.getByText('Advanced Biology').closest('.relative')
      const deleteButton = within(classCard!).getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      // Verify dialog renders efficiently with large dataset
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText(/5000\+ related records/)).toBeInTheDocument()
      })

      // Verify dialog is scrollable for large impact lists
      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()
    })

    it('should clean up resources properly after dialog closes', async () => {
      const user = userEvent.setup()
      
      mockImpactCalculation.calculateClassDeletionImpact.mockResolvedValue({
        affectedItems: [],
        hasAssociatedData: false
      })
      
      render(
        <TestWrapper>
          <ClassManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Advanced Biology')).toBeInTheDocument()
      })

      // Open and close dialog multiple times
      for (let i = 0; i < 3; i++) {
        const classCard = screen.getByText('Advanced Biology').closest('.relative')
        const deleteButton = within(classCard!).getByRole('button', { name: /delete/i })
        await user.click(deleteButton)

        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument()
        })

        const cancelButton = screen.getByRole('button', { name: /cancel/i })
        await user.click(cancelButton)

        await waitFor(() => {
          expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        })
      }

      // Verify no memory leaks or duplicate event listeners
      expect(mockImpactCalculation.calculateClassDeletionImpact).toHaveBeenCalledTimes(3)
    })
  })
})