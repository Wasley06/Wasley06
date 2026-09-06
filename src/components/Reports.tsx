import { useLang } from '@/i18n'
import { Download, FileText, TrendingUp, Users } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts'
import { exportTablePdf } from '../utils/exportPdf'
import { useApp } from '../context/AppContext'
import fabegonLogo from '@/imports/ChatGPT_Image_Jun_27__2026__02_20_03_AM.png'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function buildMonthlyData(
  salesOrders: { date: string; total: number }[],
  purchaseOrders: { date: string; total: number }[],
) {
  const now = new Date()
  const months: { label: string; sales: number; purchases: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear() !== now.getFullYear() ? d.getFullYear() : ''}`
    const sales = salesOrders
      .filter(o => o.date?.slice(0, 7) === key)
      .reduce((s, o) => s + o.total, 0)
    const purchases = purchaseOrders
      .filter(o => o.date?.slice(0, 7) === key)
      .reduce((s, o) => s + o.total, 0)
    months.push({ label: label.trim(), sales: Math.round(sales / 1000), purchases: Math.round(purchases / 1000) })
  }
  return months
}

const STATUS_DOT: Record<string, string> = {
  Pending: '#F59E0B', Approved: '#3D7FFF', Invoiced: '#6366F1',
  Delivered: '#22C55E', Cancelled: '#EF4444',
}

export default function Reports() {
  const { t } = useLang()
  const { journalEntries, salesOrders, items, batches, purchaseOrders } = useApp()
  const today = new Date().toLocaleDateString('en-TZ')
  const logo = fabegonLogo

  /* ── Monthly performance data ───────────────────────────── */
  const monthlyData = buildMonthlyData(salesOrders, purchaseOrders)
  const hasChartData = monthlyData.some(m => m.sales > 0 || m.purchases > 0)

  /* ── Customer revenue map ───────────────────────────────── */
  const customerMap: Record<string, { orders: number; total: number; rep: string; statuses: string[]; lastDate: string }> = {}
  salesOrders.forEach(o => {
    if (!customerMap[o.customer]) {
      customerMap[o.customer] = { orders: 0, total: 0, rep: o.rep || '—', statuses: [], lastDate: o.date }
    }
    customerMap[o.customer].orders++
    customerMap[o.customer].total += o.total
    customerMap[o.customer].statuses.push(o.status)
    if (o.date > customerMap[o.customer].lastDate) {
      customerMap[o.customer].lastDate = o.date
      customerMap[o.customer].rep = o.rep || customerMap[o.customer].rep
    }
  })
  const customerList = Object.entries(customerMap)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 8)

  const totalSalesRevenue = salesOrders.reduce((s, o) => s + o.total, 0)

  /* ── Report row builders ────────────────────────────────── */
  const plRows = journalEntries.map(e => ({
    account: e.ref || e.description,
    debit: `TZS ${e.debit.toLocaleString()}`,
    credit: `TZS ${e.credit.toLocaleString()}`,
  }))

  const balanceRows = (() => {
    const totalDebit  = journalEntries.reduce((s, e) => s + e.debit, 0)
    const totalCredit = journalEntries.reduce((s, e) => s + e.credit, 0)
    return [
      { item: 'Total Revenue',     amount: `TZS ${totalCredit.toLocaleString()}` },
      { item: 'Total Expenditure', amount: `TZS ${totalDebit.toLocaleString()}` },
      { item: 'Net Position',      amount: `TZS ${(totalCredit - totalDebit).toLocaleString()}` },
    ]
  })()

  const salesRows = customerList.map(([customer, d]) => ({
    customer, orders: d.orders, total: `TZS ${d.total.toLocaleString()}`,
    rep: d.rep, status: d.statuses[d.statuses.length - 1],
  }))

  const inventoryRows = items.map(i => ({
    item: i.name, qty: `${i.qty} ${i.unit}`,
    unit_cost: `TZS ${i.cost.toLocaleString()}`, value: `TZS ${(i.qty * i.cost).toLocaleString()}`,
  }))

  const productionRows = batches.map(b => ({
    batch: b.id, product: b.product, planned: b.plannedQty, actual: b.actualQty,
    efficiency: b.plannedQty > 0 ? `${Math.round((b.actualQty / b.plannedQty) * 100)}%` : '—',
  }))

  const procurementRows = purchaseOrders.map(po => ({
    po_num: po.id, supplier: po.supplier, total: `TZS ${po.total.toLocaleString()}`, status: po.status,
  }))

  const REPORT_TYPES = [
    {
      name: 'Profit & Loss Statement', type: 'Finance', fileName: 'profit_loss_statement',
      columns: [{ header: 'Account', dataKey: 'account' }, { header: 'Debit (TZS)', dataKey: 'debit' }, { header: 'Credit (TZS)', dataKey: 'credit' }],
      rows: plRows,
    },
    {
      name: 'Balance Sheet', type: 'Finance', fileName: 'balance_sheet',
      columns: [{ header: 'Item', dataKey: 'item' }, { header: 'Amount (TZS)', dataKey: 'amount' }],
      rows: balanceRows,
    },
    {
      name: 'Sales by Customer', type: 'Sales', fileName: 'sales_by_customer',
      columns: [{ header: 'Customer', dataKey: 'customer' }, { header: 'Orders', dataKey: 'orders' }, { header: 'Total (TZS)', dataKey: 'total' }, { header: 'Sales Rep', dataKey: 'rep' }, { header: 'Status', dataKey: 'status' }],
      rows: salesRows,
    },
    {
      name: 'Inventory Valuation', type: 'Inventory', fileName: 'inventory_valuation',
      columns: [{ header: 'Item', dataKey: 'item' }, { header: 'Qty', dataKey: 'qty' }, { header: 'Unit Cost', dataKey: 'unit_cost' }, { header: 'Value (TZS)', dataKey: 'value' }],
      rows: inventoryRows,
    },
    {
      name: 'Production Efficiency', type: 'Production', fileName: 'production_efficiency',
      columns: [{ header: 'Batch', dataKey: 'batch' }, { header: 'Product', dataKey: 'product' }, { header: 'Planned', dataKey: 'planned' }, { header: 'Actual', dataKey: 'actual' }, { header: 'Efficiency %', dataKey: 'efficiency' }],
      rows: productionRows,
    },
    {
      name: 'Procurement Summary', type: 'Procurement', fileName: 'procurement_summary',
      columns: [{ header: 'PO #', dataKey: 'po_num' }, { header: 'Supplier', dataKey: 'supplier' }, { header: 'Total (TZS)', dataKey: 'total' }, { header: 'Status', dataKey: 'status' }],
      rows: procurementRows,
    },
  ]

  const exportReport = (r: typeof REPORT_TYPES[0]) => {
    exportTablePdf(r.name, `Generated ${today} · ${r.type}`, r.columns, r.rows as Record<string, unknown>[], r.fileName, logo, 'download')
  }
  const exportAll = () => { REPORT_TYPES.forEach((r, i) => setTimeout(() => exportReport(r), i * 700)) }

  const tooltipStyle = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', color: 'var(--foreground)' }

  return (
    <div className="p-6 space-y-5 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>{t("rep.title")}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{t("rep.subtitle")}</p>
        </div>
        <button onClick={exportAll} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--primary)', color: 'white' }}>
          <Download size={14} /> {t("action.export")} All
        </button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Monthly Performance Trends */}
        <div className="xl:col-span-2 rounded-xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <TrendingUp size={15} style={{ color: 'var(--primary)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Monthly Performance Trends</span>
          </div>
          <div className="text-xs mb-4" style={{ color: 'var(--muted-foreground)' }}>Sales &amp; Purchases — last 6 months (TZS Thousands)</div>
          {hasChartData ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`TZS ${(Number(v) * 1000).toLocaleString()}`, '']} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: 'var(--muted-foreground)' }} />
                <Bar dataKey="sales" name="Sales" fill="#22C55E" radius={[3, 3, 0, 0]} />
                <Bar dataKey="purchases" name="Purchases" fill="#3D7FFF" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: 'var(--muted-foreground)' }}>
              <TrendingUp size={32} style={{ opacity: 0.2 }} />
              <span style={{ fontSize: 13 }}>No data yet — add sales and purchases to see trends</span>
            </div>
          )}
        </div>

        {/* Revenue by Customer */}
        <div className="rounded-xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <Users size={15} style={{ color: 'var(--primary)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Revenue by Customer</span>
          </div>
          <div className="text-xs mb-3" style={{ color: 'var(--muted-foreground)' }}>
            {customerList.length > 0 ? `Top ${customerList.length} customers · all time` : 'No customer data yet'}
          </div>
          {customerList.length === 0 ? (
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)', fontSize: 13 }}>
              Add sales orders to see customer revenue
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto' }}>
              {customerList.map(([customer, d]) => {
                const pct = totalSalesRevenue > 0 ? Math.round((d.total / totalSalesRevenue) * 100) : 0
                const lastStatus = d.statuses[d.statuses.length - 1]
                const dot = STATUS_DOT[lastStatus] ?? '#94A3B8'
                return (
                  <div key={customer} style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--background)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', lineHeight: 1.3 }}>{customer}</div>
                        <div style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>
                          {d.orders} order{d.orders !== 1 ? 's' : ''} · Rep: {d.rep}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--foreground)', fontFamily: 'JetBrains Mono, monospace' }}>
                          {d.total >= 1_000_000 ? `${(d.total / 1_000_000).toFixed(1)}M` : `${Math.round(d.total / 1000)}K`}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'flex-end', marginTop: '1px' }}>
                          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: dot }} />
                          <span style={{ fontSize: '9px', color: 'var(--muted-foreground)' }}>{lastStatus}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ height: '3px', borderRadius: '99px', background: 'var(--border)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, borderRadius: '99px', background: 'var(--primary)' }} />
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--muted-foreground)', marginTop: '2px', textAlign: 'right' }}>{pct}% of total</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Report list */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Available Reports</span>
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Click PDF to download</span>
        </div>
        <div>
          {REPORT_TYPES.map((r, i) => (
            <div key={r.name}
              className="flex items-center justify-between px-5 py-3 transition-colors"
              style={{ borderBottom: i < REPORT_TYPES.length - 1 ? '1px solid var(--border)' : 'none' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div className="flex items-center gap-3">
                <FileText size={14} style={{ color: 'var(--muted-foreground)' }} />
                <div>
                  <div className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>{r.name}</div>
                  <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {r.type} · {r.rows.length} row{r.rows.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              <button
                onClick={() => exportReport(r)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                style={{ background: 'var(--secondary)', color: 'var(--primary)', border: '1px solid var(--border)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--primary)'; (e.currentTarget as HTMLElement).style.color = 'white' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--secondary)'; (e.currentTarget as HTMLElement).style.color = 'var(--primary)' }}
              >
                <Download size={11} /> PDF
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
