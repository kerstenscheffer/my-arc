// src/modules/business-os/projectKaarten.jsx
//
// Bouwstenen van het projectscherm, gedeeld door de fase-rij (GinoProjecten) en
// het testbord (TestBord): kaart, invoerveld, + Kaart, oordeelpil en cijfer.

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { BookOpen, Check, CheckCircle2, ChevronRight, Film, Phone, Plus, X } from 'lucide-react'
import { kortDag } from './testBord.js'
import { colors } from '../../ui/tokens'

const G = colors.success
const SOORT_ICOON = { content: Film, taak: CheckCircle2, call: Phone, leren: BookOpen }
const kaartMaat = (isMobile, opBord) => (isMobile || opBord ? { width: '100%' } : { width: 240, maxWidth: '100%' })

export function Cijfer({ waarde, label }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>{waarde}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{label}</div>
    </div>
  )
}

export function OordeelPil({ tekst, uitslag, title }) {
  const kleur = uitslag === 'Werkt' ? G : uitslag === 'Matig' ? '#f59e0b' : uitslag === 'Zwak' ? colors.danger : 'rgba(255,255,255,0.45)'
  return (
    <span title={title} style={{
      flexShrink: 0, padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 900, whiteSpace: 'nowrap',
      border: `1.5px solid ${kleur}`, background: uitslag === 'Werkt' ? G : 'transparent', color: uitslag === 'Werkt' ? '#000' : '#fff',
    }}>{tekst}</span>
  )
}

// Enter of klikken buiten = klaar, Escape = annuleren. onKlaar krijgt de nieuwe tekst,
// '' als een bestaande tekst is leeggemaakt, of null als er niets op te slaan valt.
export function StapInvoer({ begin = '', label, isMobile, onKlaar, fontGrootte = 14, inputMode }) {
  const [tekst, setTekst] = useState(begin)
  const veld = useRef(null)
  const afgerond = useRef(false)
  useLayoutEffect(() => {
    const el = veld.current
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [tekst])
  useEffect(() => {
    const el = veld.current
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
  }, [])
  // Na Enter of Escape verdwijnt het veld en kan er nog een blur volgen: maar één keer afronden.
  const rond = (bewaren) => {
    if (afgerond.current) return
    afgerond.current = true
    const schoon = tekst.replace(/\s+/g, ' ').trim()
    if (bewaren && !schoon && begin) onKlaar('')
    else onKlaar(bewaren && schoon && tekst !== begin ? schoon : null)
  }
  return (
    <textarea ref={veld} rows={1} value={tekst} aria-label={label} inputMode={inputMode}
      onChange={e => setTekst(e.target.value)}
      onBlur={() => rond(true)}
      onKeyDown={e => {
        if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); rond(true) }
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); rond(false) }
      }}
      style={{
        display: 'block', boxSizing: 'content-box', width: '100%', padding: 0, border: 'none', borderBottom: `1.5px solid ${G}`, outline: 'none', resize: 'none', overflow: 'hidden',
        background: 'transparent', color: '#fff', fontFamily: 'inherit', fontSize: isMobile ? Math.max(16, fontGrootte) : fontGrootte, fontWeight: 800, lineHeight: 1.3,
      }} />
  )
}

// Op het bord (opBord): volle kolombreedte, geen kader, en eventueel slepen (onSleepStart)
// en een pijltje naar de volgende kolom (onVolgende).
export function StapKaart({ s, vandaag, isMobile, oplichten, onKlaar, onTekst, onWeg, opBord = false, onVolgende, onSleepStart, onSleepEind }) {
  const [bewerkt, setBewerkt] = useState(false)
  const Icoon = SOORT_ICOON[s.soort] || CheckCircle2
  const isNu = s.dag === vandaag
  const achter = !s.klaar && s.dag && s.dag < vandaag
  const meta = [isNu ? 'vandaag' : kortDag(s.dag), s.gepland_id ? 'ingepland' : ''].filter(Boolean).join(' · ')
  const rondMarge = isMobile ? 12 : 4
  const metPijl = !!onVolgende && !bewerkt
  // Telefoon: pijltje naast het kruisje. Desktop: eronder, dus de tekst houdt zijn breedte.
  const rechts = isMobile ? (metPijl ? 76 : 40) : 28
  const sleepbaar = !!onSleepStart && !bewerkt
  return (
    <div className={opBord ? 'gp-stap gp-opbord' : 'gp-stap'} title={[s.hook && `"${s.hook}"`, s.uitleg].filter(Boolean).join('\n') || undefined}
      draggable={sleepbaar || undefined}
      onDragStart={sleepbaar ? (e) => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', s.titel || '')
        onSleepStart()
      } : undefined}
      onDragEnd={sleepbaar ? onSleepEind : undefined}
      style={{
        ...kaartMaat(isMobile, opBord), position: 'relative', boxSizing: 'border-box', display: 'flex', gap: 10, alignItems: 'flex-start', minHeight: metPijl && !isMobile ? 52 : 44, minWidth: 0,
        padding: `10px ${rechts}px 10px 10px`, borderRadius: 10, cursor: sleepbaar ? 'grab' : undefined,
        background: oplichten ? `${G}22` : isNu ? `${G}14` : opBord ? colors.surface : 'transparent',
      }}>
      <button type="button" onClick={onKlaar} aria-pressed={!!s.klaar} aria-label={s.klaar ? 'Niet klaar' : 'Klaar'} style={{
        flexShrink: 0, padding: rondMarge, margin: -rondMarge, border: 'none', background: 'none', cursor: 'pointer', display: 'flex',
      }}>
        <span style={{
          width: 20, height: 20, borderRadius: '50%', boxSizing: 'border-box',
          border: `1.5px solid ${s.klaar ? G : 'rgba(255,255,255,0.45)'}`, background: s.klaar ? G : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000',
        }}>{s.klaar && <Check size={13} strokeWidth={3.5} />}</span>
      </button>
      <div style={{ minWidth: 0, flex: 1 }}>
        {bewerkt ? (
          <StapInvoer begin={s.titel || ''} label="Stap" isMobile={isMobile}
            onKlaar={t => { setBewerkt(false); if (t) onTekst(t) }} />
        ) : (
          <button type="button" onClick={() => setBewerkt(true)} style={{
            display: 'block', width: '100%', minHeight: 18, padding: 0, border: 'none', background: 'none', cursor: 'text', textAlign: 'left', fontFamily: 'inherit',
            fontSize: 14, fontWeight: 800, lineHeight: 1.3, overflowWrap: 'anywhere', color: s.klaar ? 'rgba(255,255,255,0.5)' : '#fff', textDecoration: s.klaar ? 'line-through' : 'none',
          }}>{s.titel}</button>
        )}
        {meta && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: achter ? '#f59e0b' : isNu ? G : 'rgba(255,255,255,0.7)', marginTop: 2 }}>
            <Icoon size={12} strokeWidth={2.6} /> {meta}
          </span>
        )}
      </div>
      {!bewerkt && (
        <button type="button" className="gp-stapweg" onClick={onWeg} aria-label="Verwijderen" style={{
          position: 'absolute', top: isMobile ? 4 : 6, right: isMobile ? 4 : 6, width: isMobile ? 36 : 20, height: isMobile ? 36 : 20, padding: 0, border: 'none', borderRadius: 6,
          background: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', ...(isMobile ? { opacity: 1 } : {}),
        }}><X size={14} strokeWidth={2.8} /></button>
      )}
      {metPijl && (
        <button type="button" className="gp-stapweg" onClick={onVolgende} aria-label="Naar volgende kolom" style={{
          position: 'absolute', top: isMobile ? 4 : 26, right: isMobile ? 40 : 6, width: isMobile ? 36 : 20, height: isMobile ? 36 : 20, padding: 0, border: 'none', borderRadius: 6,
          background: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', ...(isMobile ? { opacity: 1 } : {}),
        }}><ChevronRight size={16} strokeWidth={2.8} /></button>
      )}
    </div>
  )
}

export function NieuweStap({ isMobile, onNieuw, opBord = false }) {
  const [open, setOpen] = useState(false)
  if (open) {
    return (
      <div className={opBord ? 'gp-stap gp-opbord' : 'gp-stap'} style={{ ...kaartMaat(isMobile, opBord), boxSizing: 'border-box', minHeight: 44, padding: 10, borderRadius: 10, background: opBord ? colors.surface : undefined }}>
        <StapInvoer label={opBord ? 'Nieuwe kaart' : 'Nieuwe stap'} isMobile={isMobile} onKlaar={t => { setOpen(false); if (t) onNieuw(t) }} />
      </div>
    )
  }
  if (opBord) {
    return (
      <button type="button" className="gp-bordnieuw" onClick={() => setOpen(true)} style={{
        width: '100%', minHeight: 44, display: 'inline-flex', alignItems: 'center', gap: 4, padding: 0, border: 'none',
        background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 800,
      }}><Plus size={14} strokeWidth={2.8} /> Kaart</button>
    )
  }
  return (
    <button type="button" className="gp-nieuw" onClick={() => setOpen(true)} style={{
      ...(isMobile ? { width: '100%' } : { width: 96 }), minHeight: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
      borderRadius: 10, background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 800,
    }}><Plus size={14} strokeWidth={2.8} /> Stap</button>
  )
}
