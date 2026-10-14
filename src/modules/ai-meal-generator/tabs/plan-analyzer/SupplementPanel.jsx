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
import { Pill, Check, Loader, Dumbbell, Plus, Trash2, ShoppingCart } from 'lucide-react'
import SupplementProductenModal from '../../../supplements/SupplementProductenModal'
// SupplementPlanService plakt getSupplementTemplates/enrich… op DatabaseService.
// Zonder deze import bestaan die methodes hier niet: nu leunt het op CoachHub
// die het bestand toevallig ook importeert, en dat is geen afspraak waar je op
// moet bouwen. Het is dezelfde singleton, dus dubbel importeren kost niets.
import DatabaseService from '../../../supplements/SupplementPlanService'
import { supplementFoto } from '../../../supplements/utils/supplementFoto'
import { useProductFotos } from '../../../supplements/utils/productFoto'
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

export default function SupplementPanel({ db, clientId, coachId, clientRecord, trainingDays, isMobile, onSaved }) {
  const m = isMobile
  const [plan, setPlan] = useState(undefined)   // undefined = laden, null = geen plan
  const [supplementen, setSupplementen] = useState([])
  const [templates, setTemplates] = useState([])
  const [toevoegenOpen, setToevoegenOpen] = useState(false)
  // Supplement waarvan de winkels (Waar koop je het) open staan.
  const [winkelsVan, setWinkelsVan] = useState(null)
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
  const productFotos = useProductFotos()
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

  // Korte samenvatting onder de naam: wanneer en hoe vaak, in gewone taal.
  const momentTekst = (s) => {
    const modus = momentModus(s)
    if (modus === 'maaltijd') {
      const o = MAALTIJD_OPTIES.find(x => x.id === s.timing?.meal_reference)
      return o ? `Bij ${o.label.toLowerCase()}` : 'Bij pre-workout'
    }
    if (modus === 'tijd') return s.timing?.specific_time || 'Vaste tijd'
    return 'Flexibel'
  }
  const dagenTekst = (dagen) => dagen.length === 7 ? 'elke dag'
    : dagen.length === 0 ? 'geen dagen' : `${dagen.length} dagen`

  const kolommen = m ? 2 : 3

  return (
    // De kop (naam + sluiten) staat al in het zijvak van de analyzer; een
    // tweede kop hier gaf twee keer "Supplementen" boven elkaar.
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0a0a' }}>
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {!clientId ? (
          <Melding>Selecteer eerst een klant.</Melding>
        ) : plan === undefined ? (
          <Melding>Laden…</Melding>
        ) : plan === null ? (
          <div style={{ padding: '1.75rem 1rem', textAlign: 'center' }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, margin: '0 auto 0.9rem',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><Pill size={22} color="#fff" /></div>
            <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', marginBottom: 4 }}>
              Nog geen supplementenplan
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '1.1rem', lineHeight: 1.5 }}>
              Start met de standaardset op basis van gewicht en trainingen, of begin leeg.
            </div>
            <button onClick={() => maakPlan(true)} disabled={bezig} style={{ ...primaireKnop, width: '100%', marginBottom: 6 }}>
              {bezig ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={14} />}
              Standaardset
            </button>
            <button onClick={() => maakPlan(false)} disabled={bezig} style={tekstKnop}>
              Of leeg beginnen
            </button>
          </div>
        ) : (
          <>
            <div style={{
              display: 'flex', alignItems: 'baseline', gap: 6,
              padding: m ? '0.75rem 0.85rem 0.25rem' : '0.85rem 1rem 0.3rem',
            }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                In het plan
              </span>
              <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#fff' }}>{supplementen.length}</span>
            </div>

            {supplementen.length === 0 && (
              <div style={{ margin: '0.4rem 0.85rem', padding: '1rem', borderRadius: 12, border: '1px dashed rgba(255,255,255,0.12)', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>
                Nog niets toegevoegd.
              </div>
            )}

            {supplementen.map((s, i) => {
              const dagen = dagenVanSupplement(s)
              const modus = momentModus(s)
              const minuten = momentVanSupplement(s)
              return (
                <div key={i} style={{
                  margin: m ? '0.45rem 0.7rem' : '0.5rem 0.85rem',
                  background: '#141414', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 14, overflow: 'hidden',
                }}>
                  {/* Foto + naam + samenvatting */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '0.7rem 0.7rem 0.6rem' }}>
                    <Foto supp={s} maat={52} product={productFotos[s.template_id]} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: m ? '0.88rem' : '0.94rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.01em',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {s.name}
                      </div>
                      <div style={{
                        marginTop: 2, fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {[s.dosage?.amount && `${s.dosage.amount} ${s.dosage.unit || ''}`.trim(), momentTekst(s), dagenTekst(dagen)].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    {s.template_id && (
                      <button onClick={() => setWinkelsVan(s)} title="Waar koop je het: winkels en producten" style={iconKnop}>
                        <ShoppingCart size={15} />
                      </button>
                    )}
                    <button onClick={() => verwijder(i)} title="Verwijderen" style={{ ...iconKnop, color: 'rgba(255,255,255,0.35)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div style={{ padding: '0 0.7rem 0.75rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Dosering */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={rijLabel}>Dosering</span>
                      <input
                        value={s.dosage?.amount ?? ''}
                        onChange={e => pas(i, { dosage: { ...(s.dosage || {}), amount: e.target.value } })}
                        aria-label="Hoeveelheid"
                        style={{ ...veld, width: 54, textAlign: 'right' }}
                      />
                      <input
                        value={s.dosage?.unit ?? ''}
                        onChange={e => pas(i, { dosage: { ...(s.dosage || {}), unit: e.target.value } })}
                        aria-label="Eenheid"
                        style={{ ...veld, flex: 1 }}
                      />
                    </div>

                    {/* Moment — één keuze uit drie. Bij "maaltijd" schuift het
                        supplement mee als de coach die maaltijd verzet. */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={rijLabel}>Moment</span>
                      <div style={{ display: 'flex', flex: 1, minWidth: 180, padding: 2, gap: 2, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        {['maaltijd', 'tijd', 'flexibel'].map(optie => (
                          <button
                            key={optie}
                            onClick={() => {
                              if (optie === 'maaltijd') pasTiming(i, { meal_reference: s.timing?.meal_reference || 'breakfast', specific_time: null })
                              else if (optie === 'tijd') pasTiming(i, { meal_reference: null, specific_time: s.timing?.specific_time || (minuten != null ? minutenNaarKlok(minuten) : '08:00') })
                              else pasTiming(i, { meal_reference: null, specific_time: null })
                            }}
                            style={segment(modus === optie)}
                          >
                            {optie === 'maaltijd' ? 'Bij maaltijd' : optie === 'tijd' ? 'Vaste tijd' : 'Flexibel'}
                          </button>
                        ))}
                      </div>
                      {modus === 'maaltijd' && (
                        <select
                          value={s.timing.meal_reference}
                          onChange={e => pasTiming(i, { meal_reference: e.target.value })}
                          style={{ ...veld, width: 'auto' }}
                        >
                          {!MAALTIJD_OPTIES.some(o => o.id === s.timing.meal_reference) && (
                            <option value={s.timing.meal_reference} style={{ background: '#111' }}>Pre-workout</option>
                          )}
                          {MAALTIJD_OPTIES.map(o => <option key={o.id} value={o.id} style={{ background: '#111' }}>{o.label}</option>)}
                        </select>
                      )}
                      {modus === 'tijd' && (
                        <input
                          type="time"
                          value={s.timing.specific_time || ''}
                          onChange={e => pasTiming(i, { specific_time: e.target.value })}
                          style={{ ...veld, width: 92, colorScheme: 'dark' }}
                        />
                      )}
                    </div>

                    {/* Dagen */}
                    <div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {DAG_SLEUTELS.map(dag => {
                          const aan = dagen.includes(dag)
                          const traint = trainingDays?.includes(dag)
                          return (
                            <button key={dag} onClick={() => wisselDag(i, dag)}
                              title={traint ? 'Trainingsdag' : undefined}
                              style={{
                                flex: 1, minWidth: 0, height: 32, position: 'relative',
                                background: aan ? '#fff' : 'rgba(255,255,255,0.04)',
                                border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.1)'}`,
                                borderRadius: 8, color: aan ? '#000' : 'rgba(255,255,255,0.45)',
                                fontSize: '0.7rem', fontWeight: 900, fontFamily: 'inherit',
                                cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                              }}>
                              {DAG_KORT[dag]}
                              {traint && (
                                <span style={{
                                  position: 'absolute', bottom: 3, left: '50%', marginLeft: -2, width: 4, height: 4,
                                  borderRadius: '50%', background: '#10b981',
                                }} />
                              )}
                            </button>
                          )
                        })}
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                        <button onClick={() => pas(i, { days: [...DAG_SLEUTELS] })} disabled={dagen.length === 7} style={snelKnop(dagen.length === 7)}>
                          Elke dag
                        </button>
                        {trainingDays?.length > 0 && (
                          <button onClick={() => pas(i, { days: DAG_SLEUTELS.filter(d => trainingDays.includes(d)) })} style={snelKnop(false)}>
                            <Dumbbell size={11} /> Trainingsdagen
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Toevoegen */}
            <div style={{ padding: m ? '0.5rem 0.7rem 0.9rem' : '0.6rem 0.85rem 1rem' }}>
              {!toevoegenOpen ? (
                // Niet meer uitschakelen als de lijst op is: zelf maken kan
                // altijd, en dat is juist waarvoor je hier komt.
                <button onClick={() => setToevoegenOpen(true)} style={{
                  ...tekstKnop, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '0.8rem', borderRadius: 12,
                  border: '1px dashed rgba(255,255,255,0.18)',
                  color: '#fff', fontSize: '0.84rem',
                }}>
                  <Plus size={15} /> Supplement toevoegen
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ flex: 1, fontSize: '0.7rem', fontWeight: 900, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Kies een supplement
                    </span>
                    <button onClick={() => { setToevoegenOpen(false); setMakenOpen(false) }} style={{ ...tekstKnop, padding: '0.2rem 0' }}>
                      Annuleren
                    </button>
                  </div>

                  {beschikbaar.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${kolommen}, minmax(0, 1fr))`, gap: 8 }}>
                      {beschikbaar.map(t => (
                        <button key={t.supplement_id} onClick={() => voegToe(t)} style={{
                          display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden',
                          borderRadius: 12, background: '#141414', border: '1px solid rgba(255,255,255,0.08)',
                          color: '#fff', fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left',
                          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                        }}>
                          <div style={{
                            position: 'relative', width: '100%', aspectRatio: '16 / 10',
                            background: productFotos[t.supplement_id]
                              ? `#fff url(${productFotos[t.supplement_id]}) center/contain no-repeat`
                              : `#1a1a1a url(${supplementFoto(t, 320)}) center/cover`,
                          }}>
                            <span style={{
                              position: 'absolute', right: 6, top: 6, width: 24, height: 24, borderRadius: 7,
                              background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}><Plus size={14} color="#fff" /></span>
                          </div>
                          <div style={{ padding: '0.5rem 0.6rem 0.6rem', minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 900, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {t.emoji ? `${t.emoji} ` : ''}{t.name}
                            </div>
                            <div style={{ marginTop: 2, fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {doseringTekst(t)}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {!makenOpen ? (
                    <button onClick={() => setMakenOpen(true)} style={{ ...primaireKnop, width: '100%', marginTop: 2 }}>
                      <Plus size={14} /> Zelf een supplement maken
                    </button>
                  ) : (
                    <div style={{
                      display: 'flex', flexDirection: 'column', gap: 8, marginTop: 2,
                      padding: '0.75rem', borderRadius: 12,
                      background: '#141414', border: '1px solid rgba(255,255,255,0.1)',
                    }}>
                      <div style={{ fontSize: '0.84rem', fontWeight: 900, color: '#fff' }}>Nieuw supplement</div>
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
                          aria-label="Tijdstip" style={{ ...invoerStijl, colorScheme: 'dark' }} />
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
                          ...primaireKnop, flex: 2, padding: '0.6rem',
                          background: nieuw.name.trim().length >= 2 ? '#fff' : 'rgba(255,255,255,0.08)',
                          border: 'none',
                          color: nieuw.name.trim().length >= 2 ? '#0a0a0a' : 'rgba(255,255,255,0.3)',
                          cursor: maakBezig ? 'default' : 'pointer',
                        }}>
                          {maakBezig ? 'Opslaan…' : 'Maken en toewijzen'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {plan && (
        <div style={{ padding: '0.6rem 0.8rem', borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
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
      {winkelsVan && (
        <SupplementProductenModal db={db} categorie={winkelsVan.template_id} naam={winkelsVan.name}
          emoji={winkelsVan.emoji} coachId={coachId} isMobile={m} onClose={() => setWinkelsVan(null)} />
      )}
    </div>
  )
}

// Productfoto uit de catalogus (Big Buffalo eerst) op wit, anders de stockfoto
// met de emoji als badge; valt terug op alleen de emoji als niets laadt.
const Foto = ({ supp, maat, product }) => {
  const [kapot, setKapot] = useState(false)
  return (
    <div style={{
      position: 'relative', width: maat, height: maat, flexShrink: 0,
      borderRadius: 11, overflow: 'hidden', background: product ? '#fff' : '#1f1f1f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {!kapot
        ? <img src={product || supplementFoto(supp, maat * 2)} alt="" loading="lazy" onError={() => setKapot(true)}
            style={{ width: '100%', height: '100%', objectFit: product ? 'contain' : 'cover' }} />
        : <span style={{ fontSize: maat * 0.45 }}>{supp?.emoji || '💊'}</span>}
      {!kapot && !product && supp?.emoji && (
        <span style={{
          position: 'absolute', right: 2, bottom: 2, width: 20, height: 20, borderRadius: 6,
          background: 'rgba(0,0,0,0.65)', fontSize: 11,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{supp.emoji}</span>
      )}
    </div>
  )
}

const Melding = ({ children }) => (
  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 700, lineHeight: 1.5 }}>
    {children}
  </div>
)

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
  borderRadius: 8,
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
  borderRadius: 8, color: '#fff', fontSize: '0.78rem', fontWeight: 800,
  padding: '0.38rem 0.5rem', fontFamily: 'inherit', outline: 'none', minWidth: 0,
}

const segment = (aan) => ({
  flex: 1, padding: '0.38rem 0.3rem', borderRadius: 7, border: 'none',
  background: aan ? '#fff' : 'transparent',
  color: aan ? '#000' : 'rgba(255,255,255,0.55)',
  fontSize: '0.7rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
})

const rijLabel = {
  width: 62, flexShrink: 0,
  fontSize: '0.68rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)',
}

const iconKnop = {
  width: 32, height: 32, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9,
  color: 'rgba(255,255,255,0.75)', cursor: 'pointer',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}

const snelKnop = (uit) => ({
  display: 'inline-flex', alignItems: 'center', gap: 4,
  background: uit ? 'transparent' : 'rgba(255,255,255,0.05)',
  border: `1px solid ${uit ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)'}`,
  borderRadius: 999, padding: '0.25rem 0.6rem',
  color: uit ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.75)',
  fontSize: '0.68rem', fontWeight: 800, fontFamily: 'inherit',
  cursor: uit ? 'default' : 'pointer',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
})
