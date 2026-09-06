Build and improve Fabegon ERP into a production-ready enterprise ERP system using Supabase as the primary backend database and authentication provider. The application must behave like a true cloud ERP where all users share one centralized database and never have local-only business data. The application must support Windows desktop installations while remaining synchronized across all installed machines.

Core Data Persistence Requirements

The current issue where all data resets to zero, becomes empty, or disappears after users log out must be completely eliminated.

Implement the following:

Business data must be stored permanently in Supabase PostgreSQL.
Never store business records only in React state or browser local storage.
Logging out must only terminate the authentication session.
Logging back in must reload all saved records from Supabase.
No inventory quantities, sales, purchases, invoices, customers, suppliers, warehouse records, production records, accounting entries, users, reports, or settings may reset after logout.
Application restart must display the latest synchronized data from the database.
Data must persist indefinitely until intentionally modified or deleted by authorized personnel.
Single Source of Truth

Supabase must become the only source of truth.

Every installed copy of Fabegon ERP must connect to the same cloud database.

Therefore:

User A enters inventory.
User B immediately sees the same inventory.
User C edits inventory.
User D immediately receives the update.
Sales entered by one branch appear for every authorized user.
Purchase orders entered on one machine appear on every other machine.
Warehouse movements are identical across all users.
Production updates are identical across all users.

There must never be separate copies of data per user.

All users must view the exact same business records according to their permissions.

Real-Time Synchronization

Implement Supabase Realtime across every business table.

Changes must automatically synchronize without requiring refresh.

Synchronize:

Inventory
Warehouses
Sales
Purchase Orders
Purchase Bills
Customers
Suppliers
Production
Milling
Accounting
Payments
Invoices
Users
Reports
Notifications

Whenever one user creates, edits, approves, or deletes a record, every connected user must immediately receive the updated information.

Offline Mode with Automatic Sync

Fabegon ERP must support offline work.

If internet is unavailable:

Continue allowing authorized users to work.
Save offline changes locally in a synchronization queue.
Never discard offline changes.
Show synchronization status.

When internet returns:

Automatically upload pending transactions.
Merge changes into Supabase.
Broadcast updates through Realtime.
Every connected machine immediately reflects the synchronized data.

Offline users should never lose work.

CRUD Permissions

Implement complete Create, Read, Update and Delete functionality.

Authorized users must be able to:

Create

Inventory
Products
Warehouses
Customers
Suppliers
Sales Orders
Purchase Orders
Purchase Bills
Production Records
Users (Admins only)

Read

Everything allowed by their role.

Update

Allow editing of existing records.

Delete

Only users with permission may permanently remove records.

Editing Existing Records

Every table must support selecting an existing row.

When clicking any row, the system should:

Highlight the selected row.
Open a detailed editable form or side panel.
Allow editing of every editable field.
Save changes as a new revision awaiting approval when required.

This applies to:

Inventory Items
Sales Orders
Purchase Orders
Purchase Bills
Products
Customers
Suppliers
Warehouses
Production Records
Milling Records
Accounting Entries
Approval Workflow

Edits to critical business records must require approval.

Workflow:

Employee edits record

↓

Status changes to

Pending Approval

↓

Administrator or Super Administrator reviews changes

↓

Approve

or

Reject

Only after approval should the approved version become the live business record.

Maintain:

Original version
Edited version
Approval history
Date
User
Comments
Audit trail
Audit Trail

Track every action.

Record:

Created By
Updated By
Deleted By
Approved By
Date
Time
Previous Values
New Values
Device
IP (optional)
Action Type

Audit history cannot be deleted except by Super Administrator.

Inventory Management

Inventory records must never reset.

All inventory transactions remain permanently stored.

Support:

Raw Materials

Processed Materials

Finished Products

Warehouse Stock

Stock Transfers

Stock Adjustments

Batch Numbers

Expiry Dates

Lot Tracking

Every quantity must remain accurate after logout, restart, or software updates.

Warehouse Management

Warehouse quantities must always reflect the shared cloud data.

All warehouse movements synchronize instantly.

User Management

Roles:

Super Administrator
Administrator
Manager
Accountant
Warehouse Officer
Sales Officer
Production Officer
Cashier
Read Only User

Permissions must be role-based.

User Suspension

If Administrator or Super Administrator suspends a user:

User account becomes inactive.
Login immediately fails.
Existing sessions are terminated.
API access is revoked.
Protected pages become inaccessible.
User Deletion

If Administrator or Super Administrator deletes a user:

User is permanently removed from authentication and profile records according to system policy.
All active sessions are revoked immediately.
Login credentials become invalid.
User can no longer access the ERP.
Deleted users cannot continue using an already-installed copy.
Permission checks must occur on every authenticated request.
Every machine must recognize the deletion immediately.
Session Management

Logging out should only:

Remove authentication token.
End the session.
Return to Login.

Logging out must never:

Delete business data.
Reset inventory.
Reset accounting.
Reset warehouse.
Reset sales.
Reset purchases.
Reset reports.
Reset production.

Business data belongs to the company database, not to an individual login session.

Data Integrity

Implement database constraints to prevent:

Negative stock

Duplicate invoices

Duplicate purchase numbers

Duplicate inventory IDs

Duplicate warehouse IDs

Invalid foreign keys

Orphan records

Broken relationships

Conflict Resolution

When two users edit simultaneously:

Lock records where appropriate, or
Detect conflicts and present differences for approval before applying changes.

Do not silently overwrite approved data.

Database Transactions

Critical operations must use transactions.

Examples:

Sales

Inventory deduction

Invoice generation

Accounting journal

Payment posting

Goods received

Production completion

Either all related records save successfully, or none do.

Security

Use Supabase Row Level Security (RLS).

All API requests must validate:

Authentication
Role
Permission
Company access

Never trust client-side permissions alone.

Performance

Implement:

Pagination
Indexed database queries
Lazy loading
Optimistic UI updates
Background synchronization
Realtime subscriptions
Query caching with automatic invalidation after updates
Reliability

Fabegon ERP must behave like enterprise software.

Business data must:

Never disappear.
Never reset to zero after login.
Never revert after logout.
Never be lost after restarting the application.
Always reload from Supabase.
Always synchronize across every installed machine.
Remain consistent for all authorized users.
Reflect approved changes across all clients in real time.
Support offline work with automatic synchronization once connectivity is restored.

The final system should function as a true cloud-connected ERP with persistent shared company data, centralized storage in Supabase, secure role-based access control, approval workflows for sensitive changes, comprehensive audit trails, immediate account revocation for suspended or deleted users, and reliable synchronization across all desktop installations.