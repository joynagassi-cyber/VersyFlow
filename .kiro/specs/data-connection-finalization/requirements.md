# Requirements Document: Data Connection Finalization

## Introduction

VersyFlow is a React Native Bible memorization application using the FSRS (Free Spaced Repetition Scheduler) algorithm for optimized learning. The application currently has 47 implemented screens with a complete theme system, but several critical components are displaying mock data instead of connecting to the InsForge backend. This feature connects all remaining UI components to real backend services, implements missing CRUD operations for collections, enables profile updates, and provides data backup/restore functionality.

This finalization is critical for production readiness, transforming VersyFlow from a demonstration app into a fully functional user application with persistent cloud storage and data portability.

## Glossary

- **InsForge**: An open-source, Postgres-based Backend-as-a-Service (BaaS) providing database, authentication, file storage, edge functions, and realtime capabilities
- **FSRS**: Free Spaced Repetition Scheduler - an evidence-based algorithm for optimizing memory retention intervals
- **Memorization_Record**: A database entity representing a Bible verse being memorized by a user, including FSRS state and review history
- **Review_Log**: A database entity recording each review session for a verse, including rating, stability changes, and timing
- **Collection**: A user-defined grouping of Bible verses for organization and study planning
- **Collection_Verse**: A join table entity linking collections to memorization records
- **User_Profile**: User account information stored in the InsForge `users` table, including display name and preferences
- **Cloud_Sync_Service**: The service responsible for synchronizing local MMKV storage with the InsForge backend
- **Progress_Service**: The service that calculates statistics, streaks, milestones, and retention metrics from memorization data
- **Backup_Export**: A JSON file containing all user data (memorization records, review logs, collections, settings) for data portability
- **RLS**: Row Level Security - Postgres policies that restrict data access to authenticated users
- **Authentication_Service**: The InsForgeAuthService that manages user sign-up, sign-in, and session management

## Requirements

### Requirement 1: Connect Review History to Backend

**User Story:** As a user, I want to view my actual review history for each verse, so that I can track my learning progress with real data from my memorization sessions.

#### Acceptance Criteria

1. WHEN the Review History screen (`app/review/History.tsx`) loads, THE Review_History_Screen SHALL fetch the actual memorization record from the backend using the record ID from route parameters
2. WHEN the memorization record is successfully fetched, THE Review_History_Screen SHALL fetch all review logs associated with that record from the backend
3. IF the record or logs fail to load, THEN THE Review_History_Screen SHALL display an error message and provide a retry button
4. WHEN review logs are successfully loaded, THE Review_History_Screen SHALL display each log entry with timestamp, rating, stability changes, difficulty changes, elapsed days, and repetition count
5. THE Review_History_Screen SHALL calculate and display aggregate statistics (total reviews, average stability, success rate percentage) from the actual review logs
6. THE Review_History_Screen SHALL replace all usage of `SAMPLE_HISTORY` and `SAMPLE_VERSE` with data fetched from the backend
7. WHEN no review logs exist for a verse, THE Review_History_Screen SHALL display an empty state message indicating the verse has not been reviewed yet

### Requirement 2: Connect Collections to Backend Service

**User Story:** As a user, I want to create, view, edit, and delete verse collections, so that I can organize my memorization work according to themes or study plans.

#### Acceptance Criteria

1. WHEN the Collections screen (`app/collections/index.tsx`) loads, THE Collections_Screen SHALL fetch all collections belonging to the authenticated user from the `collections` table
2. WHEN collections are successfully fetched, THE Collections_Screen SHALL display each collection with its name, description, verse count, last updated timestamp, and custom color
3. THE Collections_Screen SHALL calculate the accurate verse count for each collection by joining with the `collection_verses` table
4. WHEN a user taps the create button, THE Collections_Screen SHALL navigate to a collection creation form
5. WHEN a user submits a new collection, THE Collections_Screen SHALL insert the collection into the `collections` table with the authenticated user's ID
6. WHEN a user taps on an existing collection, THE Collections_Screen SHALL navigate to a collection detail screen showing all verses in that collection
7. WHEN a user deletes a collection, THE Collections_Screen SHALL remove the collection and all associated `collection_verses` entries from the backend
8. THE Collections_Screen SHALL replace all usage of `SAMPLE_COLLECTIONS` with data fetched from the backend
9. WHEN no collections exist, THE Collections_Screen SHALL display an empty state with a call-to-action to create the first collection
10. WHERE offline mode is active, THE Collections_Screen SHALL display locally cached collections and queue write operations for later synchronization

### Requirement 3: Implement Profile Update Functionality

**User Story:** As a user, I want to update my display name and default Bible translation, so that I can personalize my application experience.

#### Acceptance Criteria

1. WHEN the Profile screen (`app/profile/index.tsx`) loads, THE Profile_Screen SHALL fetch the current user profile from the `users` table using the authenticated user's ID
2. WHEN the user enters a new display name and taps save, THE Profile_Screen SHALL update the `display_name` field in the `users` table for the authenticated user
3. WHEN the user changes their default translation preference, THE Profile_Screen SHALL update the `default_translation` field in the `users` table
4. WHEN the profile update succeeds, THE Profile_Screen SHALL display a success confirmation message and update the displayed values
5. IF the profile update fails, THEN THE Profile_Screen SHALL display an error message with the failure reason
6. THE Profile_Screen SHALL validate that the display name is between 1 and 100 characters before submitting
7. THE Profile_Screen SHALL implement the TODO at line 33 by calling `InsForgeAuthService.updateUserProfile` with the authenticated user's ID and updated data
8. WHEN the user updates their profile, THE Profile_Screen SHALL also update the local auth store to reflect the changes immediately

### Requirement 4: Implement Data Export Functionality

**User Story:** As a user, I want to export all my memorization data to a file, so that I can create backups and transfer my progress to other devices.

#### Acceptance Criteria

1. WHEN the user taps "Export Data" on the Backup screen (`app/settings/backup.tsx`), THE Backup_Screen SHALL fetch all memorization records for the authenticated user from the `memorization_records` table
2. WHEN memorization records are fetched, THE Backup_Screen SHALL also fetch all associated review logs from the `review_logs` table
3. WHEN review logs are fetched, THE Backup_Screen SHALL fetch all collections and collection verses from the `collections` and `collection_verses` tables
4. WHEN all data is collected, THE Backup_Screen SHALL serialize the data into a JSON structure with schema version metadata
5. THE Backup_Screen SHALL use the Expo FileSystem API to write the JSON export to the device's documents directory
6. WHEN the file is successfully written, THE Backup_Screen SHALL use the Expo Sharing API to present a native share sheet allowing the user to save or share the backup file
7. THE Backup_Screen SHALL implement the TODO at line 26 by creating an export service that orchestrates data fetching and file generation
8. THE exported JSON SHALL include a timestamp, schema version identifier, and all user data organized by entity type
9. IF the export fails at any step, THEN THE Backup_Screen SHALL display an error message indicating which step failed
10. THE Backup_Screen SHALL display a progress indicator during the export operation

### Requirement 5: Implement Data Import Functionality

**User Story:** As a user, I want to import memorization data from a backup file, so that I can restore my progress after device changes or data loss.

#### Acceptance Criteria

1. WHEN the user taps "Import Data" on the Backup screen (`app/settings/backup.tsx`), THE Backup_Screen SHALL present a native file picker using the Expo DocumentPicker API
2. WHEN a file is selected, THE Backup_Screen SHALL read and parse the JSON content from the selected file
3. WHEN the JSON is parsed, THE Backup_Screen SHALL validate the schema version matches a supported import version
4. IF the schema version is unsupported, THEN THE Backup_Screen SHALL display an error message indicating incompatibility
5. WHEN the import data is validated, THE Backup_Screen SHALL insert or update memorization records in the `memorization_records` table, preserving existing record IDs to maintain referential integrity
6. WHEN records are imported, THE Backup_Screen SHALL also import all review logs into the `review_logs` table
7. WHEN review logs are imported, THE Backup_Screen SHALL import collections and collection verses into their respective tables
8. THE Backup_Screen SHALL handle ID conflicts by preserving the imported record IDs and updating existing records if they already exist
9. WHEN the import completes successfully, THE Backup_Screen SHALL display a success message with statistics (number of records, logs, and collections imported)
10. THE Backup_Screen SHALL implement the TODO at line 31 by creating an import service that validates and inserts imported data
11. IF the import fails at any step, THEN THE Backup_Screen SHALL roll back partial changes and display an error message
12. THE Backup_Screen SHALL display a progress indicator during the import operation showing current entity type being imported

### Requirement 6: Connect Analytics to Real Progress Data

**User Story:** As a user, I want to see accurate statistics about my memorization progress, so that I can understand my learning patterns and stay motivated.

#### Acceptance Criteria

1. WHEN the Analytics capability store (`src/capabilities/analytics/store.ts`) calculates stats, THE Analytics_Store SHALL call `ProgressService.getStats()` to retrieve real statistics
2. THE Analytics_Store SHALL fetch the total number of verses, mastered verses, in-progress verses, and verses due for review from the Progress_Service
3. THE Analytics_Store SHALL fetch the current streak count and longest streak from the Progress_Service
4. THE Analytics_Store SHALL fetch the weekly trend data (this week vs last week verse count and percentage change) from the Progress_Service
5. THE Analytics_Store SHALL fetch the average session duration in minutes from the Progress_Service
6. THE Analytics_Store SHALL replace the TODO at line 27 by removing mock data and implementing actual integration with Progress_Service
7. WHEN real statistics are calculated, THE Analytics_Store SHALL update the `stats` state with the actual `ProgressStats` object
8. THE Analytics_Store SHALL calculate the retention curve by aggregating review log data grouped by date over the past 30 days
9. THE Analytics_Store SHALL calculate total learning time by summing `totalReviewMinutes` from all memorization records
10. WHEN stats calculation fails, THE Analytics_Store SHALL log the error and set `isCalculating` to false without crashing the application

### Requirement 7: Implement Collections Service Layer

**User Story:** As a developer, I want a dedicated service layer for collection operations, so that collection logic is centralized and reusable across the application.

#### Acceptance Criteria

1. THE System SHALL create a new `CollectionsService` class in the `src/services/` directory
2. THE Collections_Service SHALL provide a `createCollection` method that inserts a new collection record into the `collections` table
3. THE Collections_Service SHALL provide a `getCollectionsByUserId` method that fetches all collections for a given user ID
4. THE Collections_Service SHALL provide a `getCollectionById` method that fetches a single collection with its associated verse count
5. THE Collections_Service SHALL provide an `updateCollection` method that updates collection name, description, or color
6. THE Collections_Service SHALL provide a `deleteCollection` method that removes a collection and all associated `collection_verses` entries
7. THE Collections_Service SHALL provide an `addVerseToCollection` method that inserts a record into the `collection_verses` table
8. THE Collections_Service SHALL provide a `removeVerseFromCollection` method that deletes a specific `collection_verses` entry
9. THE Collections_Service SHALL provide a `getVersesInCollection` method that returns all memorization records belonging to a collection
10. THE Collections_Service SHALL respect RLS policies by using the authenticated user's session when making database queries

### Requirement 8: Implement Backup/Restore Service Layer

**User Story:** As a developer, I want a dedicated service layer for backup and restore operations, so that export/import logic is separated from UI concerns.

#### Acceptance Criteria

1. THE System SHALL create a new `BackupService` class in the `src/services/` directory
2. THE Backup_Service SHALL provide an `exportData` method that aggregates all user data and returns a JSON-serializable backup object
3. THE Backup_Service SHALL provide an `importData` method that accepts a backup object and writes it to the database
4. THE Backup_Service SHALL define a backup schema version constant (e.g., "v1.0") for forward compatibility
5. THE Backup_Service SHALL include schema version metadata in every exported backup object
6. WHEN exporting data, THE Backup_Service SHALL fetch all memorization records, review logs, collections, collection verses, and user settings for the authenticated user
7. WHEN importing data, THE Backup_Service SHALL validate the backup schema version before processing
8. WHEN importing data, THE Backup_Service SHALL use database transactions to ensure atomicity (all-or-nothing import)
9. THE Backup_Service SHALL provide a `validateBackupFile` method that checks JSON structure and schema version without performing import
10. THE Backup_Service SHALL log all export and import operations with timestamps and record counts for debugging

### Requirement 9: Implement Data Synchronization for Collections

**User Story:** As a user working offline, I want my collection changes to be automatically synchronized when I reconnect, so that I don't lose any organization work done offline.

#### Acceptance Criteria

1. WHEN a collection is created offline, THE Cloud_Sync_Service SHALL queue the collection creation for synchronization
2. WHEN a collection is updated offline, THE Cloud_Sync_Service SHALL queue the update operation with the latest collection data
3. WHEN a collection is deleted offline, THE Cloud_Sync_Service SHALL queue the deletion and remove associated verses from the sync queue
4. WHEN network connectivity is restored, THE Cloud_Sync_Service SHALL process queued collection operations in chronological order
5. THE Cloud_Sync_Service SHALL extend the existing sync queue mechanism to support collection entity types
6. WHEN syncing collections to cloud, THE Cloud_Sync_Service SHALL use upsert operations to handle both creation and updates
7. WHEN syncing collection verses, THE Cloud_Sync_Service SHALL preserve the relationship between collections and memorization records
8. IF a sync conflict occurs (same collection modified on multiple devices), THEN THE Cloud_Sync_Service SHALL apply last-write-wins strategy based on `updated_at` timestamp
9. THE Cloud_Sync_Service SHALL sync collection data in the existing `syncOnce()` method alongside records and logs
10. WHEN collections are synced from cloud to local, THE Cloud_Sync_Service SHALL update the local MMKV storage with the latest collection data

### Requirement 10: Handle Authentication State for Data Operations

**User Story:** As a user, I want data operations to gracefully handle authentication failures, so that I receive clear feedback when my session expires or login is required.

#### Acceptance Criteria

1. WHEN any backend data fetch operation is attempted without authentication, THE System SHALL return an authentication error
2. WHEN an authentication error occurs, THE affected screen SHALL display an error message prompting the user to log in
3. THE System SHALL provide a navigation action from the error state directly to the login screen
4. WHEN a user's session expires during data operations, THE System SHALL clear the auth store and redirect to the login screen
5. WHERE profile update, collection operations, or data export require authentication, THE System SHALL verify the user is authenticated before attempting the operation
6. THE Collections_Screen, Profile_Screen, and Backup_Screen SHALL check authentication state on mount and redirect to login if unauthenticated
7. WHEN a data operation fails due to RLS policy denial, THE System SHALL log the RLS error and display a user-friendly message indicating insufficient permissions
8. THE Authentication_Service SHALL provide a `isAuthenticated()` method that returns the current authentication state
9. WHEN offline, THE System SHALL allow read operations from local storage without requiring active authentication
10. WHEN online and authenticated, THE System SHALL use the authenticated user's session token for all InsForge database operations

## Requirements Quality Standards

All requirements in this document follow the EARS (Easy Approach to Requirements Syntax) patterns:
- **Ubiquitous requirements** use "THE <system> SHALL <response>"
- **Event-driven requirements** use "WHEN <trigger>, THE <system> SHALL <response>"
- **Unwanted event requirements** use "IF <condition>, THEN THE <system> SHALL <response>"
- **Optional feature requirements** use "WHERE <option>, THE <system> SHALL <response>"

All requirements comply with INCOSE quality rules:
- Active voice with explicit system names
- No vague terms like "quickly" or "user-friendly"
- No pronouns; specific entity names are used
- Measurable and verifiable acceptance criteria
- No escape clauses like "where possible"
- Focus on what the system should do, not implementation details
