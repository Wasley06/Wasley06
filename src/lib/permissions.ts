/* ── Shared permission definitions ─────────────────────────
   Single source of truth used by both Sidebar and Admin.
   The Permission Matrix in Admin shows these; the Sidebar
   derives its nav items from the "View" action (index 0).
──────────────────────────────────────────────────────────── */

export const MODULES = [
  'Dashboard','Inventory','Production','Procurement',
  'Sales','CRM','Finance','HR','Reports',
]

export const ACTIONS = ['View','Create','Edit','Delete','Approve','Export']

/* Mapping from module display name → ModuleKey used in Sidebar */
export const MODULE_KEY: Record<string, string> = {
  Dashboard:   'dashboard',
  Inventory:   'inventory',
  Production:  'production',
  Procurement: 'procurement',
  Sales:       'sales',
  CRM:         'crm',
  Finance:     'finance',
  HR:          'hr',
  Reports:     'reports',
}

/* All system roles — display name → slug (stable mapping, never changes) */
export const ALL_ROLES: { name: string; slug: string; color: string }[] = [
  { name: 'Super Admin',        slug: 'super_admin',        color: '#6366F1' },
  { name: 'Admin',              slug: 'admin',              color: '#3D7FFF' },
  { name: 'Finance Manager',    slug: 'finance_manager',    color: '#22C55E' },
  { name: 'HR Manager',         slug: 'hr_manager',         color: '#8B5CF6' },
  { name: 'Procurement Officer',slug: 'procurement_officer',color: '#F97316' },
  { name: 'Sales Manager',      slug: 'sales_manager',      color: '#EF4444' },
  { name: 'Sales Rep',          slug: 'sales_rep',          color: '#F43F5E' },
  { name: 'Storekeeper',        slug: 'storekeeper',        color: '#F59E0B' },
  { name: 'Cashier',            slug: 'cashier',            color: '#EC4899' },
  { name: 'Employee',           slug: 'employee',           color: '#94A3B8' },
]

/* Role slug → display name */
export const SLUG_TO_ROLE: Record<string, string> = Object.fromEntries(
  ALL_ROLES.map(r => [r.slug, r.name])
)

/* Role name → slug */
export const ROLE_TO_SLUG: Record<string, string> = Object.fromEntries(
  ALL_ROLES.map(r => [r.name, r.slug])
)

const ALL = ACTIONS.map(() => true)
const NONE = ACTIONS.map(() => false)
const VIEW_ONLY = [true, false, false, false, false, false]
const VIEW_CREATE = [true, true, false, false, false, false]
const VIEW_CREATE_EDIT = [true, true, true, false, false, false]
const FULL_NO_DELETE = [true, true, true, false, true, true]

/* Permission matrix — per [View,Create,Edit,Delete,Approve,Export] */
export const ROLE_PERMS: Record<string, Record<string, boolean[]>> = {
  'Super Admin': Object.fromEntries(MODULES.map(m => [m, ALL])),
  'Admin':       Object.fromEntries(MODULES.map(m => [m, ALL])),

  'Finance Manager': Object.fromEntries(MODULES.map(m => [m,
    ['Finance','Reports','Dashboard','Procurement','Sales'].includes(m) ? FULL_NO_DELETE : VIEW_ONLY
  ])),
  'HR Manager': Object.fromEntries(MODULES.map(m => [m,
    ['HR','Dashboard','Reports'].includes(m) ? FULL_NO_DELETE : VIEW_ONLY
  ])),
  'Procurement Officer': Object.fromEntries(MODULES.map(m => [m,
    ['Procurement','Inventory','Dashboard','Reports'].includes(m) ? VIEW_CREATE_EDIT : VIEW_ONLY
  ])),
  'Sales Manager': Object.fromEntries(MODULES.map(m => [m,
    ['Sales','CRM','Dashboard','Reports'].includes(m) ? FULL_NO_DELETE : VIEW_ONLY
  ])),
  'Sales Rep': Object.fromEntries(MODULES.map(m => [m,
    ['Sales','CRM','Dashboard'].includes(m) ? VIEW_CREATE_EDIT : VIEW_ONLY
  ])),
  'Storekeeper': Object.fromEntries(MODULES.map(m => [m,
    ['Inventory','Production','Procurement','Dashboard'].includes(m) ? VIEW_CREATE_EDIT : NONE
  ])),
  'Cashier': Object.fromEntries(MODULES.map(m => [m,
    ['Dashboard','Sales'].includes(m) ? VIEW_CREATE : NONE
  ])),
  'Employee': Object.fromEntries(MODULES.map(m => [m,
    m === 'Dashboard' ? VIEW_ONLY : NONE
  ])),
}

/**
 * Returns the ModuleKeys a role is allowed to VIEW based on the permission matrix.
 * Calendar, Admin, and Settings are appended based on role tier.
 */
export function getAllowedKeys(roleSlug: string): string[] {
  const roleName = SLUG_TO_ROLE[roleSlug] ?? ''
  const perms = ROLE_PERMS[roleName]

  const allowed = perms
    ? MODULES.filter(m => perms[m]?.[0] === true).map(m => MODULE_KEY[m])
    : ['dashboard']

  allowed.push('calendar')

  if (roleSlug === 'super_admin' || roleSlug === 'admin') {
    allowed.push('admin')
  }

  allowed.push('settings')
  return allowed
}
