// src/modules/ai-meal-generator/tabs/plan-analyzer/BestSwapsModal.jsx
// Coach-curatie: kies per maaltijd-slot de "beste swaps" voor een client
// (bijv. 5 ontbijt-opties, 3 lunch, 3 diner). De client kan later binnen deze
// lijst flexibel wisselen en toch op macro blijven. Opslag: client_swap_options
// (één rij per client + slot, meal_ids als uuid-array). Issue b6c60c21.
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useModalHost } from '../../../../coach/ModalHost'
import { X, Search, Check, Plus, Loader2 } from 'lucide-react'

const GOLD = '#FFD700'
const FIELDS = 'id, name, internal_name, calories, protein, carbs, fat, image_url, timing'

// Aantal swap-opties dat je per slot mag kiezen. Eén getal voor alle slots —
// stond eerder op 5 voor ontbijt en 3 voor de rest.
const MAX_PER_SLOT = 5

const SLOTS = [
  { key: 'breakfast',   label: 'Ontbijt',     timing: 'breakfast',   max: MAX_PER_SLOT },
  { key: 'lunch',       label: 'Lunch',       timing: 'lunch',       max: MAX_PER_SLOT },
  { key: 'dinner',      label: 'Diner',       timing: 'dinner',      max: MAX_PER_SLOT },
  { key: 'snack',       label: 'Snacks',      timing: 'snack',       max: MAX_PER_SLOT },
  { key: 'avondsnack',  label: 'Avondsnack',  timing: 'snack',       max: MAX_PER_SLOT },
  { key: 'pre_workout', label: 'Pre-Workout', timing: 'pre_workout', max: MAX_PER_SLOT },
]

const mealLabel = (m) => m.internal_name || m.name || 'Maaltijd'

const emptySlots = () => ({ breakfast: [], lunch: [], dinner: [], snack: [], avondsnack: [], pre_workout: [] })

export default function BestSwapsModal({ clientId, db, isMobile, onClose, embedded = false }) {
  const modalHost = useModalHost()
  // Twee niveaus:
  //   'default' → coach_swap_defaults, geldt voor ÁL je klanten
  //   'client'  → client_swap_options, uitzondering voor deze ene klant
  // Een klant-slot met maaltijden wint van de standaard; een leeg klant-slot
  // erft de standaard. Zonder clientId kan alleen de standaard bewerkt worden.
  const [mode, setMode] = useState(clientId ? 'client' : 'default')
  const [activeSlot, setActiveSlot] = useState('breakfast')
  const [selected, setSelected] = useState(emptySlots())
  const [defaults, setDefaults] = useState(emptySlots())
  const [candidates, setCandidates] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [coachId, setCoachId] = useState(null)

  const slotCfg = SLOTS.find(s => s.key === activeSlot)

  // Coach-id lokaal uit de sessie (geen netwerk-call, zie opmerking bij opslaan).
  useEffect(() => {
    let alive = true
    ;(async () => {
      const { data: { session } } = await db.supabase.auth.getSession()
      if (alive) setCoachId(session?.user?.id || null)
    })()
    return () => { alive = false }
  }, [db])

  // Beide niveaus laden. De standaard hebben we ook in klant-modus nodig, om te
  // kunnen tonen wat een leeg slot erft.
  useEffect(() => {
    if (!coachId) return
    let alive = true
    ;(async () => {
      try {
        const [clientRes, defaultRes] = await Promise.all([
          clientId
            ? db.supabase.from('client_swap_options').select('meal_slot, meal_ids').eq('client_id', clientId)
            : Promise.resolve({ data: [] }),
          db.supabase.from('coach_swap_defaults').select('meal_slot, meal_ids').eq('coach_id', coachId),
        ])
        const clientRows = clientRes.data || []
        const defaultRows = defaultRes.data || []

        // Alle maaltijden van beide niveaus in één keer ophalen.
        const allIds = [...new Set([...clientRows, ...defaultRows].flatMap(r => r.meal_ids || []))]
        let mealsById = {}
        if (allIds.length > 0) {
          const { data: meals } = await db.supabase.from('ai_meals').select(FIELDS).in('id', allIds)
          mealsById = Object.fromEntries((meals || []).map(m => [m.id, m]))
        }
        if (!alive) return

        const toSlots = (rows) => {
          const next = emptySlots()
          for (const r of rows) {
            if (next[r.meal_slot] !== undefined) {
              next[r.meal_slot] = (r.meal_ids || []).map(id => mealsById[id]).filter(Boolean)
            }
          }
          return next
        }
        setDefaults(toSlots(defaultRows))
        setSelected(mode === 'client' ? toSlots(clientRows) : toSlots(defaultRows))
      } catch (e) { console.warn('Best swaps laden mislukt:', e) }
    })()
    return () => { alive = false }
  }, [clientId, db, coachId, mode])

  // Kandidaten voor het actieve slot (timing-filter, zelfde bron als de gewone swap).
  useEffect(() => {
    let alive = true
    setLoading(true)
    ;(async () => {
      try {
        let q = db.supabase.from('ai_meals').select(FIELDS).overlaps('timing', [slotCfg.timing]).limit(60)
        const term = search.trim()
        if (term) q = q.or(`name.ilike.%${term}%,internal_name.ilike.%${term}%`)
        const { data } = await q
        if (alive) setCandidates(data || [])
      } catch (e) { console.warn('Kandidaten laden mislukt:', e); if (alive) setCandidates([]) }
      finally { if (alive) setLoading(false) }
    })()
    return () => { alive = false }
  }, [activeSlot, search, db, slotCfg.timing])

  const isPicked = (id) => selected[activeSlot].some(m => m.id === id)

  // Erft dit slot de standaard? Alleen in klant-modus, en alleen als de klant
  // zelf niets gekozen heeft terwijl er wél een standaard is.
  const inheritsDefault = (slotKey) =>
    mode === 'client'
    && (selected[slotKey]?.length || 0) === 0
    && (defaults[slotKey]?.length || 0) > 0

  // Wat er feitelijk geldt voor een slot — voor de tellers op de tabs.
  const effectiveCount = (slotKey) =>
    inheritsDefault(slotKey) ? defaults[slotKey].length : (selected[slotKey]?.length || 0)

  const toggle = (meal) => {
    setSavedMsg('')
    setSelected(prev => {
      const cur = prev[activeSlot]
      if (cur.some(m => m.id === meal.id)) {
        return { ...prev, [activeSlot]: cur.filter(m => m.id !== meal.id) }
      }
      if (cur.length >= slotCfg.max) return prev // max bereikt
      return { ...prev, [activeSlot]: [...cur, meal] }
    })
  }

  // Begin de uitzondering vanaf de standaard i.p.v. vanaf niets — scheelt
  // opnieuw alles aanklikken als je maar één maaltijd wilt vervangen.
  const overrideFromDefault = () => {
    setSavedMsg('')
    setSelected(prev => ({ ...prev, [activeSlot]: [...(defaults[activeSlot] || [])] }))
  }

  // Terug naar de standaard: leegmaken betekent erven.
  const resetToDefault = () => {
    setSavedMsg('')
    setSelected(prev => ({ ...prev, [activeSlot]: [] }))
  }

  const handleSave = async () => {
    setSaving(true); setSavedMsg('')
    try {
      // getSession() leest de coach-id lokaal uit de opgeslagen sessie (geen
      // netwerk-call), i.p.v. getUser() dat de token online valideert en kon
      // falen met "Failed to fetch".
      const { data: { session } } = await db.supabase.auth.getSession()
      const uid = session?.user?.id
      if (!uid) throw new Error('Geen sessie — log opnieuw in')

      if (mode === 'default') {
        const rows = SLOTS.map(s => ({
          coach_id: uid,
          meal_slot: s.key,
          meal_ids: (selected[s.key] || []).map(m => m.id),
          updated_at: new Date().toISOString(),
        }))
        const { error } = await db.supabase
          .from('coach_swap_defaults')
          .upsert(rows, { onConflict: 'coach_id,meal_slot' })
        if (error) throw error
        setDefaults({ ...selected })
        setSavedMsg('Standaard opgeslagen ✓')
      } else {
        const rows = SLOTS.map(s => ({
          coach_id: uid,
          client_id: clientId,
          meal_slot: s.key,
          meal_ids: (selected[s.key] || []).map(m => m.id),
          updated_at: new Date().toISOString(),
        }))
        const { error } = await db.supabase
          .from('client_swap_options')
          .upsert(rows, { onConflict: 'client_id,meal_slot' })
        if (error) throw error
        setSavedMsg('Opgeslagen voor deze klant ✓')
      }
    } catch (e) {
      console.error('Best swaps opslaan mislukt:', e)
      setSavedMsg('Fout bij opslaan: ' + (e?.message || JSON.stringify(e)))
    } finally {
      setSaving(false)
    }
  }

  const totalSelected = SLOTS.reduce((n, s) => n + effectiveCount(s.key), 0)

  const modal = (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2147483600, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: isMobile ? 'flex-end' : 'center', padding: isMobile ? 0 : '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: 720, maxHeight: isMobile ? '94vh' : '88vh', background: '#0a0a0a', border: '1px solid rgba(255,215,0,0.2)', borderRadius: isMobile ? '18px 18px 0 0' : 18, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: isMobile ? '1rem 1rem 0.75rem' : '1.25rem 1.5rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
            <div>
              <h2 style={{ fontSize: isMobile ? '1.1rem' : '1.3rem', fontWeight: 900, color: '#fff', margin: 0 }}>Beste swaps</h2>
              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', margin: '0.2rem 0 0', fontWeight: 500 }}>
                {mode === 'default'
                  ? 'Geldt voor al je klanten, behalve waar je per klant afwijkt.'
                  : 'Alleen voor deze klant — lege slots erven je standaard.'}
              </p>
            </div>
            <button onClick={onClose} style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={18} />
            </button>
          </div>

          {/* Niveau: standaard voor iedereen, of afwijking voor deze klant. */}
          {clientId && (
            <div style={{ display: 'flex', gap: 4, marginTop: '0.85rem', padding: 3, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
              {[
                { key: 'default', label: 'Standaard (iedereen)' },
                { key: 'client',  label: 'Deze klant' },
              ].map(t => {
                const on = mode === t.key
                return (
                  <button key={t.key} onClick={() => { setMode(t.key); setSavedMsg('') }} style={{
                    flex: 1, padding: '0.45rem 0.5rem', borderRadius: 8, cursor: 'pointer',
                    background: on ? 'rgba(255,215,0,0.14)' : 'transparent',
                    border: on ? `1px solid ${GOLD}66` : '1px solid transparent',
                    color: on ? GOLD : 'rgba(255,255,255,0.55)', fontSize: '0.74rem', fontWeight: 800,
                  }}>{t.label}</button>
                )
              })}
            </div>
          )}

          {/* Slot-tabs */}
          <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.85rem', overflowX: 'auto' }}>
            {SLOTS.map(s => {
              const active = activeSlot === s.key
              const count = effectiveCount(s.key)
              const erft = inheritsDefault(s.key)
              return (
                <button key={s.key} onClick={() => { setActiveSlot(s.key); setSearch('') }} style={{
                  flexShrink: 0, padding: '0.45rem 0.8rem', borderRadius: 999,
                  background: active ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.03)',
                  border: active ? `1.5px solid ${GOLD}` : '1px solid rgba(255,255,255,0.1)',
                  color: active ? GOLD : 'rgba(255,255,255,0.6)', fontSize: '0.78rem', fontWeight: 800,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}>{s.label} <span style={{ opacity: 0.7 }}>{count}/{s.max}</span>
                  {/* Puntje = dit slot komt uit de standaard, niet van deze klant. */}
                  {erft && <span title="Erft je standaard" style={{ marginLeft: 4, opacity: 0.75 }}>·std</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Geselecteerd voor dit slot */}
        <div style={{ padding: isMobile ? '0.75rem 1rem' : '0.85rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.5rem' }}>
            <div style={{ flex: 1, fontSize: '0.62rem', fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Gekozen ({selected[activeSlot].length}/{slotCfg.max})
            </div>
            {/* Staat er een eigen keuze voor deze klant? Dan kun je 'm terugzetten. */}
            {mode === 'client' && selected[activeSlot].length > 0 && (defaults[activeSlot]?.length || 0) > 0 && (
              <button onClick={resetToDefault} style={{ flexShrink: 0, padding: '0.25rem 0.55rem', borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)', fontSize: '0.66rem', fontWeight: 700, cursor: 'pointer' }}>
                Terug naar standaard
              </button>
            )}
          </div>

          {/* Erft dit slot? Toon wát het erft, en bied aan er vanaf te wijken. */}
          {inheritsDefault(activeSlot) && (
            <div style={{ padding: '0.6rem 0.7rem', borderRadius: 10, background: 'rgba(255,215,0,0.05)', border: `1px solid ${GOLD}33`, marginBottom: '0.6rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)', fontWeight: 600, marginBottom: 6 }}>
                Erft je standaard: {defaults[activeSlot].map(mealLabel).join(', ')}
              </div>
              <button onClick={overrideFromDefault} style={{ padding: '0.35rem 0.7rem', borderRadius: 8, background: GOLD, border: 'none', color: '#000', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}>
                Afwijken voor deze klant
              </button>
            </div>
          )}

          {selected[activeSlot].length === 0 ? (
            !inheritsDefault(activeSlot) && (
              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>Nog niks gekozen — tik hieronder maaltijden aan.</div>
            )
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {selected[activeSlot].map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem 0.55rem', background: 'rgba(255,215,0,0.06)', border: `1px solid ${GOLD}33`, borderRadius: 10 }}>
                  <span style={{ flex: 1, minWidth: 0, fontSize: '0.82rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mealLabel(m)}</span>
                  <span style={{ flexShrink: 0, fontSize: '0.66rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{Math.round(m.calories || 0)} kcal · {Math.round(m.protein || 0)}e</span>
                  <button onClick={() => toggle(m)} style={{ flexShrink: 0, width: 24, height: 24, borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={13} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Zoek */}
        <div style={{ padding: isMobile ? '0.75rem 1rem 0.5rem' : '0.85rem 1.5rem 0.5rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Zoek ${slotCfg.label.toLowerCase()}-maaltijden…`}
              style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem 0.6rem 0.6rem 2rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: '0.85rem', fontWeight: 600, outline: 'none', fontFamily: 'inherit' }} />
          </div>
        </div>

        {/* Kandidaten */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '0.25rem 1rem 1rem' : '0.25rem 1.5rem 1rem', WebkitOverflowScrolling: 'touch' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Loader2 size={22} color={GOLD} style={{ animation: 'spin 1s linear infinite' }} /></div>
          ) : candidates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem' }}>Geen maaltijden gevonden.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {candidates.map(m => {
                const picked = isPicked(m.id)
                const full = !picked && selected[activeSlot].length >= slotCfg.max
                return (
                  <button key={m.id} onClick={() => toggle(m)} disabled={full}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.55rem 0.65rem', textAlign: 'left',
                      background: picked ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.03)',
                      border: picked ? `1.5px solid ${GOLD}` : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 10, cursor: full ? 'not-allowed' : 'pointer', opacity: full ? 0.4 : 1, width: '100%' }}>
                    <div style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 8, overflow: 'hidden', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {m.image_url ? <img src={m.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem', fontWeight: 800 }}>{mealLabel(m).charAt(0)}</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mealLabel(m)}</div>
                      <div style={{ fontSize: '0.66rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>{Math.round(m.calories || 0)} kcal · {Math.round(m.protein || 0)}e {Math.round(m.carbs || 0)}k {Math.round(m.fat || 0)}v</div>
                    </div>
                    <div style={{ flexShrink: 0, width: 24, height: 24, borderRadius: '50%', background: picked ? GOLD : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {picked ? <Check size={14} color="#0a0a0a" strokeWidth={3} /> : <Plus size={14} color="rgba(255,255,255,0.5)" />}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ flex: 1, fontSize: '0.72rem', fontWeight: 600, color: savedMsg.startsWith('Fout') ? '#ef4444' : 'rgba(255,255,255,0.5)' }}>
            {savedMsg || `${totalSelected} maaltijden gekozen`}
          </span>
          <button onClick={handleSave} disabled={saving} style={{ padding: '0.65rem 1.4rem', borderRadius: 12, background: saving ? 'rgba(255,215,0,0.4)' : 'linear-gradient(135deg,#FFD700,#D4AF37)', border: 'none', color: '#0a0a0a', fontSize: '0.88rem', fontWeight: 900, cursor: saving ? 'default' : 'pointer' }}>
            {saving ? 'Opslaan…' : 'Opslaan'}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (embedded) return (
    <div style={{ position: 'relative', width: '100%', height: '100%', transform: 'translateZ(0)', overflow: 'hidden' }}>{modal}</div>
  )
  return createPortal(modal, modalHost)
}
