// src/modules/ai-meal-generator/tabs/plan-analyzer/SupplementPanel.jsx
//
// Het supplementenplan van een klant, volledig te beheren vanuit de Plan
// Analyzer: plan maken, supplementen toevoegen/verwijderen, dosering, moment
// en op welke dagen ze gelden.
//
// Waarom hier en niet in de Supplementen-tab: het plan hoort bij het voedings-
// plan dat je aan het bouwen bent. Een tab verderop betekent wisselen van
// context om iets te zien dat op dezelfde dag valt.
//
// Twee dingen die bewust anders zijn dan in de oude tab:
//
// 1. Geen draft/approve-stap. Het plan wordt direct 'active' opgeslagen —
//    dat is de status die de klant leest. De tussenstap leverde alleen
//    plannen op die niemand zag.
//
// 2. Het moment is een échte keuze tussen "bij een maaltijd" en "vaste tijd".
//    De templates vulden allebei in, en omdat specific_time voorgaat kwam
//    meal_reference nooit aan bod. Nu kies je er één: bij een maaltijd
//    schuift het supplement mee als je die maaltijd verzet.

import { useEffect, useState } from 'react'
import { Pill, X, Check, Loader, Dumbbell, Plus, Trash2 } from 'lucide-react'
// SupplementPlanService plakt getSupplementTemplates/enrich… op DatabaseService.
// Zonder deze import bestaan die methodes hier niet: nu leunt het op CoachHub
// die het bestand toevallig ook importeert, en dat is geen afspraak waar je op
// moet bouwen. Het is dezelfde singleton, dus dubbel importeren kost niets.
import DatabaseService from '../../../supplements/SupplementPlanService'
import {
  doseringTekst, momentVanSupplement, minutenNaarKlok,
  DAG_SLEUTELS, DAG_KORT, dagenVanSupplement,
} from '../../../supplements/utils/supplementSchedule'

const MAALTIJD_OPTIES = [
  { id: 'breakfast', label: 'Ontbijt' },
  { id: 'lunch',     label: 'Lunch' },
  { id: 'dinner',    label: 'Diner' },
  { id: 'snack',     label: 'Snack' },
]

// Welke van de drie manieren bepaalt het moment van dit supplement?
const momentModus = (s) => {
  if (s?.timing?.meal_reference) return 'maaltijd'
  if (s?.timing?.specific_time) return 'tijd'
  return 'flexibel'
}

export default function SupplementPanel({ db, clientId, coachId, clientRecord, trainingDays, isMobile, onClose, onSaved }) {
  const m = isMobile
  const [plan, setPlan] = useState(undefined)   // undefined = laden, null = geen plan
  const [supplementen, setSupplementen] = useState([])
  const [templates, setTemplates] = useState([])
  const [toevoegenOpen, setToevoegenOpen] = useState(false)
  // Zelf een supplement maken. Uit app_issues: "in plan analyzer wil ik zelf
  // ook supplementen toevoegen, bijv pre workout." De lijst kwam alleen uit
  // supplement_templates, dus wat daar niet in stond kon je niet toewijzen.
  const [makenOpen, setMakenOpen] = useState(false)
  const [nieuw, setNieuw] = useState({
    name: '', emoji: '💊', category: 'performance', priority_level: 'optional',
    amount: '1', unit: 'scoop', wanneer: 'maaltijd:pre_workout',
    vasteTijd: '07:00', instructions: '',
  })
  const [maakBezig, setMaakBezig] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [vuil, setVuil] = useState(false)
  const [fout, setFout] = useState(null)

  useEffect(() => {
    if (!clientId) { setPlan(null); setSupplementen([]); return }
    let afgebroken = false
    ;(async () => {
      setPlan(undefined)
      const [{ data }, tpl] = await Promise.all([
        db.supabase
          .from('supplement_plans')
          .select('id, supplements, coach_notes')
          .eq('client_id', clientId)
          .eq('status', 'active')
          .order('updated_at', { ascending: false })
          .limit(1),
        DatabaseService.getSupplementTemplates(),
      ])
      if (afgebroken) return
      const rij = data?.[0] || null
      setPlan(rij)
      setSupplementen(Array.isArray(rij?.supplements) ? rij.supplements : [])
      setTemplates(tpl || [])
      setVuil(false)
    })()
    return () => { afgebroken = true }
  }, [db, clientId])

  const pas = (index, wijziging) => {
    setVuil(true)
    setSupplementen(v => v.map((s, i) => i === index ? { ...s, ...wijziging } : s))
  }
  const pasTiming = (index, wijziging) => {
    setVuil(true)
    setSupplementen(v => v.map((s, i) => i === index ? { ...s, timing: { ...(s.timing || {}), ...wijziging } } : s))
  }

  const wisselDag = (index, dag) => {
    const huidig = dagenVanSupplement(supplementen[index])
    const nieuw = huidig.includes(dag) ? huidig.filter(d => d !== dag) : [...huidig, dag]
    pas(index, { days: DAG_SLEUTELS.filter(d => nieuw.includes(d)) })
  }

  const verwijder = (index) => {
    setVuil(true)
    setSupplementen(v => v.filter((_, i) => i !== index))
  }

  // Keuze uit de dropdown omzetten naar het timing-object.
  //
  // supplementSchedule leest de tijd in drie stappen: specific_time hard,
  // dan meal_reference (schuift mee als de coach die maaltijd verzet), dan
  // time_of_day als grove terugval. Vandaar deze drie vormen.
  //
  // Let op: 'pre_workout' bestaat alleen als meal_reference, niet als
  // time_of_day — die terugval kent alleen ochtend/middag/avond/nacht. Als
  // pre-workout daar terecht was gekomen, kreeg het supplement geen tijd en
  // verscheen het nergens op de tijdlijn.
  const bouwTiming = (n) => {
    const [soort, waarde] = String(n.wanneer || '').split(':')
    if (soort === 'maaltijd') {
      return { time_of_day: null, with_meal: true, specific_time: null, meal_reference: waarde, notes: null }
    }
    if (soort === 'vast') {
      return { time_of_day: null, with_meal: false, specific_time: n.vasteTijd || '07:00', meal_reference: null, notes: null }
    }
    return { time_of_day: waarde || 'morning', with_meal: false, specific_time: null, meal_reference: null, notes: null }
  }

  // Slug uit de naam: 'Pre Workout Boost' -> 'pre-workout-boost'. Botst hij
  // met een bestaande, dan komt er een volgnummer achter — supplement_id is
  // waarop de rest van de code supplementen uit elkaar houdt.
  const maakSlug = (naam) => {
    const basis = (naam || '').toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'supplement'
    const bestaand = new Set(templates.map(t => t.supplement_id))
    if (!bestaand.has(basis)) return basis
    let n = 2
    while (bestaand.has(`${basis}-${n}`)) n++
    return `${basis}-${n}`
  }

  const bewaarNieuw = async () => {
    if (maakBezig || nieuw.name.trim().length < 2) return
    setMaakBezig(true); setFout(null)
    try {
      // Alle NOT NULL-kolommen krijgen een waarde. Laat je er één weg, dan
      // weigert de database de hele rij — niet alleen dat veld.
      const rij = {
        supplement_id: maakSlug(nieuw.name),
        name: nieuw.name.trim(),
        emoji: nieuw.emoji || '💊',
        category: nieuw.category,
        priority_level: nieuw.priority_level,
        dosage: { amount: String(nieuw.amount || '1'), unit: nieuw.unit, frequency: 'daily' },
        timing: bouwTiming(nieuw),
        benefits: [],
        instructions: nieuw.instructions.trim() || `${nieuw.amount || '1'} ${nieuw.unit} per dag`,
        active: true,
      }
      const { data, error } = await db.supabase
        .from('supplement_templates').insert([rij]).select('*').single()
      if (error || !data?.id) throw (error || new Error('geen id teruggegeven'))

      // Meteen in de lijst zodat hij niet pas na herladen bestaat, en direct
      // toewijzen — dat is waarom je hem maakte.
      setTemplates(v => [...v, data])
      setMakenOpen(false)
      setNieuw(n => ({ ...n, name: '', instructions: '' }))
      await voegToe(data)
    } catch (e) {
      console.error('Supplement maken mislukt:', e)
      setFout(e.message || 'Supplement maken mislukt')
    } finally {
      setMaakBezig(false)
    }
  }

  const voegToe = async (template) => {
    setToevoegenOpen(false)
    const verrijkt = await DatabaseService.enrichSupplementWithProducts(template)
    setVuil(true)
    setSupplementen(v => [...v, verrijkt])
  }

  // Plan aanmaken. Leeg of met de standaardset — die laatste is gewoon
  // sneller starten, niet iets anders.
  const maakPlan = async (metStandaard) => {
    setBezig(true); setFout(null)
    try {
      // clients heeft geen weight/training_frequency kolom — dat zijn
      // current_weight en het aantal trainingsdagen uit het schema. Met de
      // oude namen kreeg de standaardset altijd 75kg en 4x per week, en
      // sloeg de "whey bij 5+ trainingen"-regel dus nooit aan.
      const gewicht = Math.round(Number(clientRecord?.current_weight) || 0) || 75
      const frequentie = trainingDays?.length || 4
      const start = metStandaard
        ? await DatabaseService.generateSupplementPlanFromTemplate(
            gewicht, frequentie,
            clientRecord?.primary_goal === 'bulk' ? 'bulk' : 'cut')
        : []
      // Terugval op de ingelogde gebruiker: de coachId-prop liep niet overal
      // door, waardoor plannen zonder coach_id ontstonden.
      let coach = coachId || null
      if (!coach) {
        try { coach = (await db.getCurrentUser())?.id || null } catch { coach = null }
      }
      const { data, error } = await db.supabase
        .from('supplement_plans')
        .insert({
          client_id: clientId,
          coach_id: coach,
          supplements: start,
          status: 'active',
          client_weight: Math.round(Number(clientRecord?.current_weight)) || null,
          training_frequency: trainingDays?.length || null,
          goal: clientRecord?.primary_goal || null,
        })
        .select('id, supplements, coach_notes')
        .single()
      if (error) throw error
      setPlan(data)
      setSupplementen(Array.isArray(data.supplements) ? data.supplements : [])
      setVuil(false)
      onSaved?.()
    } catch (e) {
      console.error('Supplementenplan maken mislukt:', e)
      setFout(e.message || 'Aanmaken mislukt')
    } finally { setBezig(false) }
  }

  const opslaan = async () => {
    if (!plan?.id) return
    setBezig(true); setFout(null)
    try {
      const { error } = await db.supabase
        .from('supplement_plans')
        .update({ supplements: supplementen, updated_at: new Date().toISOString() })
        .eq('id', plan.id)
      if (error) throw error
      setVuil(false)
      onSaved?.()
    } catch (e) {
      console.error('Supplementen opslaan mislukt:', e)
      setFout(e.message || 'Opslaan mislukt')
    } finally { setBezig(false) }
  }

  // Automatisch opslaan. Een aparte knop leverde stilletjes verlies op: je
  // klikt dagen aan, sluit het paneel en denkt dat het staat. Nu bewaart hij
  // driekwart seconde na je laatste wijziging; de knop onderin is er nog als
  // bevestiging (en om handmatig te forceren), niet meer als voorwaarde.
  useEffect(() => {
    if (!vuil || !plan?.id || bezig) return
    const t = setTimeout(() => { opslaan() }, 750)
    return () => clearTimeout(t)
    // opslaan hangt aan supplementen/plan; die staan hieronder al in de lijst.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vuil, supplementen, plan?.id])

  const alGekozen = new Set(supplementen.map(s => s.template_id).filter(Boolean))
  const beschikbaar = templates.filter(t => !alGekozen.has(t.supplement_id))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0a0a' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '0.6rem 0.8rem', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0,
      }}>
        <Pill size={15} color="#fff" />
        <span style={{ flex: 1, fontSize: m ? '0.85rem' : '0.9rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
          Supplementen
        </span>
        {supplementen.length > 0 && (
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
            {supplementen.length}
          </span>
        )}
        <button onClick={onClose} style={sluitKnop}><X size={15} /></button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {!clientId ? (
          <Melding>Selecteer eerst een klant.</Melding>
        ) : plan === undefined ? (
          <Melding>Laden…</Melding>
        ) : plan === null ? (
          <div style={{ padding: '1.5rem 1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: '1rem', lineHeight: 1.5 }}>
              Deze klant heeft nog geen supplementenplan.
            </div>
            <button onClick={() => maakPlan(true)} disabled={bezig} style={{ ...primaireKnop, marginBottom: 8 }}>
              {bezig ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={14} />}
              Standaardset
            </button>
            <button onClick={() => maakPlan(false)} disabled={bezig} style={tekstKnop}>
              Of leeg beginnen
            </button>
          </div>
        ) : (
          <>
            {supplementen.map((s, i) => {
              const dagen = dagenVanSupplement(s)
              const modus = momentModus(s)
              const minuten = momentVanSupplement(s)
              return (
                <div key={i} style={{
                  padding: m ? '0.6rem 0.7rem' : '0.65rem 0.85rem',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}>
                  {/* Naam + dosering + weg */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
                    {s.emoji && <span style={{ fontSize: '0.95rem', flexShrink: 0 }}>{s.emoji}</span>}
                    <span style={{
                      flex: 1, minWidth: 0, fontSize: m ? '0.82rem' : '0.88rem', fontWeight: 800, color: '#fff',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {s.name}
                    </span>
                    <input
                      value={s.dosage?.amount ?? ''}
                      onChange={e => pas(i, { dosage: { ...(s.dosage || {}), amount: e.target.value } })}
                      style={{ ...veld, width: 42, textAlign: 'right' }}
                    />
                    <input
                      value={s.dosage?.unit ?? ''}
                      onChange={e => pas(i, { dosage: { ...(s.dosage || {}), unit: e.target.value } })}
                      style={{ ...veld, width: 62 }}
                    />
                    <button onClick={() => verwijder(i)} title="Verwijderen" style={{
                      ...sluitKnop, width: 26, height: 26, border: 'none', background: 'none',
                      color: 'rgba(255,255,255,0.3)',
                    }}><Trash2 size={13} /></button>
                  </div>

                  {/* Moment — één keuze uit drie. Bij "maaltijd" schuift het
                      supplement mee als de coach die maaltijd verzet. */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 7, flexWrap: 'wrap' }}>
                    {['maaltijd', 'tijd', 'flexibel'].map(optie => (
                      <button
                        key={optie}
                        onClick={() => {
                          if (optie === 'maaltijd') pasTiming(i, { meal_reference: s.timing?.meal_reference || 'breakfast', specific_time: null })
                          else if (optie === 'tijd') pasTiming(i, { meal_reference: null, specific_time: s.timing?.specific_time || (minuten != null ? minutenNaarKlok(minuten) : '08:00') })
                          else pasTiming(i, { meal_reference: null, specific_time: null })
                        }}
                        style={keuzeKnop(modus === optie)}
                      >
                        {optie === 'maaltijd' ? 'Bij maaltijd' : optie === 'tijd' ? 'Vaste tijd' : 'Flexibel'}
                      </button>
                    ))}

                    {modus === 'maaltijd' && (
                      <select
                        value={s.timing.meal_reference}
                        onChange={e => pasTiming(i, { meal_reference: e.target.value })}
                        style={{ ...veld, width: 'auto', paddingRight: 4 }}
                      >
                        {MAALTIJD_OPTIES.map(o => <option key={o.id} value={o.id} style={{ background: '#111' }}>{o.label}</option>)}
                      </select>
                    )}
                    {modus === 'tijd' && (
                      <input
                        type="time"
                        value={s.timing.specific_time || ''}
                        onChange={e => pasTiming(i, { specific_time: e.target.value })}
                        style={{ ...veld, width: 78 }}
                      />
                    )}
                  </div>

                  {/* Dagen */}
                  <div style={{ display: 'flex', gap: 3 }}>
                    {DAG_SLEUTELS.map(dag => {
                      const aan = dagen.includes(dag)
                      const traint = trainingDays?.includes(dag)
                      return (
                        <button key={dag} onClick={() => wisselDag(i, dag)}
                          title={traint ? 'Trainingsdag' : undefined}
                          style={{
                            flex: 1, minWidth: 0, padding: '0.3rem 0', position: 'relative',
                            background: aan ? '#fff' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.1)'}`,
                            borderRadius: 6, color: aan ? '#000' : 'rgba(255,255,255,0.4)',
                            fontSize: '0.66rem', fontWeight: 900, fontFamily: 'inherit',
                            cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                          }}>
                          {DAG_KORT[dag]}
                          {traint && (
                            <span style={{
                              position: 'absolute', top: 2, right: 3, width: 3, height: 3,
                              borderRadius: '50%', background: aan ? '#000' : '#3b82f6', opacity: aan ? 0.35 : 1,
                            }} />
                          )}
                        </button>
                      )
                    })}
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 5 }}>
                    <button onClick={() => pas(i, { days: [...DAG_SLEUTELS] })} disabled={dagen.length === 7} style={snelKnop(dagen.length === 7)}>
                      Elke dag
                    </button>
                    {trainingDays?.length > 0 && (
                      <button onClick={() => pas(i, { days: DAG_SLEUTELS.filter(d => trainingDays.includes(d)) })} style={snelKnop(false)}>
                        <Dumbbell size={9} style={{ verticalAlign: -1 }} /> Trainingsdagen
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Toevoegen */}
            <div style={{ padding: m ? '0.6rem 0.7rem' : '0.65rem 0.85rem' }}>
              {!toevoegenOpen ? (
                // Niet meer uitschakelen als de lijst op is: zelf maken kan
                // altijd, en dat is juist waarvoor je hier komt.
                <button onClick={() => setToevoegenOpen(true)} style={{
                  ...tekstKnop, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  padding: '0.6rem', borderRadius: 9,
                  border: '1px dashed rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.6)',
                }}>
                  <Plus size={14} /> Supplement toevoegen
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {beschikbaar.map(t => (
                    <button key={t.supplement_id} onClick={() => voegToe(t)} style={{
                      display: 'flex', alignItems: 'center', gap: 7, width: '100%',
                      padding: '0.55rem 0.6rem', borderRadius: 8,
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      color: '#fff', fontSize: '0.82rem', fontWeight: 800, fontFamily: 'inherit',
                      cursor: 'pointer', textAlign: 'left',
                      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    }}>
                      <span style={{ fontSize: '0.95rem' }}>{t.emoji}</span>
                      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.name}
                      </span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
                        {doseringTekst(t)}
                      </span>
                    </button>
                  ))}
                  {!makenOpen ? (
                    <button onClick={() => setMakenOpen(true)} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      width: '100%', padding: '0.55rem 0.6rem', marginTop: 2,
                      background: '#fff',
                      borderTop: 'none', borderBottom: 'none', borderLeft: 'none', borderRight: 'none',
                      borderRadius: 8, color: '#0a0a0a',
                      fontSize: '0.78rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
                      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    }}>
                      <Plus size={14} /> Zelf een supplement maken
                    </button>
                  ) : (
                    <div style={{
                      display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4,
                      padding: '0.6rem', borderRadius: 8,
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                    }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input value={nieuw.emoji} onChange={e => setNieuw(n => ({ ...n, emoji: e.target.value.slice(0, 2) }))}
                          aria-label="Icoon" style={{ ...invoerStijl, width: 46, textAlign: 'center' }} />
                        <input value={nieuw.name} onChange={e => setNieuw(n => ({ ...n, name: e.target.value }))}
                          placeholder="Naam, bijv. Pre Workout" style={{ ...invoerStijl, flex: 1 }} />
                      </div>

                      <div style={{ display: 'flex', gap: 6 }}>
                        <input value={nieuw.amount} onChange={e => setNieuw(n => ({ ...n, amount: e.target.value }))}
                          aria-label="Hoeveelheid" style={{ ...invoerStijl, width: 64 }} />
                        <select value={nieuw.unit} onChange={e => setNieuw(n => ({ ...n, unit: e.target.value }))}
                          aria-label="Eenheid" style={{ ...invoerStijl, flex: 1 }}>
                          {['scoop', 'capsule', 'tablet', 'gram', 'mg', 'ml', 'druppels'].map(u => (
                            <option key={u} value={u} style={{ background: '#1a1a1a' }}>{u}</option>
                          ))}
                        </select>
                      </div>

                      <select value={nieuw.wanneer} onChange={e => setNieuw(n => ({ ...n, wanneer: e.target.value }))}
                        aria-label="Wanneer" style={invoerStijl}>
                        <optgroup label="Bij een maaltijd — schuift mee">
                          <option value="maaltijd:pre_workout" style={{ background: '#1a1a1a' }}>Bij de pre-workout</option>
                          <option value="maaltijd:breakfast" style={{ background: '#1a1a1a' }}>Bij het ontbijt</option>
                          <option value="maaltijd:lunch" style={{ background: '#1a1a1a' }}>Bij de lunch</option>
                          <option value="maaltijd:dinner" style={{ background: '#1a1a1a' }}>Bij het diner</option>
                        </optgroup>
                        <optgroup label="Grof moment">
                          <option value="dagdeel:morning" style={{ background: '#1a1a1a' }}>Ochtend</option>
                          <option value="dagdeel:afternoon" style={{ background: '#1a1a1a' }}>Middag</option>
                          <option value="dagdeel:evening" style={{ background: '#1a1a1a' }}>Avond</option>
                          <option value="dagdeel:before_bed" style={{ background: '#1a1a1a' }}>Voor het slapen</option>
                        </optgroup>
                        <optgroup label="Vaste tijd">
                          <option value="vast:klok" style={{ background: '#1a1a1a' }}>Op een vast tijdstip…</option>
                        </optgroup>
                      </select>

                      {nieuw.wanneer.startsWith('vast:') && (
                        <input type="time" value={nieuw.vasteTijd}
                          onChange={e => setNieuw(n => ({ ...n, vasteTijd: e.target.value }))}
                          aria-label="Tijdstip" style={invoerStijl} />
                      )}

                      <select value={nieuw.category} onChange={e => setNieuw(n => ({ ...n, category: e.target.value }))}
                        aria-label="Categorie" style={invoerStijl}>
                        {[['performance', 'Prestatie'], ['recovery', 'Herstel'], ['health', 'Gezondheid'],
                          ['hormones', 'Hormonen'], ['convenience', 'Gemak']].map(([w, l]) => (
                          <option key={w} value={w} style={{ background: '#1a1a1a' }}>{l}</option>
                        ))}
                      </select>

                      <input value={nieuw.instructions} onChange={e => setNieuw(n => ({ ...n, instructions: e.target.value }))}
                        placeholder="Instructie (optioneel)" style={invoerStijl} />

                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setMakenOpen(false)} style={{ ...tekstKnop, flex: 1 }}>
                          Terug
                        </button>
                        <button onClick={bewaarNieuw} disabled={maakBezig || nieuw.name.trim().length < 2} style={{
                          flex: 2, padding: '0.55rem',
                          background: nieuw.name.trim().length >= 2 ? '#fff' : 'rgba(255,255,255,0.08)',
                          borderTop: 'none', borderBottom: 'none', borderLeft: 'none', borderRight: 'none',
                          borderRadius: 8,
                          color: nieuw.name.trim().length >= 2 ? '#0a0a0a' : 'rgba(255,255,255,0.3)',
                          fontSize: '0.78rem', fontWeight: 900, fontFamily: 'inherit',
                          cursor: maakBezig ? 'default' : 'pointer',
                        }}>
                          {maakBezig ? 'Opslaan…' : 'Maken en toewijzen'}
                        </button>
                      </div>
                    </div>
                  )}

                  <button onClick={() => { setToevoegenOpen(false); setMakenOpen(false) }} style={{ ...tekstKnop, marginTop: 2 }}>
                    Annuleren
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {plan && (
        <div style={{ padding: '0.6rem 0.8rem', borderTop: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
          {fout && <div style={{ marginBottom: 6, fontSize: '0.75rem', fontWeight: 700, color: '#ef4444' }}>{fout}</div>}
          <button onClick={opslaan} disabled={bezig || !vuil} style={{
            ...primaireKnop, width: '100%',
            background: vuil ? '#fff' : 'rgba(16,185,129,0.12)',
            border: vuil ? '1px solid #fff' : '1px solid rgba(16,185,129,0.4)',
            color: vuil ? '#000' : '#10b981',
            cursor: (bezig || !vuil) ? 'default' : 'pointer',
          }}>
            {bezig ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
              : !vuil ? <Check size={14} /> : null}
            {bezig ? 'Opslaan…' : vuil ? 'Wijzigingen bewaren…' : 'Opgeslagen'}
          </button>
        </div>
      )}
    </div>
  )
}

const Melding = ({ children }) => (
  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 700, lineHeight: 1.5 }}>
    {children}
  </div>
)

const sluitKnop = {
  width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 7, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', flexShrink: 0,
}

const primaireKnop = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  padding: '0.7rem 1.1rem', borderRadius: 9,
  background: '#fff', border: '1px solid #fff', color: '#000',
  fontSize: '0.85rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}

const invoerStijl = {
  padding: '0.5rem 0.55rem',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 6,
  color: '#fff', fontSize: '0.8rem', fontWeight: 700,
  fontFamily: 'inherit', outline: 'none', minWidth: 0,
}

const tekstKnop = {
  background: 'none', border: 'none', padding: '0.4rem',
  color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem', fontWeight: 800,
  fontFamily: 'inherit', cursor: 'pointer',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}

const veld = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, color: '#fff', fontSize: '0.75rem', fontWeight: 800,
  padding: '0.25rem 0.35rem', fontFamily: 'inherit', outline: 'none', minWidth: 0,
}

const keuzeKnop = (aan) => ({
  padding: '0.28rem 0.5rem', borderRadius: 6,
  background: aan ? 'rgba(255,255,255,0.14)' : 'transparent',
  border: `1px solid ${aan ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.08)'}`,
  color: aan ? '#fff' : 'rgba(255,255,255,0.4)',
  fontSize: '0.68rem', fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
})

const snelKnop = (uit) => ({
  background: 'none', border: 'none', padding: 0,
  color: uit ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)',
  fontSize: '0.68rem', fontWeight: 800, fontFamily: 'inherit',
  cursor: uit ? 'default' : 'pointer',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
})
