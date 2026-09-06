import { CheckCircle2, AlertTriangle, Info, Clock, CheckCheck } from 'lucide-react'

const NOTIFS = [
  { id: 1, type: 'warning', icon: AlertTriangle, title: 'Low Stock Alert', body: 'Maize Flour 2kg is below reorder level (12 bags remaining). Reorder point: 50 bags.', time: '3 min ago', read: false, module: 'Inventory' },
  { id: 2, type: 'success', icon: CheckCircle2, title: 'Order Approved', body: 'Sales Order #SO-2847 for Naivas Supermarkets (TZS 284,000) has been approved by Amos Kariuki.', time: '18 min ago', read: false, module: 'Sales' },
  { id: 3, type: 'info', icon: Info, title: 'PO Awaiting Approval', body: 'Purchase Order #PO-883 from Rift Valley Grains Ltd (TZS 480,000) requires your approval.', time: '1 hr ago', read: false, module: 'Procurement' },
  { id: 4, type: 'success', icon: CheckCircle2, title: 'Production Batch Complete', body: 'Batch B-204 completed successfully. 540 units of Maize Flour 2kg produced. Efficiency: 90%.', time: '2 hr ago', read: true, module: 'Production' },
  { id: 5, type: 'warning', icon: AlertTriangle, title: 'Invoice Overdue', body: 'Invoice #INV-1087 for Tuskys (TZS 193,200) is 15 days overdue. Last contact: 2024-07-08.', time: '3 hr ago', read: true, module: 'Finance' },
  { id: 6, type: 'info', icon: Info, title: 'New User Added', body: 'David Kamau has been added to the Warehouse team with Storekeeper role by Grace Wanjiku.', time: '5 hr ago', read: true, module: 'Admin' },
  { id: 7, type: 'success', icon: CheckCircle2, title: 'Payment Received', body: 'Payment of TZS 128,400 received from Quickmart Holdings for Invoice #INV-1094. Bank: Equity.', time: 'Yesterday', read: true, module: 'Finance' },
]

const TYPE_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  warning: { bg: 'rgba(245,158,11,0.06)', color: 'var(--warning)', border: 'rgba(245,158,11,0.2)' },
  success: { bg: 'rgba(34,197,94,0.06)', color: 'var(--success)', border: 'rgba(34,197,94,0.2)' },
  info: { bg: 'rgba(61,127,255,0.06)', color: 'var(--primary)', border: 'rgba(61,127,255,0.2)' },
}

import { useState } from 'react'

export default function Notifications() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [notifs, setNotifs] = useState(NOTIFS)

  const markAllRead = () => setNotifs(n => n.map(x => ({ ...x, read: true })))
  const filtered = filter === 'unread' ? notifs.filter(n => !n.read) : notifs
  const unreadCount = notifs.filter(n => !n.read).length

  return (
    <div className="p-6 space-y-5 animate-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white">Notifications</h1>
          {unreadCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold text-white" style={{ background: 'var(--danger)' }}>{unreadCount} unread</span>
          )}
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {(['all', 'unread'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className="px-3 py-1.5 text-xs font-medium capitalize" style={{ background: filter === f ? 'var(--primary)' : 'var(--secondary)', color: filter === f ? 'white' : 'var(--secondary-foreground)' }}>
                {f}
              </button>
            ))}
          </div>
          <button onClick={markAllRead} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={{ background: 'var(--secondary)', border: '1px solid var(--border)', color: 'var(--secondary-foreground)' }}>
            <CheckCheck size={12} /> Mark all read
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-sm" style={{ color: 'var(--muted-foreground)' }}>No notifications</div>
        ) : (
          filtered.map(n => {
            const s = TYPE_STYLE[n.type]
            const Icon = n.icon
            return (
              <div
                key={n.id}
                onClick={() => setNotifs(ns => ns.map(x => x.id === n.id ? { ...x, read: true } : x))}
                className="rounded-xl p-4 flex gap-4 cursor-pointer transition-colors"
                style={{
                  background: n.read ? 'var(--card)' : s.bg,
                  border: `1px solid ${n.read ? 'var(--border)' : s.border}`,
                }}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: s.bg }}>
                  <Icon size={14} style={{ color: s.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-white">{n.title}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--muted-foreground)' }}>{n.module}</span>
                      {!n.read && <div className="w-2 h-2 rounded-full" style={{ background: 'var(--primary)' }} />}
                    </div>
                  </div>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--secondary-foreground)' }}>{n.body}</p>
                  <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    <Clock size={10} />{n.time}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
