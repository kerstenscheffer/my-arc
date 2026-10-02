// src/modules/app-update/UpdateBalk.jsx
//
// Twee standen:
//   zacht      Eén regel bovenaan de app: er staat een nieuwe versie klaar.
//              Wie wegklikt heeft er geen last meer van tot de vólgende versie.
//   verplicht  De klant zit onder de minimumversie (app_release.min_version):
//              een scherm over alles heen met alleen een knop naar de winkel.
//              Zo gebruikt niemand een versie waar de rest van het systeem
//              niet meer mee overweg kan.
//
// Werkt op iOS en Android; op het web doet dit niets.

import { useEffect, useState } from 'react'
import { ArrowDownToLine, X } from 'lucide-react'
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
        try { weg = localStorage.getItem('myarc_update_weg') } catch { /* leeg */ }
        if (weg === uitkomst.nieuwe) return
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
    try { localStorage.setItem('myarc_update_weg', stand.nieuwe) } catch { /* leeg */ }
    setStand(null)
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 12,
      padding: isMobile ? '0.75rem 1rem' : '0.85rem 1.5rem',
      background: 'rgba(255,186,9,0.09)',
      borderBottom: '1px solid rgba(255,186,9,0.25)',
    }}>
      <ArrowDownToLine size={isMobile ? 17 : 18} color={GOUD} strokeWidth={2.6} style={{ flexShrink: 0 }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: isMobile ? '0.9rem' : '0.95rem', fontWeight: 900, color: '#fff', lineHeight: 1.25 }}>
          Nieuwe versie beschikbaar
        </div>
        <div style={{ fontSize: isMobile ? '0.75rem' : '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
          Je hebt {APP_VERSIE} — versie {stand.nieuwe} staat klaar
        </div>
      </div>

      <button
        onClick={() => openWinkel(stand.storeUrl)}
        style={{
          flexShrink: 0, minHeight: 36, padding: '0 0.9rem', borderRadius: 10, border: 'none',
          background: '#fff', color: '#0a0a0a', fontSize: '0.85rem', fontWeight: 900,
          fontFamily: 'inherit', cursor: 'pointer',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        Updaten
      </button>

      <button
        onClick={sluit}
        aria-label="Later"
        style={{
          flexShrink: 0, width: 32, height: 32, borderRadius: 8, border: 'none',
          background: 'transparent', color: 'rgba(255,255,255,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        <X size={17} strokeWidth={2.8} />
      </button>
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
