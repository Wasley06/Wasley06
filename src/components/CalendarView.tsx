import { ChevronLeft, ChevronRight, Plus, X, Trash2, BookOpen } from 'lucide-react'
import { useLang } from '@/i18n'
import { useState } from 'react'
import FloatingModal, { FormInput, FormSelect, FormRow } from './FloatingModal'
import { useApp } from '../context/AppContext'

const TYPE_COLORS: Record<string, string> = {
  production: '#3D7FFF', procurement: '#F59E0B', sales: '#22C55E',
  meeting: '#6366F1', hr: '#EC4899', finance: '#EF4444', other: '#94A3B8',
}

const DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function CalendarView() {
  const { t } = useLang()
  const { scheduleEvents, addScheduleEvent, deleteScheduleEvent, journalEntries } = useApp()

  const _now = new Date()
  const [year,  setYear]  = useState(_now.getFullYear())
  const [month, setMonth] = useState(_now.getMonth())
  const [showAddModal, setShowAddModal] = useState(false)
  const [dayPopup, setDayPopup] = useState<string | null>(null)

  /* Add-schedule form state */
  const [fTitle, setFTitle] = useState('')
  const [fType,  setFType]  = useState('meeting')
  const [fDate,  setFDate]  = useState('')
  const [fTime,  setFTime]  = useState('')
  const [fNotes, setFNotes] = useState('')

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  const eventsForDate = (dateKey: string) => scheduleEvents.filter(e => e.date === dateKey)

  const handleAddSchedule = () => {
    if (!fTitle.trim() || !fDate) return
    addScheduleEvent({
      id: `SCH-${Date.now().toString(36).toUpperCase()}`,
      date: fDate, title: fTitle.trim(), type: fType,
      time: fTime || undefined, notes: fNotes || undefined,
    })
    setFTitle(''); setFType('meeting'); setFDate(''); setFTime(''); setFNotes('')
    setShowAddModal(false)
  }

  const popupEvents = dayPopup ? eventsForDate(dayPopup) : []
  const popupJournal = dayPopup ? journalEntries.filter(j => j.date === dayPopup) : []

  return (
    <div className="p-6 space-y-5 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>{t("cal.title")}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{t("cal.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prev} className="p-1.5 rounded-lg transition-colors" style={{ background: 'var(--secondary)', border: '1px solid var(--border)', color: 'var(--foreground)', cursor: 'pointer' }}>
            <ChevronLeft size={14} />
          </button>
          <span className="text-sm font-semibold px-2" style={{ color: 'var(--foreground)' }}>{MONTHS[month]} {year}</span>
          <button onClick={next} className="p-1.5 rounded-lg transition-colors" style={{ background: 'var(--secondary)', border: '1px solid var(--border)', color: 'var(--foreground)', cursor: 'pointer' }}>
            <ChevronRight size={14} />
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary" style={{ marginLeft: '8px' }}>
            <Plus size={14} /> Add Schedule
          </button>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="grid grid-cols-7" style={{ borderBottom: '1px solid var(--border)' }}>
          {DAYS.map(d => (
            <div key={d} className="px-2 py-3 text-center text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const key = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : ''
            const dayEvents = day ? eventsForDate(key) : []
            const _t = new Date(); const isToday = day === _t.getDate() && month === _t.getMonth() && year === _t.getFullYear()

            return (
              <div
                key={i}
                onClick={() => day && setDayPopup(key)}
                className="min-h-[80px] p-2 transition-colors"
                style={{
                  borderRight: (i + 1) % 7 !== 0 ? '1px solid var(--border)' : 'none',
                  borderBottom: i < cells.length - 7 ? '1px solid var(--border)' : 'none',
                  background: isToday ? 'rgba(46,125,50,0.06)' : 'transparent',
                  cursor: day ? 'pointer' : 'default',
                }}
                onMouseEnter={e => { if (day) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                onMouseLeave={e => { e.currentTarget.style.background = isToday ? 'rgba(46,125,50,0.06)' : 'transparent' }}
              >
                {day && (
                  <>
                    <span className="text-xs font-semibold inline-flex items-center justify-center w-6 h-6 rounded-full" style={{ background: isToday ? 'var(--primary)' : 'transparent', color: isToday ? 'white' : 'var(--foreground)' }}>
                      {day}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {dayEvents.slice(0, 2).map((ev, ei) => (
                        <div key={ei} className="text-xs px-1 py-0.5 rounded truncate" style={{ background: (TYPE_COLORS[ev.type] ?? '#94A3B8') + '20', color: TYPE_COLORS[ev.type] ?? '#94A3B8', fontSize: '10px' }}>
                          {ev.time && <span style={{ opacity: 0.7 }}>{ev.time} </span>}{ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs" style={{ color: 'var(--muted-foreground)', fontSize: '10px' }}>+{dayEvents.length - 2} more</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1.5 text-xs capitalize" style={{ color: 'var(--secondary-foreground)' }}>
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />{type}
          </span>
        ))}
      </div>

      {/* Day popup */}
      {dayPopup && (
        <div className="modal-overlay" style={{ alignItems: 'flex-start', paddingTop: '80px' }} onClick={() => setDayPopup(null)}>
          <div className="island animate-modal" style={{ width: '380px', padding: '0', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--glass-border)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--foreground)' }}>{dayPopup}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '2px' }}>
                  {popupEvents.length} event{popupEvents.length !== 1 ? 's' : ''} · {popupJournal.length} journal entr{popupJournal.length !== 1 ? 'ies' : 'y'}
                </div>
              </div>
              <button onClick={() => setDayPopup(null)} style={{ padding: '4px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}><X size={14} /></button>
            </div>
            <div style={{ padding: '12px 20px', maxHeight: '420px', overflowY: 'auto' }}>
              {popupEvents.length === 0 && popupJournal.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '13px', padding: '24px 0' }}>{t('cal.noEvents')}</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {popupEvents.map(ev => (
                    <div key={ev.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '10px 12px', borderRadius: '8px', background: 'var(--secondary)', borderLeft: `3px solid ${TYPE_COLORS[ev.type] ?? '#94A3B8'}` }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--foreground)' }}>{ev.title}</div>
                        {ev.time  && <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '2px' }}>🕐 {ev.time}</div>}
                        {ev.notes && <div style={{ fontSize: '11px', color: 'var(--secondary-foreground)', marginTop: '4px' }}>{ev.notes}</div>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '999px', background: (TYPE_COLORS[ev.type] ?? '#94A3B8') + '20', color: TYPE_COLORS[ev.type] ?? '#94A3B8', fontWeight: 600, textTransform: 'capitalize' }}>{ev.type}</span>
                        <button onClick={() => deleteScheduleEvent(ev.id)} style={{ padding: '3px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)', display: 'flex', alignItems: 'center' }} title="Delete event">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {popupJournal.length > 0 && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 4px 2px', marginTop: '4px', borderTop: '1px solid var(--border)' }}>
                        <BookOpen size={11} style={{ color: 'var(--muted-foreground)' }} />
                        <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Journal Activity ({popupJournal.length})</span>
                      </div>
                      {popupJournal.map(j => (
                        <div key={j.id} style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(61,127,255,0.04)', border: '1px solid rgba(61,127,255,0.12)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--primary)', marginBottom: '2px' }}>{j.ref}</div>
                              <div style={{ fontSize: '11px', color: 'var(--foreground)' }}>{j.description}</div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              {j.credit > 0 && <div style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--success)' }}>+{j.credit.toLocaleString()}</div>}
                              {j.debit  > 0 && <div style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--danger)' }}>-{j.debit.toLocaleString()}</div>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
            <div style={{ padding: '10px 20px 14px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => { setFDate(dayPopup); setShowAddModal(true); setDayPopup(null) }} className="btn btn-primary" style={{ fontSize: '12px', padding: '6px 12px' }}>
                <Plus size={12} /> Add Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Schedule modal */}
      {showAddModal && (
        <FloatingModal
          title="Add Schedule"
          subtitle="Create a new operational event — visible to all users"
          onClose={() => setShowAddModal(false)}
          footer={
            <>
              <button onClick={() => setShowAddModal(false)} className="btn btn-ghost">Cancel</button>
              <button onClick={handleAddSchedule} disabled={!fTitle.trim() || !fDate} className="btn btn-primary" style={{ opacity: (!fTitle.trim() || !fDate) ? 0.6 : 1 }}>
                {t("cal.addSchedule")}
              </button>
            </>
          }
        >
          <FormInput label="Event Title *" placeholder="e.g. Batch B-207 Production" value={fTitle} onChange={setFTitle} />
          <FormRow>
            <FormSelect label="Type" options={['production', 'procurement', 'sales', 'meeting', 'hr', 'finance', 'other']} value={fType} onChange={setFType} />
            <FormInput label="Date *" type="date" value={fDate} onChange={setFDate} />
          </FormRow>
          <FormInput label="Time (optional)" type="time" value={fTime} onChange={setFTime} />
          <FormInput label="Notes (optional)" placeholder="Additional details" value={fNotes} onChange={setFNotes} />
        </FloatingModal>
      )}
    </div>
  )
}
