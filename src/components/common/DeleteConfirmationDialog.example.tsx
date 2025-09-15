import React, { useState } from 'react';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
import { Button } from '../ui/button';

/**
 * Example usage of DeleteConfirmationDialog component
 * This demonstrates how to integrate the dialog with delete functionality
 */
export function DeleteConfirmationDialogExample() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Example impact information for a class with associated data
  const impactInfo = {
    hasAssociatedData: true,
    warningMessage: 'This will permanently delete all associated data.',
    affectedItems: [
      { type: 'students', count: 15, description: 'Enrolled students' },
      { type: 'notes', count: 8, description: 'Class notes' },
      { type: 'attendance', count: 45, description: 'Attendance records' },
      { type: 'tests', count: 3, description: 'Tests and assessments' },
    ],
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Handle successful deletion
      console.log('Item deleted successfully');
      setIsDialogOpen(false);
      
      // You would typically:
      // 1. Call your delete API
      // 2. Update the UI state
      // 3. Show success toast
      
    } catch (error) {
      // Handle deletion error
      console.error('Failed to delete item:', error);
      
      // You would typically:
      // 1. Show error toast
      // 2. Keep dialog open for retry
      
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">Delete Confirmation Dialog Example</h2>
      
      <div className="space-y-2">
        <Button 
          variant="destructive" 
          onClick={() => setIsDialogOpen(true)}
        >
          Delete Class with Data
        </Button>
        
        <p className="text-sm text-muted-foreground">
          Click to see the delete confirmation dialog with impact information
        </p>
      </div>

      <DeleteConfirmationDialog
        isOpen={isDialogOpen}
        onClose={handleClose}
        onConfirm={handleDelete}
        title="Delete Class"
        description="Are you sure you want to delete this class? This action cannot be undone."
        itemName="Advanced Mathematics 101"
        impactInfo={impactInfo}
        isLoading={isDeleting}
      />
    </div>
  );
}