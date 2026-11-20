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
// Sinds 20 nov werkt het als Google Docs: één zwart vlak met dikke witte rand,
// links daaraan vast de tabbladen (subtabs, hernoemen, volgorde, verwijderen).
// Kersten en Gino schrijven allebei in de tabs. Data: useGinoDocumenten().
// Formaat aan te passen via de hoek rechtsonder (bos_doc_maat).
// Zijbalk: tabs slepen (bovenrand = ervoor, midden = subtab, onderrand = erna),
// in-/uitspringen via ⋮ (ook op telefoon) en vastzetten (sectie Vastgezet bovenaan).

import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { Pencil, Plus, Check, X, GripVertical, ChevronDown, ChevronRight, FileText, MoreVertical, PanelLeft, Pin } from 'lucide-react'
import { createPortal } from '../../client/paginaPortal'

const POS_SLEUTEL = 'bos_doc_pos'
const TAB_SLEUTEL = 'bos_doc_tab_id'
const MAAT_SLEUTEL = 'bos_doc_maat'
const DICHT_SLEUTEL = 'bos_doc_ingeklapt'
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

const lees = (k, terug) => { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? terug } catch { return terug } }
const schrijf = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* leeg */ } }

// Houdt het venster binnen beeld; de kopbalk moet altijd te pakken zijn.
function binnenBeeld(p, el) {
  const b = el?.offsetWidth || 680
  return {
    x: Math.min(Math.max(RAND, p.x), Math.max(RAND, window.innerWidth - Math.min(b, 120) - RAND)),
    y: Math.min(Math.max(RAND, p.y), Math.max(RAND, window.innerHeight - 60 - RAND)),
  }
}

function startPlek(isMobile) {
  const p = lees(POS_SLEUTEL, null)
  if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) return p
  const b = Math.min(1040, window.innerWidth - 2 * RAND)
  return { x: Math.round((window.innerWidth - b) / 2), y: isMobile ? 70 : 90 }
}

const WIT = '#fff'
const ZACHT = 'rgba(255,255,255,0.55)'
const knop = { width: 30, height: 30, borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: WIT, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }
const menuRegel = { display: 'block', width: '100%', textAlign: 'left', border: 'none', background: 'transparent', color: WIT, fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 600, padding: '8px 12px', cursor: 'pointer', borderRadius: 8 }

// Eén regel in de tabbladenlijst, met zijn subtabs eronder.
function TabRegel({ tab, alle, sectie, diepte, actief, kies, dicht, wisselDicht, menuVoor, setMenuVoor, hernoemVoor, setHernoemVoor, acties }) {
  // In de gewone lijst staan vastgezette tabs niet nog een keer: die staan bovenaan, met hun subtabs.
  const kinderen = alle.filter(t => t.parent_id === tab.id && (sectie === 'vast' || !t.vastgezet))
  const isActief = tab.id === actief
  const ingeklapt = dicht.includes(tab.id)
  const [naam, setNaam] = useState(tab.titel)
  const [zeker, setZeker] = useState(false)
  useEffect(() => { if (hernoemVoor === tab.id) setNaam(tab.titel) }, [hernoemVoor, tab.id, tab.titel])
  useEffect(() => { if (menuVoor !== tab.id) setZeker(false) }, [menuVoor, tab.id])
  const klaarNaam = () => { acties.hernoem(tab.id, naam); setHernoemVoor(null) }
  const broers = alle.filter(t => (t.parent_id || null) === (tab.parent_id || null))
  const kanIn = broers.findIndex(t => t.id === tab.id) > 0
  const doel = acties.doel?.id === tab.id ? acties.doel.plek : null
  const sleepbaar = hernoemVoor !== tab.id
  return (
    <>
      <div onClick={() => kies(tab.id)}
        draggable={sleepbaar}
        onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', tab.id); acties.setSleep(tab.id); setMenuVoor(null) }}
        onDragEnd={() => { acties.setSleep(null); acties.setDoel(null) }}
        onDragOver={(e) => {
          if (!acties.sleep || acties.sleep === tab.id) return
          e.preventDefault()
          const k = e.currentTarget.getBoundingClientRect()
          const y = (e.clientY - k.top) / k.height
          const plek = y < 0.28 ? 'voor' : y > 0.72 ? 'na' : 'in'
          if (doel !== plek) acties.setDoel({ id: tab.id, plek })
        }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget) && doel) acties.setDoel(null) }}
        onDrop={(e) => {
          e.preventDefault()
          const id = acties.sleep
          acties.setSleep(null); acties.setDoel(null)
          if (id && doel) acties.verplaatsNaar(id, tab.id, doel)
        }}
        style={{
          position: 'relative', display: 'flex', alignItems: 'center', gap: 6, minHeight: 34, borderRadius: 10, cursor: 'pointer',
          padding: `0 4px 0 ${4 + diepte * 16}px`,
          background: doel === 'in' ? 'rgba(255,255,255,0.16)' : isActief ? 'rgba(255,255,255,0.1)' : 'transparent',
          outline: doel === 'in' ? '1.5px solid #fff' : 'none', outlineOffset: -1.5,
          boxShadow: doel === 'voor' ? 'inset 0 2px 0 #fff' : doel === 'na' ? 'inset 0 -2px 0 #fff' : 'none',
          opacity: acties.sleep === tab.id ? 0.4 : 1,
        }}>
        <button type="button" onClick={(e) => { e.stopPropagation(); if (kinderen.length) wisselDicht(tab.id) }} aria-label={ingeklapt ? 'Uitklappen' : 'Inklappen'}
          style={{ width: 18, height: 18, border: 'none', background: 'transparent', padding: 0, color: ZACHT, cursor: kinderen.length ? 'pointer' : 'default', visibility: kinderen.length ? 'visible' : 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {ingeklapt ? <ChevronRight size={14} strokeWidth={2.6} /> : <ChevronDown size={14} strokeWidth={2.6} />}
        </button>
        {tab.vastgezet
          ? <Pin size={13} strokeWidth={2.4} color={isActief ? WIT : ZACHT} style={{ flexShrink: 0 }} />
          : <FileText size={14} strokeWidth={2.2} color={isActief ? WIT : ZACHT} style={{ flexShrink: 0 }} />}
        {hernoemVoor === tab.id ? (
          <input autoFocus value={naam} onChange={e => setNaam(e.target.value)} onClick={e => e.stopPropagation()} onBlur={klaarNaam}
            onKeyDown={e => { if (e.key === 'Enter') klaarNaam(); if (e.key === 'Escape') setHernoemVoor(null) }}
            style={{ flex: 1, minWidth: 0, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 6, color: WIT, fontFamily: 'inherit', fontSize: '0.84rem', fontWeight: 700, padding: '3px 6px', outline: 'none' }} />
        ) : (
          <span onDoubleClick={(e) => { e.stopPropagation(); setHernoemVoor(tab.id) }} style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.84rem', fontWeight: isActief ? 800 : 600, color: isActief ? WIT : 'rgba(255,255,255,0.72)' }}>
            {tab.titel}
          </span>
        )}
        {isActief && hernoemVoor !== tab.id && (
          <button type="button" onClick={(e) => { e.stopPropagation(); setMenuVoor(menuVoor === tab.id ? null : tab.id) }} aria-label="Tabbladopties" title="Opties"
            style={{ width: 24, height: 24, border: 'none', borderRadius: 6, background: menuVoor === tab.id ? 'rgba(255,255,255,0.12)' : 'transparent', color: WIT, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }}>
            <MoreVertical size={15} strokeWidth={2.4} />
          </button>
        )}
        {menuVoor === tab.id && (
          <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 34, right: 0, zIndex: 3, minWidth: 180, padding: 4, background: '#111', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 12, boxShadow: '0 12px 30px rgba(0,0,0,0.6)' }}>
            {[
              ['Naam wijzigen', () => { setMenuVoor(null); setHernoemVoor(tab.id) }],
              [tab.vastgezet ? 'Losmaken' : 'Vastzetten', () => { setMenuVoor(null); acties.zetVast(tab.id, !tab.vastgezet) }],
              ['Subtabblad toevoegen', () => { setMenuVoor(null); acties.nieuw(tab.id) }],
              kanIn && ['Subtabblad maken van tab erboven', () => { setMenuVoor(null); acties.springIn(tab.id) }],
              tab.parent_id && ['Niveau omhoog', () => { setMenuVoor(null); acties.springUit(tab.id) }],
              ['Omhoog', () => acties.verplaats(tab.id, -1)],
              ['Omlaag', () => acties.verplaats(tab.id, 1)],
            ].filter(Boolean).map(([t, f]) => <button key={t} type="button" onClick={f} style={menuRegel}>{t}</button>)}
            <button type="button" onClick={() => (zeker ? (setMenuVoor(null), acties.verwijder(tab.id)) : setZeker(true))} style={{ ...menuRegel, color: '#ef4444' }}>
              {zeker ? 'Zeker? Tik nog een keer' : 'Verwijderen'}
            </button>
          </div>
        )}
      </div>
      {!ingeklapt && kinderen.map(k => (
        <TabRegel key={k.id} tab={k} alle={alle} sectie={sectie} diepte={diepte + 1} actief={actief} kies={kies} dicht={dicht} wisselDicht={wisselDicht}
          menuVoor={menuVoor} setMenuVoor={setMenuVoor} hernoemVoor={hernoemVoor} setHernoemVoor={setHernoemVoor} acties={acties} />
      ))}
    </>
  )
}

// docs = useGinoDocumenten()
export default function GinoDocument({ docs, isMobile, dicht, setDicht }) {
  const { tabs } = docs
  const [actiefId, setActiefId] = useState(() => lees(TAB_SLEUTEL, null))
  const actief = tabs.find(t => t.id === actiefId) || tabs[0] || null
  const [lijstOpen, setLijstOpen] = useState(!isMobile)
  const [ingeklapt, setIngeklapt] = useState(() => lees(DICHT_SLEUTEL, []))
  const [menuVoor, setMenuVoor] = useState(null)
  const [hernoemVoor, setHernoemVoor] = useState(null)
  const [sleepTab, setSleepTab] = useState(null)
  const [doelPlek, setDoelPlek] = useState(null)
  const [bewerk, setBewerk] = useState(false)
  const [concept, setConcept] = useState('')
  const [stand, setStand] = useState(null) // null | 'bezig' | 'ok' | 'fout'
  const vak = useRef(null)
  const timer = useRef(null)
  const laatste = useRef('')
  const bewerkId = useRef(null)
  const venster = useRef(null)
  const sleep = useRef(null)
  const [plek, setPlek] = useState(() => startPlek(isMobile))
  const [maat, setMaat] = useState(() => lees(MAAT_SLEUTEL, null))

  // Na laden en bij schermwijziging terug binnen beeld.
  useEffect(() => {
    const pas = () => setPlek(p => binnenBeeld(p, venster.current))
    pas()
    window.addEventListener('resize', pas)
    return () => window.removeEventListener('resize', pas)
  }, [])

  // Formaat onthouden als je aan de hoek trekt.
  useEffect(() => {
    const el = venster.current
    if (!el || typeof ResizeObserver === 'undefined') return
    let t
    const ro = new ResizeObserver(() => {
      clearTimeout(t)
      t = setTimeout(() => {
        if (dicht || sleep.current) return
        const m = { b: el.offsetWidth, h: el.offsetHeight }
        setMaat(o => (o?.b === m.b && o?.h === m.h ? o : m))
        schrijf(MAAT_SLEUTEL, m)
      }, 300)
    })
    ro.observe(el)
    return () => { ro.disconnect(); clearTimeout(t) }
  }, [dicht])

  const pakVast = (e) => {
    if (e.button !== 0 || e.target.closest('button, input')) return
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
    setPlek(p => { schrijf(POS_SLEUTEL, p); return p })
  }

  const opslaan = useCallback(async (tekst) => {
    const id = bewerkId.current
    if (!id || tekst === laatste.current) return
    setStand('bezig')
    const ok = await docs.bewaar(id, tekst)
    if (ok) laatste.current = tekst
    setStand(ok ? 'ok' : 'fout')
  }, [docs])

  // Tijdens typen: na een korte pauze bewaren.
  useEffect(() => {
    if (!bewerk) return
    clearTimeout(timer.current)
    timer.current = setTimeout(() => opslaan(concept), 900)
    return () => clearTimeout(timer.current)
  }, [concept, bewerk, opslaan])

  const klaar = () => { clearTimeout(timer.current); opslaan(concept); setBewerk(false) }

  const start = (extra = '') => {
    if (!actief) return
    const basis = (actief.inhoud || '') + extra
    setConcept(basis)
    laatste.current = actief.inhoud || ''
    bewerkId.current = actief.id
    setBewerk(true)
    setDicht(false)
    requestAnimationFrame(() => {
      const el = vak.current
      if (!el) return
      el.focus()
      if (extra) { el.selectionStart = el.selectionEnd = basis.length; el.scrollTop = el.scrollHeight }
    })
  }

  const kies = (id) => {
    if (id !== actief?.id) {
      if (bewerk) klaar()
      setStand(null)
      setMenuVoor(null)
    }
    setActiefId(id)
    schrijf(TAB_SLEUTEL, id)
    if (isMobile) setLijstOpen(false)
  }

  const acties = {
    hernoem: docs.hernoem,
    verplaats: docs.verplaats,
    verplaatsNaar: (id, doelId, plek) => {
      // Erin gesleept: de nieuwe ouder klapt open, zodat je ziet waar hij staat.
      if (plek === 'in') setIngeklapt(l => { const n = l.filter(x => x !== doelId); schrijf(DICHT_SLEUTEL, n); return n })
      return docs.verplaatsNaar(id, doelId, plek)
    },
    springIn: docs.springIn,
    springUit: docs.springUit,
    zetVast: docs.zetVast,
    sleep: sleepTab, setSleep: setSleepTab, doel: doelPlek, setDoel: setDoelPlek,
    verwijder: async (id) => {
      if (bewerkId.current === id) { clearTimeout(timer.current); setBewerk(false) }
      await docs.verwijder(id)
    },
    nieuw: async (parent_id = null) => {
      const rij = await docs.nieuw({ parent_id })
      if (!rij) { setStand('fout'); return }
      if (parent_id) setIngeklapt(l => { const n = l.filter(x => x !== parent_id); schrijf(DICHT_SLEUTEL, n); return n })
      kies(rij.id)
      setHernoemVoor(rij.id)
    },
  }
  const wisselDicht = (id) => setIngeklapt(l => { const n = l.includes(id) ? l.filter(x => x !== id) : [...l, id]; schrijf(DICHT_SLEUTEL, n); return n })

  const tekst = actief?.inhoud || ''
  const tikBewerk = tekst.length <= TIK_BEWERK_MAX
  // Vastgezet = bovenaan als eigen boom (met subtabs); de gewone lijst toont de rest.
  const ouderVan = (t) => tabs.find(x => x.id === t.parent_id)
  const vastVoorouder = (t) => { for (let p = ouderVan(t); p; p = ouderVan(p)) if (p.vastgezet) return true; return false }
  const vast = tabs.filter(t => t.vastgezet && !vastVoorouder(t))
  const wortels = tabs.filter(t => !t.vastgezet && !ouderVan(t))

  return createPortal(
    <div ref={venster} onClick={() => setMenuVoor(null)} style={{
      position: 'fixed', left: plek.x, top: plek.y, zIndex: 59,
      width: maat?.b ? `min(${maat.b}px, calc(100vw - ${2 * RAND}px))` : `min(1040px, calc(100vw - ${2 * RAND}px))`,
      height: dicht ? 'auto' : maat?.h ? `min(${maat.h}px, calc(100dvh - ${plek.y + RAND}px))` : `min(680px, calc(100dvh - ${plek.y + RAND}px))`,
      minWidth: 300, minHeight: dicht ? 0 : 220, resize: dicht || isMobile ? 'none' : 'both', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      background: '#000', border: '3px solid #fff', borderRadius: 22, boxSizing: 'border-box', textAlign: 'left',
      boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
    }}>
      {/* Kopbalk: hieraan sleep je het document. */}
      <div onPointerDown={pakVast} onPointerMove={beweeg} onPointerUp={laatLos} onPointerCancel={laatLos}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: isMobile ? '10px 12px' : '12px 16px', borderBottom: dicht ? 'none' : '1px solid rgba(255,255,255,0.1)', cursor: 'grab', touchAction: 'none', userSelect: 'none', flexShrink: 0 }}>
        <GripVertical size={15} color="rgba(255,255,255,0.35)" style={{ flexShrink: 0, marginLeft: -4 }} />
        {!dicht && (
          <button type="button" onClick={() => setLijstOpen(o => !o)} title={lijstOpen ? 'Tabbladen verbergen' : 'Tabbladen tonen'} aria-label="Tabbladen" aria-pressed={lijstOpen}
            style={{ ...knop, background: lijstOpen ? 'rgba(255,255,255,0.12)' : knop.background }}>
            <PanelLeft size={15} strokeWidth={2.4} />
          </button>
        )}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, color: WIT }}>
          <span style={{ fontSize: '1rem', fontWeight: 900, letterSpacing: '-0.025em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{actief?.titel || 'Document'}</span>
          {stand === 'bezig' && <span style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, flexShrink: 0 }}>Opslaan…</span>}
          {stand === 'ok' && <span style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, flexShrink: 0 }}>Opgeslagen</span>}
          {stand === 'fout' && <span style={{ fontSize: '0.66rem', color: '#ef4444', fontWeight: 700, flexShrink: 0 }}>Niet opgeslagen</span>}
        </div>
        {!dicht && actief && (
          <>
            <button type="button" onClick={() => (bewerk ? setConcept(c => `${c.replace(/\s*$/, '')}\n\n## Nieuw onderdeel\n`) : start(`${tekst && !tekst.endsWith('\n') ? '\n' : ''}${tekst ? '\n' : ''}## Nieuw onderdeel\n`))} title="Onderdeel toevoegen" aria-label="Onderdeel toevoegen" style={knop}>
              <Plus size={15} strokeWidth={2.6} />
            </button>
            {bewerk
              ? <button type="button" onClick={klaar} title="Klaar" aria-label="Klaar" style={{ ...knop, background: WIT, color: '#000', border: 'none' }}><Check size={15} strokeWidth={3} /></button>
              : <button type="button" onClick={() => start()} title="Bewerken" aria-label="Bewerken" style={knop}><Pencil size={14} strokeWidth={2.6} /></button>}
          </>
        )}
        <button type="button" onClick={() => { if (bewerk) klaar(); setDicht(true) }} title="Sluiten" aria-label="Sluiten" style={knop}><X size={15} strokeWidth={2.6} /></button>
      </div>

      {!dicht && (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', position: 'relative' }}>
          {/* Tabbladen, links aan het document vast (zoals Google Docs). Op telefoon schuift hij eroverheen. */}
          {lijstOpen && (
            <div style={{
              width: isMobile ? 'min(260px, 80%)' : 240, flexShrink: 0, overflowY: 'auto', boxSizing: 'border-box', padding: '12px 8px',
              borderRight: '1px solid rgba(255,255,255,0.1)', background: '#000',
              ...(isMobile ? { position: 'absolute', inset: '0 auto 0 0', zIndex: 2, boxShadow: '12px 0 30px rgba(0,0,0,0.7)' } : null),
            }}>
              {vast.length > 0 && (
                <div style={{ marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: WIT, padding: '0 8px 8px' }}>Vastgezet</div>
                  {vast.map(t => (
                    <TabRegel key={t.id} tab={t} alle={tabs} sectie="vast" diepte={0} actief={actief?.id} kies={kies} dicht={ingeklapt} wisselDicht={wisselDicht}
                      menuVoor={menuVoor} setMenuVoor={setMenuVoor} hernoemVoor={hernoemVoor} setHernoemVoor={setHernoemVoor} acties={acties} />
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 10px 8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: WIT }}>Documenttabbladen</span>
                <button type="button" onClick={() => acties.nieuw(null)} title="Tabblad toevoegen" aria-label="Tabblad toevoegen" style={{ ...knop, width: 26, height: 26, borderRadius: 8 }}>
                  <Plus size={14} strokeWidth={2.6} />
                </button>
              </div>
              {!docs.geladen ? <div style={{ ...TEKST, color: 'rgba(255,255,255,0.35)', padding: '0 8px' }}>Laden…</div>
                : !wortels.length ? <div style={{ ...TEKST, fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)', padding: '0 8px' }}>Nog geen losse tabbladen.</div>
                : wortels.map(t => (
                  <TabRegel key={t.id} tab={t} alle={tabs} sectie="lijst" diepte={0} actief={actief?.id} kies={kies} dicht={ingeklapt} wisselDicht={wisselDicht}
                    menuVoor={menuVoor} setMenuVoor={setMenuVoor} hernoemVoor={hernoemVoor} setHernoemVoor={setHernoemVoor} acties={acties} />
                ))}
            </div>
          )}

          {/* Het document zelf. */}
          {bewerk ? (
            <textarea ref={vak} value={concept} onChange={e => setConcept(e.target.value)} onBlur={() => { clearTimeout(timer.current); opslaan(concept) }}
              spellCheck={false}
              style={{
                flex: 1, minWidth: 0, minHeight: 120, boxSizing: 'border-box', resize: 'none', border: 'none', outline: 'none',
                background: 'transparent', color: WIT, fontFamily: 'inherit', fontSize: '0.92rem', lineHeight: 1.55,
                padding: isMobile ? '12px 14px' : '20px 28px',
              }} />
          ) : (
            <div key={actief?.id || 'leeg'} onClick={tikBewerk && actief ? () => start() : undefined} title={tikBewerk && actief ? 'Tik om te bewerken' : undefined}
              style={{ flex: 1, minWidth: 0, overflowY: 'auto', cursor: tikBewerk && actief ? 'text' : 'auto', padding: isMobile ? '12px 14px 16px' : '20px 28px 24px' }}>
              {!docs.geladen ? <div style={{ ...TEKST, color: 'rgba(255,255,255,0.35)' }}>Laden…</div>
                : !actief ? (
                  <button type="button" onClick={(e) => { e.stopPropagation(); acties.nieuw(null) }} style={{ ...menuRegel, display: 'inline-flex', alignItems: 'center', gap: 8, width: 'auto', border: '1px solid rgba(255,255,255,0.15)', padding: '10px 14px' }}>
                    <Plus size={14} strokeWidth={2.6} /> Eerste tabblad maken
                  </button>
                )
                : tekst.trim() ? <Weergave tekst={tekst} />
                : <div style={{ ...TEKST, color: 'rgba(255,255,255,0.3)' }}>Leeg tabblad. Tik om te schrijven, of vraag Gino iets vast te leggen.</div>}
            </div>
          )}
        </div>
      )}
    </div>,
    document.body,
  )
}
