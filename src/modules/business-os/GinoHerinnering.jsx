// src/modules/business-os/GinoHerinnering.jsx
//
// Herinneringen uit de bol. Gino zet ze in business_os_herinneringen (op
// verzoek "herinner me …" of uit zichzelf); zodra het moment er is, groeit er
// een kaartje uit de bol. Gedaan = klaar_at, Later = moment verschuiven.
// Realtime + elke 30 s kijken; staat de browser op de achtergrond, dan ook
// een systeemmelding.

import { useState, useEffect, useCallback, useRef } from 'react'
import { Bell, Check, Clock } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { colors } from '../../ui/tokens'
import * as stem from './stem'

const nlTijd = (iso) => new Date(iso).toLocaleString('nl-NL', {
  timeZone: 'Europe/Amsterdam', weekday: 'short', hour: '2-digit', minute: '2-digit',
})

function morgen9() {
  const d = new Date(Date.now() + 864e5)
  const dag = d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Amsterdam' })
  // 09:00 NL-tijd: offset van die dag uit de NL-weergave van 09:00 UTC halen.
  const utc = Date.parse(`${dag}T09:00:00Z`)
  const nl = Date.parse(new Date(utc).toLocaleString('sv-SE', { timeZone: 'Europe/Amsterdam' }).replace(' ', 'T') + 'Z')
  return new Date(utc - (nl - utc)).toISOString()
}

export default function GinoHerinnering() {
  const [open, setOpen] = useState([])
  const gemeld = useRef(new Set())

  const laad = useCallback(async () => {
    const { data } = await supabase.from('business_os_herinneringen')
      .select('id, tekst, moment, bron')
      .is('klaar_at', null).lte('moment', new Date().toISOString())
      .order('moment').limit(5)
      .then(r => r, () => ({ data: null }))
    if (data) setOpen(data)
  }, [])

  useEffect(() => {
    laad()
    const t = setInterval(laad, 30000)
    const kanaal = supabase.channel('business-os-herinneringen')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'business_os_herinneringen' }, () => laad())
      .subscribe()
    return () => { clearInterval(t); supabase.removeChannel(kanaal) }
  }, [laad])

  // Nieuw in beeld: één keer melden (stem of systeemmelding).
  const huidig = open[0]
  useEffect(() => {
    if (!huidig || gemeld.current.has(huidig.id)) return
    gemeld.current.add(huidig.id)
    if (stem.isAan()) stem.spreek(`Herinnering. ${huidig.tekst}`)
    try {
      if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Gino', { body: huidig.tekst })
      }
    } catch { /* geen meldingen */ }
  }, [huidig])

  const zet = async (velden) => {
    if (!huidig) return
    setOpen(o => o.slice(1))
    await supabase.from('business_os_herinneringen').update(velden).eq('id', huidig.id)
      .then(r => r, () => null)
  }
  const gedaan = () => zet({ klaar_at: new Date().toISOString() })
  const later = (ms) => {
    gemeld.current.delete(huidig?.id)
    zet({ moment: ms ? new Date(Date.now() + ms).toISOString() : morgen9() })
  }

  // Eén keer toestemming voor systeemmeldingen vragen, bij de eerste klik.
  const vraagMeldingen = () => {
    try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission() } catch { /* */ }
  }

  if (!huidig) return null
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none', zIndex: 5,
    }}>
      <style>{`
        @keyframes ginoHerinnerUit { 0% { opacity: 0; transform: scale(.25); filter: blur(6px) }
          60% { opacity: 1; transform: scale(1.04); filter: blur(0) } 100% { transform: scale(1) } }
        @keyframes ginoHerinnerBel { 0%, 100% { transform: rotate(0) } 20% { transform: rotate(14deg) }
          40% { transform: rotate(-12deg) } 60% { transform: rotate(8deg) } 80% { transform: rotate(-4deg) } }
      `}</style>
      <div key={huidig.id} role="alertdialog" aria-label="Herinnering van Gino" onClick={vraagMeldingen} style={{
        pointerEvents: 'auto', width: 'min(300px, 86vw)', padding: '16px 16px 14px', borderRadius: 18,
        background: 'rgba(10,12,11,.94)', border: `1px solid ${colors.success}55`,
        boxShadow: `0 0 0 1px rgba(255,255,255,.04), 0 0 60px ${colors.success}40, 0 18px 40px rgba(0,0,0,.6)`,
        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        animation: 'ginoHerinnerUit .55s cubic-bezier(.2,.9,.3,1.2) both', transformOrigin: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Bell size={16} color={colors.success} style={{ animation: 'ginoHerinnerBel 1s ease .5s 2', transformOrigin: '50% 10%' }} />
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.12em', color: colors.success }}>
            HERINNERING{open.length > 1 ? ` · ${open.length}` : ''}
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.45)' }}>
            {nlTijd(huidig.moment)}
          </span>
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.35, marginBottom: 14, wordBreak: 'break-word' }}>
          {huidig.tekst}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" onClick={gedaan} style={knop(true)}>
            <Check size={14} /> Gedaan
          </button>
          <button type="button" onClick={() => later(3600e3)} style={knop(false)}>
            <Clock size={13} /> 1 uur
          </button>
          <button type="button" onClick={() => later(null)} style={knop(false)}>
            Morgen
          </button>
        </div>
      </div>
    </div>
  )
}

const knop = (hoofd) => ({
  flex: hoofd ? 1.4 : 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
  minHeight: 36, padding: '0 10px', borderRadius: 10, cursor: 'pointer',
  fontSize: 13, fontWeight: 800, fontFamily: 'inherit',
  border: hoofd ? 'none' : '1px solid rgba(255,255,255,.14)',
  background: hoofd ? colors.success : 'rgba(255,255,255,.05)',
  color: hoofd ? '#04110a' : '#fff',
})
