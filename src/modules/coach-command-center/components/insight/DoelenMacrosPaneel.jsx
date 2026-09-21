// src/modules/coach-command-center/components/insight/DoelenMacrosPaneel.jsx
//
// Waar het traject wordt bijgestuurd: het primaire doel, het doelgewicht, het
// weektempo, en de macro's die daaruit volgen.
//
// Stond in de gegevens-tab, tussen naam en adres. Dat is waar je gegevens
// bijwerkt, niet waar je besluit dat er 150 kcal af moet — dat besluit valt bij
// de gewichtsgrafiek, dus staat dit paneel daar nu onder. Eén plek die deze
// velden schrijft; in de gegevens-tab is het weg, niet gekopieerd.

import React, { useState } from 'react'
import { Check, X, Plus } from 'lucide-react'
import { normalizeGoal } from '../../../macros/macroRules'
import { goalDirection, WEIGHT_GREEN, WEIGHT_RED } from '../../../weight-tracker/utils/weightGoalColor'
import { logClientChanges, pickTrackedFields } from '../../utils/clientChangeLogger'
import { C } from './insightTokens'
import EditableRow from './EditableRow'
import MacroRulesBlock from './MacroRulesBlock'
import MacroRingen from './MacroRingen'

const DOEL_OPTIES = [
  { value: 'cut',      label: 'Afvallen (cut)' },
  { value: 'bulk',     label: 'Aankomen (bulk)' },
  { value: 'recomp',   label: 'Recomp' },
  { value: 'maintain', label: 'Onderhoud' },
]

function DoelRegel({ client, isMobile, onSave }) {
  const [saving, setSaving] = useState(false)
  // De tabel kent historisch fat_loss/muscle_gain/general_fitness naast
  // cut/bulk. Toon de genormaliseerde variant, maar alleen als er echt iets
  // staat — anders zou een lege klant "Onderhoud" lijken.
  const huidig = client?.primary_goal ? normalizeGoal(client.primary_goal) : ''
  const richting = goalDirection(client?.primary_goal, client?.weekly_weight_goal)

  const uitleg =
    richting === 1  ? { tekst: 'Aankomen telt als vooruitgang', kleur: WEIGHT_GREEN }
    : richting === -1 ? { tekst: 'Afvallen telt als vooruitgang', kleur: WEIGHT_GREEN }
    : richting === 0  ? { tekst: 'Geen richting — gewicht blijft neutraal gekleurd', kleur: C.text50 }
    : { tekst: 'Geen doel gekozen — afvallen telt nu als vooruitgang', kleur: WEIGHT_RED }

  const kies = async (v) => {
    setSaving(true)
    await onSave('primary_goal', v === '' ? null : v)
    setSaving(false)
  }

  return (
    <div style={{
      padding: isMobile ? '0.6rem 0.85rem' : '0.65rem 1rem',
      borderBottom: `1px solid ${C.borderItem}`,
      display: 'flex', flexDirection: 'column', gap: '0.4rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <span style={{ fontSize: isMobile ? '0.62rem' : '0.66rem', color: C.text50, letterSpacing: '-0.01em', fontWeight: 800, flexShrink: 0 }}>
          Primair doel
        </span>
        <select
          value={huidig}
          disabled={saving}
          onChange={(e) => kies(e.target.value)}
          style={{
            flex: 1, minWidth: 0, height: 34, padding: '0 0.5rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6,
            color: '#fff', fontSize: isMobile ? '0.88rem' : '0.92rem',
            fontWeight: 800, fontFamily: 'inherit', outline: 'none',
            cursor: saving ? 'wait' : 'pointer',
          }}
        >
          <option value="" style={{ background: '#111' }}>Niet gekozen</option>
          {DOEL_OPTIES.map(o => (
            <option key={o.value} value={o.value} style={{ background: '#111' }}>{o.label}</option>
          ))}
        </select>
      </div>
      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: uitleg.kleur }}>
        {uitleg.tekst}
      </span>
    </div>
  )
}

// ── Macro Rules Block ──
// Twee blokken in één paneel:
//   1. Onderhoud — Mifflin BMR × activity + optionele training/cardio/log
//      correctie. Schrijft clients.tdee + maintenance_settings automatisch,
//      800ms nadat de coach een factor heeft aangepast. Geen knop.
//   2. Macro's — gebruikt OPGESLAGEN tdee + tekort om de macro-targets
//      volgens macroRules te berekenen. "Bereken & opslaan macro's" →
//      schrijft target_calories/protein/carbs/fat.
// De projectie onderaan rekent met de ACTIEF opgeslagen surplus (niet de
// rule-default), zodat coach precies ziet waar de huidige instellingen
// op uitkomen.
// ── Body Fat Target Calculator ──
// Berekent streefgewicht uit huidig+gewenst bodyfat%. Aanname: vetvrije
// massa blijft gelijk (klopt grofweg bij eiwit + krachttraining). De
// uitkomst is een richtpunt — huidig BF% is altijd een schatting, dus
// de output stuurt het traject, niet exact eindstation.
function BodyFatTargetCalculator({ client, db, onClientUpdate, isMobile }) {
  const [liveWeight, setLiveWeight] = useState(null)
  const [currentBfDraft, setCurrentBfDraft] = useState(null)
  const [targetBfDraft, setTargetBfDraft] = useState(null)
  const [busy, setBusy] = useState(false)
  // Standaard dicht. Stond open zodra er nog geen doel-BF% bekend was, maar
  // dat is bij de meeste klanten zo — dan is dit het eerste dat je ziet in een
  // tab waar je meestal voor de macro's komt.
  const [expanded, setExpanded] = useState(false)

  React.useEffect(() => {
    if (!db?.supabase || !client?.id) return
    let cancelled = false
    db.supabase
      .from('weight_challenge_logs')
      .select('weight')
      .eq('client_id', client.id)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data?.weight != null) setLiveWeight(parseFloat(data.weight))
      })
    return () => { cancelled = true }
  }, [db, client?.id])

  const effectiveWeight = liveWeight ?? parseFloat(client?.current_weight) ?? parseFloat(client?.start_weight)

  // Intake-flow slaat soms twee aangrenzende BF-kaarten op (tussenin
  // geklikt). De effectieve waarde is dan het gemiddelde — zelfde
  // logica als IntakePhase1.jsx (effectiveBf). Toon dat zo voor de
  // coach, met een hint waar het vandaan komt.
  const intakeBf1 = parseFloat(client?.current_body_fat)
  const intakeBf2 = parseFloat(client?.current_body_fat_2)
  const intakeAvgBf = (Number.isFinite(intakeBf1) && Number.isFinite(intakeBf2))
    ? Math.round((intakeBf1 + intakeBf2) / 2)
    : (Number.isFinite(intakeBf1) ? intakeBf1 : null)
  const hasIntakeRange = Number.isFinite(intakeBf1) && Number.isFinite(intakeBf2)

  const curBf = currentBfDraft != null && currentBfDraft !== ''
    ? parseFloat(currentBfDraft)
    : intakeAvgBf
  const tarBf = targetBfDraft != null && targetBfDraft !== ''
    ? parseFloat(targetBfDraft)
    : parseFloat(client?.target_body_fat)

  const hasAll = Number.isFinite(effectiveWeight)
              && Number.isFinite(curBf) && curBf > 0 && curBf < 100
              && Number.isFinite(tarBf) && tarBf > 0 && tarBf < 100
  const leanMass = hasAll ? effectiveWeight * (1 - curBf / 100) : null
  const targetWeight = hasAll ? leanMass / (1 - tarBf / 100) : null
  const targetWeightRounded = targetWeight != null ? Math.round(targetWeight * 10) / 10 : null

  const saveField = async (field, val) => {
    if (!db?.supabase || !client?.id) return
    try {
      const before = pickTrackedFields(client)
      await db.supabase.from('clients').update({ [field]: val }).eq('id', client.id)
      onClientUpdate?.({ [field]: val })
      await logClientChanges({ db, clientId: client.id, before, after: { [field]: val }, source: 'data_column_bf' })
    } catch (e) { console.error('saveField', e) }
  }

  const applyToTargetWeight = async () => {
    if (busy || targetWeightRounded == null) return
    setBusy(true)
    try {
      const payload = {
        target_weight: targetWeightRounded,
        goal_weight: targetWeightRounded,
        // ook BF-waardes wegschrijven als coach ze net heeft aangepast
        ...(currentBfDraft != null ? { current_body_fat: parseFloat(currentBfDraft) || null } : {}),
        ...(targetBfDraft != null ? { target_body_fat: parseFloat(targetBfDraft) || null } : {}),
      }
      const before = pickTrackedFields(client)
      await db.supabase.from('clients').update(payload).eq('id', client.id)
      onClientUpdate?.(payload)
      await logClientChanges({ db, clientId: client.id, before, after: payload, source: 'apply_target_weight' })
      setCurrentBfDraft(null); setTargetBfDraft(null)
    } catch (e) { console.error('applyToTargetWeight', e) }
    setBusy(false)
  }

  // Inklap-header
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      borderTop: `1px solid ${C.border}`,
      borderBottom: `1px solid ${C.border}`,
      marginBottom: 2,
    }}>
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          width: '100%',
          padding: isMobile ? '0.55rem 0.75rem' : '0.65rem 1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.05)',
          border: 'none', cursor: 'pointer', color: 'inherit',
        }}
      >
        <span style={{
          fontSize: isMobile ? '0.64rem' : '0.68rem', color: C.gold, fontWeight: 900,
          letterSpacing: '-0.01em',
        }}>
          Streefgewicht uit bodyfat
        </span>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          {!expanded && targetWeightRounded != null && (
            <span style={{
              fontSize: '0.85rem', fontWeight: 900, color: C.gold,
              letterSpacing: '-0.02em',
            }}>
              {targetWeightRounded} kg
            </span>
          )}
          <span style={{ fontSize: '0.72rem', color: C.text50, fontWeight: 700, letterSpacing: '0.05em' }}>
            {expanded ? 'Inklappen ▴' : 'Bewerken ▾'}
          </span>
        </span>
      </button>

      {expanded && (
        <div style={{ padding: isMobile ? '0.5rem 0.75rem 0.6rem' : '0.6rem 1rem 0.7rem' }}>
          {/* Huidig gewicht — read-only */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            padding: '0.35rem 0',
            borderBottom: `1px solid ${C.borderItem}`,
            marginBottom: 6,
          }}>
            <span style={{ fontSize: '0.72rem', color: C.text25, fontWeight: 700, letterSpacing: '-0.01em' }}>
              Huidig gewicht
            </span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>
              {Number.isFinite(effectiveWeight) ? `${effectiveWeight.toFixed(1)} kg` : '—'}
            </span>
          </div>

          {/* Huidig BF% — editable, default uit intake */}
          <BfRow
            label="Huidig bodyfat"
            value={currentBfDraft ?? (intakeAvgBf ?? '')}
            onChange={setCurrentBfDraft}
            onBlur={() => {
              if (currentBfDraft != null && currentBfDraft !== '') {
                saveField('current_body_fat', parseFloat(currentBfDraft) || null)
              }
            }}
            color={C.gold}
            isMobile={isMobile}
          />

          {/* Hint als intake een range gaf (tussen 2 kaarten) */}
          {hasIntakeRange && currentBfDraft == null && (
            <div style={{
              fontSize: '0.72rem', color: C.text25, fontStyle: 'italic',
              padding: '0.2rem 0 0.35rem', letterSpacing: '0.02em',
            }}>
              uit intake: tussen {Math.min(intakeBf1, intakeBf2)}% en {Math.max(intakeBf1, intakeBf2)}% → ~{intakeAvgBf}%
            </div>
          )}

          {/* Doel BF% — editable */}
          <BfRow
            label="Doel bodyfat"
            value={targetBfDraft ?? (client?.target_body_fat ?? '')}
            onChange={setTargetBfDraft}
            onBlur={() => {
              if (targetBfDraft != null && targetBfDraft !== '') {
                saveField('target_body_fat', parseFloat(targetBfDraft) || null)
              }
            }}
            color={C.gold}
            isMobile={isMobile}
          />

          {/* Berekend resultaat */}
          <div style={{
            marginTop: 8,
            padding: '0.55rem 0.65rem',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 8,
          }}>
            <div style={{
              fontSize: '0.72rem', fontWeight: 800, color: C.gold,
              letterSpacing: '-0.01em', marginBottom: 5,
            }}>
              Berekend
            </div>

            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              fontSize: '0.72rem', color: C.text50, fontWeight: 600,
              marginBottom: 4,
            }}>
              <span>Vetvrije massa</span>
              <span style={{ color: C.text, fontWeight: 700 }}>
                {leanMass != null ? `${leanMass.toFixed(1)} kg` : '—'}
              </span>
            </div>

            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              marginTop: 2, marginBottom: 8,
            }}>
              <span style={{
                fontSize: '0.72rem', color: C.gold, fontWeight: 800,
                letterSpacing: '-0.01em',
              }}>
                Streefgewicht
              </span>
              <span style={{
                fontSize: '1.1rem', fontWeight: 900, color: C.gold,
                letterSpacing: '-0.02em',
              }}>
                {targetWeightRounded != null ? `${targetWeightRounded} kg` : '—'}
              </span>
            </div>

            <button
              onClick={applyToTargetWeight}
              disabled={busy || targetWeightRounded == null}
              style={{
                width: '100%',
                padding: '0.5rem',
                background: targetWeightRounded != null
                  ? 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)'
                  : 'rgba(255,255,255,0.04)',
                border: 'none', borderRadius: 6,
                color: targetWeightRounded != null ? '#fff' : C.text25,
                fontSize: '0.72rem', fontWeight: 800,
                cursor: busy || targetWeightRounded == null ? 'default' : 'pointer',
                letterSpacing: '-0.01em',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
            >
              {busy
                ? 'Bezig…'
                : (
                  <>
                    <Check size={11} strokeWidth={3} />
                    Toepassen als doelgewicht
                  </>
                )}
            </button>
          </div>

          <div style={{
            marginTop: 7, fontSize: '0.72rem',
            color: C.text25, fontStyle: 'italic', lineHeight: 1.45,
          }}>
            Aanname: vetvrije massa blijft gelijk (geldt bij eiwit 2g/kg + krachttraining).
            Huidig bodyfat is een schatting — behandel uitkomst als richtpunt, niet exact eindstation.
          </div>
        </div>
      )}
    </div>
  )
}

// Welk primair doel hoort bij welke fase. De fase is de afspraak; het primaire
// doel is wat de macro-regels en de kleuren in de app ermee doen. Die twee uit
// elkaar laten lopen betekent een build-klant die overal rood kleurt omdat het
// systeem denkt dat hij aan het afvallen is.
const DOEL_BIJ_FASE = { cut: 'cut', build: 'bulk', recomp: 'recomp', maintain: 'maintain' }

export default function DoelenMacrosPaneel({ client, db, onClientUpdate, isMobile, fase = null, voorstel = null, onVoorstelWeg }) {
  const [meerDoelVelden, setMeerDoelVelden] = useState(false)
  const [bezigVoorstel, setBezigVoorstel] = useState(false)

  // Het voorstel uit de coaching-band: zoveel kcal erbij of eraf. Toepassen
  // verandert alleen het tekort; de macro's herberekent de coach daarna zelf
  // met de knop in het paneel hieronder. Automatisch doorrekenen zou een
  // wijziging op de borden van de klant zetten die niemand heeft gezien.
  const huidigSurplus = Number.isFinite(parseFloat(client?.surplus)) ? parseFloat(client.surplus) : 0
  // clients.surplus is een integer in de database; een halve kcal weigert
  // PostgREST en dan faalt de hele update.
  const nieuwSurplus = Math.round(huidigSurplus + (Number(voorstel) || 0))

  const pasVoorstelToe = async () => {
    if (!db?.supabase || !client?.id || !voorstel) return
    setBezigVoorstel(true)
    try {
      const before = pickTrackedFields(client)
      const { error } = await db.supabase.from('clients').update({ surplus: nieuwSurplus }).eq('id', client.id)
      if (error) throw error
      onClientUpdate?.({ surplus: nieuwSurplus })
      await logClientChanges({ db, clientId: client.id, before, after: { surplus: nieuwSurplus }, source: 'coaching_band_voorstel' })
      onVoorstelWeg?.()
    } catch (e) {
      console.error('Voorstel toepassen mislukt:', e)
    } finally {
      setBezigVoorstel(false)
    }
  }

  // Zelfde opslagpad als de gegevens-tab: één veld tegelijk, met een regel in
  // het logboek zodat later terug te zien is wie wat wanneer veranderde.
  const handleFieldSave = async (field, value) => {
    if (!db?.supabase || !client?.id) return
    try {
      const before = pickTrackedFields(client)
      const { error } = await db.supabase.from('clients').update({ [field]: value }).eq('id', client.id)
      if (error) { console.error('❌ Field save error:', error); return }
      onClientUpdate?.({ [field]: value })
      await logClientChanges({ db, clientId: client.id, before, after: { [field]: value }, source: 'doelen_paneel' })
    } catch (e) { console.error('❌ Save error:', e) }
  }

  // Loopt het primaire doel uit de pas met de fase? Niet stilletjes
  // rechttrekken: een schrijfactie bij het openen van een kaart is precies wat
  // je niet wil. Wel laten zien, met een knop ernaast.
  const hoortBij = fase?.doel ? DOEL_BIJ_FASE[fase.doel] : null
  const scheef = hoortBij && normalizeGoal(client?.primary_goal) !== hoortBij

  const E = ({ label, value, field, type, options, suffix }) => (
    <EditableRow label={label} value={value} field={field} type={type} options={options}
      suffix={suffix} isMobile={isMobile} onSave={handleFieldSave} />
  )

  return (
    <div>
      {/* Wat er nu op het bord van de klant staat. Eerst kijken, dan pas
          rekenen: negen van de tien keer open je dit paneel om te zien wat hij
          volgt, niet om iets te veranderen. */}
      <MacroRingen client={client} isMobile={isMobile} />

      {voorstel ? (
        <div style={{
          margin: isMobile ? '0.6rem 0.85rem' : '0.7rem 1rem',
          padding: '0.7rem 0.8rem', borderRadius: 12,
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.18)',
        }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#fff' }}>
            Voorstel uit de gewichtsgrafiek
          </div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 2, lineHeight: 1.4 }}>
            Tekort van {huidigSurplus > 0 ? '+' : ''}{huidigSurplus} naar {nieuwSurplus > 0 ? '+' : ''}{nieuwSurplus} kcal per dag.
            Daarna zelf de macro's herberekenen hieronder.
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button onClick={pasVoorstelToe} disabled={bezigVoorstel} style={{
              minHeight: 34, padding: '0 0.7rem', borderRadius: 9, border: 'none',
              background: '#fff', color: '#0a0a0a', fontSize: '0.74rem', fontWeight: 900,
              fontFamily: 'inherit', cursor: 'pointer', opacity: bezigVoorstel ? 0.6 : 1,
            }}>
              {bezigVoorstel ? 'Bezig…' : 'Tekort aanpassen'}
            </button>
            <button onClick={onVoorstelWeg} style={{
              minHeight: 34, padding: '0 0.7rem', borderRadius: 9,
              background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.5)', fontSize: '0.74rem', fontWeight: 800,
              fontFamily: 'inherit', cursor: 'pointer',
            }}>
              Niet nu
            </button>
          </div>
        </div>
      ) : null}
        {/* Primair doel staat bovenaan zodat het MacroRulesBlock-paneel
            er meteen op kan reageren (de modus stuurt de regels). */}
        {/* Het primaire doel volgt de fase. Staat er iets anders, dan is dat
            een restant van vóór de fase — één klik om het gelijk te trekken. */}
        {scheef && (
          <div style={{
            margin: isMobile ? '0 0.85rem 0.6rem' : '0 1rem 0.7rem',
            padding: '0.6rem 0.7rem', borderRadius: 10,
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)',
            display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
          }}>
            <span style={{ flex: 1, minWidth: 140, fontSize: '0.72rem', fontWeight: 800, color: '#f59e0b', lineHeight: 1.4 }}>
              De fase is {fase.doel}, maar het primaire doel staat op iets anders. De macro-regels en de kleuren volgen het primaire doel.
            </span>
            <button
              onClick={() => handleFieldSave('primary_goal', hoortBij)}
              style={{
                minHeight: 30, padding: '0 0.6rem', borderRadius: 8, border: 'none',
                background: '#f59e0b', color: '#0a0a0a', fontSize: '0.72rem', fontWeight: 900,
                fontFamily: 'inherit', cursor: 'pointer',
              }}
            >
              Gelijktrekken
            </button>
          </div>
        )}
        <DoelRegel client={client} isMobile={isMobile} onSave={handleFieldSave} />
        <E label="Doelgewicht"  value={client.target_weight ? parseFloat(client.target_weight).toFixed(1) : null} field="target_weight" type="number" suffix=" kg" />
        <E label="Deadline"     value={client.goal_deadline ? client.goal_deadline.split('T')[0] : null} field="goal_deadline" />

        {/* Streefgewicht-rekenaar via huidig/doel bodyfat%. Aanname: vetvrije
            massa blijft gelijk. Coach kan resultaat met één klik in
            target_weight zetten — dat voedt vervolgens MacroRulesBlock. */}
        <BodyFatTargetCalculator client={client} db={db} onClientUpdate={onClientUpdate} isMobile={isMobile} />

        {/* Het hart van de doelen-tab: maintenance, tekort, macro-targets
            en projectie naar het traject-einde. Voorheen apart in 'macros'. */}
        <MacroRulesBlock client={client} db={db} onClientUpdate={onClientUpdate} isMobile={isMobile} />

        {/* Deze twee voeden de rekenaars hierboven, dus die blijven staan.
            Heette "Wk afval", wat voor een bulker nergens op slaat; het teken
            hoeft niet te kloppen, de richting komt uit het primaire doel. */}
        <E label="Doel vet %"   value={client.target_body_fat} field="target_body_fat" type="number" suffix="%" />
        <E label="Weekdoel"     value={client.weekly_weight_goal} field="weekly_weight_goal" type="number" suffix=" kg/wk" />

        <button
          onClick={() => setMeerDoelVelden(v => !v)}
          style={{
            width: '100%', padding: isMobile ? '0.55rem 0.85rem' : '0.6rem 1rem',
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', borderBottom: `1px solid ${C.borderItem}`,
            color: '#fff', fontFamily: 'inherit',
            fontSize: '0.82rem', fontWeight: 900, cursor: 'pointer', textAlign: 'left',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>
          {meerDoelVelden ? 'Minder velden ▴' : 'Meer velden ▾'}
        </button>

        {meerDoelVelden && (<>
          <E label="Tijdlijn"     value={client.goal_timeline}  field="goal_timeline" />
          <E label="Urgentie"     value={client.goal_urgency}   field="goal_urgency" options={['low', 'moderate', 'high', 'extreme']} />
          <E label="Motivatie"    value={client.motivation}     field="motivation" />
          <E label="Obstakels"    value={client.biggest_obstacle} field="biggest_obstacle" />
        </>)}
    </div>
  )
}

