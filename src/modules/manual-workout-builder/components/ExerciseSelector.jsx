// src/modules/manual-workout-builder/components/ExerciseSelector.jsx
//
// Oefening kiezen voor een plan. Zelfde opzet als het wisselvenster op de
// maaltijdpagina: zoekveld, drie keuzes als losse tekst met een pijltje,
// daaronder kaarten met een foto links en de naam ernaast.
//
// De lijst komt uit de `exercises`-tabel — de echte bibliotheek. Voorheen las
// dit venster een statisch bestand van 160 oefeningen, waardoor je een
// oefening die wél in de bibliotheek stond (Incline Barbell Bench Press)
// hier niet kon vinden. Eigen oefeningen van klanten en de coach-database
// staan in dezelfde lijst, met een bron-filter in plaats van losse tabbladen:
// één zoekveld dat alles vindt.

import { useState, useEffect, useMemo } from 'react'
import { X, Search, Dumbbell, Plus, Trash2, Check } from 'lucide-react'
import Keuze from '../../meal-plan/components/Keuze'
import CustomExerciseModal from '../../workout/components/todays-workout/components/CustomExerciseModal'

const LIJN = 'rgba(255,255,255,0.06)'

// Nederlandse labels voor wat in de bibliotheek in het Engels staat.
const SPIER = {
  chest: 'Borst', back: 'Rug', shoulders: 'Schouders', biceps: 'Biceps',
  triceps: 'Triceps', legs: 'Benen', glutes: 'Billen', calves: 'Kuiten',
  core: 'Core', abs: 'Buik', traps: 'Traps',
}
const MATERIAAL = {
  barbell: 'Barbell', dumbbells: 'Dumbbells', cables: 'Kabel', machine: 'Machine',
  bodyweight: 'Lichaamsgewicht', kettlebell: 'Kettlebell', plates: 'Schijven',
}
const spierLabel = (v) => SPIER[String(v || '').toLowerCase()] || (v ? String(v).charAt(0).toUpperCase() + String(v).slice(1) : '')
const materiaalLabel = (v) => MATERIAAL[String(v || '').toLowerCase()] || (v ? String(v).charAt(0).toUpperCase() + String(v).slice(1) : '')

const spierOpties = [
  { id: 'alles', label: 'Alle spieren' },
  ...['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'calves', 'core', 'abs'].map(k => ({ id: k, label: SPIER[k] })),
]
const materiaalOpties = [
  { id: 'alles', label: 'Alle materiaal' },
  ...['machine', 'cables', 'dumbbells', 'barbell', 'bodyweight', 'kettlebell'].map(k => ({ id: k, label: MATERIAAL[k] })),
]
const bronOpties = [
  { id: 'alles', label: 'Alles' },
  { id: 'bibliotheek', label: 'Bibliotheek' },
  { id: 'compound', label: 'Compound' },
  { id: 'isolation', label: 'Isolatie' },
  { id: 'thuis', label: 'Thuis-geschikt' },
  { id: 'klant', label: 'Van klanten' },
  { id: 'coach', label: 'Coach DB' },
]

export default function ExerciseSelector({ onSelect, onClose, isMobile, db, selectedClient }) {
  const [zoek, setZoek] = useState('')
  const [spier, setSpier] = useState('alles')
  const [materiaal, setMateriaal] = useState('alles')
  const [bron, setBron] = useState('alles')
  const [bibliotheek, setBibliotheek] = useState([])
  const [eigen, setEigen] = useState([])        // custom_exercises: van klanten én coach
  const [laden, setLaden] = useState(true)
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newEx, setNewEx] = useState({ name: '', muscle_group: '', equipment: '' })

  useEffect(() => { laad() }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const laad = async () => {
    setLaden(true)
    try {
      const [bib, cust] = await Promise.all([
        db.supabase
          .from('exercises')
          .select('id, name, primair_spieren, equipment, type, difficulty, image_url, thumbnail_url, home_friendly, gym_friendly, suggested_sets, suggested_reps, suggested_rest')
          .eq('is_active', true)
          .order('name')
          .then(r => r, e => ({ data: [], error: e })),
        db.supabase
          .from('custom_exercises')
          .select('id, name, muscle_group, equipment, sets, reps, rest, client_id')
          .order('name')
          .then(r => r, e => ({ data: [], error: e })),
      ])
      if (bib.error) console.error('Bibliotheek laden mislukt:', bib.error)
      if (cust.error) console.error('Eigen oefeningen laden mislukt:', cust.error)

      const klantIds = [...new Set((cust.data || []).map(e => e.client_id).filter(Boolean))]
      let namen = {}
      if (klantIds.length) {
        const { data: klanten } = await db.supabase.from('clients').select('id, first_name, last_name').in('id', klantIds)
          .then(r => r, () => ({ data: [] }))
        ;(klanten || []).forEach(c => { namen[c.id] = `${c.first_name || ''} ${c.last_name || ''}`.trim() })
      }

      setBibliotheek((bib.data || []).map(x => ({
        key: `bib_${x.id}`, bron: 'bibliotheek',
        name: x.name, spier: x.primair_spieren, materiaal: x.equipment, type: x.type,
        thuis: !!x.home_friendly, foto: x.image_url || x.thumbnail_url || null,
        sets: x.suggested_sets, reps: x.suggested_reps, rest: x.suggested_rest,
      })))
      setEigen((cust.data || []).map(x => ({
        key: `eigen_${x.id}`, id: x.id,
        bron: x.client_id ? 'klant' : 'coach',
        name: x.name, spier: x.muscle_group, materiaal: x.equipment, type: 'custom',
        thuis: false, foto: null,
        sets: x.sets, reps: x.reps, rest: x.rest,
        klantNaam: x.client_id ? (namen[x.client_id] || 'Klant') : null,
      })))
    } finally { setLaden(false) }
  }

  const lijst = useMemo(() => {
    const q = zoek.trim().toLowerCase()
    return [...bibliotheek, ...eigen].filter(ex => {
      if (q && !ex.name.toLowerCase().includes(q)) return false
      if (spier !== 'alles' && String(ex.spier || '').toLowerCase() !== spier) return false
      if (materiaal !== 'alles' && String(ex.materiaal || '').toLowerCase() !== materiaal) return false
      if (bron === 'bibliotheek' && ex.bron !== 'bibliotheek') return false
      if (bron === 'klant' && ex.bron !== 'klant') return false
      if (bron === 'coach' && ex.bron !== 'coach') return false
      if (bron === 'compound' && ex.type !== 'compound') return false
      if (bron === 'isolation' && ex.type !== 'isolation') return false
      if (bron === 'thuis' && !ex.thuis) return false
      return true
    })
  }, [bibliotheek, eigen, zoek, spier, materiaal, bron])

  // Standaard van de coach: 2 sets, 8-12, 2 minuten rust. Brengt de oefening
  // zelf iets eigens mee, dan gaat dat voor.
  const kies = (ex) => onSelect({
    name: ex.name,
    sets: ex.sets || 2,
    reps: ex.reps || '8-12',
    rest: ex.rest || '2 min',
    primairSpieren: ex.spier || '',
    equipment: ex.materiaal || '',
    type: ex.type === 'custom' ? 'custom' : (ex.type || 'compound'),
    _isCustom: ex.bron !== 'bibliotheek',
  })

  const addCoachExercise = async () => {
    if (!newEx.name.trim() || !newEx.muscle_group.trim()) return
    try {
      const { data, error } = await db.supabase
        .from('custom_exercises')
        .insert({ name: newEx.name.trim(), muscle_group: newEx.muscle_group.trim(), equipment: newEx.equipment.trim() || null, client_id: null })
        .select().single()
      if (error) throw error
      setEigen(prev => [...prev, {
        key: `eigen_${data.id}`, id: data.id, bron: 'coach', name: data.name,
        spier: data.muscle_group, materiaal: data.equipment, type: 'custom', thuis: false, foto: null,
      }].sort((a, b) => a.name.localeCompare(b.name)))
      setNewEx({ name: '', muscle_group: '', equipment: '' })
      setShowAddForm(false)
    } catch (e) { console.error('Coach-oefening opslaan mislukt:', e); alert('Opslaan mislukt') }
  }

  const deleteCoachExercise = async (id) => {
    if (!window.confirm('Oefening verwijderen uit de coach-database?')) return
    try {
      const { error } = await db.supabase.from('custom_exercises').delete().eq('id', id).is('client_id', null)
      if (error) throw error
      setEigen(prev => prev.filter(e => e.id !== id))
    } catch (e) { console.error('Verwijderen mislukt:', e); alert('Verwijderen mislukt') }
  }

  const fotoMaat = isMobile ? 70 : 82

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div style={{
        width: '100%', maxWidth: 700, maxHeight: '88vh',
        background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: isMobile ? '18px 18px 0 0' : 18,
        marginBottom: isMobile ? 0 : '2rem',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>

        {/* ── Kop: titel, zoeken, drie keuzes ── */}
        <div style={{ padding: isMobile ? '0.85rem 1rem 0.6rem' : '1rem 1.5rem 0.7rem', borderBottom: `1px solid ${LIJN}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: '0.7rem' }}>
            <div style={{ fontSize: isMobile ? '1.15rem' : '1.3rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.025em' }}>
              Oefening toevoegen
            </div>
            <button onClick={onClose} aria-label="Sluit" style={{
              width: 36, height: 36, flexShrink: 0, borderRadius: 10,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>
              <X size={17} strokeWidth={2.6} />
            </button>
          </div>

          <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)' }} />
            <input
              type="text" autoFocus
              placeholder="Zoek oefening…"
              value={zoek} onChange={(e) => setZoek(e.target.value)}
              style={{
                width: '100%', minHeight: 42, padding: '0.6rem 0.75rem 0.6rem 2.25rem',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10, color: '#fff', fontSize: isMobile ? '0.9rem' : '0.95rem',
                fontWeight: 700, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Keuze waarde={spier} opties={spierOpties} zet={setSpier} isMobile={isMobile} />
            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
            <Keuze waarde={materiaal} opties={materiaalOpties} zet={setMateriaal} isMobile={isMobile} />
            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
            <Keuze waarde={bron} opties={bronOpties} zet={setBron} isMobile={isMobile} uitlijning="rechts" />
          </div>
        </div>

        {/* ── Lijst ── */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: isMobile ? '0.6rem 0 0.4rem' : '0.75rem 0 0.5rem' }}>
          {laden ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <div style={{ width: 30, height: 30, border: '2px solid rgba(255,255,255,0.08)', borderTopColor: 'rgba(255,255,255,0.5)', borderRadius: '50%', animation: 'exSpin 0.8s linear infinite' }} />
            </div>
          ) : lijst.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1.25rem' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', marginBottom: '0.35rem' }}>Geen oefening gevonden</div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', lineHeight: 1.45, maxWidth: 320, margin: '0 auto' }}>
                Probeer een andere spiergroep, ander materiaal of een kortere zoekterm. Staat hij nergens in, voeg hem dan toe aan de Coach DB.
              </div>
            </div>
          ) : (
            <>
              <div style={{ padding: isMobile ? '0 0.9rem 0.4rem' : '0 1.25rem 0.5rem', fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>
                {lijst.length} oefening{lijst.length === 1 ? '' : 'en'}
              </div>
              {lijst.map(ex => (
                <OefeningKaart
                  key={ex.key} ex={ex} isMobile={isMobile} fotoMaat={fotoMaat}
                  onKies={() => kies(ex)}
                  onDelete={ex.bron === 'coach' ? () => deleteCoachExercise(ex.id) : null}
                />
              ))}
            </>
          )}
        </div>

        {/* ── Voet: toevoegen ── */}
        {db && (
          <div style={{ padding: isMobile ? '0.65rem 0.9rem calc(0.65rem + env(safe-area-inset-bottom, 0px))' : '0.75rem 1.25rem', borderTop: `1px solid ${LIJN}`, flexShrink: 0 }}>
            {showAddForm ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { k: 'name', p: 'Naam oefening *' },
                  { k: 'muscle_group', p: 'Spiergroep * (chest, back, legs…)' },
                  { k: 'equipment', p: 'Materiaal (optioneel)' },
                ].map(v => (
                  <input key={v.k} value={newEx[v.k]} onChange={e => setNewEx(p => ({ ...p, [v.k]: e.target.value }))} placeholder={v.p}
                    style={{ padding: '0.55rem 0.7rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: '0.85rem', fontWeight: 700, outline: 'none', fontFamily: 'inherit' }} />
                ))}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={addCoachExercise} disabled={!newEx.name.trim() || !newEx.muscle_group.trim()} style={voetKnop(true)}>Opslaan in Coach DB</button>
                  <button onClick={() => { setShowAddForm(false); setNewEx({ name: '', muscle_group: '', equipment: '' }) }} style={voetKnop(false)}>Annuleren</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowAddForm(true)} style={voetKnop(false)}>
                  <Plus size={14} strokeWidth={2.8} /> Coach DB
                </button>
                {selectedClient && (
                  <button onClick={() => setShowCustomModal(true)} style={voetKnop(false)}>
                    <Plus size={14} strokeWidth={2.8} /> Eigen oefening voor {selectedClient.first_name || 'klant'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`@keyframes exSpin { to { transform: rotate(360deg); } }`}</style>

      {showCustomModal && (
        <CustomExerciseModal
          client={selectedClient}
          db={db}
          onClose={() => setShowCustomModal(false)}
          onSave={(nieuw) => {
            setShowCustomModal(false)
            kies({ name: nieuw.name, spier: nieuw.muscle_group, materiaal: nieuw.equipment, type: 'custom', bron: 'klant', sets: nieuw.sets, reps: nieuw.reps, rest: nieuw.rest })
          }}
        />
      )}
    </div>
  )
}

const voetKnop = (vol) => ({
  flex: 1, minHeight: 42, padding: '0 0.8rem',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  background: vol ? '#fff' : 'transparent',
  border: `1px solid ${vol ? '#fff' : 'rgba(255,255,255,0.18)'}`,
  borderRadius: 10, color: vol ? '#0a0a0a' : '#fff',
  fontSize: '0.8rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
})

// Eén oefening als kaart, in de vorm van de maaltijdkaart: foto links met het
// type erop, naam en spiergroep/materiaal ernaast, een kies-knop rechts.
function OefeningKaart({ ex, isMobile, fotoMaat, onKies, onDelete }) {
  const typeLabel = ex.type === 'compound' ? 'Compound' : ex.type === 'isolation' ? 'Isolatie' : ex.bron === 'klant' ? 'Eigen' : ex.bron === 'coach' ? 'Coach DB' : ''
  const meta = [spierLabel(ex.spier), materiaalLabel(ex.materiaal), ex.klantNaam].filter(Boolean).join(' · ')
  return (
    <div
      onClick={onKies}
      style={{
        margin: isMobile ? '0 0.9rem 0.55rem' : '0 1.25rem 0.7rem',
        background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: 12, overflow: 'hidden',
        display: 'flex', alignItems: 'stretch', minHeight: fotoMaat,
        cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}
      onMouseEnter={(e) => { if (window.innerWidth > 768) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
      onMouseLeave={(e) => { if (window.innerWidth > 768) e.currentTarget.style.background = 'rgba(255,255,255,0.025)' }}
    >
      {/* Foto, of een rustig donker vlak met een halter als er geen foto is. */}
      <div style={{
        width: fotoMaat, flexShrink: 0, position: 'relative', overflow: 'hidden',
        background: ex.foto ? `url(${ex.foto}) center/cover` : '#161616',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {!ex.foto && <Dumbbell size={20} color="rgba(255,255,255,0.25)" strokeWidth={2.2} />}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.8) 100%)' }} />
        {typeLabel && (
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, padding: '0 5px 5px',
            fontSize: '0.58rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.01em',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            textShadow: '0 1px 6px rgba(0,0,0,0.9)', pointerEvents: 'none',
          }}>
            {typeLabel}
          </div>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0, padding: isMobile ? '0.55rem 0.7rem' : '0.65rem 0.9rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3 }}>
        <div style={{ fontSize: isMobile ? '0.92rem' : '0.98rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em', lineHeight: 1.2 }}>
          {ex.name}
        </div>
        {meta && (
          <div style={{ fontSize: isMobile ? '0.72rem' : '0.76rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
            {meta}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: isMobile ? '0.6rem' : '0.8rem', flexShrink: 0 }}>
        {onDelete && (
          <button onClick={(e) => { e.stopPropagation(); onDelete() }} aria-label="Verwijderen" style={{
            width: 32, height: 32, borderRadius: 9, background: 'transparent',
            border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>
            <Trash2 size={13} strokeWidth={2.4} />
          </button>
        )}
        <button onClick={(e) => { e.stopPropagation(); onKies() }} aria-label="Kies" style={{
          minHeight: 34, padding: '0 0.7rem', borderRadius: 9,
          background: '#fff', border: 'none', color: '#0a0a0a',
          fontSize: '0.76rem', fontWeight: 900, fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}>
          <Check size={13} strokeWidth={3} /> Kies
        </button>
      </div>
    </div>
  )
}
