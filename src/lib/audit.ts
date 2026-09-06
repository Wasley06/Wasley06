import { supabase } from './supabase'

export type AuditAction =
  | 'login' | 'logout'
  | 'user_created' | 'user_edited' | 'user_deleted' | 'user_restored'
  | 'user_suspended' | 'user_activated' | 'role_changed' | 'password_reset'
  | 'item_created' | 'item_edited' | 'item_deleted'
  | 'sale_created' | 'inventory_adjusted'
  | 'permission_changed' | 'category_created' | 'category_deleted'

interface AuditEntry {
  action: AuditAction
  entity?: string
  entity_id?: string
  old_value?: unknown
  new_value?: unknown
  note?: string
}

export async function logAudit(
  actor: { id?: string; name: string; role: string },
  entry: AuditEntry
) {
  const row = {
    id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    actor_id:    actor.id ?? null,
    actor_name:  actor.name,
    actor_role:  actor.role,
    action:      entry.action,
    entity:      entry.entity ?? null,
    entity_id:   entry.entity_id ?? null,
    old_value:   entry.old_value ? JSON.stringify(entry.old_value) : null,
    new_value:   entry.new_value ? JSON.stringify(entry.new_value) : null,
    note:        entry.note ?? null,
    ip:          null, // browser can't get real IP reliably
    created_at:  new Date().toISOString(),
  }

  /* Write to Supabase (best-effort, non-blocking) */
  supabase.from('erp_audit_log').insert(row).then(({ error }) => {
    if (error) console.warn('[audit] failed to write log:', error.message)
  })

  /* Also keep last 500 entries in localStorage for offline visibility */
  try {
    const existing: typeof row[] = JSON.parse(localStorage.getItem('fabegon:audit') ?? '[]')
    existing.unshift(row)
    localStorage.setItem('fabegon:audit', JSON.stringify(existing.slice(0, 500)))
  } catch {}
}

export function loadLocalAudit(): {
  id: string; actor_name: string; actor_role: string; action: string
  entity: string | null; entity_id: string | null; note: string | null; created_at: string
}[] {
  try {
    return JSON.parse(localStorage.getItem('fabegon:audit') ?? '[]')
  } catch {
    return []
  }
}
