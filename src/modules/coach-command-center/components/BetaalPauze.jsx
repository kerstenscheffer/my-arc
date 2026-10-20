// src/modules/coach-command-center/components/BetaalPauze.jsx
//
// Regel onder de looptijd in Coach Inzicht: wat een pauze met de betalingen
// doet. De pauze zelf is de gewone coaching-pauze (coaching_pauses); zodra de
// sale aan de klant gekoppeld is (lead_movements.client_id) tellen termijnen
// tijdens de pauze niet mee in de cashflow, de omzet en de uitbetaling aan de
// partner, en schuiven ze na het hervatten op met de lengte van de pauze.
// Rekenregel: lead-management/betaalPauze.js, in de database pauze_schuif.
import { useCallback, useEffect, useState } from 'react'
import { Link2 } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { termijnenVanSale } from '../../lead-management/betaalPauze'

const ZWAK = 'rgba(255,255,255,0.55)'
const SALE_KOLOMMEN = 'id, lead_name, order_value, payment_type, duration_months, moved_at, is_reservation, reservation_amount, payment_due_date'
const euro = (n) => '€' + Math.round(n).toLocaleString('nl-NL')
const dag = (d) => d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })

export default function BetaalPauze({ client, status }) {
  const [sales, setSales] = useState(null)     // gekoppelde sales
  const [pauzes, setPauzes] = useState({})     // movement id → pauzes
  const [kandidaten, setKandidaten] = useState([])
  const [keuze, setKeuze] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)

  const laad = useCallback(async () => {
    if (!client?.id) return
    const { data } = await supabase.from('lead_movements').select(SALE_KOLOMMEN)
      .eq('client_id', client.id).not('order_value', 'is', null).is('reverted_at', null)
      .order('moved_at', { ascending: false })
    setSales(data || [])
    if (data?.length) {
      const { data: pz } = await supabase.rpc('sale_pauzes_team').then(r => r, () => ({ data: [] }))
      setPauzes(Object.fromEntries((pz || []).map(r => [r.movement_id, r.pauzes])))
      return
    }
    // Nog niets gekoppeld: sales zonder klant om uit te kiezen. Staat de
    // voornaam van de klant in de leadnaam, dan staat die al klaar.
    const { data: los } = await supabase.from('lead_movements').select(SALE_KOLOMMEN)
      .is('client_id', null).not('order_value', 'is', null).gt('order_value', 0).is('reverted_at', null)
      .or('sale_kind.is.null,sale_kind.eq.coaching')
      .order('moved_at', { ascending: false }).limit(80)
    const lijst = los || []
    setKandidaten(lijst)
    const voornaam = (client.first_name || '').trim().toLowerCase()
    const gok = voornaam.length >= 3 ? lijst.find(m => (m.lead_name || '').toLowerCase().includes(voornaam)) : null
    setKeuze(gok?.id || '')
  }, [client?.id, client?.first_name])

  useEffect(() => { laad() }, [laad, status])

  const koppel = async () => {
    if (!keuze) return
    setBezig(true); setFout(null)
    const { error } = await supabase.from('lead_movements').update({ client_id: client.id }).eq('id', keuze)
    setBezig(false)
    if (error) { setFout('Koppelen mislukt.'); return }
    laad()
  }

  if (sales == null) return null
  const gepauzeerd = status === 'paused'

  // Niet gekoppeld: alleen tonen tijdens een pauze, want dan doet het ertoe.
  if (!sales.length) {
    if (!gepauzeerd) return null
    return (
      <div style={{ marginTop: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', fontSize: '0.78rem', fontWeight: 700, color: ZWAK }}>
        <span style={{ color: '#fff', fontWeight: 900 }}>Betalingen lopen door.</span>
        <span>Koppel de sale om ze ook stil te zetten:</span>
        <select value={keuze} onChange={e => setKeuze(e.target.value)}
          style={{ minHeight: 32, padding: '0 0.5rem', borderRadius: 8, background: '#111', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.78rem', fontWeight: 800, fontFamily: 'inherit', maxWidth: '100%' }}>
          <option value="">Kies sale…</option>
          {kandidaten.map(m => (
            <option key={m.id} value={m.id}>
              {m.lead_name || 'Lead'} · {euro(Number(m.order_value))} · {dag(new Date(m.moved_at))}
            </option>
          ))}
        </select>
        <button onClick={koppel} disabled={!keuze || bezig}
          style={{ minHeight: 32, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0 0.7rem', borderRadius: 8, border: 'none', background: keuze ? '#fff' : 'rgba(255,255,255,0.1)', color: keuze ? '#000' : ZWAK, fontSize: '0.78rem', fontWeight: 900, fontFamily: 'inherit', cursor: keuze ? 'pointer' : 'default' }}>
          <Link2 size={13} strokeWidth={2.8} /> {bezig ? 'Bezig…' : 'Koppel'}
        </button>
        {fout && <span style={{ color: '#ef4444', fontWeight: 800 }}>{fout}</span>}
      </div>
    )
  }

  // Gekoppeld: wat staat stil, wat is verschoven.
  const nu = new Date()
  const regels = sales.flatMap(m => termijnenVanSale(m, pauzes[m.id]))
  const stil = regels.filter(t => t.nieuw == null)
  const verschoven = regels.filter(t => t.nieuw && t.nieuw.getTime() !== t.oud.getTime() && t.nieuw >= nu)
  if (!gepauzeerd && !verschoven.length) return null

  return (
    <div style={{ marginTop: '0.4rem', fontSize: '0.78rem', fontWeight: 700, color: ZWAK, lineHeight: 1.45 }}>
      {stil.length > 0 ? (
        <>
          <span style={{ color: '#fff', fontWeight: 900 }}>
            Betalingen stil · {stil.length} {stil.length === 1 ? 'termijn' : 'termijnen'} ({euro(stil.reduce((s, t) => s + t.bedrag, 0))})
          </span>
          {' '}waren {stil.map(t => dag(t.oud)).join(', ')}. Tellen niet mee in omzet en uitbetaling, schuiven op zodra je hervat.
        </>
      ) : gepauzeerd ? (
        <span>Geen termijnen meer open, er staat niets stil.</span>
      ) : (
        <>
          <span style={{ color: '#fff', fontWeight: 900 }}>Betalingen verschoven</span>
          {' '}door de pauze: {verschoven.map(t => `${dag(t.oud)} → ${dag(t.nieuw)}`).join(', ')}.
        </>
      )}
    </div>
  )
}
