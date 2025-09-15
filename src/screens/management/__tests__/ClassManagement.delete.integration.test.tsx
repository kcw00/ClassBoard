import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import ClassManagement from '../ClassManagement'
import { AppDataMigrationProvider } from '@/context/AppDataMigrationContext'
import { appDataService } from '@/services/AppDataService'
import * as impactCalculation from '@/utils/impactCalculation'
import * as errorHandling from '@/utils/errorHandling'

// Mock dependencies
jest.mock('console', () => ({
  error: jest.fn()
}))
jest.mock('@/services/AppDataService')
jest.mock('@/utils/impactCalculation')
jest.mock('@/utils/errorHandling')
jest.mock('@/hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => ({ status: 'online' })
}))

const mockAppDataService = appDataService as jest.Mocked<typeof appDataService>
const mockImpactCalculation = impactCalculation as jest.Mocked<typeof impactCalculation>
const mockErrorHandling = errorHandling as jest.Mocked<typeof errorHandling>

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

const mockClasses = [mockClass]

const mockStudents = [
  {
    id: 'student-1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '555-0101',
    grade: '10th Grade',
    parentContact: '555-0102',
    enrollmentDate: '2024-01-15'
  },
  {
    id: 'student-2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '555-0201',
    grade: '10th Grade',
    parentContact: '555-0202',
    enrollmentDate: '2024-01-15'
  }
]

const mockSchedules = [
  {
    id: 'schedule-1',
    classId: 'class-1',
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '10:00'
  }
]

const mockDeletionImpact = {
  affectedItems: [
    {
      type: 'students',
      count: 2,
      description: '2 enrolled students will be unenrolled'
    },
    {
      type: 'schedules',
      count: 1,
      description: '1 schedule will be deleted'
    }
  ],
  hasAssociatedData: true,
  warningMessage: 'This action will permanently delete all related data and cannot be undone.'
}

const mockEmptyDeletionImpact = {
  affectedItems: [],
  hasAssociatedData: false
}

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AppDataMigrationProvider>
      {children}
    </AppDataMigrationProvider>
  </BrowserRouter>
)

describe('ClassManagement Delete Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mocks
    mockAppDataService.getClasses.mockResolvedValue(mockClasses)
    mockAppDataService.getStudents.mockResolvedValue(mockStudents)
    mockAppDataService.getSchedules.mockResolvedValue(mockSchedules)
    mockAppDataService.getAttendanceRecords.mockResolvedValue([])
    mockAppDataService.getClassNotes.mockResolvedValue([])
    mockAppDataService.getTests.mockResolvedValue([])
    mockAppDataService.getMeetings.mockResolvedValue([])

    mockImpactCalculation.calculateClassDeletionImpact.mockResolvedValue(mockDeletionImpact)
    mockErrorHandling.DEFAULT_RETRY_CONFIG = {
      maxAttempts: 3,
      baseDelay: 100,
      maxDelay: 1000,
      backoffFactor: 2
    }
  })

  describe('Complete Class Deletion Workflow', () => {
    it('should complete successful class deletion from button click to UI update', async () => {
      const user = userEvent.setup()
      mockAppDataService.deleteClass.mockResolvedValue()

      render(
        <TestWrapper>
          <ClassManagement />
        </TestWrapper>
      )

      // Wait for classes to load
      await waitFor(() => {
        expect(screen.getByText('Advanced Biology')).toBeInTheDocument()
      })

      // Find and click the delete button
      const classCard = screen.getByText('Advanced Biology').closest('.relative')
      expect(classCard).toBeInTheDocument()

      const deleteButton = within(classCard!).getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      // Wait for impact calculation to complete
      await waitFor(() => {
        expect(mockImpactCalculation.calculateClassDeletionImpact).toHaveBeenCalledWith('class-1')
      })

      // Verify confirmation dialog appears with impact information
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText('Delete Class')).toBeInTheDocument()
        expect(screen.getByText('Advanced Biology')).toBeInTheDocument()
        expect(screen.getByText('2 enrolled students will be unenrolled')).toBeInTheDocument()
        expect(screen.getByText('1 schedule will be deleted')).toBeInTheDocument()
      })

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /delete/i })
      await user.click(confirmButton)

      // Verify delete API call
      await waitFor(() => {
        expect(mockAppDataService.deleteClass).toHaveBeenCalledWith('class-1')
      })

      // Verify success handling
      await waitFor(() => {
        expect(mockErrorHandling.handleDeleteSuccess).toHaveBeenCalledWith('class', 'Advanced Biology')
      })

      // Verify dialog closes
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })

      // Verify UI updates (class should be removed from list)
      await waitFor(() => {
        expect(mockAppDataService.getClasses).toHaveBeenCalled()
      })
    })

    it('should handle class deletion with no associated data', async () => {
      const user = userEvent.setup()
      mockImpactCalculation.calculateClassDeletionImpact.mockResolvedValue(mockEmptyDeletionImpact)
      mockAppDataService.deleteClass.mockResolvedValue()

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

      // Wait for dialog and verify safe deletion message
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText(/no associated data/i)).toBeInTheDocument()
        expect(screen.getByText(/can be safely deleted/i)).toBeInTheDocument()
      })

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /delete/i })
      await user.click(confirmButton)

      // Verify deletion proceeds
      await waitFor(() => {
        expect(mockAppDataService.deleteClass).toHaveBeenCalledWith('class-1')
      })
    })

    it('should show loading states during deletion process', async () => {
      const user = userEvent.setup()
      let resolveDelete: () => void
      const deletePromise = new Promise<void>((resolve) => {
        resolveDelete = resolve
      })
      mockAppDataService.deleteClass.mockReturnValue(deletePromise)

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

      // Wait for dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /delete/i })
      await user.click(confirmButton)

      // Verify loading state
      await waitFor(() => {
        expect(screen.getByText(/deleting/i)).toBeInTheDocument()
        expect(confirmButton).toBeDisabled()
        expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled()
      })

      // Resolve deletion
      resolveDelete!()

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })
  })

  describe('Cancellation Scenarios', () => {
    it('should handle cancellation during impact calculation', async () => {
      const user = userEvent.setup()
      let resolveImpact: (value: any) => void
      const impactPromise = new Promise((resolve) => {
        resolveImpact = resolve
      })
      mockImpactCalculation.calculateClassDeletionImpact.mockReturnValue(impactPromise)

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

      // Wait for dialog with calculating state
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText(/calculating/i)).toBeInTheDocument()
      })

      // Cancel during calculation
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      // Verify dialog closes
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })

      // Verify no deletion occurred
      expect(mockAppDataService.deleteClass).not.toHaveBeenCalled()

      // Resolve the impact calculation (should not affect anything)
      resolveImpact(mockDeletionImpact)
    })

    it('should handle cancellation after impact calculation', async () => {
      const user = userEvent.setup()

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

      // Wait for dialog with impact information
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText('2 enrolled students will be unenrolled')).toBeInTheDocument()
      })

      // Cancel after seeing impact
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      // Verify dialog closes
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })

      // Verify no deletion occurred
      expect(mockAppDataService.deleteClass).not.toHaveBeenCalled()
    })

    it('should prevent cancellation during deletion process', async () => {
      const user = userEvent.setup()
      let resolveDelete: () => void
      const deletePromise = new Promise<void>((resolve) => {
        resolveDelete = resolve
      })
      mockAppDataService.deleteClass.mockReturnValue(deletePromise)

      render(
        <TestWrapper>
          <ClassManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Advanced Biology')).toBeInTheDocument()
      })

      // Start deletion process
      const classCard = screen.getByText('Advanced Biology').closest('.relative')
      const deleteButton = within(classCard!).getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /delete/i })
      await user.click(confirmButton)

      // Verify cancel button is disabled during deletion
      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /cancel/i })
        expect(cancelButton).toBeDisabled()
      })

      // Resolve deletion
      resolveDelete!()

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle impact calculation errors', async () => {
      const user = userEvent.setup()
      const impactError = new Error('Failed to calculate impact')
      mockImpactCalculation.calculateClassDeletionImpact.mockRejectedValue(impactError)

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

      // Verify error handling
      await waitFor(() => {
        expect(mockErrorHandling.handleImpactCalculationError).toHaveBeenCalledWith(
          impactError,
          'class',
          'Advanced Biology',
          expect.any(Function)
        )
      })

      // Verify dialog closes on error
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    it('should handle deletion errors with retry option', async () => {
      const user = userEvent.setup()
      const deleteError = new Error('Network error')
      mockAppDataService.deleteClass.mockRejectedValue(deleteError)

      render(
        <TestWrapper>
          <ClassManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Advanced Biology')).toBeInTheDocument()
      })

      // Start deletion process
      const classCard = screen.getByText('Advanced Biology').closest('.relative')
      const deleteButton = within(classCard!).getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /delete/i })
      await user.click(confirmButton)

      // Verify error handling
      await waitFor(() => {
        expect(mockErrorHandling.handleDeleteError).toHaveBeenCalledWith(
          deleteError,
          'class',
          'Advanced Biology',
          expect.any(Function)
        )
      })
    })

    it('should handle network errors during deletion', async () => {
      const user = userEvent.setup()
      const networkError = new Error('Network error')
      mockAppDataService.deleteClass.mockRejectedValue(networkError)

      render(
        <TestWrapper>
          <ClassManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Advanced Biology')).toBeInTheDocument()
      })

      // Complete deletion flow
      const classCard = screen.getByText('Advanced Biology').closest('.relative')
      const deleteButton = within(classCard!).getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /delete/i })
      await user.click(confirmButton)

      // Verify error is handled appropriately
      await waitFor(() => {
        expect(mockErrorHandling.handleDeleteError).toHaveBeenCalledWith(
          networkError,
          'class',
          'Advanced Biology',
          expect.any(Function)
        )
      })
    })
  })

  describe('Impact Information Display', () => {
    it('should display accurate impact information for class with associated data', async () => {
      const user = userEvent.setup()
      const complexImpact = {
        affectedItems: [
          {
            type: 'students',
            count: 5,
            description: '5 enrolled students will be unenrolled'
          },
          {
            type: 'schedules',
            count: 3,
            description: '3 schedules will be deleted'
          },
          {
            type: 'notes',
            count: 10,
            description: '10 class notes will be deleted'
          },
          {
            type: 'attendance',
            count: 25,
            description: '25 attendance records will be deleted'
          }
        ],
        hasAssociatedData: true,
        warningMessage: 'This class has extensive data (43 related records). This action cannot be undone.'
      }

      mockImpactCalculation.calculateClassDeletionImpact.mockResolvedValue(complexImpact)

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
        expect(screen.getByText('5 enrolled students will be unenrolled')).toBeInTheDocument()
        expect(screen.getByText('3 schedules will be deleted')).toBeInTheDocument()
        expect(screen.getByText('10 class notes will be deleted')).toBeInTheDocument()
        expect(screen.getByText('25 attendance records will be deleted')).toBeInTheDocument()
        expect(screen.getByText(/extensive data.*43 related records/)).toBeInTheDocument()
      })

      // Verify item counts are displayed correctly
      expect(screen.getByText('5 items')).toBeInTheDocument()
      expect(screen.getByText('3 items')).toBeInTheDocument()
      expect(screen.getByText('10 items')).toBeInTheDocument()
      expect(screen.getByText('25 items')).toBeInTheDocument()
    })

    it('should display correct impact information for class with single items', async () => {
      const user = userEvent.setup()
      const singleItemImpact = {
        affectedItems: [
          {
            type: 'students',
            count: 1,
            description: '1 enrolled student will be unenrolled'
          },
          {
            type: 'schedules',
            count: 1,
            description: '1 schedule will be deleted'
          }
        ],
        hasAssociatedData: true,
        warningMessage: 'This action will permanently delete all related data and cannot be undone.'
      }

      mockImpactCalculation.calculateClassDeletionImpact.mockResolvedValue(singleItemImpact)

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

      // Verify singular forms are used correctly
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText('1 enrolled student will be unenrolled')).toBeInTheDocument()
        expect(screen.getByText('1 schedule will be deleted')).toBeInTheDocument()
        expect(screen.getByText('1 item')).toBeInTheDocument()
      })
    })

    it('should show calculating state during impact calculation', async () => {
      const user = userEvent.setup()
      let resolveImpact: (value: any) => void
      const impactPromise = new Promise((resolve) => {
        resolveImpact = resolve
      })
      mockImpactCalculation.calculateClassDeletionImpact.mockReturnValue(impactPromise)

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

      // Verify calculating state
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText(/calculating.*impact/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /calculating/i })).toBeDisabled()
      })

      // Resolve impact calculation
      resolveImpact!(mockDeletionImpact)

      // Verify impact information appears
      await waitFor(() => {
        expect(screen.queryByText(/calculating/i)).not.toBeInTheDocument()
        expect(screen.getByText('2 enrolled students will be unenrolled')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility and User Experience', () => {
    it('should have proper ARIA labels and roles', async () => {
      const user = userEvent.setup()

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

      // Verify dialog accessibility
      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(dialog).toBeInTheDocument()
        expect(dialog).toHaveAttribute('aria-describedby')

        const title = screen.getByRole('heading', { name: /delete class/i })
        expect(title).toBeInTheDocument()

        const description = screen.getByText(/are you sure you want to delete/i)
        expect(description).toBeInTheDocument()
      })
    })

    it('should handle keyboard navigation', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <ClassManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Advanced Biology')).toBeInTheDocument()
      })

      // Use keyboard to navigate to delete button
      const classCard = screen.getByText('Advanced Biology').closest('.relative')
      const deleteButton = within(classCard!).getByRole('button', { name: /delete/i })

      deleteButton.focus()
      await user.keyboard('{Enter}')

      // Verify dialog opens
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Use keyboard to navigate dialog
      await user.keyboard('{Tab}') // Should focus cancel button
      await user.keyboard('{Tab}') // Should focus delete button

      const confirmButton = screen.getByRole('button', { name: /delete/i })
      expect(confirmButton).toHaveFocus()
    })
  })
})