Improve Fabegon ERP to production quality by fixing the remaining issues with authentication, role management, administration, inventory editing, and data consistency. The system must use Supabase Authentication, Supabase PostgreSQL, Row Level Security (RLS), and Supabase Realtime while maintaining one centralized database shared across all installed clients.
________________________________________
1. Fix Users Not Appearing in Administration
Currently users can successfully log into the ERP but do not appear in the Administration → Users section.
Fix this immediately.
Requirements:
•	Every authenticated user must automatically have a corresponding profile record. 
•	Users table must always synchronize with Supabase Auth. 
•	The Administration → Users page must display every active user. 
•	Never rely only on Supabase Auth. 
•	Maintain a profiles (or equivalent) table linked to the authentication user ID. 
•	If a profile record is missing, create it automatically during first login. 
•	Existing users without profiles should be repaired through a migration. 
•	The Users page should never appear empty if users exist. 
Display:
•	Full Name 
•	Username 
•	Department 
•	Role 
•	Status 
•	Last Login 
•	Date Created 
________________________________________
2. Fix First Installation Role Mix-Up
Currently, after a fresh installation, user roles become mixed or assigned incorrectly.
Fix this completely.
Requirements:
•	Every user has exactly one role. 
•	Roles cannot randomly change. 
•	Roles must be stored only in the database. 
•	Never determine permissions from cached values. 
•	Always load the role from Supabase after login. 
•	Refresh permissions after login. 
•	Refresh permissions after role updates. 
•	Prevent duplicate role assignments. 
•	Validate roles on every authenticated request. 
Roles:
•	Super Admin 
•	Admin 
•	Finance Manager 
•	storekeeper
•	Sales rep
•	Cashier 
•	Hr manager 
Each role must only receive its assigned permissions.
________________________________________
3. Super Admin Must See Everything
Currently the Super Admin sees less information than normal users.
This is incorrect.
Fix immediately.
The Super Admin must always have unrestricted access.
The Super Admin must be able to view:
•	Inventory 
•	Warehouses 
•	Customers 
•	Suppliers 
•	Sales 
•	Purchase Orders 
•	Purchase Bills 
•	Production 
•	Milling 
•	Accounting 
•	Reports 
•	Audit Logs 
•	Users 
•	Settings 
•	Dashboards 
If another user can see data, the Super Admin must also see it.
No RLS policy should accidentally block the Super Admin from viewing company records.
________________________________________
4. Super Admin Hidden From Normal Users
Normal users should never see the Super Admin account.
Rules:
Super Admin can see:
•	Everyone 
Admins can see:
•	Admins 
•	Managers 
•	Staff 
Normal users can see:
•	Their own profile only 
The Super Admin account must remain hidden from all non-super-admin users.
________________________________________
5. Remove Default Users
Remove every sample, demo, or previously created account except the Super Admin.
After cleanup:
Only one account should exist:
•	Super Admin 
No default:
•	Admin 
•	Finance Manager 
•	storekeeper
•	Sales rep
•	Cashier 
•	Hr manager 
The system starts with only one active account.
________________________________________
6. Only Super Admin and Admin Can Create Users
Remove self-registration entirely.
Disable:
•	Sign Up 
•	Register 
•	Create Account 
Only:
•	Super Admin 
•	Admin 
may create new users.
Creating a user should:
•	Create Supabase Auth account 
•	Create profile 
•	Assign role 
•	Assign permissions 
•	Assign branch 
•	Assign department 
•	Generate employee ID 
•	Send password reset or activation email (optional) 
Users cannot create themselves.
________________________________________
7. Administration Dashboard Counts
Administration should automatically display counts.
Examples:
Super Admin
•	Total Users 
•	Active Users 
•	Suspended Users 
•	Admins 
•	Managers 
•	Warehouse Officers 
•	Sales Officers 
•	Production Staff 
•	Accountants 
•	Cashiers 
Clicking each category should filter users accordingly.
________________________________________
8. Inventory Editing
Currently inventory records can be created but cannot properly be edited.
Implement full editing.
Requirements:
Selecting an inventory row should:
•	Highlight it 
•	Open editable form 
•	Allow editing every field 
•	Save changes 
•	Refresh immediately 
•	Sync to every machine 
Editable fields include:
•	Product Name 
•	SKU 
•	Category 
•	Warehouse 
•	Quantity 
•	Unit 
•	Cost 
•	Selling Price 
•	Minimum Stock 
•	Maximum Stock 
•	Batch Number 
•	Expiry Date 
•	Supplier 
•	Description 
________________________________________
9. Inventory Delete
Authorized users should be able to delete inventory.
Workflow:
Select Item
↓
Delete
↓
Confirmation Dialog
↓
Soft Delete or Permanent Delete (according to permissions)
↓
Realtime synchronization
Only:
•	Super Admin 
•	Admin 
may permanently delete inventory.
________________________________________
10. Inventory Approval Workflow
Edits should require approval.
Workflow
Warehouse edits inventory
↓
Status becomes
Pending Approval
↓
Admin reviews
↓
Approve
↓
Changes become live
or
Reject
↓
Previous version remains active
Maintain complete revision history.
________________________________________
11. CRUD for All Business Records
Every business module must support:
Create
Read
Update
Delete
Including:
Inventory
Warehouses
Customers
Suppliers
Sales Orders
Purchase Orders
Purchase Bills
Invoices
Production
Accounting
Employees
Assets
Settings
________________________________________
12. Data Synchronization
All edits must synchronize automatically.
When User A edits inventory:
Every connected machine should immediately update.
No manual refresh.
Use Supabase Realtime.
________________________________________
13. Permanent Data
Logging out must never:
•	Delete inventory 
•	Delete customers 
•	Delete warehouses 
•	Delete accounting 
•	Reset stock 
•	Reset reports 
Logout only removes the authentication session.
All business data must reload from Supabase on the next login.
________________________________________
14. Fix RLS Policies
Review every Row Level Security policy.
Ensure:
•	Super Admin bypasses normal restrictions. 
•	Admin has appropriate administrative access. 
•	Users can only access records permitted by their role. 
•	User profiles remain visible according to role rules. 
•	Inventory, sales, purchases, warehouses, and accounting are accessible according to permissions. 
•	Policies do not accidentally hide valid records from Super Admin. 
________________________________________
15. Final Expected Behavior
After implementing these fixes:
•	The ERP starts with only one Super Admin account. 
•	Only Super Admin and Admin can create, edit, suspend, or delete users. 
•	Every authenticated user automatically appears in Administration → Users. 
•	Roles remain correct and never change unexpectedly. 
•	Super Admin can view all company data across every module. 
•	Normal users cannot view the Super Admin account. 
•	Administration dashboards correctly display user counts by role. 
•	Inventory items can be selected, edited, saved, approved, or deleted according to permissions. 
•	Every approved change synchronizes instantly across all installed clients through Supabase Realtime. 
•	Logging out only ends the session; all company data remains permanently stored in Supabase and is available to authorized users on every machine after the next login. 
•	The ERP behaves as a secure, enterprise-grade multi-user system with centralized cloud data, consistent role management, and reliable administrative controls.

