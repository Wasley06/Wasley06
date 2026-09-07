import { useState } from 'react'
import { useLang } from '@/i18n'
import { Factory, CheckCircle2, Clock, AlertTriangle, Plus, ChevronDown, ChevronRight, Trash2, Pencil } from 'lucide-react'
import FloatingModal, { FormInput, FormRow } from './FloatingModal'
import { useApp, type ProductionBatch } from '../context/AppContext'

// BOM is derived dynamically from batch ingredients — no static list needed


const BATCH_STATUSES = ['Scheduled', 'In Progress', 'Completed', 'Failed']

const STATUS_STYLE: Record<string, { bg: string; color: string; icon: React.ElementType }> = {
  Completed: { bg: 'rgba(34,197,94,0.1)', color: 'var(--success)', icon: CheckCircle2 },
  'In Progress': { bg: 'rgba(61,127,255,0.1)', color: 'var(--primary)', icon: Factory },
  Scheduled: { bg: 'rgba(245,158,11,0.1)', color: 'var(--warning)', icon: Clock },
  Failed: { bg: 'rgba(239,68,68,0.1)', color: 'var(--danger)', icon: AlertTriangle },
}

interface Ingredient { id: string; name: string; qty: string; measure: 'weight' | 'percentage'; unit: string }

export default function Production() {
  const { t } = useLang()
  const { batches, addBatch, updateBatch, deleteBatch, items } = useApp()
  const [tab, setTab] = useState<'batches' | 'bom'>('batches')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showBatchModal, setShowBatchModal] = useState(false)

  /* ── New batch form state ────────────────────────────────── */
  const [fProduct, setFProduct] = useState('')
  const [fLine, setFLine] = useState('Line A')
  const [fPlanned, setFPlanned] = useState('')
  const [fStart, setFStart] = useState('')
  const [fNewStatus, setFNewStatus] = useState('Scheduled')
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: '1', name: '', qty: '', measure: 'weight', unit: 'kg' }
  ])

  /* ── Edit batch state ────────────────────────────────────── */
  const [editBatch, setEditBatch] = useState<ProductionBatch | null>(null)
  const [editStatus, setEditStatus] = useState('')
  const [editActual, setEditActual] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editCompleted, setEditCompleted] = useState('')

  const addIngredient = () => setIngredients(p => [...p, { id: Date.now().toString(), name: '', qty: '', measure: 'weight', unit: 'kg' }])
  const removeIngredient = (id: string) => setIngredients(p => p.filter(i => i.id !== id))
  const updateIngredient = (id: string, field: keyof Ingredient, val: string) =>
    setIngredients(p => p.map(i => i.id === id ? { ...i, [field]: val } : i))

  const handleSave = () => {
    if (!fProduct.trim()) return
    addBatch({
      id: `BATCH-${Date.now().toString(36).toUpperCase()}`,
      product: fProduct.trim(),
      recipe: '',
      line: fLine,
      plannedQty: Number(fPlanned) || 0,
      actualQty: 0,
      ingredients,
      started: fStart,
      completed: '',
      status: fNewStatus,
      notes: '',
    })
    setShowBatchModal(false)
    setIngredients([{ id: '1', name: '', qty: '', measure: 'weight', unit: 'kg' }])
    setFProduct(''); setFLine('Line A'); setFPlanned(''); setFStart(''); setFNewStatus('Scheduled')
  }

  const openEditBatch = (b: ProductionBatch) => {
    setEditBatch(b)
    setEditStatus(b.status)
    setEditActual(b.actualQty > 0 ? String(b.actualQty) : '')
    setEditNotes(b.notes || '')
    setEditCompleted(b.completed || '')
  }

  const handleSaveEdit = () => {
    if (!editBatch) return
    const actualQty = Number(editActual) || editBatch.actualQty
    const completed = editStatus === 'Completed' && !editCompleted
      ? new Date().toISOString().slice(0, 10)
      : editCompleted
    updateBatch({ ...editBatch, status: editStatus, actualQty, notes: editNotes, completed })
    setEditBatch(null)
  }

  /* Product options: only items in inventory marked as Finished Good */
  const productOptions = items
    .filter(i => i.category === 'Finished Good' || i.category === 'Finished Goods')
    .map(i => i.name)

  return (
    <div className="p-6 space-y-5 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>{t("prod.title")}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{t("prod.subtitle")}</p>
        </div>
        <button onClick={() => setShowBatchModal(true)} className="btn btn-primary"><Plus size={14} /> {t("prod.newBatch")}</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: t("prod.active"), value: batches.filter(b => b.status === 'In Progress').length, color: 'var(--primary)' },
          { label: t("prod.completedToday"), value: batches.filter(b => b.status === 'Completed').length, color: 'var(--success)' },
          { label: t("prod.unitsToday"), value: batches.reduce((acc, b) => acc + b.actualQty, 0), color: 'var(--accent)' },
          { label: t("prod.scheduled"), value: batches.filter(b => b.status === 'Scheduled').length, color: 'var(--warning)' },
        ].map(s => (
          <div key={s.label} className="rounded-xl px-4 py-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="text-xl font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', color: s.color }}>{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1" style={{ borderBottom: '1px solid var(--border)' }}>
        {(['batches', 'bom'] as const).map(tabKey => (
          <button key={tabKey} onClick={() => setTab(tabKey)} className="px-4 py-2 text-sm font-medium capitalize transition-colors -mb-px" style={{
            color: tab === tabKey ? 'var(--primary)' : 'var(--muted-foreground)',
            borderBottom: tab === tabKey ? '2px solid var(--primary)' : '2px solid transparent',
          }}>
            {tabKey === 'bom' ? t("prod.bom") : t("prod.batches")}
          </button>
        ))}
      </div>

      {tab === 'batches' ? (
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Batch #', 'Product', 'Line', 'Started', 'Planned', 'Actual', 'Efficiency', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {batches.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: '48px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '13px' }}>
                    No production batches yet. Create your first batch.
                  </td>
                </tr>
              )}
              {batches.map((b, i) => {
                const eff = b.actualQty > 0 && b.plannedQty > 0 ? Math.round((b.actualQty / b.plannedQty) * 100) : 0
                const s = STATUS_STYLE[b.status] ?? STATUS_STYLE['Scheduled']
                const Icon = s.icon
                return (
                  <tr key={b.id} style={{ borderBottom: i < batches.length - 1 ? '1px solid var(--border)' : 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td className="px-4 py-3 text-xs font-medium" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--primary)' }}>{b.id}</td>
                    <td className="px-4 py-3 text-xs font-medium" style={{ color: 'var(--foreground)' }}>{b.product}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--secondary-foreground)' }}>{b.line}</td>
                    <td className="px-4 py-3 text-xs" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--muted-foreground)' }}>{b.started?.slice(0, 10) || '—'}</td>
                    <td className="px-4 py-3 text-xs" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--secondary-foreground)' }}>{b.plannedQty}</td>
                    <td className="px-4 py-3 text-xs font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--foreground)' }}>{b.actualQty || '—'}</td>
                    <td className="px-4 py-3">
                      {eff > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 rounded-full" style={{ background: 'var(--muted)' }}>
                            <div className="h-full rounded-full" style={{ width: `${Math.min(eff, 100)}%`, background: eff >= 95 ? 'var(--success)' : eff >= 80 ? 'var(--warning)' : 'var(--danger)' }} />
                          </div>
                          <span className="text-xs" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--secondary-foreground)' }}>{eff}%</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 w-fit" style={{ background: s.bg, color: s.color }}>
                        <Icon size={10} />{b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => openEditBatch(b)} title="Update batch"
                          style={{ fontSize: '11px', padding: '3px 7px', borderRadius: '6px', background: 'rgba(34,197,94,0.08)', color: 'var(--success)', border: '1px solid rgba(34,197,94,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontFamily: 'inherit' }}>
                          <Pencil size={10} /> Update
                        </button>
                        <button onClick={() => deleteBatch(b.id)} title="Delete"
                          style={{ fontSize: '11px', padding: '3px 7px', borderRadius: '6px', background: 'rgba(239,68,68,0.08)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', fontFamily: 'inherit' }}>
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* ── BOM: derived from actual batch ingredients ─────── */
        (() => {
          const batchesWithIngredients = batches.filter(b => b.ingredients && b.ingredients.length > 0)
          if (batchesWithIngredients.length === 0) {
            return (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '13px', background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                No batch ingredients recorded yet. Add a batch with ingredients to see the Bill of Materials.
              </div>
            )
          }
          return (
            <div className="space-y-3">
              {batchesWithIngredients.map(b => (
                <div key={b.id} className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <button className="w-full flex items-center justify-between px-5 py-4 text-left" style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => setExpanded(expanded === b.id ? null : b.id)}>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{b.product}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                        Batch {b.id} · {b.started ? `Started ${b.started}` : 'Not started'} · {b.ingredients.length} ingredient{b.ingredients.length !== 1 ? 's' : ''} · Status: {b.status}
                      </div>
                    </div>
                    {expanded === b.id ? <ChevronDown size={16} style={{ color: 'var(--muted-foreground)' }} /> : <ChevronRight size={16} style={{ color: 'var(--muted-foreground)' }} />}
                  </button>
                  {expanded === b.id && (
                    <div style={{ borderTop: '1px solid var(--border)' }}>
                      <div style={{ padding: '12px 20px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', borderBottom: '1px solid var(--border)', background: 'var(--secondary)' }}>
                        {[
                          { label: 'Planned Qty', value: `${b.plannedQty} units` },
                          { label: 'Actual Qty',  value: b.actualQty > 0 ? `${b.actualQty} units` : '—' },
                          { label: 'Production Line', value: b.line || '—' },
                          { label: 'Completed',   value: b.completed || '—' },
                        ].map(f => (
                          <div key={f.label}>
                            <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</div>
                            <div style={{ fontSize: '13px', color: 'var(--foreground)', fontWeight: 500, fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>{f.value}</div>
                          </div>
                        ))}
                      </div>
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            {['#', 'Ingredient / Material', 'Quantity', 'Unit', 'Measure Type'].map(h => (
                              <th key={h} className="text-left px-5 py-2.5 text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {b.ingredients.map((ing: { id: string; name: string; qty: string | number; measure: string; unit: string }, idx: number) => (
                            <tr key={ing.id ?? idx} style={{ borderBottom: idx < b.ingredients.length - 1 ? '1px solid var(--border)' : 'none' }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'var(--secondary)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              <td className="px-5 py-2.5 text-xs" style={{ color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace' }}>{idx + 1}</td>
                              <td className="px-5 py-2.5 text-xs font-medium" style={{ color: 'var(--foreground)' }}>{ing.name || '—'}</td>
                              <td className="px-5 py-2.5 text-xs font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--primary)' }}>
                                {ing.qty}{ing.measure === 'percentage' ? '%' : ''}
                              </td>
                              <td className="px-5 py-2.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>{ing.unit}</td>
                              <td className="px-5 py-2.5 text-xs">
                                <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '999px', background: ing.measure === 'percentage' ? 'rgba(99,102,241,0.1)' : 'rgba(61,127,255,0.1)', color: ing.measure === 'percentage' ? 'var(--accent)' : 'var(--primary)', fontWeight: 600 }}>
                                  {ing.measure === 'percentage' ? 'Percentage' : 'Weight/Volume'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        })()
      )}

      {/* ── New Batch Modal ────────────────────────────────────── */}
      {showBatchModal && (
        <FloatingModal
          title="New Production Batch"
          subtitle="Schedule a new manufacturing run with finished goods ingredients"
          onClose={() => setShowBatchModal(false)}
          width={600}
          footer={
            <>
              <button onClick={() => setShowBatchModal(false)} className="btn btn-ghost">Cancel</button>
              <button onClick={handleSave} disabled={!fProduct.trim()} className="btn btn-primary" style={{ opacity: !fProduct.trim() ? 0.6 : 1 }}>Start Batch</button>
            </>
          }
        >
          <FormRow>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--secondary-foreground)' }}>Finished Product *</label>
              <select
                className="input-base"
                value={fProduct}
                onChange={e => setFProduct(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                <option value="">— Select product —</option>
                {productOptions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--secondary-foreground)' }}>Production Line</label>
              <select className="input-base" value={fLine} onChange={e => setFLine(e.target.value)} style={{ cursor: 'pointer' }}>
                {['Line A', 'Line B', 'Line C'].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </FormRow>
          <FormRow>
            <FormInput label="Planned Units" type="number" placeholder="e.g. 500" value={fPlanned} onChange={setFPlanned} />
            <FormInput label="Start Date/Time" type="datetime-local" value={fStart} onChange={setFStart} />
          </FormRow>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--secondary-foreground)' }}>Initial Status</label>
            <select className="input-base" value={fNewStatus} onChange={e => setFNewStatus(e.target.value)} style={{ cursor: 'pointer' }}>
              {BATCH_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Ingredients section */}
          <div style={{ marginTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>{t("prod.ingredients")}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '1px' }}>Select from inventory — quantities deducted in real-time when batch starts</div>              </div>
              <button onClick={addIngredient} className="btn btn-secondary" style={{ fontSize: '12px', padding: '5px 10px' }}>
                <Plus size={12} /> Add Ingredient
              </button>
            </div>

            <div style={{ display: 'flex', gap: '6px', padding: '6px 10px', borderRadius: '6px', background: 'var(--muted)', fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '6px' }}>
              <span style={{ flex: '3' }}>Inventory Item</span>
              <span style={{ flex: '1.2' }}>Use Qty</span>              <span style={{ flex: '1' }}>Unit</span>
              <span style={{ width: '28px' }}></span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
              {ingredients.map((ing) => {
                const invItem = items.find(x => x.name === ing.name)
                const avail = invItem ? invItem.qty : null
                const reqQty = Number(ing.qty) || 0
                const insufficient = avail !== null && reqQty > avail
                return (
                  <div key={ing.id} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <select
                        className="input-base"
                        style={{ flex: '3', fontSize: '13px', padding: '7px 10px', cursor: 'pointer' }}
                        value={ing.name}
                        onChange={e => {
                          const selected = items.find(x => x.name === e.target.value)
                          updateIngredient(ing.id, 'name', e.target.value)
                          if (selected) updateIngredient(ing.id, 'unit', selected.unit)
                        }}
                      >
                        <option value="">— Select inventory item —</option>
                        {items
                          .filter(x => x.category !== 'Finished Goods' && x.qty > 0)
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map(x => (
                            <option key={x.id} value={x.name}>
                              {x.name} (Stock: {x.qty} {x.unit})
                            </option>
                          ))
                        }
                      </select>
                      <input
                        className="input-base"
                        style={{ flex: '1.2', fontSize: '13px', padding: '7px 10px', borderColor: insufficient ? 'var(--danger)' : undefined }}
                        type="number"
                        placeholder="0"
                        min="0"
                        value={ing.qty}
                        onChange={e => updateIngredient(ing.id, 'qty', e.target.value)}
                      />
                      <input
                        className="input-base"
                        style={{ flex: '1', fontSize: '13px', padding: '7px 10px' }}
                        value={ing.unit}
                        placeholder="unit"
                        onChange={e => updateIngredient(ing.id, 'unit', e.target.value)}
                      />
                      <button onClick={() => removeIngredient(ing.id)} style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', color: 'var(--danger)', cursor: 'pointer', flexShrink: 0 }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                    {avail !== null && (
                      <div style={{ fontSize: '11px', marginLeft: '4px', color: insufficient ? 'var(--danger)' : 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {insufficient && <AlertTriangle size={10} style={{ color: 'var(--danger)' }} />}
                        Stock available: <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: insufficient ? 'var(--danger)' : 'var(--success)' }}>{avail} {invItem?.unit}</span>
                        {reqQty > 0 && <span style={{ color: 'var(--muted-foreground)' }}> · After use: <span style={{ fontFamily: 'JetBrains Mono, monospace', color: insufficient ? 'var(--danger)' : 'var(--foreground)', fontWeight: 600 }}>{Math.max(0, avail - reqQty)} {invItem?.unit}</span></span>}
                        {insufficient && <span style={{ color: 'var(--danger)', fontWeight: 600 }}> — INSUFFICIENT STOCK</span>}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Summary of total deductions */}
            {ingredients.some(i => i.name && Number(i.qty) > 0) && (
              <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(61,127,255,0.06)', border: '1px solid rgba(61,127,255,0.15)', fontSize: '11px', color: 'var(--muted-foreground)' }}>
                <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '4px' }}>Inventory deductions on batch start:</div>
                {ingredients.filter(i => i.name && Number(i.qty) > 0).map(i => {
                  const inv = items.find(x => x.name === i.name)
                  const qty = Number(i.qty)
                  const ok = inv && qty <= inv.qty
                  return (
                    <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', color: ok ? 'var(--foreground)' : 'var(--danger)' }}>
                      <span>{i.name}</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>-{qty} {i.unit} {!ok && '(insufficient)'}</span>
                    </div>
                  )
                })}              </div>
            )}
          </div>
        </FloatingModal>
      )}

      {/* ── Update / Complete Batch Modal ──────────────────────── */}
      {editBatch && (
        <FloatingModal
          title="Update Batch"
          subtitle={`${editBatch.id} — ${editBatch.product}`}
          onClose={() => setEditBatch(null)}
          footer={
            <>
              <button onClick={() => setEditBatch(null)} className="btn btn-ghost">Cancel</button>
              <button onClick={handleSaveEdit} className="btn btn-primary">Save Update</button>
            </>
          }
        >
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--secondary-foreground)' }}>Status</label>
            <select className="input-base" value={editStatus} onChange={e => setEditStatus(e.target.value)} style={{ cursor: 'pointer' }}>
              {BATCH_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <FormRow>
            <FormInput label="Actual Units Produced" type="number" placeholder="e.g. 480" value={editActual} onChange={setEditActual} />
            <FormInput label="Completed Date" type="date" value={editCompleted} onChange={setEditCompleted} />
          </FormRow>
          <FormInput label="Notes" placeholder="Any observations or issues…" value={editNotes} onChange={setEditNotes} />
          {editStatus === 'Completed' && (
            <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', fontSize: '11px', color: 'var(--success)' }}>
              When saved as Completed, the actual quantity of <strong>{editBatch.product}</strong> will be automatically added to Finished Goods in Inventory.
            </div>
          )}
        </FloatingModal>
      )}
    </div>
  )
}
