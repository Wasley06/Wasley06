import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface Props {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  width?: number
  footer?: ReactNode
}

export default function FloatingModal({ title, subtitle, onClose, children, width = 520, footer }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    /* prevent body scroll while modal open */
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return createPortal(
    <div
      className="modal-overlay"
      style={{ alignItems: 'flex-start', overflowY: 'auto', paddingTop: '40px', paddingBottom: '40px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="animate-modal island"
        style={{
          width: '100%',
          maxWidth: `${width}px`,
          margin: 'auto',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 80px)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--foreground)' }}>{title}</h3>
            {subtitle && <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--muted-foreground)' }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px', cursor: 'pointer', color: 'var(--foreground)', display: 'flex', flexShrink: 0, marginLeft: '12px' }}>
            <X size={15} />
          </button>
        </div>

        {/* Body — scrolls independently so header + footer always visible */}
        <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            flexShrink: 0,
            background: 'var(--card-2)',
            borderRadius: '0 0 16px 16px',
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--secondary-foreground)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

export function FormInput({ label, type = 'text', placeholder, defaultValue, value, onChange }: {
  label: string; type?: string; placeholder?: string; defaultValue?: string
  value?: string; onChange?: (v: string) => void
}) {
  return (
    <Field label={label}>
      <input
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange ? e => onChange(e.target.value) : undefined}
        className="input-base"
      />
    </Field>
  )
}

export function FormSelect({ label, options, children, value, onChange }: {
  label?: string; options?: string[]; children?: ReactNode
  value?: string; onChange?: (v: string) => void
}) {
  const select = (
    <select className="input-base" style={{ cursor: 'pointer', colorScheme: 'dark' }} value={value} onChange={onChange ? e => onChange(e.target.value) : undefined}>
      {options ? options.map(o => <option key={o}>{o}</option>) : children}
    </select>
  )
  return label ? <Field label={label}>{select}</Field> : select
}

export function FormRow({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
      {children}
    </div>
  )
}
