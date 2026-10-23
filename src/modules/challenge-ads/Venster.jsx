// src/modules/challenge-ads/Venster.jsx
//
// Detailvenster van het Ads-paneel (ook de Comment-magnets). Via een portal
// naar body: dit scherm staat ook in het leadbord, en een ouder met transform
// maakt van position: fixed een plek op de pagina in plaats van midden in beeld.
// Op mobiel een blad van onderen, op desktop gecentreerd.

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { createPortal } from '../../client/paginaPortal'
import { ZWAK } from './fases'

export default function Venster({ titel, sub, m, onClose, children, breed = false }) {
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    const oud = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = oud }
  }, [onClose])
  return createPortal(
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.78)',
      display: 'flex', alignItems: m ? 'flex-end' : 'center', justifyContent: 'center', padding: m ? 0 : '2rem',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: breed ? 1000 : 640, maxHeight: m ? '90dvh' : '86vh', overflowY: 'auto', overscrollBehavior: 'contain',
        background: '#0b0b0b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: m ? '20px 20px 0 0' : 18,
        padding: m ? '1.1rem 1.1rem calc(1.5rem + env(safe-area-inset-bottom))' : '1.4rem 1.6rem 1.6rem', color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{titel}</div>
            {sub && <div style={{ fontSize: '0.8rem', fontWeight: 700, color: ZWAK, marginTop: 2 }}>{sub}</div>}
          </div>
          <button onClick={onClose} aria-label="Sluiten" style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} strokeWidth={2.6} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  )
}
