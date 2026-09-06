You are a senior Enterprise Software Architect specializing in React, TypeScript, Supabase, PostgreSQL, Realtime, Distributed Systems, and ERP software.

Upgrade my existing Fabegon ERP into a fully synchronized enterprise ERP where every connected user sees data changes instantly without refreshing the page, logging out, or logging back in.

This must behave like Google Docs, Microsoft Teams, WhatsApp Web, or Microsoft Dynamics 365 where changes appear live across every connected device.

Main Goal

Implement true real-time synchronization across the entire ERP.

If User A enters data...

Within less than one second...

Users B, C, D, E... immediately see the new data appear.

No page refresh.

No logout.

No login again.

No manual refresh button.

Everything updates automatically.

Modules that MUST Sync

Inventory

Warehouses

Suppliers

Customers

Sales Orders

Purchase Orders

Invoices

Payments

Creditors

Debtors

Production

Manufacturing

Recipes

Employees

Payroll

Attendance

CRM

Leads

Accounting

Journal Entries

Expenses

Income

Approvals

Notifications

Dashboard statistics

Reports

Audit Logs

System Settings

User Management

Everything inside the ERP must synchronize in real time.

Real-Time Behaviour

Whenever a user:

Creates a record

Updates a record

Deletes a record

Approves a record

Rejects a record

Changes stock

Transfers inventory

Posts accounting entries

Creates production batches

Receives payments

Changes settings

Creates warehouses

Creates suppliers

Registers customers

Changes employee information

Every connected user must immediately receive those changes.

No Manual Refresh

Remove any requirement to:

Reload browser

Refresh page

Logout

Login again

Navigate away and back

Data should automatically appear.

Live Dashboard

Dashboard cards should update instantly.

Examples:

Inventory Value

Total Products

Total Sales

Outstanding Creditors

Outstanding Debtors

Cash Balance

Warehouse Totals

Production Totals

Sales Today

Purchases Today

Employees

Notifications

No page reload.

Live Inventory

If User A changes

Quantity

Warehouse

Supplier

Status

Cost Price

Selling Price

Expiry

Batch Number

Minimum Quantity

Maximum Quantity

Reorder Level

Every connected user instantly sees the updated row.

Live Warehouse

Warehouse stock updates instantly.

Warehouse totals update instantly.

Capacity updates instantly.

Transfers between warehouses appear immediately.

Live Sales

Creating a sales order should instantly:

Reduce stock

Update dashboard

Update accounting

Update reports

Notify other users

Appear on all computers immediately.

Live Purchases

Purchase Orders should:

Increase stock instantly

Update supplier balances

Update inventory valuation

Update accounting

Update warehouse totals

Appear instantly to everyone.

Live Production

When production starts:

Everyone sees status

Running

Completed

Paused

Cancelled

Finished products increase immediately.

Raw materials reduce immediately.

Live CRM

When a customer is added:

Everyone sees it immediately.

Same for:

Leads

Clients

Suppliers

Contacts

User Presence

Show currently online users.

Display

Green dot

Online

Offline

Last Active

Currently Editing

Typing

Viewing Module

Similar to Google Docs.

Record Locking

Prevent two users editing the same record simultaneously.

If User A edits Inventory Item A

User B sees

"Currently being edited by John"

Allow

Read only

Take Over (Super Admin only)

Conflict Resolution

If two users edit simultaneously:

Use Last Write Wins.

Show notification.

Keep audit history.

Never corrupt data.

Notifications

When data changes

Show live notifications.

Examples

Inventory updated by John

Purchase Order Approved

Sales Order Created

Stock transferred

Supplier Added

Employee Created

Invoice Paid

Production Completed

All users receive notifications instantly.

Offline Support

If internet disconnects

Continue working.

Store changes locally.

When internet returns

Automatically synchronize.

No duplicates.

No missing records.

No lost edits.

Use intelligent merge.

Last Write Wins.

Reconnection

When reconnecting

Automatically

Reconnect Supabase Realtime.

Restore subscriptions.

Synchronize missing records.

No duplicate subscriptions.

Database

Use Supabase Realtime.

Enable realtime for every ERP table.

Create publication for all ERP tables.

Use PostgreSQL logical replication.

Subscribe to

INSERT

UPDATE

DELETE

Automatically update React state.

Do not poll the database.

Do not require refresh.

React Requirements

Use:

Supabase Realtime Channels

React Context

Optimistic UI

Automatic cache updates

Automatic invalidation

Automatic resubscription

Automatic reconnect

Automatic synchronization

Use immutable state updates.

Prevent duplicate records.

Prevent memory leaks.

Prevent race conditions.

Prevent stale state.

Performance

Support

100+

Concurrent users

100,000+

Inventory records

Millions of transactions

Realtime updates under one second.

No unnecessary re-renders.

Virtualize tables.

Only update changed rows.

Security

Respect Row Level Security.

Only authorized users receive permitted data.

Never leak data across companies.

Maintain authentication during realtime subscriptions.

Audit Trail

Every change records:

User

Date

Time

Old Value

New Value

Computer

IP

Action

Module

Never lose audit history.

Reliability

The ERP must continue functioning if:

Internet disconnects

Supabase reconnects

Browser refreshes

Computer sleeps

Server restarts

User signs back in

Realtime subscriptions must automatically recover.

Final Result

The completed ERP should behave like a professional enterprise system similar to:

SAP Business One
Oracle NetSuite
Microsoft Dynamics 365
Odoo Enterprise

Every action performed by one user must be visible to every other connected user in real time across all computers, without refreshing the page, signing out, or signing back in. The system must maintain full data consistency, support offline synchronization, prevent duplicate records, enforce role-based security, and provide reliable enterprise-grade real-time synchronization throughout the entire Fabegon ERP.