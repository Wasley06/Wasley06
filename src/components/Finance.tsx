import { useState } from 'react'
import { useLang } from '@/i18n'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { TrendingUp, TrendingDown, CreditCard, ArrowUpRight, Plus, Download, Trash2, Eye, Share2, Printer } from 'lucide-react'
import FloatingModal, { FormInput, FormSelect, FormRow } from './FloatingModal'
import { exportTablePdf, exportStatementPdf } from '../utils/exportPdf'
import { useApp, type Creditor, type CreditorTransaction } from '../context/AppContext'

const ACCOUNT_OPTIONS = [
  'Cash & Bank','Bank - NCBA','Bank - Equity Bank','Petty Cash',
  'Accounts Receivable','Inventory - Raw Materials','Inventory - Finished Goods',
  'Prepaid Expenses','Fixed Assets','Accumulated Depreciation',
  'Accounts Payable','Creditors - Trade','Salaries Payable','VAT Payable',
  'Tax Payable','Loan Payable','Customer Deposits',
  'Retained Earnings','Share Capital','Drawings',
  'Sales Revenue','Other Income','Interest Income',
  'COGS','Cost of Goods Sold','Salaries Expense','Electricity Expense',
  'Rent Expense','Transport Expense','Fuel Expense','Repairs & Maintenance',
  'Office Supplies','Depreciation Expense','Bank Charges','Insurance',
  'Marketing Expense','Miscellaneous Expense',
]

function genJeRef() {
  const d = new Date()
  const ymd = d.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `JE-${ymd}-${rand}`
}

function genTxRef() {
  return `TX-${Date.now().toString(36).toUpperCase()}`
}

function fmt(n: number) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`
  return n.toLocaleString()
}

const CRED_STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  Outstanding: { bg: 'rgba(239,68,68,0.1)',   color: 'var(--danger)' },
  Partial:     { bg: 'rgba(245,158,11,0.1)',  color: 'var(--warning)' },
  Settled:     { bg: 'rgba(34,197,94,0.1)',   color: 'var(--success)' },
}

/* ── Creditor Management Modal ─────────────────────────────── */
function CreditorManageModal({ creditor, onClose, onUpdate }: {
  creditor: Creditor; onClose: () => void; onUpdate: (c: Creditor) => void
}) {
  const [tab, setTab] = useState<'info' | 'transactions' | 'statement'>('info')
  const [editing, setEditing] = useState<Creditor>({ ...creditor })

  /* Add Transaction form */
  const [txDate,  setTxDate]  = useState(new Date().toISOString().slice(0, 10))
  const [txRef,   setTxRef]   = useState(genTxRef)
  const [txDesc,  setTxDesc]  = useState('')
  const [txDebit, setTxDebit] = useState('')
  const [txCredit,setTxCredit]= useState('')

  /* Statement */
  const [stFrom, setStFrom] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 10)
  })
  const [stTo,   setStTo]   = useState(new Date().toISOString().slice(0, 10))
  const [stAction, setStAction] = useState<'download' | 'print' | 'share'>('download')

  const txs = editing.transactions ?? []

  const handleSaveInfo = () => {
    onUpdate(editing)
    onClose()
  }

  const handleAddTx = () => {
    if (!txDesc.trim() || (!txDebit && !txCredit)) return
    const debit  = Number(txDebit)  || 0
    const credit = Number(txCredit) || 0
    const prevBalance = txs.length > 0 ? txs[txs.length - 1].balance : (editing.openingBalance ?? editing.amount)
    const balance = prevBalance + debit - credit
    const newTx: CreditorTransaction = { id: genTxRef(), date: txDate, reference: txRef, description: txDesc.trim(), debit, credit, balance }
    const newTxs = [...txs, newTx]
    const newAmount = Math.max(0, balance)
    const newStatus: Creditor['status'] = newAmount <= 0 ? 'Settled' : credit > 0 ? 'Partial' : editing.status
    const updated: Creditor = { ...editing, transactions: newTxs, amount: newAmount, status: newStatus }
    setEditing(updated)
    onUpdate(updated)
    setTxDate(new Date().toISOString().slice(0, 10))
    setTxRef(genTxRef())
    setTxDesc('')
    setTxDebit('')
    setTxCredit('')
  }

  const handleGenerateStatement = async () => {
    const filtered = txs.filter(t => t.date >= stFrom && t.date <= stTo)
    const openBal = editing.openingBalance ?? 0
    await exportStatementPdf(
      `Creditor Statement`,
      editing.name,
      `${stFrom} to ${stTo}`,
      openBal,
      filtered,
      `stmt_${editing.id}_${stFrom}_${stTo}`,
      undefined,
      stAction,
    )
  }

  return (
    <FloatingModal
      title="Creditor Management"
      subtitle={`${editing.id} · ${editing.name}`}
      onClose={onClose}
      width={680}
      footer={
        tab === 'info' ? (
          <>
            <button className="btn btn-ghost" onClick={onClose}>Close</button>
            <button className="btn btn-primary" onClick={handleSaveInfo}>Save Changes</button>
          </>
        ) : tab === 'transactions' ? (
          <>
            <button className="btn btn-ghost" onClick={onClose}>Close</button>
            <button className="btn btn-primary" onClick={handleAddTx} disabled={!txDesc.trim() || (!txDebit && !txCredit)}>Add Transaction</button>
          </>
        ) : (
          <>
            <button className="btn btn-ghost" onClick={onClose}>Close</button>
            <button className="btn btn-primary" onClick={handleGenerateStatement}>Generate Statement</button>
          </>
        )
      }
    >
      {/* Status KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '4px' }}>
        {[
          { label: 'Outstanding', value: `TZS ${editing.amount.toLocaleString()}`, color: 'var(--danger)' },
          { label: 'Status',      value: editing.status,       color: CRED_STATUS_STYLE[editing.status]?.color ?? 'var(--foreground)' },
          { label: 'Due Date',    value: editing.dueDate || '—', color: 'var(--foreground)' },
        ].map(k => (
          <div key={k.label} style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--secondary)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{k.label}</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: k.color, fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border)' }}>
        {([['info', 'Basic Info'], ['transactions', `Transactions (${txs.length})`], ['statement', 'Statement']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 500, fontFamily: 'inherit', border: 'none', background: 'transparent', cursor: 'pointer', color: tab === k ? 'var(--primary)' : 'var(--muted-foreground)', borderBottom: tab === k ? '2px solid var(--primary)' : '2px solid transparent', marginBottom: '-1px' }}>
            {l}
          </button>
        ))}
      </div>

      {/* ── Basic Info tab ── */}
      {tab === 'info' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          <FormInput label="Creditor Name *" placeholder="e.g. Rift Valley Grains Ltd" value={editing.name}
            onChange={v => setEditing(p => ({ ...p, name: v }))} />
          <FormRow>
            <FormInput label="Creditor Code" placeholder="e.g. CR-001" value={editing.code ?? ''}
              onChange={v => setEditing(p => ({ ...p, code: v }))} />
            <FormSelect label="Type" options={['other', 'supplier']} value={editing.type}
              onChange={v => setEditing(p => ({ ...p, type: v as 'supplier' | 'other' }))} />
          </FormRow>
          <FormRow>
            <FormInput label="Contact Person" placeholder="e.g. John Doe" value={editing.contactPerson ?? ''}
              onChange={v => setEditing(p => ({ ...p, contactPerson: v }))} />
            <FormInput label="Phone" type="tel" placeholder="+255 700 000 000" value={editing.phone ?? ''}
              onChange={v => setEditing(p => ({ ...p, phone: v }))} />
          </FormRow>
          <FormRow>
            <FormInput label="Email" type="email" placeholder="creditor@company.com" value={editing.email ?? ''}
              onChange={v => setEditing(p => ({ ...p, email: v }))} />
            <FormInput label="Credit Limit (TZS)" type="number" placeholder="0" value={String(editing.creditLimit ?? '')}
              onChange={v => setEditing(p => ({ ...p, creditLimit: Number(v) || 0 }))} />
          </FormRow>
          <FormRow>
            <FormInput label="Opening Balance (TZS)" type="number" placeholder="0" value={String(editing.openingBalance ?? '')}
              onChange={v => setEditing(p => ({ ...p, openingBalance: Number(v) || 0 }))} />
            <FormInput label="Amount Outstanding (TZS) *" type="number" placeholder="0" value={String(editing.amount)}
              onChange={v => setEditing(p => ({ ...p, amount: Number(v) || 0 }))} />
          </FormRow>
          <FormRow>
            <FormInput label="Due Date" type="date" value={editing.dueDate}
              onChange={v => setEditing(p => ({ ...p, dueDate: v }))} />
            <FormSelect label="Status" options={['Outstanding', 'Partial', 'Settled']} value={editing.status}
              onChange={v => setEditing(p => ({ ...p, status: v as Creditor['status'] }))} />
          </FormRow>
          <FormInput label="Notes" placeholder="e.g. PO-883 balance" value={editing.notes || ''}
            onChange={v => setEditing(p => ({ ...p, notes: v }))} />
        </div>
      )}

      {/* ── Transactions tab ── */}
      {tab === 'transactions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Transaction log */}
          {txs.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '13px', background: 'var(--secondary)', borderRadius: '8px' }}>
              No transactions yet — add the first transaction below
            </div>
          ) : (
            <div style={{ maxHeight: '220px', overflowY: 'auto', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: 'var(--secondary)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0 }}>
                    {['Date', 'Reference', 'Description', 'Debit', 'Credit', 'Balance'].map(h => (
                      <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: 'var(--muted-foreground)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {txs.map((t, i) => (
                    <tr key={t.id} style={{ borderBottom: i < txs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono', color: 'var(--muted-foreground)' }}>{t.date}</td>
                      <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono', color: 'var(--primary)', fontWeight: 600 }}>{t.reference}</td>
                      <td style={{ padding: '6px 10px', color: 'var(--foreground)' }}>{t.description}</td>
                      <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono', color: t.debit > 0 ? 'var(--danger)' : 'var(--muted-foreground)', fontWeight: t.debit > 0 ? 600 : 400 }}>
                        {t.debit > 0 ? t.debit.toLocaleString() : '—'}
                      </td>
                      <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono', color: t.credit > 0 ? 'var(--success)' : 'var(--muted-foreground)', fontWeight: t.credit > 0 ? 600 : 400 }}>
                        {t.credit > 0 ? t.credit.toLocaleString() : '—'}
                      </td>
                      <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono', fontWeight: 600, color: t.balance > 0 ? 'var(--danger)' : 'var(--success)' }}>
                        {t.balance.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Add Transaction form */}
          <div style={{ padding: '14px', borderRadius: '10px', background: 'var(--secondary)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '12px' }}>Add Transaction</div>
            <FormRow>
              <FormInput label="Date *" type="date" value={txDate} onChange={setTxDate} />
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--secondary-foreground)' }}>Reference</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input className="input-base" value={txRef} onChange={e => setTxRef(e.target.value)} style={{ flex: 1 }} />
                  <button type="button" onClick={() => setTxRef(genTxRef())} style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--card)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', whiteSpace: 'nowrap', color: 'var(--secondary-foreground)' }}>↺</button>
                </div>
              </div>
            </FormRow>
            <FormInput label="Description *" placeholder="e.g. Invoice payment, Delivery charge…" value={txDesc} onChange={setTxDesc} />
            <FormRow>
              <FormInput label="Debit (TZS) — amount owed" type="number" placeholder="0" value={txDebit} onChange={setTxDebit} />
              <FormInput label="Credit (TZS) — payment received" type="number" placeholder="0" value={txCredit} onChange={setTxCredit} />
            </FormRow>
          </div>
        </div>
      )}

      {/* ── Statement tab ── */}
      {tab === 'statement' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--secondary)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '10px' }}>Statement Parameters</div>
            <FormRow>
              <FormInput label="From Date" type="date" value={stFrom} onChange={setStFrom} />
              <FormInput label="To Date" type="date" value={stTo} onChange={setStTo} />
            </FormRow>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--secondary-foreground)' }}>Output</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['download', 'print', 'share'] as const).map(a => (
                  <button key={a} onClick={() => setStAction(a)} style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontFamily: 'inherit', border: '1px solid var(--border)', cursor: 'pointer', textTransform: 'capitalize', background: stAction === a ? 'var(--primary)' : 'var(--card)', color: stAction === a ? 'white' : 'var(--secondary-foreground)', fontWeight: stAction === a ? 600 : 400 }}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview summary */}
          <div style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '8px' }}>Statement Preview</div>
            {(() => {
              const filtered = txs.filter(t => t.date >= stFrom && t.date <= stTo)
              const totalD = filtered.reduce((s, t) => s + t.debit, 0)
              const totalC = filtered.reduce((s, t) => s + t.credit, 0)
              const closing = (editing.openingBalance ?? 0) + totalD - totalC
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {[
                    { label: 'Transactions', value: String(filtered.length),              color: 'var(--foreground)' },
                    { label: 'Total Debits',  value: `TZS ${totalD.toLocaleString()}`,    color: 'var(--danger)' },
                    { label: 'Total Credits', value: `TZS ${totalC.toLocaleString()}`,    color: 'var(--success)' },
                    { label: 'Closing Bal',   value: `TZS ${closing.toLocaleString()}`,   color: closing > 0 ? 'var(--danger)' : 'var(--success)' },
                  ].map(k => (
                    <div key={k.label} style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--secondary)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase' }}>{k.label}</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: k.color, fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>{k.value}</div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </FloatingModal>
  )
}

export default function Finance({ logoUrl: _logoUrl }: { logoUrl?: string } = {}) {
  const { t } = useLang()
  const { creditors, addCreditor, updateCreditor, deleteCreditor, addManualJournal, journalEntries, salesOrders, purchaseOrders } = useApp()

  const [showJournalModal,  setShowJournalModal]  = useState(false)
  const [showCreditorModal, setShowCreditorModal] = useState(false)
  const [manageCreditor,    setManageCreditor]    = useState<Creditor | null>(null)
  const [tab, setTab] = useState<'overview' | 'journal' | 'creditors'>('overview')
  const [credSearch,        setCredSearch]        = useState('')
  const [credStatusFilter,  setCredStatusFilter]  = useState('All')

  const [jRef,         setJRef]         = useState(() => genJeRef())
  const [jDate,        setJDate]        = useState(new Date().toISOString().slice(0, 10))
  const [jDescription, setJDescription] = useState('')
  const [jType,        setJType]        = useState<'sales'|'purchase'|'payment'|'adjustment'>('adjustment')
  const [jAccount,     setJAccount]     = useState(ACCOUNT_OPTIONS[0])
  const [jDebit,       setJDebit]       = useState('')
  const [jCredit,      setJCredit]      = useState('')

  const [credName,   setCredName]   = useState('')
  const [credType,   setCredType]   = useState<'supplier' | 'other'>('other')
  const [credAmt,    setCredAmt]    = useState('')
  const [credDue,    setCredDue]    = useState('')
  const [credNotes,  setCredNotes]  = useState('')
  const [credStatus, setCredStatus] = useState('Outstanding')
  const [credCode,   setCredCode]   = useState('')
  const [credContact,setCredContact]= useState('')
  const [credPhone,  setCredPhone]  = useState('')
  const [credEmail,  setCredEmail]  = useState('')
  const [credLimit,  setCredLimit]  = useState('')
  const [credOpening,setCredOpening]= useState('')

  const totalRevenue   = salesOrders.filter(o => o.status !== 'Cancelled').reduce((s, o) => s + o.total, 0)
  const totalSales     = salesOrders.reduce((s, o) => s + o.total, 0)
  const totalPurchases = purchaseOrders.reduce((s, o) => s + o.total, 0)
  const totalCredit    = creditors.filter(c => c.status !== 'Settled').reduce((s, c) => s + c.amount, 0)
  const filteredCreditors = creditors.filter(c => {
    const matchStatus = credStatusFilter === 'All' || c.status === credStatusFilter
    const q = credSearch.toLowerCase()
    const matchQ = !q || c.name.toLowerCase().includes(q) || (c.code ?? '').toLowerCase().includes(q) || (c.contactPerson ?? '').toLowerCase().includes(q) || (c.phone ?? '').includes(q)
    return matchStatus && matchQ
  })
  const cashOnHand     = Math.max(0, totalRevenue - totalPurchases - totalCredit)

  const cashflow = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i))
    const m = d.toISOString().slice(0, 7)
    const label = d.toLocaleString('en', { month: 'short' })
    const inflow   = salesOrders.filter(o => (o.date || '').startsWith(m) && o.status !== 'Cancelled').reduce((s, o) => s + o.total, 0)
    const outflow  = purchaseOrders.filter(o => (o.date || '').startsWith(m)).reduce((s, o) => s + o.total, 0)
    const journalIn  = journalEntries.filter(j => j.date.startsWith(m) && j.credit > 0).reduce((s, j) => s + j.credit, 0)
    const journalOut = journalEntries.filter(j => j.date.startsWith(m) && j.debit > 0).reduce((s, j) => s + j.debit, 0)
    return { month: label, inflow: Math.max(inflow, journalIn), outflow: Math.max(outflow, journalOut) }
  })

  const allJournal = journalEntries.map(j => ({
    ref: j.ref || j.id, date: j.date, description: j.description,
    debit: j.debit, credit: j.credit,
    account: j.type === 'sales' ? 'Accounts Receivable' : j.type === 'purchase' ? 'Accounts Payable' : 'General',
  }))

  const handlePostJournal = () => {
    if (!jDescription.trim()) return
    addManualJournal({ date: jDate, ref: jRef, description: jDescription.trim(), debit: Number(jDebit) || 0, credit: Number(jCredit) || 0, type: jType })
    setShowJournalModal(false)
    setJRef(genJeRef())
    setJDate(new Date().toISOString().slice(0, 10))
    setJDescription('')
    setJType('adjustment')
    setJAccount(ACCOUNT_OPTIONS[0])
    setJDebit('')
    setJCredit('')
  }

  const handleSaveCreditor = () => {
    if (!credName.trim() || !credAmt) return
    const openBal = Number(credOpening) || Number(credAmt) || 0
    addCreditor({
      id: `CR-${Date.now().toString(36).toUpperCase()}`,
      name: credName.trim(), code: credCode || undefined, type: credType,
      contactPerson: credContact || undefined, phone: credPhone || undefined, email: credEmail || undefined,
      amount: Number(credAmt),
      openingBalance: openBal, creditLimit: Number(credLimit) || undefined,
      dueDate: credDue || new Date().toISOString().slice(0, 10),
      status: credStatus as Creditor['status'], notes: credNotes,
      transactions: [{ id: `TX-OPEN-${Date.now().toString(36).toUpperCase()}`, date: credDue || new Date().toISOString().slice(0, 10), reference: `CR-OPEN`, description: 'Opening balance', debit: Number(credAmt), credit: 0, balance: Number(credAmt) }],
    })
    setShowCreditorModal(false)
    setCredName(''); setCredCode(''); setCredAmt(''); setCredDue(''); setCredNotes('')
    setCredType('other'); setCredStatus('Outstanding'); setCredContact(''); setCredPhone('')
    setCredEmail(''); setCredLimit(''); setCredOpening('')
  }

  const exportCreditors = (action: 'download' | 'print' | 'share' = 'download') => {
    exportTablePdf(
      t("fin.creditors"), `As at ${new Date().toLocaleDateString('en-TZ')}`,
      [
        { header: 'ID',           dataKey: 'id' },
        { header: 'Creditor',     dataKey: 'name' },
        { header: 'Type',         dataKey: 'type' },
        { header: 'Amount (TZS)', dataKey: 'amount' },
        { header: 'Due Date',     dataKey: 'dueDate' },
        { header: 'Status',       dataKey: 'status' },
        { header: 'Notes',        dataKey: 'notes' },
      ],
      filteredCreditors.map(c => ({ ...c, amount: c.amount.toLocaleString() })),
      'creditors',
      undefined,
      action,
    )
  }

  const exportJournal = () => {
    exportTablePdf(
      'General Ledger — Journal Entries', 'Recent transactions',
      [
        { header: 'Ref',          dataKey: 'ref' },
        { header: 'Date',         dataKey: 'date' },
        { header: 'Description',  dataKey: 'description' },
        { header: 'Account',      dataKey: 'account' },
        { header: 'Debit (TZS)',  dataKey: 'debit' },
        { header: 'Credit (TZS)', dataKey: 'credit' },
      ],
      allJournal.map(j => ({
        ...j,
        debit:  j.debit  > 0 ? j.debit.toLocaleString()  : '—',
        credit: j.credit > 0 ? j.credit.toLocaleString() : '—',
      })),
      'journal_entries',
    )
  }

  return (
    <div className="p-6 space-y-5 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>{t("fin.title")}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>General Ledger · Cash Flow · P&L · Creditors</p>
        </div>
        <button onClick={exportJournal} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--secondary)', border: '1px solid var(--border)', color: 'var(--secondary-foreground)' }}>
          <Download size={13} /> Export Reports
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: t("fin.totalRevenue"),   value: `TZS ${fmt(totalRevenue)}`,   icon: TrendingUp,   color: 'var(--success)' },
          { label: t("fin.totalSales"),     value: `TZS ${fmt(totalSales)}`,     icon: TrendingDown, color: 'var(--primary)' },
          { label: t("fin.totalPurchases"), value: `TZS ${fmt(totalPurchases)}`, icon: CreditCard,   color: 'var(--danger)' },
          { label: t("fin.cashOnHand"),     value: `TZS ${fmt(cashOnHand)}`,     icon: ArrowUpRight, color: 'var(--success)' },
        ].map(c => (
          <div key={c.label} className="card rounded-xl px-4 py-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <c.icon size={14} style={{ color: c.color }} />
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{c.label}</span>
            </div>
            <div className="text-xl font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--foreground)' }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border)' }}>
        {([['overview', 'Overview'], ['journal', 'Journal Entries'], ['creditors', t("fin.creditors")]] as const).map(([tabKey, label]) => (
          <button key={tabKey} onClick={() => setTab(tabKey)} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, fontFamily: 'inherit', border: 'none', background: 'transparent', cursor: 'pointer', color: tab === tabKey ? 'var(--primary)' : 'var(--muted-foreground)', borderBottom: tab === tabKey ? '2px solid var(--primary)' : '2px solid transparent', marginBottom: '-1px' }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="card rounded-xl p-5">
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>Cash Flow</div>
          <div className="text-xs mb-4" style={{ color: 'var(--muted-foreground)' }}>Inflow vs Outflow · last 6 months · live data</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={cashflow}>
              <defs>
                <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22C55E" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(128,128,128,0.08)" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontFamily: 'inherit' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `${fmt(Number(v))}`} tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} formatter={(v) => `TZS ${fmt(Number(v))}`} />
              <Area type="monotone" dataKey="inflow"  name="Inflow"  stroke="#22C55E" strokeWidth={2} fill="url(#gIn)" />
              <Area type="monotone" dataKey="outflow" name="Outflow" stroke="#EF4444" strokeWidth={2} fill="url(#gOut)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 'journal' && (
        <div className="space-y-4">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>
              General Ledger — <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--primary)' }}>{allJournal.length} entries</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={exportJournal} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--secondary)', border: '1px solid var(--border)', color: 'var(--secondary-foreground)' }}>
                <Download size={13} /> Export PDF
              </button>
              <button onClick={() => setShowJournalModal(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--primary)', color: 'white' }}>
                <Plus size={14} /> Journal Entry
              </button>
            </div>
          </div>
          <div className="card rounded-xl overflow-hidden">
            {allJournal.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '14px' }}>
                No journal entries yet — transactions from Sales, Purchases, and Inventory auto-generate entries here
              </div>
            ) : (
              <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--secondary)' }}>
                    {['Ref', 'Date', 'Description', 'Type', 'Debit (TZS)', 'Credit (TZS)'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '11px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allJournal.map((j, i) => (
                    <tr key={j.ref + i} style={{ borderBottom: i < allJournal.length - 1 ? '1px solid var(--border)' : 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--secondary)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '11px 16px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--primary)', fontWeight: 600 }}>{j.ref}</td>
                      <td style={{ padding: '11px 16px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--muted-foreground)' }}>{j.date}</td>
                      <td style={{ padding: '11px 16px', fontSize: '12px', color: 'var(--foreground)' }}>{j.description}</td>
                      <td style={{ padding: '11px 16px' }}>
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: 600, textTransform: 'capitalize', background: j.account === 'Accounts Receivable' ? 'rgba(34,197,94,0.12)' : j.account === 'Accounts Payable' ? 'rgba(239,68,68,0.12)' : 'rgba(100,116,139,0.15)', color: j.account === 'Accounts Receivable' ? 'var(--success)' : j.account === 'Accounts Payable' ? 'var(--danger)' : 'var(--muted-foreground)' }}>{j.account}</span>
                      </td>
                      <td style={{ padding: '11px 16px', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: j.debit > 0 ? 'var(--success)' : 'var(--muted-foreground)', fontWeight: j.debit > 0 ? 600 : 400 }}>
                        {j.debit > 0 ? j.debit.toLocaleString() : '—'}
                      </td>
                      <td style={{ padding: '11px 16px', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: j.credit > 0 ? 'var(--danger)' : 'var(--muted-foreground)', fontWeight: j.credit > 0 ? 600 : 400 }}>
                        {j.credit > 0 ? j.credit.toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === 'creditors' && (
        <div className="space-y-4">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)', pointerEvents: 'none', fontSize: '13px' }}>🔍</span>
                <input className="input-base" placeholder="Search creditors…" value={credSearch} onChange={e => setCredSearch(e.target.value)} style={{ paddingLeft: '30px', width: '200px' }} />
              </div>
              <select className="input-base" value={credStatusFilter} onChange={e => setCredStatusFilter(e.target.value)} style={{ cursor: 'pointer', width: '140px' }}>
                <option value="All">All Statuses</option>
                <option value="Outstanding">Outstanding</option>
                <option value="Partial">Partial</option>
                <option value="Settled">Settled</option>
              </select>
              <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
                <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--danger)', fontWeight: 700 }}>TZS {fmt(totalCredit)}</span> outstanding · {filteredCreditors.length} shown
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => exportCreditors('share')} title="Share" className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--secondary)', border: '1px solid var(--border)', color: 'var(--secondary-foreground)', cursor: 'pointer' }}>
                <Share2 size={13} />
              </button>
              <button onClick={() => exportCreditors('print')} title="Print" className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--secondary)', border: '1px solid var(--border)', color: 'var(--secondary-foreground)', cursor: 'pointer' }}>
                <Printer size={13} />
              </button>
              <button onClick={() => exportCreditors('download')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--secondary)', border: '1px solid var(--border)', color: 'var(--secondary-foreground)', cursor: 'pointer' }}>
                <Download size={13} /> Export PDF
              </button>
              <button onClick={() => setShowCreditorModal(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--primary)', color: 'white', cursor: 'pointer' }}>
                <Plus size={14} /> Add Creditor
              </button>
            </div>
          </div>

          <div className="card rounded-xl overflow-hidden">
            {creditors.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '13px' }}>
                No creditors recorded — click "Add Creditor" to add one
              </div>
            ) : (
              <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['ID', 'Creditor', 'Contact', 'Type', 'Amount (TZS)', 'Due Date', 'Txns', 'Status', 'Notes', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCreditors.length === 0 && (
                    <tr><td colSpan={10} style={{ padding: '32px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '13px' }}>
                      {credSearch || credStatusFilter !== 'All' ? `No creditors match your filters.` : 'No creditors recorded yet.'}
                    </td></tr>
                  )}
                  {filteredCreditors.map((c, i) => {
                    const st = CRED_STATUS_STYLE[c.status] ?? CRED_STATUS_STYLE.Outstanding
                    return (
                      <tr key={c.id} style={{ borderBottom: i < filteredCreditors.length - 1 ? '1px solid var(--border)' : 'none' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--secondary)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '10px 14px', fontSize: '11px', fontFamily: 'JetBrains Mono', color: 'var(--primary)' }}>{c.id}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>{c.name}</div>
                          {c.code && <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono' }}>{c.code}</div>}
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: '11px', color: 'var(--muted-foreground)' }}>
                          {c.contactPerson && <div>{c.contactPerson}</div>}
                          {c.phone && <div>{c.phone}</div>}
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: '11px', color: 'var(--muted-foreground)', textTransform: 'capitalize' }}>{c.type}</td>
                        <td style={{ padding: '10px 14px', fontSize: '12px', fontFamily: 'JetBrains Mono', color: 'var(--danger)', fontWeight: 600 }}>{c.amount.toLocaleString()}</td>
                        <td style={{ padding: '10px 14px', fontSize: '11px', fontFamily: 'JetBrains Mono', color: 'var(--muted-foreground)' }}>{c.dueDate}</td>
                        <td style={{ padding: '10px 14px', fontSize: '11px', fontFamily: 'JetBrains Mono', color: 'var(--muted-foreground)' }}>{(c.transactions ?? []).length}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: 500, background: st.bg, color: st.color }}>{c.status}</span>
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: '11px', color: 'var(--secondary-foreground)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.notes}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={() => setManageCreditor(c)} title="Manage creditor" style={{ padding: '3px 7px', borderRadius: '5px', background: 'rgba(61,127,255,0.08)', color: 'var(--primary)', border: '1px solid rgba(61,127,255,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px' }}>
                              <Eye size={11} /> Manage
                            </button>
                            <button onClick={() => deleteCreditor(c.id)} title="Delete creditor" style={{ padding: '3px 7px', borderRadius: '5px', background: 'rgba(239,68,68,0.08)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Journal Entry Modal */}
      {showJournalModal && (
        <FloatingModal title="New Journal Entry" subtitle="Post a double-entry transaction to the general ledger" onClose={() => setShowJournalModal(false)}
          footer={<>
            <button onClick={() => setShowJournalModal(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={handlePostJournal} disabled={!jDescription.trim()} className="btn btn-primary" style={{ opacity: !jDescription.trim() ? 0.6 : 1 }}>Post Entry</button>
          </>}
        >
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--secondary-foreground)' }}>Reference (auto-generated)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ flex: 1, padding: '9px 13px', borderRadius: '8px', background: 'var(--muted)', border: '1px solid var(--border)', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--primary)', fontWeight: 600 }}>{jRef}</div>
              <button type="button" onClick={() => setJRef(genJeRef())} style={{ padding: '9px 12px', borderRadius: '8px', background: 'var(--secondary)', border: '1px solid var(--border)', color: 'var(--secondary-foreground)', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>↺ New</button>
            </div>
          </div>
          <FormRow>
            <FormInput label="Date" type="date" value={jDate} onChange={setJDate} />
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--secondary-foreground)' }}>Transaction Type</label>
              <select className="input-base" value={jType} onChange={e => setJType(e.target.value as typeof jType)} style={{ width: '100%', cursor: 'pointer' }}>
                <option value="adjustment">Adjustment</option>
                <option value="sales">Sales / Revenue</option>
                <option value="purchase">Purchase / Expense</option>
                <option value="payment">Payment</option>
              </select>
            </div>
          </FormRow>
          <FormInput label="Description *" placeholder="e.g. Sales revenue — Naivas SO-2848" value={jDescription} onChange={setJDescription} />
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--secondary-foreground)' }}>Account</label>
            <input className="input-base" list="je-accounts-list" value={jAccount} onChange={e => setJAccount(e.target.value)} placeholder="Type to search or select account…" style={{ width: '100%' }} />
            <datalist id="je-accounts-list">{ACCOUNT_OPTIONS.map(a => <option key={a} value={a} />)}</datalist>
          </div>
          <FormRow>
            <FormInput label="Debit Amount (TZS)" type="number" placeholder="0" value={jDebit} onChange={setJDebit} />
            <FormInput label="Credit Amount (TZS)" type="number" placeholder="0" value={jCredit} onChange={setJCredit} />
          </FormRow>
        </FloatingModal>
      )}

      {/* Add Creditor Modal */}
      {showCreditorModal && (
        <FloatingModal title="Add Creditor" subtitle="Record a new creditor or outstanding liability" onClose={() => setShowCreditorModal(false)}
          footer={<>
            <button onClick={() => setShowCreditorModal(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={handleSaveCreditor} disabled={!credName.trim() || !credAmt} className="btn btn-primary" style={{ opacity: (!credName.trim() || !credAmt) ? 0.6 : 1 }}>Save Creditor</button>
          </>}
        >
          <FormInput label="Creditor Name *" placeholder="e.g. Rift Valley Grains Ltd" value={credName} onChange={setCredName} />
          <FormRow>
            <FormInput label="Creditor Code" placeholder="e.g. CR-001" value={credCode} onChange={setCredCode} />
            <FormSelect label="Type" options={['other', 'supplier']} value={credType} onChange={v => setCredType(v as 'supplier' | 'other')} />
          </FormRow>
          <FormRow>
            <FormInput label="Contact Person" placeholder="e.g. John Doe" value={credContact} onChange={setCredContact} />
            <FormInput label="Phone" type="tel" placeholder="+255 700 000 000" value={credPhone} onChange={setCredPhone} />
          </FormRow>
          <FormRow>
            <FormInput label="Email" type="email" placeholder="creditor@company.com" value={credEmail} onChange={setCredEmail} />
            <FormInput label="Credit Limit (TZS)" type="number" placeholder="0" value={credLimit} onChange={setCredLimit} />
          </FormRow>
          <FormRow>
            <FormInput label="Amount Outstanding (TZS) *" type="number" placeholder="0" value={credAmt} onChange={setCredAmt} />
            <FormInput label="Due Date" type="date" value={credDue} onChange={setCredDue} />
          </FormRow>
          <FormRow>
            <FormSelect label="Status" options={['Outstanding', 'Partial', 'Settled']} value={credStatus} onChange={setCredStatus} />
            <FormInput label="Notes (optional)" placeholder="e.g. PO-883 balance" value={credNotes} onChange={setCredNotes} />
          </FormRow>
        </FloatingModal>
      )}

      {/* Creditor Management Modal */}
      {manageCreditor && (
        <CreditorManageModal
          creditor={manageCreditor}
          onClose={() => setManageCreditor(null)}
          onUpdate={updated => {
            updateCreditor(updated)
            setManageCreditor(updated)
          }}
        />
      )}
    </div>
  )
}
