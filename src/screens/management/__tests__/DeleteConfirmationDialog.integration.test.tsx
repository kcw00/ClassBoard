import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DeleteConfirmationDialog } from '@/components/common/DeleteConfirmationDialog'

// Mock dependencies
jest.mock('@/components/common/LoadingSpinner', () => ({
  LoadingSpinner: ({ size, className }: { size?: string; className?: string }) => (
    <div data-testid="loading-spinner" className={className}>Loading...</div>
  )
}))

jest.mock('@/components/common/DeleteLoadingState', () => ({
  DeleteLoadingState: ({ 
    isLoading, 
    operation, 
    itemType, 
    itemName 
  }: { 
    isLoading: boolean; 
    operation: string; 
    itemType: string; 
    itemName: string; 
  }) => (
    <div data-testid="delete-loading-state">
      {operation} {itemType} {itemName}...
    </div>
  )
}))

describe('DeleteConfirmationDialog Integration Tests', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    title: 'Delete Class',
    description: 'Are you sure you want to delete this class?',
    itemName: 'Advanced Biology'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Dialog Functionality', () => {
    it('should render dialog with correct title and description', () => {
      render(<DeleteConfirmationDialog {...defaultProps} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Delete Class')).toBeInTheDocument()
      expect(screen.getByText('Are you sure you want to delete this class?')).toBeInTheDocument()
      expect(screen.getByText('Advanced Biology')).toBeInTheDocument()
    })

    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup()
      const onClose = jest.fn()
      
      render(<DeleteConfirmationDialog {...defaultProps} onClose={onClose} />)

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should call onConfirm when delete button is clicked', async () => {
      const user = userEvent.setup()
      const onConfirm = jest.fn()
      
      const impactInfo = {
        affectedItems: [],
        hasAssociatedData: false
      }
      
      render(
        <DeleteConfirmationDialog 
          {...defaultProps} 
          onConfirm={onConfirm}
          impactInfo={impactInfo}
        />
      )

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      expect(onConfirm).toHaveBeenCalledTimes(1)
    })

    it('should not render when isOpen is false', () => {
      render(<DeleteConfirmationDialog {...defaultProps} isOpen={false} />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('Impact Information Display', () => {
    it('should display impact information when hasAssociatedData is true', () => {
      const impactInfo = {
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
          }
        ],
        hasAssociatedData: true,
        warningMessage: 'This action will permanently delete all related data and cannot be undone.'
      }

      render(
        <DeleteConfirmationDialog 
          {...defaultProps} 
          impactInfo={impactInfo}
        />
      )

      expect(screen.getByText('5 enrolled students will be unenrolled')).toBeInTheDocument()
      expect(screen.getByText('3 schedules will be deleted')).toBeInTheDocument()
      expect(screen.getByText('5 items')).toBeInTheDocument()
      expect(screen.getByText('3 items')).toBeInTheDocument()
      expect(screen.getByText(/permanently delete all related data/)).toBeInTheDocument()
    })

    it('should display safe deletion message when hasAssociatedData is false', () => {
      const impactInfo = {
        affectedItems: [],
        hasAssociatedData: false
      }

      render(
        <DeleteConfirmationDialog 
          {...defaultProps} 
          impactInfo={impactInfo}
        />
      )

      expect(screen.getByText(/no associated data/i)).toBeInTheDocument()
      expect(screen.getByText(/can be safely deleted/i)).toBeInTheDocument()
    })

    it('should handle singular vs plural item counts correctly', () => {
      const impactInfo = {
        affectedItems: [
          {
            type: 'students',
            count: 1,
            description: '1 enrolled student will be unenrolled'
          },
          {
            type: 'schedules',
            count: 2,
            description: '2 schedules will be deleted'
          }
        ],
        hasAssociatedData: true
      }

      render(
        <DeleteConfirmationDialog 
          {...defaultProps} 
          impactInfo={impactInfo}
        />
      )

      expect(screen.getByText('1 item')).toBeInTheDocument()
      expect(screen.getByText('2 items')).toBeInTheDocument()
    })

    it('should display extensive data warning for high-impact deletions', () => {
      const impactInfo = {
        affectedItems: [
          {
            type: 'students',
            count: 25,
            description: '25 enrolled students will be unenrolled'
          }
        ],
        hasAssociatedData: true,
        warningMessage: 'This class has extensive data (100+ related records). This action cannot be undone.'
      }

      render(
        <DeleteConfirmationDialog 
          {...defaultProps} 
          impactInfo={impactInfo}
        />
      )

      expect(screen.getByText(/extensive data.*100\+ related records/)).toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('should show loading state during deletion', () => {
      render(
        <DeleteConfirmationDialog 
          {...defaultProps} 
          isLoading={true}
          itemType="class"
        />
      )

      expect(screen.getByTestId('delete-loading-state')).toBeInTheDocument()
      expect(screen.getByText(/deleting class Advanced Biology/)).toBeInTheDocument()
    })

    it('should show calculating state during impact calculation', () => {
      render(
        <DeleteConfirmationDialog 
          {...defaultProps} 
          isCalculatingImpact={true}
          itemType="class"
        />
      )

      expect(screen.getByTestId('delete-loading-state')).toBeInTheDocument()
      expect(screen.getByText(/calculating class Advanced Biology/)).toBeInTheDocument()
    })

    it('should disable buttons during loading', () => {
      const impactInfo = {
        affectedItems: [],
        hasAssociatedData: false
      }

      render(
        <DeleteConfirmationDialog 
          {...defaultProps} 
          isLoading={true}
          impactInfo={impactInfo}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      const deleteButton = screen.getByRole('button', { name: /deleting/i })

      expect(cancelButton).toBeDisabled()
      expect(deleteButton).toBeDisabled()
    })

    it('should disable buttons during impact calculation', () => {
      render(
        <DeleteConfirmationDialog 
          {...defaultProps} 
          isCalculatingImpact={true}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      const deleteButton = screen.getByRole('button', { name: /calculating/i })

      expect(cancelButton).toBeDisabled()
      expect(deleteButton).toBeDisabled()
    })

    it('should show retry count during retry operations', () => {
      const impactInfo = {
        affectedItems: [],
        hasAssociatedData: false
      }

      render(
        <DeleteConfirmationDialog 
          {...defaultProps} 
          isLoading={true}
          isRetrying={true}
          retryCount={2}
          maxRetries={3}
          impactInfo={impactInfo}
        />
      )

      expect(screen.getByText(/deleting.*\(2\/3\)/i)).toBeInTheDocument()
    })
  })

  describe('Network Status Integration', () => {
    it('should show offline indicator when network is offline', () => {
      render(
        <DeleteConfirmationDialog 
          {...defaultProps} 
          networkStatus="offline"
        />
      )

      expect(screen.getByText(/no internet connection detected/i)).toBeInTheDocument()
    })

    it('should show slow network indicator when network is slow', () => {
      render(
        <DeleteConfirmationDialog 
          {...defaultProps} 
          networkStatus="slow"
        />
      )

      expect(screen.getByText(/slow network connection detected/i)).toBeInTheDocument()
    })

    it('should not show network indicator when online', () => {
      render(
        <DeleteConfirmationDialog 
          {...defaultProps} 
          networkStatus="online"
        />
      )

      expect(screen.queryByText(/connection/i)).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<DeleteConfirmationDialog {...defaultProps} />)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-describedby')
      
      const title = screen.getByRole('heading')
      expect(title).toBeInTheDocument()
    })

    it('should handle keyboard navigation', async () => {
      const user = userEvent.setup()
      const onClose = jest.fn()
      const onConfirm = jest.fn()
      
      const impactInfo = {
        affectedItems: [],
        hasAssociatedData: false
      }

      render(
        <DeleteConfirmationDialog 
          {...defaultProps} 
          onClose={onClose}
          onConfirm={onConfirm}
          impactInfo={impactInfo}
        />
      )

      // Test Escape key
      await user.keyboard('{Escape}')
      expect(onClose).toHaveBeenCalledTimes(1)

      // Test Tab navigation
      await user.keyboard('{Tab}')
      expect(screen.getByRole('button', { name: /cancel/i })).toHaveFocus()

      await user.keyboard('{Tab}')
      expect(screen.getByRole('button', { name: /delete/i })).toHaveFocus()

      // Test Enter key on delete button
      await user.keyboard('{Enter}')
      expect(onConfirm).toHaveBeenCalledTimes(1)
    })

    it('should prevent actions when buttons are disabled', async () => {
      const user = userEvent.setup()
      const onClose = jest.fn()
      const onConfirm = jest.fn()

      render(
        <DeleteConfirmationDialog 
          {...defaultProps} 
          onClose={onClose}
          onConfirm={onConfirm}
          isLoading={true}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      const deleteButton = screen.getByRole('button', { name: /deleting/i })

      await user.click(cancelButton)
      await user.click(deleteButton)

      expect(onClose).not.toHaveBeenCalled()
      expect(onConfirm).not.toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing impact information gracefully', () => {
      render(<DeleteConfirmationDialog {...defaultProps} />)

      // Should still render dialog but delete button should be disabled
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /delete/i })).toBeDisabled()
    })

    it('should handle empty impact items array', () => {
      const impactInfo = {
        affectedItems: [],
        hasAssociatedData: false
      }

      render(
        <DeleteConfirmationDialog 
          {...defaultProps} 
          impactInfo={impactInfo}
        />
      )

      expect(screen.getByText(/no associated data/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /delete/i })).not.toBeDisabled()
    })

    it('should handle very long item names', () => {
      const longName = 'A'.repeat(100)
      
      render(
        <DeleteConfirmationDialog 
          {...defaultProps} 
          itemName={longName}
        />
      )

      expect(screen.getByText(longName)).toBeInTheDocument()
    })

    it('should handle very large impact counts', () => {
      const impactInfo = {
        affectedItems: [
          {
            type: 'records',
            count: 999999,
            description: '999999 records will be deleted'
          }
        ],
        hasAssociatedData: true
      }

      render(
        <DeleteConfirmationDialog 
          {...defaultProps} 
          impactInfo={impactInfo}
        />
      )

      expect(screen.getByText('999999 records will be deleted')).toBeInTheDocument()
      expect(screen.getByText('999999 items')).toBeInTheDocument()
    })
  })

  describe('Multiple Item Types', () => {
    it('should handle class deletion dialog correctly', () => {
      const impactInfo = {
        affectedItems: [
          {
            type: 'students',
            count: 5,
            description: '5 enrolled students will be unenrolled'
          }
        ],
        hasAssociatedData: true
      }

      render(
        <DeleteConfirmationDialog 
          {...defaultProps} 
          title="Delete Class"
          itemType="class"
          impactInfo={impactInfo}
        />
      )

      expect(screen.getByText('Delete Class')).toBeInTheDocument()
    })

    it('should handle student deletion dialog correctly', () => {
      const impactInfo = {
        affectedItems: [
          {
            type: 'classes',
            count: 3,
            description: 'Student will be unenrolled from 3 classes'
          }
        ],
        hasAssociatedData: true
      }

      render(
        <DeleteConfirmationDialog 
          {...defaultProps} 
          title="Delete Student"
          itemName="John Doe"
          itemType="student"
          impactInfo={impactInfo}
        />
      )

      expect(screen.getByText('Delete Student')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Student will be unenrolled from 3 classes')).toBeInTheDocument()
    })
  })
})