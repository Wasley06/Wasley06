COMPLETE FABEGON ERP SYSTEM OVERHAUL (NO PATCHES, ROOT CAUSE FIXES ONLY)

You are the Lead Software Architect, Senior Full Stack Engineer, Database Architect, DevOps Engineer, QA Engineer, and Security Engineer for Fabegon ERP.

Your objective is NOT to patch bugs.

Your objective is to completely rebuild and refactor the system architecture wherever necessary to permanently eliminate recurring errors.

Critical Requirement

Do NOT apply temporary fixes.

Do NOT hardcode values.

Do NOT use workarounds.

Do NOT disable features to hide bugs.

Find the ROOT CAUSE of every issue and permanently solve it.

Before changing any code:

Audit the entire codebase.
Audit every React component.
Audit every Supabase query.
Audit every database table.
Audit every RLS policy.
Audit every API call.
Audit every authentication flow.
Audit every cache.
Audit every localStorage usage.
Audit every realtime subscription.

Generate a dependency map showing how every module communicates before modifying anything.

INSTALLER PROBLEM (HIGHEST PRIORITY)

The generated installer repeatedly installs an older version of the application instead of the newest code.

The Figma Make preview also sometimes reverts to older application state and old logic.

Find the exact root cause.

Possible causes to investigate include but are not limited to:

stale build cache
Vite cache
Electron cache
service workers
browser cache
localStorage
IndexedDB
build artifacts
dist folder reuse
GitHub Actions cache
npm cache
package-lock inconsistencies
node_modules corruption
version numbering
auto updater
installer packaging
release pipeline
Electron resources
production bundle
preload scripts
old assets copied during build

Do not assume.

Verify.

After fixing:

Every installer MUST always contain the newest code.

Every production build MUST exactly match the latest source code.

Every Figma Make preview MUST render the newest version.

No build should ever restore previous application state.

REMOVE ALL DEMO DATA

Search entire project for

demo data

mock data

seed data

placeholder data

fallback arrays

default arrays

sample objects

temporary users

hardcoded inventory

hardcoded customers

hardcoded suppliers

hardcoded finance

test credentials

Remove them.

Production should load only from Supabase.

COMPLETE SUPABASE REBUILD

Audit every table.

Audit every relationship.

Audit every foreign key.

Audit every primary key.

Audit every index.

Audit every constraint.

Audit every trigger.

Audit every RLS policy.

Audit every function.

Audit every realtime publication.

Fix every inconsistency.

No table should reject valid inserts.

No missing column should crash forms.

No foreign key should silently fail.

No write should disappear.

Every transaction must succeed or rollback cleanly.

PERMANENT DATA PERSISTENCE

Current issue:

Users log out.

Data disappears.

After login data is gone.

This must NEVER happen.

Logging out should ONLY

terminate authentication
clear authentication tokens

Logging out must NEVER

delete inventory
delete sales
delete suppliers
delete journal entries
delete finance
delete scheduler
clear Supabase tables
reset state permanently

Every page must reload directly from Supabase after login.

Never from local arrays.

Never from temporary state.

GLOBAL SYNCHRONIZATION

Every change made by any user must instantly synchronize across

Inventory

Sales

Finance

CRM

Production

Procurement

Warehouse

HR

Administration

Reports

Scheduler

No refresh.

No logout.

No manual reload.

Use Supabase Realtime correctly.

OFFLINE SUPPORT

If internet disappears

save changes locally

queue transactions

sync automatically when internet returns

resolve conflicts safely

never lose data

INVENTORY COMPLETE REDESIGN

Inventory UI should match Sales Management.

Use identical

spacing

table

filters

toolbar

buttons

search

pagination

responsive layout

bulk actions

keyboard shortcuts

Modern professional ERP appearance.

INVENTORY FORM

Automatically generate

SKU

Item Code

Barcode

Batch Number

Reference Number

Created Date

Modified Date

Created By

Warehouse

Status

Default Units

Default Category

Do not require user to manually enter generated fields.

Missing optional columns should automatically receive defaults.

No insert should fail due to optional fields.

FINANCE

Automatically create creditors whenever suppliers or purchase transactions are created.

Creditors should automatically update balances.

Allow manual

create

edit

archive

delete (with validation)

Never duplicate creditors.

AUTOMATIC JOURNAL ENGINE

Every transaction in every module must automatically create journal entries.

Examples:

Sales

Purchases

Inventory

Production

Payroll

Expenses

Receipts

Payments

Transfers

Stock Adjustments

Returns

Corrections

Every journal entry should include

Date

Time

Reference

Module

User

Debit

Credit

Narration

Linked Transaction

Audit ID

No manual journal posting.

OPERATIONAL SCHEDULER

Turn scheduler into a live ERP operations timeline.

Automatically capture events from every module.

Allow users to view

Today

Yesterday

Last Week

Last Month

Specific Date

Every event links back to its source transaction.

COMPLETE AUDIT LOG

Every action must record

User

Role

Computer

Timestamp

Before

After

Module

Transaction

IP

Reason

Nothing should disappear.

Soft delete whenever possible.

PERMISSIONS

Rebuild permissions from database.

Super Admin

Admin

Manager

Supervisor

Staff

Viewer

Permissions must never randomly switch.

Role changes must instantly synchronize.

Users should only see modules they are authorized to access.

ERROR HANDLING

No silent failures.

Every database call must

retry

log

rollback if necessary

display meaningful errors

recover gracefully

PERFORMANCE

Optimize

queries

joins

indexes

React rendering

realtime listeners

bundle size

lazy loading

pagination

virtualized tables

Remove duplicate queries.

CODE QUALITY

Refactor duplicated logic.

Create reusable services.

Centralize

Supabase

Authentication

Permissions

Realtime

Notifications

Logging

Validation

Caching

API layer

Use TypeScript best practices.

BUILD SYSTEM

Completely rebuild production pipeline.

Every build must

delete previous build

clear caches

generate fresh assets

increment version

verify latest commit

package installer

verify installer contents

verify assets

verify Electron bundle

verify production database configuration

No stale builds.

No old JavaScript bundles.

No old CSS.

No cached assets.

AUTOMATED TESTING

Before marking work complete

Run

Unit Tests

Integration Tests

Database Tests

Realtime Tests

Authentication Tests

Permission Tests

CRUD Tests

Offline Tests

Synchronization Tests

Build Tests

Installer Tests

Regression Tests

Stress Tests

Multi-user Tests

Run every test multiple times.

Fix every failure before continuing.

FINAL VERIFICATION

Do not stop until all of the following are verified:

✓ Logging out never deletes business data

✓ Installer always contains newest source code

✓ Figma Make preview always shows latest code

✓ Supabase writes are permanent

✓ Realtime synchronization works

✓ Inventory never rejects inserts

✓ Journal entries generate automatically

✓ Creditors generate automatically

✓ Scheduler records all events

✓ Roles never switch unexpectedly

✓ Permissions remain correct

✓ No stale cache exists

✓ No mock data exists

✓ No duplicate logic exists

✓ No recurring bugs remain

Produce a final report listing every bug found, the root cause, the files modified, the database changes made, and the tests performed before declaring the system complete.

One recommendation

From everything you've shared over the last few weeks, I would go one step further than this prompt. I would have the AI replace the scattered Supabase calls throughout the app with a single centralized data layer (repository/service pattern). Right now it sounds like different screens are using different methods to read and write data, which is why you see issues such as disappearing data, inconsistent installer behavior, and modules reverting to old state. A single data layer, combined with a clean build pipeline and proper realtime subscriptions, makes the ERP much easier to maintain and greatly reduces the chance of these recurring problems.