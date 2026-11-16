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

import { useEffect, useState } from 'react'
import { Phone, Hourglass, Check, XCircle, Lock, Trophy } from 'lucide-react'
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

const eindTekst = (r) => (r.dagen > 0 ? `loopt af op ${dagKort(r.einde)} (nog ${r.dagen} ${r.dagen === 1 ? 'dag' : 'dagen'})`
  : r.dagen === 0 ? 'loopt vandaag af'
    : `afgelopen op ${dagKort(r.einde)} (${-r.dagen} ${r.dagen === -1 ? 'dag' : 'dagen'} geleden)`)
const standTekst = (r) => (r.status === 'call' ? `Call ${dagKort(r.call_datum)}`
  : r.status === 'denkt_na' ? `Denkt na sinds ${dagKort(r.gezet_at)}`
    : r.status === 'ja_mondeling' ? `Ja gezegd${r.pakket ? ` · ${r.pakket}` : ''}, nog niet geboekt`
      : 'Nog geen keuze')

export default function EindeTrajectModal({ rijen, coachId, isMobile, onClose, onGewijzigd }) {
  const [bezig, setBezig] = useState(null)        // client_id waar een actie op loopt
  const [fout, setFout] = useState(null)
  const [callVoor, setCallVoor] = useState(null)  // client_id waar de datum gevraagd wordt
  const [callDatum, setCallDatum] = useState('')
  const [traject, setTraject] = useState(null)    // { client, rij, voorstel, betaald }
  const [alBetaald, setAlBetaald] = useState(true)

  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape' && !traject) onClose?.() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose, traject])

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

  const kiesCall = (r) => {
    if (!callDatum) return
    doe(r, async () => [await bewaarKeuze(r, 'call', { call_datum: callDatum }), await slotEraf(r)])
      .then(() => { setCallVoor(null); setCallDatum('') })
  }
  const kiesDenktNa = (r) => doe(r, async () => [await bewaarKeuze(r, 'denkt_na'), await slotEraf(r)])
  const kiesNee = (r) => {
    if (!window.confirm(`${r.naam} stopt?\n\nZijn account gaat op slot en hij telt vanaf vandaag als gestopt.`)) return
    doe(r, async () => [
      await bewaarKeuze(r, 'nee'),
      await supabase.from('clients').update({
        account_locked_at: new Date().toISOString(), account_locked_reason: 'Gestopt na einde traject',
        coaching_status: 'ended', coaching_paused_at: null, coaching_pause_reason: null, account_slot_voor_einde: r.einde,
      }).eq('id', r.client_id).then(x => x, e => ({ error: e })),
    ])
  }
  // Ja: het verlengvenster doet het echte werk (einddatum opschuiven en de
  // verlenging als omzet boeken). Hier komt alleen de klant erbij.
  const kiesJa = async (r, voorstel = null, betaald = alBetaald) => {
    setBezig(r.client_id); setFout(null)
    const { data: client, error } = await supabase.from('clients').select('*').eq('id', r.client_id).single().then(x => x, e => ({ error: e }))
    setBezig(null)
    if (error || !client) { setFout(`${r.naam}: klant laden mislukt`); return }
    setTraject({ client, rij: r, voorstel, betaald })
  }

  const knop = (kleur) => ({
    display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 0.75rem', borderRadius: 9,
    background: 'transparent', border: `1px solid ${kleur ? `${kleur}66` : 'rgba(255,255,255,0.2)'}`,
    color: kleur || '#fff', fontSize: '0.8rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap',
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  })

  const rij = (r, metKnoppen) => {
    const druk = bezig === r.client_id
    return (
      <div key={r.client_id} style={{ padding: '0.8rem 0', borderBottom: `1px solid ${LIJN}`, opacity: druk ? 0.5 : 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.98rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em' }}>{r.naam}</span>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: r.dagen <= 0 ? '#f59e0b' : 'rgba(255,255,255,0.55)' }}>{eindTekst(r)}</span>
          {r.op_slot && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.72rem', fontWeight: 800, color: '#ef4444' }}><Lock size={11} /> op slot</span>}
          {r.gepauzeerd && <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)' }}>op pauze</span>}
        </div>
        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{standTekst(r)}</div>

        {metKnoppen && callVoor !== r.client_id && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 9 }}>
            <button disabled={druk} onClick={() => { setCallVoor(r.client_id); setCallDatum(r.call_datum && r.call_datum >= vandaagIso() ? r.call_datum : '') }} style={knop()}><Phone size={14} /> Call ingepland</button>
            <button disabled={druk} onClick={() => kiesDenktNa(r)} style={knop()}><Hourglass size={14} /> Denkt na{r.op_slot ? ' (gaat weer open)' : ''}</button>
            <button disabled={druk} onClick={() => kiesJa(r)} style={knop('#10b981')}><Check size={14} /> Ja, door</button>
            <button disabled={druk} onClick={() => kiesJa(r, { maanden: 3, betaling: 'monthly', prijs: 50 }, false)} title="Challenge-klant gaat door: 150 extra in 3 termijnen van 50, nog niet betaald" style={knop('#10b981')}><Trophy size={14} /> Challenge → 3 × €50</button>
            <button disabled={druk} onClick={() => kiesNee(r)} style={knop('#ef4444')}><XCircle size={14} /> Nee, stopt</button>
          </div>
        )}
        {metKnoppen && callVoor === r.client_id && (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 9 }}>
            <input type="date" autoFocus value={callDatum} min={vandaagIso()} onChange={e => setCallDatum(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') kiesCall(r) }}
              style={{ height: 36, padding: '0 0.6rem', borderRadius: 9, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', fontSize: '0.85rem', fontWeight: 800, fontFamily: 'inherit', colorScheme: 'dark', outline: 'none' }} />
            <button disabled={!callDatum || druk} onClick={() => kiesCall(r)} style={{ ...knop(), background: callDatum ? '#fff' : 'transparent', color: callDatum ? '#0a0a0a' : 'rgba(255,255,255,0.4)', borderColor: callDatum ? '#fff' : 'rgba(255,255,255,0.2)' }}>Opslaan{r.op_slot ? ' (gaat weer open)' : ''}</button>
            <button onClick={() => setCallVoor(null)} style={{ ...knop(), border: 'none', color: 'rgba(255,255,255,0.55)' }}>Annuleer</button>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <Venster isMobile={isMobile} onClose={onClose} maxWidth={680}>
        <VensterKop titel="Einde traject" sub={nu.length ? `${nu.length} ${nu.length === 1 ? 'klant vraagt' : 'klanten vragen'} om een keuze: door of niet door` : 'Niemand vraagt nu om een keuze'} onClose={onClose} isMobile={isMobile} />
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: isMobile ? '0 1rem 1rem' : '0 1.25rem 1.25rem' }}>
          {fout && <div style={{ margin: '0.6rem 0 0', padding: '0.5rem 0.7rem', borderRadius: 9, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', fontSize: '0.8rem', fontWeight: 800 }}>{fout}</div>}

          {nu.length > 0 && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0.8rem 0 0', fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.75)', cursor: 'pointer' }}>
              <input type="checkbox" checked={alBetaald} onChange={e => setAlBetaald(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#10b981' }} />
              Bij "Ja, door" is het geld al binnen
              <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>(uit = toegezegd, komt bij wacht op betaling)</span>
            </label>
          )}

          {nu.map(r => rij(r, true))}

          {wacht.length > 0 && (
            <>
              <div style={{ margin: '1.1rem 0 0', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>Wacht · komt vanzelf terug</div>
              {wacht.map(r => rij(r, true))}
            </>
          )}

          {rijen.length === 0 && (
            <div style={{ padding: '2rem 0', textAlign: 'center', fontSize: '0.88rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
              Geen trajecten die aflopen of net zijn afgelopen.
            </div>
          )}
        </div>
      </Venster>

      {traject && (
        <TrajectModal
          open modus="verleng" client={traject.client} coachId={coachId}
          voorstel={traject.voorstel} betaald={traject.betaald}
          onGeboekt={(pakket) => {
            // De afspraak erbij, zodat Gino → Klanten hetzelfde laat zien.
            bewaarKeuze(traject.rij, traject.betaald ? 'betaald' : 'ja_mondeling', { pakket })
              .then(() => onGewijzigd?.())
          }}
          onClose={() => setTraject(null)}
        />
      )}
    </>
  )
}
