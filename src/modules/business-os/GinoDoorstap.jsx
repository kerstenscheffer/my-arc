// src/modules/business-os/GinoDoorstap.jsx
//
// Doorstap afhandelen bovenaan het Klanten-tabje (3 nov 2026): wie ja zei maar
// nog niet betaalde, en wie nadenkt. Zelfde tabel als DoorstapKeuze
// (client_doorstap, nieuwe rij per wijziging, de laatste telt).
//
// Betaald: staat er al een onbetaalde verlenging, dan wordt die afgevinkt. Zo
// niet, dan boekt TrajectModal hem; zelf boeken zou de omzet dubbel tellen.
// Sinds 5 nov ook het overzicht: elke challenge-klant op één regel, en bovenaan wat de
// challenge echt oplevert. Challenge-klant = actief met een traject van 6 weken, of met een
// doorstap-stand. De sale hangt niet aan de klant (client_id is leeg), dus de euro's bovenaan
// komen rechtstreeks uit de sales en verlengingen.
// De borg telt pas als winst zodra de verlenging betaald is: de trigger uit
// borg-na-doorstap.sql zet hem dan op behouden. Er gaat niets naar de klant of Marcel.

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { colors } from '../../ui/tokens'
import TrajectModal from '../coach-command-center/components/TrajectModal'
import { computePeriod } from '../coach-command-center/components/trajectPeriode'
import { haalVerlengen, EINDCALL_NODIG } from './verlengenData'
import { EisenLijst } from '../challenge-monitor/ChallengeEisenRegel'
import { haalEisen } from '../challenge-monitor/challengeCoach'

const STATUS_KEUZE = [
  ['ja_mondeling', 'Ja'],
  ['denkt_na', 'Denkt na'],
  ['nee', 'Nee'],
]
const CHALLENGE_WEKEN = 6
const GESPREK_VANAF_WEEK = 5

const naamVan = (c) => [c?.first_name, c?.last_name].filter(Boolean).join(' ') || 'Klant'
const euro = (n) => `€${Math.round(Number(n) || 0).toLocaleString('nl-NL')}`

// Bovenaan wat nu telt: eerst wie iets van jou nodig heeft.
const gesprekNodig = (r) => !r.status && !r.gepauzeerd && (r.week || 0) >= GESPREK_VANAF_WEEK
const volgorde = (r) => (r.eindcallNodig ? 0 : r.status === 'ja_mondeling' ? 1 : r.status === 'denkt_na' ? 2 : gesprekNodig(r) ? 3 : !r.status ? 4 : r.status === 'betaald' ? 5 : 6)
const dagKort = (iso) => (iso ? new Date(`${String(iso).slice(0, 10)}T12:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }).replace('.', '') : '—')
const callKort = (iso) => {
  const d = new Date(iso)
  return `${d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/Amsterdam' }).replace(/\./g, '')} ${d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' })}`
}

// Wat de challenge oplevert. De borg telt pas als winst als de verlenging betaald is.
function rekenGeld(rijen) {
  const n = (x) => Number(x) || 0
  const challenges = rijen.filter(r => r.sale_kind === 'challenge' && n(r.order_value) > 0 && r.challenge_status !== 'uitgesteld')
  const verlengingen = rijen.filter(r => r.borg_movement_id && n(r.order_value) > 0)
  const borgVan = new Map(verlengingen.map(v => [v.borg_movement_id, v]))
  const som = (l) => l.reduce((t, r) => t + n(r.order_value), 0)
  const betaaldV = verlengingen.filter(v => v.payment_received)
  const openV = verlengingen.filter(v => !v.payment_received)
  const levend = challenges.filter(c => c.challenge_status !== 'terugbetaald')
  const zekerB = levend.filter(c => c.challenge_status === 'behouden' || borgVan.get(c.id)?.payment_received)
  const toegezegdB = levend.filter(c => !zekerB.includes(c) && borgVan.has(c.id))
  const onzekerB = levend.filter(c => !zekerB.includes(c) && !borgVan.has(c.id))
  return {
    aantal: levend.length,
    verkocht: som(levend),
    zeker: som(zekerB) + som(betaaldV),
    toegezegd: som(toegezegdB) + som(openV),
    onzeker: som(onzekerB),
    onzekerAantal: onzekerB.length,
    refund: som(challenges.filter(c => c.challenge_status === 'terugbetaald')),
  }
}

function Getal({ label, waarde, sub, kleur }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: '1.15rem', fontWeight: 900, color: kleur || colors.textPrimary, fontVariantNumeric: 'tabular-nums', lineHeight: 1.15, whiteSpace: 'nowrap' }}>{waarde}</div>
      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: colors.textPrimary, marginTop: 3, whiteSpace: 'nowrap' }}>{label}</div>
      {sub && <div style={{ fontSize: '0.7rem', fontWeight: 700, color: colors.textSecondary, marginTop: 1, whiteSpace: 'nowrap' }}>{sub}</div>}
    </div>
  )
}

function WeekBalk({ week, weken }) {
  if (!week || !weken) return <span style={{ color: colors.textSecondary }}>—</span>
  const aantal = Math.min(weken, 6)
  const vol = Math.round((week / weken) * aantal)
  return (
    <span title={`Week ${week} van ${weken}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span aria-hidden style={{ display: 'inline-flex', gap: 2 }}>
        {Array.from({ length: aantal }, (_, i) => (
          <span key={i} style={{ width: 7, height: 7, borderRadius: 2, background: i < vol ? colors.textPrimary : 'rgba(255,255,255,0.16)' }} />
        ))}
      </span>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{week}/{weken}</span>
    </span>
  )
}

export default function GinoDoorstap() {
  const [rijen, setRijen] = useState(null)
  const [fout, setFout] = useState(null)
  const [bezig, setBezig] = useState(null)
  const [bevestig, setBevestig] = useState(null)
  const [traject, setTraject] = useState(null) // { client, rij, sinds }
  const [borgen, setBorgen] = useState([]) // open challenge-sales die al betaald zijn
  const [borgKeuze, setBorgKeuze] = useState({}) // client_id → gekozen borg
  const [coachId, setCoachId] = useState(null)
  const [geld, setGeld] = useState(null)
  const [eisen, setEisen] = useState({}) // client_id → stand van de zes eisen
  const [openEisen, setOpenEisen] = useState(null)

  const laad = useCallback(async () => {
    const [ds, kl, au, bg, ch, vl] = await Promise.all([
      supabase.from('client_doorstap').select('client_id, coach_id, status, pakket, gezet_at')
        .order('gezet_at', { ascending: false }).order('id', { ascending: false })
        .then(r => r, e => ({ error: e })),
      supabase.from('clients').select('id, first_name, last_name, coach_id, coaching_start_date, coaching_total_weeks, coaching_paused_days_total, coaching_status, coaching_paused_at').eq('status', 'active').order('first_name')
        .then(r => r, e => ({ error: e })),
      supabase.auth.getUser(),
      supabase.from('lead_movements').select('id, lead_name, order_value')
        .eq('sale_kind', 'challenge').eq('challenge_status', 'open').eq('payment_received', true).is('reverted_at', null)
        .order('lead_name')
        .then(r => r, e => ({ error: e })),
      supabase.from('lead_movements').select('id, order_value, challenge_status, payment_received, borg_movement_id, sale_kind')
        .or('sale_kind.eq.challenge,borg_movement_id.not.is.null').is('reverted_at', null)
        .then(r => r, e => ({ error: e })),
      // Einddatum en eindcall: dezelfde regels als het overzicht Verlengen. Lukt de agenda niet,
      // dan een streepje en geen onterechte melding.
      haalVerlengen(supabase).then(l => l, () => null),
    ])
    if (ds.error || kl.error || bg.error) { setFout((ds.error || kl.error || bg.error).message || 'Laden mislukt'); setRijen([]); return }
    setCoachId(au?.data?.user?.id || null)

    const laatste = new Map()
    ;(ds.data || []).forEach(r => { if (!laatste.has(r.client_id)) laatste.set(r.client_id, r) })
    // Iedereen in het overzicht: wie een stand heeft, of een traject van 6 weken loopt.
    // Een traject dat is afgelopen (app op slot) hoeft hier niet meer tussen, tenzij er een stand is.
    const alle = (kl.data || []).filter(c => (c.coaching_total_weeks === CHALLENGE_WEKEN && c.coaching_status !== 'ended') || laatste.get(c.id)?.status)
    if (!ch.error) setGeld(rekenGeld(ch.data || []))

    // Verlengingen van deze klanten: het bedrag dat nog moet komen, of al betaald is.
    const ids = alle.map(c => c.id)
    const { data: sales, error: saleFout } = ids.length
      ? await supabase.from('lead_movements').select('id, client_id, order_value, borg_movement_id, payment_received')
        .in('client_id', ids).eq('outcome_type', 'verlenging').is('reverted_at', null)
        .order('moved_at', { ascending: false })
        .then(r => r, e => ({ error: e }))
      : { data: [] }
    if (saleFout) { setFout(saleFout.message || 'Laden mislukt'); setRijen([]); return }

    setFout(null)
    setBorgen(bg.data || [])
    const verlengen = new Map((vl || []).map(v => [v.id, v]))
    setRijen(alle
      .map((c) => {
        const stand = laatste.get(c.id) || null
        const eigen = (sales || []).filter(x => x.client_id === c.id)
        const periode = computePeriod(c)
        return {
          client_id: c.id, coach_id: stand?.coach_id || c.coach_id, status: stand?.status || null, pakket: stand?.pakket || null, gezet_at: stand?.gezet_at || null,
          klant: c, sale: eigen.find(x => !x.payment_received) || null, betaaldeSale: eigen.find(x => x.payment_received) || null,
          week: periode ? Math.min(periode.weeksDone + 1, periode.weeksTotal) : null, weken: periode?.weeksTotal || null,
          ...(() => {
            const v = verlengen.get(c.id)
            return { start: v?.start || c.coaching_start_date || null, eind: v?.eind || null, dagen: v?.dagen ?? null, volgendeCall: v?.volgendeCall || null, naamChecken: !!v?.naamChecken, eindcallNodig: v?.actie === EINDCALL_NODIG && c.coaching_status !== 'paused', gepauzeerd: c.coaching_status === 'paused', agendaBekend: !!vl }
          })(),
        }
      })
      .sort((a, b) => volgorde(a) - volgorde(b) || (b.week || 0) - (a.week || 0) || naamVan(a.klant).localeCompare(naamVan(b.klant))))
  }, [])

  useEffect(() => { laad() }, [laad])

  // De eisen per klant, vier tegelijk. Alleen lezen: er komt geen rij in challenge_assignments,
  // want die zet de trofee bij de klant aan.
  useEffect(() => {
    if (!rijen?.length) return undefined
    let weg = false
    const wachtrij = rijen.map(r => r.klant).filter(c => c && eisen[c.id] === undefined)
    const werker = async () => {
      while (wachtrij.length && !weg) {
        const c = wachtrij.shift()
        const e = await haalEisen(c).catch(() => null)
        if (!weg) setEisen(o => ({ ...o, [c.id]: e }))
      }
    }
    for (let i = 0; i < 4; i++) werker()
    return () => { weg = true }
  }, [rijen]) // eslint-disable-line react-hooks/exhaustive-deps

  // Einde aanklikken: looptijd of verlenging aanpassen, hetzelfde venster als in Coach Inzicht.
  const openTraject = async (r) => {
    const { data: client, error } = await supabase.from('clients').select('*').eq('id', r.client_id).single()
      .then(x => x, e => ({ error: e }))
    if (error) { setFout(error.message || 'Klant laden mislukt'); return }
    setTraject({ client, rij: r, sinds: new Date().toISOString() })
  }

  const zetStatus = async (clientId, klantCoach, status, pakket = null) => {
    const { error } = await supabase.from('client_doorstap').insert({
      client_id: clientId, coach_id: klantCoach || coachId, status: status || null, pakket, gezet_door: coachId,
    }).then(r => r, e => ({ error: e }))
    if (error) throw error
  }

  const wijzig = async (clientId, klantCoach, status, pakket) => {
    setBezig(clientId); setFout(null)
    try {
      await zetStatus(clientId, klantCoach, status, pakket)
      await laad()
    } catch (e) { setFout(e.message || 'Opslaan mislukt') }
    setBezig(null)
  }

  const betaald = async (r) => {
    if (bevestig !== r.client_id) { setBevestig(r.client_id); return }
    setBevestig(null); setFout(null)
    if (!r.sale) {
      const { data: client, error } = await supabase.from('clients').select('*').eq('id', r.client_id).single()
        .then(x => x, e => ({ error: e }))
      if (error) { setFout(error.message || 'Klant laden mislukt'); return }
      setTraject({ client, rij: r, sinds: new Date().toISOString() })
      return
    }
    setBezig(r.client_id)
    try {
      const borg = r.sale.borg_movement_id || borgKeuze[r.client_id] || null
      const { data, error } = await supabase.from('lead_movements').update({ payment_received: true, borg_movement_id: borg })
        .eq('id', r.sale.id).select('id').then(x => x, e => ({ error: e }))
      if (error) throw error
      if (!data?.length) throw new Error('Betaling niet opgeslagen (geen rechten op deze rij?)')
      await zetStatus(r.client_id, r.coach_id, 'betaald', r.pakket)
      await laad()
    } catch (e) { setFout(e.message || 'Opslaan mislukt') }
    setBezig(null)
  }

  // TrajectModal dicht: alleen op betaald als er echt een verlenging is geboekt.
  const trajectDicht = async () => {
    const t = traject
    setTraject(null)
    const { data } = await supabase.from('lead_movements').select('id')
      .eq('client_id', t.rij.client_id).eq('outcome_type', 'verlenging').eq('payment_received', true)
      .gte('moved_at', t.sinds).limit(1)
      .then(x => x, () => ({ data: [] }))
    if (!data?.length) { await laad(); return }
    const borg = borgKeuze[t.rij.client_id]
    if (borg) {
      const { error } = await supabase.from('lead_movements').update({ borg_movement_id: borg }).eq('id', data[0].id)
        .then(x => x, e => ({ error: e }))
      if (error) setFout(error.message || 'Borg koppelen mislukt')
    }
    await wijzig(t.rij.client_id, t.rij.coach_id, 'betaald', t.rij.pakket)
  }

  if (rijen === null) return null
  const ja = rijen.filter(r => r.status === 'ja_mondeling')
  // Een borg hoort bij één klant: wat al gekoppeld of gekozen is, kan een ander niet kiezen.
  const bezet = new Set([...ja.map(r => r.sale?.borg_movement_id), ...Object.values(borgKeuze)].filter(Boolean))
  const metStand = rijen.filter(r => r.status)
  const zeiJa = rijen.filter(r => r.status === 'ja_mondeling' || r.status === 'betaald').length
  const gesprekken = rijen.filter(gesprekNodig).length
  const G = '#10b981'
  const lijn = '1px solid rgba(255,255,255,0.1)'
  const kolommen = '148px 48px 48px 92px 44px 138px 112px 46px 62px'
  const dun = { background: 'transparent', border: 'none', color: colors.textPrimary, fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', outline: 'none', maxWidth: '100%' }

  return (
    <div style={{ marginBottom: 24 }}>
      {/* CoachHub zet elke select op 16px (tegen inzoomen op de iPhone). Op de computer hoeft dat niet. */}
      <style>{`@media (min-width: 769px) { select.gd-stand { font-size: 0.78rem !important } }`}</style>
      {geld && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px 18px', paddingBottom: 14 }}>
          <Getal label="Verkocht" waarde={euro(geld.verkocht)} sub={`${geld.aantal} challenges`} />
          <Getal label="Zeker verdiend" waarde={euro(geld.zeker)} kleur={G} />
          <Getal label="Toegezegd" waarde={euro(geld.toegezegd)} />
          <Getal label="Nog onzeker" waarde={euro(geld.onzeker)} sub={`${geld.onzekerAantal} borgen`} kleur="#f59e0b" />
          <Getal label="Refunds" waarde={euro(geld.refund)} />
          <Getal label="Doorstap" waarde={metStand.length ? `${Math.round((zeiJa / metStand.length) * 100)}%` : '—'} sub={`${zeiJa} van ${metStand.length} ja${gesprekken ? ` · ${gesprekken} gesprek open` : ''}`} />
        </div>
      )}

      {fout && <div style={{ fontSize: '0.8rem', fontWeight: 700, color: colors.danger, marginBottom: 8 }}>{fout}</div>}
      {rijen.length === 0 && <div style={{ fontSize: '0.8rem', fontWeight: 700, color: colors.textSecondary }}>Geen challenge-klanten.</div>}

      {rijen.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ width: 'max-content' }}>
            <div style={{ display: 'grid', gridTemplateColumns: kolommen, gap: 8, padding: '0 0 4px', fontSize: '0.72rem', fontWeight: 800, color: colors.textSecondary }}>
              <span>Klant</span><span>Start</span><span>Einde</span><span>Week</span><span>Eisen</span><span>Eindcall</span><span>Stand</span><span style={{ textAlign: 'right' }}>Verl.</span><span />
            </div>
            {rijen.map((r) => {
              const nodig = gesprekNodig(r)
              const bedrag = r.sale?.order_value ?? r.betaaldeSale?.order_value
              return (
                <div key={r.client_id} style={{ borderTop: lijn }}>
                  <div style={{ display: 'grid', gridTemplateColumns: kolommen, gap: 8, alignItems: 'center', minHeight: 28, fontSize: '0.78rem', fontWeight: 800, color: colors.textPrimary }}>
                    <span title={r.pakket || undefined} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{naamVan(r.klant)}</span>
                    <span style={{ whiteSpace: 'nowrap', color: colors.textSecondary }}>{dagKort(r.start)}</span>
                    <button type="button" onClick={() => openTraject(r)} title={`${r.dagen != null ? (r.dagen < 0 ? `${-r.dagen} dagen voorbij` : `Nog ${r.dagen} dagen`) : ''}. Klik: looptijd of verlenging aanpassen`} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', textAlign: 'left', whiteSpace: 'nowrap', color: r.dagen == null ? colors.textSecondary : r.dagen < 0 ? colors.danger : r.dagen <= 7 ? '#f59e0b' : colors.textPrimary }}>{dagKort(r.eind)}</button>
                    <WeekBalk week={r.week} weken={r.weken} />
                    <button type="button" onClick={() => setOpenEisen(o => (o === r.client_id ? null : r.client_id))} title="De zes challenge-eisen" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', textAlign: 'left', fontVariantNumeric: 'tabular-nums', color: eisen[r.client_id]?.alles ? G : colors.textPrimary }}>
                      {eisen[r.client_id] ? `${eisen[r.client_id].behaald}/${eisen[r.client_id].totaal}` : '…'}
                    </button>
                    <span title={r.volgendeCall?.titel || undefined} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: r.eindcallNodig ? colors.danger : r.volgendeCall ? (r.naamChecken ? '#f59e0b' : G) : colors.textSecondary }}>
                      {r.volgendeCall && !r.eindcallNodig ? `${callKort(r.volgendeCall.start)}${r.naamChecken ? ' ?' : ''}` : r.eindcallNodig ? (r.volgendeCall ? `Niet op tijd${r.naamChecken ? ' ?' : ''}` : 'Niet ingepland') : r.gepauzeerd ? 'Pauze' : r.status === 'betaald' ? 'Hoeft niet' : r.agendaBekend ? 'Nog niet nodig' : '—'}
                    </span>
                    {r.status === 'betaald' ? (
                      <span style={{ color: G }}>Betaald</span>
                    ) : (
                      <select className="gd-stand" aria-label={`Stand ${naamVan(r.klant)}`} value={r.status || ''} disabled={bezig === r.client_id}
                        onChange={e => wijzig(r.client_id, r.coach_id, e.target.value, r.pakket)}
                        style={{ ...dun, color: r.status === 'ja_mondeling' ? G : r.status === 'nee' ? colors.danger : nodig ? '#f59e0b' : colors.textPrimary }}>
                        <option value="" style={{ background: '#0a0a0a', color: '#fff' }}>{nodig ? 'Gesprek nodig' : r.gepauzeerd ? 'Pauze' : 'Loopt'}</option>
                        {STATUS_KEUZE.map(([id, label]) => <option key={id} value={id} style={{ background: '#0a0a0a', color: '#fff' }}>{label}</option>)}
                      </select>
                    )}
                    <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: bedrag ? colors.textPrimary : colors.textSecondary }}>{bedrag ? euro(bedrag) : '—'}</span>
                    <span style={{ textAlign: 'right' }}>
                      {r.status === 'ja_mondeling' && (
                        <button type="button" disabled={bezig === r.client_id} onClick={() => betaald(r)}
                          onBlur={() => setBevestig(b => (b === r.client_id ? null : b))}
                          style={{
                            minHeight: 22, padding: '0 8px', borderRadius: 7, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                            background: colors.textPrimary, color: colors.bg, fontSize: '0.72rem', fontWeight: 900, fontFamily: 'inherit',
                          }}>
                          {bevestig === r.client_id ? 'Zeker?' : 'Betaald'}
                        </button>
                      )}
                    </span>
                  </div>
                  {openEisen === r.client_id && <div style={{ padding: '0 0 6px' }}><EisenLijst eisen={eisen[r.client_id]} /></div>}
                  {r.status === 'ja_mondeling' && !r.sale?.borg_movement_id && (
                    <div style={{ padding: '0 0 5px' }}>
                      <select className="gd-stand" aria-label={`Borg van ${naamVan(r.klant)}`} value={borgKeuze[r.client_id] || ''} style={{ ...dun, fontSize: '0.75rem', color: colors.textSecondary }}
                        onChange={e => setBorgKeuze(k => ({ ...k, [r.client_id]: e.target.value }))}>
                        <option value="" style={{ background: '#0a0a0a', color: '#fff' }}>Geen borg gekoppeld</option>
                        {borgen.filter(b => b.id === borgKeuze[r.client_id] || !bezet.has(b.id)).map(b => (
                          <option key={b.id} value={b.id} style={{ background: '#0a0a0a', color: '#fff' }}>Borg {b.lead_name} {euro(b.order_value)}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {traject && (
        <TrajectModal open modus="verleng" client={traject.client} coachId={coachId} onClose={trajectDicht} />
      )}
    </div>
  )
}
