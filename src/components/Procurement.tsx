import { useState } from 'react'
import { useLang } from '@/i18n'
import { Plus, Download, Share2, Printer, Search, Eye, Pencil, Trash2, X, Package, Users, Tag, FileText, Receipt, TrendingDown } from 'lucide-react'
import FloatingModal, { FormInput, FormRow } from './FloatingModal'
import { useApp, type Supplier, type PurchaseOrder, type Expenditure, type POPaymentInstallment } from '../context/AppContext'
import { exportTablePdf, exportStatementPdf } from '../utils/exportPdf'
import fabegonLogo from '@/imports/ChatGPT_Image_Jun_27__2026__02_20_03_AM.png'
import { dispatchNotif } from '../context/NotificationContext'

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  'Pending Approval': { bg: 'rgba(245,158,11,0.1)', color: 'var(--warning)' },
  Approved: { bg: 'rgba(61,127,255,0.1)', color: 'var(--primary)' },
  'In Transit': { bg: 'rgba(99,102,241,0.1)', color: 'var(--accent)' },
  Received: { bg: 'rgba(34,197,94,0.1)', color: 'var(--success)' },
  Cancelled: { bg: 'rgba(239,68,68,0.1)', color: 'var(--danger)' },
}

const PO_STATUSES = ['Pending Approval', 'Approved', 'In Transit', 'Received', 'Cancelled']
const CATEGORIES = ['General', 'Agriculture', 'Manufacturing', 'Logistics', 'IT & Technology', 'Construction', 'Medical', 'Food & Beverage', 'Chemicals', 'Packaging', 'Transport', 'Utilities', 'Other']
const PAYMENT_TERMS = ['Net 7', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Net 90', 'COD', 'Advance Payment', '50/50', 'Other']

const CAN_CREATE_ROLES = ['super_admin', 'admin', 'procurement_officer', 'finance_manager', 'hr_manager', 'branch_manager', 'sales_manager', 'production_manager', 'warehouse_officer', 'employee', 'sales_rep', 'cashier']
const CAN_DELETE_ROLES = ['super_admin', 'admin']

const EXP_CATEGORIES = ['Operations', 'Salaries & Wages', 'Utilities', 'Rent & Lease', 'Transport & Logistics', 'Marketing', 'Maintenance & Repairs', 'Office Supplies', 'Professional Services', 'Insurance', 'Taxes & Levies', 'Raw Materials', 'Equipment', 'IT & Software', 'Travel', 'Miscellaneous']
const EXP_PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Mobile Money (M-Pesa)', 'Mobile Money (Tigo Pesa)', 'Cheque', 'Credit Card', 'Other']
const EXP_STATUSES = ['Pending', 'Approved', 'Rejected', 'Paid'] as const

function SupplierForm({
  name, setName, contact, setContact, phone, setPhone,
  category, setCategory, terms, setTerms,
}: {
  name: string; setName: (v: string) => void
  contact: string; setContact: (v: string) => void
  phone: string; setPhone: (v: string) => void
  category: string; setCategory: (v: string) => void
  terms: string; setTerms: (v: string) => void
}) {
  return (
    <>
      <FormInput label="Supplier Name *" placeholder="e.g. Green Fields Ltd" value={name} onChange={setName} />
      <FormRow>
        <FormInput label="Contact Person" placeholder="e.g. John Mwangi" value={contact} onChange={setContact} />
        <FormInput label="Phone Number" placeholder="e.g. +255 712 345 678" value={phone} onChange={setPhone} />
      </FormRow>
      <FormRow>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--secondary-foreground)' }}>Category</label>
          <select className="input-base" value={category} onChange={e => setCategory(e.target.value)} style={{ cursor: 'pointer' }}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--secondary-foreground)' }}>Payment Terms</label>
          <select className="input-base" value={terms} onChange={e => setTerms(e.target.value)} style={{ cursor: 'pointer' }}>
            <option value="">— Select terms —</option>
            {PAYMENT_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </FormRow>
    </>
  )
}

export default function Procurement({ logoUrl }: { logoUrl?: string }) {
  const { t } = useLang()
  const {
    suppliers, addSupplier, updateSupplier, deleteSupplier,
    addPurchaseJournal, employees, purchaseOrders, addPurchaseOrder,
    updatePurchaseOrder, deletePurchaseOrder, addPOInstallment,
    expenditures, addExpenditure, updateExpenditure, deleteExpenditure,
    items: inventoryItems, addItem, updateItem, currentUser, userId,
  } = useApp()
  const inventoryNames = inventoryItems.map(i => i.name)
  const ITEM_CATEGORIES = ['Raw Material', 'Finished Good', 'Consumable', 'By-Product', 'Packaging', 'Maintenance', 'Office Supplies', 'Other']
  const logo = logoUrl ?? fabegonLogo

  const role = currentUser?.role ?? 'employee'
  const canCreate = CAN_CREATE_ROLES.includes(role)
  const canDelete = CAN_DELETE_ROLES.includes(role)

  const [tab, setTab] = useState<'orders' | 'suppliers' | 'expenditures'>('orders')
  const [supSearch, setSupSearch] = useState('')

  /* ── PO form state ───────────────────────────────────────── */
  const [showPOModal, setShowPOModal] = useState(false)
  const [fSupplier, setFSupplier] = useState('')
  const [fDelivery, setFDelivery] = useState('')
  const [fOrderDate, setFOrderDate] = useState(new Date().toISOString().slice(0, 10))
  const [fBuyer, setFBuyer] = useState('')
  const [fPoStatus, setFPoStatus] = useState('Pending Approval')
  const [fPoNotes, setFPoNotes] = useState('')
  const [fPoPayType, setFPoPayType] = useState<'Full Payment' | 'Partial Payment' | 'Full Credit'>('Full Payment')
  const [fPoPayMethod, setFPoPayMethod] = useState<POPaymentInstallment['method']>('Cash')
  const [fPoInitAmount, setFPoInitAmount] = useState('')
  // PO item cart (mirrors Sales form)
  type POCartRow = { name: string; qty: number; unit: string; cost: number; category: string }
  const [poCart, setPoCart] = useState<POCartRow[]>([{ name: '', qty: 1, unit: 'pcs', cost: 0, category: 'Raw Material' }])
  const poCartTotal = poCart.reduce((s, r) => s + r.qty * r.cost, 0)
  const addPoRow = () => setPoCart(p => [...p, { name: '', qty: 1, unit: 'pcs', cost: 0, category: 'Raw Material' }])
  const removePoRow = (i: number) => setPoCart(p => p.filter((_, idx) => idx !== i))
  const updatePoCart = (i: number, field: keyof POCartRow, val: string | number) =>
    setPoCart(p => p.map((row, idx) => idx === i ? { ...row, [field]: val } : row))

  /* ── PO CRUD state ───────────────────────────────────────── */
  const [viewPO, setViewPO] = useState<PurchaseOrder | null>(null)
  const [viewPOTab, setViewPOTab] = useState<'details' | 'items' | 'payments' | 'timeline'>('details')
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10))
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState<POPaymentInstallment['method']>('Cash')
  const [payRef, setPayRef] = useState('')
  const [payNotes, setPayNotes] = useState('')
  const [editPO, setEditPO] = useState<PurchaseOrder | null>(null)
  const [deletePO, setDeletePO] = useState<PurchaseOrder | null>(null)
  const [editPoStatus, setEditPoStatus] = useState('')
  const [editPoDelivery, setEditPoDelivery] = useState('')
  const [editPoNotes, setEditPoNotes] = useState('')
  const [editPoReceivedDate, setEditPoReceivedDate] = useState('')
  const [editPoSupplier, setEditPoSupplier] = useState('')
  const [editPoDate, setEditPoDate] = useState('')
  const [editPoTotal, setEditPoTotal] = useState('')
  const [editPoBuyer, setEditPoBuyer] = useState('')

  /* ── Expenditure state ───────────────────────────────────── */
  const [showExpModal,    setShowExpModal]    = useState(false)
  const [editExp,         setEditExp]         = useState<Expenditure | null>(null)
  const [deleteExp,       setDeleteExp]       = useState<Expenditure | null>(null)
  const [expSearch,       setExpSearch]       = useState('')
  const [expCatFilter,    setExpCatFilter]    = useState('All')
  const [eDate,           setEDate]           = useState(new Date().toISOString().slice(0, 10))
  const [eCategory,       setECategory]       = useState('Operations')
  const [eDescription,    setEDescription]    = useState('')
  const [eAmount,         setEAmount]         = useState('')
  const [ePayee,          setEPayee]          = useState('')
  const [ePayment,        setEPayment]        = useState('Bank Transfer')
  const [eRef,            setERef]            = useState('')
  const [eApproved,       setEApproved]       = useState('')
  const [eStatus,         setEStatus]         = useState<Expenditure['status']>('Pending')
  const [eNotes,          setENotes]          = useState('')

  const resetExpForm = () => {
    setEDate(new Date().toISOString().slice(0, 10))
    setECategory('Operations'); setEDescription(''); setEAmount('')
    setEPayee(''); setEPayment('Bank Transfer'); setERef('')
    setEApproved(''); setEStatus('Pending'); setENotes('')
  }

  const openAddExp = () => { resetExpForm(); setShowExpModal(true) }
  const openEditExp = (e: Expenditure) => {
    setEditExp(e)
    setEDate(e.date); setECategory(e.category); setEDescription(e.description)
    setEAmount(String(e.amount)); setEPayee(e.payee); setEPayment(e.paymentMethod)
    setERef(e.reference); setEApproved(e.approvedBy); setEStatus(e.status); setENotes(e.notes)
  }

  const handleSaveExp = () => {
    if (!eDescription.trim() || !eAmount) return
    if (editExp) {
      updateExpenditure({ ...editExp, date: eDate, category: eCategory, description: eDescription.trim(), amount: Number(eAmount), payee: ePayee.trim(), paymentMethod: ePayment, reference: eRef.trim(), approvedBy: eApproved.trim(), status: eStatus, notes: eNotes.trim() })
      dispatchNotif({ type: 'success', title: 'Expenditure Updated', body: eDescription.trim(), module: 'Procurement' })
    } else {
      const exp: Expenditure = {
        id: `EXP-${Date.now().toString(36).toUpperCase()}`,
        date: eDate, category: eCategory, description: eDescription.trim(),
        amount: Number(eAmount), payee: ePayee.trim(), paymentMethod: ePayment,
        reference: eRef.trim() || `REF-${Date.now().toString(36).toUpperCase()}`,
        approvedBy: eApproved.trim(), status: eStatus, notes: eNotes.trim(),
        createdBy: userId ?? '', createdAt: new Date().toISOString(),
      }
      addExpenditure(exp)
    }
    setShowExpModal(false)
    setEditExp(null)
    resetExpForm()
  }

  const filteredExps = (expenditures ?? []).filter(e => {
    const matchCat = expCatFilter === 'All' || e.category === expCatFilter
    const q = expSearch.toLowerCase()
    const matchQ = !q || e.description.toLowerCase().includes(q) || e.payee.toLowerCase().includes(q) || e.category.toLowerCase().includes(q) || e.reference.toLowerCase().includes(q)
    return matchCat && matchQ
  })
  const totalExpAmount = filteredExps.reduce((s, e) => s + e.amount, 0)

  const EXP_STATUS_STYLE: Record<string, { bg: string; color: string }> = {
    Pending:  { bg: 'rgba(245,158,11,0.1)',  color: 'var(--warning)' },
    Approved: { bg: 'rgba(61,127,255,0.1)',  color: 'var(--primary)' },
    Rejected: { bg: 'rgba(239,68,68,0.1)',   color: 'var(--danger)' },
    Paid:     { bg: 'rgba(34,197,94,0.1)',   color: 'var(--success)' },
  }

  /* ── Supplier CRUD state ─────────────────────────────────── */
  const [showAddModal, setShowAddModal]     = useState(false)
  const [editTarget, setEditTarget]         = useState<Supplier | null>(null)
  const [viewTarget, setViewTarget]         = useState<Supplier | null>(null)
  const [deleteTarget, setDeleteTarget]     = useState<Supplier | null>(null)
  const [saving, setSaving]                 = useState(false)

  const [sName, setSName]         = useState('')
  const [sContact, setSContact]   = useState('')
  const [sPhone, setSPhone]       = useState('')
  const [sCategory, setSCategory] = useState('General')
  const [sTerms, setSTerms]       = useState('')

  const resetForm = () => { setSName(''); setSContact(''); setSPhone(''); setSCategory('General'); setSTerms('') }

  const nextSupId = () => {
    const nums = suppliers.map(s => { const m = s.id.match(/^SUP(\d+)$/i); return m ? parseInt(m[1]) : 0 })
    const max = nums.length > 0 ? Math.max(...nums) : 0
    return `SUP${String(max + 1).padStart(3, '0')}`
  }

  const openAdd = () => { resetForm(); setShowAddModal(true) }
  const openEdit = (s: Supplier) => {
    setEditTarget(s)
    setSName(s.name); setSContact(s.contact); setSPhone(s.phone); setSCategory(s.category || 'General'); setSTerms(s.terms)
  }

  const handleSaveSupplier = async () => {
    if (!sName.trim()) return
    setSaving(true)
    if (editTarget) {
      updateSupplier({ ...editTarget, name: sName.trim(), contact: sContact.trim(), phone: sPhone.trim(), category: sCategory, terms: sTerms })
      dispatchNotif({ type: 'success', title: 'Supplier Updated', body: `${sName.trim()} has been updated`, module: 'Procurement' })
      setEditTarget(null)
    } else {
      const id = nextSupId()
      addSupplier({ id, name: sName.trim(), contact: sContact.trim(), phone: sPhone.trim(), category: sCategory, terms: sTerms, createdAt: new Date().toISOString(), createdBy: userId ?? '' })
      setShowAddModal(false)
    }
    resetForm(); setSaving(false)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteSupplier(deleteTarget.id)
    dispatchNotif({ type: 'warning', title: 'Supplier Deleted', body: `${deleteTarget.name} removed from system`, module: 'Procurement' })
    setDeleteTarget(null)
  }

  const filtered = suppliers.filter(s => {
    if (!supSearch) return true
    const q = supSearch.toLowerCase()
    return s.name.toLowerCase().includes(q)
      || (s.contact ?? '').toLowerCase().includes(q)
      || (s.phone ?? '').includes(q)
      || (s.category ?? '').toLowerCase().includes(q)
  })

  const pos = purchaseOrders
  const allSupplierNames = suppliers.map(s => s.name)

  const handleCreatePO = () => {
    if (!fSupplier || poCart.some(r => !r.name)) return
    const tot = poCartTotal
    const initPaid = fPoPayType === 'Full Payment' ? tot
      : fPoPayType === 'Partial Payment' ? Math.min(Number(fPoInitAmount) || 0, tot)
      : 0
    const initBal  = Math.max(0, tot - initPaid)
    const initPayStatus: PurchaseOrder['paymentStatus'] = initBal <= 0 ? 'Paid' : initPaid > 0 ? 'Partial' : 'Unpaid'
    const initInsts: POPaymentInstallment[] = initPaid > 0 ? [{
      id: `PAY-${Date.now().toString(36).toUpperCase()}`,
      date: fOrderDate,
      amount: initPaid,
      method: fPoPayMethod,
      reference: '',
      notes: fPoPayType === 'Full Payment' ? 'Full payment on order' : 'Initial partial payment',
    }] : []
    const newPO: PurchaseOrder = {
      id: `PO-${Date.now().toString(36).toUpperCase()}`,
      supplier: fSupplier,
      date: fOrderDate,
      delivery: fDelivery,
      receivedDate: fPoStatus === 'Received' ? new Date().toISOString().slice(0, 10) : undefined,
      items: poCart.filter(r => r.name).map(r => ({ name: r.name, qty: r.qty, unit: r.unit, cost: r.cost })),
      total: tot,
      status: fPoStatus,
      buyer: fBuyer,
      notes: fPoNotes,
      paymentMethod: fPoPayMethod,
      paymentType: fPoPayType,
      paymentStatus: initPayStatus,
      amountPaid: initPaid,
      balance: initBal,
      paymentInstallments: initInsts,
    }
    addPurchaseOrder(newPO)
    addPurchaseJournal(newPO.id, fSupplier, newPO.total)
    if (fSupplier && !suppliers.some(s => s.name === fSupplier)) {
      addSupplier({ id: nextSupId(), name: fSupplier, contact: '', phone: '', category: 'General', terms: '', createdBy: userId ?? '' })
    }
    // Auto-register PO items into inventory
    for (const r of poCart.filter(r => r.name)) {
      const existing = inventoryItems.find(it => it.name.toLowerCase() === r.name.toLowerCase())
      if (existing) {
        updateItem({ ...existing, qty: existing.qty + r.qty, receivedQty: (existing.receivedQty ?? 0) + r.qty, cost: r.cost > 0 ? r.cost : existing.cost })
      } else {
        addItem({
          id: `ITM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
          name: r.name, sku: '', category: r.category, warehouse: 'Main', qty: r.qty,
          minQty: 0, maxQty: 0, unit: r.unit, cost: r.cost, price: r.cost,
          reorder: 0, batchNumber: '', expiry: '', supplier: fSupplier, description: '',
          status: 'Active', approvalStatus: 'Approved', pendingChange: '',
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          receivedDate: fOrderDate, receivedQty: r.qty,
        })
      }
    }
    setFSupplier(''); setFDelivery(''); setFBuyer(''); setFPoStatus('Pending Approval')
    setFPoNotes(''); setFPoPayMethod('Cash'); setFPoPayType('Full Payment'); setFPoInitAmount('')
    setFOrderDate(new Date().toISOString().slice(0, 10))
    setPoCart([{ name: '', qty: 1, unit: 'pcs', cost: 0, category: 'Raw Material' }])
    setShowPOModal(false)
  }

  const openEditPO = (po: PurchaseOrder) => {
    setEditPO(po)
    setEditPoSupplier(po.supplier)
    setEditPoDate(po.date)
    setEditPoTotal(String(po.total))
    setEditPoStatus(po.status)
    setEditPoDelivery(po.delivery || '')
    setEditPoBuyer(po.buyer || '')
    setEditPoNotes(po.notes || '')
    setEditPoReceivedDate(po.receivedDate || '')
  }

  const handleSavePO = () => {
    if (!editPO) return
    const autoReceived = editPoStatus === 'Received' && !editPoReceivedDate ? new Date().toISOString().slice(0, 10) : editPoReceivedDate
    updatePurchaseOrder({
      ...editPO,
      supplier: editPoSupplier,
      date: editPoDate,
      total: Number(editPoTotal) || editPO.total,
      status: editPoStatus,
      delivery: editPoDelivery,
      buyer: editPoBuyer,
      notes: editPoNotes,
      receivedDate: autoReceived || undefined,
    })
    dispatchNotif({ type: 'success', title: 'PO Updated', body: `${editPO.id} updated successfully`, module: 'Procurement' })
    setEditPO(null)
  }

  const handleDeletePO = () => {
    if (!deletePO) return
    deletePurchaseOrder(deletePO.id)
    dispatchNotif({ type: 'warning', title: 'PO Deleted', body: `${deletePO.id} removed from system`, module: 'Procurement' })
    setDeletePO(null)
  }

  const [poSearch, setPoSearch] = useState('')
  const filteredPos = pos.filter(p => {
    const q = poSearch.toLowerCase()
    return !q || p.id.toLowerCase().includes(q) || p.supplier.toLowerCase().includes(q) || (p.buyer ?? '').toLowerCase().includes(q) || p.status.toLowerCase().includes(q)
  })

  const exportPOs = (action: 'download' | 'print' | 'share' = 'download') => exportTablePdf(
    t('proc.orders'), `As at ${new Date().toLocaleDateString('en-TZ')}`,
    [{ header: 'PO #', dataKey: 'id' }, { header: 'Supplier', dataKey: 'supplier' }, { header: 'Date', dataKey: 'date' }, { header: 'Total (TZS)', dataKey: 'total' }, { header: 'Status', dataKey: 'status' }, { header: 'Buyer', dataKey: 'buyer' }],
    filteredPos.map(p => ({ ...p, total: p.total.toLocaleString() })),
    'purchase_orders', logo, action,
  )

  const fmtDate = (iso?: string) => {
    if (!iso) return '—'
    try { return new Date(iso).toLocaleDateString('en-TZ', { day: '2-digit', month: 'short', year: 'numeric' }) } catch { return iso.slice(0, 10) }
  }

  return (
    <div className="p-6 space-y-5 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>{t('proc.title')}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{t('proc.subtitle')}</p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {tab === 'orders' && (
            <>
              <button onClick={() => exportPOs('share')} className="btn btn-ghost" style={{ fontSize: '12px', padding: '7px 10px' }} title="Share PDF"><Share2 size={13} /></button>
              <button onClick={() => exportPOs('print')} className="btn btn-ghost" style={{ fontSize: '12px', padding: '7px 10px' }} title="Print"><Printer size={13} /></button>
              <button onClick={() => exportPOs('download')} className="btn btn-ghost" style={{ fontSize: '12px', padding: '7px 10px' }} title="Download"><Download size={13} /></button>
              <button onClick={() => setShowPOModal(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--primary)', color: 'white' }}>
                <Plus size={14} /> New PO
              </button>
            </>
          )}
          {tab === 'suppliers' && canCreate && (
            <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--primary)', color: 'white' }}>
              <Plus size={14} /> Add Supplier
            </button>
          )}
          {tab === 'expenditures' && canCreate && (
            <button onClick={openAddExp} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--primary)', color: 'white' }}>
              <Plus size={14} /> Add Expenditure
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {tab === 'orders' ? (
          <>
            { [
              { label: 'Open Orders',       value: pos.filter(p => ['Pending Approval','Approved','In Transit'].includes(p.status)).length },
              { label: 'Pending Approval',  value: pos.filter(p => p.status === 'Pending Approval').length },
              { label: 'In Transit',        value: pos.filter(p => p.status === 'In Transit').length },
              { label: 'Received (Total)',  value: pos.filter(p => p.status === 'Received').length },
            ].map(s => (
              <div key={s.label} className="rounded-xl px-4 py-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="text-xl font-bold" style={{ color: 'var(--foreground)', fontFamily: 'JetBrains Mono, monospace' }}>{s.value}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{s.label}</div>
              </div>
            )) }
          </>
        ) : tab === 'suppliers' ? (
          <>
            { [
              { label: 'Total Suppliers',  value: suppliers.length,                                                                  icon: Users },
              { label: 'Categories',       value: [...new Set(suppliers.map(s => s.category).filter(Boolean))].length,               icon: Tag },
              { label: 'With Terms',       value: suppliers.filter(s => s.terms).length,                                            icon: FileText },
              { label: 'Search Results',   value: supSearch ? filtered.length : suppliers.length,                                    icon: Package },
            ].map(s => (
              <div key={s.label} className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <s.icon size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <div>
                  <div className="text-xl font-bold" style={{ color: 'var(--foreground)', fontFamily: 'JetBrains Mono, monospace' }}>{s.value}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{s.label}</div>
                </div>
              </div>
            )) }
          </>
        ) : (
          <>
            { [
              { label: 'Total Spend', value: `TZS ${(expenditures ?? []).reduce((s, e) => s + e.amount, 0).toLocaleString()}`, icon: TrendingDown, color: 'var(--danger)' },
              { label: 'Expenditure Records', value: String((expenditures ?? []).length), icon: Receipt, color: 'var(--foreground)' },
              { label: 'Pending Approval', value: String((expenditures ?? []).filter(e => e.status === 'Pending').length), icon: FileText, color: 'var(--warning)' },
              { label: 'Paid This Month', value: String((expenditures ?? []).filter(e => e.status === 'Paid' && e.date.startsWith(new Date().toISOString().slice(0,7))).length), icon: Package, color: 'var(--success)' },
            ].map(s => (
              <div key={s.label} className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <s.icon size={16} style={{ color: s.color, flexShrink: 0 }} />
                <div>
                  <div className="text-xl font-bold" style={{ color: s.color, fontFamily: 'JetBrains Mono, monospace' }}>{s.value}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{s.label}</div>
                </div>
              </div>
            )) }
          </>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1" style={{ borderBottom: '1px solid var(--border)' }}>
        {([['orders', t('proc.orders')], ['suppliers', t('proc.suppliers')], ['expenditures', 'Expenditures']] as const).map(([tabKey, label]) => (
          <button key={tabKey} onClick={() => setTab(tabKey)} className="px-4 py-2 text-sm font-medium transition-colors -mb-px" style={{
            color: tab === tabKey ? 'var(--primary)' : 'var(--muted-foreground)',
            borderBottom: tab === tabKey ? '2px solid var(--primary)' : '2px solid transparent',
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Purchase Orders Tab ─────────────────────────────── */}
      {tab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ position: 'relative', maxWidth: '320px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
            <input className="input-base" placeholder="Search PO #, supplier, buyer, status…" value={poSearch} onChange={e => setPoSearch(e.target.value)} style={{ paddingLeft: '32px' }} />
          </div>
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['PO #', 'Supplier', 'Order Date', 'Received Date', 'Total', 'Status', 'Buyer', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPos.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-sm" style={{ color: 'var(--muted-foreground)' }}>{poSearch ? `No purchase orders match "${poSearch}"` : 'No purchase orders yet. Create one to get started.'}</td></tr>
              ) : filteredPos.map((po, i) => {
                const s = STATUS_STYLE[po.status] ?? { bg: 'rgba(100,100,100,0.1)', color: 'var(--muted-foreground)' }
                return (
                  <tr key={po.id} style={{ borderBottom: i < filteredPos.length - 1 ? '1px solid var(--border)' : 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td className="px-4 py-3 text-xs font-medium" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--primary)' }}>{po.id}</td>
                    <td className="px-4 py-3 text-xs font-medium" style={{ color: 'var(--foreground)' }}>{po.supplier}</td>
                    <td className="px-4 py-3 text-xs" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--muted-foreground)' }}>{po.date}</td>
                    <td className="px-4 py-3 text-xs" style={{ fontFamily: 'JetBrains Mono, monospace', color: (po as any).receivedDate ? 'var(--success)' : 'var(--muted-foreground)' }}>
                      {(po as any).receivedDate ? fmtDate((po as any).receivedDate) : po.delivery ? fmtDate(po.delivery) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--foreground)' }}>TZS {po.total.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: s.bg, color: s.color }}>{po.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--secondary-foreground)' }}>{po.buyer || '—'}</td>
                    <td className="px-4 py-3">
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => setViewPO(po)} title="View"
                          style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(61,127,255,0.1)', color: 'var(--primary)', border: '1px solid rgba(61,127,255,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontFamily: 'inherit' }}>
                          <Eye size={11} /> View
                        </button>
                        {canCreate && (
                          <button onClick={() => openEditPO(po)} title="Edit"
                            style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(34,197,94,0.08)', color: 'var(--success)', border: '1px solid rgba(34,197,94,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontFamily: 'inherit' }}>
                            <Pencil size={11} /> Edit
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => setDeletePO(po)} title="Delete"
                            style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(239,68,68,0.08)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontFamily: 'inherit' }}>
                            <Trash2 size={11} /> Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        </div>
      )}

      {/* ── Suppliers Tab ──────────────────────────────────────── */}
      {tab === 'suppliers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ position: 'relative', maxWidth: '340px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
            <input className="input-base" placeholder="Search by name, contact, phone, category…" value={supSearch} onChange={e => setSupSearch(e.target.value)} style={{ paddingLeft: '32px' }} />
          </div>
          <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Supplier ID', 'Supplier Name', 'Contact Person', 'Phone', 'Category', 'Payment Terms', 'Date Created', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    {supSearch ? `No suppliers match "${supSearch}"` : 'No suppliers yet. Add one to get started.'}
                  </td></tr>
                ) : filtered.map((s, i) => (
                  <tr key={s.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td className="px-4 py-3 text-xs font-medium" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--primary)' }}>{s.id}</td>
                    <td className="px-4 py-3 text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{s.name}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--secondary-foreground)' }}>{s.contact || '—'}</td>
                    <td className="px-4 py-3 text-xs" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--secondary-foreground)' }}>{s.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(61,127,255,0.1)', color: 'var(--primary)', fontWeight: 500 }}>{s.category || 'General'}</span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--secondary-foreground)' }}>{s.terms || '—'}</td>
                    <td className="px-4 py-3 text-xs" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--muted-foreground)' }}>{fmtDate(s.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => setViewTarget(s)} title="View"
                          style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(61,127,255,0.1)', color: 'var(--primary)', border: '1px solid rgba(61,127,255,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontFamily: 'inherit' }}>
                          <Eye size={11} /> View
                        </button>
                        {canCreate && (
                          <button onClick={() => openEdit(s)} title="Edit"
                            style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(34,197,94,0.08)', color: 'var(--success)', border: '1px solid rgba(34,197,94,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontFamily: 'inherit' }}>
                            <Pencil size={11} /> Edit
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => setDeleteTarget(s)} title="Delete"
                            style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(239,68,68,0.08)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontFamily: 'inherit' }}>
                            <Trash2 size={11} /> Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', textAlign: 'right' }}>
              Showing {filtered.length} of {suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}

      {/* ── Add Supplier Modal ─────────────────────────────────── */}
      {showAddModal && (
        <FloatingModal
          title="Add Supplier"
          subtitle="New supplier will be saved to Supabase and synced in real time"
          onClose={() => { setShowAddModal(false); resetForm() }}
          footer={
            <>
              <button onClick={() => { setShowAddModal(false); resetForm() }} className="btn btn-ghost">Cancel</button>
              <button onClick={handleSaveSupplier} disabled={!sName.trim() || saving} className="btn btn-primary" style={{ opacity: (!sName.trim() || saving) ? 0.6 : 1 }}>
                {saving ? 'Saving…' : 'Save Supplier'}
              </button>
            </>
          }
        >
          <SupplierForm name={sName} setName={setSName} contact={sContact} setContact={setSContact} phone={sPhone} setPhone={setSPhone} category={sCategory} setCategory={setSCategory} terms={sTerms} setTerms={setSTerms} />
        </FloatingModal>
      )}

      {/* ── Edit Supplier Modal ────────────────────────────────── */}
      {editTarget && (
        <FloatingModal
          title="Edit Supplier"
          subtitle={`Editing ${editTarget.id} · ${editTarget.name}`}
          onClose={() => { setEditTarget(null); resetForm() }}
          footer={
            <>
              <button onClick={() => { setEditTarget(null); resetForm() }} className="btn btn-ghost">Cancel</button>
              <button onClick={handleSaveSupplier} disabled={!sName.trim() || saving} className="btn btn-primary" style={{ opacity: (!sName.trim() || saving) ? 0.6 : 1 }}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </>
          }
        >
          <SupplierForm name={sName} setName={setSName} contact={sContact} setContact={setSContact} phone={sPhone} setPhone={setSPhone} category={sCategory} setCategory={setSCategory} terms={sTerms} setTerms={setSTerms} />
          <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(61,127,255,0.06)', border: '1px solid rgba(61,127,255,0.15)', fontSize: '11px', color: 'var(--muted-foreground)' }}>
            Supplier ID <strong style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--primary)' }}>{editTarget.id}</strong> and creation date are read-only.
          </div>
        </FloatingModal>
      )}

      {/* ── View Supplier Modal ────────────────────────────────── */}
      {viewTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', overflowY: 'auto', paddingTop: '24px', paddingBottom: '24px' }}
          onClick={() => setViewTarget(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', width: '440px', maxWidth: '95vw', boxShadow: 'var(--shadow)', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'var(--primary)', marginBottom: '4px' }}>{viewTarget.id}</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--foreground)' }}>{viewTarget.name}</div>
                <span style={{ display: 'inline-block', marginTop: '6px', fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: 'rgba(61,127,255,0.1)', color: 'var(--primary)', fontWeight: 500 }}>{viewTarget.category || 'General'}</span>
              </div>
              <button onClick={() => setViewTarget(null)} style={{ padding: '6px', borderRadius: '8px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}><X size={15} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              {[
                { label: 'Contact Person', value: viewTarget.contact || '—' },
                { label: 'Phone Number',   value: viewTarget.phone || '—' },
                { label: 'Payment Terms',  value: viewTarget.terms || '—' },
                { label: 'Date Created',   value: fmtDate(viewTarget.createdAt) },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', background: 'var(--background)' }}>
                  <span style={{ color: 'var(--muted-foreground)', fontSize: '12px' }}>{row.label}</span>
                  <span style={{ color: 'var(--foreground)', fontWeight: 500, fontSize: '12px' }}>{row.value}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px', justifyContent: 'flex-end' }}>
              {canCreate && (
                <button onClick={() => { setViewTarget(null); openEdit(viewTarget) }} className="btn btn-ghost" style={{ fontSize: '12px' }}>
                  <Pencil size={12} style={{ marginRight: '4px' }} /> Edit
                </button>
              )}
              <button onClick={() => setViewTarget(null)} className="btn btn-primary" style={{ fontSize: '12px' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── View PO Modal ──────────────────────────────────────── */}
      {viewPO && (() => {
        const insts = viewPO.paymentInstallments ?? []
        const amtPaid = viewPO.amountPaid ?? insts.reduce((s, i) => s + i.amount, 0)
        const bal = viewPO.balance ?? Math.max(0, viewPO.total - amtPaid)
        const payPct = viewPO.total > 0 ? Math.min(100, (amtPaid / viewPO.total) * 100) : 0
        const PAY_STATUS_COLOR: Record<string, string> = { Paid: 'var(--success)', Partial: 'var(--warning)', Unpaid: 'var(--danger)' }
        const poTabs: [string, string][] = [['details', 'Details'], ['items', `Items (${viewPO.items.length})`], ['payments', `Payments (${insts.length})`], ['timeline', 'Timeline']]
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', overflowY: 'auto', paddingTop: '24px', paddingBottom: '24px' }}
            onClick={() => { setViewPO(null); setViewPOTab('details');  }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', width: '580px', maxWidth: '95vw', maxHeight: 'calc(100vh - 80px)', height: 'fit-content', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow)', margin: '0 auto' }}>
              {/* Header */}
              <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'var(--primary)' }}>{viewPO.id}</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--foreground)', marginTop: '2px' }}>{viewPO.supplier}</div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: STATUS_STYLE[viewPO.status]?.bg ?? 'rgba(100,100,100,0.1)', color: STATUS_STYLE[viewPO.status]?.color ?? 'var(--muted-foreground)', fontWeight: 500 }}>{viewPO.status}</span>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: 'rgba(100,100,100,0.08)', color: PAY_STATUS_COLOR[viewPO.paymentStatus ?? 'Unpaid'] ?? 'var(--muted-foreground)', fontWeight: 500 }}>{viewPO.paymentStatus ?? 'Unpaid'}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      onClick={() => {
                        const supplierPos = purchaseOrders.filter(p => p.supplier === viewPO.supplier)
                        const txs = supplierPos.flatMap(po => {
                          const insts = po.paymentInstallments ?? []
                          const rows = [{ date: po.date, reference: po.id, description: `Purchase Order — ${po.items.map(it => it.name).join(', ')}`, debit: po.total, credit: 0, balance: 0 }]
                          insts.forEach(inst => rows.push({ date: inst.date, reference: inst.reference || inst.id, description: `Payment (${inst.method})${inst.notes ? ' — ' + inst.notes : ''}`, debit: 0, credit: inst.amount, balance: 0 }))
                          return rows
                        }).sort((a, b) => a.date.localeCompare(b.date))
                        exportStatementPdf(
                          'Supplier Statement',
                          viewPO.supplier,
                          `All transactions up to ${new Date().toLocaleDateString('en-TZ')}`,
                          0, txs,
                          `supplier-statement-${viewPO.supplier.replace(/\s+/g, '-')}.pdf`,
                          logoUrl,
                        )
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', background: 'rgba(61,127,255,0.1)', border: '1px solid rgba(61,127,255,0.25)', color: 'var(--primary)', cursor: 'pointer', fontSize: '12px', fontWeight: 500, fontFamily: 'inherit' }}
                    >
                      <Download size={13} /> Statement
                    </button>
                    <button onClick={() => { setViewPO(null); setViewPOTab('details');  }} style={{ padding: '6px', borderRadius: '8px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}><X size={15} /></button>
                  </div>
                </div>
                {/* Payment progress bar */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--muted-foreground)' }}>Paid: <strong style={{ color: 'var(--success)' }}>TZS {amtPaid.toLocaleString()}</strong></span>
                    <span style={{ color: 'var(--muted-foreground)' }}>Balance: <strong style={{ color: bal > 0 ? 'var(--danger)' : 'var(--success)' }}>TZS {bal.toLocaleString()}</strong></span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '3px', background: 'var(--border)' }}>
                    <div style={{ height: '100%', borderRadius: '3px', background: payPct >= 100 ? 'var(--success)' : 'var(--primary)', width: `${payPct}%`, transition: 'width 0.3s' }} />
                  </div>
                </div>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid var(--border)' }}>
                  {poTabs.map(([k, l]) => (
                    <button key={k} onClick={() => setViewPOTab(k as any)} style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 500, fontFamily: 'inherit', border: 'none', background: 'transparent', cursor: 'pointer', color: viewPOTab === k ? 'var(--primary)' : 'var(--muted-foreground)', borderBottom: viewPOTab === k ? '2px solid var(--primary)' : '2px solid transparent', marginBottom: '-1px', whiteSpace: 'nowrap' }}>{l}</button>
                  ))}
                </div>
              </div>

              {/* Tab content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
                {viewPOTab === 'details' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { label: 'Order Date',        value: fmtDate(viewPO.date) },
                      { label: 'Expected Delivery', value: viewPO.delivery ? fmtDate(viewPO.delivery) : '—' },
                      { label: 'Actual Received',   value: viewPO.receivedDate ? fmtDate(viewPO.receivedDate) : '—' },
                      { label: 'Total Amount',      value: `TZS ${viewPO.total.toLocaleString()}` },
                      { label: 'Payment Method',    value: viewPO.paymentMethod ?? '—' },
                      ...(viewPO.paymentMethod === 'Credit' ? [{ label: 'Credit Type', value: viewPO.paymentType ?? '—' }] : []),
                      { label: 'Buyer',             value: viewPO.buyer || '—' },
                      { label: 'Notes',             value: viewPO.notes || '—' },
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', background: 'var(--background)' }}>
                        <span style={{ color: 'var(--muted-foreground)', fontSize: '12px' }}>{row.label}</span>
                        <span style={{ color: 'var(--foreground)', fontWeight: 500, fontSize: '12px', textAlign: 'right', maxWidth: '60%' }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {viewPOTab === 'items' && (
                  <div style={{ borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead><tr style={{ background: 'var(--secondary)', borderBottom: '1px solid var(--border)' }}>
                        {['Item', 'Qty', 'Unit', 'Unit Cost', 'Subtotal'].map(h => <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: 'var(--muted-foreground)' }}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {viewPO.items.map((it, i) => (
                          <tr key={i} style={{ borderBottom: i < viewPO.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                            <td style={{ padding: '8px 10px', fontWeight: 500 }}>{it.name}</td>
                            <td style={{ padding: '8px 10px', fontFamily: 'JetBrains Mono, monospace' }}>{it.qty}</td>
                            <td style={{ padding: '8px 10px', color: 'var(--muted-foreground)' }}>{it.unit}</td>
                            <td style={{ padding: '8px 10px', fontFamily: 'JetBrains Mono, monospace' }}>TZS {it.cost.toLocaleString()}</td>
                            <td style={{ padding: '8px 10px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: 'var(--primary)' }}>TZS {(it.qty * it.cost).toLocaleString()}</td>
                          </tr>
                        ))}
                        <tr style={{ background: 'var(--secondary)', borderTop: '1px solid var(--border)' }}>
                          <td colSpan={4} style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'right' }}>Total</td>
                          <td style={{ padding: '8px 10px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--primary)' }}>TZS {viewPO.total.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {viewPOTab === 'payments' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Summary KPIs */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {[
                        { label: 'Total', value: `TZS ${viewPO.total.toLocaleString()}`, color: 'var(--foreground)' },
                        { label: 'Paid', value: `TZS ${amtPaid.toLocaleString()}`, color: 'var(--success)' },
                        { label: 'Balance', value: `TZS ${bal.toLocaleString()}`, color: bal > 0 ? 'var(--danger)' : 'var(--success)' },
                      ].map(k => (
                        <div key={k.label} style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--secondary)', border: '1px solid var(--border)' }}>
                          <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>{k.label}</div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: k.color, fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>{k.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Inline payment rows table */}
                    <div style={{ borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                          <tr style={{ background: 'var(--secondary)', borderBottom: '1px solid var(--border)' }}>
                            {['Date', 'Method', 'Amount (TZS)', 'Reference', 'Notes', ''].map(h => (
                              <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {insts.length === 0 && !canCreate && (
                            <tr><td colSpan={6} style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: 'var(--muted-foreground)' }}>No payments recorded yet.</td></tr>
                          )}
                          {insts.map((inst) => (
                            <tr key={inst.id} style={{ borderBottom: '1px solid var(--border)', background: 'transparent' }}>
                              <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}>{fmtDate(inst.date)}</td>
                              <td style={{ padding: '7px 10px' }}>
                                <span style={{ padding: '2px 7px', borderRadius: '99px', fontSize: '10px', fontWeight: 600, background: inst.method === 'Cash' ? 'rgba(34,197,94,0.1)' : inst.method === 'Cheque' ? 'rgba(61,127,255,0.1)' : 'rgba(99,102,241,0.1)', color: inst.method === 'Cash' ? 'var(--success)' : inst.method === 'Cheque' ? 'var(--primary)' : 'var(--accent)' }}>{inst.method}</span>
                              </td>
                              <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--success)' }}>TZS {inst.amount.toLocaleString()}</td>
                              <td style={{ padding: '7px 10px', color: 'var(--muted-foreground)', fontSize: '11px' }}>{inst.reference || '—'}</td>
                              <td style={{ padding: '7px 10px', color: 'var(--muted-foreground)', fontSize: '11px' }}>{inst.notes || '—'}</td>
                              <td style={{ padding: '7px 10px' }}></td>
                            </tr>
                          ))}
                          {/* Draft new payment row — always visible when balance remains */}
                          {canCreate && bal > 0 && (
                            <tr style={{ background: 'rgba(61,127,255,0.04)', borderTop: insts.length > 0 ? '1px dashed var(--border)' : 'none' }}>
                              <td style={{ padding: '6px 8px' }}>
                                <input type="date" className="input-base" value={payDate} onChange={e => setPayDate(e.target.value)} style={{ fontSize: '11px', padding: '4px 6px', minWidth: '110px' }} />
                              </td>
                              <td style={{ padding: '6px 8px' }}>
                                <select className="input-base" value={payMethod} onChange={e => setPayMethod(e.target.value as POPaymentInstallment['method'])} style={{ fontSize: '11px', padding: '4px 6px', cursor: 'pointer', minWidth: '100px' }}>
                                  {(['Cash', 'Cheque', 'Credit', 'Bank Transfer', 'Mobile Money'] as const).map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                              </td>
                              <td style={{ padding: '6px 8px' }}>
                                <input type="number" className="input-base" placeholder={`max ${bal.toLocaleString()}`} value={payAmount} onChange={e => setPayAmount(e.target.value)} style={{ fontSize: '11px', padding: '4px 6px', minWidth: '100px' }} />
                              </td>
                              <td style={{ padding: '6px 8px' }}>
                                <input className="input-base" placeholder="Ref / cheque no." value={payRef} onChange={e => setPayRef(e.target.value)} style={{ fontSize: '11px', padding: '4px 6px', minWidth: '90px' }} />
                              </td>
                              <td style={{ padding: '6px 8px' }}>
                                <input className="input-base" placeholder="Notes" value={payNotes} onChange={e => setPayNotes(e.target.value)} style={{ fontSize: '11px', padding: '4px 6px', minWidth: '80px' }} />
                              </td>
                              <td style={{ padding: '6px 8px' }}>
                                <button
                                  disabled={!payAmount || Number(payAmount) <= 0}
                                  onClick={() => {
                                    const amt = Math.min(Number(payAmount), bal)
                                    if (amt <= 0) return
                                    const inst: POPaymentInstallment = { id: `PAY-${Date.now().toString(36).toUpperCase()}`, date: payDate, amount: amt, method: payMethod, reference: payRef.trim(), notes: payNotes.trim() }
                                    addPOInstallment(viewPO.id, inst)
                                    const newInsts = [...insts, inst]
                                    const newPaid = newInsts.reduce((s, i) => s + i.amount, 0)
                                    const newBal = Math.max(0, viewPO.total - newPaid)
                                    setViewPO({ ...viewPO, paymentInstallments: newInsts, amountPaid: newPaid, balance: newBal, paymentStatus: newBal <= 0 ? 'Paid' : 'Partial' })
                                    setPayAmount(''); setPayRef(''); setPayNotes('')
                                  }}
                                  style={{ padding: '4px 10px', borderRadius: '6px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '11px', fontFamily: 'inherit', fontWeight: 600, opacity: !payAmount || Number(payAmount) <= 0 ? 0.5 : 1, whiteSpace: 'nowrap' }}
                                >+ Add</button>
                              </td>
                            </tr>
                          )}
                        </tbody>
                        {/* Footer totals */}
                        {insts.length > 0 && (
                          <tfoot>
                            <tr style={{ background: 'var(--secondary)', borderTop: '1px solid var(--border)' }}>
                              <td colSpan={2} style={{ padding: '7px 10px', fontSize: '11px', fontWeight: 700, color: 'var(--muted-foreground)' }}>{insts.length} payment{insts.length !== 1 ? 's' : ''}</td>
                              <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--success)' }}>TZS {amtPaid.toLocaleString()}</td>
                              <td colSpan={2} style={{ padding: '7px 10px', fontSize: '11px', color: 'var(--muted-foreground)', textAlign: 'right' }}>Outstanding:</td>
                              <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: bal > 0 ? 'var(--danger)' : 'var(--success)' }}>TZS {bal.toLocaleString()}</td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                    {bal <= 0 && insts.length > 0 && (
                      <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', fontSize: '12px', color: 'var(--success)', fontWeight: 600 }}>✓ Fully paid — no outstanding balance</div>
                    )}
                  </div>
                )}

                {viewPOTab === 'timeline' && (() => {
                  const events = [
                    { date: viewPO.date, type: 'order', label: 'Order Created', detail: `${viewPO.supplier} · TZS ${viewPO.total.toLocaleString()}` },
                    ...(viewPO.delivery ? [{ date: viewPO.delivery, type: 'delivery', label: 'Expected Delivery', detail: `Planned delivery date` }] : []),
                    ...(viewPO.receivedDate ? [{ date: viewPO.receivedDate, type: 'received', label: 'Goods Received', detail: `Status: ${viewPO.status}` }] : []),
                    ...insts.map(i => ({ date: i.date, type: 'payment', label: `Payment — ${i.method}`, detail: `TZS ${i.amount.toLocaleString()} · ${i.reference || 'no ref'}` })),
                  ].sort((a, b) => a.date.localeCompare(b.date))
                  const TYPE_COLOR: Record<string, string> = { order: 'var(--primary)', delivery: 'var(--warning)', received: 'var(--success)', payment: '#7c3aed' }
                  return events.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '12px' }}>No timeline events yet.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {events.map((ev, i) => (
                        <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: '2px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: TYPE_COLOR[ev.type] ?? 'var(--border)', border: '2px solid var(--card)', boxShadow: `0 0 0 2px ${TYPE_COLOR[ev.type] ?? 'var(--border)'}` }} />
                            {i < events.length - 1 && <div style={{ width: '1px', flex: 1, background: 'var(--border)', minHeight: '20px', marginTop: '2px' }} />}
                          </div>
                          <div style={{ flex: 1, paddingBottom: i < events.length - 1 ? '8px' : 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>{ev.label}</span>
                              <span style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace' }}>{fmtDate(ev.date)}</span>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '1px' }}>{ev.detail}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>

              {/* Footer */}
              <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', justifyContent: 'space-between', flexShrink: 0, background: 'var(--card-2)', borderRadius: '0 0 16px 16px' }}>
                <button
                  onClick={() => {
                    const supplierPos = purchaseOrders.filter(p => p.supplier === viewPO.supplier)
                    const txs = supplierPos.flatMap(po => {
                      const rows: import('../utils/exportPdf').StatementTransaction[] = [{ date: po.date, reference: po.id, description: `Purchase Order — ${po.items.map(it => it.name).join(', ')}`, debit: po.total, credit: 0, balance: 0 }]
                      ;(po.paymentInstallments ?? []).forEach(inst => rows.push({ date: inst.date, reference: inst.reference || inst.id, description: `Payment (${inst.method})${inst.notes ? ' — ' + inst.notes : ''}`, debit: 0, credit: inst.amount, balance: 0 }))
                      return rows
                    }).sort((a, b) => a.date.localeCompare(b.date))
                    exportStatementPdf('Supplier Statement', viewPO.supplier, `All transactions up to ${new Date().toLocaleDateString('en-TZ')}`, 0, txs, `supplier-statement-${viewPO.supplier.replace(/\s+/g, '-')}.pdf`, logoUrl)
                  }}
                  className="btn btn-ghost"
                  style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Download size={13} /> Download Statement
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {canCreate && (
                    <button onClick={() => { setViewPO(null); setViewPOTab('details');  openEditPO(viewPO) }} className="btn btn-ghost" style={{ fontSize: '12px' }}>
                      <Pencil size={12} style={{ marginRight: '4px' }} /> Edit
                    </button>
                  )}
                  <button onClick={() => { setViewPO(null); setViewPOTab('details');  }} className="btn btn-primary" style={{ fontSize: '12px' }}>Close</button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Edit PO Modal ──────────────────────────────────────── */}
      {editPO && (
        <FloatingModal
          title="Edit Purchase Order"
          subtitle={`Editing ${editPO.id} — ${editPO.supplier}`}
          onClose={() => setEditPO(null)}
          footer={
            <>
              <button onClick={() => setEditPO(null)} className="btn btn-ghost">Cancel</button>
              <button onClick={handleSavePO} className="btn btn-primary">Save Changes</button>
            </>
          }
        >
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--secondary-foreground)' }}>Supplier *</label>
            <input className="input-base" list="edit-po-supplier-list" value={editPoSupplier} onChange={e => setEditPoSupplier(e.target.value)} placeholder="Supplier name…" />
            <datalist id="edit-po-supplier-list">{allSupplierNames.map(n => <option key={n} value={n} />)}</datalist>
          </div>
          <FormRow>
            <FormInput label="Order Date" type="date" value={editPoDate} onChange={setEditPoDate} />
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--secondary-foreground)' }}>Status</label>
              <select className="input-base" value={editPoStatus} onChange={e => setEditPoStatus(e.target.value)} style={{ cursor: 'pointer' }}>
                {PO_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </FormRow>
          <FormRow>
            <FormInput label="Total Amount (TZS)" type="number" value={editPoTotal} onChange={setEditPoTotal} />
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--secondary-foreground)' }}>Buyer</label>
              <select className="input-base" value={editPoBuyer} onChange={e => setEditPoBuyer(e.target.value)} style={{ cursor: 'pointer' }}>
                <option value="">— Select buyer —</option>
                {employees.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
              </select>
            </div>
          </FormRow>
          <FormInput label="Expected Delivery Date" type="date" value={editPoDelivery} onChange={setEditPoDelivery} />
          {editPoStatus === 'Received' && (
            <FormInput label="Actual Received Date" type="date" value={editPoReceivedDate} onChange={setEditPoReceivedDate} />
          )}
          <FormInput label="Notes" placeholder="Any updates or notes…" value={editPoNotes} onChange={setEditPoNotes} />
        </FloatingModal>
      )}

      {/* ── Delete PO Confirmation ─────────────────────────────── */}
      {deletePO && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', overflowY: 'auto', paddingTop: '24px', paddingBottom: '24px' }}
          onClick={() => setDeletePO(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--card)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '14px', padding: '24px', width: '380px', maxWidth: '95vw', boxShadow: 'var(--shadow)', margin: '0 auto' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '8px' }}>Delete Purchase Order?</div>
            <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginBottom: '20px', lineHeight: 1.5 }}>
              This will permanently remove <strong style={{ color: 'var(--foreground)' }}>{deletePO.id}</strong> ({deletePO.supplier} · TZS {deletePO.total.toLocaleString()}) from the system.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeletePO(null)} className="btn btn-ghost">Cancel</button>
              <button onClick={handleDeletePO} style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--danger)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit' }}>
                Delete PO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Supplier Confirmation ───────────────────────── */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', overflowY: 'auto', paddingTop: '24px', paddingBottom: '24px' }}
          onClick={() => setDeleteTarget(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--card)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '14px', padding: '24px', width: '380px', maxWidth: '95vw', boxShadow: 'var(--shadow)', margin: '0 auto' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '8px' }}>Delete Supplier?</div>
            <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginBottom: '20px', lineHeight: 1.5 }}>
              This will permanently remove <strong style={{ color: 'var(--foreground)' }}>{deleteTarget.name}</strong> ({deleteTarget.id}) from the system. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteTarget(null)} className="btn btn-ghost">Cancel</button>
              <button onClick={handleDelete} style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--danger)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit' }}>
                Delete Supplier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Expenditures Tab ──────────────────────────────────── */}
      {tab === 'expenditures' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '320px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
              <input className="input-base" placeholder="Search description, payee, ref…" value={expSearch} onChange={e => setExpSearch(e.target.value)} style={{ paddingLeft: '32px' }} />
            </div>
            <select className="input-base" value={expCatFilter} onChange={e => setExpCatFilter(e.target.value)} style={{ cursor: 'pointer', maxWidth: '180px' }}>
              <option value="All">All Categories</option>
              {EXP_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <button onClick={() => exportTablePdf('Expenditures', `As at ${new Date().toLocaleDateString('en-TZ')}`,
                [{ header: 'ID', dataKey: 'id' }, { header: 'Date', dataKey: 'date' }, { header: 'Category', dataKey: 'category' }, { header: 'Description', dataKey: 'description' }, { header: 'Payee', dataKey: 'payee' }, { header: 'Amount (TZS)', dataKey: 'amount' }, { header: 'Status', dataKey: 'status' }],
                filteredExps.map(e => ({ ...e, amount: e.amount.toLocaleString() })),
                'expenditures', logo, 'download'
              )} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm" style={{ background: 'var(--secondary)', border: '1px solid var(--border)', color: 'var(--secondary-foreground)', cursor: 'pointer' }}>
                <Download size={13} /> Export
              </button>
              {canCreate && (
                <button onClick={openAddExp} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold" style={{ background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer' }}>
                  <Plus size={14} /> Add Expenditure
                </button>
              )}
            </div>
          </div>

          {/* Summary bar */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { label: 'Total Expenditure', value: `TZS ${totalExpAmount.toLocaleString()}`, color: 'var(--danger)' },
              { label: 'Records Shown', value: String(filteredExps.length), color: 'var(--foreground)' },
              { label: 'Pending Approval', value: String(filteredExps.filter(e => e.status === 'Pending').length), color: 'var(--warning)' },
              { label: 'Paid', value: String(filteredExps.filter(e => e.status === 'Paid').length), color: 'var(--success)' },
            ].map(s => (
              <div key={s.label} className="rounded-xl px-4 py-3 flex flex-col gap-1" style={{ background: 'var(--card)', border: '1px solid var(--border)', flex: 1 }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color: s.color, fontFamily: 'JetBrains Mono, monospace' }}>{s.value}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['EXP #', 'Date', 'Category', 'Description', 'Payee', 'Amount', 'Payment', 'Status', 'Approved By', 'Actions'].map(h => (
                    <th key={h} className="text-left px-3 py-3 text-xs font-semibold" style={{ color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredExps.length === 0 ? (
                  <tr><td colSpan={10} className="text-center py-12 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    {expSearch || expCatFilter !== 'All' ? 'No expenditures match your filters.' : 'No expenditures recorded yet. Click "Add Expenditure" to start.'}
                  </td></tr>
                ) : filteredExps.map((exp, i) => {
                  const st = EXP_STATUS_STYLE[exp.status] ?? EXP_STATUS_STYLE.Pending
                  return (
                    <tr key={exp.id} style={{ borderBottom: i < filteredExps.length - 1 ? '1px solid var(--border)' : 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td className="px-3 py-2 text-xs font-medium" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--primary)' }}>{exp.id}</td>
                      <td className="px-3 py-2 text-xs" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{exp.date}</td>
                      <td className="px-3 py-2 text-xs">
                        <span style={{ padding: '2px 7px', borderRadius: '99px', background: 'rgba(61,127,255,0.1)', color: 'var(--primary)', fontWeight: 500 }}>{exp.category}</span>
                      </td>
                      <td className="px-3 py-2 text-xs font-medium" style={{ color: 'var(--foreground)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.description}</td>
                      <td className="px-3 py-2 text-xs" style={{ color: 'var(--secondary-foreground)' }}>{exp.payee || '—'}</td>
                      <td className="px-3 py-2 text-xs font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--danger)', whiteSpace: 'nowrap' }}>TZS {exp.amount.toLocaleString()}</td>
                      <td className="px-3 py-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>{exp.paymentMethod}</td>
                      <td className="px-3 py-2">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: st.bg, color: st.color }}>{exp.status}</span>
                      </td>
                      <td className="px-3 py-2 text-xs" style={{ color: 'var(--secondary-foreground)' }}>{exp.approvedBy || '—'}</td>
                      <td className="px-3 py-2">
                        <div style={{ display: 'flex', gap: '3px' }}>
                          {canCreate && (
                            <button onClick={() => openEditExp(exp)} style={{ padding: '3px 7px', borderRadius: '5px', background: 'rgba(34,197,94,0.08)', color: 'var(--success)', border: '1px solid rgba(34,197,94,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontFamily: 'inherit' }}>
                              <Pencil size={10} /> Edit
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => setDeleteExp(exp)} style={{ padding: '3px 7px', borderRadius: '5px', background: 'rgba(239,68,68,0.08)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '11px' }}>
                              <Trash2 size={10} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Add/Edit Expenditure Modal ─────────────────────────── */}
      {(showExpModal || editExp) && (
        <FloatingModal
          title={editExp ? 'Edit Expenditure' : 'Record Expenditure'}
          subtitle={editExp ? `Editing ${editExp.id}` : 'Track company spending and expenses'}
          onClose={() => { setShowExpModal(false); setEditExp(null); resetExpForm() }}
          footer={
            <>
              <button onClick={() => { setShowExpModal(false); setEditExp(null); resetExpForm() }} className="btn btn-ghost">Cancel</button>
              <button onClick={handleSaveExp} disabled={!eDescription.trim() || !eAmount} className="btn btn-primary" style={{ opacity: (!eDescription.trim() || !eAmount) ? 0.6 : 1 }}>
                {editExp ? 'Save Changes' : 'Record Expenditure'}
              </button>
            </>
          }
        >
          <FormRow>
            <FormInput label="Date *" type="date" value={eDate} onChange={setEDate} />
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--secondary-foreground)' }}>Category</label>
              <select className="input-base" value={eCategory} onChange={e => setECategory(e.target.value)} style={{ cursor: 'pointer' }}>
                {EXP_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </FormRow>
          <FormInput label="Description *" placeholder="e.g. Monthly office rent payment" value={eDescription} onChange={setEDescription} />
          <FormRow>
            <FormInput label="Amount (TZS) *" type="number" placeholder="e.g. 500000" value={eAmount} onChange={setEAmount} />
            <FormInput label="Payee / Vendor" placeholder="e.g. Landlord name" value={ePayee} onChange={setEPayee} />
          </FormRow>
          <FormRow>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--secondary-foreground)' }}>Payment Method</label>
              <select className="input-base" value={ePayment} onChange={e => setEPayment(e.target.value)} style={{ cursor: 'pointer' }}>
                {EXP_PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <FormInput label="Reference / Receipt #" placeholder="e.g. REC-2026-001" value={eRef} onChange={setERef} />
          </FormRow>
          <FormRow>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--secondary-foreground)' }}>Approved By</label>
              <select className="input-base" value={eApproved} onChange={e => setEApproved(e.target.value)} style={{ cursor: 'pointer' }}>
                <option value="">— Select approver —</option>
                {employees.map(emp => <option key={emp.id} value={emp.name}>{emp.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--secondary-foreground)' }}>Status</label>
              <select className="input-base" value={eStatus} onChange={e => setEStatus(e.target.value as Expenditure['status'])} style={{ cursor: 'pointer' }}>
                {EXP_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </FormRow>
          <FormInput label="Notes" placeholder="Additional notes or context…" value={eNotes} onChange={setENotes} />
        </FloatingModal>
      )}

      {/* ── Delete Expenditure Confirmation ───────────────────── */}
      {deleteExp && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', overflowY: 'auto', paddingTop: '24px', paddingBottom: '24px' }}
          onClick={() => setDeleteExp(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--card)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '14px', padding: '24px', width: '380px', maxWidth: '95vw', boxShadow: 'var(--shadow)', margin: '0 auto' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '8px' }}>Delete Expenditure?</div>
            <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginBottom: '20px', lineHeight: 1.5 }}>
              Permanently remove <strong>{deleteExp.description}</strong> — TZS {deleteExp.amount.toLocaleString()} from the system.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteExp(null)} className="btn btn-ghost">Cancel</button>
              <button onClick={() => { deleteExpenditure(deleteExp.id); setDeleteExp(null) }} style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--danger)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── New PO Modal ───────────────────────────────────────── */}
      {showPOModal && (
        <FloatingModal
          title="New Purchase Order"
          subtitle="Create a new procurement order"
          onClose={() => setShowPOModal(false)}
          width={780}
          footer={
            <>
              <button onClick={() => setShowPOModal(false)} className="btn btn-ghost">Cancel</button>
              <button onClick={handleCreatePO} disabled={!fSupplier || poCart.some(r => !r.name)} className="btn btn-primary" style={{ opacity: !fSupplier || poCart.some(r => !r.name) ? 0.6 : 1 }}>{t('proc.createPO')}</button>
            </>
          }
        >
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--secondary-foreground)' }}>Supplier *</label>
            <input className="input-base" list="proc-supplier-list" placeholder="Type or select a supplier…" value={fSupplier} onChange={e => setFSupplier(e.target.value)} />
            <datalist id="proc-supplier-list">
              {allSupplierNames.map(n => <option key={n} value={n} />)}
            </datalist>
          </div>
          <FormRow>
            <FormInput label="Order Date *" type="date" value={fOrderDate} onChange={setFOrderDate} />
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--secondary-foreground)' }}>Status</label>
              <select className="input-base" value={fPoStatus} onChange={e => setFPoStatus(e.target.value)} style={{ cursor: 'pointer' }}>
                {PO_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </FormRow>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--secondary-foreground)' }}>Buyer</label>
            <select className="input-base" value={fBuyer} onChange={e => setFBuyer(e.target.value)} style={{ cursor: 'pointer' }}>
              <option value="">— Select buyer —</option>
              {employees.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
            </select>
          </div>

          {/* Inline item rows — mirrors Sales form */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>Order Items</label>
              <button type="button" onClick={addPoRow} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(61,127,255,0.1)', border: '1px solid rgba(61,127,255,0.3)', borderRadius: '7px', color: 'var(--primary)', cursor: 'pointer', fontFamily: 'inherit', padding: '5px 10px', fontWeight: 500 }}>
                <Plus size={13} /> Add Item
              </button>
            </div>
            <div style={{ border: '1px solid var(--border)', borderRadius: '10px', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '640px' }}>
                <thead>
                  <tr style={{ background: 'var(--secondary)', borderBottom: '2px solid var(--border)' }}>
                    {[
                      { label: 'Item Name', w: '28%' },
                      { label: 'Category', w: '18%' },
                      { label: 'Qty', w: '10%' },
                      { label: 'Unit', w: '10%' },
                      { label: 'Unit Cost (TZS)', w: '16%' },
                      { label: 'Line Total', w: '14%' },
                      { label: '', w: '4%' },
                    ].map(h => (
                      <th key={h.label} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, fontSize: '12px', color: 'var(--foreground)', width: h.w, whiteSpace: 'nowrap' }}>{h.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {poCart.map((row, i) => (
                    <tr key={i} style={{ borderBottom: i < poCart.length - 1 ? '1px solid var(--border)' : 'none', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '8px 10px' }}>
                        <input
                          className="input-base"
                          list="po-item-list"
                          placeholder="Item name…"
                          value={row.name}
                          onChange={e => {
                            const val = e.target.value
                            const match = inventoryItems.find(it => it.name.toLowerCase() === val.toLowerCase())
                            setPoCart(p => p.map((r, idx) => idx === i ? {
                              ...r, name: val,
                              category: match ? match.category : r.category,
                              unit: match ? match.unit : r.unit,
                              cost: match && match.cost > 0 ? match.cost : r.cost,
                            } : r))
                          }}
                          style={{ padding: '7px 10px', fontSize: '13px' }}
                        />
                        <datalist id="po-item-list">
                          {inventoryNames.map(n => <option key={n} value={n} />)}
                        </datalist>
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <select className="input-base" value={row.category} onChange={e => updatePoCart(i, 'category', e.target.value)} style={{ padding: '7px 8px', fontSize: '12px', cursor: 'pointer' }}>
                          {ITEM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <input className="input-base" type="number" min="1" value={row.qty} onChange={e => updatePoCart(i, 'qty', Number(e.target.value))} style={{ padding: '7px 8px', fontSize: '13px' }} />
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <input className="input-base" value={row.unit} onChange={e => updatePoCart(i, 'unit', e.target.value)} style={{ padding: '7px 8px', fontSize: '13px' }} />
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <input className="input-base" type="number" min="0" value={row.cost} onChange={e => updatePoCart(i, 'cost', Number(e.target.value))} style={{ padding: '7px 8px', fontSize: '13px' }} />
                      </td>
                      <td style={{ padding: '8px 12px', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--foreground)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        TZS {(row.qty * row.cost).toLocaleString()}
                      </td>
                      <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                        <button type="button" onClick={() => removePoRow(i)} disabled={poCart.length === 1} style={{ background: 'none', border: 'none', cursor: poCart.length === 1 ? 'not-allowed' : 'pointer', color: poCart.length === 1 ? 'var(--border)' : 'var(--danger)', padding: '4px', display: 'flex', borderRadius: '5px' }}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <div style={{ padding: '10px 18px', borderRadius: '8px', background: 'rgba(61,127,255,0.08)', border: '1px solid rgba(61,127,255,0.2)', fontSize: '14px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--primary)' }}>
                Order Total: TZS {poCartTotal.toLocaleString()}
              </div>
            </div>
          </div>
          {/* Payment type — three-button selector matching Sales form */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--secondary-foreground)' }}>Payment Type</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['Full Payment', 'Partial Payment', 'Full Credit'] as const).map(pt => {
                const col = pt === 'Full Payment' ? 'var(--success)' : pt === 'Partial Payment' ? 'var(--warning)' : 'var(--danger)'
                const active = fPoPayType === pt
                return (
                  <button key={pt} type="button" onClick={() => setFPoPayType(pt)} style={{ flex: 1, padding: '7px 6px', borderRadius: '8px', border: `2px solid ${active ? col : 'var(--border)'}`, background: active ? `${col}18` : 'var(--secondary)', color: active ? col : 'var(--secondary-foreground)', cursor: 'pointer', fontSize: '11px', fontWeight: active ? 600 : 400, fontFamily: 'inherit', transition: 'all 0.15s' }}>{pt}</button>
                )
              })}
            </div>
          </div>

          {/* Payment method — shown when money is actually being paid now */}
          {fPoPayType !== 'Full Credit' && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--secondary-foreground)' }}>Payment Method</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {(['Cash', 'Cheque', 'Bank Transfer', 'Mobile Money'] as const).map(m => {
                  const active = fPoPayMethod === m
                  return (
                    <button key={m} type="button" onClick={() => setFPoPayMethod(m)} style={{ padding: '6px 12px', borderRadius: '8px', border: `1.5px solid ${active ? 'var(--primary)' : 'var(--border)'}`, background: active ? 'rgba(61,127,255,0.1)' : 'var(--secondary)', color: active ? 'var(--primary)' : 'var(--secondary-foreground)', cursor: 'pointer', fontSize: '11px', fontWeight: active ? 600 : 400, fontFamily: 'inherit', transition: 'all 0.15s' }}>{m}</button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Partial Payment — amount paid + balance remaining (mirrors Sales form) */}
          {fPoPayType === 'Partial Payment' && (
            <FormRow>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--secondary-foreground)' }}>Amount Paid Now (TZS)</label>
                <input className="input-base" type="number" min="0" placeholder="0" value={fPoInitAmount} onChange={e => setFPoInitAmount(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--secondary-foreground)' }}>Balance Remaining (TZS)</label>
                <div style={{ padding: '9px 13px', borderRadius: '8px', background: 'var(--secondary)', border: '1px solid var(--border)', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: 700, color: 'var(--danger)' }}>
                  {Math.max(0, poCartTotal - (Number(fPoInitAmount) || 0)).toLocaleString()}
                </div>
              </div>
            </FormRow>
          )}

          {/* Status hints */}
          <div style={{ padding: '8px 12px', borderRadius: '8px', background: fPoPayType === 'Full Credit' ? 'rgba(239,68,68,0.06)' : fPoPayType === 'Partial Payment' ? 'rgba(245,158,11,0.06)' : 'rgba(34,197,94,0.06)', border: `1px solid ${fPoPayType === 'Full Credit' ? 'rgba(239,68,68,0.2)' : fPoPayType === 'Partial Payment' ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.2)'}`, fontSize: '12px', color: 'var(--secondary-foreground)' }}>
            {fPoPayType === 'Full Credit' && '⚠️ Full Credit — entire amount owed to supplier. Add installments from the PO detail view.'}
            {fPoPayType === 'Partial Payment' && '⏳ Partial Payment — enter the amount paid now; track remaining installments in the PO detail view.'}
            {fPoPayType === 'Full Payment' && '✅ Full Payment — order will be marked as fully paid immediately.'}
          </div>
          <FormInput label="Notes (optional)" placeholder="Any special instructions or notes…" value={fPoNotes} onChange={setFPoNotes} />
        </FloatingModal>
      )}
    </div>
  )
}
