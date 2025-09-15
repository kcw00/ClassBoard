import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { DeleteLoadingState, InlineDeleteLoading } from '../DeleteLoadingState'

describe('DeleteLoadingState', () => {
  const defaultProps = {
    isLoading: true,
    operation: 'deleting' as const,
    itemType: 'class' as const,
    itemName: 'Test Class'
  }

  it('renders loading state for deletion', () => {
    render(<DeleteLoadingState {...defaultProps} />)
    
    expect(screen.getByText(/Deleting class "Test Class"/)).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument() // LoadingSpinner has role="status"
  })

  it('renders loading state for impact calculation', () => {
    render(
      <DeleteLoadingState 
        {...defaultProps} 
        operation="calculating"
      />
    )
    
    expect(screen.getByText(/Calculating deletion impact for class "Test Class"/)).toBeInTheDocument()
  })

  it('shows retry information when retrying', () => {
    render(
      <DeleteLoadingState 
        {...defaultProps} 
        isRetrying={true}
        retryCount={2}
        maxRetries={3}
      />
    )
    
    expect(screen.getByText(/attempt 2\/3/)).toBeInTheDocument()
    expect(screen.getByText(/Retrying due to network or server issues/)).toBeInTheDocument()
  })

  it('shows network status indicators', () => {
    render(
      <DeleteLoadingState 
        {...defaultProps} 
        networkStatus="offline"
      />
    )
    
    expect(screen.getByText(/No internet connection/)).toBeInTheDocument()
  })

  it('shows estimated time when provided', () => {
    render(
      <DeleteLoadingState 
        {...defaultProps} 
        estimatedTime={5}
      />
    )
    
    expect(screen.getByText(/Estimated time: 5 seconds/)).toBeInTheDocument()
  })

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = jest.fn()
    render(
      <DeleteLoadingState 
        {...defaultProps} 
        onCancel={onCancel}
      />
    )
    
    const cancelButton = screen.getByRole('button')
    fireEvent.click(cancelButton)
    
    expect(onCancel).toHaveBeenCalled()
  })

  it('does not render when not loading', () => {
    render(
      <DeleteLoadingState 
        {...defaultProps} 
        isLoading={false}
      />
    )
    
    expect(screen.queryByText(/Deleting/)).not.toBeInTheDocument()
  })
})

describe('InlineDeleteLoading', () => {
  it('renders inline loading for deletion', () => {
    render(
      <InlineDeleteLoading 
        isLoading={true}
        operation="deleting"
        itemName="Test Item"
      />
    )
    
    expect(screen.getByText(/Deleting "Test Item"/)).toBeInTheDocument()
  })

  it('renders inline loading for calculation', () => {
    render(
      <InlineDeleteLoading 
        isLoading={true}
        operation="calculating"
        itemName="Test Item"
      />
    )
    
    expect(screen.getByText(/Calculating impact for "Test Item"/)).toBeInTheDocument()
  })

  it('does not render when not loading', () => {
    render(
      <InlineDeleteLoading 
        isLoading={false}
        operation="deleting"
        itemName="Test Item"
      />
    )
    
    expect(screen.queryByText(/Deleting/)).not.toBeInTheDocument()
  })
})