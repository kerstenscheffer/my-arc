// src/modules/ai-meal-generator/tabs/plan-analyzer/BestSwapsModal.jsx
// Coach-curatie: kies per maaltijd-slot de "beste swaps" voor een client
// (bijv. 5 ontbijt-opties, 3 lunch, 3 diner). De client kan later binnen deze
// lijst flexibel wisselen en toch op macro blijven. Opslag: client_swap_options
// (één rij per client + slot, meal_ids als uuid-array). Issue b6c60c21.
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useModalHost } from '../../../../coach/ModalHost'
import { X, Search, Check, Plus, Loader2, ChevronDown } from 'lucide-react'
import Keuze from '../../../meal-plan/components/Keuze'
import { foodImageFallback } from '../../../meal-plan/foodImageFallback'
import { wisselNiveauVoorDoel } from '../../../meal-plan/DayTemplateService'
import { colors, radius, space, shadow } from '../../../../ui/tokens'
const FIELDS = 'id, name, internal_name, calories, protein, carbs, fat, image_url, timing, labels'

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

const mealLabel = (m) => m.name || m.internal_name || 'Maaltijd'
const fotoVan = (m, slot) => m?.image_url || foodImageFallback(mealLabel(m), slot, 200)

// Wisselopties dragen hun groep als label ('groep:Op brood').
const GROEP_VOLGORDE = ['Op brood', 'Bowl', 'Wrap', 'Warm', 'Licht en snel', 'Klassiek', 'Pasta en wok', 'Mexicaans', 'Zoet', 'Hartig']
const groepVan = (m) => {
  const l = (Array.isArray(m?.labels) ? m.labels : []).map(String).find(x => x.startsWith('groep:'))
  return l ? l.slice(6) : null
}

// Drie tekstgroottes, meer niet (DESIGN-CONTRACT).
const T_KLEIN = 11
const T_BODY = 13
const T_NAAM = 15

const emptySlots = () => ({ breakfast: [], lunch: [], dinner: [], snack: [], avondsnack: [], pre_workout: [] })

// Eén regel: foto, naam met macro's, en rechts een actie.
function Rij({ m, rechts, onClick, gekozen, uit, slot }) {
  return (
    <div onClick={uit ? undefined : onClick} style={{
      display: 'flex', alignItems: 'center', gap: space[3], minHeight: 52,
      padding: `${space[1]}px 0`, cursor: onClick && !uit ? 'pointer' : 'default',
      opacity: uit ? 0.35 : 1,
    }}>
      <img src={fotoVan(m, slot)} alt="" style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 10, objectFit: 'cover', background: colors.surface, outline: gekozen ? `2px solid ${colors.accent}` : 'none' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: T_NAAM, fontWeight: 800, color: colors.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mealLabel(m)}</div>
        <div style={{ fontSize: T_BODY, fontWeight: 600, color: colors.textSecondary }}>{Math.round(m.calories || 0)} kcal · {Math.round(m.protein || 0)}g eiwit</div>
      </div>
      {rechts}
    </div>
  )
}

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
  // Automatische wisselopties: die krijgt de klant sowieso, op het niveau van
  // zijn caloriedoel. Hier alleen ter inzage, standaard ingeklapt.
  const [wisselNiveau, setWisselNiveau] = useState(null)
  const [auto, setAuto] = useState([])
  const [autoOpen, setAutoOpen] = useState(false)

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

  useEffect(() => {
    if (!clientId) { setWisselNiveau(null); return }
    let alive = true
    db.supabase.from('clients').select('target_calories').eq('id', clientId).maybeSingle()
      .then(({ data }) => { if (alive) setWisselNiveau(wisselNiveauVoorDoel(data?.target_calories)) }, () => {})
    return () => { alive = false }
  }, [clientId, db])

  useEffect(() => {
    if (!wisselNiveau || mode !== 'client') { setAuto([]); return }
    let alive = true
    db.supabase.from('ai_meals').select(FIELDS)
      .like('internal_name', `wissel${wisselNiveau}_${slotCfg.timing}_%`)
      .then(({ data }) => {
        if (!alive) return
        setAuto([...(data || [])].sort((a, b) => {
          const ga = GROEP_VOLGORDE.indexOf(groepVan(a)), gb = GROEP_VOLGORDE.indexOf(groepVan(b))
          return ga !== gb ? ga - gb : mealLabel(a).localeCompare(mealLabel(b))
        }))
      }, () => { if (alive) setAuto([]) })
    return () => { alive = false }
  }, [wisselNiveau, mode, slotCfg.timing, db])

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
        // Wisselopties zitten er al automatisch in; die hoef je niet te kiezen.
        let q = db.supabase.from('ai_meals').select(FIELDS).overlaps('timing', [slotCfg.timing])
          // Lege internal_name moet blijven: NOT LIKE op NULL zou hem wegfilteren.
          .or('internal_name.is.null,internal_name.not.like.wissel*')
          .not('needs_review', 'is', true)
          .order('name', { ascending: true })
          .limit(60)
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
        setSavedMsg('Standaard opgeslagen')
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
        setSavedMsg('Opgeslagen voor deze klant')
      }
    } catch (e) {
      console.error('Best swaps opslaan mislukt:', e)
      setSavedMsg('Fout bij opslaan: ' + (e?.message || JSON.stringify(e)))
    } finally {
      setSaving(false)
    }
  }

  const totalSelected = SLOTS.reduce((n, s) => n + effectiveCount(s.key), 0)

  const omhulsel = embedded
    ? { position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'stretch' }
    : { position: 'fixed', inset: 0, zIndex: 2147483600, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', display: 'flex', justifyContent: 'center', alignItems: isMobile ? 'flex-end' : 'center', padding: isMobile ? 0 : space[6] }

  const kaart = embedded
    ? { width: '100%', height: '100%', background: colors.bg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }
    : { width: '100%', maxWidth: 640, maxHeight: isMobile ? '94vh' : '88vh', background: colors.bg, border: `1px solid ${colors.borderSubtle}`, borderRadius: isMobile ? `${radius.card}px ${radius.card}px 0 0` : radius.card, display: 'flex', flexDirection: 'column', overflow: 'hidden' }

  const rand = isMobile ? space[4] : space[6]
  const eyebrow = { fontSize: T_KLEIN, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: colors.textMuted }
  const vlakKnop = { background: 'transparent', border: 'none', padding: 0, fontFamily: 'inherit', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }

  const rondje = (aan) => (
    <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: aan ? colors.accent : 'transparent', border: aan ? 'none' : '1.5px solid rgba(255,255,255,0.35)' }}>
      {aan ? <Check size={15} color={colors.onAccent} strokeWidth={3} /> : <Plus size={15} color={colors.textPrimary} strokeWidth={2.6} />}
    </div>
  )

  const slotOpties = SLOTS.map(s => ({ id: s.key, label: `${s.label} · ${effectiveCount(s.key)}` }))
  const modusOpties = [{ id: 'client', label: 'Deze klant' }, { id: 'default', label: 'Iedereen' }]
  const eigen = selected[activeSlot]
  const erft = inheritsDefault(activeSlot)

  const modal = (
    <div style={omhulsel}>
      <div style={kaart}>

        {/* Kop: twee keuzes op één regel. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: space[2], padding: `${space[3]}px ${rand}px`, borderBottom: `1px solid ${colors.borderSubtle}` }}>
          {!embedded && <div style={{ fontSize: T_NAAM, fontWeight: 800, color: colors.textPrimary, marginRight: 'auto' }}>Beste swaps</div>}
          <Keuze vast waarde={activeSlot} opties={slotOpties} zet={(v) => { setActiveSlot(v); setSearch(''); setAutoOpen(false) }} isMobile={isMobile} />
          {clientId && <Keuze vast uitlijning="rechts" waarde={mode} opties={modusOpties} zet={(v) => { setMode(v); setSavedMsg('') }} isMobile={isMobile} />}
          {!embedded && (
            <button onClick={onClose} aria-label="Sluiten" style={{ ...vlakKnop, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textPrimary }}>
              <X size={20} strokeWidth={2.6} />
            </button>
          )}
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: `${space[4]}px ${rand}px ${space[6]}px` }}>

          {/* Automatisch: wat de klant op zijn niveau al krijgt. */}
          {mode === 'client' && auto.length > 0 && (
            <div style={{ marginBottom: space[6] }}>
              <button onClick={() => setAutoOpen(v => !v)} style={{ ...vlakKnop, width: '100%', display: 'flex', alignItems: 'center', gap: space[2], minHeight: 44 }}>
                <span style={{ flex: 1, textAlign: 'left', fontSize: T_NAAM, fontWeight: 800, color: colors.textPrimary }}>
                  {auto.length} wisselopties
                  <span style={{ fontSize: T_BODY, fontWeight: 600, color: colors.textSecondary }}> · automatisch voor {wisselNiveau} kcal</span>
                </span>
                <ChevronDown size={18} color={colors.textPrimary} style={{ transform: autoOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              {autoOpen && auto.map((m, i) => (
                <div key={m.id}>
                  {groepVan(m) && groepVan(m) !== groepVan(auto[i - 1]) && (
                    <div style={{ ...eyebrow, marginTop: i === 0 ? space[2] : space[4], marginBottom: space[1] }}>{groepVan(m)}</div>
                  )}
                  <Rij m={m} slot={slotCfg.timing} />
                </div>
              ))}
            </div>
          )}

          {/* Jouw keuze voor dit moment. */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: space[2], marginBottom: space[2] }}>
            <div style={{ ...eyebrow, flex: 1 }}>
              {mode === 'client' ? 'Extra van jou' : 'Standaard voor iedereen'} · {eigen.length}/{slotCfg.max}
            </div>
            {mode === 'client' && eigen.length > 0 && (defaults[activeSlot]?.length || 0) > 0 && (
              <button onClick={resetToDefault} style={{ ...vlakKnop, fontSize: T_BODY, fontWeight: 800, color: colors.textPrimary }}>Terug naar standaard</button>
            )}
          </div>

          {erft && (
            <div style={{ display: 'flex', alignItems: 'center', gap: space[3], minHeight: 44, marginBottom: space[2] }}>
              <div style={{ flex: 1, minWidth: 0, fontSize: T_BODY, fontWeight: 600, color: colors.textSecondary }}>
                Volgt je standaard: {defaults[activeSlot].map(mealLabel).join(', ')}
              </div>
              <button onClick={overrideFromDefault} style={{ ...vlakKnop, flexShrink: 0, fontSize: T_BODY, fontWeight: 800, color: colors.textPrimary, textDecoration: 'underline', textUnderlineOffset: 3 }}>Aanpassen</button>
            </div>
          )}

          {eigen.length === 0 && !erft && (
            <div style={{ fontSize: T_BODY, fontWeight: 600, color: colors.textMuted, marginBottom: space[2] }}>
              Nog niets gekozen. Tik hieronder een maaltijd aan.
            </div>
          )}
          {eigen.map(m => (
            <Rij key={m.id} m={m} slot={slotCfg.timing} gekozen rechts={
              <button onClick={() => toggle(m)} aria-label="Weghalen" style={{ ...vlakKnop, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textPrimary }}>
                <X size={18} strokeWidth={2.6} />
              </button>
            } />
          ))}

          {/* Zoeken en kiezen. */}
          <div style={{ position: 'relative', margin: `${space[4]}px 0 ${space[2]}px` }}>
            <Search size={16} style={{ position: 'absolute', left: space[3], top: '50%', transform: 'translateY(-50%)', color: colors.textSecondary }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Zoek ${slotCfg.label.toLowerCase()}`}
              style={{ width: '100%', boxSizing: 'border-box', minHeight: 44, padding: `0 ${space[3]}px 0 ${space[8]}px`, background: colors.surface, border: `1px solid ${colors.borderSubtle}`, borderRadius: radius.btn, color: colors.textPrimary, fontSize: T_NAAM, fontWeight: 600, outline: 'none', fontFamily: 'inherit' }} />
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: space[6] }}><Loader2 size={22} color={colors.textPrimary} style={{ animation: 'spin 1s linear infinite' }} /></div>
          ) : candidates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: space[6], color: colors.textMuted, fontSize: T_BODY, fontWeight: 600 }}>Geen maaltijden gevonden.</div>
          ) : candidates.map(m => {
            const picked = isPicked(m.id)
            const vol = !picked && eigen.length >= slotCfg.max
            return <Rij key={m.id} m={m} slot={slotCfg.timing} gekozen={picked} uit={vol} onClick={() => toggle(m)} rechts={rondje(picked)} />
          })}
        </div>

        {/* Voet: status en de ene primaire actie. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: space[3], padding: `${space[3]}px ${rand}px`, borderTop: `1px solid ${colors.borderSubtle}` }}>
          <span style={{ flex: 1, fontSize: T_BODY, fontWeight: 700, color: savedMsg.startsWith('Fout') ? colors.danger : colors.textSecondary }}>
            {savedMsg || `${totalSelected} gekozen`}
          </span>
          <button onClick={handleSave} disabled={saving} style={{ minHeight: 44, padding: `0 ${space[6]}px`, borderRadius: radius.btn, background: colors.accent, border: 'none', color: colors.onAccent, fontSize: T_NAAM, fontWeight: 800, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1, boxShadow: shadow.glow, fontFamily: 'inherit' }}>
            {saving ? 'Opslaan…' : 'Opslaan'}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (embedded) return (
    // flex:1 + minHeight:0 in plaats van height:100%. Het dock-paneel is een
    // kolom-flex, dus dit vult altijd de beschikbare hoogte. Een procentuele
    // hoogte hangt af van of élke ouder in de keten een vaste hoogte heeft, en
    // in split screen klapte die keten dicht: het paneel opende, maar de lijst
    // erin was nul pixels hoog en je zag geen maaltijden.
    <div style={{ position: 'relative', width: '100%', flex: 1, minHeight: 0, overflow: 'hidden' }}>{modal}</div>
  )
  return createPortal(modal, modalHost)
}
