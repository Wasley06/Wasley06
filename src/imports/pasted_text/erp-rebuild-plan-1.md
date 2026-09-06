FABEGON ERP – COMPLETE PERSISTENCE & REALTIME ARCHITECTURE REBUILD (NO PATCHES)

You are the Lead ERP Architect responsible for permanently fixing the Fabegon ERP data layer.

This is NOT a bug-fixing exercise.

This is a complete architectural rebuild of the persistence, synchronization, realtime, authentication, and initialization systems.

Do not patch.

Do not hardcode.

Do not create temporary fixes.

Find the root cause and permanently eliminate it.

PRIMARY OBJECTIVE

The following modules all suffer from the same architectural problem:

Inventory
Journal Entries
Chart of Creditors
Operational Scheduler

Currently these modules appear to save data while logged in, but after logout/login or reopening the application the data is lost or not displayed.

This behavior must be permanently eliminated.

SINGLE SOURCE OF TRUTH

Supabase must become the ONLY authoritative source of business data.

React State is temporary UI state only.

Browser storage must never permanently store business data.

Remove every permanent business-data cache from:

localStorage
sessionStorage
IndexedDB snapshots
fallback arrays
demo data
mock data

The only acceptable permanent storage for business records is Supabase.

INVENTORY

Refactor Inventory so that:

Saving an item performs:

Validate

↓

Insert/Update Supabase

↓

Wait for successful database response

↓

Refresh Inventory from Supabase

↓

Broadcast realtime event

↓

Refresh every connected client

Never update the UI before Supabase confirms success.

Logging out must never remove inventory.

Refreshing the application must always reload inventory from Supabase.

Inventory must automatically synchronize across all users in realtime.

Inventory must never rely on browser storage after successful synchronization.

JOURNAL ENTRIES

Completely redesign the Journal system.

Journal Entries must NOT be manually maintained.

They must be generated automatically from ERP transactions.

Automatically create journal entries for:

Sales

Purchases

Inventory Adjustments

Production

Payroll

Supplier Payments

Customer Receipts

Expenses

Transfers

Stock Movements

Returns

Corrections

Every Journal Entry must contain:

Unique Journal Number

Date

Time

Module

Transaction Reference

Narration

Debit

Credit

Created By

Audit Reference

Status

Linked Transaction ID

Every journal entry must be stored permanently in Supabase.

Logging out must never remove journal entries.

Realtime synchronization must immediately update every user.

CHART OF CREDITORS

Completely automate the Chart of Creditors.

Whenever a supplier or purchase transaction is created:

Automatically create or update the creditor.

Never duplicate creditors.

Automatically calculate balances.

Automatically update outstanding amounts.

Allow:

Create

Edit

Archive

Delete (with validation)

Every change must immediately synchronize through Supabase Realtime.

Logging out must never remove creditors.

After login all creditors must reload directly from Supabase.

Never from cached arrays.

OPERATIONAL SCHEDULER

Convert the scheduler into a live ERP Operations Timeline.

Automatically generate events from:

Inventory

Sales

Purchases

Finance

Production

CRM

HR

Administration

Journal Entries

Every ERP action automatically creates a scheduler event.

Examples:

Inventory Added

Inventory Updated

Purchase Approved

Supplier Added

Journal Posted

Invoice Created

Payment Received

Production Started

Production Finished

User Created

Role Changed

Every event contains:

Timestamp

Module

Reference Number

User

Description

Priority

Status

Linked Transaction

Users must be able to browse:

Today

Yesterday

Last 7 Days

Last Month

Specific Date

Every event links directly back to the originating transaction.

All scheduler events are permanently stored in Supabase.

Realtime updates must appear instantly on every connected device.

AUTHENTICATION

Logging out must ONLY terminate authentication.

Never clear business data.

Never delete cached business records.

Never clear React state until fresh data has been successfully reloaded after the next login.

APPLICATION STARTUP

On application startup:

Check authentication.

If authenticated:

Load every business module directly from Supabase.

Inventory

Journal Entries

Chart of Creditors

Operational Scheduler

Sales

Purchases

CRM

Production

HR

Administration

Do not initialize from browser storage.

Do not initialize from demo data.

Do not initialize from fallback arrays.

REALTIME

Enable realtime synchronization for:

Inventory

Journal

Creditors

Scheduler

Sales

Purchases

Suppliers

Customers

Production

Users

Listen for:

INSERT

UPDATE

DELETE

Refresh affected module automatically.

Avoid duplicate subscriptions.

Dispose listeners correctly.

No page refresh should ever be required.

BUILD & CACHE

Before every production build:

Delete build artifacts.

Delete Vite cache.

Delete Electron cache.

Delete browser cache references.

Delete stale assets.

Delete old JavaScript bundles.

Delete old CSS bundles.

Delete previous installer resources.

Verify the packaged application contains only the newest source code.

VALIDATION

Every save operation must:

Validate required fields.

Prevent duplicate records.

Display meaningful errors.

Retry transient failures.

Rollback incomplete transactions where appropriate.

Never silently fail.

TESTING

The work is not complete until all of the following pass successfully:

Inventory persists after logout/login.

Journal Entries persist after logout/login.

Chart of Creditors persists after logout/login.

Operational Scheduler persists after logout/login.

Closing and reopening the application preserves all records.

Fresh installer loads the latest code and latest data.

Two users editing simultaneously remain synchronized.

Realtime updates work without refresh.

No module depends on browser storage for permanent data.

No stale cache remains.

No duplicate records are created.

No disappearing records occur.

No demo or mock data is loaded.

Supabase is the only permanent data source.

FINAL DELIVERABLE

Produce a detailed implementation report including:

Root causes found.
Every file modified.
Every cache removed.
Every Supabase query corrected.
Every realtime subscription implemented.
Every authentication change.
Every persistence change.
Every database interaction audited.
Every automated test executed.

Do not mark the work complete until all modules have been verified to persist data correctly across logout, login, application restart, and multiple concurrent users.