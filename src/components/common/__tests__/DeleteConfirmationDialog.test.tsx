import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeleteConfirmationDialog } from '../DeleteConfirmationDialog';

// Mock the AlertDialog components to avoid Radix UI context issues in tests
jest.mock('../../ui/alert-dialog', () => ({
  AlertDialog: ({ children, open }: any) => open ? <div data-testid="alert-dialog">{children}</div> : null,
  AlertDialogContent: ({ children }: any) => <div role="dialog">{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <h2>{children}</h2>,
  AlertDialogDescription: ({ children, id }: any) => <p id={id}>{children}</p>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogAction: ({ children, onClick, disabled, className }: any) => (
    <button onClick={onClick} disabled={disabled} className={className}>{children}</button>
  ),
  AlertDialogCancel: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
}));

describe('DeleteConfirmationDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    title: 'Delete Class',
    description: 'Are you sure you want to delete this class?',
    itemName: 'Math 101',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with basic props', () => {
    render(<DeleteConfirmationDialog {...defaultProps} />);
    
    expect(screen.getByText('Delete Class')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this class?')).toBeInTheDocument();
    expect(screen.getByText('Math 101')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('displays impact information when provided', () => {
    const impactInfo = {
      hasAssociatedData: true,
      warningMessage: 'This will delete all associated data',
      affectedItems: [
        { type: 'students', count: 5, description: 'Enrolled students' },
        { type: 'notes', count: 3, description: 'Class notes' },
      ],
    };

    render(
      <DeleteConfirmationDialog 
        {...defaultProps} 
        impactInfo={impactInfo}
      />
    );

    expect(screen.getByText('This will delete all associated data')).toBeInTheDocument();
    expect(screen.getByText('This action will also affect:')).toBeInTheDocument();
    expect(screen.getByText('Enrolled students')).toBeInTheDocument();
    expect(screen.getByText('5 items')).toBeInTheDocument();
    expect(screen.getByText('Class notes')).toBeInTheDocument();
    expect(screen.getByText('3 items')).toBeInTheDocument();
  });

  it('displays safe deletion message when no associated data', () => {
    const impactInfo = {
      hasAssociatedData: false,
      affectedItems: [],
    };

    render(
      <DeleteConfirmationDialog 
        {...defaultProps} 
        impactInfo={impactInfo}
      />
    );

    expect(screen.getByText('This item has no associated data and can be safely deleted.')).toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    render(<DeleteConfirmationDialog {...defaultProps} isLoading={true} />);
    
    expect(screen.getByText('Deleting...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /deleting/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  it('calls onConfirm when delete button is clicked', () => {
    render(<DeleteConfirmationDialog {...defaultProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button is clicked', () => {
    render(<DeleteConfirmationDialog {...defaultProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call handlers when loading', () => {
    render(<DeleteConfirmationDialog {...defaultProps} isLoading={true} />);
    
    fireEvent.click(screen.getByRole('button', { name: /deleting/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    
    expect(defaultProps.onConfirm).not.toHaveBeenCalled();
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('has proper accessibility attributes', () => {
    render(<DeleteConfirmationDialog {...defaultProps} />);
    
    // Check for ARIA attributes
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    
    // Check for proper description
    const description = screen.getByText('Are you sure you want to delete this class?');
    expect(description).toHaveAttribute('id', 'delete-dialog-description');
  });

  it('supports keyboard navigation', async () => {
    render(<DeleteConfirmationDialog {...defaultProps} />);
    
    // Check that buttons are focusable
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    
    expect(cancelButton).toBeInTheDocument();
    expect(deleteButton).toBeInTheDocument();
    
    // Focus the cancel button
    cancelButton.focus();
    expect(cancelButton).toHaveFocus();
  });

  it('handles singular vs plural item counts correctly', () => {
    const impactInfo = {
      hasAssociatedData: true,
      affectedItems: [
        { type: 'student', count: 1, description: 'Enrolled student' },
        { type: 'notes', count: 2, description: 'Class notes' },
      ],
    };

    render(
      <DeleteConfirmationDialog 
        {...defaultProps} 
        impactInfo={impactInfo}
      />
    );

    expect(screen.getByText('1 item')).toBeInTheDocument();
    expect(screen.getByText('2 items')).toBeInTheDocument();
  });
});