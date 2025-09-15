import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DeleteConfirmationDialog } from '../DeleteConfirmationDialog'

describe('Delete Integration Tests', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    title: 'Delete Class',
    description: 'Are you sure you want to delete this class?',
    itemName: 'Test Class',
    itemType: 'class' as const
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows loading state during deletion', () => {
    render(
      <DeleteConfirmationDialog 
        {...defaultProps}
        isLoading={true}
        impactInfo={{
          affectedItems: [],
          hasAssociatedData: false
        }}
      />
    )
    
    expect(screen.getByText(/Deleting class "Test Class"/)).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows calculating state during impact calculation', () => {
    render(
      <DeleteConfirmationDialog 
        {...defaultProps}
        isCalculatingImpact={true}
      />
    )
    
    expect(screen.getByText(/Calculating deletion impact for class "Test Class"/)).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('disables buttons during loading', () => {
    render(
      <DeleteConfirmationDialog 
        {...defaultProps}
        isLoading={true}
        impactInfo={{
          affectedItems: [],
          hasAssociatedData: false
        }}
      />
    )
    
    const deleteButton = screen.getByRole('button', { name: /deleting/i })
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    
    expect(deleteButton).toBeDisabled()
    expect(cancelButton).toBeDisabled()
  })

  it('shows retry information when retrying', () => {
    render(
      <DeleteConfirmationDialog 
        {...defaultProps}
        isLoading={true}
        isRetrying={true}
        retryCount={2}
        maxRetries={3}
        impactInfo={{
          affectedItems: [],
          hasAssociatedData: false
        }}
      />
    )
    
    expect(screen.getByText(/attempt 2\/3/)).toBeInTheDocument()
    expect(screen.getByText(/Retrying due to network or server issues/)).toBeInTheDocument()
  })

  it('shows network status when offline', () => {
    render(
      <DeleteConfirmationDialog 
        {...defaultProps}
        networkStatus="offline"
        impactInfo={{
          affectedItems: [],
          hasAssociatedData: false
        }}
      />
    )
    
    expect(screen.getByText(/No internet connection detected/)).toBeInTheDocument()
  })
})