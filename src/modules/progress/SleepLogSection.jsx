// src/modules/progress/SleepLogSection.jsx
// Slaaptracking op de tracking-pagina. Patroon: foto-kop + loglijst + logmodal + tipsmodal.
// Zelfde stijl als CardioLogSection op de workout-pagina.
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Moon, Plus, X, Trash2, Lightbulb } from 'lucide-react'

const SLAAP_FOTO = 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=900&h=400&fit=crop&q=80'

const DIEPE_SLAAP_TIPS = [
  'Ga elke dag op dezelfde tijd naar bed én sta op dezelfde tijd op — ook in het weekend.',
  'Houd je slaapkamer koel: 17–19 °C is ideaal voor diepe slaap.',
  'Zorg voor volledige duisternis. Gebruik een slaapmasker of verduisteringsgordijnen.',
  'Geen schermen (telefoon, TV) binnen 45 minuten voor bedtijd — blauw licht remt melatonine.',
  'Magnesium bisglycinaat (200–400 mg) vlak voor het slapen kan diepe slaap verlengen.',
  "Neem 's avonds een warme douche: de afkoeling daarna versnelt het inslapen.",
  'Eet je laatste maaltijd minstens 2–3 uur voor bedtijd voor optimale herstelkwaliteit.',
]

const WAKKER_TIPS = [
  'Stel je wekker zo in dat je opstaat na een volledig slaapcyclus van 90 minuten (bijv. 7,5 u).',
  'Kom zodra je wekker gaat meteen uit bed — snoozeknoppen verstoren je slaapritme.',
  'Ga binnen 30 minuten na het opstaan naar buiten voor daglicht; dit reset je bioritme.',
  'Drink direct na het opstaan 500 ml water om dehydratie na de nacht aan te vullen.',
  'Een korte lichte wandeling of stretching van 5 minuten wekt je systeem sneller wakker dan koffie.',
  'Plan het eerste uur van je dag rustig in: geen e-mail of socials — laat je brein opstarten.',
]

function hhmm(date) {
  try {
    return new Date(date).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

function formatDate(d) {
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })
  } catch { return d }
}

function weekStart() {
  const now = new Date()
  const day = now.getDay() === 0 ? 6 : now.getDay() - 1
  const mon = new Date(now)
  mon.setDate(now.getDate() - day)
  return mon.toISOString().split('T')[0]
}

export default function SleepLogSection({ client, db, isMobile }) {
  const m = isMobile
  const [logs, setLogs] = useState([])
  // Hoe ver je terugkijkt. Deze week is wat je meestal wil zien; alles is voor
  // als je met de klant naar een patroon zoekt ("het gaat altijd mis op
  // zondag").
  const [alles, setAlles] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showTips, setShowTips] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [hours, setHours] = useState('')
  const [struggles, setStruggles] = useState('')
  const [notes, setNotes] = useState('')

  const laad = async () => {
    if (!client?.id || !db?.supabase) { setLoading(false); return }
    const { data } = await db.supabase
      .from('sleep_logs')
      .select('*')
      .eq('client_id', client.id)
      .gte('log_date', alles ? '2000-01-01' : weekStart())
      .order('log_date', { ascending: false })
      .limit(alles ? 90 : 14)
    setLogs(data || [])
    setLoading(false)
  }

  useEffect(() => { laad() }, [client?.id, alles])

  const reset = () => { setHours(''); setStruggles(''); setNotes(''); setError(null) }

  const handleSave = async () => {
    const h = parseFloat(hours)
    if (!hours || isNaN(h) || h <= 0 || h > 24) { setError('Vul een geldig aantal uren in (bijv. 7.5)'); return }
    setSaving(true); setError(null)
    const today = new Date().toISOString().split('T')[0]
    const { error: err } = await db.supabase.from('sleep_logs').insert({
      client_id: client.id,
      log_date: today,
      hours_slept: h,
      struggles: struggles.trim() || null,
      notes: notes.trim() || null,
    })
    if (err) { setError('Opslaan mislukt: ' + err.message); setSaving(false); return }
    reset(); setShowModal(false); await laad()
    setSaving(false)
  }

  const handleDelete = async (id) => {
    const prev = logs
    setLogs(logs.filter(l => l.id !== id))
    const { error: err } = await db.supabase.from('sleep_logs').delete().eq('id', id)
    if (err) setLogs(prev)
  }

  const kop = (
    <div style={{ position: 'relative', width: '100%', height: m ? 150 : 190, marginTop: m ? '3.25rem' : '4rem' }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${SLAAP_FOTO})`,
        backgroundSize: 'cover', backgroundPosition: 'center 40%',
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
        Slaap
      </div>
    </div>
  )

  const section = (
    <div style={{ padding: m ? '0 0.75rem' : '0 1rem', marginBottom: m ? '0.9rem' : '1.1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Moon size={m ? 14 : 16} color="rgba(255,255,255,0.45)" />
          <span style={{ fontSize: m ? '0.62rem' : '0.66rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Deze week</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button onClick={() => setShowTips(true)} style={{
            display: 'flex', alignItems: 'center', gap: '0.3rem',
            padding: m ? '0.4rem 0.7rem' : '0.5rem 0.85rem',
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 8, color: '#fff',
            fontSize: m ? '0.72rem' : '0.78rem', fontWeight: 900, cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit',
          }}>
            <Lightbulb size={13} strokeWidth={2.5} /> Tips
          </button>
          <button onClick={() => { reset(); setShowModal(true) }} style={{
            display: 'flex', alignItems: 'center', gap: '0.3rem',
            padding: m ? '0.4rem 0.7rem' : '0.5rem 0.85rem',
            background: '#fff', border: 'none', borderRadius: 8, color: '#0a0a0a',
            fontSize: m ? '0.72rem' : '0.78rem', fontWeight: 900, cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit',
          }}>
            <Plus size={14} strokeWidth={2.8} /> Loggen
          </button>
        </div>
      </div>

      <button
        onClick={() => setAlles(v => !v)}
        style={{
          alignSelf: 'flex-start', marginBottom: '0.5rem',
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          fontFamily: 'inherit', fontSize: m ? '0.68rem' : '0.72rem', fontWeight: 800,
          color: 'rgba(255,255,255,0.4)',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        {alles ? 'Alleen deze week' : 'Eerdere nachten'}
      </button>

      {loading ? (
        <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)' }}>Laden...</div>
      ) : logs.length === 0 ? (
        <div style={{ padding: m ? '1rem' : '1.25rem', textAlign: 'center', fontSize: m ? '0.72rem' : '0.78rem', color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 10 }}>
          Nog geen slaap gelogd deze week. Voeg je eerste nacht toe.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {logs.map(log => (
            <div key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: m ? '0.6rem 0.75rem' : '0.7rem 0.9rem', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: m ? '0.92rem' : '1rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em' }}>
                    {log.hours_slept ? `${log.hours_slept} uur` : '—'}
                  </span>
                  <span style={{ fontSize: m ? '0.66rem' : '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
                    {formatDate(log.log_date)}
                  </span>
                  {/* De tijden zeggen iets wat het aantal uren niet zegt: zeven
                      uur van elf tot zes is iets anders dan van twee tot negen. */}
                  {(log.bedtime || log.wake_time) && (
                    <span style={{ fontSize: m ? '0.64rem' : '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>
                      {String(log.bedtime || '—').slice(0, 5)} → {String(log.wake_time || '—').slice(0, 5)}
                    </span>
                  )}
                  {log.quality != null && (
                    <span style={{
                      fontSize: '0.62rem', fontWeight: 900,
                      color: log.quality >= 7 ? '#10b981' : log.quality >= 5 ? '#f59e0b' : '#ef4444',
                    }}>
                      {log.quality}/10
                    </span>
                  )}
                </div>
                {log.struggles && (
                  <div style={{ fontSize: m ? '0.66rem' : '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: 3, fontStyle: 'italic' }}>
                    Struggles: {log.struggles}
                  </div>
                )}
                {log.notes && (
                  <div style={{ fontSize: m ? '0.63rem' : '0.67rem', color: 'rgba(255,255,255,0.3)', marginTop: 2, fontStyle: 'italic' }}>
                    {log.notes}
                  </div>
                )}
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

  const logModal = showModal ? createPortal(
    <div onClick={() => !saving && setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 10000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#0a0a0a', borderRadius: m ? '16px 16px 0 0' : '14px', width: '100%', maxWidth: '480px', maxHeight: '88vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.08)', ...(m ? {} : { margin: 'auto' }) }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: m ? '0.85rem 1rem' : '1rem 1.15rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: m ? '0.95rem' : '1.05rem', fontWeight: 900, color: '#fff' }}>Slaap loggen</span>
          <button onClick={() => setShowModal(false)} style={{ width: 32, height: 32, borderRadius: 7, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
        </div>

        <div style={{ padding: m ? '0.85rem 1rem' : '1rem 1.15rem' }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>Uren geslapen</div>
          <input
            type="number" inputMode="decimal"
            value={hours}
            onChange={e => setHours(e.target.value)}
            placeholder="bijv. 7.5"
            style={{ width: '100%', boxSizing: 'border-box', padding: '0.55rem 0.7rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: m ? '0.8rem' : '0.85rem', fontFamily: 'inherit', outline: 'none', marginBottom: '0.75rem' }}
          />

          <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>Struggles vannacht</div>
          <textarea
            value={struggles}
            onChange={e => setStruggles(e.target.value)}
            rows={2}
            placeholder="bijv. moeizaam inslapen, vroeg wakker, onrustig..."
            style={{ width: '100%', boxSizing: 'border-box', padding: '0.55rem 0.7rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: m ? '0.78rem' : '0.82rem', fontFamily: 'inherit', outline: 'none', resize: 'vertical', marginBottom: '0.75rem' }}
          />

          <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>Notitie (optioneel)</div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="bijv. laat gegeten, veel stress, goed gevoel"
            style={{ width: '100%', boxSizing: 'border-box', padding: '0.55rem 0.7rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: m ? '0.78rem' : '0.82rem', fontFamily: 'inherit', outline: 'none', resize: 'vertical', marginBottom: '0.75rem' }}
          />

          {error && <div style={{ fontSize: '0.68rem', color: '#ef4444', marginBottom: '0.6rem', padding: '0.4rem 0.6rem', background: 'rgba(239,68,68,0.08)', borderRadius: 6 }}>{error}</div>}

          <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: '0.7rem', background: saving ? 'rgba(255,255,255,0.4)' : '#fff', border: 'none', borderRadius: 9, color: '#0a0a0a', fontSize: m ? '0.85rem' : '0.9rem', fontWeight: 900, cursor: saving ? 'default' : 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit' }}>
            {saving ? 'Opslaan…' : 'Slaap opslaan'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null

  const tipsModal = showTips ? createPortal(
    <div onClick={() => setShowTips(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 10000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#0a0a0a', borderRadius: m ? '16px 16px 0 0' : '14px', width: '100%', maxWidth: '480px', maxHeight: '88vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.08)', ...(m ? {} : { margin: 'auto' }) }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: m ? '0.85rem 1rem' : '1rem 1.15rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: m ? '0.95rem' : '1.05rem', fontWeight: 900, color: '#fff' }}>Slaaptips</span>
          <button onClick={() => setShowTips(false)} style={{ width: 32, height: 32, borderRadius: 7, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
        </div>

        <div style={{ padding: m ? '0.85rem 1rem 1.5rem' : '1rem 1.15rem 1.75rem' }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem' }}>Beter in diepe slaap komen</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1.25rem' }}>
            {DIEPE_SLAAP_TIPS.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.6rem', padding: m ? '0.6rem 0.75rem' : '0.65rem 0.85rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 9 }}>
                <Moon size={m ? 13 : 14} style={{ flexShrink: 0, marginTop: 2, color: '#818cf8' }} />
                <span style={{ fontSize: m ? '0.78rem' : '0.82rem', color: 'rgba(255,255,255,0.78)', lineHeight: 1.45 }}>{tip}</span>
              </div>
            ))}
          </div>

          <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem' }}>Beter wakker worden</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {WAKKER_TIPS.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.6rem', padding: m ? '0.6rem 0.75rem' : '0.65rem 0.85rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 9 }}>
                <Lightbulb size={m ? 13 : 14} style={{ flexShrink: 0, marginTop: 2, color: '#fbbf24' }} />
                <span style={{ fontSize: m ? '0.78rem' : '0.82rem', color: 'rgba(255,255,255,0.78)', lineHeight: 1.45 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  ) : null

  return <>{kop}{section}{logModal}{tipsModal}</>
}
