PROMPT
You are a senior React + TypeScript + Supabase ERP architect.
I am building Fabegon ERP.
The Inventory and Warehouse module is partially working but currently has problems:
•	Cannot insert new inventory items. 
•	Supabase rejects inserts because the table schema does not match the React code. 
•	Some columns are missing. 
•	Warehouse information is incomplete. 
•	Inventory quantities do not sync correctly. 
•	Realtime updates sometimes fail. 
•	Different users should see exactly the same inventory instantly. 
•	Offline queue should continue working. 
•	No data should ever disappear after logout. 
•	The database schema must exactly match the React interfaces. 
I want you to completely rebuild the Inventory and Warehouse module.
________________________________________
Inventory screen
The inventory page must match this layout:
Top summary cards
•	Total Inventory Value 
•	Total Items 
•	Low Stock Items 
•	Warehouses 
Below the cards
Search box
Filters
•	Warehouse 
•	Category 
•	Status 
Buttons
•	Add Item 
•	Export 
•	Refresh 
Main table columns
SKU
Item Name
Category
Warehouse
Quantity
Unit
Cost Price
Selling Price
Minimum Stock
Maximum Stock
Reorder Level
Batch Number
Expiry Date
Supplier
Status
Description
Approval Status
Created Date
Updated Date
Actions
________________________________________
Add Item Form
The Add Item modal must contain
Item Name
SKU
Category
Warehouse
Quantity
Unit
Cost Price
Selling Price
Minimum Quantity
Maximum Quantity
Reorder Level
Batch Number
Expiry Date
Supplier
Status
Description
Approval Status
Every field must save correctly.
No field should be ignored.
________________________________________
Warehouse Module
Create a proper warehouse system.
Warehouse table
Warehouse Name
Warehouse Code
Location
Manager
Phone
Capacity
Status
Description
Each inventory item belongs to one warehouse.
Warehouse totals should calculate automatically.
________________________________________
Categories
Allow categories such as
Raw Materials
Processed Materials
Finished Goods
Packaging
Consumables
Maintenance
Office Supplies
Other
Categories must be editable.
________________________________________
Inventory Status
Available
Low Stock
Out of Stock
Reserved
Damaged
Expired
Pending Approval
Inactive
Status updates automatically depending on stock.
________________________________________
Inventory Calculations
Automatically calculate
Inventory Value
Quantity × Cost Price
Potential Sales Value
Quantity × Selling Price
Profit
Selling Price − Cost Price
Low Stock
Quantity <= Minimum Quantity
Out of Stock
Quantity = 0
Overstock
Quantity > Maximum Quantity
________________________________________
Database
Completely rebuild the Supabase tables.
The SQL schema must exactly match every property used inside the React interface.
Do not omit any column.
Do not rename any property.
Do not create columns that React does not use.
Every column used in TypeScript must exist in Supabase.
All data types must match.
The SQL should support:
Insert
Update
Delete
Realtime
Offline Queue
Upsert
Last Write Wins
________________________________________
Relationships
Inventory Items
→ Warehouse
Inventory Items
→ Supplier
Inventory Items
→ Category
Use foreign keys where appropriate.
________________________________________
Realtime
Enable Supabase realtime.
When one user adds an item
Every connected user instantly sees it.
No refresh required.
When edited
Everyone sees changes immediately.
When deleted
Everyone loses it immediately.
________________________________________
Offline Mode
Current offline queue must remain.
If internet is unavailable
Save locally.
When internet returns
Automatically sync.
No duplicates.
No lost records.
No conflicts.
Use last write wins.
________________________________________
Validation
Do not allow:
Negative quantities
Negative prices
Empty item names
Duplicate SKU numbers
Invalid warehouse
Invalid category
________________________________________
CRUD
Every operation must work.
Add
Edit
Delete
Approve
Reject
Search
Filter
Sort
Export
Import
Realtime Update
Offline Queue
________________________________________
Security
Enable Row Level Security.
Authenticated users can:
Read inventory
Insert inventory
Update inventory
Delete inventory
Admins can approve pending changes.
________________________________________
Performance
Use indexes on
SKU
Warehouse
Category
Status
Supplier
Created Date
Realtime should remain fast with over 100,000 inventory records.
________________________________________
Compatibility
The SQL schema MUST exactly match my React code.
The following React properties MUST exist:
id

name

sku

category

warehouse

qty

minQty

maxQty

unit

cost

price

reorder

batchNumber

status

expiry

supplier

description

approvalStatus

pendingChange
Map them correctly to SQL columns.
Example
minQty -> min_qty

maxQty -> max_qty

batchNumber -> batch_number

approvalStatus -> approval_status

pendingChange -> pending_change
Do NOT miss any mapping.
________________________________________
Fix Existing Problems
Fix every issue causing Supabase to reject inserts.
Fix missing columns.
Fix incorrect column names.
Fix wrong data types.
Fix NOT NULL violations.
Fix JSON column definitions.
Fix realtime subscriptions.
Fix warehouse relationships.
Fix inventory calculations.
Fix approval workflow.
Fix offline synchronization.
Fix React mapping functions.
Fix optimistic updates.
Fix refresh after save.
Fix insert failures.
Fix update failures.
Fix delete failures.
________________________________________
Final Output Required
Produce:
1.	Complete Supabase SQL schema 
2.	Foreign keys 
3.	Indexes 
4.	RLS policies 
5.	Realtime setup 
6.	Storage triggers if needed 
7.	Correct TypeScript interfaces 
8.	Correct React mapping functions 
9.	Correct add/update/delete code 
10.	Working Inventory page 
11.	Working Warehouse page 
12.	Zero TypeScript errors 
13.	Zero Supabase insert errors 
14.	Zero missing columns 
15.	Fully working CRUD 
16.	Fully working realtime synchronization 
17.	Fully working offline queue 
18.	Production-ready enterprise inventory and warehouse module compatible with the rest of the Fabegon ERP system. 

