# Frontend Restructure Design Document

## Overview

This design document outlines the restructuring of the frontend codebase to eliminate duplicate directories, improve organization, and follow modern React project conventions. The current structure has several issues including duplicate component directories (`src/components` and `src/src/components`), mixed concerns within directories, and inconsistent file organization.

The restructure will create a clean, logical hierarchy that separates UI components, business logic components, screens, utilities, and configuration files while maintaining all existing functionality.

## Architecture

### Current Structure Issues
- Duplicate component directories: `src/components` and `src/src/components`
- Mixed business logic and UI components in the same directory
- Configuration files scattered across different locations
- No clear separation between screens and components
- Mock data mixed with components

### Target Structure
```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Base UI components (shadcn/ui)
│   ├── common/          # Shared business components
│   └── layout/          # Layout-specific components
├── screens/             # Page-level components
│   ├── auth/           # Authentication screens
│   ├── dashboard/      # Dashboard and overview screens
│   ├── management/     # Management screens (class, student, test)
│   └── details/        # Detail view screens
├── context/            # React context providers
├── data/               # Mock data and data utilities
├── types/              # TypeScript type definitions
├── utils/              # Utility functions and helpers
├── styles/             # Global styles and theme
├── config/             # Configuration files
└── assets/             # Static assets
```

## Components and Interfaces

### Component Organization Strategy

#### UI Components (`src/components/ui/`)
- Keep existing shadcn/ui components in their current structure
- These are pure UI components with no business logic
- Maintain current naming conventions and exports

#### Common Components (`src/components/common/`)
- Move reusable business components here
- Components that contain business logic but are used across multiple screens
- Examples: `FilePreviewModal`, `ImageWithFallback`

#### Layout Components (`src/components/layout/`)
- Components specifically for layout purposes
- Examples: `Layout` (from src/src/components)

#### Screen Components (`src/screens/`)
Organize screens by functional area:
- **Auth**: `LoginPage`, `LaunchScreen`
- **Dashboard**: `Dashboard`, `Overview`
- **Management**: `ClassManagement`, `StudentManagement`, `TestManagement`, `MeetingManagement`, `AttendanceManagement`
- **Details**: `ClassDetails`, `StudentDetails`, `TestDetails`
- **Calendar**: `CalendarView`

### Import Path Strategy
- Use absolute imports with path mapping for cleaner imports
- Configure TypeScript paths in `tsconfig.json`
- Example: `@/components/ui/button` instead of `../../components/ui/button`

## Data Models

### Mock Data Consolidation
- Move all mock data from `src/components/mockData.ts` to `src/data/mockData.ts`
- Consolidate with existing `src/src/data/mockData.ts`
- Create separate files for different data types if needed

### Context Providers
- Move context providers from `src/src/context/` to `src/context/`
- Maintain existing `AppDataContext` and `AuthContext`
- Ensure proper typing and exports

## Error Handling

### Import Resolution
- Update all import statements to reflect new file locations
- Use TypeScript compiler to catch any missing imports
- Test all components after restructuring to ensure no runtime errors

### Backward Compatibility
- Maintain all existing component APIs
- Ensure no breaking changes to component interfaces
- Preserve all existing functionality during the move

## Testing Strategy

### Validation Approach
1. **Pre-restructure**: Document all current imports and dependencies
2. **During restructure**: Update imports incrementally and test compilation
3. **Post-restructure**: 
   - Verify application builds successfully
   - Test all major user flows
   - Ensure no console errors or warnings

### File Movement Validation
- Use TypeScript compiler to validate all imports
- Check for unused files or orphaned dependencies
- Verify all assets are properly referenced

## Implementation Phases

### Phase 1: Preparation
- Audit current file structure and dependencies
- Create new directory structure
- Set up TypeScript path mapping

### Phase 2: UI Components
- Keep `src/components/ui/` structure intact
- Move utility functions to appropriate locations

### Phase 3: Business Components
- Reorganize business logic components into logical groups
- Update imports for moved components

### Phase 4: Screens Consolidation
- Move all screen components to new screens directory
- Organize by functional area
- Update routing and navigation imports

### Phase 5: Supporting Files
- Move context providers, data files, and utilities
- Consolidate configuration files
- Update all remaining imports

### Phase 6: Cleanup
- Remove duplicate directories
- Clean up unused files
- Verify no broken references

## Design Decisions and Rationales

### Separation of UI and Business Components
**Decision**: Keep shadcn/ui components separate from business logic components
**Rationale**: UI components are pure and reusable, while business components contain domain-specific logic. This separation makes the codebase more maintainable and follows React best practices.

### Screen Organization by Feature
**Decision**: Organize screens by functional area rather than alphabetically
**Rationale**: Grouping related screens together makes it easier to find and maintain related functionality. This follows domain-driven design principles.

### Absolute Import Paths
**Decision**: Implement TypeScript path mapping for cleaner imports
**Rationale**: Reduces import complexity and makes refactoring easier. Standard practice in modern React applications.

### Gradual Migration Approach
**Decision**: Move files incrementally rather than all at once
**Rationale**: Reduces risk of breaking changes and allows for testing at each step. Makes it easier to identify and fix issues.

### Preserve Existing APIs
**Decision**: Maintain all existing component interfaces and exports
**Rationale**: Ensures no breaking changes for consumers of these components. The restructure should be purely organizational.