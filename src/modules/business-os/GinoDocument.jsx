// src/modules/business-os/GinoDocument.jsx
//
// Bewerkbaar document boven de Gino-bol (19 nov 2026). Eerste document: de
// avatar. Opslag in business_os_documenten (business-os-documenten.sql), één
// rij per coach per slug. Gino leest hem mee in zijn context en mag hem zelf
// aanpassen (tabel staat op de veilige lijst); na elk antwoord laadt hij opnieuw.
//
// Opmaak is gewone tekst: '# ' en '## ' zijn kopjes, '- ' is een opsomming.
// Lezen = opgemaakt; tik erop of op het potlood = bewerken in een tekstvak.
// '+ Onderdeel' zet onderaan een nieuw kopje klaar.
//
// Zweeft sinds 20 nov 2026 los over de pagina: sleep aan de kopbalk, de plek
// blijft bewaard (localStorage bos_doc_pos) en wordt binnen het scherm gehouden.

import { useCallback, useEffect, useRef, useState } from 'react'
import { Pencil, Plus, Check, X, GripVertical } from 'lucide-react'
import { createPortal } from '../../client/paginaPortal'

const POS_SLEUTEL = 'bos_doc_pos'
const RAND = 8

// Houdt het venster binnen beeld; de kopbalk moet altijd te pakken zijn.
function binnenBeeld(p, el) {
  const b = el?.offsetWidth || 680
  const h = el?.offsetHeight || 60
  return {
    x: Math.min(Math.max(RAND, p.x), Math.max(RAND, window.innerWidth - b - RAND)),
    y: Math.min(Math.max(RAND, p.y), Math.max(RAND, window.innerHeight - Math.min(h, 60) - RAND)),
  }
}

function startPlek(isMobile) {
  try {
    const p = JSON.parse(localStorage.getItem(POS_SLEUTEL) || 'null')
    if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) return p
  } catch { /* leeg */ }
  const b = Math.min(680, window.innerWidth - 2 * RAND)
  return { x: Math.round((window.innerWidth - b) / 2), y: isMobile ? 70 : 120 }
}

const KOP = { fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff' }

function Weergave({ tekst }) {
  const regels = String(tekst || '').split('\n')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {regels.map((r, i) => {
        const kop = r.match(/^#{1,3}\s+(.*)$/)
        if (kop) return <div key={i} style={{ ...KOP, marginTop: i ? 14 : 0, marginBottom: 2 }}>{kop[1]}</div>
        const punt = r.match(/^\s*[-•]\s?(.*)$/)
        if (punt) return (
          <div key={i} style={{ display: 'flex', gap: 8, color: 'rgba(255,255,255,0.78)', fontSize: '0.88rem', lineHeight: 1.45 }}>
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>•</span>
            <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{punt[1] || <span style={{ color: 'rgba(255,255,255,0.25)' }}>leeg</span>}</span>
          </div>
        )
        if (!r.trim()) return null
        return <div key={i} style={{ color: 'rgba(255,255,255,0.78)', fontSize: '0.88rem', lineHeight: 1.45, overflowWrap: 'anywhere' }}>{r}</div>
      })}
    </div>
  )
}

export default function GinoDocument({ document: d, titel, isMobile, dicht, setDicht }) {
  const [bewerk, setBewerk] = useState(false)
  const [concept, setConcept] = useState('')
  const [stand, setStand] = useState(null) // null | 'bezig' | 'ok' | 'fout'
  const vak = useRef(null)
  const timer = useRef(null)
  const laatste = useRef('')
  const venster = useRef(null)
  const sleep = useRef(null)
  const [plek, setPlek] = useState(() => startPlek(isMobile))

  // Na laden en bij schermwijziging terug binnen beeld.
  useEffect(() => {
    const pas = () => setPlek(p => binnenBeeld(p, venster.current))
    pas()
    window.addEventListener('resize', pas)
    return () => window.removeEventListener('resize', pas)
  }, [])

  const pakVast = (e) => {
    if (e.button !== 0 || e.target.closest('button')) return
    e.preventDefault()
    sleep.current = { dx: e.clientX - plek.x, dy: e.clientY - plek.y, id: e.pointerId }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const beweeg = (e) => {
    const s = sleep.current
    if (!s || s.id !== e.pointerId) return
    setPlek(binnenBeeld({ x: e.clientX - s.dx, y: e.clientY - s.dy }, venster.current))
  }
  const laatLos = (e) => {
    if (!sleep.current || sleep.current.id !== e.pointerId) return
    sleep.current = null
    setPlek(p => { try { localStorage.setItem(POS_SLEUTEL, JSON.stringify(p)) } catch { /* leeg */ } return p })
  }

  const start = (extra = '') => {
    const basis = d.tekst + extra
    setConcept(basis)
    laatste.current = d.tekst
    setBewerk(true)
    setDicht(false)
    requestAnimationFrame(() => {
      const el = vak.current
      if (!el) return
      el.focus()
      if (extra) { el.selectionStart = el.selectionEnd = basis.length; el.scrollTop = el.scrollHeight }
    })
  }

  const opslaan = useCallback(async (tekst) => {
    if (tekst === laatste.current) return
    setStand('bezig')
    const ok = await d.bewaar(tekst)
    if (ok) laatste.current = tekst
    setStand(ok ? 'ok' : 'fout')
  }, [d])

  // Tijdens typen: na een korte pauze bewaren.
  useEffect(() => {
    if (!bewerk) return
    clearTimeout(timer.current)
    timer.current = setTimeout(() => opslaan(concept), 900)
    return () => clearTimeout(timer.current)
  }, [concept, bewerk, opslaan])

  const klaar = () => { clearTimeout(timer.current); opslaan(concept); setBewerk(false) }

  const knop = { width: 30, height: 30, borderRadius: 9, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }

  return createPortal(
    <div ref={venster} style={{
      position: 'fixed', left: plek.x, top: plek.y, zIndex: 59,
      width: `min(680px, calc(100vw - ${2 * RAND}px))`, height: dicht ? 'auto' : `min(440px, calc(100dvh - ${plek.y + RAND}px))`,
      display: 'flex', flexDirection: 'column',
      background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, boxSizing: 'border-box', textAlign: 'left',
      boxShadow: '0 18px 50px rgba(0,0,0,0.6)',
    }}>
      <div onPointerDown={pakVast} onPointerMove={beweeg} onPointerUp={laatLos} onPointerCancel={laatLos}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: isMobile ? '10px 12px' : '12px 16px', borderBottom: dicht ? 'none' : '1px solid rgba(255,255,255,0.05)', cursor: 'grab', touchAction: 'none', userSelect: 'none' }}>
        <GripVertical size={15} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0, marginLeft: -4 }} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#fff' }}>
          <span style={{ fontSize: '1rem', fontWeight: 900, letterSpacing: '-0.025em' }}>{titel}</span>
          {stand === 'bezig' && <span style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>Opslaan…</span>}
          {stand === 'ok' && <span style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>Opgeslagen</span>}
          {stand === 'fout' && <span style={{ fontSize: '0.66rem', color: '#ef4444', fontWeight: 700 }}>Niet opgeslagen</span>}
        </div>
        {!dicht && (
          <>
            <button type="button" onClick={() => (bewerk ? setConcept(c => `${c.replace(/\s*$/, '')}\n\n## Nieuw onderdeel\n`) : start(`${d.tekst.endsWith('\n') ? '' : '\n'}\n## Nieuw onderdeel\n`))} title="Onderdeel toevoegen" aria-label="Onderdeel toevoegen" style={knop}>
              <Plus size={15} strokeWidth={2.6} />
            </button>
            {bewerk
              ? <button type="button" onClick={klaar} title="Klaar" aria-label="Klaar" style={{ ...knop, background: '#fff', color: '#000', border: 'none' }}><Check size={15} strokeWidth={3} /></button>
              : <button type="button" onClick={() => start()} title="Bewerken" aria-label="Bewerken" style={knop}><Pencil size={14} strokeWidth={2.6} /></button>}
          </>
        )}
        <button type="button" onClick={() => { if (bewerk) klaar(); setDicht(true) }} title="Sluiten" aria-label="Sluiten" style={knop}><X size={15} strokeWidth={2.6} /></button>
      </div>
      {!dicht && (
        bewerk ? (
          <textarea ref={vak} value={concept} onChange={e => setConcept(e.target.value)} onBlur={() => { clearTimeout(timer.current); opslaan(concept) }}
            spellCheck={false}
            style={{
              flex: 1, minHeight: 120, width: '100%', boxSizing: 'border-box', resize: 'none', border: 'none', outline: 'none',
              background: 'transparent', color: '#fff', fontFamily: 'inherit', fontSize: '0.88rem', lineHeight: 1.5,
              padding: isMobile ? '10px 12px' : '12px 16px',
            }} />
        ) : (
          <div onClick={() => start()} title="Tik om te bewerken" style={{ flex: 1, minHeight: 0, overflowY: 'auto', cursor: 'text', padding: isMobile ? '10px 12px 14px' : '12px 16px 16px' }}>
            {d.geladen ? <Weergave tekst={d.tekst} /> : null}
          </div>
        )
      )}
    </div>,
    document.body,
  )
}
