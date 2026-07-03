// src/modules/workout/components/CardioLogSection.jsx
// Cardio loggen op de client workout-pagina (app_issue c684fe0a).
// Knop onder de WeekSchedule → modal om een cardio-sessie te loggen
// (type + duur + optioneel afstand). Toont de sessies van deze week.
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Plus, X, Footprints, Trash2 } from 'lucide-react'

const GOLD = '#FFD700'

// Veelgebruikte cardio-types als snelkeuze; vrij typen kan ook.
const CARDIO_PRESETS = ['Wandelen', 'Hardlopen', 'Fietsen', 'Zwemmen', 'Roeien', 'Crosstrainer', 'HIIT']

// Maandag als startdag van de week (NL-conventie).
function startOfWeekISO() {
  const d = new Date()
  const day = (d.getDay() + 6) % 7 // 0 = maandag
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  const y = d.getFullYear(), mo = String(d.getMonth() + 1).padStart(2, '0'), da = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${da}`
}

export default function CardioLogSection({ client, db, isMobile }) {
  const m = isMobile
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [type, setType] = useState('')
  const [duration, setDuration] = useState('')
  const [distance, setDistance] = useState('')
  const [steps, setSteps] = useState('')
  const [notes, setNotes] = useState('')

  // Stappen-veld alleen tonen bij wandelen.
  const isWalking = type.trim().toLowerCase() === 'wandelen'

  const loadLogs = async () => {
    if (!client?.id || !db?.supabase) { setLoading(false); return }
    const { data } = await db.supabase
      .from('cardio_logs')
      .select('*')
      .eq('client_id', client.id)
      .gte('logged_date', startOfWeekISO())
      .order('logged_date', { ascending: false })
      .order('created_at', { ascending: false })
    setLogs(data || [])
    setLoading(false)
  }

  useEffect(() => { loadLogs() }, [client?.id])

  const resetForm = () => { setType(''); setDuration(''); setDistance(''); setSteps(''); setNotes(''); setError(null) }

  const handleSave = async () => {
    if (!type.trim()) { setError('Kies of typ een soort cardio'); return }
    setSaving(true); setError(null)
    try {
      const { error: insErr } = await db.supabase.from('cardio_logs').insert([{
        client_id: client.id,
        cardio_type: type.trim(),
        duration_minutes: duration ? parseInt(duration) : null,
        distance_km: distance ? parseFloat(distance) : null,
        steps: (isWalking && steps) ? parseInt(steps) : null,
        notes: notes.trim() || null,
      }])
      if (insErr) throw insErr
      resetForm(); setShowModal(false); await loadLogs()
    } catch (err) { console.error('Cardio log save failed:', err); setError(err.message) }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    const prev = logs
    setLogs(logs.filter(l => l.id !== id))
    const { error: delErr } = await db.supabase.from('cardio_logs').delete().eq('id', id)
    if (delErr) { console.error('Delete failed:', delErr); setLogs(prev) }
  }

  const fmtDate = (d) => {
    try {
      return new Date(d + 'T00:00:00').toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })
    } catch { return d }
  }

  const section = (
    <div style={{ padding: m ? '0 1rem' : '0 1.5rem', marginTop: m ? '2.5rem' : '3rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Footprints size={m ? 16 : 18} color={GOLD} />
          <span style={{ fontSize: m ? '0.8rem' : '0.9rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>Cardio deze week</span>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true) }} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: m ? '0.4rem 0.7rem' : '0.5rem 0.85rem', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 8, color: GOLD, fontSize: m ? '0.72rem' : '0.78rem', fontWeight: 700, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit' }}>
          <Plus size={14} /> Cardio toevoegen
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)' }}>Laden...</div>
      ) : logs.length === 0 ? (
        <div style={{ padding: m ? '1rem' : '1.25rem', textAlign: 'center', fontSize: m ? '0.72rem' : '0.78rem', color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 10 }}>
          Nog geen cardio gelogd deze week — voeg je eerste sessie toe.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {logs.map(log => (
            <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: m ? '0.6rem 0.75rem' : '0.7rem 0.9rem', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: m ? '0.85rem' : '0.9rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>{log.cardio_type}</div>
                <div style={{ fontSize: m ? '0.62rem' : '0.66rem', color: 'rgba(255,255,255,0.4)', marginTop: 2, fontWeight: 600 }}>
                  {fmtDate(log.logged_date)}
                  {log.duration_minutes ? ` · ${log.duration_minutes} min` : ''}
                  {log.distance_km ? ` · ${log.distance_km} km` : ''}
                  {log.steps ? ` · ${log.steps.toLocaleString('nl-NL')} stappen` : ''}
                </div>
                {log.notes && <div style={{ fontSize: m ? '0.62rem' : '0.66rem', color: 'rgba(255,255,255,0.3)', marginTop: 2, fontStyle: 'italic' }}>{log.notes}</div>}
              </div>
              <button onClick={() => handleDelete(log.id)} aria-label="Verwijder" style={{ width: 32, height: 32, flexShrink: 0, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 7, color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const modal = showModal ? createPortal(
    <div onClick={() => !saving && setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 10000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#0a0a0a', borderRadius: m ? '16px 16px 0 0' : '14px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.08)', ...(m ? {} : { margin: 'auto' }) }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: m ? '0.85rem 1rem' : '1rem 1.15rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: m ? '0.95rem' : '1.05rem', fontWeight: 800, color: '#fff' }}>Cardio loggen</span>
          <button onClick={() => setShowModal(false)} style={{ width: 32, height: 32, borderRadius: 7, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
        </div>

        <div style={{ padding: m ? '0.85rem 1rem' : '1rem 1.15rem' }}>
          {/* Type presets */}
          <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>Soort cardio</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.5rem' }}>
            {CARDIO_PRESETS.map(p => {
              const active = type === p
              return (
                <button key={p} onClick={() => setType(p)} style={{ padding: '0.35rem 0.65rem', background: active ? 'rgba(255,215,0,0.14)' : 'rgba(255,255,255,0.04)', border: `1px solid ${active ? 'rgba(255,215,0,0.45)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 7, color: active ? GOLD : 'rgba(255,255,255,0.6)', fontSize: m ? '0.72rem' : '0.78rem', fontWeight: 700, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit' }}>{p}</button>
              )
            })}
          </div>
          <input value={type} onChange={e => setType(e.target.value)} placeholder="…of typ zelf een soort" style={{ width: '100%', boxSizing: 'border-box', padding: '0.55rem 0.7rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: m ? '0.8rem' : '0.85rem', fontFamily: 'inherit', outline: 'none', marginBottom: '0.75rem' }} />

          {/* Duur + afstand */}
          <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.75rem' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>Duur (min)</div>
              <input type="number" inputMode="numeric" value={duration} onChange={e => setDuration(e.target.value)} placeholder="bv. 30" style={{ width: '100%', boxSizing: 'border-box', padding: '0.55rem 0.7rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: m ? '0.8rem' : '0.85rem', fontFamily: 'inherit', outline: 'none' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>Afstand (km)</div>
              <input type="number" inputMode="decimal" value={distance} onChange={e => setDistance(e.target.value)} placeholder="optioneel" style={{ width: '100%', boxSizing: 'border-box', padding: '0.55rem 0.7rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: m ? '0.8rem' : '0.85rem', fontFamily: 'inherit', outline: 'none' }} />
            </div>
          </div>

          {/* Aantal stappen — alleen bij wandelen */}
          {isWalking && (
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>Aantal stappen</div>
              <input type="number" inputMode="numeric" value={steps} onChange={e => setSteps(e.target.value)} placeholder="bv. 8000" style={{ width: '100%', boxSizing: 'border-box', padding: '0.55rem 0.7rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: m ? '0.8rem' : '0.85rem', fontFamily: 'inherit', outline: 'none' }} />
            </div>
          )}

          {/* Notitie */}
          <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>Notitie (optioneel)</div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="bv. rustig tempo, voelde goed" style={{ width: '100%', boxSizing: 'border-box', padding: '0.55rem 0.7rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: m ? '0.78rem' : '0.82rem', fontFamily: 'inherit', outline: 'none', resize: 'vertical', marginBottom: '0.75rem' }} />

          {error && <div style={{ fontSize: '0.68rem', color: '#ef4444', marginBottom: '0.6rem', padding: '0.4rem 0.6rem', background: 'rgba(239,68,68,0.08)', borderRadius: 6 }}>{error}</div>}

          <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: '0.7rem', background: saving ? 'rgba(255,215,0,0.3)' : GOLD, border: 'none', borderRadius: 9, color: '#000', fontSize: m ? '0.85rem' : '0.9rem', fontWeight: 800, cursor: saving ? 'default' : 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit' }}>
            {saving ? 'Opslaan…' : 'Cardio opslaan'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null

  return <>{section}{modal}</>
}
