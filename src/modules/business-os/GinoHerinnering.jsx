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

export default function GinoHerinnering({ maat = 240, onPraat }) {
  const [open, setOpen] = useState([])
  const [getypt, setGetypt] = useState(0)
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

  // Tekst typen alsof Gino praat (na lijn + ballon); de bol praat zolang mee.
  const tekst = huidig?.tekst || ''
  useEffect(() => {
    if (!tekst) return
    setGetypt(0)
    let n = 0
    let t
    const start = setTimeout(() => {
      onPraat?.(true)
      t = setInterval(() => {
        n += 1
        setGetypt(n)
        if (n >= tekst.length) { clearInterval(t); onPraat?.(false) }
      }, 26)
    }, 750)
    return () => { clearTimeout(start); clearInterval(t); onPraat?.(false) }
  }, [huidig?.id, tekst, onPraat])

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
  const G = colors.success
  const rand = Math.round(maat * 0.04)   // bovenrand van de bol (buitenste streepjes)
  const lijn = maat >= 200 ? 46 : 32
  const klaarGetypt = getypt >= tekst.length
  return (
    <div key={huidig.id} style={{ position: 'absolute', left: 0, top: 0, width: maat, height: maat, pointerEvents: 'none', zIndex: 5 }}>
      <style>{`
        @keyframes ginoGolf { 0% { opacity: .7; transform: scale(.55) } 100% { opacity: 0; transform: scale(1.15) } }
        @keyframes ginoLijn { from { transform: scaleY(0) } to { transform: scaleY(1) } }
        @keyframes ginoPunt { 0% { opacity: 0; transform: scale(0) } 70% { transform: scale(1.6) } 100% { opacity: 1; transform: scale(1) } }
        @keyframes ginoBallon { 0% { opacity: 0; transform: translateX(-50%) scale(.2, .05) } 55% { opacity: 1; transform: translateX(-50%) scale(1.02, .5) }
          100% { opacity: 1; transform: translateX(-50%) scale(1) } }
        @keyframes ginoCursor { 50% { opacity: 0 } }
        @keyframes ginoKnoppen { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: none } }
        .gino-hk:hover { background: ${G}22 !important; border-color: ${G}88 !important }
      `}</style>

      {/* golf uit de bol */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `1px solid ${G}`,
        animation: 'ginoGolf .9s ease-out both' }} />

      {/* punt op de bol + lijn omhoog + punt bij de ballon */}
      <div style={{ position: 'absolute', left: '50%', top: rand - 3, width: 6, height: 6, marginLeft: -3, borderRadius: '50%',
        background: G, boxShadow: `0 0 10px ${G}`, animation: 'ginoPunt .3s ease-out .15s both' }} />
      <div style={{ position: 'absolute', left: '50%', top: rand - lijn, width: 1, height: lijn, marginLeft: -0.5,
        background: `linear-gradient(to top, ${G}, ${G}66)`, boxShadow: `0 0 6px ${G}`,
        transformOrigin: 'bottom', animation: 'ginoLijn .3s ease-out .3s both' }} />

      {/* de ballon */}
      <div role="alertdialog" aria-label="Herinnering van Gino" onClick={vraagMeldingen} style={{
        position: 'absolute', left: '50%', bottom: maat - rand + lijn, width: 'min(320px, 86vw)',
        pointerEvents: 'auto', padding: '13px 16px 12px', borderRadius: 14,
        background: `radial-gradient(120% 140% at 50% 110%, ${G}1f, rgba(4,8,6,.92) 60%)`,
        border: `1px solid ${G}66`,
        boxShadow: `0 0 28px ${G}33, inset 0 0 18px ${G}14`,
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        transformOrigin: '50% 100%', animation: 'ginoBallon .45s cubic-bezier(.2,.9,.3,1.1) .5s both',
      }}>
        {/* aansluitpunt van de lijn */}
        <div style={{ position: 'absolute', left: '50%', bottom: -4, width: 7, height: 7, marginLeft: -3.5,
          transform: 'rotate(45deg)', background: 'rgb(6,12,9)', borderRight: `1px solid ${G}66`, borderBottom: `1px solid ${G}66` }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
          <Bell size={12} color={G} />
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.32em', color: G }}>
            GINO{open.length > 1 ? ` · ${open.length}` : ''}
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, letterSpacing: '.08em', color: 'rgba(255,255,255,.4)' }}>
            {nlTijd(huidig.moment).toUpperCase()}
          </span>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.4, minHeight: 21, wordBreak: 'break-word' }}>
          {tekst.slice(0, getypt)}
          {!klaarGetypt && <span style={{ display: 'inline-block', width: 2, height: '1em', marginLeft: 2, verticalAlign: '-2px',
            background: G, animation: 'ginoCursor .8s steps(1) infinite' }} />}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 12, opacity: klaarGetypt ? 1 : 0,
          animation: klaarGetypt ? 'ginoKnoppen .25s ease-out both' : 'none', pointerEvents: klaarGetypt ? 'auto' : 'none' }}>
          <button type="button" className="gino-hk" onClick={gedaan} style={knop(true)}>
            <Check size={13} /> Gedaan
          </button>
          <button type="button" className="gino-hk" onClick={() => later(3600e3)} style={knop(false)}>
            <Clock size={12} /> 1 uur
          </button>
          <button type="button" className="gino-hk" onClick={() => later(null)} style={knop(false)}>
            Morgen
          </button>
        </div>
      </div>
    </div>
  )
}

const knop = (hoofd) => ({
  flex: hoofd ? 1.3 : 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
  minHeight: 32, padding: '0 10px', borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap',
  fontSize: 12, fontWeight: 800, letterSpacing: '.04em', fontFamily: 'inherit', transition: 'background .15s, border-color .15s',
  border: `1px solid ${hoofd ? colors.success + 'aa' : 'rgba(255,255,255,.14)'}`,
  background: hoofd ? colors.success + '1a' : 'transparent',
  color: hoofd ? colors.success : 'rgba(255,255,255,.8)',
})
