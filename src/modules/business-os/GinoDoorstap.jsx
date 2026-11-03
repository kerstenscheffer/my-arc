// src/modules/business-os/GinoDoorstap.jsx
//
// Doorstap afhandelen bovenaan het Klanten-tabje (3 nov 2026): wie ja zei maar
// nog niet betaalde, en wie nadenkt. Zelfde tabel als DoorstapKeuze
// (client_doorstap, nieuwe rij per wijziging, de laatste telt).
//
// Betaald: staat er al een onbetaalde verlenging, dan wordt die afgevinkt. Zo
// niet, dan boekt TrajectModal hem; zelf boeken zou de omzet dubbel tellen.
// Er gaat niets naar de klant of Marcel.

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { colors } from '../../ui/tokens'
import TrajectModal from '../coach-command-center/components/TrajectModal'

const GROEPEN = [
  { status: 'ja_mondeling', label: 'Ja, nog niet betaald' },
  { status: 'denkt_na', label: 'Denkt na' },
]
const STATUS_KEUZE = [
  ['ja_mondeling', 'Ja'],
  ['denkt_na', 'Denkt na'],
  ['nee', 'Nee'],
  ['', 'Leeg'],
]

const naamVan = (c) => [c?.first_name, c?.last_name].filter(Boolean).join(' ') || 'Klant'
const dagKort = (d) => new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
const euro = (n) => `€${Math.round(Number(n) || 0).toLocaleString('nl-NL')}`

const veld = {
  minHeight: 32, padding: '0 8px', borderRadius: 8, background: colors.bg, color: colors.textPrimary,
  border: '1px solid rgba(255,255,255,0.18)', fontSize: '0.75rem', fontWeight: 800, fontFamily: 'inherit',
}

export default function GinoDoorstap() {
  const [rijen, setRijen] = useState(null)
  const [overig, setOverig] = useState([])
  const [fout, setFout] = useState(null)
  const [bezig, setBezig] = useState(null)
  const [bevestig, setBevestig] = useState(null)
  const [traject, setTraject] = useState(null) // { client, rij, sinds }
  const [coachId, setCoachId] = useState(null)

  const laad = useCallback(async () => {
    const [ds, kl, au] = await Promise.all([
      supabase.from('client_doorstap').select('client_id, coach_id, status, pakket, gezet_at')
        .order('gezet_at', { ascending: false }).order('id', { ascending: false })
        .then(r => r, e => ({ error: e })),
      supabase.from('clients').select('id, first_name, last_name, coach_id').eq('status', 'active').order('first_name')
        .then(r => r, e => ({ error: e })),
      supabase.auth.getUser(),
    ])
    if (ds.error || kl.error) { setFout((ds.error || kl.error).message || 'Laden mislukt'); setRijen([]); return }
    setCoachId(au?.data?.user?.id || null)

    const laatste = new Map()
    ;(ds.data || []).forEach(r => { if (!laatste.has(r.client_id)) laatste.set(r.client_id, r) })
    const klanten = new Map((kl.data || []).map(c => [c.id, c]))
    const open = [...laatste.values()].filter(r => klanten.has(r.client_id) && GROEPEN.some(g => g.status === r.status))

    // Onbetaalde verlengingen van deze klanten: het bedrag dat nog moet komen.
    const ids = open.map(r => r.client_id)
    const { data: sales, error: saleFout } = ids.length
      ? await supabase.from('lead_movements').select('id, client_id, order_value')
        .in('client_id', ids).eq('outcome_type', 'verlenging').eq('payment_received', false).is('reverted_at', null)
        .order('moved_at', { ascending: false })
        .then(r => r, e => ({ error: e }))
      : { data: [] }
    if (saleFout) { setFout(saleFout.message || 'Laden mislukt'); setRijen([]); return }

    setFout(null)
    setRijen(open
      .map(r => ({ ...r, klant: klanten.get(r.client_id), sale: (sales || []).find(s => s.client_id === r.client_id) || null }))
      .sort((a, b) => new Date(a.gezet_at) - new Date(b.gezet_at)))
    setOverig((kl.data || []).filter(c => !laatste.get(c.id)?.status))
  }, [])

  useEffect(() => { laad() }, [laad])

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
      const { data, error } = await supabase.from('lead_movements').update({ payment_received: true })
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
    if (data?.length) await wijzig(t.rij.client_id, t.rij.coach_id, 'betaald', t.rij.pakket)
  }

  if (rijen === null) return null
  const ja = rijen.filter(r => r.status === 'ja_mondeling')
  const nogTeKomen = ja.reduce((s, r) => s + (Number(r.sale?.order_value) || 0), 0)

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0, fontSize: '0.95rem', fontWeight: 900, color: colors.textPrimary }}>
          Doorstap{nogTeKomen > 0 ? ` · ${euro(nogTeKomen)} nog te komen` : ''}
        </div>
        {overig.length > 0 && (
          <select aria-label="Klant doorgeven" value="" disabled={!!bezig} style={veld}
            onChange={e => {
              const c = overig.find(x => x.id === e.target.value)
              if (c) wijzig(c.id, c.coach_id, 'ja_mondeling', null)
            }}>
            <option value="">Klant zei ja…</option>
            {overig.map(c => <option key={c.id} value={c.id}>{naamVan(c)}</option>)}
          </select>
        )}
      </div>

      {fout && <div style={{ fontSize: '0.8rem', fontWeight: 700, color: colors.danger, marginBottom: 8 }}>{fout}</div>}

      {rijen.length === 0 && (
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: colors.textSecondary }}>Niemand staat open.</div>
      )}

      {GROEPEN.map(g => {
        const groep = rijen.filter(r => r.status === g.status)
        if (!groep.length) return null
        return (
          <div key={g.status} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: colors.textSecondary, marginBottom: 4 }}>
              {g.label} · {groep.length}
            </div>
            {groep.map(r => (
              <div key={r.client_id} style={{
                display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '8px 0',
                borderTop: `1px solid ${colors.borderSubtle}`,
              }}>
                <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: colors.textPrimary }}>{naamVan(r.klant)}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textSecondary, marginTop: 4 }}>
                    {[r.pakket, `sinds ${dagKort(r.gezet_at)}`].filter(Boolean).join(' · ')}
                  </div>
                </div>
                {(r.sale || r.status === 'ja_mondeling') && (
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: r.sale ? colors.textPrimary : colors.textSecondary, whiteSpace: 'nowrap' }}>
                    {r.sale ? euro(r.sale.order_value) : 'Nog niet geboekt'}
                  </div>
                )}
                <select aria-label={`Doorstap ${naamVan(r.klant)}`} value={r.status} disabled={bezig === r.client_id} style={veld}
                  onChange={e => wijzig(r.client_id, r.coach_id, e.target.value, r.pakket)}>
                  {STATUS_KEUZE.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                </select>
                {r.status === 'ja_mondeling' && (
                  <button type="button" disabled={bezig === r.client_id} onClick={() => betaald(r)}
                    onBlur={() => setBevestig(b => (b === r.client_id ? null : b))}
                    style={{
                      minHeight: 32, padding: '0 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: colors.textPrimary, color: colors.bg, fontSize: '0.75rem', fontWeight: 900, fontFamily: 'inherit',
                    }}>
                    {bevestig === r.client_id ? 'Zeker weten?' : 'Betaald'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      })}

      {traject && (
        <TrajectModal open modus="verleng" client={traject.client} coachId={coachId} onClose={trajectDicht} />
      )}
    </div>
  )
}
