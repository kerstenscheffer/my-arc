// src/modules/lead-management/components/kanban/EindeTrajectModal.jsx
//
// Einde traject: door of niet door (16 nov 2026, Kersten).
//
// Een klant wiens traject afloopt wordt niet meer vanzelf als gestopt
// weggeboekt. Hij blijft hier staan tot de coach een harde keuze maakt:
//   Call ingepland  → datum; komt terug na die dag
//   Denkt na        → komt na drie dagen terug
//   Ja, door        → periode en bedrag (verlengvenster), betaald of nog niet
//   Challenge → door → 150 extra in 3 termijnen van 50, nog niet betaald
//   Nee, stopt      → op slot; telt vanaf dat moment als gestopt
//
// De lijst komt uit de RPC einde_traject_open(); de keuze staat in
// client_doorstap, dezelfde tabel als Gino → Klanten. De nachtregel zet alleen
// nog op slot bij 'nee' (SQL in ../../einde-traject.sql).
//
// 24 nov 2026: geen eigen keuzelijst meer. Per klant één knop Afhandelen met
// hetzelfde venster als Business OS → Klanten (AfhandelModal): verlengt (aanbod,
// start, prijs, borg, korting), borg omzetten, stopt (borg terug of niet), denkt
// na, call. Op pauze staat iemand onder Wacht: zijn einde ligt nog niet vast.

import { useEffect, useState } from 'react'
import { Lock } from 'lucide-react'
import AfhandelModal from '../../../business-os/AfhandelModal'
import { borgAfronden, borgVanKlant, losseBorgen } from '../../../business-os/borgAfronden'
import { hervatTraject } from '../../../coach-command-center/components/trajectPeriode'
import { supabase } from '../../../../lib/supabase'
import { Venster, VensterKop } from '../../../../components/arc-ui'
import TrajectModal from '../../../coach-command-center/components/TrajectModal'

const LIJN = 'rgba(255,255,255,0.12)'
const DENKT_NA_DAGEN = 3
const vandaagIso = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
const dagKort = (iso) => (iso ? new Date(`${String(iso).slice(0, 10)}T12:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }).replace('.', '') : '')

// Vraagt deze klant nu om een keuze, of wacht hij op een call of bedenktijd?
// eslint-disable-next-line react-refresh/only-export-components -- hoort bij deze pop-up
export function vraagtNuActie(r) {
  // Op pauze: het einde schuift nog op, dus nu niets te beslissen (Dirk Jan, 24 nov 2026).
  if (r.gepauzeerd) return false
  if (r.status === 'call' && r.call_datum && r.call_datum >= vandaagIso()) return false
  if (r.status === 'denkt_na' && r.gezet_at && Date.now() - new Date(r.gezet_at).getTime() < DENKT_NA_DAGEN * 864e5) return false
  // Nog niet afgelopen en al een keuze: wacht tot het einde.
  if (r.dagen > 0 && r.status) return false
  return true
}

// eslint-disable-next-line react-refresh/only-export-components -- hoort bij deze pop-up
export async function haalEindeTraject() {
  const { data, error } = await supabase.rpc('einde_traject_open')
  if (error) { console.warn('Einde traject laden mislukt:', error.message); return [] }
  return data || []
}

// Kort: "17 nov · nog 1 d" of "10 nov · 6 d geleden".
const eindTekst = (r) => `${dagKort(r.einde)} · ${r.dagen > 0 ? `nog ${r.dagen} d` : r.dagen === 0 ? 'vandaag' : `${-r.dagen} d geleden`}`
const standTekst = (r) => (r.status === 'call' ? `call ${dagKort(r.call_datum)}`
  : r.status === 'denkt_na' ? 'denkt na'
    : r.status === 'ja_mondeling' ? 'ja, nog niet geboekt'
      : null)

export default function EindeTrajectModal({ rijen, coachId, isMobile, onClose, onGewijzigd }) {
  const [bezig, setBezig] = useState(null)        // client_id waar een actie op loopt
  const [fout, setFout] = useState(null)
  const [traject, setTraject] = useState(null)    // { client, rij, voorstel, betaald, borgId, borgOmzetten }
  const [afhandel, setAfhandel] = useState(null)  // { r, borg, kandidaten, gekozen } voor het Afhandelen-venster

  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape' && !traject && !afhandel) onClose?.() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose, traject, afhandel])

  const nu = rijen.filter(vraagtNuActie)
  const wacht = rijen.filter(r => !vraagtNuActie(r))

  const bewaarKeuze = (r, status, extra = {}) => supabase.from('client_doorstap').insert({
    client_id: r.client_id, coach_id: r.coach_id || coachId, status, gezet_door: coachId, ...extra,
  }).then(x => x, e => ({ error: e }))

  // Ging hij door de nachtregel op slot terwijl er nog niets besloten was, dan
  // gaat hij weer open zodra de coach "call" of "denkt na" kiest.
  const slotEraf = (r) => (r.op_slot
    ? supabase.from('clients').update({
      account_locked_at: null, account_locked_reason: null, coaching_status: 'active', account_slot_voor_einde: r.einde,
    }).eq('id', r.client_id).then(x => x, e => ({ error: e }))
    : Promise.resolve({ error: null }))

  const doe = async (r, werk) => {
    setBezig(r.client_id); setFout(null)
    try {
      const fouten = (await werk()).map(x => x?.error).filter(Boolean)
      if (fouten.length) throw fouten[0]
      await onGewijzigd?.()
    } catch (e) {
      setFout(`${r.naam}: ${e?.message || 'opslaan mislukt'}`)
    } finally { setBezig(null) }
  }

  const kiesNee = (r) => {
    return doe(r, async () => [
      await bewaarKeuze(r, 'nee'),
      await supabase.from('clients').update({
        account_locked_at: new Date().toISOString(), account_locked_reason: 'Gestopt na einde traject',
        coaching_status: 'ended', coaching_paused_at: null, coaching_pause_reason: null, account_slot_voor_einde: r.einde,
      }).eq('id', r.client_id).then(x => x, e => ({ error: e })),
    ])
  }
  // Ja: het verlengvenster doet het echte werk (einddatum, omzetregel en
  // doorstap-stand via boekVerlenging). Hier komt alleen de klant erbij.
  // betaald = startwaarde; in het venster kies je nog betaald / nog niet + startdatum.
  const kiesJa = async (r, voorstel = null, betaald = true, extra = {}) => {
    setBezig(r.client_id); setFout(null)
    const { data: client, error } = await supabase.from('clients').select('*').eq('id', r.client_id).single().then(x => x, e => ({ error: e }))
    setBezig(null)
    if (error || !client) { setFout(`${r.naam}: klant laden mislukt`); return }
    setTraject({ client, rij: r, voorstel, betaald, ...extra })
  }

  // Afhandelen: borg van de klant erbij zoeken, dan het gedeelde venster openen.
  const openAfhandel = async (r) => {
    setBezig(r.client_id); setFout(null)
    const [borg, kandidaten, { data: klant }] = await Promise.all([
      borgVanKlant(r.client_id), losseBorgen(),
      supabase.from('clients').select('coaching_total_weeks').eq('id', r.client_id).single().then(x => x, () => ({ data: null })),
    ])
    setBezig(null)
    // Challenge = er hangt een borg aan, of hij loopt een traject van 6 weken. Alleen dan de borg-keuze
    // (Elijah, 12 weken coaching, deed nooit een challenge).
    const challenge = !!borg || klant?.coaching_total_weeks === 6
    setAfhandel({ r, borg: borg && borg.payment_received ? borg : null, kandidaten: challenge ? kandidaten : [], challenge, gekozen: '' })
  }
  const sluitAfhandel = () => setAfhandel(null)
  const afhandelBorg = (a) => a.borg || (a.gekozen ? { ...a.kandidaten.find(k => k.id === a.gekozen), challenge_status: 'open', payment_received: true } : null)
  // Gekozen losse borg meteen aan de klant hangen, zodat alle schermen hem kennen.
  const kiesBorg = async (id) => {
    setAfhandel(a => ({ ...a, gekozen: id }))
    if (id) await supabase.from('lead_movements').update({ client_id: afhandel.r.client_id }).eq('id', id).is('client_id', null).then(x => x, () => null)
  }
  const afhandelStopt = async (borg, borgStatus) => {
    const r = afhandel.r
    if (borg && borgStatus) {
      const uit = await borgAfronden(borg, borgStatus)
      if (!uit.ok) { setFout(`${r.naam}: ${uit.error?.message || 'borg afronden mislukt'}`); return }
      if (uit.alUitbetaald) setFout('Deze borg is al aan Marcel uitbetaald. Verreken dat met de volgende uitbetaling.')
    }
    await kiesNee(r)
    sluitAfhandel()
  }
  const afhandelStatus = async (status, extra = {}) => {
    const r = afhandel.r
    await doe(r, async () => [await bewaarKeuze(r, status, extra), await slotEraf(r)])
    sluitAfhandel()
  }

  const veld = {
    height: 32, padding: '0 0.5rem', borderRadius: 8, background: 'transparent',
    border: '1px solid rgba(255,255,255,0.25)', color: '#fff', fontSize: '0.8rem', fontWeight: 800,
    fontFamily: 'inherit', colorScheme: 'dark', outline: 'none', cursor: 'pointer',
  }

  const rij = (r) => {
    const druk = bezig === r.client_id
    const stand = standTekst(r)
    return (
      <div key={r.client_id} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44, padding: '4px 0', borderBottom: `1px solid ${LIJN}`, opacity: druk ? 0.5 : 1 }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'baseline', gap: 8, overflow: 'hidden', whiteSpace: 'nowrap' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.naam}</span>
          <span style={{ flexShrink: 0, fontSize: '0.74rem', fontWeight: 700, color: r.dagen <= 0 ? '#f59e0b' : 'rgba(255,255,255,0.55)' }}>{eindTekst(r)}</span>
          {r.op_slot && <span title="Account staat op slot; gaat weer open bij Call ingepland of Denkt na" style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', color: '#ef4444' }}><Lock size={12} /></span>}
          {r.gepauzeerd && <span style={{ flexShrink: 0, fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>pauze</span>}
          {stand && <span style={{ flexShrink: 0, fontSize: '0.74rem', fontWeight: 800, color: '#fff' }}>· {stand}</span>}
        </div>
        <button type="button" disabled={druk} onClick={() => openAfhandel(r)} style={{ ...veld, flexShrink: 0, padding: '0 0.9rem', fontWeight: 900 }}>
          Afhandelen
        </button>
      </div>
    )
  }

  return (
    <>
      <Venster isMobile={isMobile} onClose={onClose} maxWidth={560} zIndex={2147483000}>
        <VensterKop titel="Einde traject" sub={nu.length ? `${nu.length} te beslissen` : 'Niets te beslissen'} onClose={onClose} isMobile={isMobile} />
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: isMobile ? '0 1rem 1rem' : '0 1.25rem 1.25rem' }}>
          {fout && <div style={{ margin: '0.6rem 0 0', padding: '0.5rem 0.7rem', borderRadius: 9, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', fontSize: '0.8rem', fontWeight: 800 }}>{fout}</div>}

          {nu.map(r => rij(r))}

          {wacht.length > 0 && (
            <>
              <div style={{ margin: '0.9rem 0 0.1rem', fontSize: '0.66rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>Wacht · komt vanzelf terug</div>
              {wacht.map(r => rij(r))}
            </>
          )}

          {rijen.length === 0 && (
            <div style={{ padding: '2rem 0', textAlign: 'center', fontSize: '0.88rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
              Geen trajecten die aflopen of net zijn afgelopen.
            </div>
          )}
        </div>
      </Venster>

      {afhandel && (
        <AfhandelModal
          r={{ ...afhandel.r, sale: null, challenge: afhandel.challenge }}
          naam={afhandel.r.naam}
          borgSale={afhandel.borg}
          borgKandidaten={afhandel.borg ? [] : afhandel.kandidaten}
          gekozenBorg={afhandel.gekozen}
          onKiesBorg={kiesBorg}
          bezig={bezig === afhandel.r.client_id}
          fout={fout}
          onClose={sluitAfhandel}
          onBetaald={sluitAfhandel}
          onVerleng={() => { const a = afhandel; sluitAfhandel(); kiesJa(a.r, null, true, { borgId: afhandelBorg(a)?.id }) }}
          onBorgOmzetten={(borg) => { const a = afhandel; sluitAfhandel(); kiesJa(a.r, null, true, { borgOmzetten: borg }) }}
          onStatus={afhandelStatus}
          onStopt={afhandelStopt}
          onHervat={async () => {
            const r = afhandel.r
            const { data: client } = await supabase.from('clients').select('*').eq('id', r.client_id).single().then(x => x, () => ({ data: null }))
            sluitAfhandel()
            if (client) await doe(r, async () => { try { await hervatTraject(supabase, client); return [] } catch (e) { return [{ error: e }] } })
          }}
        />
      )}

      {traject && (
        <TrajectModal
          open modus="verleng" client={traject.client} coachId={coachId}
          voorstel={traject.voorstel} betaald={traject.betaald}
          borgId={traject.borgId} borgOmzetten={traject.borgOmzetten || null}
          // De doorstap-stand (betaald / ja + afspraak) zet boekVerlenging zelf, net als in
          // Coach Inzicht en Business OS → Klanten.
          onGeboekt={() => onGewijzigd?.()}
          onClose={() => setTraject(null)}
        />
      )}
    </>
  )
}
