import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const BRAND_GREEN = [46, 125, 50] as [number, number, number]
const BRAND_YELLOW = [249, 196, 42] as [number, number, number]
const BRAND_BLUE = [21, 101, 192] as [number, number, number]
const DARK_BG = [8, 14, 10] as [number, number, number]

/* Cache logo as base64 so we only fetch once */
let _logoCache: string | null = null

async function getLogoBase64(logoUrl: string): Promise<string | null> {
  if (_logoCache) return _logoCache

  try {
    const res = await fetch(logoUrl)
    const blob = await res.blob()

    return new Promise(resolve => {
      const reader = new FileReader()

      reader.onloadend = () => {
        _logoCache = reader.result as string
        resolve(_logoCache)
      }

      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

async function addHeader(
  doc: jsPDF,
  title: string,
  subtitle: string | undefined,
  logoUrl?: string,
) {
  const W = doc.internal.pageSize.getWidth()

  /* Dark header bar */
  doc.setFillColor(...DARK_BG)
  doc.rect(0, 0, W, 30, 'F')

  /* Yellow stripe */
  doc.setFillColor(...BRAND_YELLOW)
  doc.rect(0, 29, W, 2.5, 'F')

  /* Logo image */
  if (logoUrl) {
    const b64 = await getLogoBase64(logoUrl)

    if (b64) {
      doc.addImage(b64, 'PNG', 10, 4, 22, 22)
    }
  }

  /* Company text */
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('Fabegon Industries Ltd', 36, 13)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(180, 220, 180)
  doc.text('Dar es Salaam · Tanzania · ERP System', 36, 19)

  /* Report title */
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(title.toUpperCase(), W - 12, 12, {
    align: 'right',
  })

  if (subtitle) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(180, 220, 180)
    doc.text(subtitle, W - 12, 18, {
      align: 'right',
    })
  }

  doc.setFontSize(7)
  doc.setTextColor(160, 200, 160)
  doc.text(
    `Generated: ${new Date().toLocaleDateString('en-TZ', {
      dateStyle: 'long',
    })}`,
    W - 12,
    24,
    {
      align: 'right',
    },
  )
}

function addFooter(doc: jsPDF) {
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()

  doc.setFillColor(...BRAND_GREEN)
  doc.rect(0, H - 10, W, 10, 'F')

  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(255, 255, 255)

  doc.text(
    'Fabegon Industries Ltd — Confidential',
    12,
    H - 4,
  )

  doc.text(
    `Page ${doc.getNumberOfPages()}`,
    W - 12,
    H - 4,
    {
      align: 'right',
    },
  )
}

interface Col {
  header: string
  dataKey: string
}

export async function exportTablePdf(
  title: string,
  subtitle: string,
  columns: Col[],
  rows: Record<string, unknown>[],
  fileName: string,
  logoUrl?: string,
  action: 'download' | 'print' | 'share' = 'download',
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  await addHeader(doc, title, subtitle, logoUrl)

  autoTable(doc, {
    startY: 36,
    columns,
    body: rows as any,

    headStyles: {
      fillColor: BRAND_GREEN,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },

    alternateRowStyles: {
      fillColor: [240, 247, 240],
    },

    bodyStyles: {
      fontSize: 8,
      textColor: [30, 30, 30],
    },

    tableLineColor: [210, 230, 210],
    tableLineWidth: 0.1,
  })

  addFooter(doc)

  await deliverPdf(doc, fileName, action)
}

export async function exportOrderPdf(
  order: {
    id: string
    customer: string
    date: string
    rep: string
    paymentType: string
    items: {
      name: string
      qty: number
      unit: string
      price: number
    }[]
  },
  logoUrl?: string,
  action: 'download' | 'print' | 'share' = 'download',
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const W = doc.internal.pageSize.getWidth()

  await addHeader(
    doc,
    'Sales Order',
    order.id,
    logoUrl,
  )

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(50, 50, 50)

  doc.text(
    `Customer: ${order.customer}`,
    12,
    40,
  )

  doc.text(
    `Date: ${order.date}`,
    12,
    46,
  )

  doc.text(
    `Sales Rep: ${order.rep}`,
    12,
    52,
  )

  doc.text(
    `Payment: ${order.paymentType}`,
    W - 12,
    40,
    {
      align: 'right',
    },
  )

  const total = order.items.reduce(
    (sum, item) => sum + item.qty * item.price,
    0,
  )

  autoTable(doc, {
    startY: 58,

    columns: [
      {
        header: '#',
        dataKey: 'no',
      },
      {
        header: 'Item',
        dataKey: 'name',
      },
      {
        header: 'Qty',
        dataKey: 'qty',
      },
      {
        header: 'Unit',
        dataKey: 'unit',
      },
      {
        header: 'Unit Price (TZS)',
        dataKey: 'price',
      },
      {
        header: 'Total (TZS)',
        dataKey: 'total',
      },
    ],

    body: order.items.map((item, index) => ({
      no: index + 1,
      name: item.name,
      qty: item.qty,
      unit: item.unit,
      price: item.price.toLocaleString(),
      total: (
        item.qty * item.price
      ).toLocaleString(),
    })) as any,

    headStyles: {
      fillColor: BRAND_GREEN,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },

    bodyStyles: {
      fontSize: 8,
      textColor: [30, 30, 30],
    },

    alternateRowStyles: {
      fillColor: [240, 247, 240],
    },

    foot: [
      [
        '',
        '',
        '',
        '',
        'TOTAL',
        `TZS ${total.toLocaleString()}`,
      ],
    ],

    footStyles: {
      fillColor: BRAND_BLUE,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
  })

  addFooter(doc)

  await deliverPdf(
    doc,
    order.id,
    action,
  )
}

export interface StatementTransaction {
  date: string
  reference: string
  description: string
  debit: number
  credit: number
  balance: number
}

export async function exportStatementPdf(
  title: string,
  entityName: string,
  period: string,
  openingBalance: number,
  transactions: StatementTransaction[],
  fileName: string,
  logoUrl?: string,
  action: 'download' | 'print' | 'share' = 'download',
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()

  await addHeader(doc, title, entityName, logoUrl)

  // Statement meta block
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(50, 50, 50)
  doc.text(`Entity: ${entityName}`, 12, 38)
  doc.text(`Period: ${period}`, 12, 44)
  doc.text(`Opening Balance: TZS ${openingBalance.toLocaleString()}`, W - 12, 38, { align: 'right' })
  doc.text(`Statement Date: ${new Date().toLocaleDateString('en-TZ')}`, W - 12, 44, { align: 'right' })

  // Running balance computation for display
  let running = openingBalance
  const rows = transactions.map(tx => {
    running += tx.debit - tx.credit
    return {
      date: tx.date,
      reference: tx.reference,
      description: tx.description,
      debit:   tx.debit   > 0 ? `TZS ${tx.debit.toLocaleString()}`   : '—',
      credit:  tx.credit  > 0 ? `TZS ${tx.credit.toLocaleString()}`  : '—',
      balance: `TZS ${running.toLocaleString()}`,
    }
  })

  // Closing summary
  const closing = openingBalance + transactions.reduce((s, t) => s + t.debit - t.credit, 0)
  const totalDebits  = transactions.reduce((s, t) => s + t.debit, 0)
  const totalCredits = transactions.reduce((s, t) => s + t.credit, 0)

  autoTable(doc, {
    startY: 50,
    columns: [
      { header: 'Date',        dataKey: 'date' },
      { header: 'Reference',   dataKey: 'reference' },
      { header: 'Description', dataKey: 'description' },
      { header: 'Debit',       dataKey: 'debit' },
      { header: 'Credit',      dataKey: 'credit' },
      { header: 'Balance',     dataKey: 'balance' },
    ],
    body: rows as any,
    headStyles: { fillColor: BRAND_GREEN, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8, textColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: [240, 247, 240] },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 28 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 32, halign: 'right' },
      4: { cellWidth: 32, halign: 'right' },
      5: { cellWidth: 36, halign: 'right', fontStyle: 'bold' },
    },
    foot: [[
      '', '', 'TOTALS',
      `TZS ${totalDebits.toLocaleString()}`,
      `TZS ${totalCredits.toLocaleString()}`,
      `TZS ${closing.toLocaleString()}`,
    ]],
    footStyles: { fillColor: BRAND_BLUE, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    tableLineColor: [210, 230, 210],
    tableLineWidth: 0.1,
  })

  addFooter(doc)
  await deliverPdf(doc, fileName, action)
}

export interface Customer360Data {
  client: { id: string; name: string; email: string; phone: string; address: string; contactPerson?: string; customerType?: string; creditLimit: number }
  orders: { id: string; date: string; total: number; status: string; paymentType: string; amountPaid?: number; balance?: number; items: { name: string; qty: number; unit: string; price: number }[]; rep: string }[]
  debts: { id: string; name: string; amount: number; dueDate: string; status: string; notes: string; items?: { name: string; qty: number; unit: string; price: number }[] }[]
  visits: { id: string; date: string; salesperson: string; purpose: string; outcome: string; notes: string }[]
  timeline: { date: string; type: string; label: string; detail: string }[]
}

export async function exportCustomer360Pdf(
  data: Customer360Data,
  fileName: string,
  logoUrl?: string,
  action: 'download' | 'print' | 'share' = 'download',
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const { client, orders, debts, visits, timeline } = data

  await addHeader(doc, 'Customer 360° Profile', client.name, logoUrl)

  // Client summary
  let y = 36
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(50, 50, 50)
  doc.text(`ID: ${client.id}`, 12, y); doc.text(`Type: ${client.customerType ?? '—'}`, W / 2, y)
  y += 6
  doc.text(`Phone: ${client.phone || '—'}`, 12, y); doc.text(`Email: ${client.email || '—'}`, W / 2, y)
  y += 6
  doc.text(`Address: ${client.address || '—'}`, 12, y); doc.text(`Contact: ${client.contactPerson ?? '—'}`, W / 2, y)
  y += 6
  doc.text(`Credit Limit: TZS ${client.creditLimit.toLocaleString()}`, 12, y)
  y += 8

  // Financial summary KPIs
  const totalOrdered = orders.reduce((s, o) => s + o.total, 0)
  const totalPaid = orders.reduce((s, o) => s + (o.amountPaid ?? (o.paymentType === 'Full Payment' ? o.total : 0)), 0)
  const totalBalance = orders.reduce((s, o) => s + (o.balance ?? 0), 0)
  const debtTotal = debts.reduce((s, d) => s + d.amount, 0)

  doc.setFillColor(...BRAND_GREEN); doc.rect(12, y, W - 24, 1, 'F'); y += 4
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(46, 125, 50)
  doc.text('FINANCIAL SUMMARY', 12, y); y += 6
  autoTable(doc, {
    startY: y,
    columns: [{ header: 'Metric', dataKey: 'k' }, { header: 'Value', dataKey: 'v' }],
    body: [
      { k: 'Total Orders', v: `${orders.length} orders` },
      { k: 'Total Ordered', v: `TZS ${totalOrdered.toLocaleString()}` },
      { k: 'Total Paid', v: `TZS ${totalPaid.toLocaleString()}` },
      { k: 'Outstanding Balance (Orders)', v: `TZS ${totalBalance.toLocaleString()}` },
      { k: 'Still Owed (Debts)', v: `TZS ${debtTotal.toLocaleString()} (${debts.length} records)` },
    ],
    headStyles: { fillColor: BRAND_GREEN, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 0: { cellWidth: 60 }, 1: { fontStyle: 'bold' } },
    margin: { left: 12, right: 12 },
  })
  y = (doc as any).lastAutoTable.finalY + 8

  // Orders — each order gets a summary row + its line items
  if (orders.length > 0) {
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(46, 125, 50)
    doc.text('ORDERS & ITEMS', 12, y); y += 4
    for (const o of orders) {
      if (y > 240) { doc.addPage(); y = 20 }
      // Order header row
      autoTable(doc, {
        startY: y,
        columns: [
          { header: 'Order', dataKey: 'id' }, { header: 'Date', dataKey: 'date' },
          { header: 'Payment', dataKey: 'payment' }, { header: 'Rep', dataKey: 'rep' },
          { header: 'Paid', dataKey: 'paid' }, { header: 'Balance', dataKey: 'balance' },
          { header: 'Status', dataKey: 'status' },
        ],
        body: [{ id: o.id, date: o.date, payment: o.paymentType, rep: o.rep || '—', paid: `TZS ${(o.amountPaid ?? 0).toLocaleString()}`, balance: `TZS ${(o.balance ?? 0).toLocaleString()}`, status: o.status }],
        headStyles: { fillColor: BRAND_BLUE, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8, fontStyle: 'bold', fillColor: [235, 245, 255] },
        margin: { left: 12, right: 12 },
        tableLineColor: [200, 220, 240],
        tableLineWidth: 0.1,
      })
      y = (doc as any).lastAutoTable.finalY
      // Line items sub-table
      if (o.items && o.items.length > 0) {
        autoTable(doc, {
          startY: y,
          columns: [
            { header: 'Item Name', dataKey: 'name' }, { header: 'Qty', dataKey: 'qty' },
            { header: 'Unit', dataKey: 'unit' }, { header: 'Unit Price (TZS)', dataKey: 'price' },
            { header: 'Subtotal (TZS)', dataKey: 'subtotal' },
          ],
          body: o.items.map(it => ({
            name: it.name, qty: it.qty, unit: it.unit,
            price: it.price.toLocaleString(),
            subtotal: (it.qty * it.price).toLocaleString(),
          })),
          headStyles: { fillColor: [180, 210, 240], textColor: [20, 60, 100], fontStyle: 'bold', fontSize: 7 },
          bodyStyles: { fontSize: 7, textColor: [40, 40, 40] },
          columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 16, halign: 'right' }, 2: { cellWidth: 14 }, 3: { cellWidth: 32, halign: 'right' }, 4: { cellWidth: 36, halign: 'right', fontStyle: 'bold' } },
          foot: [['', '', '', 'Order Total', `TZS ${o.total.toLocaleString()}`]],
          footStyles: { fillColor: BRAND_BLUE, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
          margin: { left: 18, right: 12 },
          tableLineColor: [200, 220, 240],
          tableLineWidth: 0.1,
        })
        y = (doc as any).lastAutoTable.finalY + 4
      } else {
        y += 4
      }
    }
    y += 4
  }

  // Debt breakdown — each debt gets a header row + its linked order items
  if (debts.length > 0) {
    if (y > 200) { doc.addPage(); y = 20 }
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(200, 30, 30)
    doc.text('DEBT BREAKDOWN', 12, y); y += 4
    for (const d of debts) {
      if (y > 240) { doc.addPage(); y = 20 }
      // Debt header row
      // Build a readable description: if items exist show their names, else fall back to notes
      const itemSummary = d.items && d.items.length > 0
        ? d.items.map(it => `${it.name} ×${it.qty}`).join(', ')
        : (d.notes || '—')
      autoTable(doc, {
        startY: y,
        columns: [
          { header: 'Debt Ref', dataKey: 'id' }, { header: 'Items / Description', dataKey: 'notes' },
          { header: 'Due Date', dataKey: 'due' }, { header: 'Status', dataKey: 'status' },
          { header: 'Amount', dataKey: 'amount' },
        ],
        body: [{ id: d.id, notes: itemSummary, due: d.dueDate || '—', status: d.status, amount: `TZS ${d.amount.toLocaleString()}` }],
        headStyles: { fillColor: [180, 30, 30], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8, fontStyle: 'bold', fillColor: [255, 240, 240] },
        margin: { left: 12, right: 12 },
        tableLineColor: [220, 180, 180],
        tableLineWidth: 0.1,
      })
      y = (doc as any).lastAutoTable.finalY
      // Line items that caused this debt
      if (d.items && d.items.length > 0) {
        autoTable(doc, {
          startY: y,
          columns: [
            { header: 'Item Name', dataKey: 'name' }, { header: 'Qty', dataKey: 'qty' },
            { header: 'Unit', dataKey: 'unit' }, { header: 'Unit Price (TZS)', dataKey: 'price' },
            { header: 'Subtotal (TZS)', dataKey: 'subtotal' },
          ],
          body: d.items.map(it => ({
            name: it.name, qty: it.qty, unit: it.unit,
            price: it.price.toLocaleString(),
            subtotal: (it.qty * it.price).toLocaleString(),
          })),
          headStyles: { fillColor: [240, 180, 180], textColor: [100, 20, 20], fontStyle: 'bold', fontSize: 7 },
          bodyStyles: { fontSize: 7, textColor: [40, 40, 40] },
          columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 16, halign: 'right' }, 2: { cellWidth: 14 }, 3: { cellWidth: 32, halign: 'right' }, 4: { cellWidth: 36, halign: 'right', fontStyle: 'bold' } },
          foot: [['', '', '', 'Debt Total', `TZS ${d.amount.toLocaleString()}`]],
          footStyles: { fillColor: [180, 30, 30], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
          margin: { left: 18, right: 12 },
          tableLineColor: [220, 180, 180],
          tableLineWidth: 0.1,
        })
        y = (doc as any).lastAutoTable.finalY + 4
      } else {
        y += 4
      }
    }
    y += 4
  }

  // Visits / interactions
  if (visits.length > 0) {
    if (y > 200) { doc.addPage(); y = 20 }
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(46, 125, 50)
    doc.text('CUSTOMER VISITS & INTERACTIONS', 12, y); y += 4
    autoTable(doc, {
      startY: y,
      columns: [
        { header: 'Date', dataKey: 'date' }, { header: 'Representative', dataKey: 'rep' },
        { header: 'Purpose', dataKey: 'purpose' }, { header: 'Outcome', dataKey: 'outcome' },
        { header: 'Notes', dataKey: 'notes' },
      ],
      body: visits.map(v => ({ date: v.date, rep: v.salesperson || '—', purpose: v.purpose || '—', outcome: v.outcome || '—', notes: v.notes || '—' })),
      headStyles: { fillColor: BRAND_GREEN, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      margin: { left: 12, right: 12 },
    })
    y = (doc as any).lastAutoTable.finalY + 8
  }

  // Timeline — sorted newest first (matches Customer 360 UI)
  if (timeline.length > 0) {
    if (y > 200) { doc.addPage(); y = 20 }
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(21, 101, 192)
    doc.text('CUSTOMER TIMELINE', 12, y); y += 4
    const typeLabel: Record<string, string> = { order: 'Order', payment: 'Payment', visit: 'Visit', debt: 'Debt' }
    const sorted = [...timeline].sort((a, b) => b.date.localeCompare(a.date))
    autoTable(doc, {
      startY: y,
      columns: [
        { header: 'Date', dataKey: 'date' }, { header: 'Type', dataKey: 'type' },
        { header: 'Event', dataKey: 'label' }, { header: 'Details', dataKey: 'detail' },
      ],
      body: sorted.map(t => ({ date: t.date, type: typeLabel[t.type] ?? t.type, label: t.label, detail: t.detail })),
      headStyles: { fillColor: BRAND_BLUE, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      columnStyles: { 0: { cellWidth: 22 }, 1: { cellWidth: 18 } },
      didParseCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 1) {
          const type = sorted[data.row.index]?.type
          if (type === 'order')   data.cell.styles.textColor = [46, 125, 50]
          else if (type === 'payment') data.cell.styles.textColor = [217, 119, 6]
          else if (type === 'visit')   data.cell.styles.textColor = [21, 101, 192]
          else if (type === 'debt')    data.cell.styles.textColor = [200, 30, 30]
        }
      },
      margin: { left: 12, right: 12 },
    })
  }

  addFooter(doc)
  await deliverPdf(doc, fileName, action)
}

export async function exportPOStatement(
  po: {
    id: string
    supplier: string
    date: string
    delivery?: string
    receivedDate?: string
    status: string
    buyer?: string
    notes?: string
    total: number
    amountPaid?: number
    balance?: number
    paymentStatus?: string
    paymentMethod?: string
    paymentType?: string
    items: { name: string; qty: number; unit: string; cost: number }[]
    paymentInstallments?: { id: string; date: string; amount: number; method: string; reference?: string; notes?: string }[]
  },
  logoUrl?: string,
  action: 'download' | 'print' | 'share' = 'download',
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()

  if (logoUrl) await addHeader(doc, 'Purchase Order Statement', `${po.id} — ${po.supplier}`, logoUrl)
  else {
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BRAND_GREEN)
    doc.text('Purchase Order Statement', 14, 20)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(60, 60, 60)
    doc.text(`${po.id} — ${po.supplier}`, 14, 27)
  }

  let y = 40

  // Summary block
  const fmt = (d?: string) => d ? d.split('-').reverse().join('/') : '—'
  const summaryRows = [
    ['Purchase Order ID', po.id],
    ['Supplier', po.supplier],
    ['Order Date', fmt(po.date)],
    ['Expected Delivery', fmt(po.delivery)],
    ['Received Date', fmt(po.receivedDate)],
    ['Status', po.status],
    ['Payment Type', po.paymentType ?? '—'],
    ['Payment Method', po.paymentMethod ?? '—'],
    ['Payment Status', po.paymentStatus ?? '—'],
    ['Buyer', po.buyer ?? '—'],
    ['Notes', po.notes ?? '—'],
  ]
  autoTable(doc, {
    startY: y,
    body: summaryRows,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50, textColor: [80, 80, 80] }, 1: { textColor: [20, 20, 20] } },
    margin: { left: 14, right: 14 },
  })
  y = (doc as any).lastAutoTable.finalY + 8

  // Items table
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BRAND_GREEN)
  doc.text('Order Items', 14, y)
  y += 4
  autoTable(doc, {
    startY: y,
    head: [['Item', 'Category', 'Qty', 'Unit', 'Unit Cost (TZS)', 'Subtotal (TZS)']],
    body: po.items.map(it => [it.name, (it as any).category ?? '—', it.qty, it.unit, it.cost.toLocaleString(), (it.qty * it.cost).toLocaleString()]),
    headStyles: { fillColor: BRAND_GREEN, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    footStyles: { fillColor: [230, 240, 230], textColor: [20, 20, 20], fontStyle: 'bold' },
    foot: [['', '', '', '', 'TOTAL', po.total.toLocaleString()]],
    margin: { left: 14, right: 14 },
  })
  y = (doc as any).lastAutoTable.finalY + 8

  // Payment summary
  const amtPaid = po.amountPaid ?? 0
  const bal = po.balance ?? Math.max(0, po.total - amtPaid)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BRAND_GREEN)
  doc.text('Payment Summary', 14, y)
  y += 4
  autoTable(doc, {
    startY: y,
    body: [
      ['Total Amount', `TZS ${po.total.toLocaleString()}`],
      ['Amount Paid', `TZS ${amtPaid.toLocaleString()}`],
      ['Balance Due', `TZS ${bal.toLocaleString()}`],
    ],
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50, textColor: [80, 80, 80] }, 1: { textColor: [20, 20, 20] } },
    margin: { left: 14, right: 14 },
  })
  y = (doc as any).lastAutoTable.finalY + 8

  // Payment installments
  const insts = po.paymentInstallments ?? []
  if (insts.length > 0) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BRAND_GREEN)
    doc.text('Payment History', 14, y)
    y += 4
    autoTable(doc, {
      startY: y,
      head: [['Date', 'Method', 'Amount (TZS)', 'Reference', 'Notes']],
      body: insts.map(i => [fmt(i.date), i.method, i.amount.toLocaleString(), i.reference ?? '—', i.notes ?? '—']),
      headStyles: { fillColor: BRAND_GREEN, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    })
  }

  // Watermark if unpaid
  if (bal > 0) {
    const pages = doc.getNumberOfPages()
    for (let p = 1; p <= pages; p++) {
      doc.setPage(p)
      doc.setFontSize(60)
      doc.setTextColor(239, 68, 68)
      doc.setGState(new (doc as any).GState({ opacity: 0.07 }))
      doc.text('UNPAID', W / 2, 160, { align: 'center', angle: 45 })
      doc.setGState(new (doc as any).GState({ opacity: 1 }))
    }
  }

  addFooter(doc)
  await deliverPdf(doc, `PO_Statement_${po.id}`, action)
}

async function deliverPdf(
  doc: jsPDF,
  baseName: string,
  action: 'download' | 'print' | 'share',
) {
  const fileName = `${baseName}_${new Date()
    .toISOString()
    .slice(0, 10)}.pdf`

  const isCapacitor =
    typeof (window as any).Capacitor !== 'undefined'

  const isMobile =
    isCapacitor ||
    /Android|iPhone|iPad/i.test(
      navigator.userAgent,
    )

  /* Get blob once and reuse */
  const blob = doc.output('blob')

  /* Open PDF in a new tab */
  const openBlob = () => {
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.target = '_blank'
    a.rel = 'noopener'

    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 10_000)
  }

  /* Web Share API */
  const tryNativeShare = async (): Promise<boolean> => {
    try {
      const file = new File(
        [blob],
        fileName,
        {
          type: 'application/pdf',
        },
      )

      if (navigator.share) {
        if (
          navigator.canShare &&
          navigator.canShare({
            files: [file],
          })
        ) {
          await navigator.share({
            title: baseName,
            files: [file],
          })

          return true
        }

        /* Fallback: share blob URL */
        const url = URL.createObjectURL(blob)

        await navigator.share({
          title: baseName,
          url,
        })

        URL.revokeObjectURL(url)

        return true
      }
    } catch {
      /* User cancelled or share is unsupported */
    }

    return false
  }

  /* Share */
  if (action === 'share') {
    const ok = await tryNativeShare()

    if (!ok) {
      openBlob()
    }

    return
  }

  /* Print */
  if (action === 'print') {
    if (isMobile) {
      /* Mobile: open/share PDF so the user can print */
      const shared = await tryNativeShare()

      if (!shared) {
        openBlob()
      }
    } else {
      const url = URL.createObjectURL(blob)

      const win = window.open(
        url,
        '_blank',
      )

      if (win) {
        win.onload = () => {
          win.focus()
          win.print()
        }
      } else {
        openBlob()
      }
    }

    return
  }

  /* Download */
  if (isMobile) {
    /*
     * Android WebView:
     * Use the native share sheet first.
     * Fall back to blob download if unavailable.
     */
    const shared = await tryNativeShare()

    if (!shared) {
      openBlob()
    }
  } else {
    doc.save(fileName)
  }
}