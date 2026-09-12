// src/client/components/CheckinReminderPopup.jsx
//
// Twee-fase nudge naar de wekelijkse check-in:
//
//   1. Melding rechtsboven die vanaf rechts inschuift, in dezelfde vorm als
//      het compliment op de workout-pagina.
//   2. Persistente pill-widget — verschijnt zodra de klant de modal
//      wegklikt. Blijft hangen rechtsonder totdat de check-in is
//      ingevuld of de pagina opnieuw geladen wordt (dan opnieuw modal).
//      Schudt elke ~25 seconden om aandacht te trekken.
//
// Geen localStorage-snooze meer: de gebruiker vroeg expliciet om iets
// dat zichtbaar blijft na wegklikken. De pill-widget vervult die rol.
//
// Toon escaleert op basis van hoeveel dagen overdue:
//   • Vrijdag vandaag        → goud (vriendelijk)
//   • 1-2 dagen te laat       → amber (zacht waarschuwend)
//   • 3+ dagen te laat       → rood (dwingend, sneller schudden)

import React, { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ClipboardCheck, X, ArrowRight, AlertCircle } from 'lucide-react'
import CheckinService from '../../modules/client-checkin/CheckinService'
import { trajectLoopt } from '../../modules/client-checkin/trajectStatus'

const daysSinceLastFriday = () => {
  const day = new Date().getDay() // 0=Sun..6=Sat
  if (day === 5) return 0
  if (day === 6) return 1                  // Zaterdag
  return day + 2                           // Zo=2, Ma=3, Di=4, Wo=5, Do=6
}

// Hoe vaak schudt de pill-widget (in ms). Sneller naarmate je later bent.
const shakeIntervalFor = (daysLate) => {
  if (daysLate >= 5) return 15000  // bijna een week → om de 15s
  if (daysLate >= 3) return 20000  // 3-4 dagen      → om de 20s
  return 28000                      // 0-2 dagen      → om de 28s
}

// Visueel palet — voor de modal blijft kleur-escalatie (goud → amber →
// rood) omdat dat scherper aandacht trekt zodra je te laat bent. De pill
// is wit; rood en amber blijven, want die dragen betekenis (te laat / gemist).
const paletteFor = (mode) => {
  if (mode === 'overdue') return { bg: 'rgba(239,68,68,0.18)', border: 'rgba(239,68,68,0.5)',  fg: '#ef4444', icon: AlertCircle }
  if (mode === 'missed')  return { bg: 'rgba(245,158,11,0.18)', border: 'rgba(245,158,11,0.45)', fg: '#f59e0b', icon: ClipboardCheck }
  return                          { bg: 'rgba(255,255,255,0.12)', border: 'rgba(255,255,255,0.35)', fg: '#ffffff', icon: ClipboardCheck }
}

export default function CheckinReminderPopup({ client, db, onOpen, isMobile: propMobile, version = 0 }) {
  const isMobile = propMobile ?? (typeof window !== 'undefined' && window.innerWidth <= 768)

  // 'friday'   → vandaag IS vrijdag, nog niet ingevuld
  // 'missed'   → 1-2 dagen na vrijdag, niets ingevuld
  // 'overdue'  → 3+ dagen na vrijdag — dwingender
  // null       → geen popup
  const [mode, setMode] = useState(null)
  const [phase, setPhase] = useState('init')   // 'init' | 'modal' | 'pill' | 'hidden'
  const [daysLate, setDaysLate] = useState(0)
  const [shaking, setShaking] = useState(false)
  // Eenmaal verstuurd in deze sessie → nooit meer tonen. version bumpt alleen
  // na een echte submit, dus dit is een harde garantie dat de melding niet
  // terugkomt — ook niet als de DB-check een keer hapert.
  const submittedRef = useRef(false)

  useEffect(() => {
    if (!client?.id || !db?.supabase) return
    // Een nieuwe `version` van de parent = er is net een check-in opgeslagen.
    // Markeer als verstuurd en verberg meteen; her-evalueren slaan we over.
    if (version > 0) submittedRef.current = true
    if (submittedRef.current) { setPhase('hidden'); return }
    let cancelled = false

    const evaluate = async () => {
      // Geen lopend traject = niets te laat. Mensen met alleen een account
      // kregen hier anders de 'overdue'-melding te zien.
      if (!trajectLoopt(client)) {
        setPhase('hidden')
        return
      }
      const day = new Date().getDay()
      const isFriday = day === 5
      // Vanaf zaterdag t/m donderdag blijven we vragen zolang de afgelopen
      // vrijdag niet is ingevuld. Op vrijdag zelf vragen we voor "vandaag".
      const isPostFridayWindow = [6, 0, 1, 2, 3, 4].includes(day)
      if (!isFriday && !isPostFridayWindow) {
        setPhase('hidden')
        return
      }
      try {
        const service = new CheckinService(db)
        const filled = await service.hasCheckinSinceLastFriday(client.id)
        if (cancelled) return
        if (filled) {
          setPhase('hidden')
          return
        }
        const late = daysSinceLastFriday()
        setDaysLate(late)
        if (isFriday)          setMode('friday')
        else if (late >= 3)    setMode('overdue')
        else                   setMode('missed')
        setPhase('modal')
      } catch {
        // Bij fout onzichtbaar — coach kan via andere kanalen achterna gaan.
        setPhase('hidden')
      }
    }
    evaluate()
    return () => { cancelled = true }
  }, [client, db, version])

  // Periodieke schud-animatie van de pill om aandacht te trekken. Alleen
  // actief in 'pill' fase, sneller naarmate je later bent.
  useEffect(() => {
    if (phase !== 'pill') return
    const interval = shakeIntervalFor(daysLate)
    const id = setInterval(() => {
      setShaking(true)
      setTimeout(() => setShaking(false), 900)
    }, interval)
    return () => clearInterval(id)
  }, [phase, daysLate])

  if (phase === 'init' || phase === 'hidden') return null

  const handleDismiss = () => setPhase('pill')
  const handleOpenForm = () => {
    setPhase('pill')  // na invullen + return zien we 'm als pill, en
                      // bij volgende pageload zal evaluate hem opnieuw
                      // verbergen als de check-in is opgeslagen.
    onOpen?.()
  }
  const handlePillClick = () => setPhase('modal')

  const palette = paletteFor(mode)
  const Icon = palette.icon
  // Als vraag en met de voornaam erbij: dat leest als je coach die het vraagt
  // in plaats van als een systeemmelding.
  const voornaam = client?.first_name?.trim()
  const vraag = voornaam ? `Check-in invullen, ${voornaam}?` : 'Check-in invullen?'

  // ── PILL WIDGET ──
  // Gecentreerd boven de floating navbar, met de onderste helft achter
  // de balk verstopt (z-index lager dan de bar, die op 100 zit). Zo lijkt
  // het of de pill van achter de bar omhoog komt en bovenaan uitsteekt.
  // Gouden palet zodat 'ie matched met de rest van de app.
  if (phase === 'pill') {
    return createPortal(
      <>
        <button
          onClick={handlePillClick}
          aria-label="Open check-in"
          style={{
            position: 'fixed',
            // Navbar staat op bottom:30 en is ~60px hoog → top-rand op ~90.
            // Pill op bottom:86 zit nét aan de bovenkant van de bar en
            // steekt duidelijk erboven uit op telefoon.
            bottom: 86,
            left: '50%',
            transform: 'translateX(-50%)',
            // Lager dan de navbar (z-index 100) — geeft het "erachter
            // weg komen"-effect zonder dat de hele pill verdwijnt.
            zIndex: 90,
            width: isMobile ? 250 : 280,
            height: isMobile ? 46 : 50,
            padding: 0,
            overflow: 'hidden',
            background: '#0a0a0a',
            border: `1px solid ${mode === 'friday' ? 'rgba(255,255,255,0.35)' : palette.border}`,
            borderRadius: 999,
            cursor: 'pointer',
            touchAction: 'manipulation',
            boxShadow: '0 -8px 24px rgba(0,0,0,0.5), 0 -2px 8px rgba(0,0,0,0.4)',
            animation: shaking ? 'checkinShake 0.85s cubic-bezier(.36,.07,.19,.97) both' : 'none',
            transition: 'transform 0.18s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(-50%) translateY(-3px)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateX(-50%)' }}
        >
          {/* Zelfde opbouw als de melding rechtsboven, in het klein: foto
              rechts, fade naar links, tekst eroverheen. */}
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: '38%',
            backgroundImage: 'url(/coach-compliment.jpg)',
            backgroundSize: 'cover', backgroundPosition: 'center 30%',
          }} />
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(90deg, #0a0a0a 0%, #0a0a0a 44%, rgba(10,10,10,0.85) 60%, rgba(10,10,10,0.35) 82%, rgba(10,10,10,0) 100%)',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', gap: 7,
            padding: isMobile ? '0 0.9rem' : '0 1.1rem',
            color: mode === 'friday' ? '#fff' : palette.fg,
            fontWeight: 900,
            fontSize: isMobile ? '0.82rem' : '0.9rem',
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
            textShadow: '0 2px 10px rgba(0,0,0,0.85)',
          }}>
            <Icon size={isMobile ? 15 : 17} strokeWidth={2.6} style={{ flexShrink: 0 }} />
            {vraag}
            <ArrowRight size={isMobile ? 14 : 16} strokeWidth={2.8} style={{ flexShrink: 0 }} />
          </div>
        </button>
        <style>{`
          /* Pill is gecentreerd via translateX(-50%), dus de shake-keyframes
             nemen die offset mee anders 'springt' de pill bij elke shake. */
          @keyframes checkinShake {
            0%, 100% { transform: translateX(-50%) rotate(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(calc(-50% - 4px)) rotate(-1.2deg); }
            20%, 40%, 60%, 80%      { transform: translateX(calc(-50% + 4px)) rotate(1.2deg); }
          }
        `}</style>
      </>,
      document.body
    )
  }

  // ── MELDING RECHTSBOVEN ──
  // Zelfde vorm als het compliment op de workout-pagina: schuift vanaf rechts
  // in beeld en blijft aan die rand plakken, met de coach-foto rechts en de
  // tekst links eroverheen. Was een schermvullende modal met een donkere waas
  // erachter; dat blokkeerde de hele app voor een herinnering.
  const title = vraag
  const body = mode === 'friday'
    ? 'Het is vrijdag. Dan kan je coach op je week reageren.'
    : mode === 'overdue'
      ? `Al ${daysLate} dagen te laat. Hoe eerder, hoe eerder hij kan bijsturen.`
      : 'Afgelopen vrijdag niet ingevuld.'

  const breedte = isMobile ? 'min(330px, 88vw)' : 380
  const hoogte = isMobile ? 84 : 94

  const overlay = (
    <div
      onClick={handleOpenForm}
      style={{
        position: 'fixed',
        right: 0,
        // Onder de plek van het compliment op de workout-pagina, zodat de twee
        // elkaar niet overlappen als ze tegelijk in beeld staan.
        top: isMobile ? 'calc(env(safe-area-inset-top, 0px) + 180px)' : 214,
        zIndex: 97,
        width: breedte, height: hoogte,
        borderRadius: '16px 0 0 16px',
        overflow: 'hidden',
        background: '#0a0a0a',
        border: `1px solid ${mode === 'friday' ? 'rgba(255,255,255,0.12)' : palette.border}`,
        borderRight: 'none',
        boxShadow: '0 16px 44px rgba(0,0,0,0.6)',
        cursor: 'pointer',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        animation: 'checkinSchuifIn 0.42s cubic-bezier(0.22, 1, 0.36, 1) both',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0,
        width: '40%',
        backgroundImage: 'url(/coach-compliment.jpg)',
        backgroundSize: 'cover', backgroundPosition: 'center 30%',
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(90deg, #0a0a0a 0%, #0a0a0a 42%, rgba(10,10,10,0.88) 56%, rgba(10,10,10,0.5) 72%, rgba(10,10,10,0.14) 90%, rgba(10,10,10,0) 100%)',
      }} />

      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: 0,
        width: '68%',
        padding: isMobile ? '0.5rem 0.4rem 0.5rem 0.9rem' : '0.6rem 0.5rem 0.6rem 1.1rem',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: isMobile ? '0.98rem' : '1.1rem',
          fontWeight: 900, color: mode === 'friday' ? '#fff' : palette.fg,
          letterSpacing: '-0.025em', lineHeight: 1.1,
          textShadow: '0 2px 10px rgba(0,0,0,0.8)',
        }}>
          <Icon size={isMobile ? 15 : 17} strokeWidth={2.6} style={{ flexShrink: 0 }} />
          {title}
        </div>
        <div style={{
          fontSize: isMobile ? '0.7rem' : '0.76rem',
          fontWeight: 800, color: 'rgba(255,255,255,0.72)',
          lineHeight: 1.3,
          overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
          textShadow: '0 2px 8px rgba(0,0,0,0.8)',
        }}>
          {body}
        </div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); handleDismiss() }}
        aria-label="Later"
        style={{
          position: 'absolute', top: 5, right: 6,
          width: 24, height: 24, padding: 0,
          background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: 7,
          color: '#fff', opacity: 0.85,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        <X size={13} strokeWidth={2.8} />
      </button>

      <style>{`
        @keyframes checkinSchuifIn {
          from { transform: translateX(105%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  )

  return createPortal(overlay, document.body)
}
