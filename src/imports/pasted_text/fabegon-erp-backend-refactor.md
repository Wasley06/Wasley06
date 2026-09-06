FABEGON ERP – BACKEND ARCHITECTURE & DATABASE REBUILD (NO UI/UX CHANGES)

You are working on the existing Fabegon ERP project.

This task is strictly a backend, database, and data synchronization refactor.

Do NOT modify any UI or UX.

Do NOT change:

Layouts
Forms
Tables
Components
Navigation
Sidebar
Header
Footer
Icons
Colors
Typography
CSS
Tailwind classes
Responsive behavior
Animations
Existing workflows unless required for persistence

The current UI is correct.

Only modify code responsible for data persistence, Supabase integration, authentication, synchronization, and database architecture.

OBJECTIVE

Permanently fix the data persistence architecture so business data never disappears after:

Logout
Login
Browser refresh
Application restart
Electron restart
New installer deployment

Affected modules:

Inventory
Journal Entries
Chart of Creditors
Operational Scheduler
FIRST TASK

Audit the existing project before making changes.

Trace the complete data flow for every affected module.

Identify:

where data is created
where data is updated
where data is deleted
where data is fetched
where React state is populated
where logout clears state
where login reloads state
where realtime subscriptions are created
where browser storage is used

Do not begin refactoring until every data path has been mapped.

DATABASE

Review the existing Supabase schema.

Verify:

Primary Keys
Foreign Keys
Constraints
Indexes
Realtime publication
Triggers
Functions
RLS policies

Fix only incorrect schema.

Do not recreate tables that already exist.

Generate safe migration SQL where necessary.

SINGLE SOURCE OF TRUTH

Supabase must become the only permanent storage layer.

Remove permanent business data from:

localStorage
sessionStorage
IndexedDB
demo data
mock data
fallback arrays
seeded client-side objects

React state is temporary UI state only.

DATA LOADING

Every module must follow this pattern:

Application starts

↓

Check authentication

↓

Load permissions

↓

Load business data directly from Supabase

↓

Populate UI state

↓

Subscribe to realtime

Never initialize business data from browser storage.

Never initialize from demo data.

SAVE FLOW

Every save operation must follow:

Validate

↓

Begin transaction

↓

Write to Supabase

↓

Await successful response

↓

Refresh from Supabase

↓

Broadcast realtime update

↓

Refresh all connected users

Never update business data before Supabase confirms success.

REALTIME

Audit every realtime subscription.

Ensure exactly one subscription exists per module.

Listen for:

INSERT
UPDATE
DELETE

Automatically refresh only the affected records.

Prevent duplicate subscriptions.

Dispose listeners correctly.

Reconnect after authentication refresh.

AUTHENTICATION

Logging out must only:

End the user session
Remove authentication tokens

Logout must never:

Delete business records
Reset business state
Clear synchronized data
Remove cached server responses required for startup

After login:

Reload all business modules directly from Supabase.

AUTOMATION

Move business logic into PostgreSQL where appropriate.

Use database functions and triggers to automatically create related records.

Examples:

Inventory changes automatically generate:

Journal Entries
Scheduler Events
Audit Logs

Purchase Orders automatically update:

Creditors
Outstanding balances

Avoid relying on frontend logic for business rules.

PERFORMANCE

Add missing:

Indexes
Constraints
Unique keys
Foreign keys

Replace text date fields with proper PostgreSQL DATE or TIMESTAMPTZ types where possible.

Replace nullable fields that should be required.

Prevent duplicate business records.

CODE QUALITY

Remove:

Dead code
Duplicate services
Duplicate repositories
Unused hooks
Legacy persistence logic
Browser-based persistence
Silent error handling

Consolidate all Supabase access into reusable service/repository functions.

TESTING

Do not mark the task complete until these tests pass:

Inventory persists after logout/login.
Journal Entries persist after logout/login.
Chart of Creditors persists after logout/login.
Operational Scheduler persists after logout/login.
Data survives application restart.
Data survives Electron restart.
Two concurrent users remain synchronized.
Realtime updates work without page refresh.
No business data depends on browser storage.
No duplicate records are created.
No stale caches remain.
Supabase is the only permanent source of business data.
FINAL DELIVERABLE

Provide:

Root causes identified.
Files modified.
SQL migrations created.
Database changes.
RLS changes.
Realtime changes.
Authentication changes.
Persistence changes.
Performance improvements.
Tests executed and results.

Do not make cosmetic changes.

Do not redesign the interface.

Do not modify working modules.

Only change code that directly fixes the persistence, synchronization, database, authentication, and realtime architecture so the ERP becomes stable, consistent, and fully synchronized across all users and devices.