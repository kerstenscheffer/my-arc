// src/modules/lead-management/components/kanban/SaleForm.jsx
//
// Het formulier achter een sale: wat er betaald is, hoe, en wat daarvan naar de
// partner gaat. Eén component, twee plekken — in de call-lijst meteen na
// "Sale", en als los venster wanneer je een lead naar de sale-sectie sleept.
// Daardoor kan de vraag niet op twee manieren gesteld worden.
//
// De soort is het belangrijkste veld en staat daarom bovenaan:
//
//   Coaching  — gewoon betaald. Telt als omzet, partner krijgt zijn deel.
//   Challenge — money-back. Het geld staat op de rekening maar de klant kan het
//               terugvragen, dus het telt nog niet als omzet en er gaat geen
//               commissie overheen. Pas als de challenge afloopt zonder claim
//               (of hij koopt een vervolg) zet je hem op 'behouden' en telt hij
//               alsnog mee. Zo betalen we niemand uit over geld dat terug moet.

import { useState } from 'react'
import { Trophy, Gift, Wallet, CalendarClock, Users, BookmarkCheck, Check, Hourglass } from 'lucide-react'

const LIJN = 'rgba(255,255,255,0.09)'

// Hoe lang een challenge-deelnemer zijn geld kan terugvragen.
const CHALLENGE_WEKEN = 6

const euro = (n) => `€${Number(n).toLocaleString('nl-NL', { maximumFractionDigits: 2 })}`

const veld = {
  width: '100%', minHeight: 44, padding: '0 0.75rem',
  background: 'rgba(255,255,255,0.04)', border: `1px solid ${LIJN}`,
  borderRadius: 10, color: '#fff', fontSize: '0.95rem', fontWeight: 800,
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
}

const kopje = {
  fontSize: '0.56rem', fontWeight: 900, color: 'rgba(255,255,255,0.35)',
  textTransform: 'uppercase', letterSpacing: '0.11em', marginBottom: 6,
}

const keuze = (aan) => ({
  flex: 1, minHeight: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  padding: '0 0.5rem', borderRadius: 10, cursor: 'pointer',
  fontSize: '0.8rem', fontWeight: 900, fontFamily: 'inherit',
  background: aan ? '#fff' : 'transparent',
  border: `1px solid ${aan ? '#fff' : LIJN}`,
  color: aan ? '#0a0a0a' : 'rgba(255,255,255,0.6)',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
})

export default function SaleForm({ leadName, partnerName = 'Marcel', compact = false, onSave, onCancel }) {
  const [soort, setSoort] = useState('coaching')      // 'coaching' | 'challenge'
  const [bedrag, setBedrag] = useState('')
  const [betaalwijze, setBetaalwijze] = useState('prepaid')
  const [maanden, setMaanden] = useState('12')
  const [partnerPct, setPartnerPct] = useState('50')
  // Een ja is nog geen geld. Staat dit op 'nee', dan telt de sale wel als ja
  // maar nog niet als omzet, en komt hij in het calls-venster onder 'Betaling'
  // te staan tot je het bedrag invoert.
  const [betaald, setBetaald] = useState(true)
  const [reservering, setReservering] = useState(false)
  const [aanbetaling, setAanbetaling] = useState('50')
  const [restDatum, setRestDatum] = useState('')

  const isChallenge = soort === 'challenge'
  const totaal = parseFloat(String(bedrag).replace(',', '.'))
  const maandenNum = Math.max(1, parseInt(maanden, 10) || 0)
  const perMaand = (!isNaN(totaal) && betaalwijze === 'monthly' && maandenNum > 0) ? totaal / maandenNum : null
  const pct = Math.min(100, Math.max(0, parseFloat(String(partnerPct).replace(',', '.')) || 0))
  const partnerDeel = (!isNaN(totaal) && pct > 0) ? totaal * (pct / 100) : null
  const resNum = parseFloat(String(aanbetaling).replace(',', '.'))
  const rest = (!isNaN(totaal) && !isNaN(resNum)) ? totaal - resNum : null

  const deadline = (() => {
    const d = new Date(); d.setDate(d.getDate() + CHALLENGE_WEKEN * 7)
    return d.toISOString().split('T')[0]
  })()

  const opslaan = () => {
    onSave({
      value: isNaN(totaal) ? null : totaal,
      saleKind: soort,
      paymentType: betaalwijze,
      durationMonths: betaalwijze === 'monthly' ? Math.max(1, parseInt(maanden, 10) || 12) : 1,
      // Het percentage leggen we ook bij een challenge vast: er gaat nu niets
      // uit (dat regelt de status), maar als hij straks behouden wordt moet
      // bekend zijn welk deel de partner toekomt.
      partnerSharePct: pct > 0 ? pct : null,
      challenge: isChallenge ? { status: 'open', deadline } : null,
      paymentReceived: betaald,
      reservation: {
        // Nog niets binnen is geen aanbetaling: dan staat het hele bedrag open.
        isReservation: betaald && reservering,
        amount: isNaN(resNum) ? 50 : resNum,
        dueDate: restDatum || null,
      },
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 10 : 14 }}>

      <div>
        <div style={kopje}>Wat is dit</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setSoort('coaching')} style={keuze(!isChallenge)}>
            <Trophy size={14} strokeWidth={3} /> Coaching
          </button>
          <button onClick={() => setSoort('challenge')} style={keuze(isChallenge)}>
            <Gift size={14} strokeWidth={3} /> Challenge
          </button>
        </div>
        {isChallenge && (
          <div style={{
            marginTop: 6, fontSize: '0.66rem', fontWeight: 700,
            color: 'rgba(255,255,255,0.35)', lineHeight: 1.4,
          }}>
            Money-back tot {new Date(deadline).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}.
            Telt nog niet als omzet en er gaat geen commissie overheen, tot je 'm afrondt als behouden.
          </div>
        )}
      </div>

      <div>
        <div style={kopje}>Betaling</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setBetaald(true)} style={keuze(betaald)}>
            <Check size={14} strokeWidth={3} /> Geld binnen
          </button>
          <button onClick={() => { setBetaald(false); setReservering(false) }} style={keuze(!betaald)}>
            <Hourglass size={14} strokeWidth={3} /> Nog niet
          </button>
        </div>
        {!betaald && (
          <div style={{
            marginTop: 6, fontSize: '0.66rem', fontWeight: 700,
            color: 'rgba(255,255,255,0.35)', lineHeight: 1.4,
          }}>
            Telt als ja, nog niet als omzet. Hij komt in het calls-venster onder
            <b style={{ color: 'rgba(255,255,255,0.6)' }}> Betaling</b> te staan.
          </div>
        )}
      </div>

      <div>
        <div style={kopje}>{betaald ? 'Bedrag' : 'Afgesproken bedrag'}{leadName ? ` van ${leadName}` : ''}</div>
        <input
          type="number" inputMode="decimal" autoFocus value={bedrag}
          onChange={e => setBedrag(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') opslaan() }}
          placeholder={isChallenge ? 'Bijv. 297' : 'Bijv. 597'}
          style={veld}
        />
      </div>

      <div>
        <div style={kopje}>Betaalwijze</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setBetaalwijze('prepaid')} style={keuze(betaalwijze === 'prepaid')}>
            <Wallet size={14} strokeWidth={3} /> In één keer
          </button>
          <button onClick={() => setBetaalwijze('monthly')} style={keuze(betaalwijze === 'monthly')}>
            <CalendarClock size={14} strokeWidth={3} /> Maandelijks
          </button>
        </div>
        {betaalwijze === 'monthly' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <input
              type="number" inputMode="numeric" value={maanden}
              onChange={e => setMaanden(e.target.value.replace(/[^0-9]/g, ''))}
              style={{ ...veld, width: 70, minHeight: 38, textAlign: 'center' }}
            />
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
              maanden{perMaand != null ? ` · ${euro(perMaand)} per maand` : ''}
            </span>
          </div>
        )}
      </div>

      <div>
          <div style={kopje}>Aandeel {partnerName}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={14} color="rgba(255,255,255,0.4)" strokeWidth={2.6} />
            <input
              type="number" inputMode="decimal" value={partnerPct}
              onChange={e => setPartnerPct(e.target.value)}
              style={{ ...veld, width: 78, minHeight: 38, textAlign: 'center' }}
            />
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
              %{partnerDeel != null ? ` · ${euro(partnerDeel)}` : ''}
            </span>
          </div>
          {isChallenge && (
            <div style={{ marginTop: 5, fontSize: '0.64rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>
              Gaat pas uit als je de challenge afrondt als behouden.
            </div>
          )}
        </div>

      {/* Aanbetaling: het bedrag blijft de volledige waarde; dit legt vast wat
          er nu binnen is en wanneer de rest komt. Alleen zinnig als er al iets
          binnen is. */}
      <div hidden={!betaald}>
        <button
          onClick={() => setReservering(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7, width: '100%',
            background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
            fontFamily: 'inherit', textAlign: 'left',
          }}
        >
          <span style={{
            width: 17, height: 17, flexShrink: 0, borderRadius: 5,
            background: reservering ? '#fff' : 'transparent',
            border: `1px solid ${reservering ? '#fff' : 'rgba(255,255,255,0.22)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {reservering && <BookmarkCheck size={11} color="#0a0a0a" strokeWidth={3.5} />}
          </span>
          <span style={{ fontSize: '0.76rem', fontWeight: 800, color: reservering ? '#fff' : 'rgba(255,255,255,0.45)' }}>
            Betaalt nu een deel, rest later
          </span>
        </button>
        {reservering && (
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <input
              type="number" inputMode="decimal" value={aanbetaling}
              onChange={e => setAanbetaling(e.target.value)}
              placeholder="Nu"
              style={{ ...veld, minHeight: 38, flex: 1 }}
            />
            <input
              type="date" value={restDatum} onChange={e => setRestDatum(e.target.value)}
              style={{ ...veld, minHeight: 38, flex: 1.4 }}
            />
          </div>
        )}
        {reservering && rest != null && (
          <div style={{ marginTop: 6, fontSize: '0.68rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>
            Rest: {euro(rest)}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        {onCancel && (
          <button onClick={onCancel} style={{
            minWidth: 88, minHeight: 44, borderRadius: 10,
            background: 'transparent', border: `1px solid ${LIJN}`,
            color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: 800,
            cursor: 'pointer', fontFamily: 'inherit',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>
            Later
          </button>
        )}
        <button onClick={opslaan} style={{
          flex: 1, minHeight: 44, borderRadius: 10, border: 'none',
          background: '#fff', color: '#0a0a0a',
          fontSize: '0.85rem', fontWeight: 900, letterSpacing: '-0.01em',
          cursor: 'pointer', fontFamily: 'inherit',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}>
          {!betaald
            ? (isNaN(totaal) ? 'Ja, betaling later' : `Ja · ${euro(totaal)} later`)
            : (isNaN(totaal) ? 'Opslaan zonder bedrag' : `Opslaan · ${euro(totaal)}`)}
        </button>
      </div>
    </div>
  )
}
