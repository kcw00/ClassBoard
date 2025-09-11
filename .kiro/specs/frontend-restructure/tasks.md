# Implementation Plan

- [x] 1. Set up new directory structure and TypeScript configuration
  - Create the new directory structure under src/
  - Configure TypeScript path mapping in tsconfig.json for cleaner imports
  - Set up absolute import paths (@/components, @/screens, etc.)
  - _Requirements: 1.1, 1.3, 3.3_

- [x] 2. Reorganize UI and common components
- [x] 2.1 Keep existing UI components structure intact
  - Verify src/components/ui/ structure is properly maintained
  - Ensure all shadcn/ui components remain in current location
  - _Requirements: 1.1, 3.1_

- [x] 2.2 Create common components directory and move business components
  - Create src/components/common/ directory
  - Move FilePreviewModal to src/components/common/
  - Move any other reusable business logic components to common/
  - Update imports for moved components
  - _Requirements: 1.1, 3.1, 4.1, 5.1, 5.2_

- [x] 2.3 Create layout components directory
  - Create src/components/layout/ directory
  - Move Layout component from src/src/components/ to src/components/layout/
  - Move any other layout-specific components
  - Update imports for layout components
  - _Requirements: 1.1, 3.1, 4.1, 5.1, 5.2_

- [x] 3. Consolidate and organize screen components
- [x] 3.1 Create screens directory structure
  - Create src/screens/ with subdirectories: auth/, dashboard/, management/, details/
  - Create index files for each subdirectory for clean exports
  - _Requirements: 1.2, 3.1, 4.1_

- [x] 3.2 Move authentication screens
  - Move LoginPage and LaunchScreen to src/screens/auth/
  - Update imports and exports for auth screens
  - Create src/screens/auth/index.ts for clean exports
  - _Requirements: 1.2, 4.1, 5.1, 5.2_

- [x] 3.3 Move dashboard screens
  - Move Dashboard and Overview components to src/screens/dashboard/
  - Update imports and exports for dashboard screens
  - Create src/screens/dashboard/index.ts for clean exports
  - _Requirements: 1.2, 4.1, 5.1, 5.2_

- [x] 3.4 Move management screens
  - Move ClassManagement, StudentManagement, TestManagement, MeetingManagement, AttendanceManagement to src/screens/management/
  - Update imports and exports for management screens
  - Create src/screens/management/index.ts for clean exports
  - _Requirements: 1.2, 4.1, 5.1, 5.2_

- [x] 3.5 Move detail screens
  - Move ClassDetails, StudentDetails, TestDetails to src/screens/details/
  - Update imports and exports for detail screens
  - Create src/screens/details/index.ts for clean exports
  - _Requirements: 1.2, 4.1, 5.1, 5.2_

- [x] 3.6 Move calendar screen
  - Move CalendarView to src/screens/ (as standalone screen)
  - Update imports and exports for calendar screen
  - _Requirements: 1.2, 4.1, 5.1, 5.2_

- [x] 4. Consolidate context providers and data
- [x] 4.1 Move context providers
  - Create src/context/ directory
  - Move AppDataContext and AuthContext from src/src/context/ to src/context/
  - Update imports for context providers
  - Create src/context/index.ts for clean exports
  - _Requirements: 1.4, 4.2, 5.1, 5.2_

- [x] 4.2 Consolidate mock data
  - Create src/data/ directory
  - Move and merge mockData.ts from both src/components/ and src/src/data/
  - Resolve any conflicts between the two mock data files
  - Update all imports referencing mock data
  - _Requirements: 1.5, 4.3, 5.1, 5.2_

- [x] 5. Update main application files and routing
- [x] 5.1 Update App.tsx imports
  - Update all component imports in App.tsx to use new paths
  - Ensure all screen and component references work with new structure
  - Test that application compiles successfully
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 5.2 Update main.tsx and other entry files
  - Update any imports in main.tsx that reference moved components
  - Update any other entry point files with new import paths
  - _Requirements: 5.1, 5.2, 5.3_


- [x] 6. Clean up remaining issues and optimize imports
- [x] 6.1 Convert remaining relative imports to absolute imports
  - Update imports in src/screens/ components to use @/ paths
  - Update imports in src/components/layout/ to use @/ paths
  - Update any remaining relative imports in context files
  - _Requirements: 5.1, 5.2, 1.3_

- [x] 6.2 Remove duplicate src/src directory and files
  - Delete src/src/components/ directory (Button.tsx, Card.tsx are duplicates)
  - Delete src/src/context/ directory (already moved to src/context/)
  - Delete src/src/data/ directory (already consolidated)
  - Delete src/src/screens/ directory (old screen files, replaced by new structure)
  - Remove the entire src/src/ directory
  - _Requirements: 2.1, 2.2, 2.4_

- [x] 6.3 Final validation and cleanup
  - Run build to ensure no compilation errors
  - Verify all imports resolve correctly
  - Check that no unused files remain
  - Test application functionality after cleanup
  - _Requirements: 5.3, 5.4_