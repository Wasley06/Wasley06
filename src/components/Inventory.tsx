import { useState, useMemo } from 'react'
import { Search, Download, Plus, AlertTriangle, Package, RefreshCw, Pencil, Trash2, Eye, X, TrendingUp, ChevronUp, ChevronDown } from 'lucide-react'
import FloatingModal, { FormRow, Field } from './FloatingModal'
import { useApp, type InventoryItem } from '../context/AppContext'
import { exportTablePdf } from '../utils/exportPdf'
import fabegonLogo from '@/imports/ChatGPT_Image_Jun_27__2026__02_20_03_AM.png'

/* ── Constants ───────────────────────────────────────────────── */
const WAREHOUSES = ['Main Store', 'Dispatch Bay', 'Stationery', 'Packaging Area', 'Grain Shed', 'Cold Storage', 'Bonded Store']
const CATEGORIES = ['Raw Material', 'Finished Good', 'Consumable', 'By-Product', 'Packaging', 'Maintenance', 'Office Supplies', 'Other']
const UNITS      = ['kg', 'g', 'tonnes', 'litres', 'ml', 'pcs', 'bags', 'cartons', 'boxes', 'rolls', 'pairs', 'metres', 'units']

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  'Available':        { bg: 'rgba(34,197,94,0.12)',  color: '#22C55E' },
  'Low Stock':        { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B' },
  'Out of Stock':     { bg: 'rgba(239,68,68,0.12)',  color: '#EF4444' },
  'Reserved':         { bg: 'rgba(61,127,255,0.12)', color: '#3D7FFF' },
  'Damaged':          { bg: 'rgba(239,68,68,0.1)',   color: '#DC2626' },
  'Expired':          { bg: 'rgba(100,116,139,0.2)', color: '#64748B' },
  'Pending Approval': { bg: 'rgba(245,158,11,0.1)',  color: '#F59E0B' },
  'Inactive':         { bg: 'rgba(100,116,139,0.15)',color: '#94A3B8' },
}

/* ── Auto-compute status from quantities ─────────────────────── */
function autoStatus(qty: number, minQty: number): string {
  if (qty === 0) return 'Out of Stock'
  if (minQty > 0 && qty <= minQty) return 'Low Stock'
  return 'Available'
}

/* ── Auto-generate SKU ───────────────────────────────────────── */
function genSKU(name: string): string {
  const prefix = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3) || 'ITM'
  return `${prefix}-${Date.now().toString(36).toUpperCase().slice(-4)}`
}

function now() { return new Date().toISOString() }

const INP: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit',
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  color: 'var(--foreground)', outline: 'none', boxSizing: 'border-box',
  colorScheme: 'dark',
}

/* ── Add Item form — matches screenshot ──────────────────────── */
function AddItemModal({
  suppliers: supplierNames,
  onSave,
  onClose,
}: {
  suppliers: string[]
  onSave: (data: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => void
  onClose: () => void
}) {
  const [name,         setName]         = useState('')
  const [category,     setCategory]     = useState('Raw Material')
  const [warehouse,    setWarehouse]    = useState('Main Store')
  const [unit,         setUnit]         = useState('kg')
  const [qty,          setQty]          = useState('0')
  const [cost,         setCost]         = useState('0')
  const [reorder,      setReorder]      = useState('0')
  const [expiry,       setExpiry]       = useState('')
  const [supplier,     setSupplier]     = useState('')
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().slice(0, 10))

  const handleSave = () => {
    if (!name.trim()) return
    const qtyN     = Number(qty)    || 0
    const reorderN = Number(reorder) || 0
    onSave({
      name: name.trim(),
      sku: genSKU(name),
      category,
      warehouse,
      unit,
      qty: qtyN,
      minQty: reorderN,
      maxQty: 0,
      cost: Number(cost) || 0,
      price: 0,
      reorder: reorderN,
      batchNumber: '',
      expiry: expiry || '',
      supplier: supplier || '',
      description: '',
      status: autoStatus(qtyN, reorderN),
      approvalStatus: 'Approved',
      pendingChange: '',
      receivedDate: receivedDate || undefined,
    } as any)
  }

  return (
    <FloatingModal
      title="Add Inventory Item"
      subtitle="Add a new item to the warehouse"
      onClose={onClose}
      width={600}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!name.trim()}
            style={{ opacity: !name.trim() ? 0.5 : 1 }}>
            Save Item
          </button>
        </>
      }
    >
      <Field label="Item Name">
        <input style={INP} value={name} onChange={e => setName(e.target.value)}
          placeholder="e.g. Maize Flour 2kg" autoFocus />
      </Field>
      <FormRow>
        <Field label="Category">
          <select className="input-base" value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Warehouse">
          <select className="input-base" value={warehouse} onChange={e => setWarehouse(e.target.value)}>
            {WAREHOUSES.map(w => <option key={w}>{w}</option>)}
          </select>
        </Field>
      </FormRow>
      <FormRow>
        <Field label="Unit">
          <input style={INP} list="inv-units-add" value={unit} onChange={e => setUnit(e.target.value)} />
          <datalist id="inv-units-add">{UNITS.map(u => <option key={u} value={u} />)}</datalist>
        </Field>
        <Field label="Quantity">
          <input style={INP} type="number" min="0" value={qty} onChange={e => setQty(e.target.value)} />
        </Field>
      </FormRow>
      <FormRow>
        <Field label="Unit Cost (TZS)">
          <input style={INP} type="number" min="0" value={cost} onChange={e => setCost(e.target.value)} placeholder="0" />
        </Field>
        <Field label="Reorder Level">
          <input style={INP} type="number" min="0" value={reorder} onChange={e => setReorder(e.target.value)} placeholder="0" />
        </Field>
      </FormRow>
      <Field label="Supplier (optional)">
        <input style={INP} list="inv-sup-add" value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Type or select supplier…" />
        <datalist id="inv-sup-add">{supplierNames.map(s => <option key={s} value={s} />)}</datalist>
      </Field>

      <FormRow>
        <Field label="Date Received">
          <input style={INP} type="date" value={receivedDate} onChange={e => setReceivedDate(e.target.value)} />
        </Field>
        <Field label="Expiry Date (optional)">
          <input style={INP} type="date" value={expiry} onChange={e => setExpiry(e.target.value)} />
        </Field>
      </FormRow>
    </FloatingModal>
  )
}

/* ── Edit Item modal ─────────────────────────────────────────── */
function EditItemModal({
  item, suppliers: supplierNames, onSave, onClose,
}: { item: InventoryItem; suppliers: string[]; onSave: (i: InventoryItem) => void; onClose: () => void }) {
  const [d, setD] = useState(item)
  const set = (f: keyof InventoryItem, v: string | number) => setD(p => ({ ...p, [f]: v }))

  return (
    <FloatingModal title={`Edit: ${item.name}`} subtitle={item.id} onClose={onClose} width={600}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={() => onSave({
          ...d,
          qty: Number(d.qty) || 0, minQty: Number(d.minQty) || 0,
          cost: Number(d.cost) || 0, price: Number(d.price) || 0, reorder: Number(d.reorder) || 0,
          status: autoStatus(Number(d.qty) || 0, Number(d.minQty) || 0),
          updatedAt: now(),
        })}>Save Changes</button>
      </>}
    >
      <Field label="Item Name">
        <input style={INP} value={d.name} onChange={e => set('name', e.target.value)} />
      </Field>
      <FormRow>
        <Field label="Category">
          <select className="input-base" value={d.category} onChange={e => set('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Warehouse">
          <select className="input-base" value={d.warehouse} onChange={e => set('warehouse', e.target.value)}>
            {WAREHOUSES.map(w => <option key={w}>{w}</option>)}
          </select>
        </Field>
      </FormRow>
      <FormRow>
        <Field label="Unit">
          <input style={INP} list="inv-units-edit" value={d.unit} onChange={e => set('unit', e.target.value)} />
          <datalist id="inv-units-edit">{UNITS.map(u => <option key={u} value={u} />)}</datalist>
        </Field>
        <Field label="Quantity">
          <input style={INP} type="number" min="0" value={d.qty} onChange={e => set('qty', e.target.value)} />
        </Field>
      </FormRow>
      <FormRow>
        <Field label="Unit Cost (TZS)">
          <input style={INP} type="number" min="0" value={d.cost} onChange={e => set('cost', e.target.value)} />
        </Field>
        <Field label="Selling Price (TZS)">
          <input style={INP} type="number" min="0" value={d.price} onChange={e => set('price', e.target.value)} />
        </Field>
      </FormRow>
      <FormRow>
        <Field label="Reorder Level">
          <input style={INP} type="number" min="0" value={d.reorder} onChange={e => set('reorder', e.target.value)} />
        </Field>
        <Field label="Min Qty">
          <input style={INP} type="number" min="0" value={d.minQty} onChange={e => set('minQty', e.target.value)} />
        </Field>
      </FormRow>
      <Field label="Supplier">
        <input style={INP} list="inv-sup-edit" value={d.supplier} onChange={e => set('supplier', e.target.value)} />
        <datalist id="inv-sup-edit">{supplierNames.map(s => <option key={s} value={s} />)}</datalist>
      </Field>
      <FormRow>
        <Field label="Batch Number">
          <input style={INP} value={d.batchNumber} onChange={e => set('batchNumber', e.target.value)} placeholder="e.g. BT-2024-001" />
        </Field>
        <Field label="Expiry Date">
          <input style={INP} type="date" value={d.expiry} onChange={e => set('expiry', e.target.value)} />
        </Field>
      </FormRow>
      <Field label="Description">
        <textarea style={{ ...INP, resize: 'vertical' } as React.CSSProperties} rows={2}
          value={d.description} onChange={e => set('description', e.target.value)} placeholder="Optional…" />
      </Field>
    </FloatingModal>
  )
}

/* ── View modal ──────────────────────────────────────────────── */
function ViewItemModal({ item, onClose, onEdit }: { item: InventoryItem; onClose: () => void; onEdit: () => void }) {
  const invValue = item.qty * item.cost
  const rows: [string, string | number][] = [
    ['Item ID', item.id], ['SKU', item.sku || '—'], ['Name', item.name],
    ['Category', item.category], ['Warehouse', item.warehouse],
    ['Quantity', `${item.qty.toLocaleString()} ${item.unit}`],
    ['Unit Cost', `TZS ${item.cost.toLocaleString()}`],
    ['Selling Price', `TZS ${item.price.toLocaleString()}`],
    ['Inventory Value', `TZS ${invValue.toLocaleString()}`],
    ['Reorder Level', item.reorder || '—'], ['Min Qty', item.minQty || '—'],
    ['Batch No.', item.batchNumber || '—'], ['Expiry', item.expiry || '—'],
    ['Supplier', item.supplier || '—'], ['Status', item.status],
    ['Approval', item.approvalStatus],
    ['Created', item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-TZ') : '—'],
  ]

  return (
    <FloatingModal title="Item Details" subtitle={item.id} onClose={onClose} width={640}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
        <button className="btn btn-primary" onClick={onEdit}>Edit Item</button>
      </>}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {rows.map(([label, value]) => (
          <div key={label} style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--secondary)' }}>
            <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
            <div style={{ fontSize: '13px', color: 'var(--foreground)', fontWeight: 500, marginTop: '3px' }}>{String(value)}</div>
          </div>
        ))}
      </div>
    </FloatingModal>
  )
}

/* ── Category pill ───────────────────────────────────────────── */
const CAT_PILLS = ['All', 'Raw Material', 'Finished Good', 'Consumable', 'By-Product']

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 15px', borderRadius: '999px', fontSize: '13px', fontWeight: active ? 600 : 500,
      fontFamily: 'inherit', cursor: 'pointer', border: 'none', transition: 'all 0.15s',
      background: active ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
      color: active ? 'white' : 'var(--secondary-foreground)',
    }}>
      {label}
    </button>
  )
}

/* ── Main Inventory component ───────────────────────────────── */
export default function Inventory() {
  const { items: _items, isLoading, addItem, updateItem, deleteItem, refreshItems, suppliers: _suppliers } = useApp()
  const items         = _items     ?? []
  const suppliers     = _suppliers ?? []
  const supplierNames = suppliers.map(s => s.name)

  const [search,    setSearch]    = useState('')
  const [filterCat, setFilterCat] = useState('All')
  const [showAdd,   setShowAdd]   = useState(false)
  const [editTgt,   setEditTgt]   = useState<InventoryItem | null>(null)
  const [viewTgt,   setViewTgt]   = useState<InventoryItem | null>(null)
  const [deleteTgt, setDeleteTgt] = useState<InventoryItem | null>(null)
  const [isSaving,  setIsSaving]  = useState(false)
  const [sortKey,   setSortKey]   = useState<'name' | 'category' | 'qty' | 'cost' | 'status' | 'createdAt'>('createdAt')
  const [sortDir,   setSortDir]   = useState<'asc' | 'desc'>('desc')

  const toggleSort = (k: typeof sortKey) => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(k); setSortDir('asc') }
  }

  /* ── Stats ───────────────────────────────────────────────── */
  const totalItems = items.length
  const lowStock   = items.filter(i => i.qty > 0 && i.minQty > 0 && i.qty <= i.minQty).length
  const outOfStock = items.filter(i => i.qty === 0).length
  const totalValue = items.reduce((s, i) => s + i.qty * i.cost, 0)
  const warehouses = [...new Set(items.map(i => i.warehouse).filter(Boolean))]

  /* ── Filtered + sorted ───────────────────────────────────── */
  const filtered = useMemo(() => {
    const base = items.filter(i => {
      const q  = search.toLowerCase()
      const ms = !q || i.name.toLowerCase().includes(q) || (i.sku ?? '').toLowerCase().includes(q) || i.id.toLowerCase().includes(q)
      const finishedGoodPill = filterCat === 'Finished Good'
      const mc = filterCat === 'All'
        || i.category === filterCat
        || (finishedGoodPill && (i.category === 'Finished Good' || i.category === 'Finished Goods'))
      return ms && mc
    })
    return [...base].sort((a, b) => {
      let av: string | number, bv: string | number
      if (sortKey === 'qty')  { av = a.qty;  bv = b.qty }
      else if (sortKey === 'cost') { av = a.cost; bv = b.cost }
      else if (sortKey === 'createdAt') { av = a.createdAt ?? ''; bv = b.createdAt ?? '' }
      else { av = (a[sortKey] as string ?? '').toLowerCase(); bv = (b[sortKey] as string ?? '').toLowerCase() }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [items, search, filterCat, sortKey, sortDir])

  const fmtVal = (n: number) =>
    n >= 1e6 ? `TZS ${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `TZS ${(n / 1e3).toFixed(0)}K` : `TZS ${n.toLocaleString()}`

  const handleAdd = async (data: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (isSaving) return
    setIsSaving(true)
    const ts = now()
    await addItem({
      id: `ITM-${Date.now().toString(36).toUpperCase()}`,
      ...data,
      createdAt: ts, updatedAt: ts,
    })
    setShowAdd(false)
    setIsSaving(false)
  }

  const handleEdit = async (updated: InventoryItem) => {
    await updateItem(updated)
    setEditTgt(null)
  }

  const exportItems = () => exportTablePdf(
    'Inventory Report',
    `As at ${new Date().toLocaleDateString('en-TZ')}`,
    [
      { header: 'Item ID',   dataKey: 'id' },
      { header: 'Name',      dataKey: 'name' },
      { header: 'Category',  dataKey: 'category' },
      { header: 'Warehouse', dataKey: 'warehouse' },
      { header: 'Qty',       dataKey: 'qty' },
      { header: 'Unit',      dataKey: 'unit' },
      { header: 'Unit Cost', dataKey: 'cost' },
      { header: 'Status',    dataKey: 'status' },
      { header: 'Expiry',    dataKey: 'expiry' },
    ],
    filtered.map(i => ({ ...i, cost: i.cost > 0 ? `TZS ${i.cost.toLocaleString()}` : '—', expiry: i.expiry || '—' })),
    'inventory',
    fabegonLogo,
  )

  return (
    <div className="p-6 space-y-5 animate-in">

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
            Inventory &amp; Warehousing
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: '4px 0 0' }}>
            {totalItems} item{totalItems !== 1 ? 's' : ''} across {warehouses.length} warehouse{warehouses.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => refreshItems()} title="Refresh" style={{ display: 'flex', alignItems: 'center', padding: '9px 12px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--secondary-foreground)', cursor: 'pointer' }}>
            <RefreshCw size={13} />
          </button>
          <button onClick={exportItems} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--secondary-foreground)', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', fontWeight: 500 }}>
            <Download size={13} /> Export
          </button>
          <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit' }}>
            <Plus size={14} /> Add Item
          </button>
        </div>
      </div>

      {/* ── Stat cards ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {([
          { label: 'Total Items',    value: String(totalItems),   icon: Package,       color: 'var(--primary)' },
          { label: 'Low Stock',      value: String(lowStock),     icon: AlertTriangle, color: 'var(--warning)' },
          { label: 'Out of Stock',   value: String(outOfStock),   icon: AlertTriangle, color: 'var(--danger)' },
          { label: 'Total Valuation',value: fmtVal(totalValue),   icon: TrendingUp,    color: 'var(--success)' },
        ] as { label: string; value: string; icon: React.ElementType; color: string }[]).map(s => (
          <div key={s.label} style={{ borderRadius: '12px', padding: '18px 20px', background: 'var(--card)', border: '1px solid var(--border)' }}>
            <s.icon size={16} style={{ color: s.color, marginBottom: '8px' }} />
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--foreground)', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '5px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Search + pills — single row matching v1.0.18 ──────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {/* Search bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px', borderRadius: '10px', background: 'var(--secondary)', border: '1px solid var(--border)', minWidth: '220px', flex: '0 0 auto' }}>
          <Search size={14} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..."
            style={{ width: '160px', background: 'transparent', border: 'none', outline: 'none', fontSize: '13px', color: 'var(--foreground)', fontFamily: 'inherit' }} />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', padding: 0, display: 'flex' }}>
              <X size={12} />
            </button>
          )}
        </div>
        {/* Category pills */}
        {CAT_PILLS.map(c => (
          <Pill key={c} label={c} active={filterCat === c} onClick={() => setFilterCat(c)} />
        ))}
        {/* Count */}
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{filtered.length} of {totalItems}</span>
      </div>

      {/* ── Table ──────────────────────────────────────────── */}
      <div style={{ borderRadius: '12px', overflow: 'hidden', background: 'var(--card)', border: '1px solid var(--border)' }}>
        {isLoading ? (
          <div style={{ padding: '48px', textAlign: 'center', fontSize: '13px', color: 'var(--muted-foreground)' }}>Loading inventory…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', fontSize: '14px', color: 'var(--muted-foreground)' }}>
            {search || filterCat !== 'All' ? 'No items match your search.' : 'No items yet — click "Add Item" to get started.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {(['Item ID', 'Name', 'Category', 'Received', 'Sold/Used', 'Current Qty', 'Unit Cost', 'Status', 'Expiry', 'Date Added', ''] as (string | null)[]).map((h, idx) => {
                    const keyMap: Record<string, typeof sortKey> = { Name: 'name', Category: 'category', 'Current Qty': 'qty', 'Unit Cost': 'cost', Status: 'status', 'Date Added': 'createdAt' }
                    const sk = h ? keyMap[h] : undefined
                    return (
                      <th key={idx} onClick={sk ? () => toggleSort(sk) : undefined}
                        style={{ textAlign: 'left', padding: '11px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', whiteSpace: 'nowrap', background: 'rgba(255,255,255,0.02)', cursor: sk ? 'pointer' : 'default', userSelect: 'none' }}>
                        {h && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          {h}
                          {sk && sortKey === sk && (sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                        </span>}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => {
                  const st = STATUS_STYLE[item.status] ?? STATUS_STYLE['Available']
                  const lowStk  = item.minQty > 0 && item.qty <= item.minQty && item.qty > 0
                  const expired = item.expiry && new Date(item.expiry) < new Date()
                  return (
                    <tr key={item.id}
                      style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      onClick={() => setViewTgt(item)}
                    >
                      <td style={{ padding: '13px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'var(--primary)', fontWeight: 600 }}>{item.id}</td>
                      <td style={{ padding: '13px 16px', fontWeight: 600, color: 'var(--foreground)', whiteSpace: 'nowrap' }}>
                        {lowStk && <AlertTriangle size={11} style={{ color: 'var(--warning)', display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />}
                        {item.name}
                      </td>
                      <td style={{ padding: '13px 16px', color: 'var(--secondary-foreground)' }}>{item.category}</td>
                      <td style={{ padding: '13px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'var(--primary)' }}>
                        {(item.receivedQty ?? item.qty).toLocaleString()} <span style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>{item.unit}</span>
                      </td>
                      <td style={{ padding: '13px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: ((item.soldQty ?? 0) + (item.usedQty ?? 0)) > 0 ? 'var(--warning)' : 'var(--muted-foreground)' }}>
                        {((item.soldQty ?? 0) + (item.usedQty ?? 0)).toLocaleString()} <span style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>{item.unit}</span>
                      </td>
                      <td style={{ padding: '13px 16px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: item.qty === 0 ? 'var(--danger)' : lowStk ? 'var(--warning)' : 'var(--success)' }}>
                        {item.qty.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--muted-foreground)' }}>{item.unit}</span>
                      </td>
                      <td style={{ padding: '13px 16px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--secondary-foreground)' }}>
                        {item.cost > 0 ? `TZS ${item.cost.toLocaleString()}` : '—'}
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', fontWeight: 600, background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>{item.status}</span>
                      </td>
                      <td style={{ padding: '13px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: expired ? 'var(--danger)' : 'var(--muted-foreground)' }}>
                        {item.expiry || '—'}
                      </td>
                      <td style={{ padding: '13px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'var(--muted-foreground)' }}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-TZ', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td style={{ padding: '13px 16px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button onClick={() => setViewTgt(item)} title="View" style={{ padding: '4px 9px', borderRadius: '6px', background: 'rgba(61,127,255,0.08)', color: 'var(--primary)', border: '1px solid rgba(61,127,255,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <Eye size={11} />
                          </button>
                          <button onClick={() => setEditTgt(item)} title="Edit" style={{ padding: '4px 9px', borderRadius: '6px', background: 'rgba(99,102,241,0.08)', color: '#6366F1', border: '1px solid rgba(99,102,241,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <Pencil size={11} />
                          </button>
                          <button onClick={() => setDeleteTgt(item)} title="Delete" style={{ padding: '4px 9px', borderRadius: '6px', background: 'rgba(239,68,68,0.08)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────── */}
      {showAdd && (
        <AddItemModal suppliers={supplierNames} onClose={() => setShowAdd(false)} onSave={handleAdd} />
      )}
      {editTgt && (
        <EditItemModal item={editTgt} suppliers={supplierNames} onClose={() => setEditTgt(null)} onSave={handleEdit} />
      )}
      {viewTgt && (
        <ViewItemModal item={viewTgt} onClose={() => setViewTgt(null)}
          onEdit={() => { setEditTgt(viewTgt); setViewTgt(null) }} />
      )}
      {deleteTgt && (
        <FloatingModal title="Delete Item" subtitle="This cannot be undone" onClose={() => setDeleteTgt(null)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setDeleteTgt(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={() => { deleteItem(deleteTgt.id); setDeleteTgt(null) }}>
              Delete Permanently
            </button>
          </>}
        >
          <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--danger)' }}>Confirm deletion</div>
            <div style={{ fontSize: '12px', color: 'var(--secondary-foreground)', marginTop: '6px' }}>
              Permanently delete <strong>{deleteTgt.name}</strong>? Stock: {deleteTgt.qty} {deleteTgt.unit}
            </div>
          </div>
        </FloatingModal>
      )}
    </div>
  )
}
