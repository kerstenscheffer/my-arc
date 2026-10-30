// src/modules/lead-management/components/ChallengePaneel.jsx
//
// De lopende money-back challenges, en de plek waar ze aflopen.
//
// Zolang een challenge open staat is het geld nog niet van ons: het telt niet
// als omzet en er gaat geen commissie overheen. Hier beslis je wat ermee
// gebeurt, en pas dán schuift het bedrag door naar de cijfers:
//
//   Behouden      — hij vroeg zijn geld niet terug. Telt vanaf nu als omzet,
//                   en het vastgelegde percentage gaat alsnog naar de partner.
//   Doorgezet     — hij koopt een vervolgtraject. Dat wordt een eigen sale met
//                   eigen bedrag en verdeling; de challenge gaat op behouden.
//                   Twee regels dus, want anders raak je kwijt wat er voor de
//                   challenge zelf betaald is.
//   Terugbetaald  — geld terug. Valt overal uit, ook uit de cashflow.
//   Uitgesteld    — start of betaling onzeker (datum onbekend). Telt nergens
//                   mee, geen deadline; staat in Business OS → Opvolgen. Weer
//                   open = startdatum kiezen, deadline = start + 42 dagen, en hij
//                   telt weer mee op de oorspronkelijke saledatum.

import { useCallback, useEffect, useState } from 'react'
import { ArrowUpRight, Check, Clock, Undo2 } from 'lucide-react'

const FILTERS = [
  ['open', 'Open'],
  ['uitgesteld', 'Uitgesteld'],
  ['behouden', 'Behouden'],
  ['terugbetaald', 'Terugbetaald'],
]
const CHALLENGE_DAGEN = 42
const lokaleDatum = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const plusDagen = (iso, n) => {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + n)
  return lokaleDatum(d)
}

const LIJN = 'rgba(255,255,255,0.08)'
// Challenge-geld is wit zoals de rest — het staat op de rekening — maar met
// een streep erdoor in de grafiek van de omzet-hub, omdat het nog terug kan.
// Hier doet het label dat werk: "in bewaring".
const LIJN_ZACHT = 'rgba(255,255,255,0.05)'
const euro = (n) => '€' + Math.round(Number(n) || 0).toLocaleString('nl-NL')

const veld = {
  minHeight: 38, padding: '0 0.6rem', borderRadius: 9,
  background: 'rgba(255,255,255,0.04)', border: `1px solid ${LIJN}`,
  color: '#fff', fontSize: '0.85rem', fontWeight: 800, fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box',
}

// "dylan_bastiaan dylan_bastiaan": voor- en achternaam zijn bij Instagram-
// leads vaak allebei de gebruikersnaam. Dan één keer tonen.
const naamVan = (n) => {
  const delen = String(n || '').trim().split(/\s+/)
  return delen.length === 2 && delen[0] === delen[1] ? delen[0] : n
}

const knop = (kleur, vol = false) => ({
  flexShrink: 0, minHeight: 30,
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
  padding: '0 0.65rem', borderRadius: 999,
  background: vol ? kleur : 'transparent',
  border: `1px solid ${vol ? kleur : (kleur === '#fff' ? 'rgba(255,255,255,0.25)' : kleur + '55')}`,
  color: vol ? '#0a0a0a' : kleur,
  fontSize: '0.74rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
})

function Regel({ ch, partnerName, onAfronden, onDoorzetten, onBetaald, onHeropen }) {
  const [vervolg, setVervolg] = useState(false)
  const [bedrag, setBedrag] = useState('')
  const [pct, setPct] = useState(String(ch.pct ?? 50))
  const [bezig, setBezig] = useState(false)
  // Weer open vanuit uitgesteld: startdatum vragen (standaard vandaag).
  const [heropen, setHeropen] = useState(false)
  const [start, setStart] = useState(() => lokaleDatum(new Date()))

  const doe = async (fn) => { setBezig(true); await fn(); setBezig(false) }
  const bedragNum = parseFloat(String(bedrag).replace(',', '.'))
  const pctNum = Math.min(100, Math.max(0, parseFloat(String(pct).replace(',', '.')) || 0))
  const partnerDeel = (!isNaN(bedragNum) && pctNum > 0) ? bedragNum * (pctNum / 100) : null

  return (
    <div style={{ padding: '0.6rem 0', borderBottom: `1px solid ${LIJN_ZACHT}`, opacity: bezig ? 0.5 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 180px', minWidth: 0 }}>
          <div style={{
            fontSize: '0.88rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {naamVan(ch.leadName)}
          </div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
            {euro(ch.bedrag)}
            {ch.status === 'uitgesteld' && ch.gestart && (
              <span>{' · '}sale {new Date(ch.gestart).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}</span>
            )}
            {ch.status !== 'uitgesteld' && ch.deadline && (
              <span style={{ color: ch.verlopen ? '#10b981' : 'rgba(255,255,255,0.4)' }}>
                {' · '}{ch.verlopen ? 'termijn voorbij' : `tot ${new Date(ch.deadline).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}`}
              </span>
            )}
          </div>
        </div>
      {ch.status === 'behouden' || ch.status === 'terugbetaald' ? null
      : ch.status === 'uitgesteld' ? (
        !heropen && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button style={knop('#fff', true)} disabled={bezig} onClick={() => setHeropen(true)}>
              Weer open
            </button>
            <button style={knop('#ef4444')} disabled={bezig} onClick={() => doe(() => onAfronden(ch, 'terugbetaald'))}>
              Gaat niet door
            </button>
          </div>
        )
      ) : !ch.betaald ? (
        // Nog niet betaald: eerst moet het geld binnenkomen, pas dan valt er
        // iets te behouden of terug te betalen.
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button style={knop('#fff', true)} disabled={bezig} onClick={() => doe(() => onBetaald(ch))}>
            <Check size={12} strokeWidth={3.4} /> Betaald
          </button>
          <button style={knop('#fff')} disabled={bezig} onClick={() => doe(() => onAfronden(ch, 'uitgesteld'))}>
            <Clock size={12} strokeWidth={3.4} /> Uitstellen
          </button>
          <button style={knop('#ef4444')} disabled={bezig} onClick={() => doe(() => onAfronden(ch, 'terugbetaald'))}>
            Gaat niet door
          </button>
        </div>
      ) : !vervolg ? (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button style={knop('#fff', true)} disabled={bezig} onClick={() => doe(() => onAfronden(ch, 'behouden'))}>
            <Check size={12} strokeWidth={3.4} /> Behouden
          </button>
          <button style={knop('#22c55e')} disabled={bezig} onClick={() => setVervolg(true)}>
            <ArrowUpRight size={12} strokeWidth={3.4} /> Doorgezet
          </button>
          <button style={knop('#ef4444')} disabled={bezig} onClick={() => doe(() => onAfronden(ch, 'terugbetaald'))}>
            <Undo2 size={12} strokeWidth={3.4} /> Terug
          </button>
        </div>
      ) : null}
      </div>
      {ch.status === 'uitgesteld' && heropen && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)' }}>Start</span>
            <input type="date" value={start} onChange={e => setStart(e.target.value)} style={{ ...veld, colorScheme: 'dark' }} />
            <button
              style={knop('#22c55e', true)} disabled={bezig || !start}
              onClick={() => doe(() => onHeropen(ch, plusDagen(start, CHALLENGE_DAGEN)))}
            >
              Vastleggen
            </button>
            <button style={knop('rgba(255,255,255,0.4)')} disabled={bezig} onClick={() => setHeropen(false)}>
              Terug
            </button>
          </div>
          {start && (
            <div style={{ fontSize: '0.66rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>
              Deadline {new Date(`${plusDagen(start, CHALLENGE_DAGEN)}T12:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} · telt weer mee op saledatum
            </div>
          )}
        </div>
      )}
      {ch.betaald && vervolg && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <input
              type="number" inputMode="decimal" autoFocus value={bedrag}
              onChange={e => setBedrag(e.target.value)}
              placeholder="Prijs vervolgtraject"
              style={{ ...veld, flex: 2 }}
            />
            <input
              type="number" inputMode="decimal" value={pct}
              onChange={e => setPct(e.target.value)}
              style={{ ...veld, width: 66, textAlign: 'center' }}
            />
            <span style={{
              display: 'flex', alignItems: 'center',
              fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)',
            }}>
              % {partnerName}
            </span>
          </div>
          {partnerDeel != null && (
            <div style={{ fontSize: '0.66rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>
              {partnerName} krijgt {euro(partnerDeel)} · challenge van {euro(ch.bedrag)} wordt behouden
            </div>
          )}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              style={knop('#fff', true)} disabled={bezig || isNaN(bedragNum)}
              onClick={() => doe(() => onDoorzetten(ch, { value: bedragNum, partnerSharePct: pctNum || null }))}
            >
              Vastleggen
            </button>
            <button style={{ ...knop('rgba(255,255,255,0.4)'), flex: 0, minWidth: 70 }} disabled={bezig} onClick={() => setVervolg(false)}>
              Terug
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ChallengePaneel({ leadService, coachId, partnerName = 'Marcel', onGewijzigd }) {
  const [lijst, setLijst] = useState([])
  const [laden, setLaden] = useState(true)
  const [filter, setFilter] = useState('open')

  const laad = useCallback(async () => {
    if (!leadService) return
    setLaden(true)
    setLijst(await leadService.getChallenges(coachId, filter))
    setLaden(false)
  }, [leadService, coachId, filter])

  useEffect(() => { laad() }, [laad])

  const afronden = async (ch, status) => {
    const res = await leadService.setChallengeStatus(ch.movementId, status)
    if (res?.error) { console.error(res.error); return }
    await laad()
    onGewijzigd?.()
  }

  // Uitgesteld → open met nieuwe deadline (startdatum + 42 dagen).
  const heropenen = async (ch, deadline) => {
    const res = await leadService.setChallengeStatus(ch.movementId, 'open', { deadline })
    if (res?.error) { console.error(res.error); return }
    await laad()
    onGewijzigd?.()
  }

  const doorzetten = async (ch, gegevens) => {
    const res = await leadService.registreerVervolgtraject(ch, gegevens)
    if (res?.error) { console.error(res.error); return }
    await laad()
    onGewijzigd?.()
  }

  const betaald = async (ch) => {
    const res = await leadService.markReservationPaid(ch.movementId)
    if (res?.error) { console.error(res.error); return }
    await laad()
    onGewijzigd?.()
  }

  const inBewaring = lijst.filter(c => c.betaald)
  const toegezegd = lijst.filter(c => !c.betaald)
  const totaal = inBewaring.reduce((s, c) => s + c.bedrag, 0)
  const totaalToegezegd = toegezegd.reduce((s, c) => s + c.bedrag, 0)
  const verlopen = inBewaring.filter(c => c.verlopen)
  const kopje = { fontSize: '0.78rem', fontWeight: 900, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '1rem 0 0.1rem' }
  const regel = (ch) => (
    <Regel
      key={ch.movementId}
      ch={ch}
      partnerName={partnerName}
      onAfronden={afronden}
      onDoorzetten={doorzetten}
      onBetaald={betaald}
      onHeropen={heropenen}
    />
  )

  const filterKeuze = (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
      <select value={filter} onChange={e => setFilter(e.target.value)} aria-label="Status" style={{ ...veld, colorScheme: 'dark', cursor: 'pointer' }}>
        {FILTERS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
      </select>
    </div>
  )

  if (laden) {
    return <div>{filterKeuze}<div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Laden…</div></div>
  }

  if (lijst.length === 0) {
    return (
      <div>
        {filterKeuze}
        <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', lineHeight: 1.5 }}>
          {filter === 'open'
            ? 'Geen lopende challenges. Kies bij een sale "Challenge" om money-back-geld apart te houden van je omzet.'
            : `Geen challenges met status ${FILTERS.find(([k]) => k === filter)?.[1].toLowerCase()}.`}
        </div>
      </div>
    )
  }

  if (filter !== 'open') {
    const som = lijst.reduce((s, c) => s + c.bedrag, 0)
    return (
      <div>
        {filterKeuze}
        <div style={{ paddingBottom: '1rem', borderBottom: `1px solid ${LIJN}`, marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, lineHeight: 1, color: '#fff', letterSpacing: '-0.035em' }}>{euro(som)}</div>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', marginTop: 5 }}>
            {lijst.length} {FILTERS.find(([k]) => k === filter)?.[1].toLowerCase()}
            {filter === 'uitgesteld' ? ' · telt nergens mee tot je hem weer opent' : ''}
          </div>
        </div>
        {lijst.map(regel)}
      </div>
    )
  }

  return (
    <div>
      {filterKeuze}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '1rem 2.5rem',
        paddingBottom: '1rem', borderBottom: `1px solid ${LIJN}`, marginBottom: '0.75rem',
      }}>
        {[
          { label: `In bewaring · ${inBewaring.length} challenge${inBewaring.length === 1 ? '' : 's'}`, waarde: euro(totaal) },
          ...(toegezegd.length ? [{ label: `Toegezegd · ${toegezegd.length} nog niet betaald`, waarde: euro(totaalToegezegd) }] : []),
          { label: verlopen.length ? 'Termijn voorbij · kun je afronden' : 'Termijn voorbij', waarde: String(verlopen.length) },
        ].map(k => (
          <div key={k.label}>
            <div style={{
              fontSize: '1.6rem', fontWeight: 900, lineHeight: 1,
              color: '#fff', letterSpacing: '-0.035em',
            }}>
              {k.waarde}
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', marginTop: 5 }}>
              {k.label}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)',
        lineHeight: 1.45, marginBottom: '0.5rem',
      }}>
        Telt nog niet als omzet en er gaat geen commissie over zolang de klant het kan terugvragen.
      </div>

      {toegezegd.length > 0 && (
        <>
          <div style={{ ...kopje, marginTop: 0 }}>Toegezegd, nog niet betaald</div>
          {toegezegd.map(regel)}
        </>
      )}
      {inBewaring.length > 0 && (
        <>
          <div style={{ ...kopje, marginTop: toegezegd.length ? '1.25rem' : 0 }}>In bewaring</div>
          {inBewaring.map(regel)}
        </>
      )}
    </div>
  )
}
