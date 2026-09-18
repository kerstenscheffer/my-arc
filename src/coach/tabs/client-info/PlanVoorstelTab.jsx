// src/coach/tabs/client-info/PlanVoorstelTab.jsx
//
// Het planvoorstel bij een intake: links wat er besproken of ingevuld is,
// rechts wat het plan wordt. Vier blokken (training, macro's, voedingsschema,
// video) plus een lijstje om in de call na te lopen.
//
// Waarom in de intake-modal en niet als los scherm: je leest de intake juist
// om te bepalen wat je gaat doen. Het voorstel hoort op dezelfde plek als de
// antwoorden waar het uit volgt.
//
// De rijen staan in client_plan_proposals, één lopend voorstel per klant
// (unieke index op client_id waar status <> 'verwerkt'). De coach ziet alleen
// zijn eigen rijen; klanten hebben geen leesrecht.

import { useCallback, useEffect, useState } from 'react'
import {
  FileText, Pencil, Check, X, Plus, Trash2, ArrowRight, Clock, Sparkles,
} from 'lucide-react'

const GREEN = '#10b981'
const ORANJE = '#f59e0b'
const KAART = 'rgba(255,255,255,0.03)'
const LIJN = 'rgba(255,255,255,0.08)'

// De volgorde waarin de blokken op het A4 staan. `soort` bepaalt of een regel
// uit een paar (besproken → plan) of uit één tekst bestaat.
const BLOKKEN = [
  { veld: 'training', titel: 'Training en activiteit', soort: 'paar' },
  { veld: 'macros',   titel: "Macro's",                soort: 'paar' },
  { veld: 'voeding',  titel: 'Voedingsschema',         soort: 'paar' },
  { veld: 'video',    titel: 'Video',                  soort: 'tekst' },
]

// Klikken loopt hier doorheen. 'verwerkt' is het eindpunt van een voorstel,
// maar je kunt terug: een voorstel dat te vroeg is afgevinkt hoef je niet
// opnieuw te maken.
const STATUSSEN = [
  { id: 'concept',   label: 'Concept',   kleur: 'rgba(255,255,255,0.5)' },
  { id: 'besproken', label: 'Besproken', kleur: ORANJE },
  { id: 'verwerkt',  label: 'Verwerkt',  kleur: GREEN },
]

const leeg = (v) => !Array.isArray(v) || v.length === 0

export default function PlanVoorstelTab({ db, client, isMobile, onBestaatChange }) {
  const [voorstel, setVoorstel] = useState(null)
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState(null)
  // Welk blok staat open om te bewerken, en de concept-waarde daarvan.
  const [bewerkt, setBewerkt] = useState(null)   // 'training' | … | 'checks'
  const [concept, setConcept] = useState([])
  const [bezig, setBezig] = useState(false)

  const laad = useCallback(async () => {
    if (!client?.id || !db?.supabase) return
    setLaden(true); setFout(null)
    try {
      // Nieuwste eerst: een verwerkt voorstel blijft zo zichtbaar tot er een
      // nieuw concept ligt. Anders viel de tab leeg op het moment dat je hem
      // op verwerkt zette.
      const { data, error } = await db.supabase
        .from('client_plan_proposals')
        .select('*')
        .eq('client_id', client.id)
        .order('updated_at', { ascending: false })
        .limit(1)
      if (error) throw error
      const rij = data?.[0] || null
      setVoorstel(rij)
      onBestaatChange?.(!!rij)
    } catch (e) {
      console.error('Planvoorstel laden mislukt:', e)
      setFout(e.message || 'Laden mislukt')
    } finally {
      setLaden(false)
    }
  }, [db, client?.id, onBestaatChange])

  useEffect(() => { laad() }, [laad])

  const bewaar = async (veld, waarde) => {
    if (!voorstel?.id) return
    setBezig(true)
    const vorig = voorstel
    // Meteen tonen wat je net typte; bij een fout zetten we het terug.
    setVoorstel(v => ({ ...v, [veld]: waarde, generated_by: 'coach' }))
    try {
      const { data, error } = await db.supabase
        .from('client_plan_proposals')
        .update({ [veld]: waarde, generated_by: 'coach', updated_at: new Date().toISOString() })
        .eq('id', voorstel.id)
        .select()
        .single()
      if (error) throw error
      setVoorstel(data)
      setBewerkt(null)
    } catch (e) {
      console.error('Planvoorstel opslaan mislukt:', e)
      setVoorstel(vorig)
      setFout(e.message || 'Opslaan mislukt')
    } finally {
      setBezig(false)
    }
  }

  const volgendeStatus = async () => {
    if (!voorstel?.id || bezig) return
    const i = STATUSSEN.findIndex(s => s.id === voorstel.status)
    const nieuw = STATUSSEN[(i + 1) % STATUSSEN.length].id
    setBezig(true)
    const vorig = voorstel.status
    setVoorstel(v => ({ ...v, status: nieuw }))
    try {
      const { error } = await db.supabase
        .from('client_plan_proposals')
        .update({ status: nieuw, updated_at: new Date().toISOString() })
        .eq('id', voorstel.id)
      if (error) throw error
    } catch (e) {
      console.error('Status wisselen mislukt:', e)
      setVoorstel(v => ({ ...v, status: vorig }))
      // De unieke index laat maar één lopend voorstel per klant toe; loopt hij
      // daarop stuk, dan zegt de melding dat in plaats van alleen "mislukt".
      setFout(
        String(e.message || '').includes('client_plan_proposals_een_lopend')
          ? 'Er ligt al een lopend voorstel voor deze klant. Zet die eerst op verwerkt.'
          : (e.message || 'Status wisselen mislukt')
      )
    } finally {
      setBezig(false)
    }
  }

  if (laden) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
        padding: '2rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem',
      }}>
        <Clock size={16} /> Plan laden…
      </div>
    )
  }

  if (!voorstel) return <LegeStaat fout={fout} />

  const statusInfo = STATUSSEN.find(s => s.id === voorstel.status) || STATUSSEN[0]

  return (
    <div>
      {fout && <Foutregel tekst={fout} onSluit={() => setFout(null)} />}

      {/* Status + herkomst op één regel: waar het voorstel vandaan komt en
          hoe ver het is, zonder er een balk van te maken. */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        marginBottom: '1rem',
      }}>
        <button
          onClick={volgendeStatus}
          disabled={bezig}
          title="Klik om de status te wisselen"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            minHeight: 28, padding: '0 0.7rem', borderRadius: 999,
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${statusInfo.kleur === 'rgba(255,255,255,0.5)' ? LIJN : statusInfo.kleur + '59'}`,
            color: statusInfo.kleur, fontSize: '0.7rem', fontWeight: 800,
            cursor: bezig ? 'default' : 'pointer', fontFamily: 'inherit',
            opacity: bezig ? 0.6 : 1,
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusInfo.kleur }} />
          {statusInfo.label}
        </button>
        <span style={{ fontSize: '0.66rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>
          {voorstel.generated_by === 'coach' ? 'Door jou aangepast' : 'Automatisch opgesteld'}
          {voorstel.updated_at ? ` · ${new Date(voorstel.updated_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}` : ''}
        </span>
      </div>

      {BLOKKEN.map(blok => (
        <Blok
          key={blok.veld}
          titel={blok.titel}
          soort={blok.soort}
          rijen={Array.isArray(voorstel[blok.veld]) ? voorstel[blok.veld] : []}
          isMobile={isMobile}
          bewerken={bewerkt === blok.veld}
          bezig={bezig}
          concept={concept}
          onConcept={setConcept}
          onStart={() => {
            setBewerkt(blok.veld)
            setConcept(JSON.parse(JSON.stringify(voorstel[blok.veld] || [])))
          }}
          onAnnuleer={() => setBewerkt(null)}
          onBewaar={() => bewaar(blok.veld, concept)}
        />
      ))}

      {/* Check in de call — oranje, want dit is het enige wat nog open staat
          op het moment dat je de klant spreekt. */}
      <Blok
        titel="Check in de call"
        soort="tekst"
        accent={ORANJE}
        rijen={Array.isArray(voorstel.checks) ? voorstel.checks : []}
        isMobile={isMobile}
        bewerken={bewerkt === 'checks'}
        bezig={bezig}
        concept={concept}
        onConcept={setConcept}
        onStart={() => { setBewerkt('checks'); setConcept([...(voorstel.checks || [])]) }}
        onAnnuleer={() => setBewerkt(null)}
        onBewaar={() => bewaar('checks', concept)}
      />
    </div>
  )
}

// ── Eén blok: kop met potlood, daaronder de regels ──────────────────────────
function Blok({
  titel, soort, rijen, isMobile, accent = GREEN,
  bewerken, bezig, concept, onConcept, onStart, onAnnuleer, onBewaar,
}) {
  const lijst = bewerken ? concept : rijen
  const legeBlok = leeg(lijst) && !bewerken

  const zetRij = (i, waarde) => onConcept(concept.map((r, n) => (n === i ? waarde : r)))
  const nieuweRij = () => onConcept([...concept, soort === 'paar' ? { besproken: '', plan: '' } : ''])
  const wisRij = (i) => onConcept(concept.filter((_, n) => n !== i))

  return (
    <div style={{
      background: KAART, border: `1px solid ${LIJN}`, borderRadius: 12,
      padding: isMobile ? '0.8rem 0.85rem' : '0.9rem 1rem',
      marginBottom: '0.75rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: legeBlok ? 0 : '0.7rem' }}>
        <span style={{
          flex: 1, minWidth: 0,
          fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.09em',
          textTransform: 'uppercase', color: accent,
        }}>
          {titel}
        </span>
        {bewerken ? (
          <>
            <IconKnop titel="Annuleer" onClick={onAnnuleer}><X size={13} /></IconKnop>
            <IconKnop titel="Opslaan" kleur={accent} onClick={onBewaar} disabled={bezig}><Check size={13} /></IconKnop>
          </>
        ) : (
          <IconKnop titel={`${titel} bewerken`} onClick={onStart}><Pencil size={12} /></IconKnop>
        )}
      </div>

      {legeBlok && (
        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.25)' }}>
          Niets ingevuld
        </span>
      )}

      {!legeBlok && lijst.map((rij, i) => (
        <div
          key={i}
          style={{
            padding: i === 0 ? '0 0 0.55rem' : '0.55rem 0',
            borderTop: i === 0 ? 'none' : `1px solid rgba(255,255,255,0.05)`,
            display: 'flex', alignItems: bewerken ? 'flex-start' : 'center', gap: 8,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            {soort === 'paar' ? (
              <PaarRij
                rij={rij} i={i} isMobile={isMobile} bewerken={bewerken}
                onWijzig={(veld, w) => zetRij(i, { ...rij, [veld]: w })}
              />
            ) : (
              <TekstRij
                tekst={rij} accent={accent} bewerken={bewerken}
                onWijzig={(w) => zetRij(i, w)}
              />
            )}
          </div>
          {bewerken && (
            <IconKnop titel="Regel weghalen" onClick={() => wisRij(i)}><Trash2 size={12} /></IconKnop>
          )}
        </div>
      ))}

      {bewerken && (
        <button
          onClick={nieuweRij}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            marginTop: '0.4rem', padding: '0.35rem 0.6rem', borderRadius: 8,
            background: 'rgba(255,255,255,0.04)', border: `1px dashed ${LIJN}`,
            color: 'rgba(255,255,255,0.5)', fontSize: '0.66rem', fontWeight: 800,
            cursor: 'pointer', fontFamily: 'inherit',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Plus size={11} /> Regel
        </button>
      )}
    </div>
  )
}

// Besproken → plan. Op desktop naast elkaar met de pijl ertussen, op telefoon
// onder elkaar met de pijl op zijn kant ertussen.
function PaarRij({ rij, isMobile, bewerken, onWijzig }) {
  const besproken = rij?.besproken || ''
  const plan = rij?.plan || ''

  if (bewerken) {
    return (
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 6, alignItems: 'stretch' }}>
        <Invoer waarde={besproken} plaats="Besproken" onWijzig={(w) => onWijzig('besproken', w)} />
        <ArrowRight
          size={13}
          color="rgba(255,255,255,0.25)"
          style={{ flexShrink: 0, alignSelf: 'center', transform: isMobile ? 'rotate(90deg)' : 'none' }}
        />
        <Invoer waarde={plan} plaats="Wordt" zwaar onWijzig={(w) => onWijzig('plan', w)} />
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', flexDirection: isMobile ? 'column' : 'row',
      alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 3 : 10,
    }}>
      <span style={{
        flex: isMobile ? undefined : 1, minWidth: 0,
        fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)', lineHeight: 1.35,
      }}>
        {besproken || '—'}
      </span>
      <ArrowRight
        size={12}
        color="rgba(255,255,255,0.25)"
        style={{ flexShrink: 0, transform: isMobile ? 'rotate(90deg)' : 'none' }}
      />
      <span style={{
        flex: isMobile ? undefined : 1, minWidth: 0,
        fontSize: '0.78rem', fontWeight: 700, color: '#fff', lineHeight: 1.35,
      }}>
        {plan || '—'}
      </span>
    </div>
  )
}

// Bulletpoint. Geen pijlen hier: dit is geen "van → naar" maar een opsomming.
function TekstRij({ tekst, accent, bewerken, onWijzig }) {
  if (bewerken) return <Invoer waarde={tekst} plaats="Regel" zwaar onWijzig={onWijzig} />
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
      <span style={{ flexShrink: 0, width: 5, height: 5, borderRadius: '50%', background: accent, marginTop: 6 }} />
      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>
        {tekst || '—'}
      </span>
    </div>
  )
}

function Invoer({ waarde, plaats, zwaar = false, onWijzig }) {
  return (
    <input
      type="text"
      value={waarde}
      placeholder={plaats}
      onChange={(e) => onWijzig(e.target.value)}
      style={{
        flex: 1, minWidth: 0, width: '100%',
        padding: '0.4rem 0.55rem', borderRadius: 8,
        background: 'rgba(255,255,255,0.04)', border: `1px solid ${LIJN}`,
        color: zwaar ? '#fff' : 'rgba(255,255,255,0.7)',
        fontSize: '0.76rem', fontWeight: zwaar ? 700 : 600,
        outline: 'none', fontFamily: 'inherit',
      }}
    />
  )
}

function IconKnop({ titel, kleur = 'rgba(255,255,255,0.4)', onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={titel}
      aria-label={titel}
      style={{
        flexShrink: 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 26, height: 26, padding: 0, borderRadius: 7,
        background: 'rgba(255,255,255,0.04)', border: `1px solid ${LIJN}`,
        color: kleur, cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}
    >
      {children}
    </button>
  )
}

function Foutregel({ tekst, onSluit }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem',
      padding: '0.5rem 0.7rem', borderRadius: 8,
      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
      color: '#fca5a5', fontSize: '0.7rem', fontWeight: 700,
    }}>
      <span style={{ flex: 1, minWidth: 0 }}>{tekst}</span>
      <button onClick={onSluit} aria-label="Melding sluiten" style={{
        background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 2,
      }}>
        <X size={12} />
      </button>
    </div>
  )
}

function LegeStaat({ fout }) {
  return (
    <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
      <FileText size={26} color="rgba(255,255,255,0.2)" />
      <div style={{ marginTop: 10, fontSize: '0.9rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>
        Nog geen planvoorstel
      </div>
      <div style={{ marginTop: 4, fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>
        {fout || 'Zodra er een voorstel ligt, staat het hier.'}
      </div>
      <button
        disabled
        title="Wordt elke ochtend automatisch gemaakt"
        style={{
          marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6,
          minHeight: 36, padding: '0 0.9rem', borderRadius: 10,
          background: 'rgba(255,255,255,0.04)', border: `1px solid ${LIJN}`,
          color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', fontWeight: 800,
          cursor: 'not-allowed', fontFamily: 'inherit',
        }}
      >
        <Sparkles size={13} /> Genereer voorstel
      </button>
    </div>
  )
}
