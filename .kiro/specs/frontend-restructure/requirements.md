# Requirements Document

## Introduction

The current frontend folder structure has several organizational issues that make the codebase difficult to navigate and maintain. There are duplicate component folders (`src/components` and `src/src/components`), inconsistent file organization, and unclear separation of concerns. This feature will restructure the frontend to follow modern React project conventions with clear separation between components, screens, utilities, and configuration files.

## Requirements

### Requirement 1

**User Story:** As a developer, I want a clean and logical folder structure, so that I can easily navigate and maintain the codebase.

#### Acceptance Criteria

1. WHEN organizing the project THEN the system SHALL have a single, clear components directory structure
2. WHEN looking for screens THEN the system SHALL have all screen components in a dedicated screens/pages directory
3. WHEN accessing utilities THEN the system SHALL have shared utilities in a dedicated utils directory
4. WHEN working with types THEN the system SHALL have TypeScript types organized in a types directory
5. WHEN managing assets THEN the system SHALL have all static assets properly organized

### Requirement 2

**User Story:** As a developer, I want to eliminate duplicate and redundant folders, so that there is no confusion about where files should be located.

#### Acceptance Criteria

1. WHEN examining the src directory THEN the system SHALL NOT have duplicate component directories
2. WHEN looking for components THEN the system SHALL have only one components directory with clear organization
3. WHEN accessing screens THEN the system SHALL consolidate all screen components into a single location
4. WHEN reviewing the structure THEN the system SHALL have no orphaned or unused directories

### Requirement 3

**User Story:** As a developer, I want consistent naming conventions and file organization, so that the project follows modern React best practices.

#### Acceptance Criteria

1. WHEN organizing components THEN the system SHALL group related components together
2. WHEN structuring directories THEN the system SHALL follow kebab-case for folder names where appropriate
3. WHEN organizing files THEN the system SHALL separate UI components from business logic components
4. WHEN managing configuration THEN the system SHALL have all config files in appropriate locations

### Requirement 4

**User Story:** As a developer, I want proper separation between different types of code, so that the architecture is clear and maintainable.

#### Acceptance Criteria

1. WHEN organizing code THEN the system SHALL separate presentation components from container components
2. WHEN managing state THEN the system SHALL have context providers in a dedicated directory
3. WHEN handling data THEN the system SHALL have data-related files properly organized
4. WHEN managing styles THEN the system SHALL have styling files logically grouped

### Requirement 5

**User Story:** As a developer, I want all import statements to work correctly after restructuring, so that the application continues to function without breaking changes.

#### Acceptance Criteria

1. WHEN restructuring files THEN the system SHALL update all import statements to reflect new paths
2. WHEN moving components THEN the system SHALL ensure all references are updated
3. WHEN reorganizing directories THEN the system SHALL maintain all existing functionality
4. WHEN completing the restructure THEN the system SHALL have no broken imports or missing dependencies