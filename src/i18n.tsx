import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export type Lang = 'en' | 'sw'

/* ─── Complete translation dictionary ─── */
export const T: Record<Lang, Record<string, string>> = {
  en: {
    /* Navigation */
    'nav.dashboard':   'Executive Dashboard',
    'nav.inventory':   'Inventory & Warehousing',
    'nav.sales':       'Sales Management',
    'nav.finance':     'Finance & Accounting',
    'nav.crm':         'CRM',
    'nav.production':  'Manufacturing & Production',
    'nav.procurement': 'Procurement',
    'nav.reports':     'Reports & Analytics',
    'nav.hr':          'Human Resources',
    'nav.admin':       'Administration',
    'nav.calendar':    'Operational Scheduler',
    'nav.settings':    'Settings',

    /* Company */
    'company': 'Fabegon Industries · Dar es Salaam',

    /* Language labels */
    'lang.en': 'English',
    'lang.sw': 'Kiswahili',

    /* Common actions */
    'action.add':       'Add',
    'action.save':      'Save',
    'action.cancel':    'Cancel',
    'action.delete':    'Delete',
    'action.edit':      'Edit',
    'action.export':    'Export',
    'action.share':     'Share',
    'action.print':     'Print',
    'action.download':  'Download',
    'action.search':    'Search',
    'action.filter':    'Filter',
    'action.close':     'Close',
    'action.view':      'View',
    'action.create':    'Create',
    'action.submit':    'Submit',
    'action.back':      'Back',
    'action.new':       'New',
    'action.restore':   'Restore',
    'action.sync':      'Sync',
    'action.signIn':    'Sign in',
    'action.signOut':   'Sign out',
    'action.signInBtn': 'Sign in →',

    /* Common labels */
    'label.name':        'Name',
    'label.email':       'Email',
    'label.password':    'Password',
    'label.phone':       'Phone',
    'label.address':     'Address',
    'label.date':        'Date',
    'label.status':      'Status',
    'label.total':       'Total',
    'label.quantity':    'Quantity',
    'label.unit':        'Unit',
    'label.price':       'Price',
    'label.category':    'Category',
    'label.notes':       'Notes',
    'label.type':        'Type',
    'label.role':        'Role',
    'label.department':  'Department',
    'label.supplier':    'Supplier',
    'label.customer':    'Customer',
    'label.description': 'Description',
    'label.amount':      'Amount',
    'label.balance':     'Balance',
    'label.reference':   'Reference',
    'label.warehouse':   'Warehouse',
    'label.reorder':     'Reorder Level',
    'label.expiry':      'Expiry Date',
    'label.cost':        'Unit Cost (TZS)',
    'label.payment':     'Payment Type',
    'label.createdBy':   'Created By',
    'label.rep':         'Sales Rep',
    'label.line':        'Production Line',
    'label.buyer':       'Buyer',

    /* Status labels */
    'status.active':      'Active',
    'status.inactive':    'Inactive',
    'status.pending':     'Pending',
    'status.approved':    'Approved',
    'status.cancelled':   'Cancelled',
    'status.completed':   'Completed',
    'status.inProgress':  'In Progress',
    'status.scheduled':   'Scheduled',
    'status.delivered':   'Delivered',
    'status.invoiced':    'Invoiced',
    'status.inStock':     'In Stock',
    'status.lowStock':    'Low Stock',
    'status.outOfStock':  'Out of Stock',
    'status.outstanding': 'Outstanding',
    'status.partial':     'Partial',
    'status.settled':     'Settled',

    /* Dashboard */
    'dash.welcome':       'Welcome back',
    'dash.overview':      'Operations Overview',
    'dash.todayRevenue':  'Today\'s Revenue',
    'dash.activeOrders':  'Active Orders',
    'dash.lowStock':      'Low Stock Items',
    'dash.productionEff': 'Production Efficiency',
    'dash.recentActivity':'Recent Activity',
    'dash.upcoming':      'UPCOMING',
    'dash.noEvents':      'No events recorded',

    /* Inventory */
    'inv.title':       'Inventory & Warehousing',
    'inv.subtitle':    'Stock · Tracking · Movements · Alerts',
    'inv.addItem':     'Add Item',
    'inv.newItem':     'New Inventory Item',
    'inv.itemName':    'Item Name',
    'inv.allItems':    'All Items',
    'inv.exportPdf':   'Export PDF',

    /* Sales */
    'sales.title':      'Sales Management',
    'sales.subtitle':   'Quotation → Order → Invoice → Payment → Delivery',
    'sales.newOrder':   'New Order',
    'sales.createOrder':'Create Sales Order',
    'sales.pipeline':   'Sales Pipeline',
    'sales.allOrders':  'All Orders',
    'sales.viewOrder':  'Order Details',
    'sales.payFull':    'Full Payment',
    'sales.payPartial': 'Partial',
    'sales.payCredit':  'Full Credit',
    'sales.addItem':    'Add Item',

    /* Finance */
    'fin.title':        'Finance & Accounting',
    'fin.subtitle':     'Ledger · Creditors · Cash Flow · Reports',
    'fin.totalRevenue': 'Total Revenue',
    'fin.totalSales':   'Total Sales',
    'fin.totalPurchases':'Total Purchases',
    'fin.totalCredit':  'Total Credit',
    'fin.cashOnHand':   'Cash on Hand',
    'fin.overview':     'Overview',
    'fin.creditors':    'Chart of Creditors',
    'fin.journal':      'Recent Journal Entries',
    'fin.addCreditor':  'Add Creditor',
    'fin.cashflow':     'Cash Flow (TZS)',

    /* CRM */
    'crm.title':      'Customer Relationship Management',
    'crm.subtitle':   'Clients · Follow-ups · Pipeline',
    'crm.addClient':  'Add Client',
    'crm.pipeline':   'Pipeline',
    'crm.list':       'List',
    'crm.totalClients':'Total Clients',
    'crm.wonMonth':   'Won This Month',
    'crm.pipelineVal':'Pipeline Value',
    'crm.avgDeal':    'Avg. Deal Size',

    /* Production */
    'prod.title':    'Manufacturing & Production',
    'prod.subtitle': 'Raw Materials → Processing → Finished Goods',
    'prod.newBatch': 'New Batch',
    'prod.batches':  'Production Batches',
    'prod.bom':      'Bill of Materials',
    'prod.active':   'Active Batches',
    'prod.completedToday':'Completed Today',
    'prod.unitsToday':   'Units Produced Today',
    'prod.scheduled':    'Scheduled',
    'prod.ingredients':  'Ingredients',
    'prod.product':      'Finished Product',
    'prod.plannedUnits': 'Planned Units',

    /* Procurement */
    'proc.title':    'Procurement',
    'proc.subtitle': 'Suppliers · Purchase Requests · Orders · Receiving',
    'proc.newPO':    'New Purchase Order',
    'proc.createPO': 'Create PO',
    'proc.orders':   'Purchase Orders',
    'proc.suppliers':'Suppliers',

    /* HR */
    'hr.title':    'Human Resources',
    'hr.subtitle': 'Staff · Payroll · Attendance · Recruitment',

    /* Reports */
    'rep.title':    'Reports & Analytics',
    'rep.subtitle': 'Business Intelligence · KPIs · Trends',

    /* Admin */
    'adm.title':    'Administration',
    'adm.subtitle': 'Users · Roles · Permissions · System',
    'adm.users':    'Users',
    'adm.roles':    'Roles',
    'adm.perms':    'Permissions',
    'adm.backup':   'Auto Backup',
    'adm.sync':     'System Sync',

    /* Calendar */
    'cal.title':       'Operational Scheduler',
    'cal.subtitle':    'Deliveries · Production · Meetings · Payroll',
    'cal.addSchedule': 'Add Schedule',
    'cal.eventTitle':  'Event Title',
    'cal.noEvents':    'No events on this day',

    /* Settings */
    'set.title':   'Settings',
    'set.profile': 'Profile',
    'set.theme':   'Appearance',
    'set.security':'Security',

    /* Login */
    'login.welcome':     'Welcome back',
    'login.subtitle':    'Sign in to access your workspace',
    'login.username':    'Username',
    'login.password':    'Password',
    'login.forgot':      'Forgot password?',
    'login.signing':     'Signing in…',
    'login.error':       'Invalid username or password.',
    'login.copyright':   '© 2025 Fabegon Industries Ltd · Tanzania',

    /* Notifications */
    'notif.title':    'Notifications',
    'notif.subtitle': 'Latest alerts & updates',
    'notif.markAll':  'Mark all read',

    /* Sync */
    'sync.synced':  'Synced · just now',
    'sync.offline': 'Offline',

    /* Table headers */
    'th.id':         'ID',
    'th.name':       'Name',
    'th.date':       'Date',
    'th.status':     'Status',
    'th.total':      'Total (TZS)',
    'th.actions':    'Actions',
    'th.quantity':   'Qty',
    'th.unitCost':   'Unit Cost',
    'th.warehouse':  'Warehouse',
    'th.category':   'Category',
    'th.expiry':     'Expiry',
    'th.efficiency': 'Efficiency',
  },

  sw: {
    /* Navigation */
    'nav.dashboard':   'Dashibodi ya Utendaji',
    'nav.inventory':   'Hesabu ya Ghala',
    'nav.sales':       'Usimamizi wa Mauzo',
    'nav.finance':     'Fedha na Uhasibu',
    'nav.crm':         'Uhusiano na Wateja',
    'nav.production':  'Uzalishaji',
    'nav.procurement': 'Ununuzi',
    'nav.reports':     'Ripoti na Uchambuzi',
    'nav.hr':          'Rasilimali Watu',
    'nav.admin':       'Utawala',
    'nav.calendar':    'Ratiba ya Uendeshaji',
    'nav.settings':    'Mipangilio',

    /* Company */
    'company': 'Fabegon Industries · Dar es Salaam',

    /* Language labels */
    'lang.en': 'English',
    'lang.sw': 'Kiswahili',

    /* Common actions */
    'action.add':       'Ongeza',
    'action.save':      'Hifadhi',
    'action.cancel':    'Ghairi',
    'action.delete':    'Futa',
    'action.edit':      'Hariri',
    'action.export':    'Hamisha',
    'action.share':     'Shiriki',
    'action.print':     'Chapisha',
    'action.download':  'Pakua',
    'action.search':    'Tafuta',
    'action.filter':    'Chuja',
    'action.close':     'Funga',
    'action.view':      'Angalia',
    'action.create':    'Unda',
    'action.submit':    'Wasilisha',
    'action.back':      'Rudi',
    'action.new':       'Mpya',
    'action.restore':   'Rejesha',
    'action.sync':      'Sawazisha',
    'action.signIn':    'Ingia',
    'action.signOut':   'Toka',
    'action.signInBtn': 'Ingia →',

    /* Common labels */
    'label.name':        'Jina',
    'label.email':       'Barua pepe',
    'label.password':    'Nenosiri',
    'label.phone':       'Simu',
    'label.address':     'Anwani',
    'label.date':        'Tarehe',
    'label.status':      'Hali',
    'label.total':       'Jumla',
    'label.quantity':    'Idadi',
    'label.unit':        'Kiasi',
    'label.price':       'Bei',
    'label.category':    'Aina',
    'label.notes':       'Maelezo',
    'label.type':        'Aina',
    'label.role':        'Nafasi',
    'label.department':  'Idara',
    'label.supplier':    'Msambazaji',
    'label.customer':    'Mteja',
    'label.description': 'Maelezo',
    'label.amount':      'Kiasi',
    'label.balance':     'Salio',
    'label.reference':   'Kumbukumbu',
    'label.warehouse':   'Ghala',
    'label.reorder':     'Kiwango cha Kuagiza',
    'label.expiry':      'Tarehe ya Mwisho',
    'label.cost':        'Gharama ya Kitengo (TZS)',
    'label.payment':     'Aina ya Malipo',
    'label.createdBy':   'Iliyoundwa na',
    'label.rep':         'Mwakilishi wa Mauzo',
    'label.line':        'Mstari wa Uzalishaji',
    'label.buyer':       'Mnunuzi',

    /* Status labels */
    'status.active':      'Inafanya Kazi',
    'status.inactive':    'Haifanyi Kazi',
    'status.pending':     'Inasubiri',
    'status.approved':    'Imeidhinishwa',
    'status.cancelled':   'Imefutwa',
    'status.completed':   'Imekamilika',
    'status.inProgress':  'Inafanyika',
    'status.scheduled':   'Imepangwa',
    'status.delivered':   'Imetolewa',
    'status.invoiced':    'Invoice Imetolewa',
    'status.inStock':     'Ipo Stori',
    'status.lowStock':    'Stori Chache',
    'status.outOfStock':  'Haina Stori',
    'status.outstanding': 'Inadaiwa',
    'status.partial':     'Sehemu',
    'status.settled':     'Imelipwa',

    /* Dashboard */
    'dash.welcome':       'Karibu tena',
    'dash.overview':      'Muhtasari wa Shughuli',
    'dash.todayRevenue':  'Mapato ya Leo',
    'dash.activeOrders':  'Maagizo Yanayoendelea',
    'dash.lowStock':      'Bidhaa za Stori Chache',
    'dash.productionEff': 'Ufanisi wa Uzalishaji',
    'dash.recentActivity':'Shughuli za Hivi Karibuni',
    'dash.upcoming':      'INAKUJA',
    'dash.noEvents':      'Hakuna matukio yaliyorekodiwa',

    /* Inventory */
    'inv.title':       'Hesabu ya Ghala',
    'inv.subtitle':    'Stori · Ufuatiliaji · Harakati · Tahadhari',
    'inv.addItem':     'Ongeza Bidhaa',
    'inv.newItem':     'Bidhaa Mpya ya Ghala',
    'inv.itemName':    'Jina la Bidhaa',
    'inv.allItems':    'Bidhaa Zote',
    'inv.exportPdf':   'Hamisha PDF',

    /* Sales */
    'sales.title':      'Usimamizi wa Mauzo',
    'sales.subtitle':   'Nukuu → Agizo → Invoice → Malipo → Utoaji',
    'sales.newOrder':   'Agizo Jipya',
    'sales.createOrder':'Unda Agizo la Mauzo',
    'sales.pipeline':   'Mfululizo wa Mauzo',
    'sales.allOrders':  'Maagizo Yote',
    'sales.viewOrder':  'Maelezo ya Agizo',
    'sales.payFull':    'Malipo Kamili',
    'sales.payPartial': 'Sehemu',
    'sales.payCredit':  'Mkopo Kamili',
    'sales.addItem':    'Ongeza Bidhaa',

    /* Finance */
    'fin.title':        'Fedha na Uhasibu',
    'fin.subtitle':     'Leja · Wadaiwa · Mtiririko wa Pesa · Ripoti',
    'fin.totalRevenue': 'Jumla ya Mapato',
    'fin.totalSales':   'Jumla ya Mauzo',
    'fin.totalPurchases':'Jumla ya Ununuzi',
    'fin.totalCredit':  'Jumla ya Mkopo',
    'fin.cashOnHand':   'Pesa Mkononi',
    'fin.overview':     'Muhtasari',
    'fin.creditors':    'Orodha ya Wadaiwa',
    'fin.journal':      'Ingizo za Leja za Hivi Karibuni',
    'fin.addCreditor':  'Ongeza Mdaiwa',
    'fin.cashflow':     'Mtiririko wa Pesa (TZS)',

    /* CRM */
    'crm.title':      'Usimamizi wa Uhusiano na Wateja',
    'crm.subtitle':   'Wateja · Ufuatiliaji · Mfululizo',
    'crm.addClient':  'Ongeza Mteja',
    'crm.pipeline':   'Mfululizo',
    'crm.list':       'Orodha',
    'crm.totalClients':'Jumla ya Wateja',
    'crm.wonMonth':   'Zilizoshinda Mwezi Huu',
    'crm.pipelineVal':'Thamani ya Mfululizo',
    'crm.avgDeal':    'Wastani wa Biashara',

    /* Production */
    'prod.title':    'Uzalishaji',
    'prod.subtitle': 'Malighafi → Usindikaji → Bidhaa za Mwisho',
    'prod.newBatch': 'Kundi Jipya',
    'prod.batches':  'Makundi ya Uzalishaji',
    'prod.bom':      'Orodha ya Malighafi',
    'prod.active':   'Makundi Yanayoendelea',
    'prod.completedToday':'Iliyokamilika Leo',
    'prod.unitsToday':   'Vitengo Vilivyozalishwa Leo',
    'prod.scheduled':    'Vilivyopangwa',
    'prod.ingredients':  'Viungo',
    'prod.product':      'Bidhaa ya Mwisho',
    'prod.plannedUnits': 'Vitengo Vilivyopangwa',

    /* Procurement */
    'proc.title':    'Ununuzi',
    'proc.subtitle': 'Wasambazaji · Maombi ya Ununuzi · Maagizo · Mapokezi',
    'proc.newPO':    'Agizo Jipya la Ununuzi',
    'proc.createPO': 'Unda Agizo',
    'proc.orders':   'Maagizo ya Ununuzi',
    'proc.suppliers':'Wasambazaji',

    /* HR */
    'hr.title':    'Rasilimali Watu',
    'hr.subtitle': 'Wafanyakazi · Mishahara · Mahudhurio · Uajiri',

    /* Reports */
    'rep.title':    'Ripoti na Uchambuzi',
    'rep.subtitle': 'Ujuzi wa Biashara · Viashiria · Mwelekeo',

    /* Admin */
    'adm.title':    'Utawala',
    'adm.subtitle': 'Watumiaji · Majukumu · Ruhusa · Mfumo',
    'adm.users':    'Watumiaji',
    'adm.roles':    'Majukumu',
    'adm.perms':    'Ruhusa',
    'adm.backup':   'Hifadhi Otomatiki',
    'adm.sync':     'Ulandanisho wa Mfumo',

    /* Calendar */
    'cal.title':       'Ratiba ya Uendeshaji',
    'cal.subtitle':    'Utoaji · Uzalishaji · Mikutano · Mishahara',
    'cal.addSchedule': 'Ongeza Ratiba',
    'cal.eventTitle':  'Kichwa cha Tukio',
    'cal.noEvents':    'Hakuna matukio siku hii',

    /* Settings */
    'set.title':   'Mipangilio',
    'set.profile': 'Wasifu',
    'set.theme':   'Muonekano',
    'set.security':'Usalama',

    /* Login */
    'login.welcome':     'Karibu tena',
    'login.subtitle':    'Ingia ili ufikiie nafasi yako ya kazi',
    'login.username':    'Jina la mtumiaji',
    'login.password':    'Nenosiri',
    'login.forgot':      'Umesahau nenosiri?',
    'login.signing':     'Inaingia…',
    'login.error':       'Jina la mtumiaji au nenosiri si sahihi.',
    'login.copyright':   '© 2025 Fabegon Industries Ltd · Tanzania',

    /* Notifications */
    'notif.title':    'Arifa',
    'notif.subtitle': 'Tahadhari na masasisho ya hivi karibuni',
    'notif.markAll':  'Weka zote zimesomwa',

    /* Sync */
    'sync.synced':  'Imesawazishwa · sasa hivi',
    'sync.offline': 'Nje ya mtandao',

    /* Table headers */
    'th.id':         'Nambari',
    'th.name':       'Jina',
    'th.date':       'Tarehe',
    'th.status':     'Hali',
    'th.total':      'Jumla (TZS)',
    'th.actions':    'Vitendo',
    'th.quantity':   'Idadi',
    'th.unitCost':   'Gharama/Kitengo',
    'th.warehouse':  'Ghala',
    'th.category':   'Aina',
    'th.expiry':     'Mwisho',
    'th.efficiency': 'Ufanisi',
  },
}

/* ─── Context ─── */
interface LangCtxType { lang: Lang; t: (k: string) => string }
const LangContext = createContext<LangCtxType>({ lang: 'en', t: k => T.en[k] ?? k })

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem('fabegon-lang') as Lang) ?? 'en')

  useEffect(() => { localStorage.setItem('fabegon-lang', lang) }, [lang])

  const t = (k: string) => T[lang][k] ?? T.en[k] ?? k

  return (
    <LangContext.Provider value={{ lang, t }}>
      {/* expose setLang via a custom event so App.tsx can call it without prop drilling */}
      <LangSetterBridge setLang={setLang} />
      {children}
    </LangContext.Provider>
  )
}

/* Bridge to allow App-level lang toggling */
function LangSetterBridge({ setLang }: { setLang: (l: Lang) => void }) {
  useEffect(() => {
    const handler = (e: Event) => {
      const lang = (e as CustomEvent<Lang>).detail
      setLang(lang)
    }
    window.addEventListener('fabegon:setLang', handler)
    return () => window.removeEventListener('fabegon:setLang', handler)
  }, [setLang])
  return null
}

export function useLang() { return useContext(LangContext) }

/* Helper to dispatch lang change from outside the provider */
export function dispatchLang(lang: Lang) {
  window.dispatchEvent(new CustomEvent('fabegon:setLang', { detail: lang }))
}
