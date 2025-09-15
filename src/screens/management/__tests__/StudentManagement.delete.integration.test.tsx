import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import StudentManagement from '../StudentManagement'
import { AppDataMigrationProvider } from '@/context/AppDataMigrationContext'
import { appDataService } from '@/services/AppDataService'
import * as impactCalculation from '@/utils/impactCalculation'
import * as errorHandling from '@/utils/errorHandling'

// Mock dependencies
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
const mockStudent = {
  id: 'student-1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-0101',
  grade: '10th Grade',
  parentContact: '555-0102',
  enrollmentDate: '2024-01-15'
}

const mockStudents = [mockStudent]

const mockClasses = [
  {
    id: 'class-1',
    name: 'Advanced Biology',
    subject: 'Science',
    description: 'Advanced biology course',
    room: 'Science 101',
    capacity: 25,
    color: '#3b82f6',
    enrolledStudents: ['student-1']
  },
  {
    id: 'class-2',
    name: 'Chemistry 101',
    subject: 'Science',
    description: 'Basic chemistry course',
    room: 'Science 102',
    capacity: 20,
    color: '#ef4444',
    enrolledStudents: ['student-1']
  }
]

const mockDeletionImpact = {
  affectedItems: [
    {
      type: 'classes',
      count: 2,
      description: 'Student will be unenrolled from 2 classes'
    },
    {
      type: 'attendance',
      count: 15,
      description: '15 attendance records will be deleted'
    },
    {
      type: 'test-results',
      count: 8,
      description: '8 test results will be deleted'
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

describe('StudentManagement Delete Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mocks
    mockAppDataService.getStudents.mockResolvedValue(mockStudents)
    mockAppDataService.getClasses.mockResolvedValue(mockClasses)
    mockAppDataService.getAttendanceRecords.mockResolvedValue([])
    mockAppDataService.getTestResults.mockResolvedValue([])
    mockAppDataService.getHomeworkSubmissions.mockResolvedValue([])
    mockAppDataService.getMeetings.mockResolvedValue([])

    mockImpactCalculation.calculateStudentDeletionImpact.mockResolvedValue(mockDeletionImpact)
    mockErrorHandling.DEFAULT_RETRY_CONFIG = {
      maxAttempts: 3,
      baseDelay: 100,
      maxDelay: 1000,
      backoffFactor: 2
    }
  })

  describe('Complete Student Deletion Workflow - Card View', () => {
    it('should complete successful student deletion from button click to UI update in card view', async () => {
      const user = userEvent.setup()
      mockAppDataService.deleteStudent.mockResolvedValue()

      render(
        <TestWrapper>
          <StudentManagement />
        </TestWrapper>
      )

      // Wait for students to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Verify we're in card view (default)
      expect(screen.getByDisplayValue('cards')).toBeInTheDocument()

      // Find and click the delete button in card view
      const studentCard = screen.getByText('John Doe').closest('.relative')
      expect(studentCard).toBeInTheDocument()

      const deleteButton = within(studentCard!).getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      // Wait for impact calculation to complete
      await waitFor(() => {
        expect(mockImpactCalculation.calculateStudentDeletionImpact).toHaveBeenCalledWith('student-1')
      })

      // Verify confirmation dialog appears with impact information
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText('Delete Student')).toBeInTheDocument()
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Student will be unenrolled from 2 classes')).toBeInTheDocument()
        expect(screen.getByText('15 attendance records will be deleted')).toBeInTheDocument()
        expect(screen.getByText('8 test results will be deleted')).toBeInTheDocument()
      })

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /delete/i })
      await user.click(confirmButton)

      // Verify delete API call
      await waitFor(() => {
        expect(mockAppDataService.deleteStudent).toHaveBeenCalledWith('student-1')
      })

      // Verify success handling
      await waitFor(() => {
        expect(mockErrorHandling.handleDeleteSuccess).toHaveBeenCalledWith('student', 'John Doe')
      })

      // Verify dialog closes
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })

      // Verify UI updates (student should be removed from list)
      await waitFor(() => {
        expect(mockAppDataService.getStudents).toHaveBeenCalled()
      })
    })

    it('should handle student deletion with no associated data in card view', async () => {
      const user = userEvent.setup()
      mockImpactCalculation.calculateStudentDeletionImpact.mockResolvedValue(mockEmptyDeletionImpact)
      mockAppDataService.deleteStudent.mockResolvedValue()

      render(
        <TestWrapper>
          <StudentManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Click delete button in card view
      const studentCard = screen.getByText('John Doe').closest('.relative')
      const deleteButton = within(studentCard!).getByRole('button', { name: /delete/i })
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
        expect(mockAppDataService.deleteStudent).toHaveBeenCalledWith('student-1')
      })
    })
  })

  describe('Complete Student Deletion Workflow - Table View', () => {
    it('should complete successful student deletion from button click to UI update in table view', async () => {
      const user = userEvent.setup()
      mockAppDataService.deleteStudent.mockResolvedValue()

      render(
        <TestWrapper>
          <StudentManagement />
        </TestWrapper>
      )

      // Wait for students to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Switch to table view
      const viewSelect = screen.getByDisplayValue('cards')
      await user.click(viewSelect)
      await user.click(screen.getByText('Table'))

      // Verify we're in table view
      await waitFor(() => {
        expect(screen.getByDisplayValue('table')).toBeInTheDocument()
        expect(screen.getByRole('table')).toBeInTheDocument()
      })

      // Find and click the delete button in table view
      const tableRow = screen.getByRole('row', { name: /john doe/i })
      const deleteButton = within(tableRow).getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      // Wait for impact calculation to complete
      await waitFor(() => {
        expect(mockImpactCalculation.calculateStudentDeletionImpact).toHaveBeenCalledWith('student-1')
      })

      // Verify confirmation dialog appears
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText('Delete Student')).toBeInTheDocument()
        expect(screen.getByText('Student will be unenrolled from 2 classes')).toBeInTheDocument()
      })

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /delete/i })
      await user.click(confirmButton)

      // Verify delete API call
      await waitFor(() => {
        expect(mockAppDataService.deleteStudent).toHaveBeenCalledWith('student-1')
      })

      // Verify success handling
      await waitFor(() => {
        expect(mockErrorHandling.handleDeleteSuccess).toHaveBeenCalledWith('student', 'John Doe')
      })
    })

    it('should show loading states during deletion process in table view', async () => {
      const user = userEvent.setup()
      let resolveDelete: () => void
      const deletePromise = new Promise<void>((resolve) => {
        resolveDelete = resolve
      })
      mockAppDataService.deleteStudent.mockReturnValue(deletePromise)

      render(
        <TestWrapper>
          <StudentManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Switch to table view
      const viewSelect = screen.getByDisplayValue('cards')
      await user.click(viewSelect)
      await user.click(screen.getByText('Table'))

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument()
      })

      // Click delete button
      const tableRow = screen.getByRole('row', { name: /john doe/i })
      const deleteButton = within(tableRow).getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      // Wait for dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /delete/i })
      await user.click(confirmButton)

      // Verify loading state in dialog
      await waitFor(() => {
        expect(screen.getByText(/deleting/i)).toBeInTheDocument()
        expect(confirmButton).toBeDisabled()
      })

      // Verify table row shows loading state
      await waitFor(() => {
        const updatedRow = screen.getByRole('row', { name: /john doe/i })
        expect(updatedRow).toHaveClass(/opacity-60/)
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
      mockImpactCalculation.calculateStudentDeletionImpact.mockReturnValue(impactPromise)

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
      expect(mockAppDataService.deleteStudent).not.toHaveBeenCalled()

      // Resolve the impact calculation (should not affect anything)
      resolveImpact(mockDeletionImpact)
    })

    it('should handle cancellation after impact calculation', async () => {
      const user = userEvent.setup()

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

      // Wait for dialog with impact information
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText('Student will be unenrolled from 2 classes')).toBeInTheDocument()
      })

      // Cancel after seeing impact
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      // Verify dialog closes
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })

      // Verify no deletion occurred
      expect(mockAppDataService.deleteStudent).not.toHaveBeenCalled()
    })

    it('should prevent cancellation during deletion process', async () => {
      const user = userEvent.setup()
      let resolveDelete: () => void
      const deletePromise = new Promise<void>((resolve) => {
        resolveDelete = resolve
      })
      mockAppDataService.deleteStudent.mockReturnValue(deletePromise)

      render(
        <TestWrapper>
          <StudentManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Start deletion process
      const studentCard = screen.getByText('John Doe').closest('.relative')
      const deleteButton = within(studentCard!).getByRole('button', { name: /delete/i })
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
      mockImpactCalculation.calculateStudentDeletionImpact.mockRejectedValue(impactError)

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

      // Verify error handling
      await waitFor(() => {
        expect(mockErrorHandling.handleImpactCalculationError).toHaveBeenCalledWith(
          impactError,
          'student',
          'John Doe',
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
      mockAppDataService.deleteStudent.mockRejectedValue(deleteError)

      render(
        <TestWrapper>
          <StudentManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Start deletion process
      const studentCard = screen.getByText('John Doe').closest('.relative')
      const deleteButton = within(studentCard!).getByRole('button', { name: /delete/i })
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
          'student',
          'John Doe',
          expect.any(Function)
        )
      })
    })

    it('should handle authorization errors during deletion', async () => {
      const user = userEvent.setup()
      const authError = new Error('Unauthorized')
      mockAppDataService.deleteStudent.mockRejectedValue(authError)

      render(
        <TestWrapper>
          <StudentManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Complete deletion flow
      const studentCard = screen.getByText('John Doe').closest('.relative')
      const deleteButton = within(studentCard!).getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /delete/i })
      await user.click(confirmButton)

      // Verify error is handled appropriately
      await waitFor(() => {
        expect(mockErrorHandling.handleDeleteError).toHaveBeenCalledWith(
          authError,
          'student',
          'John Doe',
          expect.any(Function)
        )
      })
    })
  })

  describe('Impact Information Display', () => {
    it('should display accurate impact information for student with associated data', async () => {
      const user = userEvent.setup()
      const complexImpact = {
        affectedItems: [
          {
            type: 'classes',
            count: 3,
            description: 'Student will be unenrolled from 3 classes'
          },
          {
            type: 'attendance',
            count: 45,
            description: '45 attendance records will be deleted'
          },
          {
            type: 'test-results',
            count: 12,
            description: '12 test results will be deleted'
          },
          {
            type: 'homework-submissions',
            count: 28,
            description: '28 homework submissions will be deleted'
          },
          {
            type: 'meetings',
            count: 5,
            description: '5 meetings will be affected'
          }
        ],
        hasAssociatedData: true,
        warningMessage: 'This student has extensive data (93 related records). This action cannot be undone.'
      }

      mockImpactCalculation.calculateStudentDeletionImpact.mockResolvedValue(complexImpact)

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

      // Verify all impact information is displayed
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText('Student will be unenrolled from 3 classes')).toBeInTheDocument()
        expect(screen.getByText('45 attendance records will be deleted')).toBeInTheDocument()
        expect(screen.getByText('12 test results will be deleted')).toBeInTheDocument()
        expect(screen.getByText('28 homework submissions will be deleted')).toBeInTheDocument()
        expect(screen.getByText('5 meetings will be affected')).toBeInTheDocument()
        expect(screen.getByText(/extensive data.*93 related records/)).toBeInTheDocument()
      })

      // Verify item counts are displayed correctly
      expect(screen.getByText('3 items')).toBeInTheDocument()
      expect(screen.getByText('45 items')).toBeInTheDocument()
      expect(screen.getByText('12 items')).toBeInTheDocument()
      expect(screen.getByText('28 items')).toBeInTheDocument()
      expect(screen.getByText('5 items')).toBeInTheDocument()
    })

    it('should display correct impact information for student with single items', async () => {
      const user = userEvent.setup()
      const singleItemImpact = {
        affectedItems: [
          {
            type: 'classes',
            count: 1,
            description: 'Student will be unenrolled from 1 class'
          },
          {
            type: 'attendance',
            count: 1,
            description: '1 attendance record will be deleted'
          }
        ],
        hasAssociatedData: true,
        warningMessage: 'This action will permanently delete all related data and cannot be undone.'
      }

      mockImpactCalculation.calculateStudentDeletionImpact.mockResolvedValue(singleItemImpact)

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

      // Verify singular forms are used correctly
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText('Student will be unenrolled from 1 class')).toBeInTheDocument()
        expect(screen.getByText('1 attendance record will be deleted')).toBeInTheDocument()
        expect(screen.getByText('1 item')).toBeInTheDocument()
      })
    })

    it('should show calculating state during impact calculation', async () => {
      const user = userEvent.setup()
      let resolveImpact: (value: any) => void
      const impactPromise = new Promise((resolve) => {
        resolveImpact = resolve
      })
      mockImpactCalculation.calculateStudentDeletionImpact.mockReturnValue(impactPromise)

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
        expect(screen.getByText('Student will be unenrolled from 2 classes')).toBeInTheDocument()
      })
    })
  })

  describe('Search and Filter Integration', () => {
    it('should maintain search functionality during delete operations', async () => {
      const user = userEvent.setup()
      const additionalStudents = [
        {
          id: 'student-2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '555-0201',
          grade: '11th Grade',
          parentContact: '555-0202',
          enrollmentDate: '2024-01-15'
        }
      ]

      mockAppDataService.getStudents.mockResolvedValue([mockStudent, ...additionalStudents])

      render(
        <TestWrapper>
          <StudentManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      })

      // Search for specific student
      const searchInput = screen.getByPlaceholderText(/search students/i)
      await user.type(searchInput, 'John')

      // Verify search results
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
      })

      // Delete the searched student
      const studentCard = screen.getByText('John Doe').closest('.relative')
      const deleteButton = within(studentCard!).getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      // Verify dialog opens even with search active
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText('Delete Student')).toBeInTheDocument()
      })

      // Cancel and verify search is still active
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        expect(searchInput).toHaveValue('John')
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
      })
    })
  })

  describe('View Mode Consistency', () => {
    it('should maintain view mode after deletion', async () => {
      const user = userEvent.setup()
      mockAppDataService.deleteStudent.mockResolvedValue()

      render(
        <TestWrapper>
          <StudentManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Switch to table view
      const viewSelect = screen.getByDisplayValue('cards')
      await user.click(viewSelect)
      await user.click(screen.getByText('Table'))

      await waitFor(() => {
        expect(screen.getByDisplayValue('table')).toBeInTheDocument()
      })

      // Delete student in table view
      const tableRow = screen.getByRole('row', { name: /john doe/i })
      const deleteButton = within(tableRow).getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /delete/i })
      await user.click(confirmButton)

      // Wait for deletion to complete
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })

      // Verify we're still in table view
      expect(screen.getByDisplayValue('table')).toBeInTheDocument()
    })
  })

  describe('Accessibility and User Experience', () => {
    it('should have proper ARIA labels and roles', async () => {
      const user = userEvent.setup()

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

      // Verify dialog accessibility
      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(dialog).toBeInTheDocument()
        expect(dialog).toHaveAttribute('aria-describedby')

        const title = screen.getByRole('heading', { name: /delete student/i })
        expect(title).toBeInTheDocument()

        const description = screen.getByText(/are you sure you want to delete/i)
        expect(description).toBeInTheDocument()
      })
    })

    it('should handle keyboard navigation in both card and table views', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <StudentManagement />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Test keyboard navigation in card view
      const studentCard = screen.getByText('John Doe').closest('.relative')
      const deleteButton = within(studentCard!).getByRole('button', { name: /delete/i })

      deleteButton.focus()
      await user.keyboard('{Enter}')

      // Verify dialog opens
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Close dialog
      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })

      // Switch to table view and test keyboard navigation
      const viewSelect = screen.getByDisplayValue('cards')
      await user.click(viewSelect)
      await user.click(screen.getByText('Table'))

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument()
      })

      const tableRow = screen.getByRole('row', { name: /john doe/i })
      const tableDeleteButton = within(tableRow).getByRole('button', { name: /delete/i })

      tableDeleteButton.focus()
      await user.keyboard('{Enter}')

      // Verify dialog opens from table view
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })
  })
})