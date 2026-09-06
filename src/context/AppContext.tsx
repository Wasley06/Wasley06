import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react'
import { supabase, SUPABASE_URL, SUPABASE_ANON } from '../lib/supabase'
import { dispatchNotif } from './NotificationContext'

/* ── Types ─────────────────────────────────────────────────── */
export interface JournalEntry {
  id: string; date: string; ref: string; description: string
  debit: number; credit: number; type: 'sales' | 'purchase' | 'payment' | 'adjustment'
}
export interface InventoryItem {
  id: string
  name: string
  sku: string
  category: string
  warehouse: string
  qty: number
  minQty: number
  maxQty: number
  unit: string
  cost: number
  price: number
  reorder: number
  batchNumber: string
  expiry: string
  supplier: string
  description: string
  status: string
  approvalStatus: 'Approved' | 'Pending' | 'Rejected'
  pendingChange: string
  createdAt: string
  updatedAt: string
  receivedDate?: string
  receivedQty?: number
  soldQty?: number
  usedQty?: number
}
export interface ClientVisit {
  id: string; date: string; salesperson: string; purpose: string
  outcome: string; notes: string; followUp?: string
}
export interface Client {
  id: string; name: string; code?: string; email: string; phone: string
  address: string; location?: string; contactPerson?: string; customerType?: string
  creditLimit: number; visits?: ClientVisit[]
}
export interface Supplier {
  id: string; name: string; contact: string; phone: string; category: string; terms: string
  createdAt?: string; createdBy?: string
}
export interface CreditorTransaction {
  id: string; date: string; reference: string; description: string
  debit: number; credit: number; balance: number
}
export interface Creditor {
  id: string; name: string; code?: string; type: 'supplier' | 'other'
  contactPerson?: string; phone?: string; email?: string
  amount: number; openingBalance?: number; creditLimit?: number
  dueDate: string; status: 'Outstanding' | 'Partial' | 'Settled'; notes: string
  transactions?: CreditorTransaction[]
  paymentHistory?: { date: string; amount: number; reference: string; method: string }[]
}
export interface Employee {
  id: string; name: string; dept: string; role: string
  email: string; phone: string; status: string; joined: string
}
export interface SalesOrder {
  id: string; customer: string; date: string
  items: { name: string; qty: number; unit: string; price: number }[]
  total: number; status: string; paymentType: string; rep: string; notes: string
  amountPaid?: number; balance?: number
}
export interface POPaymentInstallment {
  id: string; date: string; amount: number; method: 'Cash' | 'Cheque' | 'Credit' | 'Bank Transfer' | 'Mobile Money'
  reference: string; notes: string
}
export interface PurchaseOrder {
  id: string; supplier: string; date: string; delivery: string; receivedDate?: string
  items: { name: string; qty: number; unit: string; cost: number }[]
  total: number; status: string; buyer: string; notes: string
  paymentMethod?: 'Cash' | 'Cheque' | 'Credit' | 'Bank Transfer' | 'Mobile Money'
  paymentType?: 'Full Payment' | 'Partial Payment' | 'Full Credit'
  paymentStatus?: 'Unpaid' | 'Partial' | 'Paid'
  amountPaid?: number; balance?: number
  paymentInstallments?: POPaymentInstallment[]
}
export interface Lead {
  id: string; name: string; contact: string; phone: string; email: string
  stage: string; value: number; rep: string; lastContact: string; notes: string
}
export interface ProductionBatch {
  id: string; product: string; recipe: string; line: string
  plannedQty: number; actualQty: number
  ingredients: { id: string; name: string; qty: string; measure: string; unit: string }[]
  started: string; completed: string; status: string; notes: string
}

export interface ScheduleEvent {
  id: string; date: string; title: string; type: string; time?: string; notes?: string
}

export interface Expenditure {
  id: string; date: string; category: string; description: string; amount: number
  payee: string; paymentMethod: string; reference: string; approvedBy: string
  status: 'Pending' | 'Approved' | 'Rejected' | 'Paid'; notes: string
  createdBy: string; createdAt: string
}

/* ── Offline queue ─────────────────────────────────────────── */
interface QueuedWrite {
  id: string
  table: string
  row: Record<string, unknown>
  operation: 'upsert' | 'delete'
  retryCount: number
  timestamp: number
}

const MAX_RETRIES = 50  // large number — never drop data due to transient failures
const QUEUE_KEY = 'fabegon:offline-queue'

function loadQueue(): QueuedWrite[] {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') } catch { return [] }
}
function saveQueue(q: QueuedWrite[]) {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)) } catch {}
}

/* ── Local snapshots — survive logout/login/reload ─────────── */
// Each entity is snapshotted to localStorage on every state change.
// On startup, snapshot is loaded as initial state so UI is never empty
// even before Supabase responds. Supabase data wins when available.
const SNAP = (key: string) => `fabegon:snap:${key}`
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadSnap<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(SNAP(key)) ?? '[]') as T[] } catch { return [] }
}
function saveSnap<T>(key: string, rows: T[]) {
  try { localStorage.setItem(SNAP(key), JSON.stringify(rows)) } catch {}
}

/* ── Supabase ↔ app type mappers ───────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toItem = (r: any): InventoryItem => ({
  id: r.id,
  name: r.name ?? '',
  sku: r.sku ?? '',
  category: r.category ?? 'Raw Materials',
  warehouse: r.warehouse ?? 'Main Store',
  qty: Number(r.qty) || 0,
  minQty: Number(r.min_qty ?? r.minQty) || 0,
  maxQty: Number(r.max_qty ?? r.maxQty) || 0,
  unit: r.unit ?? 'kg',
  cost: Number(r.cost) || 0,
  price: Number(r.price) || 0,
  reorder: Number(r.reorder) || 0,
  batchNumber: r.batch_number ?? r.batchNumber ?? '',
  expiry: r.expiry ?? '',
  supplier: r.supplier ?? '',
  description: r.description ?? '',
  status: r.status ?? 'Available',
  approvalStatus: r.approval_status ?? r.approvalStatus ?? 'Approved',
  pendingChange: r.pending_change ?? r.pendingChange ?? '',
  createdAt: r.created_at ?? r.createdAt ?? '',
  updatedAt: r.updated_at ?? r.updatedAt ?? '',
  // Only include these if the DB column actually has a value.
  // Omitting (not undefined) so spreading { ...existing, ...toItem(new) } never silently wipes them.
  ...(r.received_qty != null ? { receivedQty: Number(r.received_qty) } : r.receivedQty != null ? { receivedQty: Number(r.receivedQty) } : {}),
  ...(r.sold_qty     != null ? { soldQty:     Number(r.sold_qty)     } : r.soldQty     != null ? { soldQty:     Number(r.soldQty)     } : {}),
  ...(r.used_qty     != null ? { usedQty:     Number(r.used_qty)     } : r.usedQty     != null ? { usedQty:     Number(r.usedQty)     } : {}),
})
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toClient = (r: any): Client => ({ id: r.id, name: r.name, code: r.code ?? undefined, email: r.email, phone: r.phone, address: r.address, location: r.location ?? undefined, contactPerson: r.contact_person ?? undefined, customerType: r.customer_type ?? undefined, creditLimit: r.credit_limit, visits: r.visits ?? undefined })
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toSupplier = (r: any): Supplier => ({ id: r.id, name: r.name, contact: r.email ?? r.contact ?? '', phone: r.phone ?? '', category: r.company ?? r.category ?? 'General', terms: r.notes ?? r.terms ?? '', createdAt: r.created_at ?? '', createdBy: r.created_by ?? '' })
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toCreditor = (r: any): Creditor => ({ id: r.id, name: r.name, code: r.code ?? undefined, type: r.type, contactPerson: r.contact_person ?? undefined, phone: r.phone ?? undefined, email: r.email ?? undefined, amount: r.amount, openingBalance: r.opening_balance ?? undefined, creditLimit: r.credit_limit ?? undefined, dueDate: r.due_date, status: r.status, notes: r.notes, transactions: r.transactions ?? undefined, paymentHistory: r.payment_history ?? undefined })
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toEmployee = (r: any): Employee => ({ id: r.id, name: r.name, dept: r.department ?? r.dept ?? '', role: r.role ?? '', email: r.email ?? '', phone: r.phone ?? '', status: r.status ?? 'Active', joined: r.hire_date ?? r.joined ?? '' })
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toJournal = (r: any): JournalEntry => ({ id: r.id, date: r.date, ref: r.ref, description: r.description, debit: r.debit, credit: r.credit, type: r.type })
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toSalesOrder = (r: any): SalesOrder => ({ id: r.id, customer: r.customer, date: r.date, items: r.items ?? [], total: r.total, status: r.status, paymentType: r.payment_type, rep: r.rep ?? '', notes: r.notes ?? '', amountPaid: r.amount_paid ?? undefined, balance: r.balance ?? undefined })
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toPurchaseOrder = (r: any): PurchaseOrder => ({ id: r.id, supplier: r.supplier, date: r.date, delivery: r.delivery ?? '', receivedDate: r.received_date ?? undefined, items: r.items ?? [], total: r.total, status: r.status, buyer: r.buyer ?? '', notes: r.notes ?? '', paymentMethod: r.payment_method ?? undefined, paymentType: r.payment_type ?? undefined, paymentStatus: r.payment_status ?? 'Unpaid', amountPaid: r.amount_paid != null ? Number(r.amount_paid) : undefined, balance: r.balance != null ? Number(r.balance) : undefined, paymentInstallments: r.payment_installments ?? undefined })
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toLead = (r: any): Lead => ({ id: r.id, name: r.name, contact: r.company ?? r.contact ?? '', phone: r.phone ?? '', email: r.email ?? '', stage: r.stage ?? 'New', value: Number(r.value) || 0, rep: r.rep ?? '', lastContact: r.last_contact ?? r.lastContact ?? '', notes: r.notes ?? '' })
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toBatch = (r: any): ProductionBatch => ({ id: r.id, product: r.product, recipe: r.recipe ?? '', line: r.line, plannedQty: r.planned_qty, actualQty: r.actual_qty, ingredients: r.ingredients ?? [], started: r.started ?? '', completed: r.completed ?? '', status: r.status, notes: r.notes ?? '' })

/* ── Context type ──────────────────────────────────────────── */
interface AppContextType {
  items: InventoryItem[]
  isLoading: boolean
  addItem: (i: InventoryItem) => Promise<boolean>
  updateItem: (i: InventoryItem) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  refreshItems: () => Promise<void>
  requestItemEdit: (id: string, changes: Partial<InventoryItem>) => void
  approveItemEdit: (id: string) => void
  rejectItemEdit: (id: string) => void
  clients: Client[]
  addClient: (c: Client) => void
  updateClient: (c: Client) => void
  deleteClient: (id: string) => void
  suppliers: Supplier[]
  addSupplier: (s: Supplier) => void
  updateSupplier: (s: Supplier) => void
  deleteSupplier: (id: string) => void
  creditors: Creditor[]
  addCreditor: (c: Creditor) => void
  updateCreditor: (c: Creditor) => void
  deleteCreditor: (id: string) => void
  addCreditorTransaction: (creditorId: string, tx: CreditorTransaction) => void
  employees: Employee[]
  addEmployee: (e: Employee) => void
  updateEmployee: (e: Employee) => void
  deleteEmployee: (id: string) => void
  journalEntries: JournalEntry[]
  addSalesJournal: (ref: string, customer: string, amount: number) => void
  addPurchaseJournal: (ref: string, supplier: string, amount: number) => void
  addManualJournal: (entry: Omit<JournalEntry, 'id'>) => void
  clearJournal: () => Promise<{ count: number; error: string | null }>
  salesOrders: SalesOrder[]
  addSalesOrder: (o: SalesOrder) => void
  updateSalesOrder: (o: SalesOrder) => void
  deleteSalesOrder: (id: string) => void
  purchaseOrders: PurchaseOrder[]
  addPurchaseOrder: (o: PurchaseOrder) => void
  updatePurchaseOrder: (o: PurchaseOrder) => void
  deletePurchaseOrder: (id: string) => void
  addPOInstallment: (poId: string, inst: POPaymentInstallment) => void
  leads: Lead[]
  addLead: (l: Lead) => void
  updateLead: (l: Lead) => void
  deleteLead: (id: string) => void
  batches: ProductionBatch[]
  addBatch: (b: ProductionBatch) => void
  updateBatch: (b: ProductionBatch) => void
  deleteBatch: (id: string) => void
  scheduleEvents: ScheduleEvent[]
  addScheduleEvent: (ev: ScheduleEvent) => void
  deleteScheduleEvent: (id: string) => void
  expenditures: Expenditure[]
  addExpenditure: (e: Expenditure) => void
  updateExpenditure: (e: Expenditure) => void
  deleteExpenditure: (id: string) => void
  currentUser: { name: string; role: string; email: string } | null
  setCurrentUser: (u: { name: string; role: string; email: string } | null) => void
  userId: string | null
  isOnline: boolean
  pendingSync: number
}

const AppContext = createContext<AppContextType>({} as AppContextType)

/* ── Provider ─────────────────────────────────────────────── */
export function AppProvider({ children, user }: { children: ReactNode; user: { name: string; role: string; email: string } | null }) {
  // Load from localStorage snapshot on startup — prevents empty screen after login
  const [items,          setItems]          = useState<InventoryItem[]>(() => loadSnap<InventoryItem>('items'))
  const [isLoading,      setIsLoading]      = useState(true)
  const [clients,        setClients]        = useState<Client[]>(() => loadSnap<Client>('clients'))
  const [suppliers,      setSuppliers]      = useState<Supplier[]>(() => loadSnap<Supplier>('suppliers'))
  const [creditors,      setCreditors]      = useState<Creditor[]>(() => loadSnap<Creditor>('creditors'))
  const [employees,      setEmployees]      = useState<Employee[]>(() => loadSnap<Employee>('employees'))
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => loadSnap<JournalEntry>('journal'))
  const [salesOrders,    setSalesOrders]    = useState<SalesOrder[]>(() => loadSnap<SalesOrder>('salesOrders'))
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => loadSnap<PurchaseOrder>('purchaseOrders'))
  const [leads,          setLeads]          = useState<Lead[]>(() => loadSnap<Lead>('leads'))
  const [batches,        setBatches]        = useState<ProductionBatch[]>(() => loadSnap<ProductionBatch>('batches'))
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>(() => loadSnap<ScheduleEvent>('scheduleEvents'))
  const [expenditures,   setExpenditures]   = useState<Expenditure[]>(() => loadSnap<Expenditure>('expenditures'))
  const [currentUser,    setCurrentUser]    = useState(user)
  const [userId,         setUserId]         = useState<string | null>(null)
  const [isOnline,       setIsOnline]       = useState(navigator.onLine)
  const [offlineQueue,   setOfflineQueue]   = useState<QueuedWrite[]>(loadQueue)
  const [pendingSync,    setPendingSync]    = useState(0)

  // Stable ref so Realtime callbacks always see current isOnline without stale closure
  const isOnlineRef = useRef(isOnline)
  useEffect(() => { isOnlineRef.current = isOnline }, [isOnline])
  // Ref to fetchAll so drainQueue can reload from Supabase after successful flush
  const fetchAllRef = useRef<(() => Promise<void>) | null>(null)

  /* ── Snapshot persistence — save every state change to localStorage ── */
  // Inline saveSnap calls in mutation functions handle synchronous persistence.
  // These useEffects serve as a secondary backup and always save (no length guard)
  // so deletions are never ghosted back by a stale snapshot.
  useEffect(() => { saveSnap('items',          items)          }, [items])
  useEffect(() => { saveSnap('clients',        clients)        }, [clients])
  useEffect(() => { saveSnap('suppliers',      suppliers)      }, [suppliers])
  useEffect(() => { saveSnap('creditors',      creditors)      }, [creditors])
  useEffect(() => { saveSnap('employees',      employees)      }, [employees])
  useEffect(() => { saveSnap('journal',        journalEntries) }, [journalEntries])
  useEffect(() => { saveSnap('salesOrders',    salesOrders)    }, [salesOrders])
  useEffect(() => { saveSnap('purchaseOrders', purchaseOrders) }, [purchaseOrders])
  useEffect(() => { saveSnap('leads',          leads)          }, [leads])
  useEffect(() => { saveSnap('batches',        batches)        }, [batches])
  useEffect(() => { saveSnap('scheduleEvents', scheduleEvents) }, [scheduleEvents])
  useEffect(() => { saveSnap('expenditures',   expenditures)   }, [expenditures])

  /* ── Auth state listener — triggers fetchAll exactly once after session confirmed ── */
  // onAuthStateChange fires reliably on SIGNED_IN before any RLS-protected query,
  // eliminating the race condition that caused data loss after logout/login cycles.
  // SIGNED_OUT: only clear userId and auth tokens — never wipe business state.
  useEffect(() => {
    // Seed userId from current session (handles page reload with active session)
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id ?? null
      setUserId(uid)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const uid = session?.user?.id ?? null
      setUserId(uid)
      if (event === 'SIGNED_IN' && uid) {
        // Session is fully established — safe to fetch all business data from Supabase
        fetchAllRef.current?.()
      }
      // SIGNED_OUT: do not clear business data arrays per architecture spec.
      // Data will be refreshed on next SIGNED_IN.
    })

    return () => { subscription.unsubscribe() }
  }, [])

  /* ── Online / offline detection ─────────────────────────── */
  useEffect(() => {
    const checkNet = async () => {
      if (!navigator.onLine) { setIsOnline(false); return }
      try {
        const ctrl = new AbortController()
        const timer = setTimeout(() => ctrl.abort(), 5000)
        const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
          method: 'HEAD', signal: ctrl.signal,
          headers: { apikey: SUPABASE_ANON },
        })
        clearTimeout(timer)
        setIsOnline(res.status < 500)
      } catch { setIsOnline(false) }
    }
    checkNet()
    const interval = setInterval(checkNet, 10_000)
    window.addEventListener('online',  checkNet)
    window.addEventListener('offline', () => setIsOnline(false))
    return () => {
      clearInterval(interval)
      window.removeEventListener('online',  checkNet)
      window.removeEventListener('offline', () => setIsOnline(false))
    }
  }, [])

  /* ── Initial data fetch ─────────────────────────────────── */
  const refreshItems = useCallback(async () => {
    const { data } = await supabase.from('erp_items').select('*').order('created_at', { ascending: false })
    if (data) {
      const localQueue = loadQueue()
      const pendingFor = (table: string) => localQueue.filter(w => w.table === table && w.operation === 'upsert')
      const deletedIds = (table: string) => new Set(localQueue.filter(w => w.table === table && w.operation === 'delete').map(w => String(w.row.id)))
      const db = data.map(toItem)
      const queued = pendingFor('erp_items').map(w => toItem(w.row as any))
      const delIds = deletedIds('erp_items')
      setItems([...db.filter(r => !delIds.has(r.id)), ...queued.filter(q => !db.some(d => d.id === q.id) && !delIds.has(q.id))])
    }
  }, [])

  useEffect(() => {
    async function fetchAll() {
      setIsLoading(true)
      try {
        const [
          { data: itemsData,         error: eItems },
          { data: clientsData,       error: eClients },
          { data: suppliersData,     error: eSuppliers },
          { data: creditorsData,     error: eCreditors },
          { data: employeesData,     error: eEmployees },
          { data: journalData,       error: eJournal },
          { data: salesOrdersData,   error: eSales },
          { data: purchaseOrdersData,error: ePurchases },
          { data: leadsData,         error: eLeads },
          { data: batchesData,       error: eBatches },
          { data: scheduleData,      error: eSchedule },
          { data: expendituresData,  error: eExpenditures },
        ] = await Promise.all([
          supabase.from('erp_items').select('*').order('created_at', { ascending: false }),
          supabase.from('erp_clients').select('*').order('created_at', { ascending: false }),
          supabase.from('erp_suppliers').select('*').order('created_at', { ascending: false }),
          supabase.from('erp_creditors').select('*').order('created_at', { ascending: false }),
          supabase.from('erp_employees').select('*').order('created_at', { ascending: false }),
          supabase.from('erp_journal').select('*').order('created_at', { ascending: false }),
          supabase.from('erp_sales_orders').select('*').order('created_at', { ascending: false }),
          supabase.from('erp_purchase_orders').select('*').order('created_at', { ascending: false }),
          supabase.from('erp_leads').select('*').order('created_at', { ascending: false }),
          supabase.from('erp_production_batches').select('*').order('created_at', { ascending: false }),
          supabase.from('erp_schedule_events').select('*').order('date', { ascending: true }),
          supabase.from('erp_expenditures').select('*').order('created_at', { ascending: false }),
        ])

        // Merge helper: DB rows + locally-queued items not yet in Supabase, minus local deletes
        // This ensures data added offline survives logout/login cycles even before Supabase sync
        const localQueue = loadQueue()
        const pendingFor = (table: string) => localQueue.filter(w => w.table === table && w.operation === 'upsert')
        const deletedIds = (table: string) => new Set(localQueue.filter(w => w.table === table && w.operation === 'delete').map(w => String(w.row.id)))

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        function mergeTable<T extends { id: string }>(dbRows: any[] | null | undefined, mapper: (r: any) => T, table: string, snapKey: string, fetchError?: any): T[] {
          const queued = pendingFor(table).map(w => mapper(w.row as any))
          const snap   = loadSnap<T>(snapKey)
          const delIds = deletedIds(table)

          // Supabase unreachable (network error, PGRST205, RLS timing) — use snapshot + queue
          if (fetchError) {
            return [
              ...queued,
              ...snap.filter(s => !queued.some(q => q.id === s.id) && !delIds.has(s.id)),
            ]
          }

          const db = (dbRows ?? []).map(mapper)

          // Prefer locally-enriched snapshot/queued data over raw DB rows.
          // DB rows only contain columns that exist in Supabase; extended fields
          // (transactions, visits, etc.) live in the snapshot. Queued writes take
          // highest priority (they represent the user's latest uncommitted change).
          if (db.length > 0 || queued.length > 0) {
            const snapMap   = new Map(snap.map(s   => [s.id, s]))
            const queuedMap = new Map(queued.map(q => [q.id, q]))
            return [
              ...db.filter(r => !delIds.has(r.id)).map(r => {
                if (queuedMap.has(r.id)) return queuedMap.get(r.id)!
                const s = snapMap.get(r.id)
                if (s) return { ...r, ...s }
                return r
              }),
              ...queued.filter(q => !db.some(d => d.id === q.id) && !delIds.has(q.id)),
            ]
          }

          // Supabase returned 0 rows AND queue is empty.
          // This can mean (a) table is genuinely empty, OR (b) auth/RLS timing issue.
          // Safe fallback: preserve snapshot minus any pending deletes.
          // If user deleted everything intentionally, Realtime DELETE events will clear it.
          return snap.filter(s => !delIds.has(s.id))
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const toSchEv = (r: any): ScheduleEvent => ({ id: r.id, date: r.date, title: r.title, type: r.type, time: r.time ?? undefined, notes: r.notes ?? undefined })
        const toExpenditure = (r: any): Expenditure => ({ id: r.id, date: r.date, category: r.category ?? 'Operations', description: r.description ?? '', amount: Number(r.amount) || 0, payee: r.payee ?? '', paymentMethod: r.payment_method ?? 'Bank Transfer', reference: r.reference ?? '', approvedBy: r.approved_by ?? '', status: r.status ?? 'Pending', notes: r.notes ?? '', createdBy: r.created_by ?? '', createdAt: r.created_at ?? '' })

        const mergedItems          = mergeTable(itemsData,         toItem,          'erp_items',           'items',          eItems)
        const mergedClients        = mergeTable(clientsData,       toClient,        'erp_clients',         'clients',        eClients)
        const mergedSuppliers      = mergeTable(suppliersData,     toSupplier,      'erp_suppliers',       'suppliers',      eSuppliers)
        const mergedCreditors      = mergeTable(creditorsData,     toCreditor,      'erp_creditors',       'creditors',      eCreditors)
        const mergedEmployees      = mergeTable(employeesData,     toEmployee,      'erp_employees',       'employees',      eEmployees)
        const mergedJournal        = mergeTable(journalData,       toJournal,       'erp_journal',         'journal',        eJournal)
        const mergedSalesOrders    = mergeTable(salesOrdersData,   toSalesOrder,    'erp_sales_orders',    'salesOrders',    eSales)
        const mergedPurchaseOrders = mergeTable(purchaseOrdersData,toPurchaseOrder, 'erp_purchase_orders', 'purchaseOrders', ePurchases)
        const mergedLeads          = mergeTable(leadsData,         toLead,          'erp_leads',           'leads',          eLeads)
        const mergedBatches        = mergeTable(batchesData,       toBatch,         'erp_production_batches','batches',      eBatches)
        const mergedSchedule       = mergeTable(scheduleData,      toSchEv,         'erp_schedule_events', 'scheduleEvents', eSchedule).sort((a, b) => a.date.localeCompare(b.date))
        const mergedExpenditures   = mergeTable(expendituresData,  toExpenditure,   'erp_expenditures',    'expenditures',   eExpenditures)

        setItems(mergedItems)
        setClients(mergedClients)
        setSuppliers(mergedSuppliers)
        setCreditors(mergedCreditors)
        setEmployees(mergedEmployees)
        setJournalEntries(mergedJournal)
        setSalesOrders(mergedSalesOrders)
        setPurchaseOrders(mergedPurchaseOrders)
        setLeads(mergedLeads)
        setBatches(mergedBatches)
        setScheduleEvents(mergedSchedule)
        setExpenditures(mergedExpenditures)

        // Persist authoritative merged data to snapshots immediately after fetch
        saveSnap('items',          mergedItems)
        saveSnap('clients',        mergedClients)
        saveSnap('suppliers',      mergedSuppliers)
        saveSnap('creditors',      mergedCreditors)
        saveSnap('employees',      mergedEmployees)
        saveSnap('journal',        mergedJournal)
        saveSnap('salesOrders',    mergedSalesOrders)
        saveSnap('purchaseOrders', mergedPurchaseOrders)
        saveSnap('leads',          mergedLeads)
        saveSnap('batches',        mergedBatches)
        saveSnap('scheduleEvents', mergedSchedule)
        saveSnap('expenditures',   mergedExpenditures)

      } finally {
        setIsLoading(false)
      }
      // Drain offline queue immediately after successful fetch while we know we are online
      const q = loadQueue()
      if (q.length > 0) drainQueue(q)
    }
    fetchAllRef.current = fetchAll
    fetchAll()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── Realtime subscriptions with auto-reconnect ──────────── */
  useEffect(() => {
    let channel = subscribeRealtime()
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null

    // Debounced reconnect — prevents "cannot add callbacks after subscribe()" when
    // visibilitychange or online fires multiple times in quick succession
    const reconnect = () => {
      if (reconnectTimer) clearTimeout(reconnectTimer)
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null
        supabase.removeChannel(channel)
        channel = subscribeRealtime()
      }, 300)
    }

    const onVisibility = () => { if (document.visibilityState === 'visible') reconnect() }
    window.addEventListener('online', reconnect)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer)
      supabase.removeChannel(channel)
      window.removeEventListener('online', reconnect)
      document.removeEventListener('visibilitychange', onVisibility)
    }

    function subscribeRealtime() {
      return supabase.channel(`erp-realtime-${Date.now()}`)
        /* Items */
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'erp_items' },
          p => setItems(prev => prev.some(x => x.id === p.new.id) ? prev.map(x => x.id === p.new.id ? toItem(p.new) : x) : [toItem(p.new), ...prev]))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'erp_items' },
          // Merge: keep locally-tracked fields (soldQty/usedQty/receivedQty) that are not in Supabase columns
          p => setItems(prev => prev.map(x => x.id === p.new.id ? { ...x, ...toItem(p.new) } : x)))
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'erp_items' },
          p => setItems(prev => prev.filter(x => x.id !== p.old.id)))
        /* Clients */
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'erp_clients' },
          p => setClients(prev => prev.some(x => x.id === p.new.id) ? prev : [toClient(p.new), ...prev]))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'erp_clients' },
          p => setClients(prev => prev.map(x => x.id === p.new.id ? { ...x, ...toClient(p.new) } : x)))
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'erp_clients' },
          p => setClients(prev => prev.filter(x => x.id !== p.old.id)))
        /* Suppliers */
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'erp_suppliers' },
          p => setSuppliers(prev => prev.some(x => x.id === p.new.id) ? prev : [toSupplier(p.new), ...prev]))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'erp_suppliers' },
          p => setSuppliers(prev => prev.map(x => x.id === p.new.id ? { ...x, ...toSupplier(p.new) } : x)))
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'erp_suppliers' },
          p => setSuppliers(prev => prev.filter(x => x.id !== p.old.id)))
        /* Creditors */
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'erp_creditors' },
          p => setCreditors(prev => prev.some(x => x.id === p.new.id) ? prev : [toCreditor(p.new), ...prev]))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'erp_creditors' },
          p => setCreditors(prev => prev.map(x => x.id === p.new.id ? { ...x, ...toCreditor(p.new) } : x)))
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'erp_creditors' },
          p => setCreditors(prev => prev.filter(x => x.id !== p.old.id)))
        /* Employees */
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'erp_employees' },
          p => setEmployees(prev => prev.some(x => x.id === p.new.id) ? prev : [toEmployee(p.new), ...prev]))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'erp_employees' },
          p => setEmployees(prev => prev.map(x => x.id === p.new.id ? { ...x, ...toEmployee(p.new) } : x)))
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'erp_employees' },
          p => setEmployees(prev => prev.filter(x => x.id !== p.old.id)))
        /* Journal */
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'erp_journal' },
          p => setJournalEntries(prev => prev.some(x => x.id === p.new.id) ? prev : [toJournal(p.new), ...prev]))
        /* Sales Orders */
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'erp_sales_orders' },
          p => setSalesOrders(prev => prev.some(x => x.id === p.new.id) ? prev : [toSalesOrder(p.new), ...prev]))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'erp_sales_orders' },
          p => setSalesOrders(prev => prev.map(x => x.id === p.new.id ? { ...x, ...toSalesOrder(p.new) } : x)))
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'erp_sales_orders' },
          p => setSalesOrders(prev => prev.filter(x => x.id !== p.old.id)))
        /* Purchase Orders */
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'erp_purchase_orders' },
          p => setPurchaseOrders(prev => prev.some(x => x.id === p.new.id) ? prev : [toPurchaseOrder(p.new), ...prev]))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'erp_purchase_orders' },
          p => setPurchaseOrders(prev => prev.map(x => x.id === p.new.id ? { ...x, ...toPurchaseOrder(p.new) } : x)))
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'erp_purchase_orders' },
          p => setPurchaseOrders(prev => prev.filter(x => x.id !== p.old.id)))
        /* Leads */
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'erp_leads' },
          p => setLeads(prev => prev.some(x => x.id === p.new.id) ? prev : [toLead(p.new), ...prev]))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'erp_leads' },
          p => setLeads(prev => prev.map(x => x.id === p.new.id ? { ...x, ...toLead(p.new) } : x)))
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'erp_leads' },
          p => setLeads(prev => prev.filter(x => x.id !== p.old.id)))
        /* Production Batches */
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'erp_production_batches' },
          p => setBatches(prev => prev.some(x => x.id === p.new.id) ? prev : [toBatch(p.new), ...prev]))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'erp_production_batches' },
          p => setBatches(prev => prev.map(x => x.id === p.new.id ? { ...x, ...toBatch(p.new) } : x)))
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'erp_production_batches' },
          p => setBatches(prev => prev.filter(x => x.id !== p.old.id)))
        /* Schedule Events */
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'erp_schedule_events' },
          p => setScheduleEvents(prev => prev.some(x => x.id === p.new.id) ? prev : [...prev, { id: p.new.id, date: p.new.date, title: p.new.title, type: p.new.type, time: p.new.time ?? undefined, notes: p.new.notes ?? undefined }]))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'erp_schedule_events' },
          p => setScheduleEvents(prev => prev.map(x => x.id === p.new.id ? { id: p.new.id, date: p.new.date, title: p.new.title, type: p.new.type, time: p.new.time ?? undefined, notes: p.new.notes ?? undefined } : x)))
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'erp_schedule_events' },
          p => setScheduleEvents(prev => prev.filter(x => x.id !== p.old.id)))
        .subscribe()
    }
  }, [])

  /* ── Offline queue drain (batched, supports delete) ──────── */
  const drainQueue = useCallback(async (queue: QueuedWrite[]) => {
    if (queue.length === 0) return
    const remaining: QueuedWrite[] = []

    // Group upserts by table for batch processing
    const upserts = queue.filter(w => w.operation === 'upsert')
    const deletes = queue.filter(w => w.operation === 'delete')

    // Batch upserts per table
    const tableGroups = new Map<string, QueuedWrite[]>()
    for (const w of upserts) {
      const group = tableGroups.get(w.table) ?? []
      group.push(w)
      tableGroups.set(w.table, group)
    }
    for (const [table, writes] of tableGroups) {
      const rows = writes.map(w => w.row)
      const { error } = await supabase.from(table).upsert(rows)
      if (error) {
        const isPGRST205 = error.code === 'PGRST205' || error.message?.includes('schema cache')
        for (const w of writes) {
          // PGRST205 = table missing — never increment retryCount so items are NEVER dropped
          // For other errors, increment and drop only after MAX_RETRIES
          const newCount = isPGRST205 ? w.retryCount : w.retryCount + 1
          if (isPGRST205 || newCount < MAX_RETRIES) remaining.push({ ...w, retryCount: newCount })
        }
      }
    }

    // Process deletes individually (can't batch by different IDs easily)
    for (const w of deletes) {
      const { error } = await supabase.from(w.table).delete().eq('id', w.row.id)
      if (error && w.retryCount < MAX_RETRIES) remaining.push({ ...w, retryCount: w.retryCount + 1 })
    }

    setOfflineQueue(remaining)
    saveQueue(remaining)
    setPendingSync(remaining.length)
    if (remaining.length === 0) {
      window.dispatchEvent(new Event('fabegon:sync'))
      // All queued writes confirmed by Supabase — reload from DB so state is authoritative
      fetchAllRef.current?.()
    }
  }, [])

  useEffect(() => {
    if (isOnline && offlineQueue.length > 0) drainQueue(offlineQueue)
  }, [isOnline, offlineQueue, drainQueue])

  // Drain immediately on mount (in case queue was left from a previous session)
  useEffect(() => {
    const q = loadQueue()
    if (q.length > 0 && navigator.onLine) drainQueue(q)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── Write helpers ───────────────────────────────────────── */
  const now = () => new Date().toISOString()

  // Tables that have logged a PGRST205 "not in schema cache" warning — suppress repeated errors
  const missingTablesRef = useRef<Set<string>>(new Set())

  // Tables that have no updated_at column — do not inject it for these
  const NO_UPDATED_AT_TABLES = new Set(['erp_journal', 'erp_schedule_events'])

  async function persistRow(table: string, row: Record<string, unknown>): Promise<boolean> {
    const rowWithTs = NO_UPDATED_AT_TABLES.has(table) ? { ...row } : { ...row, updated_at: now() }
    const enqueue = () => {
      const entry: QueuedWrite = { id: `q-${Date.now()}`, table, row: rowWithTs, operation: 'upsert', retryCount: 0, timestamp: Date.now() }
      setOfflineQueue(prev => { const next = [...prev, entry]; saveQueue(next); return next })
      setPendingSync(q => q + 1)
    }
    if (!isOnlineRef.current) { enqueue(); return false }
    try {
      const { error } = await supabase.from(table).upsert(rowWithTs)
      if (error) {
        // PGRST205 = table not in schema cache (table doesn't exist in Supabase yet).
        // Don't enqueue — retrying won't help until the SQL schema is run.
        // Log once, then silence to avoid console spam.
        if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
          if (!missingTablesRef.current.has(table)) {
            missingTablesRef.current.add(table)
            console.warn(`[Fabegon ERP] Table '${table}' not found in Supabase. Run supabase-schema.sql in your Supabase SQL Editor to create it. Data is saved locally until then.`)
          }
          enqueue()
          return false
        }
        console.error(`[persistRow] ${table}:`, error.message, error.code)
        enqueue()
        return false
      }
      // If write succeeds, remove from missing-tables set (schema was fixed)
      missingTablesRef.current.delete(table)
      return true
    } catch (e) {
      console.error(`[persistRow] network error on ${table}:`, e)
      enqueue()
      return false
    }
  }

  async function persistDelete(table: string, id: string): Promise<boolean> {
    const enqueue = () => {
      const entry: QueuedWrite = { id: `q-${Date.now()}`, table, row: { id }, operation: 'delete', retryCount: 0, timestamp: Date.now() }
      setOfflineQueue(prev => { const next = [...prev, entry]; saveQueue(next); return next })
      setPendingSync(q => q + 1)
    }
    if (!isOnlineRef.current) { enqueue(); return false }
    try {
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
          if (!missingTablesRef.current.has(table)) {
            missingTablesRef.current.add(table)
            console.warn(`[Fabegon ERP] Table '${table}' not found in Supabase. Run supabase-schema.sql to create it.`)
          }
          return false
        }
        console.error(`[persistDelete] ${table}:`, error.message, error.code)
        return false
      }
      return true
    } catch (e) {
      console.error(`[persistDelete] network error on ${table}:`, e)
      return false
    }
  }

  const today = new Date().toISOString().slice(0, 10)

  /* ── Item row mapper — matches erp_items table exactly ───── */
  const itemRow = (i: InventoryItem, isNew = false) => ({
    id: i.id,
    name: i.name,
    sku: i.sku || null,
    category: i.category,
    warehouse: i.warehouse,
    qty: i.qty,
    min_qty: i.minQty,
    max_qty: i.maxQty,
    unit: i.unit,
    cost: i.cost,
    price: i.price,
    reorder: i.reorder,
    batch_number: i.batchNumber || null,
    expiry: i.expiry || null,
    supplier: i.supplier || null,
    description: i.description || null,
    status: i.status,
    approval_status: i.approvalStatus,
    pending_change: i.pendingChange || null,
    ...(isNew ? { created_at: now() } : {}),
  })

  /* ── Inventory mutations ─────────────────────────────────── */
  const addItem = async (i: InventoryItem): Promise<boolean> => {
    // Always track the initial received quantity so Received column stays accurate after deductions
    const toStore: InventoryItem = { ...i, receivedQty: i.receivedQty ?? i.qty }
    setItems(p => { const next = [toStore, ...p]; saveSnap('items', next); return next })
    const ok = await persistRow('erp_items', itemRow(toStore, true))
    if (ok) {
      dispatchNotif({ type: 'info', title: 'Item Added', body: `${toStore.name} added to ${toStore.warehouse}`, module: 'Inventory' })
    } else {
      dispatchNotif({ type: 'warning', title: 'Saved Locally', body: `${toStore.name} saved locally and will sync when connection is established.`, module: 'Inventory' })
    }
    sysJournal('adjustment', toStore.id, `Inventory — ${toStore.name} added to ${toStore.warehouse} · Qty: ${toStore.qty} ${toStore.unit}`, toStore.qty * toStore.cost, 0)
    sysSchedule('Inventory', toStore.id, `Item added: ${toStore.name} — ${toStore.qty} ${toStore.unit} · ${toStore.warehouse}`, 'other')
    return ok
  }

  const updateItem = async (i: InventoryItem): Promise<void> => {
    setItems(p => { const next = p.map(x => x.id === i.id ? i : x); saveSnap('items', next); return next })
    const ok = await persistRow('erp_items', itemRow(i))
    if (!ok) {
      dispatchNotif({ type: 'warning', title: 'Queued for Sync', body: `${i.name} update saved locally — will sync when online.`, module: 'Inventory' })
    }
  }

  const deleteItem = async (id: string): Promise<void> => {
    const saved = items.find(x => x.id === id)
    setItems(p => { const next = p.filter(x => x.id !== id); saveSnap('items', next); return next })
    const ok = await persistDelete('erp_items', id)
    if (!ok && isOnlineRef.current) {
      if (saved) setItems(p => [saved, ...p])
      dispatchNotif({ type: 'error', title: 'Delete Failed', body: 'Could not delete item. Changes reverted.', module: 'Inventory' })
    } else if (!ok) {
      dispatchNotif({ type: 'warning', title: 'Delete Queued', body: 'Delete queued — will apply when online.', module: 'Inventory' })
    }
  }

  const requestItemEdit = (_id: string, changes: Partial<InventoryItem>) => {
    // Direct edit — no approval flow
    const item = items.find(x => x.id === _id)
    if (item) updateItem({ ...item, ...changes })
  }
  const approveItemEdit = (_id: string) => { /* no-op — approval removed */ }
  const rejectItemEdit  = (_id: string) => { /* no-op — approval removed */ }

  /* ── CRM ─────────────────────────────────────────────────── */
  const addClient = async (c: Client) => {
    setClients(p => { const next = [c, ...p]; saveSnap('clients', next); return next })
    persistRow('erp_clients', { id: c.id, name: c.name, code: c.code ?? null, email: c.email, phone: c.phone, address: c.address, location: c.location ?? null, contact_person: c.contactPerson ?? null, customer_type: c.customerType ?? null, credit_limit: c.creditLimit, visits: c.visits ?? null, created_at: now() })
    dispatchNotif({ type: 'success', title: 'Client Added', body: `${c.name} added to CRM`, module: 'CRM' })
    sysJournal('adjustment', c.id, `CRM — New client registered: ${c.name}`)
    sysSchedule('CRM', c.id, `Client registered: ${c.name}`, 'other')
  }
  const updateClient = async (c: Client) => {
    setClients(p => { const next = p.map(x => x.id === c.id ? c : x); saveSnap('clients', next); return next })
    const ok = await persistRow('erp_clients', { id: c.id, name: c.name, code: c.code ?? null, email: c.email, phone: c.phone, address: c.address, location: c.location ?? null, contact_person: c.contactPerson ?? null, customer_type: c.customerType ?? null, credit_limit: c.creditLimit, visits: c.visits ?? null })
    if (!ok) { dispatchNotif({ type: 'warning', title: 'Queued for Sync', body: `${c.name} update saved locally — will sync when online.`, module: 'CRM' }) }
  }
  const deleteClient = async (id: string) => {
    const saved = clients.find(x => x.id === id)
    setClients(p => { const next = p.filter(x => x.id !== id); saveSnap('clients', next); return next })
    const ok = await persistDelete('erp_clients', id)
    if (!ok && isOnlineRef.current && saved) { setClients(p => [saved, ...p]); dispatchNotif({ type: 'error', title: 'Delete Failed', body: 'Client delete failed. Reverted.', module: 'CRM' }) }
    else if (!ok) { dispatchNotif({ type: 'warning', title: 'Delete Queued', body: 'Delete will sync when online.', module: 'CRM' }) }
    else { dispatchNotif({ type: 'success', title: 'Client Deleted', body: `${saved?.name ?? 'Client'} removed from system and database.`, module: 'CRM' }) }
  }

  /* ── Creditors ───────────────────────────────────────────── */
  const addCreditor = async (c: Creditor) => {
    setCreditors(p => { const next = [c, ...p]; saveSnap('creditors', next); return next })
    persistRow('erp_creditors', { id: c.id, name: c.name, code: c.code ?? null, type: c.type, contact_person: c.contactPerson ?? null, phone: c.phone ?? null, email: c.email ?? null, amount: c.amount, opening_balance: c.openingBalance ?? null, credit_limit: c.creditLimit ?? null, due_date: c.dueDate || null, status: c.status, notes: c.notes, transactions: c.transactions ?? null, payment_history: c.paymentHistory ?? null, created_at: now() })
    dispatchNotif({ type: 'warning', title: 'Creditor Added', body: `${c.name} — TZS ${c.amount.toLocaleString()} due ${c.dueDate || 'TBD'}`, module: 'Finance' })
    sysJournal('payment', c.id, `Finance — Creditor recorded: ${c.name} · TZS ${c.amount.toLocaleString()} (${c.status})`, c.amount, 0)
  }
  const updateCreditor = async (c: Creditor) => {
    setCreditors(p => { const next = p.map(x => x.id === c.id ? c : x); saveSnap('creditors', next); return next })
    // Sync back to linked Sales Order so amountPaid/balance/status stay consistent
    if (c.id.startsWith('CR-SO-')) {
      const soId = c.id.replace('CR-SO-', '')
      setSalesOrders(p => {
        const so = p.find(x => x.id === soId)
        if (!so) return p
        const newAmountPaid = Math.max(0, so.total - c.amount)
        const updated: SalesOrder = { ...so, amountPaid: newAmountPaid, balance: c.amount }
        const next = p.map(x => x.id === soId ? updated : x)
        saveSnap('salesOrders', next)
        persistRow('erp_sales_orders', { id: updated.id, customer: updated.customer, date: updated.date, items: updated.items, total: updated.total, status: updated.status, payment_type: updated.paymentType, rep: updated.rep, notes: updated.notes, amount_paid: newAmountPaid, balance: c.amount })
        return next
      })
    }
    const ok = await persistRow('erp_creditors', { id: c.id, name: c.name, code: c.code ?? null, type: c.type, contact_person: c.contactPerson ?? null, phone: c.phone ?? null, email: c.email ?? null, amount: c.amount, opening_balance: c.openingBalance ?? null, credit_limit: c.creditLimit ?? null, due_date: c.dueDate, status: c.status, notes: c.notes, transactions: c.transactions ?? null, payment_history: c.paymentHistory ?? null })
    if (!ok) { dispatchNotif({ type: 'warning', title: 'Queued for Sync', body: `${c.name} update saved locally — will sync when online.`, module: 'Finance' }) }
  }
  const deleteCreditor = async (id: string) => {
    const saved = creditors.find(x => x.id === id)
    setCreditors(p => { const next = p.filter(x => x.id !== id); saveSnap('creditors', next); return next })
    const ok = await persistDelete('erp_creditors', id)
    if (!ok && isOnlineRef.current && saved) { setCreditors(p => [saved, ...p]); dispatchNotif({ type: 'error', title: 'Delete Failed', body: 'Creditor delete failed. Reverted.', module: 'Finance' }) }
    else if (!ok) { dispatchNotif({ type: 'warning', title: 'Delete Queued', body: 'Delete will sync when online.', module: 'Finance' }) }
    else { dispatchNotif({ type: 'success', title: 'Creditor Deleted', body: `${saved?.name ?? 'Creditor'} removed from system and database.`, module: 'Finance' }) }
  }
  const addCreditorTransaction = (creditorId: string, tx: CreditorTransaction) => {
    setCreditors(p => {
      const next = p.map(c => {
        if (c.id !== creditorId) return c
        const txs = [...(c.transactions ?? []), tx]
        // Recalculate outstanding amount = openingBalance + debits - credits
        const finalAmt = txs.reduce((s, t) => s + t.debit - t.credit, c.openingBalance ?? 0)
        const updatedStatus: Creditor['status'] = finalAmt <= 0 ? 'Settled' : tx.credit > 0 ? 'Partial' : c.status
        const updated: Creditor = { ...c, transactions: txs, amount: Math.max(0, finalAmt), status: updatedStatus }
        void updateCreditor(updated)
        return updated
      })
      saveSnap('creditors', next)
      return next
    })
  }

  /* ── Suppliers ───────────────────────────────────────────── */
  const addSupplier = async (s: Supplier) => {
    setSuppliers(p => { const next = [s, ...p]; saveSnap('suppliers', next); return next })
    persistRow('erp_suppliers', { id: s.id, name: s.name, contact: s.contact, phone: s.phone, category: s.category, terms: s.terms, created_at: now() })
    dispatchNotif({ type: 'success', title: 'Supplier Added', body: `${s.name} added to suppliers.`, module: 'Procurement' })
  }
  const updateSupplier = async (s: Supplier) => {
    setSuppliers(p => { const next = p.map(x => x.id === s.id ? s : x); saveSnap('suppliers', next); return next })
    persistRow('erp_suppliers', { id: s.id, name: s.name, contact: s.contact, phone: s.phone, category: s.category, terms: s.terms, created_at: now() })
  }
  const deleteSupplier = async (id: string) => {
    const saved = suppliers.find(x => x.id === id)
    setSuppliers(p => { const next = p.filter(x => x.id !== id); saveSnap('suppliers', next); return next })
    const ok = await persistDelete('erp_suppliers', id)
    if (!ok && isOnlineRef.current && saved) { setSuppliers(p => [saved, ...p]); dispatchNotif({ type: 'error', title: 'Delete Failed', body: 'Supplier delete failed. Reverted.', module: 'Procurement' }) }
    else if (!ok) { dispatchNotif({ type: 'warning', title: 'Delete Queued', body: 'Delete will sync when online.', module: 'Procurement' }) }
    else { dispatchNotif({ type: 'success', title: 'Supplier Deleted', body: `${saved?.name ?? 'Supplier'} removed from system and database.`, module: 'Procurement' }) }
  }

  /* ── Employees ───────────────────────────────────────────── */
  const addEmployee = async (e: Employee) => {
    setEmployees(p => { const next = [e, ...p]; saveSnap('employees', next); return next })
    persistRow('erp_employees', { id: e.id, name: e.name, dept: e.dept, role: e.role, email: e.email, phone: e.phone, status: e.status, joined: e.joined, created_at: now() })
    dispatchNotif({ type: 'success', title: 'Employee Added', body: `${e.name} added to HR.`, module: 'HR' })
  }
  const updateEmployee = async (e: Employee) => {
    setEmployees(p => { const next = p.map(x => x.id === e.id ? e : x); saveSnap('employees', next); return next })
    persistRow('erp_employees', { id: e.id, name: e.name, dept: e.dept, role: e.role, email: e.email, phone: e.phone, status: e.status, joined: e.joined, created_at: now() })
  }
  const deleteEmployee = async (id: string) => {
    const saved = employees.find(x => x.id === id)
    setEmployees(p => { const next = p.filter(x => x.id !== id); saveSnap('employees', next); return next })
    const ok = await persistDelete('erp_employees', id)
    if (!ok && isOnlineRef.current && saved) { setEmployees(p => [saved, ...p]); dispatchNotif({ type: 'error', title: 'Delete Failed', body: 'Employee delete failed. Reverted.', module: 'HR' }) }
    else if (!ok) { dispatchNotif({ type: 'warning', title: 'Delete Queued', body: 'Delete will sync when online.', module: 'HR' }) }
    else { dispatchNotif({ type: 'success', title: 'Employee Deleted', body: `${saved?.name ?? 'Employee'} removed from system and database.`, module: 'HR' }) }
  }

  /* ── Sales Orders ────────────────────────────────────────── */
  const addSalesOrder = async (o: SalesOrder) => {
    // Compute amountPaid / balance from paymentType
    const amountPaid = o.paymentType === 'Full Payment' ? o.total : (o.amountPaid ?? 0)
    const balance = Math.max(0, o.total - amountPaid)
    const enriched: SalesOrder = { ...o, amountPaid, balance }
    setSalesOrders(p => { const next = [enriched, ...p]; saveSnap('salesOrders', next); return next })
    persistRow('erp_sales_orders', { id: enriched.id, customer: enriched.customer, date: enriched.date, items: enriched.items, total: enriched.total, status: enriched.status, payment_type: enriched.paymentType, rep: enriched.rep, notes: enriched.notes, amount_paid: amountPaid, balance, created_at: now() })
    dispatchNotif({ type: 'success', title: 'Sales Order Created', body: `${enriched.id} — ${enriched.customer} · TZS ${enriched.total.toLocaleString()}`, module: 'Sales' })
    // Auto-register in Operations Scheduler
    const soEv: ScheduleEvent = { id: `SCHE-SO-${enriched.id}`, date: enriched.date, title: `Sales: ${enriched.id} — ${enriched.customer} · TZS ${enriched.total.toLocaleString()}`, type: 'sales' }
    setScheduleEvents(p => { const next = p.some(x => x.id === soEv.id) ? p : [...p, soEv]; saveSnap('scheduleEvents', next); return next })
    persistRow('erp_schedule_events', { id: soEv.id, date: soEv.date, title: soEv.title, type: soEv.type, time: null, notes: null, created_at: now() })
    // Deduct soldQty from inventory immediately on order creation (any status except Cancelled)
    if (enriched.status !== 'Cancelled' && enriched.items.length > 0) {
      setItems(prev => {
        const next = prev.map(inv => {
          const matched = enriched.items.find(oi => oi.name.toLowerCase() === inv.name.toLowerCase())
          if (!matched) return inv
          const newSoldQty = (inv.soldQty ?? 0) + matched.qty
          const newQty = Math.max(0, inv.qty - matched.qty)
          // receivedQty stays unchanged — it reflects supplier receipts only
          const updated = { ...inv, soldQty: newSoldQty, qty: newQty }
          persistRow('erp_items', itemRow(updated))
          return updated
        })
        saveSnap('items', next)
        return next
      })
    }
    // Auto-create creditor record when sale is on credit
    if (enriched.paymentType === 'Full Credit' || enriched.paymentType === 'Partial') {
      const creditAmt = balance
      const due30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      const cred: Creditor = { id: `CR-SO-${enriched.id}`, name: enriched.customer, type: 'other', amount: creditAmt, dueDate: due30, status: 'Outstanding', notes: `Credit sale — ${enriched.id}`, transactions: [{ id: `TX-${enriched.id}`, date: enriched.date, reference: enriched.id, description: `Invoice — ${enriched.paymentType}`, debit: creditAmt, credit: 0, balance: creditAmt }] }
      setCreditors(p => { const next = p.some(x => x.id === cred.id) ? p : [cred, ...p]; saveSnap('creditors', next); return next })
      persistRow('erp_creditors', { id: cred.id, name: cred.name, type: cred.type, amount: cred.amount, due_date: cred.dueDate, status: cred.status, notes: cred.notes, created_at: now() })
      sysJournal('adjustment', enriched.id, `Credit Sale — ${enriched.customer} (${enriched.paymentType}) TZS ${creditAmt.toLocaleString()} outstanding`, creditAmt, 0)
    }
  }
  const updateSalesOrder = async (o: SalesOrder) => {
    const prev = salesOrders.find(x => x.id === o.id)
    const amountPaid = o.paymentType === 'Full Payment' ? o.total : (o.amountPaid ?? 0)
    const balance = Math.max(0, o.total - amountPaid)
    const enriched: SalesOrder = { ...o, amountPaid, balance }
    setSalesOrders(p => { const next = p.map(x => x.id === enriched.id ? enriched : x); saveSnap('salesOrders', next); return next })
    // Re-deduct soldQty when status changes FROM Cancelled back to active
    if (prev?.status === 'Cancelled' && enriched.status !== 'Cancelled' && enriched.items.length > 0) {
      setItems(prev2 => {
        const next = prev2.map(inv => {
          const matched = enriched.items.find(oi => oi.name.toLowerCase() === inv.name.toLowerCase())
          if (!matched) return inv
          const newSoldQty = (inv.soldQty ?? 0) + matched.qty
          const newQty = Math.max(0, inv.qty - matched.qty)
          const updated = { ...inv, soldQty: newSoldQty, qty: newQty }
          persistRow('erp_items', itemRow(updated))
          return updated
        })
        saveSnap('items', next)
        return next
      })
    }
    // Restore soldQty when order is cancelled
    if (enriched.status === 'Cancelled' && prev?.status !== 'Cancelled' && enriched.items.length > 0) {
      setItems(prev2 => {
        const next = prev2.map(inv => {
          const matched = enriched.items.find(oi => oi.name.toLowerCase() === inv.name.toLowerCase())
          if (!matched) return inv
          const restoredSold = Math.max(0, (inv.soldQty ?? 0) - matched.qty)
          const restoredQty = inv.qty + matched.qty
          const updated = { ...inv, soldQty: restoredSold, qty: restoredQty }
          persistRow('erp_items', itemRow(updated))
          return updated
        })
        saveSnap('items', next)
        return next
      })
    }
    const ok = await persistRow('erp_sales_orders', { id: enriched.id, customer: enriched.customer, date: enriched.date, items: enriched.items, total: enriched.total, status: enriched.status, payment_type: enriched.paymentType, rep: enriched.rep, notes: enriched.notes, amount_paid: amountPaid, balance })
    if (!ok) { dispatchNotif({ type: 'warning', title: 'Queued for Sync', body: `${enriched.id} update saved locally — will sync when online.`, module: 'Sales' }) }
    // Sync linked creditor so Finance reflects payment changes instantly
    if (enriched.paymentType === 'Full Credit' || enriched.paymentType === 'Partial') {
      const linkedCreditorId = `CR-SO-${enriched.id}`
      setCreditors(p => {
        const cred = p.find(x => x.id === linkedCreditorId)
        if (!cred) return p
        const newStatus: Creditor['status'] = balance <= 0 ? 'Settled' : amountPaid > 0 ? 'Partial' : 'Outstanding'
        const updated: Creditor = { ...cred, amount: balance, status: newStatus }
        const next = p.map(x => x.id === linkedCreditorId ? updated : x)
        saveSnap('creditors', next)
        persistRow('erp_creditors', { id: updated.id, name: updated.name, type: updated.type, amount: updated.amount, due_date: updated.dueDate, status: updated.status, notes: updated.notes, transactions: updated.transactions ?? null, payment_history: updated.paymentHistory ?? null })
        return next
      })
    }
  }
  const deleteSalesOrder = async (id: string) => {
    const saved = salesOrders.find(x => x.id === id)
    setSalesOrders(p => { const next = p.filter(x => x.id !== id); saveSnap('salesOrders', next); return next })
    const ok = await persistDelete('erp_sales_orders', id)
    if (!ok && isOnlineRef.current && saved) { setSalesOrders(p => [saved, ...p]); dispatchNotif({ type: 'error', title: 'Delete Failed', body: 'Sales order delete failed. Reverted.', module: 'Sales' }) }
    else if (!ok) { dispatchNotif({ type: 'warning', title: 'Delete Queued', body: 'Delete will sync when online.', module: 'Sales' }) }
  }

  /* ── Purchase Orders ─────────────────────────────────────── */
  const poRow = (o: PurchaseOrder, isNew = false) => ({
    id: o.id, supplier: o.supplier, date: o.date, delivery: o.delivery || null,
    received_date: o.receivedDate ?? null, items: o.items, total: o.total,
    status: o.status, buyer: o.buyer, notes: o.notes,
    payment_method: o.paymentMethod ?? null, payment_type: o.paymentType ?? null,
    payment_status: o.paymentStatus ?? 'Unpaid',
    amount_paid: o.amountPaid ?? 0, balance: o.balance ?? o.total,
    payment_installments: o.paymentInstallments ?? null,
    ...(isNew ? { created_at: now() } : {}),
  })
  const addPurchaseOrder = async (o: PurchaseOrder) => {
    const enriched: PurchaseOrder = { ...o, paymentStatus: o.paymentStatus ?? 'Unpaid', amountPaid: o.amountPaid ?? 0, balance: o.balance ?? o.total, paymentInstallments: o.paymentInstallments ?? [] }
    setPurchaseOrders(p => { const next = [enriched, ...p]; saveSnap('purchaseOrders', next); return next })
    persistRow('erp_purchase_orders', poRow(enriched, true))
    dispatchNotif({ type: 'info', title: 'Purchase Order Created', body: `${o.id} — ${o.supplier} · TZS ${o.total.toLocaleString()}`, module: 'Procurement' })
    sysJournal('purchase', o.id, `Purchase Order — ${o.supplier} · ${o.items?.length ?? 0} item(s) · TZS ${o.total.toLocaleString()}`, o.total, 0)
    const poEv: ScheduleEvent = { id: `SCHE-PO-${o.id}`, date: o.date, title: `Purchase: ${o.id} — ${o.supplier} · TZS ${o.total.toLocaleString()}`, type: 'procurement' }
    setScheduleEvents(p => { const next = p.some(x => x.id === poEv.id) ? p : [...p, poEv]; saveSnap('scheduleEvents', next); return next })
    persistRow('erp_schedule_events', { id: poEv.id, date: poEv.date, title: poEv.title, type: poEv.type, time: null, notes: null, created_at: now() })
  }
  const updatePurchaseOrder = async (o: PurchaseOrder) => {
    setPurchaseOrders(p => { const next = p.map(x => x.id === o.id ? o : x); saveSnap('purchaseOrders', next); return next })
    const ok = await persistRow('erp_purchase_orders', poRow(o))
    if (!ok) { dispatchNotif({ type: 'warning', title: 'Queued for Sync', body: `${o.id} update saved locally — will sync when online.`, module: 'Procurement' }) }
  }
  const deletePurchaseOrder = async (id: string) => {
    const saved = purchaseOrders.find(x => x.id === id)
    setPurchaseOrders(p => { const next = p.filter(x => x.id !== id); saveSnap('purchaseOrders', next); return next })
    const ok = await persistDelete('erp_purchase_orders', id)
    if (!ok && isOnlineRef.current && saved) { setPurchaseOrders(p => [saved, ...p]); dispatchNotif({ type: 'error', title: 'Delete Failed', body: 'Purchase order delete failed. Reverted.', module: 'Procurement' }) }
    else if (!ok) { dispatchNotif({ type: 'warning', title: 'Delete Queued', body: 'Delete will sync when online.', module: 'Procurement' }) }
  }

  const addPOInstallment = async (poId: string, inst: POPaymentInstallment) => {
    setPurchaseOrders(p => {
      const next = p.map(o => {
        if (o.id !== poId) return o
        const insts = [...(o.paymentInstallments ?? []), inst]
        const paid = insts.reduce((s, i) => s + i.amount, 0)
        const bal = Math.max(0, o.total - paid)
        const payStatus: PurchaseOrder['paymentStatus'] = bal <= 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid'
        const updated: PurchaseOrder = { ...o, paymentInstallments: insts, amountPaid: paid, balance: bal, paymentStatus: payStatus }
        void updatePurchaseOrder(updated)
        return updated
      })
      saveSnap('purchaseOrders', next)
      return next
    })
    dispatchNotif({ type: 'success', title: 'Payment Recorded', body: `TZS ${inst.amount.toLocaleString()} via ${inst.method} on PO ${poId}`, module: 'Procurement' })
  }

  /* ── Leads ───────────────────────────────────────────────── */
  const addLead = async (l: Lead) => {
    setLeads(p => { const next = [l, ...p]; saveSnap('leads', next); return next })
    persistRow('erp_leads', { id: l.id, name: l.name, company: l.contact || null, phone: l.phone || null, email: l.email || null, stage: l.stage, value: l.value, rep: l.rep || null, last_contact: l.lastContact || null, notes: l.notes || null, created_at: now() })
    dispatchNotif({ type: 'info', title: 'Lead Added', body: `${l.name} — ${l.stage}`, module: 'CRM' })
    sysJournal('adjustment', l.id, `CRM — Lead added: ${l.name} · Stage: ${l.stage} · Value: TZS ${l.value.toLocaleString()}`)
    sysSchedule('CRM', l.id, `Lead added: ${l.name} — ${l.stage}`, 'sales')
  }
  const updateLead = async (l: Lead) => {
    setLeads(p => { const next = p.map(x => x.id === l.id ? l : x); saveSnap('leads', next); return next })
    const ok = await persistRow('erp_leads', { id: l.id, name: l.name, company: l.contact || null, phone: l.phone || null, email: l.email || null, stage: l.stage, value: l.value, rep: l.rep || null, last_contact: l.lastContact || null, notes: l.notes || null })
    if (!ok) { dispatchNotif({ type: 'warning', title: 'Queued for Sync', body: `${l.name} update saved locally — will sync when online.`, module: 'CRM' }) }
  }
  const deleteLead = async (id: string) => {
    const saved = leads.find(x => x.id === id)
    setLeads(p => { const next = p.filter(x => x.id !== id); saveSnap('leads', next); return next })
    const ok = await persistDelete('erp_leads', id)
    if (!ok && isOnlineRef.current && saved) { setLeads(p => [saved, ...p]); dispatchNotif({ type: 'error', title: 'Delete Failed', body: 'Lead delete failed. Reverted.', module: 'CRM' }) }
    else if (!ok) { dispatchNotif({ type: 'warning', title: 'Delete Queued', body: 'Delete will sync when online.', module: 'CRM' }) }
    else { dispatchNotif({ type: 'success', title: 'Lead Deleted', body: `${saved?.name ?? 'Lead'} removed from system and database.`, module: 'CRM' }) }
  }

  /* ── Production Batches ──────────────────────────────────── */
  const deductBatchIngredients = (ingredients: ProductionBatch['ingredients']) => {
    // Use functional update to avoid stale-closure reads on `items`
    const toDeduct = ingredients
      .filter(ing => ing.measure !== 'percentage' && ing.name?.trim() && Number(ing.qty) > 0)
      .map(ing => ({ name: ing.name.trim().toLowerCase(), qty: Number(ing.qty) }))
    if (toDeduct.length === 0) return
    let anyDeducted = false
    setItems(prev => {
      const next = prev.map(inv => {
        const ing = toDeduct.find(d => d.name === inv.name.toLowerCase())
        if (!ing) return inv
        const newQty = Math.max(0, inv.qty - ing.qty)
        const newStatus = newQty === 0 ? 'Out of Stock' : (inv.minQty > 0 && newQty <= inv.minQty ? 'Low Stock' : 'Available')
        // receivedQty is intentionally NOT changed — it always reflects what was physically received from suppliers
        const updated = { ...inv, qty: newQty, usedQty: (inv.usedQty ?? 0) + ing.qty, status: newStatus, updatedAt: now() }
        persistRow('erp_items', itemRow(updated))
        anyDeducted = true
        return updated
      })
      saveSnap('items', next)
      return next
    })
    if (anyDeducted) dispatchNotif({ type: 'info', title: 'Inventory Deducted', body: 'Raw material quantities deducted from inventory for production', module: 'Production' })
  }

  // Registers the completed batch's finished product into Inventory (Finished Goods).
  // Safe to call from both addBatch and updateBatch — uses functional setItems to avoid stale closure.
  const registerFinishedGood = (b: ProductionBatch) => {
    const qty = b.actualQty > 0 ? b.actualQty : b.plannedQty
    if (!qty || !b.product) return
    setItems(prev => {
      const existFG = prev.find(x => x.name.toLowerCase() === b.product.toLowerCase() && (x.category === 'Finished Good' || x.category === 'Finished Goods'))
      let next: InventoryItem[]
      if (existFG) {
        // Only update qty (current stock). receivedQty = original PO receipts only, never touched here.
        const updated = { ...existFG, qty: existFG.qty + qty, status: 'Available', updatedAt: now() }
        next = prev.map(x => x.id === existFG.id ? updated : x)
        persistRow('erp_items', itemRow(updated))
      } else {
        const ts = now()
        const fg: InventoryItem = {
          id: `FG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,5).toUpperCase()}`,
          name: b.product, sku: b.id, category: 'Finished Good', warehouse: 'Finished Goods Store',
          qty, receivedQty: qty, minQty: 0, maxQty: 0, unit: 'units', cost: 0, price: 0,
          reorder: 0, batchNumber: b.id, expiry: '', supplier: '', description: `Auto-registered from production batch ${b.id}`,
          status: 'Available', approvalStatus: 'Approved', pendingChange: '',
          createdAt: ts, updatedAt: ts,
        }
        next = [fg, ...prev]
        persistRow('erp_items', itemRow(fg, true))
      }
      saveSnap('items', next)
      return next
    })
    dispatchNotif({ type: 'success', title: 'Finished Good Registered', body: `${qty} units of "${b.product}" added to Inventory → Finished Goods`, module: 'Production' })
    sysJournal('adjustment', b.id, `Production completed — ${b.product} · ${qty} units added to Finished Goods inventory`)
    const compDate = b.completed || new Date().toISOString().slice(0, 10)
    const compEv: ScheduleEvent = { id: `SCHE-COMP-${b.id}`, date: compDate, title: `Batch Completed: ${b.id} — ${b.product} (${qty} units)`, type: 'production' }
    setScheduleEvents(p => { const next = p.some(x => x.id === compEv.id) ? p : [...p, compEv]; saveSnap('scheduleEvents', next); return next })
    persistRow('erp_schedule_events', { id: compEv.id, date: compEv.date, title: compEv.title, type: compEv.type, time: null, notes: null, created_at: now() })
  }

  const addBatch = async (b: ProductionBatch) => {
    setBatches(p => { const next = [b, ...p]; saveSnap('batches', next); return next })
    persistRow('erp_production_batches', { id: b.id, product: b.product, recipe: b.recipe, line: b.line, planned_qty: b.plannedQty, actual_qty: b.actualQty, ingredients: b.ingredients, started: b.started || null, completed: b.completed || null, status: b.status, notes: b.notes, created_at: now() })
    // Deduct raw materials from inventory when batch starts or is created already completed
    if (b.status === 'In Progress' || b.status === 'Completed') deductBatchIngredients(b.ingredients)
    // Register finished good immediately if batch is created directly as Completed
    if (b.status === 'Completed') registerFinishedGood(b)
    dispatchNotif({ type: 'info', title: 'Production Batch Created', body: `${b.id} — ${b.product}`, module: 'Production' })
    sysJournal('adjustment', b.id, `Production — Batch started: ${b.id} · ${b.product} · ${b.plannedQty} units planned`)
    const batchDate = b.started?.slice(0, 10) || today
    const batchEv: ScheduleEvent = { id: `SCHE-BATCH-${b.id}`, date: batchDate, title: `Production: ${b.id} — ${b.product} (${b.plannedQty} units planned)`, type: 'production' }
    setScheduleEvents(p => { const next = p.some(x => x.id === batchEv.id) ? p : [...p, batchEv]; saveSnap('scheduleEvents', next); return next })
    persistRow('erp_schedule_events', { id: batchEv.id, date: batchEv.date, title: batchEv.title, type: batchEv.type, time: null, notes: null, created_at: now() })
  }

  const updateBatch = async (b: ProductionBatch) => {
    const prev = batches.find(x => x.id === b.id)
    setBatches(p => { const next = p.map(x => x.id === b.id ? b : x); saveSnap('batches', next); return next })
    const ok = await persistRow('erp_production_batches', { id: b.id, product: b.product, recipe: b.recipe, line: b.line, planned_qty: b.plannedQty, actual_qty: b.actualQty, ingredients: b.ingredients, started: b.started, completed: b.completed, status: b.status, notes: b.notes })
    if (!ok) dispatchNotif({ type: 'warning', title: 'Queued for Sync', body: `${b.id} update saved locally — will sync when online.`, module: 'Production' })
    // Deduct ingredients when transitioning to In Progress (first time)
    if (b.status === 'In Progress' && prev?.status !== 'In Progress') deductBatchIngredients(b.ingredients)
    // Deduct ingredients when jumping straight from Scheduled/Failed to Completed (skipping In Progress)
    if (b.status === 'Completed' && prev?.status !== 'Completed' && prev?.status !== 'In Progress') deductBatchIngredients(b.ingredients)
    // Register finished good in inventory whenever batch transitions to Completed
    if (b.status === 'Completed' && prev?.status !== 'Completed') registerFinishedGood(b)
  }
  const deleteBatch = async (id: string) => {
    const saved = batches.find(x => x.id === id)
    setBatches(p => { const next = p.filter(x => x.id !== id); saveSnap('batches', next); return next })
    const ok = await persistDelete('erp_production_batches', id)
    if (!ok && isOnlineRef.current && saved) { setBatches(p => [saved, ...p]); dispatchNotif({ type: 'error', title: 'Delete Failed', body: 'Batch delete failed. Reverted.', module: 'Production' }) }
    else if (!ok) { dispatchNotif({ type: 'warning', title: 'Delete Queued', body: 'Delete will sync when online.', module: 'Production' }) }
  }

  /* ── Journal helpers ─────────────────────────────────────── */
  // sysJournal — tracks every system action automatically in the journal
  const sysJournal = (type: JournalEntry['type'], ref: string, description: string, debit = 0, credit = 0) => {
    const entry: JournalEntry = {
      id: `JE-SYS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
      date: today, ref, description, debit, credit, type,
    }
    setJournalEntries(p => { const next = p.some(x => x.id === entry.id) ? p : [entry, ...p]; saveSnap('journal', next); return next })
    persistRow('erp_journal', { id: entry.id, date: entry.date, ref: entry.ref, description: entry.description, debit, credit, type, created_at: now() })
  }
  const sysSchedule = (module: string, ref: string, title: string, evType = 'other') => {
    const evId = `SCHE-SYS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,5).toUpperCase()}`
    const ev: ScheduleEvent = { id: evId, date: today, title: `[${module}] ${title}`, type: evType }
    setScheduleEvents(p => p.some(x => x.id === evId) ? p : [...p, ev])
    persistRow('erp_schedule_events', { id: evId, date: today, title: ev.title, type: evType, time: null, notes: `ref:${ref}`, created_at: now() })
  }
  const addSalesJournal = (ref: string, customer: string, amount: number) => {
    const entry: JournalEntry = { id: `JE-SO-${Date.now().toString(36).toUpperCase()}`, date: today, ref, description: `Sales — ${customer}`, debit: 0, credit: amount, type: 'sales' }
    setJournalEntries(p => { const next = p.some(x => x.id === entry.id) ? p : [entry, ...p]; saveSnap('journal', next); return next })
    persistRow('erp_journal', { id: entry.id, date: entry.date, ref: entry.ref, description: entry.description, debit: 0, credit: amount, type: 'sales', created_at: now() })
  }
  const addPurchaseJournal = (ref: string, supplier: string, amount: number) => {
    const entry: JournalEntry = { id: `JE-PO-${Date.now().toString(36).toUpperCase()}`, date: today, ref, description: `Purchase — ${supplier}`, debit: amount, credit: 0, type: 'purchase' }
    setJournalEntries(p => { const next = p.some(x => x.id === entry.id) ? p : [entry, ...p]; saveSnap('journal', next); return next })
    persistRow('erp_journal', { id: entry.id, date: entry.date, ref: entry.ref, description: entry.description, debit: amount, credit: 0, type: 'purchase', created_at: now() })
  }
  const addManualJournal = (entry: Omit<JournalEntry, 'id'>) => {
    const full: JournalEntry = { id: `JE-MAN-${Date.now().toString(36).toUpperCase()}`, ...entry }
    setJournalEntries(p => { const next = p.some(x => x.id === full.id) ? p : [full, ...p]; saveSnap('journal', next); return next })
    persistRow('erp_journal', { id: full.id, date: full.date, ref: full.ref, description: full.description, debit: full.debit, credit: full.credit, type: full.type, created_at: now() })
  }

  const clearJournal = async (): Promise<{ count: number; error: string | null }> => {
    const count = journalEntries.length
    // Wipe Supabase table
    const { error } = await supabase.from('erp_journal').delete().gte('id', '')
    if (error) return { count: 0, error: error.message }
    // Clear React state + localStorage
    setJournalEntries([])
    saveSnap('journal', [])
    return { count, error: null }
  }

  /* ── Expenditures ────────────────────────────────────────── */
  const addExpenditure = async (e: Expenditure) => {
    setExpenditures(p => { const next = [e, ...p]; saveSnap('expenditures', next); return next })
    persistRow('erp_expenditures', { id: e.id, date: e.date, category: e.category, description: e.description, amount: e.amount, payee: e.payee, payment_method: e.paymentMethod, reference: e.reference, approved_by: e.approvedBy, status: e.status, notes: e.notes, created_by: e.createdBy, created_at: e.createdAt })
    dispatchNotif({ type: 'warning', title: 'Expenditure Recorded', body: `${e.description} — TZS ${e.amount.toLocaleString()}`, module: 'Procurement' })
    sysJournal('purchase', e.id, `Expenditure — ${e.category}: ${e.description} · TZS ${e.amount.toLocaleString()} payable to ${e.payee}`, e.amount, 0)
  }
  const updateExpenditure = async (e: Expenditure) => {
    setExpenditures(p => { const next = p.map(x => x.id === e.id ? e : x); saveSnap('expenditures', next); return next })
    const ok = await persistRow('erp_expenditures', { id: e.id, date: e.date, category: e.category, description: e.description, amount: e.amount, payee: e.payee, payment_method: e.paymentMethod, reference: e.reference, approved_by: e.approvedBy, status: e.status, notes: e.notes, created_by: e.createdBy })
    if (!ok) dispatchNotif({ type: 'warning', title: 'Queued for Sync', body: `${e.description} update saved locally.`, module: 'Procurement' })
  }
  const deleteExpenditure = async (id: string) => {
    const saved = expenditures.find(x => x.id === id)
    setExpenditures(p => { const next = p.filter(x => x.id !== id); saveSnap('expenditures', next); return next })
    const ok = await persistDelete('erp_expenditures', id)
    if (!ok && isOnlineRef.current && saved) { setExpenditures(p => [saved, ...p]); dispatchNotif({ type: 'error', title: 'Delete Failed', body: 'Expenditure delete failed. Reverted.', module: 'Procurement' }) }
    else if (!ok) dispatchNotif({ type: 'warning', title: 'Delete Queued', body: 'Delete will sync when online.', module: 'Procurement' })
  }

  /* ── Schedule Events ──────────────────────────────────────── */
  const addScheduleEvent = (ev: ScheduleEvent) => {
    setScheduleEvents(p => { const next = p.some(x => x.id === ev.id) ? p : [...p, ev]; saveSnap('scheduleEvents', next); return next })
    persistRow('erp_schedule_events', {
      id: ev.id, date: ev.date, title: ev.title, type: ev.type,
      time: ev.time ?? null, notes: ev.notes ?? null,
      created_at: now(),
    })
  }

  const deleteScheduleEvent = (id: string) => {
    setScheduleEvents(p => { const next = p.filter(e => e.id !== id); saveSnap('scheduleEvents', next); return next })
    persistDelete('erp_schedule_events', id)
  }

  return (
    <AppContext.Provider value={{
      items, isLoading, addItem, updateItem, deleteItem, refreshItems,
      requestItemEdit, approveItemEdit, rejectItemEdit,
      clients, addClient, updateClient, deleteClient,
      suppliers, addSupplier, updateSupplier, deleteSupplier,
      creditors, addCreditor, updateCreditor, deleteCreditor, addCreditorTransaction,
      employees, addEmployee, updateEmployee, deleteEmployee,
      journalEntries, addSalesJournal, addPurchaseJournal, addManualJournal, clearJournal,
      salesOrders, addSalesOrder, updateSalesOrder, deleteSalesOrder,
      purchaseOrders, addPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, addPOInstallment,
      leads, addLead, updateLead, deleteLead,
      batches, addBatch, updateBatch, deleteBatch,
      scheduleEvents, addScheduleEvent, deleteScheduleEvent,
      expenditures, addExpenditure, updateExpenditure, deleteExpenditure,
      currentUser, setCurrentUser, userId, isOnline, pendingSync,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() { return useContext(AppContext) }

