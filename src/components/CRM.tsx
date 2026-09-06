import { useState } from 'react'
import { useLang } from '@/i18n'
import { Plus, Phone, Mail, UserCheck, TrendingUp, Pencil, Trash2, Eye, Download, X, Search, ShoppingCart, DollarSign, AlertCircle, Calendar } from 'lucide-react'
import FloatingModal, { FormInput, FormSelect, FormRow } from './FloatingModal'
import { useApp, type Lead, type Client, type ClientVisit } from '@/context/AppContext'
import { exportTablePdf, exportCustomer360Pdf } from '../utils/exportPdf'
import fabegonLogo from '@/imports/ChatGPT_Image_Jun_27__2026__02_20_03_AM.png'

const STAGE_ORDER = ['New', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost']
const STAGE_STYLE: Record<string, { bg: string; color: string }> = {
  New:         { bg: 'rgba(100,116,139,0.2)', color: '#94A3B8' },
  Qualified:   { bg: 'rgba(61,127,255,0.1)',  color: 'var(--primary)' },
  Proposal:    { bg: 'rgba(99,102,241,0.1)',  color: 'var(--accent)' },
  Negotiation: { bg: 'rgba(245,158,11,0.1)', color: 'var(--warning)' },
  Won:         { bg: 'rgba(34,197,94,0.1)',   color: 'var(--success)' },
  Lost:        { bg: 'rgba(239,68,68,0.1)',   color: 'var(--danger)' },
}

/* ── Client modal ──────────────────────────────────────────── */
function ClientModal({
  client, onClose, onSave, title,
}: {
  client: Partial<Client>; onClose: () => void
  onSave: (c: Client) => void; title: string
}) {
  const [name,        setName]        = useState(client.name         ?? '')
  const [code,        setCode]        = useState(client.code         ?? '')
  const [email,       setEmail]       = useState(client.email        ?? '')
  const [phone,       setPhone]       = useState(client.phone        ?? '')
  const [addr,        setAddr]        = useState(client.address      ?? '')
  const [location,    setLocation]    = useState(client.location     ?? '')
  const [contactP,    setContactP]    = useState(client.contactPerson ?? '')
  const [custType,    setCustType]    = useState(client.customerType ?? 'Retail')
  const [credit,      setCredit]      = useState(String(client.creditLimit ?? 0))

  const handleSave = () => {
    if (!name.trim()) return
    onSave({
      id: client.id ?? `C-${Date.now().toString(36).toUpperCase()}`,
      name: name.trim(), code: code.trim() || undefined,
      email: email.trim(), phone: phone.trim(),
      address: addr.trim(), location: location.trim() || undefined,
      contactPerson: contactP.trim() || undefined, customerType: custType || undefined,
      creditLimit: Number(credit) || 0, visits: client.visits,
    })
  }

  return (
    <FloatingModal title={title} subtitle="Customer & client record" onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={!name.trim()}>Save Client</button>
      </>}
    >
      <FormRow>
        <FormInput label="Company / Client Name *" placeholder="e.g. Highlands Grocers Ltd" value={name} onChange={setName} />
        <FormInput label="Client Code" placeholder="e.g. C-001" value={code} onChange={setCode} />
      </FormRow>
      <FormRow>
        <FormInput label="Contact Person" placeholder="e.g. Jane Mwangi" value={contactP} onChange={setContactP} />
        <FormSelect label="Customer Type" options={['Retail', 'Wholesale', 'Distributor', 'Export', 'Other']} value={custType} onChange={setCustType} />
      </FormRow>
      <FormRow>
        <FormInput label="Email" type="email" placeholder="contact@company.com" value={email} onChange={setEmail} />
        <FormInput label="Phone" type="tel" placeholder="+255 700 000 000" value={phone} onChange={setPhone} />
      </FormRow>
      <FormRow>
        <FormInput label="Address" placeholder="e.g. Kariakoo, Dar es Salaam" value={addr} onChange={setAddr} />
        <FormInput label="Location / Region" placeholder="e.g. Dar es Salaam" value={location} onChange={setLocation} />
      </FormRow>
      <FormInput label="Credit Limit (TZS)" type="number" placeholder="0" value={credit} onChange={setCredit} />
    </FloatingModal>
  )
}

/* ── Customer 360 Profile modal ─────────────────────────────── */
function Customer360Modal({ client: initialClient, onClose, onEdit, onSave }: {
  client: Client; onClose: () => void; onEdit: () => void; onSave: (c: Client) => void
}) {
  const { salesOrders, creditors } = useApp()
  const [client, setClient] = useState<Client>(initialClient)
  const [profileTab, setProfileTab] = useState<'overview' | 'orders' | 'payments' | 'debts' | 'visits' | 'timeline'>('overview')

  // Visit form
  const [showVisitForm, setShowVisitForm]   = useState(false)
  const [vDate,         setVDate]           = useState(new Date().toISOString().slice(0, 10))
  const [vSalesperson,  setVSalesperson]    = useState('')
  const [vPurpose,      setVPurpose]        = useState('')
  const [vOutcome,      setVOutcome]        = useState('')
  const [vNotes,        setVNotes]          = useState('')
  const [vFollowUp,     setVFollowUp]       = useState('')

  const clientOrders = salesOrders.filter(o => o.customer.toLowerCase() === client.name.toLowerCase())
  const clientDebts  = creditors.filter(c => c.name.toLowerCase() === client.name.toLowerCase() && c.status !== 'Settled')
  const visits       = client.visits ?? []

  const totalOrdered  = clientOrders.reduce((s, o) => s + o.total, 0)
  const totalPaid     = clientOrders.reduce((s, o) => s + (o.amountPaid ?? (o.paymentType === 'Full Payment' ? o.total : 0)), 0)

  const debtTotal     = clientDebts.reduce((s, c) => s + c.amount, 0)

  const monthlyOrders = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i))
    const m = d.toISOString().slice(0, 7)
    const label = d.toLocaleString('en', { month: 'short' })
    const count = clientOrders.filter(o => (o.date ?? '').startsWith(m)).length
    const value = clientOrders.filter(o => (o.date ?? '').startsWith(m)).reduce((s, o) => s + o.total, 0)
    return { m, label, count, value }
  })
  const maxCount = Math.max(1, ...monthlyOrders.map(m => m.count))

  const PAY_STYLE: Record<string, string> = {
    'Full Payment': 'var(--success)', 'Partial': 'var(--warning)', 'Full Credit': 'var(--danger)'
  }

  // For each debt, find the source order (referenced in notes e.g. "Credit sale — SO-XXX")
  const debtsWithItems = clientDebts.map(d => {
    const match = (d.notes ?? '').match(/\b(SO-\S+)\b/)
    const srcOrder = match ? clientOrders.find(o => o.id === match[1]) : undefined
    return {
      ...d,
      items: srcOrder?.items?.map((it: any) => ({ name: it.name, qty: it.qty, unit: it.unit, price: it.price })) ?? [],
    }
  })

  // Timeline: merge orders + visits + payments + debts into chronological events
  const timeline = [
    ...clientOrders.map(o => ({ date: o.date, type: 'order' as const, label: `Order ${o.id}`, detail: `TZS ${o.total.toLocaleString()} · ${o.status}`, color: 'var(--primary)' })),
    ...visits.map(v => ({ date: v.date, type: 'visit' as const, label: `Visit by ${v.salesperson || '—'}`, detail: v.purpose + (v.outcome ? ` · ${v.outcome}` : ''), color: 'var(--success)' })),
    ...clientOrders.filter(o => (o.amountPaid ?? 0) > 0).map(o => ({ date: o.date, type: 'payment' as const, label: `Payment on ${o.id}`, detail: `TZS ${(o.amountPaid ?? 0).toLocaleString()} received`, color: 'var(--warning)' })),
    ...clientDebts.map(d => ({ date: d.dueDate || '', type: 'debt' as const, label: `Debt — ${d.notes || d.id}`, detail: `TZS ${d.amount.toLocaleString()} · ${d.status}`, color: 'var(--danger)' })),
  ].filter(ev => ev.date).sort((a, b) => b.date.localeCompare(a.date))

  const handleAddVisit = () => {
    if (!vDate) return
    const visit: ClientVisit = {
      id: `VIS-${Date.now().toString(36).toUpperCase()}`, date: vDate,
      salesperson: vSalesperson, purpose: vPurpose, outcome: vOutcome,
      notes: vNotes, followUp: vFollowUp || undefined,
    }
    const updated: Client = { ...client, visits: [...visits, visit] }
    setClient(updated)
    onSave(updated)
    setShowVisitForm(false)
    setVDate(new Date().toISOString().slice(0, 10))
    setVSalesperson(''); setVPurpose(''); setVOutcome(''); setVNotes(''); setVFollowUp('')
  }

  const tabDef = [
    ['overview', 'Overview'],
    ['orders', `Orders (${clientOrders.length})`],
    ['payments', 'Payments'],
    ['debts', `Debts${clientDebts.length > 0 ? ` (${clientDebts.length})` : ''}`],
    ['visits', `Visits (${visits.length})`],
    ['timeline', 'Timeline'],
  ] as const

  return (
    <FloatingModal title="Customer 360° Profile" subtitle={`${client.id} · ${client.name}`} onClose={onClose} width={740}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
        <button className="btn btn-ghost" onClick={() => exportCustomer360Pdf({
          client,
          orders: clientOrders.map(o => ({ ...o, amountPaid: o.amountPaid ?? 0, balance: o.balance ?? 0 })),
          debts: debtsWithItems.map(d => ({ id: d.id, name: d.name, amount: d.amount, dueDate: d.dueDate, status: d.status, notes: d.notes, items: d.items })),
          visits,
          timeline,
        }, `customer_360_${client.id}`, undefined, 'download')} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Download size={13} /> Download PDF
        </button>
        <button className="btn btn-primary" onClick={onEdit}>Edit Client</button>
      </>}
    >
      {/* Basic info grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '4px' }}>
        {[
          { label: 'Email',         value: client.email || '—',         icon: '✉' },
          { label: 'Phone',         value: client.phone || '—',         icon: '📞' },
          { label: 'Contact Person',value: client.contactPerson || '—', icon: '👤' },
          { label: 'Type',          value: client.customerType || '—',  icon: '🏷' },
          { label: 'Address',       value: client.address || '—',       icon: '📍' },
          { label: 'Credit Limit',  value: client.creditLimit > 0 ? `TZS ${client.creditLimit.toLocaleString()}` : '—', icon: '💳' },
        ].map(f => (
          <div key={f.label} style={{ padding: '7px 10px', borderRadius: '8px', background: 'var(--secondary)' }}>
            <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</div>
            <div style={{ fontSize: '11px', color: 'var(--foreground)', fontWeight: 500, marginTop: '2px' }}>{f.value}</div>
          </div>
        ))}
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
        {[
          { label: 'Orders',       value: String(clientOrders.length),                       icon: ShoppingCart, color: 'var(--primary)' },
          { label: 'Total Value',  value: `TZS ${(totalOrdered/1000).toFixed(0)}K`,          icon: DollarSign,   color: 'var(--success)' },
          { label: 'Amount Paid',  value: `TZS ${(totalPaid/1000).toFixed(0)}K`,             icon: TrendingUp,   color: 'var(--success)' },
          { label: 'Outstanding',  value: `TZS ${(debtTotal/1000).toFixed(0)}K`, icon: AlertCircle, color: 'var(--danger)' },
        ].map(s => (
          <div key={s.label} style={{ padding: '9px 12px', borderRadius: '10px', background: 'var(--card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <s.icon size={13} color={s.color} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--foreground)' }}>{s.value}</div>
              <div style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        {tabDef.map(([k, l]) => (
          <button key={k} onClick={() => setProfileTab(k)} style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 500, fontFamily: 'inherit', border: 'none', background: 'transparent', cursor: 'pointer', color: profileTab === k ? 'var(--primary)' : 'var(--muted-foreground)', borderBottom: profileTab === k ? '2px solid var(--primary)' : '2px solid transparent', marginBottom: '-1px', whiteSpace: 'nowrap' }}>
            {l}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {profileTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Outstanding debts */}
          {clientDebts.length > 0 && (
            <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--danger)', marginBottom: '6px' }}>Outstanding Debts</div>
              {clientDebts.map(d => (
                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0', borderBottom: '1px solid rgba(239,68,68,0.1)' }}>
                  <span style={{ color: 'var(--secondary-foreground)' }}>{d.notes || d.id} · Due {d.dueDate}</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--danger)', fontWeight: 600 }}>TZS {d.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
          {/* Order trend bars */}
          <div>
            <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '8px' }}>Order frequency — last 6 months</div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '64px' }}>
              {monthlyOrders.map(m => (
                <div key={m.m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                  <div style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--primary)', opacity: m.count ? 1 : 0 }}>{m.count}</div>
                  <div style={{ width: '100%', background: m.count > 0 ? 'var(--primary)' : 'var(--border)', borderRadius: '3px 3px 0 0', height: `${Math.max(3, (m.count / maxCount) * 40)}px` }} />
                  <div style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Payment breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {(['Full Payment', 'Partial', 'Full Credit'] as const).map(pt => {
              const count = clientOrders.filter(o => o.paymentType === pt).length
              const pct = clientOrders.length ? Math.round((count / clientOrders.length) * 100) : 0
              return (
                <div key={pt} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontSize: '11px', width: '90px', color: PAY_STYLE[pt], fontWeight: 500 }}>{pt}</div>
                  <div style={{ flex: 1, height: '6px', borderRadius: '99px', background: 'var(--border)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: PAY_STYLE[pt], borderRadius: '99px', transition: 'width 0.3s' }} />
                  </div>
                  <div style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--foreground)', width: '32px', textAlign: 'right' }}>{count}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Orders ── */}
      {profileTab === 'orders' && (
        clientOrders.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '13px' }}>No orders placed yet</div>
        ) : (
          <div style={{ maxHeight: '260px', overflowY: 'auto', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: 'var(--secondary)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0 }}>
                  {['Order ID', 'Date', 'Items', 'Payment', 'Paid', 'Balance', 'Status', 'Total'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clientOrders.map((o, i) => (
                  <tr key={o.id} style={{ borderBottom: i < clientOrders.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--primary)', fontSize: '11px', fontWeight: 600 }}>{o.id}</td>
                    <td style={{ padding: '7px 10px', color: 'var(--muted-foreground)', fontSize: '11px' }}>{o.date}</td>
                    <td style={{ padding: '7px 10px', color: 'var(--muted-foreground)', fontSize: '11px' }}>{o.items?.length ?? 0}</td>
                    <td style={{ padding: '7px 10px' }}><span style={{ fontSize: '10px', fontWeight: 600, color: PAY_STYLE[o.paymentType] }}>{o.paymentType}</span></td>
                    <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--success)', fontSize: '11px' }}>{(o.amountPaid ?? (o.paymentType === 'Full Payment' ? o.total : 0)).toLocaleString()}</td>
                    <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: (o.balance ?? 0) > 0 ? 'var(--danger)' : 'var(--muted-foreground)' }}>{(o.balance ?? 0).toLocaleString()}</td>
                    <td style={{ padding: '7px 10px' }}><span style={{ fontSize: '10px', color: o.status === 'Delivered' ? 'var(--success)' : o.status === 'Cancelled' ? 'var(--danger)' : 'var(--warning)' }}>{o.status}</span></td>
                    <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--foreground)', fontSize: '11px' }}>{o.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ── Payments ── */}
      {profileTab === 'payments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {[
              { label: 'Total Billed',   value: `TZS ${totalOrdered.toLocaleString()}`,                          color: 'var(--foreground)' },
              { label: 'Total Paid',     value: `TZS ${totalPaid.toLocaleString()}`,                             color: 'var(--success)' },
              { label: 'Still Owed',     value: `TZS ${debtTotal.toLocaleString()}`,            color: debtTotal > 0 ? 'var(--danger)' : 'var(--success)' },
            ].map(k => (
              <div key={k.label} style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--secondary)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase' }}>{k.label}</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: k.color, fontFamily: 'JetBrains Mono, monospace', marginTop: '3px' }}>{k.value}</div>
              </div>
            ))}
          </div>
          <div style={{ maxHeight: '200px', overflowY: 'auto', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: 'var(--secondary)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0 }}>
                  {['Order', 'Date', 'Type', 'Total', 'Paid', 'Balance'].map(h => (
                    <th key={h} style={{ padding: '6px 10px', fontSize: '10px', fontWeight: 600, color: 'var(--muted-foreground)', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clientOrders.map((o, i) => {
                  const paid = o.amountPaid ?? (o.paymentType === 'Full Payment' ? o.total : 0)
                  const bal  = o.balance ?? (o.paymentType === 'Full Payment' ? 0 : o.total - paid)
                  return (
                    <tr key={o.id} style={{ borderBottom: i < clientOrders.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono', color: 'var(--primary)', fontSize: '11px' }}>{o.id}</td>
                      <td style={{ padding: '6px 10px', color: 'var(--muted-foreground)', fontSize: '11px' }}>{o.date}</td>
                      <td style={{ padding: '6px 10px' }}><span style={{ fontSize: '10px', fontWeight: 600, color: PAY_STYLE[o.paymentType] }}>{o.paymentType}</span></td>
                      <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono', fontWeight: 600, color: 'var(--foreground)', fontSize: '11px' }}>{o.total.toLocaleString()}</td>
                      <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono', color: 'var(--success)', fontSize: '11px' }}>{paid.toLocaleString()}</td>
                      <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono', color: bal > 0 ? 'var(--danger)' : 'var(--muted-foreground)', fontSize: '11px', fontWeight: bal > 0 ? 600 : 400 }}>{bal.toLocaleString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Debts ── */}
      {profileTab === 'debts' && (
        clientDebts.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '13px' }}>No outstanding debts for this customer</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
              Total outstanding: <strong style={{ color: 'var(--danger)', fontFamily: 'JetBrains Mono, monospace' }}>TZS {debtTotal.toLocaleString()}</strong>
            </div>
            {clientDebts.map(d => (
              <div key={d.id} style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>{d.notes || d.id}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '2px' }}>Due: {d.dueDate || '—'} · {d.type}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--danger)', fontFamily: 'JetBrains Mono, monospace' }}>TZS {d.amount.toLocaleString()}</div>
                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '10px', background: 'rgba(239,68,68,0.15)', color: 'var(--danger)', fontWeight: 600 }}>{d.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Visits ── */}
      {profileTab === 'visits' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>{visits.length} visit{visits.length !== 1 ? 's' : ''} recorded</div>
            <button onClick={() => setShowVisitForm(v => !v)} style={{ padding: '5px 12px', borderRadius: '6px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', fontWeight: 500 }}>
              {showVisitForm ? '− Cancel' : '+ Add Visit'}
            </button>
          </div>

          {showVisitForm && (
            <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--secondary)', border: '1px solid var(--border)' }}>
              <FormRow>
                <FormInput label="Visit Date *" type="date" value={vDate} onChange={setVDate} />
                <FormInput label="Salesperson" placeholder="e.g. Amina Hassan" value={vSalesperson} onChange={setVSalesperson} />
              </FormRow>
              <FormRow>
                <FormInput label="Purpose" placeholder="e.g. New order discussion" value={vPurpose} onChange={setVPurpose} />
                <FormInput label="Outcome" placeholder="e.g. Order placed, Follow-up needed" value={vOutcome} onChange={setVOutcome} />
              </FormRow>
              <FormInput label="Notes" placeholder="Any additional notes…" value={vNotes} onChange={setVNotes} />
              <FormInput label="Follow-up Date" type="date" value={vFollowUp} onChange={setVFollowUp} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button onClick={handleAddVisit} disabled={!vDate} style={{ padding: '6px 16px', borderRadius: '6px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', fontWeight: 600, opacity: !vDate ? 0.6 : 1 }}>
                  Save Visit
                </button>
              </div>
            </div>
          )}

          {visits.length === 0 && !showVisitForm ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '13px' }}>No visits recorded — click "Add Visit" to log a customer visit</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
              {[...visits].sort((a, b) => b.date.localeCompare(a.date)).map(v => (
                <div key={v.id} style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <Calendar size={11} color="var(--muted-foreground)" />
                        <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--muted-foreground)' }}>{v.date}</span>
                        {v.salesperson && <span style={{ fontSize: '11px', color: 'var(--foreground)', fontWeight: 500 }}>· {v.salesperson}</span>}
                      </div>
                      {v.purpose && <div style={{ fontSize: '12px', color: 'var(--foreground)' }}>{v.purpose}</div>}
                      {v.outcome && <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '2px' }}>Outcome: {v.outcome}</div>}
                      {v.notes   && <div style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>{v.notes}</div>}
                    </div>
                    {v.followUp && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>Follow-up</div>
                        <div style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--warning)', fontWeight: 600 }}>{v.followUp}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Timeline ── */}
      {profileTab === 'timeline' && (
        timeline.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '13px' }}>No activity yet</div>
        ) : (
          <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0' }}>
            {timeline.map((ev, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', padding: '8px 0' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: '20px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: ev.color, flexShrink: 0, marginTop: '3px' }} />
                  {i < timeline.length - 1 && <div style={{ width: '1px', flex: 1, background: 'var(--border)', minHeight: '16px', marginTop: '2px' }} />}
                </div>
                <div style={{ flex: 1, paddingBottom: i < timeline.length - 1 ? '4px' : '0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--muted-foreground)' }}>{ev.date}</span>
                    <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '10px', background: `${ev.color}20`, color: ev.color, fontWeight: 600, textTransform: 'uppercase' }}>{ev.type}</span>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--foreground)', marginTop: '2px' }}>{ev.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>{ev.detail}</div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </FloatingModal>
  )
}

/* ── Lead modal ─────────────────────────────────────────────── */
function LeadModal({
  lead, onClose, onSave, title, empNames,
}: {
  lead: Partial<Lead>; onClose: () => void
  onSave: (l: Lead) => void; title: string; empNames: string[]
}) {
  const [name,    setName]    = useState(lead.name    ?? '')
  const [contact, setContact] = useState(lead.contact ?? '')
  const [phone,   setPhone]   = useState(lead.phone   ?? '')
  const [email,   setEmail]   = useState(lead.email   ?? '')
  const [value,   setValue]   = useState(String(lead.value ?? 0))
  const [stage,   setStage]   = useState(lead.stage   ?? 'New')
  const [rep,     setRep]     = useState(lead.rep     ?? '')
  const [notes,   setNotes]   = useState(lead.notes   ?? '')

  const handleSave = () => {
    if (!name.trim()) return
    onSave({
      id: lead.id ?? `L-${Date.now().toString(36).toUpperCase()}`,
      name: name.trim(), contact, phone, email,
      stage, value: Number(value) || 0, rep, notes,
      lastContact: new Date().toISOString().slice(0, 10),
    })
  }

  return (
    <FloatingModal title={title} subtitle="CRM pipeline lead" onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={!name.trim()}>Save Lead</button>
      </>}
    >
      <FormInput label="Company Name *" placeholder="e.g. Highlands Grocers" value={name} onChange={setName} />
      <FormInput label="Contact Person" placeholder="e.g. Peter Kamau" value={contact} onChange={setContact} />
      <FormRow>
        <FormInput label="Phone" type="tel" placeholder="+255 700 000 000" value={phone} onChange={setPhone} />
        <FormInput label="Email" type="email" placeholder="contact@company.com" value={email} onChange={setEmail} />
      </FormRow>
      <FormInput label="Estimated Value (TZS)" type="number" placeholder="e.g. 500000" value={value} onChange={setValue} />
      <FormRow>
        <FormSelect label="Stage" options={STAGE_ORDER} value={stage} onChange={setStage} />
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--secondary-foreground)' }}>Sales Rep</label>
          <input
            className="input-base" list="crm-reps-list"
            placeholder="— Type or select rep —"
            value={rep} onChange={e => setRep(e.target.value)}
          />
          <datalist id="crm-reps-list">
            {empNames.map(n => <option key={n} value={n} />)}
          </datalist>
        </div>
      </FormRow>
      <FormInput label="Notes" placeholder="Any additional notes..." value={notes} onChange={setNotes} />
    </FloatingModal>
  )
}

/* ── Delete confirm ─────────────────────────────────────────── */
function DeleteConfirm({ name, type, onClose, onConfirm }: { name: string; type: string; onClose: () => void; onConfirm: () => void }) {
  return (
    <FloatingModal title={`Delete ${type}`} subtitle="This action cannot be undone" onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
      </>}
    >
      <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--danger)' }}>⚠ Confirm deletion</div>
        <div style={{ fontSize: '12px', color: 'var(--secondary-foreground)', marginTop: '6px' }}>
          Are you sure you want to delete <strong>{name}</strong>? This cannot be undone.
        </div>
      </div>
    </FloatingModal>
  )
}

/* ── Main CRM component ─────────────────────────────────────── */
export default function CRM() {
  const { t } = useLang()
  const { clients, addClient, updateClient, deleteClient, employees, leads, addLead, updateLead, deleteLead } = useApp()
  const empNames = employees.map(e => e.name)

  const [tab,    setTab]    = useState<'clients' | 'pipeline'>('clients')
  const [view,   setView]   = useState<'list' | 'kanban'>('list')
  const [search, setSearch] = useState('')

  /* Client modals */
  const [showAddClient,   setShowAddClient]   = useState(false)
  const [editClientTgt,   setEditClientTgt]   = useState<Client | null>(null)
  const [viewClientTgt,   setViewClientTgt]   = useState<Client | null>(null)
  const [deleteClientTgt, setDeleteClientTgt] = useState<Client | null>(null)

  /* Lead modals */
  const [showAddLead,   setShowAddLead]   = useState(false)
  const [editLeadTgt,   setEditLeadTgt]   = useState<Lead | null>(null)
  const [deleteLeadTgt, setDeleteLeadTgt] = useState<Lead | null>(null)

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email ?? '').toLowerCase().includes(search.toLowerCase())
  )
  const filteredLeads = leads.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    (l.contact ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const exportAllClients = () => {
    exportTablePdf(
      'Client List',
      `As at ${new Date().toLocaleDateString('en-TZ')}`,
      [
        { header: 'ID',           dataKey: 'id' },
        { header: 'Name',         dataKey: 'name' },
        { header: 'Email',        dataKey: 'email' },
        { header: 'Phone',        dataKey: 'phone' },
        { header: 'Address',      dataKey: 'address' },
        { header: 'Credit (TZS)', dataKey: 'creditLimit' },
      ],
      clients.map(c => ({ ...c })),
      'clients',
      fabegonLogo,
    )
  }

  const exportSingleClient = (c: Client) => {
    exportTablePdf(
      'Client Profile', c.name,
      [{ header: 'Field', dataKey: 'field' }, { header: 'Value', dataKey: 'value' }],
      [
        { field: 'ID',           value: c.id },
        { field: 'Name',         value: c.name },
        { field: 'Email',        value: c.email },
        { field: 'Phone',        value: c.phone },
        { field: 'Address',      value: c.address },
        { field: 'Credit Limit', value: `TZS ${c.creditLimit.toLocaleString()}` },
      ],
      `client_${c.id}`, fabegonLogo,
    )
  }

  return (
    <div className="p-6 space-y-5 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>{t('crm.title')}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{t('crm.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportAllClients} className="btn btn-ghost" style={{ padding: '7px 10px' }} title="Export clients PDF">
            <Download size={13} />
          </button>
          {tab === 'clients' ? (
            <button onClick={() => setShowAddClient(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, fontFamily: 'inherit' }}>
              <Plus size={14} /> Add Client
            </button>
          ) : (
            <button onClick={() => setShowAddLead(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, fontFamily: 'inherit' }}>
              <Plus size={14} /> Add Lead
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { label: t('crm.totalClients'), value: clients.length + leads.length, icon: UserCheck },
          { label: 'Clients',            value: clients.length,                 icon: UserCheck },
          { label: t('crm.wonMonth'),    value: leads.filter(l => l.stage === 'Won').length, icon: TrendingUp },
          { label: t('crm.pipelineVal'), value: `TZS ${(leads.reduce((s, l) => s + l.value, 0) / 1_000_000).toFixed(1)}M`, icon: TrendingUp },
        ].map(s => (
          <div key={s.label} style={{ borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--card)', border: '1px solid var(--border)' }}>
            <s.icon size={16} style={{ color: 'var(--primary)' }} />
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--foreground)' }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border)' }}>
        {(['clients', 'pipeline'] as const).map(tabKey => (
          <button key={tabKey} onClick={() => setTab(tabKey)} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, fontFamily: 'inherit', border: 'none', background: 'transparent', cursor: 'pointer', color: tab === tabKey ? 'var(--primary)' : 'var(--muted-foreground)', borderBottom: tab === tabKey ? '2px solid var(--primary)' : '2px solid transparent', marginBottom: '-1px' }}>
            {tabKey === 'clients' ? `Clients (${clients.length})` : `Pipeline (${leads.length})`}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', background: 'var(--secondary)', border: '1px solid var(--border)', maxWidth: '360px' }}>
        <Search size={13} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={tab === 'clients' ? 'Search clients…' : 'Search leads…'} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '13px', color: 'var(--foreground)', fontFamily: 'inherit' }} />
        {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', display: 'flex', padding: 0 }}><X size={12} /></button>}
      </div>

      {/* ── CLIENTS TAB ───────────────────────────────────────── */}
      {tab === 'clients' && (
        <div style={{ borderRadius: '12px', overflow: 'hidden', background: 'var(--card)', border: '1px solid var(--border)' }}>
          {filteredClients.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', fontSize: '13px', color: 'var(--muted-foreground)' }}>
              {search ? 'No clients match your search.' : 'No clients yet. Click "Add Client" to add your first customer.'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['ID', 'Name', 'Email', 'Phone', 'Address', 'Credit Limit', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: i < filteredClients.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--secondary)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '10px 16px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--primary)' }}>{c.id}</td>
                    <td style={{ padding: '10px 16px', fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>{c.name}</td>
                    <td style={{ padding: '10px 16px', fontSize: '11px', color: 'var(--secondary-foreground)' }}>
                      <Mail size={10} style={{ display: 'inline', marginRight: '4px' }} />{c.email || '—'}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: '11px', color: 'var(--secondary-foreground)' }}>
                      <Phone size={10} style={{ display: 'inline', marginRight: '4px' }} />{c.phone || '—'}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: '11px', color: 'var(--muted-foreground)' }}>{c.address || '—'}</td>
                    <td style={{ padding: '10px 16px', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: c.creditLimit > 0 ? 'var(--success)' : 'var(--muted-foreground)' }}>
                      {c.creditLimit > 0 ? `TZS ${c.creditLimit.toLocaleString()}` : '—'}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => setViewClientTgt(c)} title="View" style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(61,127,255,0.08)', color: 'var(--primary)', border: '1px solid rgba(61,127,255,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <Eye size={11} />
                        </button>
                        <button onClick={() => setEditClientTgt(c)} title="Edit" style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(99,102,241,0.08)', color: 'var(--accent)', border: '1px solid rgba(99,102,241,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <Pencil size={11} />
                        </button>
                        <button onClick={() => exportSingleClient(c)} title="Download PDF" style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(34,197,94,0.08)', color: 'var(--success)', border: '1px solid rgba(34,197,94,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <Download size={11} />
                        </button>
                        <button onClick={() => setDeleteClientTgt(c)} title="Delete" style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(239,68,68,0.08)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── PIPELINE TAB ──────────────────────────────────────── */}
      {tab === 'pipeline' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
              {(['list', 'kanban'] as const).map(v => (
                <button key={v} onClick={() => setView(v)} style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 500, fontFamily: 'inherit', border: 'none', cursor: 'pointer', background: view === v ? 'var(--primary)' : 'var(--secondary)', color: view === v ? 'white' : 'var(--secondary-foreground)', textTransform: 'capitalize' }}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          {view === 'kanban' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
              {STAGE_ORDER.map(stage => {
                const stageItems = filteredLeads.filter(l => l.stage === stage)
                const s = STAGE_STYLE[stage]
                return (
                  <div key={stage} style={{ borderRadius: '12px', padding: '12px', background: 'var(--card)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: s.bg, color: s.color }}>{stage}</span>
                      <span style={{ fontSize: '11px', marginLeft: 'auto', color: 'var(--muted-foreground)' }}>{stageItems.length}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {stageItems.map(l => (
                        <div key={l.id} style={{ borderRadius: '8px', padding: '10px', background: 'var(--secondary)', border: '1px solid var(--border)', cursor: 'pointer' }}
                          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
                          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                        >
                          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>{l.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '2px' }}>{l.contact}</div>
                          <div style={{ fontSize: '11px', fontWeight: 500, marginTop: '6px', color: 'var(--primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                            TZS {(l.value / 1000).toFixed(0)}K
                          </div>
                          <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                            <button onClick={() => setEditLeadTgt(l)} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(99,102,241,0.1)', color: 'var(--accent)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
                            <button onClick={() => setDeleteLeadTgt(l)} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Del</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ borderRadius: '12px', overflow: 'hidden', background: 'var(--card)', border: '1px solid var(--border)' }}>
              {filteredLeads.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', fontSize: '13px', color: 'var(--muted-foreground)' }}>
                  {search ? 'No leads match your search.' : 'No leads yet. Click "Add Lead" to start building the pipeline.'}
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['ID', 'Company', 'Contact', 'Phone', 'Stage', 'Value', 'Rep', 'Actions'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((l, i) => {
                      const s = STAGE_STYLE[l.stage] ?? STAGE_STYLE.New
                      return (
                        <tr key={l.id} style={{ borderBottom: i < filteredLeads.length - 1 ? '1px solid var(--border)' : 'none' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--secondary)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ padding: '10px 16px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--primary)' }}>{l.id}</td>
                          <td style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 500, color: 'var(--foreground)' }}>{l.name}</td>
                          <td style={{ padding: '10px 16px', fontSize: '11px', color: 'var(--secondary-foreground)' }}>{l.contact}</td>
                          <td style={{ padding: '10px 16px', fontSize: '11px', color: 'var(--secondary-foreground)' }}>{l.phone}</td>
                          <td style={{ padding: '10px 16px' }}>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', fontWeight: 500, background: s.bg, color: s.color }}>{l.stage}</span>
                          </td>
                          <td style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', color: 'var(--foreground)' }}>TZS {l.value.toLocaleString()}</td>
                          <td style={{ padding: '10px 16px', fontSize: '11px', color: 'var(--secondary-foreground)' }}>{l.rep}</td>
                          <td style={{ padding: '10px 16px' }}>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button onClick={() => setEditLeadTgt(l)} title="Edit" style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(99,102,241,0.08)', color: 'var(--accent)', border: '1px solid rgba(99,102,241,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <Pencil size={11} />
                              </button>
                              <button onClick={() => setDeleteLeadTgt(l)} title="Delete" style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(239,68,68,0.08)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
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
          )}
        </>
      )}

      {/* ── Client Modals ─────────────────────────────────────── */}
      {showAddClient && (
        <ClientModal title="Add Client" client={{}} onClose={() => setShowAddClient(false)}
          onSave={c => { addClient(c); setShowAddClient(false) }} />
      )}
      {editClientTgt && (
        <ClientModal title="Edit Client" client={editClientTgt} onClose={() => setEditClientTgt(null)}
          onSave={c => { updateClient(c); setEditClientTgt(null) }} />
      )}
      {viewClientTgt && (
        <Customer360Modal client={viewClientTgt} onClose={() => setViewClientTgt(null)}
          onSave={c => { updateClient(c); setViewClientTgt(c) }}
          onEdit={() => { setEditClientTgt(viewClientTgt); setViewClientTgt(null) }} />
      )}
      {deleteClientTgt && (
        <DeleteConfirm name={deleteClientTgt.name} type="Client"
          onClose={() => setDeleteClientTgt(null)}
          onConfirm={() => { deleteClient(deleteClientTgt.id); setDeleteClientTgt(null) }} />
      )}

      {/* ── Lead Modals ───────────────────────────────────────── */}
      {showAddLead && (
        <LeadModal title="Add Lead" lead={{}} empNames={empNames} onClose={() => setShowAddLead(false)}
          onSave={l => { addLead(l); setShowAddLead(false) }} />
      )}
      {editLeadTgt && (
        <LeadModal title="Edit Lead" lead={editLeadTgt} empNames={empNames} onClose={() => setEditLeadTgt(null)}
          onSave={l => { updateLead(l); setEditLeadTgt(null) }} />
      )}
      {deleteLeadTgt && (
        <DeleteConfirm name={deleteLeadTgt.name} type="Lead"
          onClose={() => setDeleteLeadTgt(null)}
          onConfirm={() => { deleteLead(deleteLeadTgt.id); setDeleteLeadTgt(null) }} />
      )}
    </div>
  )
}
