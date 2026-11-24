// src/modules/business-os/AfhandelModal.jsx
//
// Eén knop per klant in Business OS → Klanten (24 nov 2026, Kersten: "ik heb geen
// idee waarvoor al die knoppen"). Hier zeg je wat de klant doet:
//   Betaling binnen · Verlengt · Stopt (borg terug of niet) · Denkt na · Call ingepland · Pauze eraf
// Verlengt opent het gewone verlengvenster (TrajectModal → boekVerlenging), zodat
// het precies zo werkt als in Coach Inzicht en Einde traject. Dit venster schrijft
// zelf niets: alles loopt via de functies van GinoDoorstap.

import { useState } from 'react'
import { createPortal } from '../../client/paginaPortal'
import { X, ChevronLeft, Check } from 'lucide-react'

const euro = (n) => `€${Math.round(Number(n) || 0).toLocaleString('nl-NL')}`
const vandaagIso = () => new Date().toLocaleDateString('sv-SE')
const plusDagen = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toLocaleDateString('sv-SE') }

// r = de rij uit GinoDoorstap. borgSale = gekoppelde challenge-sale (of null).
// borgKandidaten = betaalde open borgen om te koppelen als er nog geen is.
export default function AfhandelModal({ r, naam, vast = false, borgSale, borgKandidaten = [], gekozenBorg = '', onKiesBorg, bezig, fout, onClose, onBetaald, onBetaalLink, onVerleng, onBorgOmzetten, onStatus, onStopt, onHervat, onSluimer }) {
  const [stap, setStap] = useState('kies')
  const [callDatum, setCallDatum] = useState(r.call_datum && r.call_datum >= vandaagIso() ? r.call_datum : '')

  // Kandidaten zijn altijd open en betaald (zo haalt GinoDoorstap ze op).
  const kandidaat = borgKandidaten.find(b => b.id === gekozenBorg)
  const borg = borgSale || (kandidaat ? { ...kandidaat, challenge_status: 'open', payment_received: true } : null)
  const borgTeKiezen = borg && borg.payment_received !== false && ['open', 'behouden', 'terugbetaald'].includes(borg.challenge_status)

  const kaart = { width: '100%', maxWidth: 420, maxHeight: '92dvh', overflowY: 'auto', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '1.1rem 1rem 1.2rem', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }
  const kleinKnop = { width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer' }
  const optie = (id, titel, sub, klik, huidig = false) => (
    <button key={id} type="button" disabled={bezig} onClick={klik} style={{
      width: '100%', minHeight: 58, marginBottom: 8, padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
      background: 'rgba(255,255,255,0.05)', border: `1px solid ${huidig ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 14,
      color: '#fff', fontFamily: 'inherit', cursor: bezig ? 'wait' : 'pointer', textAlign: 'left', opacity: bezig ? 0.6 : 1,
      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
    }}>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: '0.95rem', fontWeight: 900 }}>{titel}</span>
        {sub && <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{sub}</span>}
      </span>
      {huidig && <Check size={18} strokeWidth={3} />}
    </button>
  )
  const vraag = (t) => <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', textAlign: 'center', margin: '2px 0 16px' }}>{t}</div>
  const primair = (tekst, klik, uit = false) => (
    <button type="button" onClick={klik} disabled={bezig || uit} style={{
      width: '100%', minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      background: '#fff', border: 'none', borderRadius: 14, color: '#0a0a0a', fontSize: '0.95rem', fontWeight: 900,
      fontFamily: 'inherit', cursor: 'pointer', opacity: bezig || uit ? 0.5 : 1,
    }}><Check size={16} strokeWidth={3} />{tekst}</button>
  )

  const open = r.sale // onbetaalde verlenging die al geboekt is
  // Betaallink (24 nov 2026): de klant ziet hem in de app met een herinnering.
  const [link, setLink] = useState(open?.betaal_link || '')
  const [linkStand, setLinkStand] = useState(null) // null | 'bezig' | 'ok'
  const linkGewijzigd = (link || '').trim() !== (open?.betaal_link || '')
  const bewaarLink = async () => {
    if (!onBetaalLink) return
    setLinkStand('bezig')
    setLinkStand((await onBetaalLink(link)) ? 'ok' : null)
  }
  const openTekst = open ? `${euro(open.order_value)}${r.pakket ? ` · ${r.pakket}` : ''}` : null

  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 2147483100, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div onClick={(e) => e.stopPropagation()} style={kaart}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          {stap !== 'kies'
            ? <button type="button" onClick={() => setStap('kies')} aria-label="Terug" style={kleinKnop}><ChevronLeft size={18} strokeWidth={2.8} /></button>
            : <div style={{ width: 40 }} />}
          <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Afhandelen</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{naam}</div>
          </div>
          <button type="button" onClick={onClose} aria-label="Sluiten" style={kleinKnop}><X size={18} strokeWidth={2.8} /></button>
        </div>

        {stap === 'kies' && (
          <>
            {vraag('Wat doet hij?')}
            {vast && (
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', textAlign: 'center', margin: '-6px 0 14px' }}>
                Door en betaald{r.pakket ? `: ${r.pakket}` : ''}. Nog een keer verlengen kan.
              </div>
            )}
            {open && optie('betaald', 'Betaling is binnen', openTekst, onBetaald)}
            {open && onBetaalLink && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', margin: '-2px 0 10px' }}>
                <input type="url" value={link} onChange={(e) => { setLink(e.target.value); setLinkStand(null) }} placeholder="Betaallink voor in de app (https://…)"
                  aria-label="Betaallink" style={{ flex: 1, minWidth: 0, minHeight: 40, padding: '0 0.7rem', borderRadius: 10, background: '#111', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 700, outline: 'none', colorScheme: 'dark' }} />
                <button type="button" onClick={bewaarLink} disabled={!linkGewijzigd || linkStand === 'bezig'}
                  style={{ minHeight: 40, padding: '0 0.9rem', borderRadius: 10, border: 'none', fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 900, cursor: linkGewijzigd ? 'pointer' : 'default',
                    background: linkGewijzigd ? '#fff' : 'rgba(255,255,255,0.08)', color: linkGewijzigd ? '#000' : 'rgba(255,255,255,0.5)' }}>
                  {linkStand === 'ok' && !linkGewijzigd ? 'Opgeslagen' : 'Opslaan'}
                </button>
              </div>
            )}
            {!open && optie('verleng', vast ? 'Nog een keer verlengen' : 'Verlengt', 'Maanden, startdatum, prijs, betaald of nog niet', onVerleng)}
            {!vast && <>
            {/* Borg omzetten (24 nov 2026, Joris): geen geld terug, wel een aanbod ervoor in de plaats. */}
            {!open && borgTeKiezen && borg.challenge_status !== 'terugbetaald' && onBorgOmzetten
              && optie('borg-om', 'Borg omzetten', `Borg ${euro(borg.order_value)} wordt de betaling van een aanbod, bv. App 1 jaar`, () => onBorgOmzetten(borg))}
            {optie('stopt', 'Stopt', borgTeKiezen ? `Borg ${euro(borg.order_value)} terug of niet` : 'App gaat op slot na het einde', () => setStap('stopt'), r.status === 'nee')}
            {optie('denkt_na', 'Denkt na', 'Komt bovenaan terug om op te volgen', () => onStatus('denkt_na'), r.status === 'denkt_na')}
            {optie('call', 'Call ingepland', r.status === 'call' && r.call_datum ? `Nu: ${r.call_datum}` : 'Kies de datum', () => setStap('call'), r.status === 'call')}
            </>}
            {onSluimer && (r.sluimer_tot && r.sluimer_tot >= vandaagIso()
              ? optie('wakker', 'Weer oppakken', `Sluimert tot ${r.sluimer_tot}. Terug naar Actie nodig`, () => onSluimer(null))
              : optie('sluimer', 'Even laten rusten', 'Appje gestuurd of wacht op antwoord: uit Actie nodig tot een datum', () => setStap('sluimer')))}
            {r.gepauzeerd && optie('hervat', 'Pauze eraf', 'Traject loopt weer, einddatum schuift mee', onHervat)}
            {!borgSale && r.challenge && borgKandidaten.length > 0 && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)' }}>
                Borg
                <select value={gekozenBorg} onChange={(e) => onKiesBorg(e.target.value)} style={{ flex: 1, minHeight: 36, padding: '0 0.5rem', borderRadius: 10, background: '#111', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', fontFamily: 'inherit', fontWeight: 800, colorScheme: 'dark' }}>
                  <option value="">Niet gekoppeld</option>
                  {borgKandidaten.map(b => <option key={b.id} value={b.id}>{b.lead_name} {euro(b.order_value)}</option>)}
                </select>
              </label>
            )}
          </>
        )}

        {stap === 'stopt' && (
          <>
            {borgTeKiezen ? (
              <>
                {vraag(`Krijgt hij zijn borg van ${euro(borg.order_value)} terug?`)}
                {optie('terug', 'Ja, terugbetaald', 'Valt uit omzet en uitbetaling', () => onStopt(borg, 'terugbetaald'), borg.challenge_status === 'terugbetaald')}
                {optie('houden', 'Nee, borg blijft', 'Telt vanaf nu mee in omzet en uitbetaling', () => onStopt(borg, 'behouden'), borg.challenge_status === 'behouden')}
              </>
            ) : (
              <>
                {vraag('Stopt hij?')}
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginBottom: 16 }}>
                  {borg ? `Borg ${euro(borg.order_value)} is nog niet betaald.` : 'Geen borg gekoppeld.'} De app gaat op slot na het einde.
                </div>
                {primair('Ja, hij stopt', () => onStopt(null, null))}
              </>
            )}
          </>
        )}

        {stap === 'sluimer' && (
          <>
            {vraag('Tot wanneer laten rusten?')}
            {[[2, 'Twee dagen'], [3, 'Drie dagen'], [7, 'Een week']].map(([n, l]) => optie(`s${n}`, l, null, () => onSluimer(plusDagen(n))))}
            <input type="date" min={vandaagIso()} onChange={(e) => e.target.value && onSluimer(e.target.value)} aria-label="Eigen datum"
              style={{ width: '100%', minHeight: 48, boxSizing: 'border-box', padding: '0 0.75rem', marginTop: 4, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, color: '#fff', fontSize: '1rem', fontWeight: 800, fontFamily: 'inherit', colorScheme: 'dark', outline: 'none' }} />
          </>
        )}

        {stap === 'call' && (
          <>
            {vraag('Wanneer is de call?')}
            <input type="date" value={callDatum} min={vandaagIso()} onChange={(e) => setCallDatum(e.target.value)} aria-label="Datum call"
              style={{ width: '100%', minHeight: 48, boxSizing: 'border-box', padding: '0 0.75rem', marginBottom: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, color: '#fff', fontSize: '1rem', fontWeight: 800, fontFamily: 'inherit', colorScheme: 'dark', outline: 'none' }} />
            {primair('Opslaan', () => onStatus('call', { call_datum: callDatum }), !callDatum)}
          </>
        )}

        {fout && <div role="alert" style={{ marginTop: 10, fontSize: '0.75rem', fontWeight: 800, color: '#ef4444', textAlign: 'center' }}>{fout}</div>}
      </div>
    </div>,
    document.body
  )
}
