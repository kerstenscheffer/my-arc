// src/modules/workout/components/CardioLogSection.jsx
//
// Cardio-sectie op de workout-pagina van de klant. Twee dingen bij elkaar:
// wat de coach aan cardio heeft klaargezet (client_cardio_plan) en wat de
// klant zelf logt (cardio_logs). Per plan-regel staat de stand van deze week,
// zodat je in één oogopslag ziet wat er nog moet gebeuren.
//
// Cardio hing eerder aan een trainingsdag in het schema; daardoor bestond het
// alleen op dagen dat er ook getraind werd. Nu staat het los.
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Plus, X, Footprints, Trash2, Check } from 'lucide-react'
import CardioService, { weekStartISO, normaliseerSoort } from '../services/CardioService'
import { cardioFoto } from '../utils/workoutFoto'

// Veelgebruikte cardio-types als snelkeuze; vrij typen kan ook.
const CARDIO_PRESETS = ['Wandelen', 'Hardlopen', 'Fietsen', 'Zwemmen', 'Roeien', 'Crosstrainer', 'HIIT']

export default function CardioLogSection({ client, db, isMobile }) {
  const m = isMobile
  const [logs, setLogs] = useState([])
  const [plan, setPlan] = useState([])
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
  const isWalking = normaliseerSoort(type) === 'wandelen'

  const laadAlles = async () => {
    if (!client?.id || !db?.supabase) { setLoading(false); return }
    const [planData, logData] = await Promise.all([
      CardioService.getPlan(client.id, db),
      CardioService.getLogs(client.id, weekStartISO(), db),
    ])
    setPlan(planData)
    setLogs(logData)
    setLoading(false)
  }

  useEffect(() => { laadAlles() }, [client?.id])

  const resetForm = () => { setType(''); setDuration(''); setDistance(''); setSteps(''); setNotes(''); setError(null) }

  // Loggen vanaf een plan-regel: de velden staan al goed, je hoeft alleen te
  // bevestigen of bij te stellen.
  const openVoorPlan = (item) => {
    setType(item.cardio_type || '')
    setDuration(item.duration_minutes ? String(item.duration_minutes) : '')
    setDistance(item.distance_km ? String(item.distance_km) : '')
    setSteps(item.steps ? String(item.steps) : '')
    setNotes('')
    setError(null)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!type.trim()) { setError('Kies of typ een soort cardio'); return }
    setSaving(true); setError(null)
    try {
      await CardioService.addLog({
        client_id: client.id,
        cardio_type: type,
        duration_minutes: duration,
        distance_km: distance,
        steps: isWalking ? steps : null,
        notes,
      }, db)
      resetForm(); setShowModal(false); await laadAlles()
    } catch (err) { setError(err.message) }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    const prev = logs
    setLogs(logs.filter(l => l.id !== id))
    const gelukt = await CardioService.deleteLog(id, db)
    if (!gelukt) setLogs(prev)
  }

  const fmtDate = (d) => {
    try {
      return new Date(d + 'T00:00:00').toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })
    } catch { return d }
  }

  const doel = (item) => [
    item.duration_minutes ? `${item.duration_minutes} min` : null,
    item.distance_km ? `${item.distance_km} km` : null,
    item.steps ? `${item.steps.toLocaleString('nl-NL')} stappen` : null,
  ].filter(Boolean).join(' · ')

  // Kop in dezelfde vorm als "Vandaags workout" bovenaan de pagina: foto die
  // onderin dood loopt in het zwart, met de titel eroverheen.
  const kop = (
    <div style={{ position: 'relative', width: '100%', height: m ? 150 : 190, marginTop: m ? '1.75rem' : '2.25rem' }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${cardioFoto()})`,
        backgroundSize: 'cover', backgroundPosition: 'center 35%',
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(180deg, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0) 30%, rgba(10,10,10,0.78) 68%, #0a0a0a 100%)',
      }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: m ? 8 : 12,
        padding: m ? '0 1rem' : '0 1.5rem',
        fontSize: m ? '1.7rem' : '2.4rem', fontWeight: 900, color: '#fff',
        letterSpacing: '-0.03em', lineHeight: 1.05,
        textShadow: '0 2px 12px rgba(0,0,0,0.6)',
      }}>
        Cardio
      </div>
    </div>
  )

  const section = (
    <div style={{ padding: m ? '0 0.75rem' : '0 1rem', marginBottom: m ? '0.9rem' : '1.1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Footprints size={m ? 14 : 16} color="rgba(255,255,255,0.45)" />
          <span style={{ fontSize: m ? '0.62rem' : '0.66rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Deze week</span>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true) }} style={{
          display: 'flex', alignItems: 'center', gap: '0.3rem',
          padding: m ? '0.4rem 0.7rem' : '0.5rem 0.85rem',
          background: '#fff', border: 'none', borderRadius: 8, color: '#0a0a0a',
          fontSize: m ? '0.72rem' : '0.78rem', fontWeight: 900, cursor: 'pointer',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit',
        }}>
          <Plus size={14} strokeWidth={2.8} /> Loggen
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)' }}>Laden...</div>
      ) : (
        <>
          {/* ── Van je coach: wat er deze week klaarstaat ── */}
          {plan.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.9rem' }}>
              {plan.map(item => {
                const gedaan = CardioService.telVoorPlan(item, logs)
                const target = item.times_per_week || 1
                const klaar = gedaan >= target
                const pct = Math.min(100, Math.round((gedaan / target) * 100))
                return (
                  <div key={item.id} style={{
                    position: 'relative', overflow: 'hidden',
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${klaar ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 10,
                    padding: m ? '0.65rem 0.75rem' : '0.75rem 0.9rem',
                    display: 'flex', alignItems: 'center', gap: '0.7rem',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
                        <span style={{ fontSize: m ? '0.92rem' : '1rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em' }}>
                          {item.cardio_type}
                        </span>
                        <span style={{ fontSize: m ? '0.7rem' : '0.75rem', fontWeight: 800, color: klaar ? '#10b981' : 'rgba(255,255,255,0.5)' }}>
                          {gedaan}/{target}
                        </span>
                      </div>
                      {doel(item) && (
                        <div style={{ fontSize: m ? '0.66rem' : '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                          {doel(item)}
                        </div>
                      )}
                      {item.notes && (
                        <div style={{ fontSize: m ? '0.64rem' : '0.68rem', color: 'rgba(255,255,255,0.32)', marginTop: 2, fontStyle: 'italic' }}>
                          {item.notes}
                        </div>
                      )}
                    </div>
                    <button onClick={() => openVoorPlan(item)} aria-label={`${item.cardio_type} loggen`}
                      style={{
                        flexShrink: 0, padding: m ? '0.4rem 0.7rem' : '0.45rem 0.8rem',
                        borderRadius: 8, border: klaar ? '1px solid rgba(16,185,129,0.45)' : '1.5px solid rgba(255,255,255,0.3)',
                        background: 'transparent', color: klaar ? '#10b981' : '#fff',
                        fontSize: m ? '0.7rem' : '0.75rem', fontWeight: 900, fontFamily: 'inherit',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                      }}>
                      {klaar ? <><Check size={13} strokeWidth={3} /> Klaar</> : <><Plus size={13} strokeWidth={3} /> Log</>}
                    </button>
                    {/* Voortgangsstreep onderaan de kaart */}
                    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, background: 'rgba(255,255,255,0.06)' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: klaar ? '#10b981' : '#fff', transition: 'width 0.3s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Wat je deze week gelogd hebt ── */}
          <div style={{
            fontSize: m ? '0.6rem' : '0.65rem', fontWeight: 800,
            color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase',
            letterSpacing: '0.1em', marginBottom: '0.4rem',
          }}>
            Gelogd
          </div>

          {logs.length === 0 ? (
            <div style={{ padding: m ? '1rem' : '1.25rem', textAlign: 'center', fontSize: m ? '0.72rem' : '0.78rem', color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 10 }}>
              {plan.length > 0
                ? 'Nog niks gelogd deze week — tik op Log bij je cardio hierboven.'
                : 'Nog geen cardio gelogd deze week — voeg je eerste sessie toe.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {logs.map(log => (
                <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: m ? '0.6rem 0.75rem' : '0.7rem 0.9rem', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: m ? '0.85rem' : '0.9rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>{log.cardio_type}</div>
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
        </>
      )}
    </div>
  )

  const modal = showModal ? createPortal(
    <div onClick={() => !saving && setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 10000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#0a0a0a', borderRadius: m ? '16px 16px 0 0' : '14px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.08)', ...(m ? {} : { margin: 'auto' }) }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: m ? '0.85rem 1rem' : '1rem 1.15rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: m ? '0.95rem' : '1.05rem', fontWeight: 900, color: '#fff' }}>Cardio loggen</span>
          <button onClick={() => setShowModal(false)} style={{ width: 32, height: 32, borderRadius: 7, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
        </div>

        <div style={{ padding: m ? '0.85rem 1rem' : '1rem 1.15rem' }}>
          {/* Type presets — soorten uit jouw plan staan vooraan */}
          <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>Soort cardio</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.5rem' }}>
            {[...plan.map(p => p.cardio_type), ...CARDIO_PRESETS]
              .filter((v, i, arr) => v && arr.findIndex(x => normaliseerSoort(x) === normaliseerSoort(v)) === i)
              .map(p => {
                const active = normaliseerSoort(type) === normaliseerSoort(p)
                return (
                  <button key={p} onClick={() => setType(p)} style={{ padding: '0.35rem 0.65rem', background: active ? '#fff' : 'rgba(255,255,255,0.04)', border: `1px solid ${active ? '#fff' : 'rgba(255,255,255,0.1)'}`, borderRadius: 7, color: active ? '#0a0a0a' : 'rgba(255,255,255,0.6)', fontSize: m ? '0.72rem' : '0.78rem', fontWeight: 800, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit' }}>{p}</button>
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

          <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: '0.7rem', background: saving ? 'rgba(255,255,255,0.4)' : '#fff', border: 'none', borderRadius: 9, color: '#0a0a0a', fontSize: m ? '0.85rem' : '0.9rem', fontWeight: 900, cursor: saving ? 'default' : 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit' }}>
            {saving ? 'Opslaan…' : 'Cardio opslaan'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null

  return <>{kop}{section}{modal}</>
}
