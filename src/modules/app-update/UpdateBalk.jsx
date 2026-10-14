// src/modules/app-update/UpdateBalk.jsx
//
// Twee standen:
//   zacht      Een pop-up: er staat een nieuwe versie klaar. "Later" houdt
//              hem drie dagen weg; daarna komt hij terug tot er geüpdatet is.
//              (Tot 14 okt 2026 was dit een dunne balk, die viel niet op.)
//   verplicht  De klant zit onder de minimumversie (app_release.min_version):
//              een scherm over alles heen met alleen een knop naar de winkel.
//              Zo gebruikt niemand een versie waar de rest van het systeem
//              niet meer mee overweg kan.
//
// Werkt op iOS en Android; op het web doet dit niets.

import { useEffect, useState } from 'react'
import { ArrowDownToLine } from 'lucide-react'
import db from '../../services/DatabaseService'
import { APP_VERSIE, isNativeApp, beoordeelVersie } from './appVersie'

const GOUD = '#ffba09'

const openWinkel = (url) => {
  try { window.open(url, '_blank') }
  catch { window.location.href = url }
}

export default function UpdateBalk({ isMobile }) {
  const [stand, setStand] = useState(null)

  useEffect(() => {
    if (!isNativeApp()) return
    let gestopt = false

    const kijk = async () => {
      const uitkomst = await beoordeelVersie(db.supabase)
      if (gestopt) return
      if (!uitkomst) { setStand(null); return }
      if (!uitkomst.verplicht) {
        let weg = null
        try { weg = JSON.parse(localStorage.getItem('myarc_update_weg') || 'null') } catch { /* leeg */ }
        if (weg?.versie === uitkomst.nieuwe && Date.now() - weg.tijd < 3 * 864e5) return
      }
      setStand(uitkomst)
    }

    kijk()
    // Ook kijken zodra de app weer op de voorgrond komt: een update verschijnt
    // zelden precies op het moment dat iemand de app opent.
    const bijTerugkomst = () => { if (document.visibilityState === 'visible') kijk() }
    document.addEventListener('visibilitychange', bijTerugkomst)
    return () => { gestopt = true; document.removeEventListener('visibilitychange', bijTerugkomst) }
  }, [])

  if (!stand) return null

  if (stand.verplicht) return <UpdateVerplicht stand={stand} />

  const sluit = () => {
    try { localStorage.setItem('myarc_update_weg', JSON.stringify({ versie: stand.nieuwe, tijd: Date.now() })) } catch { /* leeg */ }
    setStand(null)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Nieuwe versie"
      onClick={sluit}
      style={{
        position: 'fixed', inset: 0, zIndex: 2147482000, background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: isMobile ? 360 : 400, background: '#111',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20,
          padding: '24px 20px 18px', textAlign: 'left',
        }}
      >
        <div style={{
          width: 48, height: 48, borderRadius: 14, background: 'rgba(255,186,9,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ArrowDownToLine size={24} color={GOUD} strokeWidth={2.6} />
        </div>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginTop: 14, lineHeight: 1.2 }}>
          Nieuwe versie beschikbaar
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginTop: 6, lineHeight: 1.5 }}>
          Je gebruikt versie {APP_VERSIE}. Update naar {stand.nieuwe} voor de nieuwste functies en verbeteringen.
        </div>
        <button
          onClick={() => openWinkel(stand.storeUrl)}
          style={{
            width: '100%', minHeight: 48, marginTop: 20, borderRadius: 12, border: 'none',
            background: '#fff', color: '#0a0a0a', fontSize: 16, fontWeight: 900,
            fontFamily: 'inherit', cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          Nu updaten
        </button>
        <button
          onClick={sluit}
          style={{
            width: '100%', minHeight: 44, marginTop: 6, borderRadius: 12, border: 'none',
            background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 15, fontWeight: 800,
            fontFamily: 'inherit', cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          Later
        </button>
      </div>
    </div>
  )
}

// Over alles heen, zonder sluitknop. Na het updaten start de app opnieuw en
// is deze versie weer goed.
function UpdateVerplicht({ stand }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Update verplicht"
      style={{
        position: 'fixed', inset: 0, zIndex: 2147483000, background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px', paddingTop: 'max(24px, env(safe-area-inset-top))',
        paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
      }}
    >
      <div style={{ width: '100%', maxWidth: 420, textAlign: 'left' }}>
        <ArrowDownToLine size={32} color="#fff" strokeWidth={2.4} />
        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginTop: 16, lineHeight: 1.2 }}>
          Update nodig
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#9ca3af', marginTop: 8, lineHeight: 1.5 }}>
          {stand.bericht || `Je gebruikt versie ${APP_VERSIE}. Om verder te gaan heb je versie ${stand.nieuwe} nodig, met de nieuwste functies.`}
        </div>
        <button
          onClick={() => openWinkel(stand.storeUrl)}
          style={{
            width: '100%', minHeight: 48, marginTop: 24, borderRadius: 12, border: 'none',
            background: '#fff', color: '#0a0a0a', fontSize: 16, fontWeight: 900,
            fontFamily: 'inherit', cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          Nu updaten
        </button>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', marginTop: 12 }}>
          Open de app opnieuw als de update klaar is.
        </div>
      </div>
    </div>
  )
}
