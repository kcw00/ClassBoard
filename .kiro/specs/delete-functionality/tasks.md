# Implementation Plan

- [x] 1. Create reusable delete confirmation dialog component
  - Create DeleteConfirmationDialog component using existing AlertDialog primitives
  - Implement props interface for title, description, item name, and impact information
  - Add loading state support during deletion process
  - Include proper accessibility attributes and keyboard navigation
  - _Requirements: 3.1, 3.2, 3.3, 6.1, 6.4_

- [x] 2. Create impact calculation utility functions
  - Implement calculateClassDeletionImpact function to count related records
  - Implement calculateStudentDeletionImpact function to count related records
  - Create helper functions to format impact information for display
  - Add error handling for impact calculation failures
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 3. Add delete button to ClassManagement component
  - Add delete button to each class card with trash icon and red styling
  - Implement click handler to open confirmation dialog
  - Add state management for dialog open/close and loading states
  - Position delete button appropriately in the existing card layout
  - _Requirements: 1.1, 6.1, 6.3_

- [ ] 4. Integrate delete functionality in ClassManagement
  - Connect delete button to DeleteConfirmationDialog component
  - Implement handleDeleteClass function using existing AppDataService.deleteClass method
  - Add impact calculation before showing confirmation dialog
  - Handle success and error states with appropriate toast messages
  - Update UI to remove deleted class from the list
  - _Requirements: 1.2, 1.3, 1.4, 5.1, 5.2, 7.1, 7.2_

- [ ] 5. Add delete button to StudentManagement component
  - Add delete button to both card and table views with consistent styling
  - Implement click handler to open confirmation dialog
  - Add state management for dialog open/close and loading states
  - Ensure proper positioning in both card and table layouts
  - _Requirements: 2.1, 6.1, 6.3_

- [ ] 6. Integrate delete functionality in StudentManagement
  - Connect delete button to DeleteConfirmationDialog component
  - Implement handleDeleteStudent function using existing AppDataService.deleteStudent method
  - Add impact calculation before showing confirmation dialog
  - Handle success and error states with appropriate toast messages
  - Update UI to remove deleted student from both card and table views
  - _Requirements: 2.2, 2.3, 2.4, 5.1, 5.2, 7.1, 7.2_

- [ ] 7. Add error handling and user feedback
  - Implement comprehensive error handling for network failures and authorization errors
  - Add specific error messages for different failure scenarios
  - Integrate with existing toast notification system for success and error messages
  - Add retry mechanism for recoverable errors
  - _Requirements: 5.3, 5.4, 5.5, 7.3, 7.4_

- [ ] 8. Add loading states and UI feedback
  - Implement loading spinners during deletion operations
  - Disable delete buttons during active deletion processes
  - Add visual feedback for successful deletions
  - Ensure proper loading state management in confirmation dialogs
  - _Requirements: 7.5, 6.2_

- [ ] 9. Write unit tests for delete components
  - Create tests for DeleteConfirmationDialog component rendering and interactions
  - Test impact calculation utility functions with various data scenarios
  - Test delete button click handlers and state management
  - Test error handling and loading states
  - _Requirements: All requirements - testing coverage_

- [ ] 10. Write integration tests for delete workflows
  - Test complete class deletion workflow from button click to UI update
  - Test complete student deletion workflow from button click to UI update
  - Test cancellation scenarios and error handling
  - Test impact information display accuracy
  - _Requirements: All requirements - integration testing_