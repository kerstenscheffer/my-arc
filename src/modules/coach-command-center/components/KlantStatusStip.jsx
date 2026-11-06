// src/modules/coach-command-center/components/KlantStatusStip.jsx
//
// Klantstatus op de Command-kaart (6 nov 2026): dezelfde rood/oranje/groen
// als de Klanten-ochtendronde, uit de nieuwste checkin_ronde_items-rij.
// Hover = reden en actie als title, tik = klein venster met hetzelfde.
// De gewichtstempo-kleuren van de kaart blijven daarnaast gewoon staan.
import React, { useRef, useState } from 'react'
import { createPortal } from '../../../client/paginaPortal'
import { useModalHost } from '../../../coach/ModalHost'
import { KLANT_STATUS, GEEN_STATUS as GEEN } from './klantStatus'

export default function KlantStatusStip({ status, isMobile }) {
  const [pos, setPos] = useState(null)
  const knop = useRef(null)
  const modalHost = useModalHost()
  const s = (status && KLANT_STATUS[status.groep]) || GEEN
  const reden = status?.suggesties?.reden || null
  const actie = status?.suggesties?.actie || null
  const titel = [s.label, reden, actie].filter(Boolean).join(' · ')

  const open = (e) => {
    e.stopPropagation()
    if (pos) { setPos(null); return }
    const r = knop.current.getBoundingClientRect()
    const breed = Math.min(280, window.innerWidth - 16)
    setPos({ top: r.bottom + 6, left: Math.max(8, Math.min(r.left - 8, window.innerWidth - breed - 8)), breed })
  }

  return (
    <>
      <button ref={knop} onClick={open} title={titel} aria-label={`Klantstatus: ${titel}`}
        style={{
          flexShrink: 0, alignSelf: 'center', width: isMobile ? 18 : 16, height: isMobile ? 18 : 16,
          padding: 0, margin: '0 -2px', background: 'transparent', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: s.kleur, opacity: status ? 1 : 0.5 }} />
      </button>
      {pos && modalHost && createPortal(
        <>
          <div onClick={() => setPos(null)} style={{ position: 'fixed', inset: 0, zIndex: 2147483500 }} />
          <div style={{
            position: 'fixed', top: pos.top, left: pos.left, width: pos.breed, zIndex: 2147483501,
            background: '#111', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)', padding: '0.6rem 0.75rem',
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 900, color: '#fff' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.kleur }} />
              {s.label}
              {status?.ronde_datum && (
                <span style={{ marginLeft: 'auto', fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>
                  {new Date(status.ronde_datum).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
              )}
            </div>
            {reden && <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)', lineHeight: 1.35 }}>{reden}</div>}
            {actie && <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#fff', lineHeight: 1.35 }}>→ {actie}</div>}
            {!status && <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Geen ronde in de laatste 3 dagen</div>}
          </div>
        </>,
        modalHost
      )}
    </>
  )
}
