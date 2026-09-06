# FABEGON ERP – ENTERPRISE USER MANAGEMENT, PERMISSIONS, INVENTORY, SYNCHRONIZATION & DATA INTEGRITY UPDATE

Update the existing Fabegon ERP without removing any existing functionality. Improve the architecture to enterprise standards while maintaining all current modules and workflows.

The ERP must behave like a professional cloud-based enterprise resource planning system similar to SAP, Oracle NetSuite, Microsoft Dynamics 365, or Odoo, with proper Role-Based Access Control (RBAC), centralized database synchronization, audit logging, and enterprise-grade data integrity.

================================================================================
1. SUPER ADMIN PERMISSIONS
================================================================================

The Super Admin is the highest authority in the system.

The Super Admin must have unrestricted access to every module, record, user, report, configuration, and audit log.

Super Admin can:

• View every user.
• Create users.
• Edit users.
• Delete users.
• Restore users.
• Suspend users.
• Activate users.
• Reset passwords.
• Unlock accounts.
• Change user roles.
• Assign permissions.
• View login history.
• View audit logs.
• Impersonate users (optional).
• Configure the entire ERP.

Super Admin can see:

• Super Admin account
• All Admins
• Managers
• Supervisors
• Finance
• Cashiers
• Warehouse
• Procurement
• Production
• Sales
• HR
• Employees
• Every other system user.

================================================================================
2. HIDE SUPER ADMIN
================================================================================

The Super Admin account must be completely hidden from all other users.

Admins, Managers, Employees, Cashiers and every other role must NEVER see:

• Super Admin profile
• Super Admin username
• Super Admin name
• Super Admin email
• Super Admin activity
• Super Admin login history
• Super Admin reports
• Super Admin permissions

Super Admin must never appear in:

• User lists
• Employee directories
• Search results
• Dropdown selectors
• Reports
• Chat contacts
• Notifications
• Audit pages accessible by Admin
• Team lists

Only the Super Admin should be able to see the Super Admin account.

Admins should believe they are the highest visible users.

================================================================================
3. ADMIN PERMISSIONS
================================================================================

Admins have full operational control but cannot access hidden Super Admin functions.

Admins can:

• View users
• Create users
• Edit users
• Delete users
• Suspend users
• Activate users
• Reset passwords
• Manage departments
• Manage inventory
• Manage production
• Manage suppliers
• Manage customers
• Manage warehouses
• Manage reports
• Configure operational settings

Admins CANNOT:

• View Super Admin
• Modify Super Admin
• Delete Super Admin
• Change Super Admin permissions
• Permanently delete protected records
• Modify core ERP security settings

================================================================================
4. ROLE-BASED ACCESS CONTROL (RBAC)
================================================================================

Implement a secure enterprise RBAC system.

Every user must have:

• A unique User ID (UUID)
• A unique username
• One primary role (or multiple roles only if explicitly assigned)
• Department
• Branch
• Status
• Permission profile

Roles include but are not limited to:

• Super Admin
• Admin
• Finance Manager
• Accountant
• Cashier
• HR Manager
• Procurement Officer
• Warehouse Officer
• Production Manager
• Sales Manager
• Sales Representative
• Storekeeper
• Auditor
• Quality Control
• Customer Support
• Branch Manager
• Employee

Permissions must always be loaded from the database.

Never cache permissions incorrectly.

================================================================================
5. FIX ROLE MIXING BUG
================================================================================

There is currently a bug where user roles randomly change or become mixed.

Examples:

Finance Manager becomes Cashier.

Cashier becomes Procurement.

Warehouse becomes HR.

Production becomes Finance.

This MUST NEVER happen.

Implement proper RBAC validation so that:

• Roles never change automatically.
• Roles persist after login.
• Roles persist after logout.
• Roles persist after browser refresh.
• Roles persist after synchronization.
• Roles persist after application updates.
• Permissions are loaded only from the authenticated user's assigned role.
• Role changes can only be performed by an Admin or Super Admin.
• Every role change is recorded in the audit log.

================================================================================
6. USER DELETION
================================================================================

When an Admin or Super Admin deletes a user:

The account must immediately become inaccessible.

The deleted user:

• Cannot log in.
• Cannot use existing sessions.
• Cannot use saved tokens.
• Cannot use refresh tokens.
• Cannot reconnect automatically.

Immediately terminate:

• Desktop session
• Mobile session
• Browser session
• API session

Display:

"Your account has been disabled. Please contact your administrator."

Deleting a user must NEVER delete business records.

Historical records should remain.

Examples:

Invoices remain.

Sales remain.

Inventory movements remain.

Purchase Orders remain.

Production remains.

Audit logs remain.

Display:

Created by: Former User (Deleted)

instead of deleting historical ownership.

================================================================================
7. INVENTORY & WAREHOUSING
================================================================================

The Inventory module must NOT contain fixed or hardcoded inventory types.

Raw Materials

Processed Goods

Finished Products

must be database-driven.

Admins and Super Admins can create unlimited inventory categories.

Examples only:

Raw Materials

• Maize
• Rice
• Millet
• Cassava

Processed Goods

• Cleaned Rice
• Polished Millet
• Milled Maize

Finished Products

• Maize Flour
• Rice Flour
• Animal Feed
• Composite Flour

Users should be able to create unlimited custom categories.

================================================================================
8. INVENTORY CRUD
================================================================================

Admins and Super Admins must have full CRUD capabilities.

They can:

Create

Read

Update

Delete

Archive

Restore

Duplicate

Merge

Split

Transfer

Adjust

Move

Print

Export

Import

Inventory items must NEVER be fixed.

================================================================================
9. EDITABLE INVENTORY RECORDS
================================================================================

The following fields must always be editable:

Product Name

SKU

Barcode

Category

Inventory Type

Description

Supplier

Purchase Cost

Selling Price

Warehouse

Location

Storage Bin

Unit

Quantity

Minimum Stock

Maximum Stock

Reorder Level

Batch Number

Production Date

Expiry Date

Images

Attachments

Status

Notes

================================================================================
10. CATEGORY MANAGEMENT
================================================================================

Admins and Super Admins can:

Create categories

Rename categories

Delete categories

Archive categories

Restore categories

Merge categories

Assign icons

Assign colors

Create parent categories

Create child categories

No inventory classification should ever be hardcoded.

================================================================================
11. APPLY CRUD THROUGHOUT ERP
================================================================================

The same CRUD permissions must exist across:

Inventory

Warehousing

Production

Sales

CRM

Accounting

Finance

Procurement

Suppliers

Customers

Assets

Projects

Fleet

Payroll

HR

Maintenance

POS

Manufacturing

Quality Control

Reports

Documents

Settings

Admins and Super Admins should have full operational CRUD according to their permission level.

================================================================================
12. REAL-TIME SYNCHRONIZATION
================================================================================

Fabegon ERP must use one centralized database.

Every user works on the same live data.

Examples:

Cashier creates sale.

Finance immediately sees it.

Inventory immediately updates.

Reports immediately update.

Dashboards immediately refresh.

Warehouse immediately reflects stock movement.

Production immediately sees available materials.

Synchronization must occur automatically.

No manual refresh.

No manual synchronization.

================================================================================
13. CROSS-NETWORK OPERATION
================================================================================

Users may connect from:

Office

Warehouse

Factory

Home

Laptop

Desktop

Tablet

Phone

Another city

Another country

Every device connects to the same centralized ERP.

Every device receives updates automatically.

================================================================================
14. OFFLINE MODE
================================================================================

If internet is unavailable:

Users continue working.

Changes are saved locally.

Display:

Offline Mode

When internet returns:

Automatically synchronize.

No manual upload.

No duplicate records.

Notify user:

Synchronization Complete

================================================================================
15. LAST WRITE WINS
================================================================================

If two users edit the same record simultaneously:

Use Last Write Wins.

The newest saved version becomes active.

The previous version remains available in the audit history.

Notify users if another person updated the record while it was open.

================================================================================
16. DATA PERSISTENCE
================================================================================

Business data must NEVER disappear after logout.

Logging out only ends the session.

It must NEVER reset:

Inventory

Customers

Suppliers

Invoices

Sales

Purchases

Accounting

Payroll

Production

CRM

Warehouses

Reports

Dashboards

Everything remains permanently stored in the centralized database.

When users log back in, they see the latest synchronized data.

================================================================================
17. DATA CONSISTENCY
================================================================================

Prevent:

Duplicate records

Duplicate synchronization

Lost updates

Broken relationships

Corrupted inventory

Corrupted accounting

Use:

Transactions

UUIDs

Foreign key validation

Referential integrity

Conflict detection

Automatic retries

================================================================================
18. AUDIT LOG
================================================================================

Every action must be logged.

Including:

Login

Logout

Create

Edit

Delete

Restore

Archive

Role Change

Password Reset

Synchronization

Imports

Exports

Inventory Adjustment

Production Update

Financial Transactions

Record:

User

Role

Branch

Department

Date

Time

Old Value

New Value

Device

IP Address (when online)

Reason (optional)

================================================================================
19. SECURITY
================================================================================

Terminate all active sessions after user deletion.

Validate permissions on every API request.

Never rely solely on frontend permission checks.

Encrypt sensitive information.

Protect against privilege escalation.

Prevent unauthorized role changes.

================================================================================
20. ENTERPRISE REQUIREMENTS
================================================================================

Fabegon ERP must behave like a professional enterprise ERP system.

The system should provide:

• Secure Role-Based Access Control (RBAC)
• Hidden Super Admin account
• Stable user permissions
• No role switching bugs
• Real-time synchronization
• Centralized cloud database
• Cross-device synchronization
• Cross-branch synchronization
• Offline mode with automatic synchronization
• Persistent business data
• Enterprise audit logging
• Full CRUD management
• Dynamic inventory categories
• Immediate propagation of changes across all connected devices
• Last Write Wins conflict resolution
• High-performance multi-user support
• Reliable data integrity
• Accurate inventory management
• Secure authentication and authorization
• Permanent business record retention even after user deletion
• Immediate user deactivation upon deletion
• Consistent system behavior across desktops, laptops, tablets, and mobile devices.

The goal is to ensure Fabegon ERP functions as a production-ready, enterprise-grade ERP platform with robust security, reliable synchronization, stable permissions, centralized persistent data, and seamless collaboration across all users, devices, branches, and locations.