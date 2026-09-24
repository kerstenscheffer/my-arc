// src/modules/lead-management/components/kanban/DueCallsModal.jsx
//
// Twee tabbladen: de ingeplande calls, en de closes die nog op geld wachten.
// Dat tweede tabblad bestaat omdat een ja en een betaling niet hetzelfde
// moment zijn — je zet 'm meteen op sale en voert het bedrag in zodra het
// binnen is. Tot die tijd telt hij wel als ja, niet als omzet.
//
// Alle ingeplande calls op één plek: wat af te handelen is, en wat er nog
// aankomt. Per call twee stappen:
//   Stap 1: Gevoerd / Niet gevoerd
//   Stap 2: (gevoerd) Sale / Sale verloren / Denkt na
//           (niet gevoerd) No show / Afgezegd / Verplaatst
// Elke keuze bubbelt via onOutcome(dc, kind, extra) naar de KanbanBoard.
//
// Waarom ook de calls die nog moeten komen: een gesprek dat vandaag doorging
// maar morgen pas in de agenda staat, kwam nergens terug. Die lead bleef dan
// eeuwig "ingepland" staan terwijl hij allang klant of afgewezen was. Ze staan
// apart onder een kop, want ze vragen niet om actie — ze mogen alleen niet
// onvindbaar zijn.

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useModalHost } from '../../../../coach/ModalHost'
import { X, Phone, Check, XCircle, Trophy, CalendarClock, UserX, CalendarX, Hourglass, ChevronRight, Euro, Pencil } from 'lucide-react'
import SaleForm from './SaleForm'
import { SaleLostReasonForm } from './SaleLostReasonModal'

// Waarom een lead een call afzegt. Zelfde soort lijstje als bij een verloren
// sale: vijf antwoorden die je echt hoort, plus ruimte om het zelf te typen.
const AFZEG_REDENEN = [
  'Kwam iets tussen',
  'Te druk / geen tijd',
  'Twijfelt over coaching',
  'Geld komt nu niet uit',
  'Ziek',
]

const LIJN = 'rgba(255,255,255,0.08)'
const LIJN_ZACHT = 'rgba(255,255,255,0.05)'

const veld = (flex) => ({
  flex, minHeight: 38, padding: '0 0.6rem', borderRadius: 9,
  border: `1px solid ${LIJN}`, background: 'rgba(255,255,255,0.04)',
  color: '#fff', fontSize: '0.82rem', fontWeight: 700, fontFamily: 'inherit',
  boxSizing: 'border-box', outline: 'none',
})

// Kale knop: tekst in de kleur van de betekenis, geen gekleurd vlak. Zes
// gevulde blokjes naast elkaar lazen als een waarschuwing.
const knop = (kleur) => ({
  flex: 1, minWidth: 92, minHeight: 38,
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
  padding: '0 0.6rem', borderRadius: 10,
  border: `1px solid ${kleur === '#fff' ? 'rgba(255,255,255,0.25)' : kleur + '55'}`,
  background: 'transparent', color: kleur,
  fontWeight: 900, fontSize: '0.78rem', fontFamily: 'inherit',
  cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
})

const datumTekst = (dc) => {
  try {
    return new Date(`${dc.callDate}T${dc.callTime || '00:00'}:00`).toLocaleString('nl-NL', {
      day: 'numeric', month: 'short',
      hour: dc.callTime ? '2-digit' : undefined, minute: dc.callTime ? '2-digit' : undefined,
    })
  } catch { return dc.callDate }
}

function CallRegel({ dc, onOutcome }) {
  // Een lead die "denkt erover na" heeft de call al gevoerd; die stap slaan we
  // over. Een call die nog moet komen begint dicht: je wilt hem zien staan,
  // niet per ongeluk afhandelen.
  const [open, setOpen] = useState(!dc.toekomstig)
  const [stap, setStap] = useState(dc.denktNa ? 'gevoerd' : 1)
  const [verzetten, setVerzetten] = useState(false)
  const [afgezegd, setAfgezegd] = useState(false)
  const [denkt, setDenkt] = useState(false)
  // Sale: het bedrag hoort bij dezelfde handeling, dus vragen we het hier en
  // niet in een tweede venster dat er overheen springt.
  const [sale, setSale] = useState(false)
  // Verloren: de objectie vragen we om dezelfde reden hier en niet los.
  const [verloren, setVerloren] = useState(false)
  const [datum, setDatum] = useState(dc.callDate || new Date().toISOString().split('T')[0])
  const [tijd, setTijd] = useState(dc.callTime || new Date().toTimeString().slice(0, 5))
  const overEenWeek = () => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0] }
  const [denkDatum, setDenkDatum] = useState(dc.followupDate || overEenWeek())

  return (
    <div style={{ padding: '0.7rem 1rem', borderBottom: `1px solid ${LIJN_ZACHT}` }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
          background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
          textAlign: 'left', fontFamily: 'inherit',
          marginBottom: open ? 10 : 0,
        }}
      >
        <Phone size={13} color="rgba(255,255,255,0.4)" strokeWidth={2.6} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 900, color: '#fff', fontSize: '0.88rem', letterSpacing: '-0.015em',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {dc.leadName || 'Lead'}
          </div>
          <div style={{ fontSize: '0.64rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
            {dc.toekomstig ? 'Staat op' : 'Call was'} {datumTekst(dc)}
            {dc.denktNa && (
              <span style={{ color: '#eab308' }}>
                {' · denkt na'}{dc.followupDate ? ` tot ${new Date(dc.followupDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}` : ''}
              </span>
            )}
          </div>
        </div>
        <ChevronRight
          size={15} strokeWidth={3} color="rgba(255,255,255,0.3)"
          style={{ flexShrink: 0, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.18s ease' }}
        />
      </button>

      {open && stap === 1 && (
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={knop('#10b981')} onClick={() => setStap('gevoerd')}><Check size={13} strokeWidth={3} /> Gevoerd</button>
          <button style={knop('#ef4444')} onClick={() => setStap('niet')}><XCircle size={13} strokeWidth={3} /> Niet gevoerd</button>
        </div>
      )}

      {open && stap === 'gevoerd' && sale && (
        <SaleForm
          leadName={dc.leadName}
          compact
          onCancel={() => setSale(false)}
          onSave={(gegevens) => onOutcome(dc, 'sale', { sale: gegevens })}
        />
      )}

      {open && stap === 'gevoerd' && verloren && (
        <SaleLostReasonForm
          leadName={dc.leadName}
          compact
          onBack={() => setVerloren(false)}
          onSave={(reason) => onOutcome(dc, 'saleLost', { reason })}
        />
      )}

      {open && stap === 'gevoerd' && !denkt && !sale && !verloren && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button style={knop('#fff')} onClick={() => setSale(true)}><Trophy size={13} strokeWidth={3} /> Sale</button>
          <button style={knop('#ef4444')} onClick={() => setVerloren(true)}><XCircle size={13} strokeWidth={3} /> Verloren</button>
          <button style={knop('#eab308')} onClick={() => setDenkt(true)}><Hourglass size={13} strokeWidth={3} /> Denkt na</button>
        </div>
      )}

      {/* Denkt erover na: de call telt als gevoerd, de lead blijft staan en
          komt op de gekozen datum vanzelf weer bovenaan deze lijst. */}
      {open && stap === 'gevoerd' && denkt && !sale && !verloren && (
        <div>
          <div style={{ fontSize: '0.66rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>
            Wanneer kom je hierop terug?
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input type="date" value={denkDatum} onChange={e => setDenkDatum(e.target.value)} style={veld(2)} />
            <button style={knop('#eab308')} onClick={() => onOutcome(dc, 'thinking', { followupDate: denkDatum || null })}>
              Opslaan
            </button>
            <button style={{ ...knop('rgba(255,255,255,0.45)'), flex: 0, minWidth: 64 }} onClick={() => setDenkt(false)}>Terug</button>
          </div>
        </div>
      )}

      {open && stap === 'niet' && afgezegd && (
        <SaleLostReasonForm
          compact
          vraag={`Waarom zegde ${dc.leadName || 'deze lead'} af?`}
          opties={AFZEG_REDENEN}
          onBack={() => setAfgezegd(false)}
          onSave={(reason) => onOutcome(dc, 'afgezegd', { reason })}
        />
      )}

      {open && stap === 'niet' && !verzetten && !afgezegd && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button style={knop('#f97316')} onClick={() => onOutcome(dc, 'noShow')}><UserX size={13} strokeWidth={3} /> No show</button>
          <button style={knop('#a855f7')} onClick={() => setAfgezegd(true)}><CalendarX size={13} strokeWidth={3} /> Afgezegd</button>
          <button style={knop('#06b6d4')} onClick={() => setVerzetten(true)}><CalendarClock size={13} strokeWidth={3} /> Verplaatst</button>
        </div>
      )}

      {open && stap === 'niet' && verzetten && !afgezegd && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <input type="date" value={datum} onChange={e => setDatum(e.target.value)} style={veld(2)} />
          <input type="time" value={tijd} onChange={e => setTijd(e.target.value)} style={veld(1)} />
          <button style={knop('#06b6d4')} onClick={() => onOutcome(dc, 'reschedule', { callDate: datum || null, callTime: tijd || null })}>
            <CalendarClock size={13} strokeWidth={3} /> Inplannen
          </button>
        </div>
      )}
    </div>
  )
}

// Een close die nog op geld wacht. Dichtgeklapt zie je wie en wanneer; open
// staat hetzelfde sale-formulier als bij het afhandelen van de call, zodat de
// bedragen op één manier gevraagd worden.
function BetaalRegel({ rij, onBetaling }) {
  const [open, setOpen] = useState(false)
  // Staat het bedrag er al, dan is er meestal niets te vullen: je drukt op
  // "ontvangen" en klaar. Wijzigen zit eronder voor de keren dat het anders
  // liep dan afgesproken.
  const [wijzigen, setWijzigen] = useState(false)
  const bekend = rij.order_value != null
  const gegevens = {
    value: rij.order_value != null ? Number(rij.order_value) : null,
    paymentType: rij.payment_type || 'prepaid',
    durationMonths: rij.duration_months || 1,
    partnerSharePct: rij.partner_share_pct,
    saleKind: rij.sale_kind || 'coaching',
  }
  const dagen = (() => {
    if (!rij.moved_at) return null
    const d = Math.floor((Date.now() - new Date(rij.moved_at).getTime()) / 86400000)
    return isNaN(d) ? null : d
  })()

  return (
    <div style={{ padding: '0.7rem 1rem', borderBottom: `1px solid ${LIJN_ZACHT}` }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
          background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
          textAlign: 'left', fontFamily: 'inherit', marginBottom: open ? 10 : 0,
        }}
      >
        <Euro size={13} color="rgba(255,255,255,0.4)" strokeWidth={2.6} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 900, color: '#fff', fontSize: '0.88rem', letterSpacing: '-0.015em',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {rij.lead_name || 'Lead'}
          </div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
            {rij.order_value != null
              ? `€${Number(rij.order_value).toLocaleString('nl-NL')} afgesproken`
              : 'Bedrag nog niet ingevuld'}
            {dagen != null && ` · ${dagen === 0 ? 'vandaag' : `${dagen} dag${dagen === 1 ? '' : 'en'} geleden`}`}
          </div>
        </div>
        <ChevronRight
          size={15} strokeWidth={3} color="rgba(255,255,255,0.3)"
          style={{ flexShrink: 0, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.18s ease' }}
        />
      </button>

      {open && bekend && !wijzigen && (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            style={{ ...knop('#10b981'), flex: 2, background: '#fff', border: 'none', color: '#0a0a0a' }}
            onClick={() => onBetaling(rij, gegevens)}
          >
            <Check size={13} strokeWidth={3} /> €{Number(rij.order_value).toLocaleString('nl-NL')} ontvangen
          </button>
          <button style={knop('rgba(255,255,255,0.55)')} onClick={() => setWijzigen(true)}>
            <Pencil size={13} strokeWidth={3} /> Wijzigen
          </button>
        </div>
      )}

      {open && (!bekend || wijzigen) && (
        <SaleForm
          leadName={rij.lead_name}
          compact
          start={bekend ? gegevens : null}
          onCancel={() => { setWijzigen(false); if (!bekend) setOpen(false) }}
          onSave={(nieuw) => onBetaling(rij, nieuw)}
        />
      )}
    </div>
  )
}

function Kop({ tekst, aantal }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '0.6rem 1rem 0.35rem',
      fontSize: '0.56rem', fontWeight: 900, letterSpacing: '0.12em',
      textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)',
    }}>
      {tekst}
      <span style={{ color: 'rgba(255,255,255,0.2)' }}>{aantal}</span>
    </div>
  )
}

export default function DueCallsModal({ dueCalls, wachtBetaling, onOutcome, onBetaling, onClose }) {
  const modalHost = useModalHost()
  const lijst = dueCalls || []
  const betalingen = wachtBetaling || []
  const teDoen = lijst.filter(c => !c.toekomstig)
  const komtNog = lijst.filter(c => c.toekomstig)
  // Begin op het tabblad waar werk ligt: staan er geen calls open maar wel
  // betalingen, dan is dat het scherm dat je wilde zien.
  const [tab, setTab] = useState(teDoen.length === 0 && betalingen.length > 0 ? 'betaling' : 'calls')

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100000,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}
    >
      <div style={{
        background: '#0a0a0a', border: `1px solid ${LIJN}`, borderRadius: 18,
        width: '100%', maxWidth: 440, maxHeight: '86vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 24px 70px rgba(0,0,0,0.8)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          padding: '0.9rem 1rem', borderBottom: `1px solid ${LIJN}`, flexShrink: 0,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
              Ingeplande calls
            </div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
              {tab === 'calls'
                ? `${teDoen.length} af te handelen · ${komtNog.length} komt nog`
                : `${betalingen.length} ${betalingen.length === 1 ? 'close wacht' : 'closes wachten'} op geld`}
            </div>
          </div>
          <button onClick={onClose} title="Later" aria-label="Sluiten" style={{
            width: 30, height: 30, flexShrink: 0, borderRadius: 8,
            background: 'transparent', border: 'none', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>
            <X size={17} strokeWidth={3} />
          </button>
        </div>

        {/* Tabbladen. De calls blijven voorop: dat is waarvoor dit venster
            opengaat. Het aantal staat erbij, zodat je niet hoeft te klikken om
            te zien of er iets ligt. */}
        <div style={{ display: 'flex', flexShrink: 0, borderBottom: `1px solid ${LIJN}` }}>
          {[
            { id: 'calls', label: 'Calls', aantal: teDoen.length },
            { id: 'betaling', label: 'Betaling', aantal: betalingen.length },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, minHeight: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: 'transparent', border: 'none',
                borderBottom: `2px solid ${tab === t.id ? '#fff' : 'transparent'}`,
                color: tab === t.id ? '#fff' : 'rgba(255,255,255,0.4)',
                fontSize: '0.82rem', fontWeight: 900, fontFamily: 'inherit',
                cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}
            >
              {t.label}
              {t.aantal > 0 && (
                <span style={{
                  minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9,
                  background: tab === t.id ? '#fff' : 'rgba(255,255,255,0.12)',
                  color: tab === t.id ? '#0a0a0a' : 'rgba(255,255,255,0.6)',
                  fontSize: '0.68rem', fontWeight: 900,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {t.aantal}
                </span>
              )}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {tab === 'betaling' ? (
            betalingen.length === 0 ? (
              <div style={{
                padding: '2.5rem 1.25rem', textAlign: 'center',
                color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem', fontWeight: 700, lineHeight: 1.6,
              }}>
                Niemand wacht op betaling.<br />
                Zet een close op “nog niet betaald” en hij komt hier te staan.
              </div>
            ) : (
              betalingen.map(rij => (
                <BetaalRegel key={rij.movement_id} rij={rij} onBetaling={onBetaling} />
              ))
            )
          ) : lijst.length === 0 ? (
            <div style={{
              padding: '2.5rem 1rem', textAlign: 'center',
              color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem', fontWeight: 700,
            }}>
              Geen ingeplande calls.
            </div>
          ) : (
            <>
              {teDoen.length > 0 && (
                <>
                  <Kop tekst="Af te handelen" aantal={teDoen.length} />
                  {teDoen.map(dc => <CallRegel key={dc.movementId} dc={dc} onOutcome={onOutcome} />)}
                </>
              )}
              {komtNog.length > 0 && (
                <>
                  <Kop tekst="Komt nog" aantal={komtNog.length} />
                  {komtNog.map(dc => <CallRegel key={dc.movementId} dc={dc} onOutcome={onOutcome} />)}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    modalHost
  )
}
