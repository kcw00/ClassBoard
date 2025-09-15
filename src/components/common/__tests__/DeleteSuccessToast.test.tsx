import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { DeleteSuccessToast, DeleteSuccessAnimation } from '../DeleteSuccessToast'

describe('DeleteSuccessToast', () => {
  const defaultProps = {
    itemType: 'class' as const,
    itemName: 'Test Class',
    onDismiss: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders success message for class deletion', () => {
    render(<DeleteSuccessToast {...defaultProps} />)
    
    expect(screen.getByText('Class deleted successfully')).toBeInTheDocument()
    expect(screen.getByText('"Test Class" has been removed from your classes')).toBeInTheDocument()
  })

  it('renders success message for student deletion', () => {
    render(
      <DeleteSuccessToast 
        {...defaultProps} 
        itemType="student"
        itemName="Test Student"
      />
    )
    
    expect(screen.getByText('Student deleted successfully')).toBeInTheDocument()
    expect(screen.getByText('"Test Student" has been removed from your students')).toBeInTheDocument()
  })

  it('shows undo button when showUndo is true', () => {
    const onUndo = jest.fn()
    render(
      <DeleteSuccessToast 
        {...defaultProps} 
        showUndo={true}
        onUndo={onUndo}
      />
    )
    
    const undoButton = screen.getByText('Undo')
    expect(undoButton).toBeInTheDocument()
    
    fireEvent.click(undoButton)
    expect(onUndo).toHaveBeenCalled()
  })

  it('calls onDismiss when dismiss button is clicked', () => {
    render(<DeleteSuccessToast {...defaultProps} />)
    
    const dismissButton = screen.getByRole('button', { name: /close notification/i })
    fireEvent.click(dismissButton)
    
    expect(defaultProps.onDismiss).toHaveBeenCalled()
  })

  it('does not show undo button by default', () => {
    render(<DeleteSuccessToast {...defaultProps} />)
    
    expect(screen.queryByText('Undo')).not.toBeInTheDocument()
  })
})

describe('DeleteSuccessAnimation', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders animation when visible', () => {
    render(
      <DeleteSuccessAnimation 
        isVisible={true}
        onComplete={jest.fn()}
      />
    )
    
    expect(screen.getByText('Deleted successfully!')).toBeInTheDocument()
  })

  it('does not render when not visible', () => {
    render(
      <DeleteSuccessAnimation 
        isVisible={false}
        onComplete={jest.fn()}
      />
    )
    
    expect(screen.queryByText('Deleted successfully!')).not.toBeInTheDocument()
  })

  it('calls onComplete after timeout', () => {
    const onComplete = jest.fn()
    render(
      <DeleteSuccessAnimation 
        isVisible={true}
        onComplete={onComplete}
      />
    )
    
    expect(onComplete).not.toHaveBeenCalled()
    
    act(() => {
      jest.advanceTimersByTime(2000)
    })
    
    expect(onComplete).toHaveBeenCalled()
  })

  it('clears timeout when component unmounts', () => {
    const onComplete = jest.fn()
    const { unmount } = render(
      <DeleteSuccessAnimation 
        isVisible={true}
        onComplete={onComplete}
      />
    )
    
    unmount()
    
    act(() => {
      jest.advanceTimersByTime(2000)
    })
    
    expect(onComplete).not.toHaveBeenCalled()
  })
})