// src/modules/business-os/GinoDocument.jsx
//
// Bewerkbaar document boven de Gino-bol (19 nov 2026). Eerste document: de
// avatar. Opslag in business_os_documenten (business-os-documenten.sql), één
// rij per coach per slug. Gino leest hem mee in zijn context en mag hem zelf
// aanpassen (tabel staat op de veilige lijst); na elk antwoord laadt hij opnieuw.
//
// Opmaak is gewone markdown: '#'-kopjes, '- ' en '1. ' lijsten, **vet**,
// [links](..) en |tabellen|. Lezen = opgemaakt; potlood = bewerken in een tekstvak.
// '+ Onderdeel' zet onderaan een nieuw kopje klaar.
//
// Zweeft sinds 20 nov 2026 los over de pagina: sleep aan de kopbalk, de plek
// blijft bewaard (localStorage bos_doc_pos) en wordt binnen het scherm gehouden.
// Sinds 20 nov ook tabs: meerdere documenten in hetzelfde venster (bos_doc_tab).

import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { Pencil, Plus, Check, X, GripVertical } from 'lucide-react'
import { createPortal } from '../../client/paginaPortal'

const POS_SLEUTEL = 'bos_doc_pos'
const TAB_SLEUTEL = 'bos_doc_tab'
const RAND = 8
// Langer dan dit: tikken in de tekst opent geen bewerkvak (je wilt kunnen scrollen en selecteren).
const TIK_BEWERK_MAX = 5000

const KOP = { fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff' }
const TEKST = { color: 'rgba(255,255,255,0.78)', fontSize: '0.88rem', lineHeight: 1.45, overflowWrap: 'anywhere' }

// **vet**, *schuin*, `code` en [tekst](url). Externe links klikbaar, interne bestandsverwijzingen als tekst.
function Inline({ tekst }) {
  const delen = []
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)|`([^`]+)`|\*([^*\s][^*]*?)\*/g
  let laatst = 0
  let m
  while ((m = re.exec(tekst))) {
    if (m.index > laatst) delen.push(tekst.slice(laatst, m.index))
    const k = delen.length
    if (m[1] != null) delen.push(<strong key={k} style={{ color: '#fff', fontWeight: 800 }}><Inline tekst={m[1]} /></strong>)
    else if (m[2] != null) {
      delen.push(/^https?:\/\//.test(m[3])
        ? <a key={k} href={m[3]} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ color: '#fff', textDecoration: 'underline', textUnderlineOffset: 2 }}>{m[2]}</a>
        : <span key={k} style={{ color: '#fff', textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.25)', textUnderlineOffset: 2 }}>{m[2]}</span>)
    } else if (m[4] != null) delen.push(<code key={k} style={{ fontSize: '0.82em', background: 'rgba(255,255,255,0.07)', borderRadius: 4, padding: '1px 4px' }}>{m[4]}</code>)
    else delen.push(<em key={k}>{m[5]}</em>)
    laatst = re.lastIndex
  }
  if (laatst < tekst.length) delen.push(tekst.slice(laatst))
  return <>{delen.map((d, i) => <Fragment key={i}>{d}</Fragment>)}</>
}

const cellen = (r) => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim())

function Tabel({ rijen }) {
  const [kop, ...rest] = rijen.filter(r => !/^\s*\|?\s*:?-{2,}/.test(r)).map(cellen)
  return (
    <div style={{ overflowX: 'auto', margin: '4px 0' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.8rem' }}>
        <thead><tr>{kop.map((c, i) => <th key={i} style={{ textAlign: 'left', padding: '6px 8px', color: '#fff', fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.12)' }}><Inline tekst={c} /></th>)}</tr></thead>
        <tbody>{rest.map((r, i) => (
          <tr key={i}>{r.map((c, j) => <td key={j} style={{ padding: '6px 8px', color: 'rgba(255,255,255,0.78)', verticalAlign: 'top', borderBottom: '1px solid rgba(255,255,255,0.05)' }}><Inline tekst={c} /></td>)}</tr>
        ))}</tbody>
      </table>
    </div>
  )
}

function Weergave({ tekst }) {
  const regels = String(tekst || '').split('\n')
  const uit = []
  for (let i = 0; i < regels.length; i++) {
    const r = regels[i]
    if (/^\s*\|/.test(r)) {
      const blok = []
      while (i < regels.length && /^\s*\|/.test(regels[i])) blok.push(regels[i++])
      i--
      uit.push(<Tabel key={i} rijen={blok} />)
      continue
    }
    const kop = r.match(/^(#{1,4})\s+(.*)$/)
    if (kop) {
      const n = kop[1].length
      const stijl = n === 1
        ? { color: '#fff', fontSize: '1.15rem', fontWeight: 900, letterSpacing: '-0.02em', marginTop: i ? 18 : 0 }
        : n === 4 ? { color: '#fff', fontSize: '0.9rem', fontWeight: 800, marginTop: 12 }
        : n === 3 ? { ...KOP, fontSize: '0.8rem', marginTop: 20, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }
        : { ...KOP, marginTop: i ? 14 : 0 }
      uit.push(<div key={i} style={{ ...stijl, marginBottom: 2 }}><Inline tekst={kop[2]} /></div>)
      continue
    }
    const punt = r.match(/^\s*[-•]\s?(.*)$/)
    const nummer = r.match(/^\s*(\d+)\.\s+(.*)$/)
    if (punt || nummer) {
      uit.push(
        <div key={i} style={{ ...TEKST, display: 'flex', gap: 8 }}>
          <span style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>{nummer ? `${nummer[1]}.` : '•'}</span>
          <span style={{ minWidth: 0 }}>{(nummer ? nummer[2] : punt[1]) ? <Inline tekst={nummer ? nummer[2] : punt[1]} /> : <span style={{ color: 'rgba(255,255,255,0.25)' }}>leeg</span>}</span>
        </div>
      )
      continue
    }
    if (!r.trim()) continue
    uit.push(<div key={i} style={TEKST}><Inline tekst={r} /></div>)
  }
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{uit}</div>
}

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

// documenten: [{ document: useGinoDocument(...), titel }]
export default function GinoDocument({ documenten, isMobile, dicht, setDicht }) {
  const [tab, setTabState] = useState(() => { try { return Number(localStorage.getItem(TAB_SLEUTEL)) || 0 } catch { return 0 } })
  const actief = Math.min(tab, documenten.length - 1)
  const d = documenten[actief].document
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

  // Een document met starttekst (bv. Antwoorden) vult zichzelf de eerste keer dat je de tab opent.
  useEffect(() => { if (d.geladen && !d.doc && d.vulStart) d.vulStart() }, [d])

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

  const kiesTab = (i) => {
    if (i === actief) return
    if (bewerk) klaar()
    setStand(null)
    setTabState(i)
    try { localStorage.setItem(TAB_SLEUTEL, String(i)) } catch { /* leeg */ }
  }

  const knop = { width: 30, height: 30, borderRadius: 9, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }

  return createPortal(
    <div ref={venster} style={{
      position: 'fixed', left: plek.x, top: plek.y, zIndex: 59,
      width: `min(680px, calc(100vw - ${2 * RAND}px))`, height: dicht ? 'auto' : `min(${documenten[actief].hoog ? 620 : 440}px, calc(100dvh - ${plek.y + RAND}px))`,
      display: 'flex', flexDirection: 'column',
      background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, boxSizing: 'border-box', textAlign: 'left',
      boxShadow: '0 18px 50px rgba(0,0,0,0.6)',
    }}>
      <div onPointerDown={pakVast} onPointerMove={beweeg} onPointerUp={laatLos} onPointerCancel={laatLos}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: isMobile ? '10px 12px' : '12px 16px', borderBottom: dicht ? 'none' : '1px solid rgba(255,255,255,0.05)', cursor: 'grab', touchAction: 'none', userSelect: 'none' }}>
        <GripVertical size={15} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0, marginLeft: -4 }} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 4, color: '#fff' }}>
          {documenten.map((x, i) => (
            <button key={x.titel} type="button" onClick={() => kiesTab(i)} aria-pressed={i === actief} style={{
              border: 'none', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
              fontSize: i === actief ? '1rem' : '0.9rem', fontWeight: 900, letterSpacing: '-0.025em',
              background: i === actief ? 'rgba(255,255,255,0.08)' : 'transparent', color: i === actief ? '#fff' : 'rgba(255,255,255,0.4)',
            }}>{x.titel}</button>
          ))}
          {stand === 'bezig' && <span style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginLeft: 4 }}>Opslaan…</span>}
          {stand === 'ok' && <span style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginLeft: 4 }}>Opgeslagen</span>}
          {stand === 'fout' && <span style={{ fontSize: '0.66rem', color: '#ef4444', fontWeight: 700, marginLeft: 4 }}>Niet opgeslagen</span>}
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
          <div key={actief} onClick={d.tekst.length <= TIK_BEWERK_MAX ? () => start() : undefined} title={d.tekst.length <= TIK_BEWERK_MAX ? 'Tik om te bewerken' : undefined}
            style={{ flex: 1, minHeight: 0, overflowY: 'auto', cursor: d.tekst.length <= TIK_BEWERK_MAX ? 'text' : 'auto', padding: isMobile ? '10px 12px 14px' : '12px 16px 16px' }}>
            {d.geladen && (d.doc || !d.vulStart) ? <Weergave tekst={d.tekst} /> : <div style={{ ...TEKST, color: 'rgba(255,255,255,0.35)' }}>Laden…</div>}
          </div>
        )
      )}
    </div>,
    document.body,
  )
}
