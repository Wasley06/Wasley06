Improve Fabegon ERP so that the Figma Make version, GitHub repository, and Windows installer are always identical. The application must behave like a production ERP where every build is generated from the latest source code and all installations connect to the same Supabase project.

Primary Issue

Currently:

Changes appear inside Figma Make.
Changes do not appear in the installer after pushing to GitHub.
Desktop installer behaves differently from the Figma Make version.
Some features exist in one version but not the other.

This must be completely eliminated.

Single Source of Truth

The project must have only one source code.

Every deployment must come from exactly the same codebase.

The following must always match:

Figma Make
GitHub Repository
Production Build
Windows Installer
Desktop Application

There must never be multiple versions running simultaneously.

Build Pipeline

Configure a proper production pipeline.

Workflow:

Figma Make

↓

Latest source code

↓

GitHub Repository

↓

Automatic Build

↓

Production Bundle

↓

Installer

↓

Desktop Application

Every installer must always be generated from the latest GitHub commit.

GitHub Synchronization

Ensure every change made in Figma Make is committed to GitHub before creating installers.

The build process must verify:

No uncommitted files.
No stale build artifacts.
No cached production assets.
Latest commit is checked out.
Latest dependencies are installed.
Latest production build is generated.
Production Build

Before packaging:

Always execute a clean build.

Delete previous:

dist
build
cache
temporary files

Then rebuild everything from scratch.

Never package an old build.

Environment Variables

Ensure every environment uses the same configuration.

The following must always match between:

Figma Make
GitHub Actions
Local Development
Production Installer

Variables:

VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
Application Name
API Endpoints

Never hardcode different values.

Supabase Connection

All versions must connect to the same Supabase project.

Verify:

Same URL
Same API key
Same database
Same authentication
Same Realtime subscriptions

No version may connect to a different database.

Cached Assets

Disable stale cached frontend assets.

Whenever a new version is installed:

Clear outdated cached JavaScript.
Load newest assets.
Load newest CSS.
Load newest application bundle.

The installer should never continue using an old interface.

Automatic Versioning

Each build should automatically generate:

Application Version

Build Number

Git Commit Hash

Build Date

Display these in:

Settings → About

Example:

Version 1.2.5

Commit

a7d2e81

Built

26 July 2026

This allows verification that the installer matches GitHub.

Build Verification

Before packaging:

Verify:

Build succeeded.
No TypeScript errors.
No missing assets.
No missing routes.
No missing icons.
No failed imports.
No unresolved dependencies.

Stop packaging if verification fails.

Database Consistency

Regardless of where the application runs:

Desktop
Browser
Another machine

All users must retrieve exactly the same data from Supabase.

Never initialize modules with empty data when records already exist.

Data Persistence

Fix every module so data remains permanently stored.

Logging out must never:

Delete inventory.
Delete suppliers.
Delete customers.
Delete purchases.
Delete accounting.
Delete warehouse balances.
Reset reports.
Reset production.
Reset dashboard statistics.

Logging out only ends the authentication session.

Real-Time Synchronization

Every client must subscribe to Supabase Realtime.

Whenever a user:

Creates

Updates

Deletes

Approves

a record,

all connected clients should update automatically without refreshing.

Synchronize:

Inventory
Warehouses
Suppliers
Customers
Sales
Purchases
Production
Accounting
Reports
User Profiles
Notifications
Offline Synchronization

Support offline mode.

When offline:

Save changes locally in a synchronization queue.
Display Offline status.
Preserve every transaction.

When online:

Automatically synchronize pending changes.
Resolve conflicts safely.
Notify users after synchronization.
Installer

The installer must always package:

Latest production build.

Latest assets.

Latest database configuration.

Latest UI.

Latest business logic.

Never include stale files.

Auto Update

Implement application update detection.

When a newer GitHub release exists:

Notify users.
Allow one-click update.
Preserve local settings.
Preserve authentication.
Preserve cached offline queue.
Diagnostics

Create an internal diagnostics page showing:

Current Version
Git Commit
Build Date
Supabase URL
Connection Status
Realtime Status
Database Status
Sync Queue Status
Last Synchronization Time
Current User
User Role

This allows administrators to verify that every installation is running the same release.

Final Expected Result

After these improvements:

Figma Make, GitHub, and the desktop installer always run the same codebase.
Every installer is built from the latest GitHub commit.
All installations connect to the same Supabase project.
No stale builds or cached assets remain after updates.
Business data persists permanently in Supabase.
Logging out only ends the session and never resets company data.
All connected users see the same synchronized information in real time.
Offline work synchronizes automatically when connectivity is restored.
Administrators can verify the installed version and build information from within the application.
Fabegon ERP behaves as a production-grade, enterprise ERP with a reliable build pipeline, consistent deployments, and permanent cloud-backed data.