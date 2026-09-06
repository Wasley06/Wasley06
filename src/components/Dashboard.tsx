import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { useLang } from '@/i18n'
import {
  TrendingUp, TrendingDown, Package, ShoppingCart, CreditCard,
  AlertTriangle, Clock, CheckCircle2, RefreshCw, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import { useApp } from '../context/AppContext'

const PIE_COLORS = ['#2E7D32', '#1565C0', '#F9C42A', '#EF5350', '#9C27B0', '#FF9800']

function fmt(n: number) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`
  return n.toString()
}

const statusColors: Record<string, string> = {
  success: 'var(--success)',
  warning: 'var(--warning)',
  pending: 'var(--primary)',
  info:    '#42A5F5',
}

const CAL_DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const CAL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px' }}>
      <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--foreground)' }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted-foreground)', marginBottom: '2px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color, display: 'inline-block' }} />
          <span>{p.name ?? p.dataKey}:</span>
          <span style={{ fontWeight: 600, color: 'var(--foreground)', fontFamily: 'JetBrains Mono, monospace' }}>TZS {fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

function MiniCalendar({ calEvents }: { calEvents: Record<string, string[]> }) {
  const now = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  const selectedEvents = selectedDay ? (calEvents[selectedDay] ?? []) : []

  return (
    <div className="card" style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>{CAL_MONTHS[month].slice(0,3)} {year}</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={prev} style={{ background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '2px 6px', cursor: 'pointer', color: 'var(--foreground)', display: 'flex' }}><ChevronLeft size={12} /></button>
          <button onClick={next} style={{ background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '2px 6px', cursor: 'pointer', color: 'var(--foreground)', display: 'flex' }}><ChevronRight size={12} /></button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '1px', marginBottom: '4px' }}>
        {CAL_DAYS.map(d => <div key={d} style={{ fontSize: '9px', textAlign: 'center', color: 'var(--muted-foreground)', fontWeight: 600, padding: '2px 0' }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '1px' }}>
        {cells.map((day, i) => {
          const key = day ? `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}` : ''
          const events = day ? (calEvents[key] ?? []) : []
          const todayDate = new Date()
          const isToday = day === todayDate.getDate() && month === todayDate.getMonth() && year === todayDate.getFullYear()
          const isSelected = key === selectedDay
          return (
            <div key={i} onClick={() => { if (day) setSelectedDay(isSelected ? null : key) }} style={{ textAlign: 'center', padding: '3px 1px', position: 'relative', cursor: day ? 'pointer' : 'default' }}>
              {day && (
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', fontSize: '10px', fontWeight: isToday || isSelected ? 700 : 400, background: isToday ? 'var(--primary)' : isSelected ? 'rgba(46,125,50,0.2)' : 'transparent', color: isToday ? 'white' : isSelected ? 'var(--primary)' : 'var(--foreground)', border: isSelected && !isToday ? '1px solid var(--primary)' : 'none' }}>
                  {day}
                </span>
              )}
              {day && events.length > 0 && (
                <span style={{ position: 'absolute', bottom: '1px', left: '50%', transform: 'translateX(-50%)', width: '4px', height: '4px', borderRadius: '50%', background: isToday ? 'var(--accent)' : 'var(--primary)' }} />
              )}
            </div>
          )
        })}
      </div>
      <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
        {selectedDay ? (
          <>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--primary)', marginBottom: '6px' }}>{selectedDay}</div>
            {selectedEvents.length === 0
              ? <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontStyle: 'italic' }}>No events</div>
              : selectedEvents.map((ev, i) => (
                <div key={i} style={{ fontSize: '11px', color: 'var(--secondary-foreground)', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />{ev}
                </div>
              ))
            }
          </>
        ) : (
          <>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '6px' }}>UPCOMING</div>
            {Object.entries(calEvents).filter(([d]) => d >= new Date().toISOString().slice(0,10)).slice(0,3).map(([date, evs]) => (
              <div key={date} style={{ display: 'flex', gap: '8px', marginBottom: '4px', alignItems: 'flex-start', cursor: 'pointer' }} onClick={() => setSelectedDay(date)}>
                <span style={{ fontSize: '10px', color: 'var(--primary)', fontFamily: 'JetBrains Mono', fontWeight: 600, whiteSpace: 'nowrap', marginTop: '1px' }}>{date.slice(5)}</span>
                <span style={{ fontSize: '11px', color: 'var(--secondary-foreground)' }}>{evs[0]}{evs.length > 1 ? ` +${evs.length-1}` : ''}</span>
              </div>
            ))}
            {Object.keys(calEvents).filter(d => d >= new Date().toISOString().slice(0,10)).length === 0 && (
              <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontStyle: 'italic' }}>No upcoming events</div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function Dashboard({ user }: { user: { name: string; role: string; email: string } }) {
  const { t } = useLang()
  const { items, salesOrders, purchaseOrders, batches, scheduleEvents, expenditures, isLoading } = useApp()

  /* ── KPI computations ──────────────────────────────────────── */
  const currentMonth = new Date().toISOString().slice(0, 7)
  // Revenue = actual amount paid on sales orders this month
  const monthlyRevenue = salesOrders
    .filter(o => o.date?.startsWith(currentMonth) && o.status !== 'Cancelled')
    .reduce((s, o) => s + (o.amountPaid ?? (o.paymentType === 'Full Payment' ? o.total : 0)), 0)
  const activeOrders   = salesOrders.filter(o => ['Pending','Approved','Invoiced'].includes(o.status)).length
  const inventoryCount = items.length
  const arTotal        = salesOrders.filter(o => !['Cancelled','Delivered'].includes(o.status)).reduce((s, o) => s + (o.balance ?? 0), 0)

  /* ── Revenue vs Expenses chart (last 6 months) ─────────────── */
  const revenueData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i))
    const m = d.toISOString().slice(0, 7)
    // Revenue = actual amount paid on sales orders for that month
    const revenue = salesOrders
      .filter(o => o.date?.startsWith(m) && o.status !== 'Cancelled')
      .reduce((s, o) => s + (o.amountPaid ?? (o.paymentType === 'Full Payment' ? o.total : 0)), 0)
    // Expenses = recorded expenditures + PO amounts paid that month
    const expAmt = expenditures.filter(e => e.date?.startsWith(m) && e.status !== 'Rejected').reduce((s, e) => s + e.amount, 0)
    const poAmt  = purchaseOrders.filter(o => o.date?.startsWith(m)).reduce((s, o) => s + (o.amountPaid ?? 0), 0)
    return { month: d.toLocaleString('en', { month: 'short' }), revenue, expenses: expAmt + poAmt }
  })

  /* ── Inventory breakdown pie ───────────────────────────────── */
  const catMap: Record<string, number> = {}
  items.forEach(i => { catMap[i.category || 'Other'] = (catMap[i.category || 'Other'] || 0) + 1 })
  const totalItems = items.length || 1
  const inventoryPie = Object.entries(catMap).slice(0, 4).map(([name, count]) => ({ name, value: Math.round(count / totalItems * 100) }))

  /* ── Production bar chart (last 6 batches or by day) ──────── */
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  const productionData = days.map(day => {
    const output = batches.filter(b => {
      if (!b.started) return false
      const d = new Date(b.started)
      return days[d.getDay() === 0 ? 6 : d.getDay() - 1] === day
    }).reduce((s, b) => s + b.actualQty, 0)
    return { day, output }
  })

  /* ── Low stock alerts ──────────────────────────────────────── */
  const lowStockItems = items.filter(i => i.qty <= i.reorder).slice(0, 5)

  /* ── Recent activity ───────────────────────────────────────── */
  const recentActivity = [
    ...salesOrders.slice(0, 3).map(o => ({
      msg: `Sales order ${o.id} — ${o.customer} · TZS ${o.total.toLocaleString()}`,
      time: o.date, status: o.status === 'Approved' || o.status === 'Delivered' ? 'success' : 'pending',
    })),
    ...purchaseOrders.slice(0, 2).map(o => ({
      msg: `Purchase ${o.id} from ${o.supplier} · TZS ${o.total.toLocaleString()}`,
      time: o.date, status: 'info',
    })),
  ].sort((a, b) => (b.time || '').localeCompare(a.time || '')).slice(0, 5)

  /* ── Calendar events from schedule ────────────────────────── */
  const calEvents: Record<string, string[]> = {}
  scheduleEvents.forEach(ev => {
    if (!calEvents[ev.date]) calEvents[ev.date] = []
    calEvents[ev.date].push(`${ev.time ? ev.time + ' ' : ''}${ev.title}`)
  })

  const kpis = [
    { label: 'Monthly Revenue',     value: `TZS ${fmt(monthlyRevenue)}`, change: monthlyRevenue > 0 ? '+live' : '—', positive: true,  icon: TrendingUp,   color: '#2E7D32', bg: 'rgba(46,125,50,0.12)' },
    { label: 'Active Orders',       value: String(activeOrders),          change: activeOrders > 0 ? 'live' : '—', positive: true,  icon: ShoppingCart, color: '#4CAF50', bg: 'rgba(76,175,80,0.1)' },
    { label: 'Inventory Items',     value: String(inventoryCount),        change: inventoryCount > 0 ? 'live' : '—', positive: true,  icon: Package,      color: '#F9C42A', bg: 'rgba(249,196,42,0.1)' },
    { label: 'Accounts Receivable', value: `TZS ${fmt(arTotal)}`,         change: arTotal > 0 ? 'live' : '—', positive: arTotal < 1e7,  icon: CreditCard,   color: '#EF5350', bg: 'rgba(239,83,80,0.1)' },
  ]

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-in">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--foreground)' }}>
            Welcome back, {user.name.split(' ')[0]}
          </h1>
          <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--muted-foreground)' }}>
            {new Date().toLocaleDateString('en-TZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · Dar es Salaam HQ
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px', borderRadius: '20px', background: isLoading ? 'rgba(249,196,42,0.1)' : 'rgba(76,175,80,0.1)', color: isLoading ? 'var(--warning)' : 'var(--success)', border: `1px solid ${isLoading ? 'rgba(249,196,42,0.2)' : 'rgba(76,175,80,0.2)'}` }}>
            {isLoading ? <><RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> Loading data…</> : <><CheckCircle2 size={12} /> Live data</>}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
        {kpis.map(kpi => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} style={{ color: kpi.color }} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: kpi.positive ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  {kpi.positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}{kpi.change}
                </span>
              </div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--foreground)', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>{kpi.value}</div>
              <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '4px' }}>{kpi.label}</div>
            </div>
          )
        })}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>Revenue vs Expenses</div>
              <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '2px' }}>Last 6 months · live data</div>
            </div>
            <div style={{ display: 'flex', gap: '14px', fontSize: '11px', color: 'var(--muted-foreground)', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2E7D32', display: 'inline-block' }} />Revenue</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1565C0', display: 'inline-block' }} />Expenses</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="gRev2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2E7D32" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#2E7D32" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gExp2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1565C0" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#1565C0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(128,128,128,0.08)" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontFamily: 'inherit' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#2E7D32" strokeWidth={2} fill="url(#gRev2)" />
              <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#1565C0" strokeWidth={2} fill="url(#gExp2)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>Inventory Breakdown</div>
          <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginBottom: '12px' }}>By category · {items.length} items</div>
          {inventoryPie.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={inventoryPie} cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={3} dataKey="value">
                    {inventoryPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                {inventoryPie.map((d, i) => (
                  <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--secondary-foreground)' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: PIE_COLORS[i], display: 'inline-block' }} />{d.name}
                    </span>
                    <span style={{ fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', color: 'var(--foreground)' }}>{d.value}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)', fontSize: '12px', textAlign: 'center' }}>
              No inventory data yet
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 260px', gap: '16px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>Daily Production Output</div>
          <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginBottom: '12px' }}>Units this week · {batches.length} batches</div>
          {batches.length > 0 ? (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={productionData} barSize={22}>
                <CartesianGrid stroke="rgba(128,128,128,0.08)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="output" fill="#2E7D32" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)', fontSize: '12px', textAlign: 'center' }}>
              No production batches yet
            </div>
          )}
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <AlertTriangle size={14} style={{ color: 'var(--warning)' }} />
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>Low Stock Alerts</span>
            <span style={{ marginLeft: 'auto', fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(249,196,42,0.12)', color: 'var(--warning)' }}>
              {lowStockItems.length}
            </span>
          </div>
          {lowStockItems.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {lowStockItems.map(item => {
                const pct = item.reorder > 0 ? Math.min(100, Math.round((item.qty / item.reorder) * 100)) : 0
                return (
                  <div key={item.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 500, color: 'var(--foreground)' }}>{item.name}</span>
                      <span style={{ color: 'var(--warning)', fontFamily: 'JetBrains Mono, monospace' }}>{item.qty} {item.unit}</span>
                    </div>
                    <div style={{ height: '4px', borderRadius: '2px', background: 'var(--muted)' }}>
                      <div style={{ height: '100%', borderRadius: '2px', width: `${pct}%`, background: pct < 30 ? 'var(--danger)' : 'var(--warning)' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', fontStyle: 'italic' }}>All items adequately stocked</div>
          )}
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '16px' }}>{t("dash.recentActivity")}</div>
          {recentActivity.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentActivity.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColors[a.status] ?? 'var(--muted-foreground)', marginTop: '6px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--foreground)', lineHeight: 1.4 }}>{a.msg}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={9} />{a.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', fontStyle: 'italic' }}>No recent activity</div>
          )}
        </div>

        <MiniCalendar calEvents={calEvents} />
      </div>
    </div>
  )
}
