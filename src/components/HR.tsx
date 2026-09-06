import { useState } from 'react'
import { useLang } from '@/i18n'
import { Plus, Search, Mail, Phone, Pencil, Trash2 } from 'lucide-react'
import FloatingModal, { FormInput, FormSelect, FormRow } from './FloatingModal'
import { useApp, type Employee } from '../context/AppContext'

const DEPTS = ['All', 'Management', 'Finance', 'Warehouse', 'Sales', 'Procurement', 'Production', 'HR']
const DEPT_OPTIONS = ['Management', 'Finance', 'Warehouse', 'Sales', 'Procurement', 'Production', 'HR']
const STATUS_OPTIONS = ['Active', 'Inactive', 'On Leave']

const DEPT_COLORS: Record<string, string> = {
  Management: '#6366F1', Finance: '#3D7FFF', Warehouse: '#F59E0B',
  Sales: '#22C55E', Procurement: '#EC4899', Production: '#EF4444', HR: '#8B5CF6',
}

function EditEmpModal({ emp, onClose, onSave }: { emp: Employee; onClose: () => void; onSave: (e: Employee) => void }) {
  const [name, setName]   = useState(emp.name)
  const [email, setEmail] = useState(emp.email)
  const [phone, setPhone] = useState(emp.phone)
  const [dept, setDept]   = useState(emp.dept)
  const [role, setRole]   = useState(emp.role)
  const [status, setStatus] = useState(emp.status)
  const [joined, setJoined] = useState(emp.joined)
  return (
    <FloatingModal title="Edit Employee" subtitle={`Editing: ${emp.name}`} onClose={onClose}
      footer={<>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={() => onSave({ ...emp, name, email, phone, dept, role, status, joined })}>Save Changes</button>
      </>}
    >
      <FormInput label="Full Name" value={name} onChange={setName} />
      <FormRow>
        <FormInput label="Email" type="email" value={email} onChange={setEmail} />
        <FormInput label="Phone" type="tel" value={phone} onChange={setPhone} />
      </FormRow>
      <FormRow>
        <FormSelect label="Department" options={DEPT_OPTIONS} value={dept} onChange={setDept} />
        <FormInput label="Role / Position" value={role} onChange={setRole} />
      </FormRow>
      <FormRow>
        <FormSelect label="Status" options={STATUS_OPTIONS} value={status} onChange={setStatus} />
        <FormInput label="Join Date" type="date" value={joined} onChange={setJoined} />
      </FormRow>
    </FloatingModal>
  )
}

export default function HR() {
  const { t } = useLang()
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useApp()
  const [search, setSearch] = useState('')
  const [dept, setDept] = useState('All')
  const [showEmpModal, setShowEmpModal] = useState(false)
  const [editEmp, setEditEmp] = useState<Employee | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)

  const [fName, setFName] = useState('')
  const [fEmail, setFEmail] = useState('')
  const [fPhone, setFPhone] = useState('')
  const [fDept, setFDept] = useState('Sales')
  const [fRole, setFRole] = useState('')
  const [fJoined, setFJoined] = useState(new Date().toISOString().slice(0, 10))

  const handleAdd = () => {
    if (!fName.trim()) return
    addEmployee({
      id: `EMP-${String(Date.now()).slice(-5)}`,
      name: fName.trim(), dept: fDept, role: fRole || 'Staff',
      email: fEmail, phone: fPhone, status: 'Active', joined: fJoined,
    })
    setShowEmpModal(false)
    setFName(''); setFEmail(''); setFPhone(''); setFRole(''); setFDept('Sales')
    setFJoined(new Date().toISOString().slice(0, 10))
  }

  const filtered = employees.filter(e =>
    (dept === 'All' || e.dept === dept) &&
    (e.name.toLowerCase().includes(search.toLowerCase()) || e.dept.toLowerCase().includes(search.toLowerCase()))
  )

  const initials = (name: string) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="p-6 space-y-5 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{t("hr.title")}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{t("hr.subtitle")}</p>
        </div>
        <button onClick={() => setShowEmpModal(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white" style={{ background: 'var(--primary)' }}>
          <Plus size={14} /> Add Employee
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Employees', value: employees.length },
          { label: 'Active', value: employees.filter(e => e.status === 'Active').length },
          { label: 'On Leave', value: employees.filter(e => e.status === 'On Leave').length },
          { label: 'Departments', value: new Set(employees.map(e => e.dept)).size || 0 },
        ].map(s => (
          <div key={s.label} className="rounded-xl px-4 py-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="text-xl font-bold text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--secondary)', border: '1px solid var(--border)' }}>
          <Search size={13} style={{ color: 'var(--muted-foreground)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employees…" className="bg-transparent text-sm outline-none text-white w-40" style={{ fontFamily: 'inherit' }} />
        </div>
        <div className="flex gap-1 flex-wrap">
          {DEPTS.map(d => (
            <button key={d} onClick={() => setDept(d)} className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors" style={{ background: dept === d ? 'var(--primary)' : 'var(--secondary)', color: dept === d ? 'white' : 'var(--secondary-foreground)', border: '1px solid var(--border)' }}>
              {d}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted-foreground)' }}>
          <div style={{ fontSize: 13 }}>No employees found. Add your first team member.</div>
        </div>
      )}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {filtered.map(emp => (
          <div key={emp.id} className="rounded-xl p-4 flex items-center gap-4 transition-colors" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(61,127,255,0.3)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0" style={{ background: DEPT_COLORS[emp.dept] ?? 'var(--accent)' }}>
              {initials(emp.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">{emp.name}</span>
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: emp.status === 'Active' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', color: emp.status === 'Active' ? 'var(--success)' : 'var(--warning)' }}>
                  {emp.status}
                </span>
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{emp.role} · {emp.dept}</div>
              <div className="flex gap-3 mt-2 text-xs" style={{ color: 'var(--secondary-foreground)' }}>
                <span className="flex items-center gap-1"><Mail size={10} />{emp.email || '—'}</span>
                <span className="flex items-center gap-1"><Phone size={10} />{emp.phone || '—'}</span>
              </div>
            </div>
            <div className="text-xs text-right flex-shrink-0 flex flex-col gap-2 items-end">
              <div style={{ color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace' }}>{emp.id}</div>
              <div style={{ color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace' }}>{emp.joined}</div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button onClick={() => setEditEmp(emp)} style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '5px', background: 'rgba(61,127,255,0.1)', color: 'var(--primary)', border: '1px solid rgba(61,127,255,0.25)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Pencil size={9} /> Edit
                </button>
                <button onClick={() => setDeleteTarget(emp)} style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '5px', background: 'rgba(239,68,68,0.08)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Trash2 size={9} /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showEmpModal && (
        <FloatingModal title="Add Employee" subtitle="Register a new team member" onClose={() => setShowEmpModal(false)}
          footer={<>
            <button onClick={() => setShowEmpModal(false)} className="btn-ghost px-4 py-2 text-sm rounded-lg">Cancel</button>
            <button onClick={handleAdd} className="px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ background: 'var(--primary)' }}>Add Employee</button>
          </>}
        >
          <FormInput label="Full Name" placeholder="e.g. Jane Wambui" value={fName} onChange={setFName} />
          <FormRow>
            <FormInput label="Email" type="email" placeholder="jane@fabegon.com" value={fEmail} onChange={setFEmail} />
            <FormInput label="Phone" type="tel" placeholder="+255 700 000 000" value={fPhone} onChange={setFPhone} />
          </FormRow>
          <FormRow>
            <FormSelect label="Department" options={DEPT_OPTIONS} value={fDept} onChange={setFDept} />
            <FormInput label="Role / Position" placeholder="e.g. Sales Representative" value={fRole} onChange={setFRole} />
          </FormRow>
          <FormInput label="Join Date" type="date" value={fJoined} onChange={setFJoined} />
        </FloatingModal>
      )}

      {editEmp && (
        <EditEmpModal emp={editEmp} onClose={() => setEditEmp(null)} onSave={e => { updateEmployee(e); setEditEmp(null) }} />
      )}

      {deleteTarget && (
        <FloatingModal title="Delete Employee" subtitle="This action cannot be undone" onClose={() => setDeleteTarget(null)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="btn btn-primary" style={{ background: 'var(--danger)', boxShadow: 'none' }} onClick={() => { deleteEmployee(deleteTarget.id); setDeleteTarget(null) }}>Delete</button>
          </>}
        >
          <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--danger)' }}>⚠ Confirm deletion</div>
            <div style={{ fontSize: '12px', color: 'var(--secondary-foreground)', marginTop: '4px' }}>
              Remove <strong>{deleteTarget.name}</strong> ({deleteTarget.dept} · {deleteTarget.role}) from the system? All records will be permanently deleted.
            </div>
          </div>
        </FloatingModal>
      )}
    </div>
  )
}
