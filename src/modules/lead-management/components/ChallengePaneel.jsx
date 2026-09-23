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

import { useCallback, useEffect, useState } from 'react'
import { Gift, ArrowUpRight, Check, Undo2, Clock } from 'lucide-react'

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

const knop = (kleur, vol = false) => ({
  flex: 1, minWidth: 84, minHeight: 36,
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
  padding: '0 0.5rem', borderRadius: 9,
  background: vol ? kleur : 'transparent',
  border: `1px solid ${vol ? kleur : (kleur === '#fff' ? 'rgba(255,255,255,0.25)' : kleur + '55')}`,
  color: vol ? '#0a0a0a' : kleur,
  fontSize: '0.74rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
})

function Regel({ ch, partnerName, onAfronden, onDoorzetten }) {
  const [vervolg, setVervolg] = useState(false)
  const [bedrag, setBedrag] = useState('')
  const [pct, setPct] = useState(String(ch.pct ?? 50))
  const [bezig, setBezig] = useState(false)

  const doe = async (fn) => { setBezig(true); await fn(); setBezig(false) }
  const bedragNum = parseFloat(String(bedrag).replace(',', '.'))
  const pctNum = Math.min(100, Math.max(0, parseFloat(String(pct).replace(',', '.')) || 0))
  const partnerDeel = (!isNaN(bedragNum) && pctNum > 0) ? bedragNum * (pctNum / 100) : null

  return (
    <div style={{ padding: '0.75rem 0', borderBottom: `1px solid ${LIJN_ZACHT}`, opacity: bezig ? 0.5 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Gift size={14} color="rgba(255,255,255,0.4)" strokeWidth={2.6} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '0.86rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {ch.leadName}
          </div>
          <div style={{ fontSize: '0.64rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
            {euro(ch.bedrag)} in bewaring
            {ch.deadline && (
              <span style={{ color: ch.verlopen ? '#10b981' : 'rgba(255,255,255,0.35)' }}>
                {' · '}{ch.verlopen ? 'termijn voorbij' : `terug te vragen tot ${new Date(ch.deadline).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}`}
              </span>
            )}
          </div>
        </div>
        {ch.verlopen && <Clock size={13} color="#10b981" strokeWidth={3} style={{ flexShrink: 0 }} />}
      </div>

      {!vervolg ? (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button style={knop('#fff', true)} disabled={bezig} onClick={() => doe(() => onAfronden(ch, 'behouden'))}>
            <Check size={12} strokeWidth={3.4} /> Behouden
          </button>
          <button style={knop('#22c55e')} disabled={bezig} onClick={() => setVervolg(true)}>
            <ArrowUpRight size={12} strokeWidth={3.4} /> Doorgezet
          </button>
          <button style={knop('#ef4444')} disabled={bezig} onClick={() => doe(() => onAfronden(ch, 'terugbetaald'))}>
            <Undo2 size={12} strokeWidth={3.4} /> Terugbetaald
          </button>
        </div>
      ) : (
        <div>
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

  const laad = useCallback(async () => {
    if (!leadService) return
    setLaden(true)
    setLijst(await leadService.getChallenges(coachId, 'open'))
    setLaden(false)
  }, [leadService, coachId])

  useEffect(() => { laad() }, [laad])

  const afronden = async (ch, status) => {
    const res = await leadService.setChallengeStatus(ch.movementId, status)
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

  const totaal = lijst.reduce((s, c) => s + c.bedrag, 0)
  const verlopen = lijst.filter(c => c.verlopen)

  if (laden) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Laden…</div>
  }

  if (lijst.length === 0) {
    return (
      <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', lineHeight: 1.5 }}>
        Geen lopende challenges. Kies bij een sale "Challenge" om money-back-geld
        apart te houden van je omzet.
      </div>
    )
  }

  return (
    <div>
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '1.25rem 3.5rem',
        paddingBottom: '1.25rem', borderBottom: `1px solid ${LIJN}`, marginBottom: '1rem',
      }}>
        {[
          { label: `In bewaring · ${lijst.length} challenge${lijst.length === 1 ? '' : 's'}`, waarde: euro(totaal) },
          { label: verlopen.length ? 'Termijn voorbij · kun je afronden' : 'Termijn voorbij', waarde: String(verlopen.length) },
        ].map(k => (
          <div key={k.label}>
            <div style={{
              fontSize: '2.2rem', fontWeight: 900, lineHeight: 1,
              color: '#fff', letterSpacing: '-0.035em',
            }}>
              {k.waarde}
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)', marginTop: 8 }}>
              {k.label}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        fontSize: '0.88rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)',
        lineHeight: 1.5, marginBottom: '1rem',
      }}>
        Dit geld staat op de rekening maar telt nog niet als omzet, en er gaat
        geen commissie overheen zolang de klant het kan terugvragen.
      </div>

      {lijst.map(ch => (
        <Regel
          key={ch.movementId}
          ch={ch}
          partnerName={partnerName}
          onAfronden={afronden}
          onDoorzetten={doorzetten}
        />
      ))}
    </div>
  )
}
