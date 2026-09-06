import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

export type NotifType = 'success' | 'warning' | 'info' | 'error'

export interface AppNotification {
  id: string
  type: NotifType
  title: string
  body: string
  module: string
  time: number
  read: boolean
}

interface NotifCtxType {
  notifications: AppNotification[]
  unread: number
  addNotif: (n: Omit<AppNotification, 'id' | 'time' | 'read'>) => void
  markAll: () => void
  markRead: (id: string) => void
  clear: () => void
}

const NotifContext = createContext<NotifCtxType>({
  notifications: [], unread: 0,
  addNotif: () => {}, markAll: () => {}, markRead: () => {}, clear: () => {},
})

const STORAGE_KEY = 'fabegon:notifications'
const MAX_NOTIFS  = 50

function load(): AppNotification[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}

function save(ns: AppNotification[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ns.slice(0, MAX_NOTIFS))) } catch {}
}

export function NotifProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(load)

  /* persist on change */
  useEffect(() => { save(notifications) }, [notifications])

  /* cross-tab sync via BroadcastChannel */
  useEffect(() => {
    const bc = new BroadcastChannel('fabegon:notif-sync')
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'NEW_NOTIF') {
        setNotifications(prev => {
          if (prev.some(n => n.id === e.data.notif.id)) return prev
          return [e.data.notif, ...prev].slice(0, MAX_NOTIFS)
        })
      }
    }
    bc.addEventListener('message', handler)
    return () => { bc.removeEventListener('message', handler); bc.close() }
  }, [])

  /* listen to custom events from components */
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<Omit<AppNotification, 'id' | 'time' | 'read'>>).detail
      addNotif(detail)
    }
    window.addEventListener('fabegon:notify', handler)
    return () => window.removeEventListener('fabegon:notify', handler)
  }, [])

  const addNotif = useCallback((n: Omit<AppNotification, 'id' | 'time' | 'read'>) => {
    const notif: AppNotification = {
      ...n,
      id: `NF-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      time: Date.now(),
      read: false,
    }
    setNotifications(prev => [notif, ...prev].slice(0, MAX_NOTIFS))
    /* broadcast to other tabs */
    try {
      const bc = new BroadcastChannel('fabegon:notif-sync')
      bc.postMessage({ type: 'NEW_NOTIF', notif })
      setTimeout(() => bc.close(), 100)
    } catch {}
  }, [])

  const markAll  = () => setNotifications(ns => ns.map(n => ({ ...n, read: true })))
  const markRead = (id: string) => setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n))
  const clear    = () => setNotifications([])
  const unread   = notifications.filter(n => !n.read).length

  return (
    <NotifContext.Provider value={{ notifications, unread, addNotif, markAll, markRead, clear }}>
      {children}
    </NotifContext.Provider>
  )
}

export function useNotif() { return useContext(NotifContext) }

/* Helper — dispatch from anywhere without importing hook */
export function dispatchNotif(n: Omit<AppNotification, 'id' | 'time' | 'read'>) {
  window.dispatchEvent(new CustomEvent('fabegon:notify', { detail: n }))
}
