// src/modules/app-update/UpdateBalk.jsx
//
// Eén regel bovenaan de app: er staat een nieuwe versie klaar.
//
// Zacht, niet blokkerend. Wie wegklikt heeft er geen last meer van, maar bij de
// vólgende versie staat de balk er weer — het wegklikken geldt per versienummer
// en niet voor altijd.
//
// De balk staat in de normale flow, dus hij duwt de pagina omlaag in plaats van
// er iets onder te verstoppen.

import { useEffect, useState } from 'react'
import { ArrowDownToLine, X } from 'lucide-react'
import { APP_VERSIE, APP_STORE_URL, isIosApp, nieuwerDan, haalStoreVersie } from './appVersie'

const GOUD = '#ffba09'

export default function UpdateBalk({ isMobile }) {
  const [nieuwe, setNieuwe] = useState(null)

  useEffect(() => {
    if (!isIosApp()) return
    let gestopt = false

    const kijk = async () => {
      const winkel = await haalStoreVersie()
      if (gestopt || !winkel) return
      if (!nieuwerDan(winkel, APP_VERSIE)) return
      let weg = null
      try { weg = localStorage.getItem('myarc_update_weg') } catch { /* leeg */ }
      if (weg === winkel) return
      setNieuwe(winkel)
    }

    kijk()
    // Ook kijken zodra de app weer op de voorgrond komt: een update verschijnt
    // zelden precies op het moment dat iemand de app opent.
    const bijTerugkomst = () => { if (document.visibilityState === 'visible') kijk() }
    document.addEventListener('visibilitychange', bijTerugkomst)
    return () => { gestopt = true; document.removeEventListener('visibilitychange', bijTerugkomst) }
  }, [])

  if (!nieuwe) return null

  const sluit = () => {
    try { localStorage.setItem('myarc_update_weg', nieuwe) } catch { /* leeg */ }
    setNieuwe(null)
  }

  const open = () => {
    try { window.open(APP_STORE_URL, '_blank') }
    catch { window.location.href = APP_STORE_URL }
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
          Je hebt {APP_VERSIE} — versie {nieuwe} staat klaar
        </div>
      </div>

      <button
        onClick={open}
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
