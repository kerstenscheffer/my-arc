// src/client/components/CheckinReminderPopup.jsx
//
// Twee-fase nudge naar de wekelijkse check-in:
//
//   1. Full-screen modal — initieel, vraagt om aandacht.
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
import { ClipboardCheck, X, ArrowRight, Clock, AlertCircle } from 'lucide-react'
import CheckinService from '../../modules/client-checkin/CheckinService'

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
// is altijd goud zodat 'ie past bij de rest van de app.
const paletteFor = (mode) => {
  if (mode === 'overdue') return { bg: 'rgba(239,68,68,0.18)', border: 'rgba(239,68,68,0.5)',  fg: '#ef4444', icon: AlertCircle }
  if (mode === 'missed')  return { bg: 'rgba(245,158,11,0.18)', border: 'rgba(245,158,11,0.45)', fg: '#f59e0b', icon: ClipboardCheck }
  return                          { bg: 'rgba(255,215,0,0.18)',  border: 'rgba(255,215,0,0.45)',  fg: '#FFD700', icon: ClipboardCheck }
}

const PILL_PALETTE = {
  bg: 'rgba(255,215,0,0.14)',
  border: '#FFD700',
  fg: '#FFD700',
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
  }, [client?.id, db, version])

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
            display: 'flex', alignItems: 'center', gap: 8,
            padding: isMobile ? '0.6rem 1.1rem' : '0.7rem 1.4rem',
            background: PILL_PALETTE.bg,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: `1px solid ${PILL_PALETTE.border}`,
            borderRadius: 999,
            color: PILL_PALETTE.fg,
            fontWeight: 800,
            fontSize: isMobile ? '0.8rem' : '0.88rem',
            cursor: 'pointer',
            touchAction: 'manipulation',
            whiteSpace: 'nowrap',
            boxShadow: '0 -8px 24px rgba(255,215,0,0.18), 0 -2px 8px rgba(0,0,0,0.4)',
            animation: shaking ? 'checkinShake 0.85s cubic-bezier(.36,.07,.19,.97) both' : 'none',
            transition: 'transform 0.18s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(-50%) translateY(-3px)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateX(-50%)' }}
        >
          <Icon size={isMobile ? 16 : 18} strokeWidth={2.4} />
          {mode === 'overdue'
            ? `Check-in ${daysLate}d te laat`
            : mode === 'missed'
            ? 'Check-in openstaand'
            : 'Vul je check-in'}
          <ArrowRight size={isMobile ? 14 : 16} strokeWidth={2.6} />
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

  // ── FULL MODAL ──
  let title, body
  if (mode === 'friday') {
    title = 'Het is vrijdag — tijd voor je check-in'
    body = 'Vul nu je wekelijkse check-in in zodat je coach kan reageren op je week.'
  } else if (mode === 'overdue') {
    title = `Je check-in is ${daysLate} dagen te laat`
    body = 'Vul ‘m nu in. Hoe sneller je coach jouw week ziet, hoe sneller hij kan bijsturen waar nodig.'
  } else {
    title = 'Vrijdag check-in gemist'
    body = 'Je hebt afgelopen vrijdag de check-in niet ingevuld. Vul ‘m alsnog in — je coach wil graag weten hoe het gaat.'
  }

  const overlay = (
    <div
      onClick={handleDismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 2147483400,
        background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        animation: 'checkinPopFade 0.18s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 420,
          background: '#0a0a0a',
          border: '1px solid rgba(255,215,0,0.3)',
          borderRadius: 16,
          padding: isMobile ? '1.1rem 1.1rem 1rem' : '1.4rem 1.4rem 1.2rem',
          color: '#fff',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,215,0,0.06)',
          animation: 'checkinPopIn 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
          position: 'relative',
        }}
      >
        <button
          onClick={handleDismiss}
          aria-label="Later"
          style={{
            position: 'absolute', top: 10, right: 10,
            width: 34, height: 34, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: 'none',
            color: 'rgba(255,255,255,0.45)', cursor: 'pointer',
            touchAction: 'manipulation',
          }}
        >
          <X size={16} />
        </button>

        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: palette.bg, border: `1px solid ${palette.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '0.85rem',
        }}>
          <Icon size={26} color={palette.fg} />
        </div>

        <div style={{
          fontSize: isMobile ? '1.05rem' : '1.15rem',
          fontWeight: 800, color: '#fff', lineHeight: 1.25,
          marginBottom: '0.45rem', paddingRight: 30,
        }}>
          {title}
        </div>
        <div style={{
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          color: 'rgba(255,255,255,0.65)', lineHeight: 1.5,
          marginBottom: '1.15rem',
        }}>
          {body}
        </div>

        <button
          onClick={handleOpenForm}
          style={{
            width: '100%', minHeight: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
            background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
            border: 'none', borderRadius: 10,
            color: '#000', fontWeight: 800, fontSize: '0.95rem',
            cursor: 'pointer', touchAction: 'manipulation',
            letterSpacing: '0.01em',
          }}
        >
          Vul check-in in <ArrowRight size={16} strokeWidth={2.6} />
        </button>

        <button
          onClick={handleDismiss}
          style={{
            width: '100%', minHeight: 40, marginTop: '0.55rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            background: 'transparent', border: 'none',
            color: 'rgba(255,255,255,0.45)', fontWeight: 600,
            fontSize: '0.78rem', cursor: 'pointer',
            touchAction: 'manipulation',
          }}
        >
          <Clock size={13} /> Later
        </button>

        <style>{`
          @keyframes checkinPopFade { from { opacity: 0; } to { opacity: 1; } }
          @keyframes checkinPopIn {
            from { opacity: 0; transform: scale(0.92); }
            to   { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    </div>
  )

  return createPortal(overlay, document.body)
}
