import { useState } from 'react'
import { useLang } from '@/i18n'
import { Plus, Search, FileText, TrendingUp, ShoppingCart, DollarSign, CheckCircle2, Clock, XCircle, Trash2, Download, Share2, Printer } from 'lucide-react'
import FloatingModal, { FormRow, Field } from './FloatingModal'
import { useApp, type SalesOrder } from '../context/AppContext'
import { exportTablePdf, exportOrderPdf } from '../utils/exportPdf'
import fabegonLogo from '@/imports/ChatGPT_Image_Jun_27__2026__02_20_03_AM.png'

interface OrderItem { name: string; qty: number; unit: string; price: number }

const STATUS_STYLE: Record<string, { bg: string; color: string; icon: React.ElementType }> = {
  Approved:  { bg: 'rgba(34,197,94,0.1)',   color: 'var(--success)', icon: CheckCircle2 },
  Pending:   { bg: 'rgba(245,158,11,0.1)',  color: 'var(--warning)', icon: Clock },
  Invoiced:  { bg: 'rgba(61,127,255,0.1)',  color: 'var(--primary)', icon: FileText },
  Delivered: { bg: 'rgba(99,102,241,0.1)',  color: '#6366F1',        icon: CheckCircle2 },
  Cancelled: { bg: 'rgba(239,68,68,0.1)',   color: 'var(--danger)',  icon: XCircle },
}

const PAY_STYLE: Record<string, string> = {
  'Full Payment': 'var(--success)',
  'Partial':      'var(--warning)',
  'Full Credit':  'var(--danger)',
}

export default function Sales({ user, logoUrl }: { user: { name: string; role: string; email: string }; logoUrl?: string }) {
  useLang()
  const { items, clients, addClient, addSalesJournal, employees, salesOrders, addSalesOrder, updateSalesOrder, deleteSalesOrder, purchaseOrders } = useApp()
  const logo = logoUrl ?? fabegonLogo
  const orders = salesOrders
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [showNewOrder, setShowNewOrder] = useState(false)
  const [viewOrder, setViewOrder] = useState<SalesOrder | null>(null)
  const [editOrder, setEditOrder] = useState<SalesOrder | null>(null)
  const [editCustomer, setEditCustomer] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editPaymentType, setEditPaymentType] = useState<'Full Payment' | 'Partial' | 'Full Credit'>('Full Payment')
  const [editRep, setEditRep] = useState('')
  const [editCartItems, setEditCartItems] = useState<OrderItem[]>([])
  const [editAmountPaid, setEditAmountPaid] = useState('')
  const [deleteOrder, setDeleteOrder] = useState<SalesOrder | null>(null)

  const openEdit = (o: SalesOrder) => {
    setEditOrder(o)
    setEditCustomer(o.customer)
    setEditStatus(o.status)
    setEditPaymentType(o.paymentType as 'Full Payment' | 'Partial' | 'Full Credit')
    setEditRep(o.rep || '')
    setEditCartItems(o.items.map(i => ({ ...i })))
    setEditAmountPaid(String(o.amountPaid ?? ''))
  }
  const editCartTotal = editCartItems.reduce((s, r) => s + r.qty * r.price, 0)
  const addEditRow = () => setEditCartItems(p => [...p, { name: '', qty: 1, unit: 'bags', price: 0 }])
  const removeEditRow = (i: number) => setEditCartItems(p => p.filter((_, idx) => idx !== i))
  const updateEditCart = (i: number, field: keyof OrderItem, val: string | number) =>
    setEditCartItems(p => p.map((row, idx) => idx === i ? { ...row, [field]: val } : row))

  const handleSaveEdit = () => {
    if (!editOrder || !editCustomer || editCartItems.some(r => !r.name)) return
    updateSalesOrder({ ...editOrder, customer: editCustomer, status: editStatus, paymentType: editPaymentType, rep: editRep, items: editCartItems, total: editCartTotal, amountPaid: editPaymentType === 'Partial' ? Number(editAmountPaid) || 0 : undefined })
    setEditOrder(null)
  }

  const [customer, setCustomer] = useState('')
  const [rep, setRep] = useState('')
  const [paymentType, setPaymentType] = useState<'Full Payment' | 'Partial' | 'Full Credit'>('Full Payment')
  const [orderStatus, setOrderStatus] = useState('Pending')
  const [notes, setNotes] = useState('')
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10))
  const [amountPaid, setAmountPaid] = useState('')
  const [cartItems, setCartItems] = useState<OrderItem[]>([{ name: '', qty: 1, unit: 'bags', price: 0 }])
  const cartTotal = cartItems.reduce((s, r) => s + r.qty * r.price, 0)
  const addCartRow = () => setCartItems(p => [...p, { name: '', qty: 1, unit: 'bags', price: 0 }])
  const removeCartRow = (i: number) => setCartItems(p => p.filter((_, idx) => idx !== i))
  const updateCart = (i: number, field: keyof OrderItem, val: string | number) =>
    setCartItems(p => p.map((row, idx) => idx === i ? { ...row, [field]: val } : row))

  const clientNames = clients.map(c => c.name)
  const itemNames = items.map(i => i.name)
  const filteredOrders = orders.filter(o => {
    const ms = !search || o.customer.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase())
    const mf = filterStatus === 'All' || o.status === filterStatus
    return ms && mf
  })

  const handleCreateOrder = () => {
    if (!customer || cartItems.some(r => !r.name)) return
    const id = 'SO-' + String(Date.now()).slice(-6)
    addSalesOrder({ id, customer, rep, paymentType, status: orderStatus, notes, items: cartItems, total: cartTotal, date: orderDate, amountPaid: paymentType === 'Partial' ? Number(amountPaid) || 0 : undefined })
    addSalesJournal?.(id, customer, cartTotal)
    const newClient = customer.trim()
    if (newClient && !clients.find(c => c.name.toLowerCase() === newClient.toLowerCase())) {
      addClient({ id: 'CL-' + String(Date.now()).slice(-6), name: newClient, email: '', phone: '', address: '', creditLimit: 0 })
    }
    setShowNewOrder(false)
    setCustomer(''); setRep(''); setPaymentType('Full Payment'); setOrderStatus('Pending'); setNotes(''); setAmountPaid('')
    setOrderDate(new Date().toISOString().slice(0, 10))
    setCartItems([{ name: '', qty: 1, unit: 'bags', price: 0 }])
  }

  const exportSingleOrder = (o: SalesOrder, type: string) => {
    exportOrderPdf(o, logo, type as 'download' | 'print' | 'share')
  }

  const totalRevenue = orders.filter(o => ['Delivered', 'Approved', 'Invoiced'].includes(o.status)).reduce((s, o) => s + o.total, 0)
  const pendingCount = orders.filter(o => o.status === 'Pending').length

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { label: 'Total Orders', value: String(orders.length), icon: ShoppingCart, color: 'var(--primary)' },
          { label: 'Revenue (TZS)', value: totalRevenue.toLocaleString(), icon: DollarSign, color: 'var(--success)' },
          { label: 'Pending', value: String(pendingCount), icon: Clock, color: 'var(--warning)' },
          { label: 'Purchase Orders', value: String(purchaseOrders?.length ?? 0), icon: TrendingUp, color: 'var(--primary)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <s.icon size={18} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '2px' }}>{s.label}</div>
              <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--foreground)' }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
              <input className="input-base" placeholder="Search orders…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '32px', width: '200px', fontSize: '13px' }} />
            </div>
            <select className="input-base" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ fontSize: '13px', cursor: 'pointer' }}>
              {['All', 'Pending', 'Approved', 'Invoiced', 'Delivered', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => exportTablePdf('Sales Orders', `As at ${new Date().toLocaleDateString('en-TZ')}`, [{header:'Order ID',dataKey:'id'},{header:'Customer',dataKey:'customer'},{header:'Total (TZS)',dataKey:'total'},{header:'Status',dataKey:'status'},{header:'Date',dataKey:'date'}], orders.map(o => ({...o, total: o.total.toLocaleString()})), 'sales_orders', logo)} className="btn btn-ghost" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><FileText size={13} /> Export PDF</button>
            <button onClick={() => setShowNewOrder(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}><Plus size={14} /> New Order</button>
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'var(--secondary)', borderBottom: '1px solid var(--border)' }}>
              {['Order ID', 'Customer', 'Items', 'Payment', 'Paid (TZS)', 'Balance (TZS)', 'Status', 'Total (TZS)', 'Date', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: '11px', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((o, idx) => {
              const ss = STATUS_STYLE[o.status] || STATUS_STYLE['Pending']
              const StatusIcon = ss.icon
              return (
                <tr key={o.id} style={{ borderBottom: idx < filteredOrders.length - 1 ? '1px solid var(--border)' : 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--secondary)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: 'var(--primary)', fontSize: '12px' }}>{o.id}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 500, color: 'var(--foreground)' }}>{o.customer}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--muted-foreground)', fontSize: '12px' }}>{o.items.length} item{o.items.length !== 1 ? 's' : ''}</td>
                  <td style={{ padding: '10px 14px' }}><span style={{ fontSize: '11px', fontWeight: 600, color: PAY_STYLE[o.paymentType] }}>{o.paymentType}</span></td>
                  <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'var(--success)', fontWeight: 600 }}>
                    {(o.amountPaid ?? (o.paymentType === 'Full Payment' ? o.total : 0)).toLocaleString()}
                  </td>
                  <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: (o.balance ?? 0) > 0 ? 'var(--danger)' : 'var(--muted-foreground)', fontWeight: (o.balance ?? 0) > 0 ? 600 : 400 }}>
                    {(o.balance ?? (o.paymentType === 'Full Payment' ? 0 : o.total)).toLocaleString()}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '20px', background: ss.bg, color: ss.color }}>
                      <StatusIcon size={10} /> {o.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: 'var(--foreground)' }}>{o.total.toLocaleString()}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--muted-foreground)', fontSize: '12px' }}>{o.date}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={() => setViewOrder(o)} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'var(--secondary)', color: 'var(--muted-foreground)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }} title="View">View</button>
                      <button onClick={() => openEdit(o)} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'var(--secondary)', color: 'var(--muted-foreground)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }} title="Edit">Edit</button>
                      <button onClick={() => exportSingleOrder(o, 'download')} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'var(--secondary)', color: 'var(--muted-foreground)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }} title="Download PDF"><Download size={11} /></button>
                      <button onClick={() => exportSingleOrder(o, 'print')} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'var(--secondary)', color: 'var(--muted-foreground)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }} title="Print"><Printer size={11} /></button>
                      <button onClick={() => exportSingleOrder(o, 'share')} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'var(--secondary)', color: 'var(--muted-foreground)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }} title="Share"><Share2 size={11} /></button>
                      <button onClick={() => setDeleteOrder(o)} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(239,68,68,0.08)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center' }} title="Delete"><Trash2 size={11} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>


      {/* Delete Order Confirmation */}
      {deleteOrder && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={() => setDeleteOrder(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--card)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '14px', padding: '24px', width: '360px', boxShadow: 'var(--shadow)' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '8px' }}>Delete Sales Order?</div>
            <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginBottom: '6px', lineHeight: 1.5 }}>
              Permanently remove <strong>{deleteOrder.id}</strong> — <strong>{deleteOrder.customer}</strong>
            </p>
            <p style={{ fontSize: '12px', color: 'var(--danger)', marginBottom: '20px' }}>TZS {deleteOrder.total.toLocaleString()} · {deleteOrder.status}</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteOrder(null)} className="btn btn-ghost">Cancel</button>
              <button onClick={() => { deleteSalesOrder(deleteOrder.id); setDeleteOrder(null) }} style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--danger)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* New Order Modal */}
      {showNewOrder && (
        <FloatingModal
          title="New Sales Order"
          subtitle={`Creating as: ${user.name}`}
          onClose={() => setShowNewOrder(false)}
          width={680}
          footer={
            <>
              <button onClick={() => setShowNewOrder(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleCreateOrder} className="btn btn-primary">Create Order</button>
            </>
          }
        >
          <FormRow>
            <Field label="Customer">
              <input
                className="input-base"
                list="customer-list"
                placeholder="Type or select customer…"
                value={customer}
                onChange={e => setCustomer(e.target.value)}
              />
              <datalist id="customer-list">
                {clientNames.map(n => <option key={n} value={n} />)}
              </datalist>
            </Field>
            <Field label="Sales Rep">
              <select className="input-base" value={rep} onChange={e => setRep(e.target.value)} style={{ cursor: 'pointer' }}>
                <option value="">— Select rep —</option>
                {employees.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
              </select>
            </Field>
          </FormRow>

          <FormRow>
            <Field label="Order Date">
              <input className="input-base" type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} />
            </Field>
            <Field label="Status">
              <select className="input-base" value={orderStatus} onChange={e => setOrderStatus(e.target.value)} style={{ cursor: 'pointer' }}>
                {['Pending', 'Approved', 'Invoiced', 'Delivered', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </FormRow>

          <Field label="Payment Type">
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['Full Payment', 'Partial', 'Full Credit'] as const).map(pt => (
                <button
                  key={pt}
                  type="button"
                  onClick={() => setPaymentType(pt)}
                  style={{
                    flex: 1,
                    padding: '7px 6px',
                    borderRadius: '8px',
                    border: `2px solid ${paymentType === pt ? PAY_STYLE[pt] : 'var(--border)'}`,
                    background: paymentType === pt ? `${PAY_STYLE[pt]}18` : 'var(--secondary)',
                    color: paymentType === pt ? PAY_STYLE[pt] : 'var(--secondary-foreground)',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: paymentType === pt ? 600 : 400,
                    fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                >{pt}</button>
              ))}
            </div>
          </Field>

          {paymentType === 'Partial' && (
            <FormRow>
              <Field label="Amount Paid (TZS)">
                <input className="input-base" type="number" min="0" max={cartTotal} placeholder="0" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} />
              </Field>
              <Field label="Balance Remaining (TZS)">
                <div style={{ padding: '9px 13px', borderRadius: '8px', background: 'var(--secondary)', border: '1px solid var(--border)', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: 700, color: 'var(--danger)' }}>
                  {Math.max(0, cartTotal - (Number(amountPaid) || 0)).toLocaleString()}
                </div>
              </Field>
            </FormRow>
          )}

          {/* Cart */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--secondary-foreground)' }}>Order Items</label>
              <button type="button" onClick={addCartRow} style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontFamily: 'inherit' }}>
                <Plus size={12} /> Add Row
              </button>
            </div>
            <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'var(--secondary)', borderBottom: '1px solid var(--border)' }}>
                    {['Item', 'Qty', 'Unit', 'Unit Price (TZS)', 'Total', ''].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontSize: '11px', color: 'var(--muted-foreground)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((row, i) => (
                    <tr key={i} style={{ borderBottom: i < cartItems.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          className="input-base"
                          list="item-list"
                          placeholder="Select item…"
                          value={row.name}
                          onChange={e => updateCart(i, 'name', e.target.value)}
                          style={{ padding: '5px 8px', fontSize: '12px' }}
                        />
                        <datalist id="item-list">
                          {itemNames.map(n => <option key={n} value={n} />)}
                        </datalist>
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input className="input-base" type="number" min="1" value={row.qty} onChange={e => updateCart(i, 'qty', Number(e.target.value))} style={{ padding: '5px 8px', fontSize: '12px', width: '70px' }} />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input className="input-base" value={row.unit} onChange={e => updateCart(i, 'unit', e.target.value)} style={{ padding: '5px 8px', fontSize: '12px', width: '70px' }} />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input className="input-base" type="number" min="0" value={row.price} onChange={e => updateCart(i, 'price', Number(e.target.value))} style={{ padding: '5px 8px', fontSize: '12px', width: '110px' }} />
                      </td>
                      <td style={{ padding: '6px 10px', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--foreground)', whiteSpace: 'nowrap' }}>
                        {(row.qty * row.price).toLocaleString()}
                      </td>
                      <td style={{ padding: '6px 6px' }}>
                        <button type="button" onClick={() => removeCartRow(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '2px', display: 'flex' }}>
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ textAlign: 'right', marginTop: '8px', fontSize: '13px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--foreground)' }}>
              Total: TZS {cartTotal.toLocaleString()}
            </div>
          </div>
        </FloatingModal>
      )}

      {/* Edit Order Modal */}
      {editOrder && (
        <FloatingModal
          title={`Edit Order ${editOrder.id}`}
          subtitle={`Editing: ${editOrder.customer}`}
          onClose={() => setEditOrder(null)}
          width={680}
          footer={
            <>
              <button onClick={() => setEditOrder(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleSaveEdit} className="btn btn-primary">Save Changes</button>
            </>
          }
        >
          <FormRow>
            <Field label="Customer">
              <input className="input-base" list="edit-customer-list" value={editCustomer} onChange={e => setEditCustomer(e.target.value)} />
              <datalist id="edit-customer-list">{clientNames.map(n => <option key={n} value={n} />)}</datalist>
            </Field>
            <Field label="Sales Rep">
              <select className="input-base" value={editRep} onChange={e => setEditRep(e.target.value)}>
                <option value="">— Select rep —</option>
                {employees.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
              </select>
            </Field>
          </FormRow>
          <FormRow>
            <Field label="Payment Type">
              <div style={{ display: 'flex', gap: '6px' }}>
                {(['Full Payment', 'Partial', 'Full Credit'] as const).map(pt => (
                  <button key={pt} type="button" onClick={() => setEditPaymentType(pt)} style={{ flex: 1, padding: '7px 6px', borderRadius: '8px', border: `2px solid ${editPaymentType === pt ? PAY_STYLE[pt] : 'var(--border)'}`, background: editPaymentType === pt ? `${PAY_STYLE[pt]}18` : 'var(--secondary)', color: editPaymentType === pt ? PAY_STYLE[pt] : 'var(--secondary-foreground)', cursor: 'pointer', fontSize: '11px', fontWeight: editPaymentType === pt ? 600 : 400, fontFamily: 'inherit' }}>{pt}</button>
                ))}
              </div>
            </Field>
            <Field label="Status">
              <select className="input-base" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                {['Pending', 'Approved', 'Invoiced', 'Delivered', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </FormRow>
          {editPaymentType === 'Partial' && (
            <FormRow>
              <Field label="Amount Paid (TZS)">
                <input className="input-base" type="number" min="0" max={editCartTotal} placeholder="0" value={editAmountPaid} onChange={e => setEditAmountPaid(e.target.value)} />
              </Field>
              <Field label="Balance Remaining (TZS)">
                <div style={{ padding: '9px 13px', borderRadius: '8px', background: 'var(--secondary)', border: '1px solid var(--border)', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: 700, color: 'var(--danger)' }}>
                  {Math.max(0, editCartTotal - (Number(editAmountPaid) || 0)).toLocaleString()}
                </div>
              </Field>
            </FormRow>
          )}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--secondary-foreground)' }}>Order Items</label>
              <button type="button" onClick={addEditRow} style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontFamily: 'inherit' }}>
                <Plus size={12} /> Add Row
              </button>
            </div>
            <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'var(--secondary)', borderBottom: '1px solid var(--border)' }}>
                    {['Item', 'Qty', 'Unit', 'Unit Price (TZS)', 'Total', ''].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontSize: '11px', color: 'var(--muted-foreground)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {editCartItems.map((row, i) => (
                    <tr key={i} style={{ borderBottom: i < editCartItems.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '6px 8px' }}>
                        <input className="input-base" list="edit-item-list" value={row.name} onChange={e => updateEditCart(i, 'name', e.target.value)} style={{ padding: '5px 8px', fontSize: '12px' }} />
                        <datalist id="edit-item-list">{itemNames.map(n => <option key={n} value={n} />)}</datalist>
                      </td>
                      <td style={{ padding: '6px 8px' }}><input className="input-base" type="number" min="1" value={row.qty} onChange={e => updateEditCart(i, 'qty', Number(e.target.value))} style={{ padding: '5px 8px', fontSize: '12px', width: '70px' }} /></td>
                      <td style={{ padding: '6px 8px' }}><input className="input-base" value={row.unit} onChange={e => updateEditCart(i, 'unit', e.target.value)} style={{ padding: '5px 8px', fontSize: '12px', width: '70px' }} /></td>
                      <td style={{ padding: '6px 8px' }}><input className="input-base" type="number" min="0" value={row.price} onChange={e => updateEditCart(i, 'price', Number(e.target.value))} style={{ padding: '5px 8px', fontSize: '12px', width: '110px' }} /></td>
                      <td style={{ padding: '6px 10px', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--foreground)', whiteSpace: 'nowrap' }}>{(row.qty * row.price).toLocaleString()}</td>
                      <td style={{ padding: '6px 6px' }}><button type="button" onClick={() => removeEditRow(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '2px', display: 'flex' }}><Trash2 size={13} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ textAlign: 'right', marginTop: '8px', fontSize: '13px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--foreground)' }}>
              Total: TZS {editCartTotal.toLocaleString()}
            </div>
          </div>
        </FloatingModal>
      )}

      {/* View Order Modal */}
      {viewOrder && (
        <FloatingModal
          title={`Order ${viewOrder.id}`}
          subtitle={`${viewOrder.customer} · ${viewOrder.date}`}
          onClose={() => setViewOrder(null)}
          width={620}
          footer={
            <>
              <button onClick={() => setViewOrder(null)} className="btn btn-secondary">Close</button>
              <button onClick={() => exportSingleOrder(viewOrder!, 'share')} className="btn btn-ghost"><Share2 size={13} /> Share</button>
              <button onClick={() => exportSingleOrder(viewOrder!, 'print')} className="btn btn-ghost"><Printer size={13} /> Print</button>
              <button onClick={() => exportSingleOrder(viewOrder!, 'download')} className="btn btn-primary"><Download size={13} /> Download</button>
            </>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', fontSize: '12px' }}>
            {[
              ['Customer',      viewOrder.customer],
              ['Sales Rep',     viewOrder.rep || '—'],
              ['Payment Type',  viewOrder.paymentType],
              ['Status',        viewOrder.status],
              ['Date',          viewOrder.date],
              ['Notes',         viewOrder.notes || '—'],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '2px' }}>{k}</div>
                <div style={{ fontWeight: 500, color: k === 'Payment Type' ? PAY_STYLE[v] : 'var(--foreground)' }}>{v}</div>
              </div>
            ))}
            <div>
              <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '2px' }}>Amount Paid (TZS)</div>
              <div style={{ fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--success)' }}>
                {(viewOrder.amountPaid ?? (viewOrder.paymentType === 'Full Payment' ? viewOrder.total : 0)).toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '2px' }}>Balance Due (TZS)</div>
              <div style={{ fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: (viewOrder.balance ?? 0) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                {(viewOrder.balance ?? (viewOrder.paymentType === 'Full Payment' ? 0 : viewOrder.total)).toLocaleString()}
              </div>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: 'var(--secondary)', borderBottom: '1px solid var(--border)' }}>
                {['Item', 'Qty', 'Unit', 'Unit Price', 'Total'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {viewOrder.items.map((it, i) => (
                <tr key={i} style={{ borderBottom: i < viewOrder.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '8px 12px', color: 'var(--foreground)' }}>{it.name}</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono', color: 'var(--foreground)' }}>{it.qty}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--muted-foreground)' }}>{it.unit}</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono', color: 'var(--foreground)' }}>{it.price.toLocaleString()}</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono', fontWeight: 600, color: 'var(--success)' }}>{(it.qty * it.price).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--secondary)' }}>
                <td colSpan={4} style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--foreground)', fontSize: '12px' }}>TOTAL</td>
                <td style={{ padding: '10px 12px', fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--primary)', fontSize: '13px' }}>TZS {viewOrder.total.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </FloatingModal>
      )}
    </div>
  )
}

